import type { PostgresAdapter } from "@payloadcms/db-postgres";
import { getTableName } from "@payloadcms/db-postgres/drizzle";
import type { Payload } from "payload";

import { LOCALES } from "../../lib/i18n/locales";

/**
 * Snapshot and restore of a Payload global (a singleton) on the shared
 * `mahira-cms` (M3-09 for `about`, generalised in M3-11 for `learning-hub`).
 * A test file that must change a global (publish, unpublish, texts)
 * snapshots it before its first write and restores it afterwards, then
 * proves equality with a second snapshot (diffGlobal must be []).
 *
 * A snapshot holds every row of every table of the global in the Payload
 * schema (`<base>`, `<base>_*`, `_<base>_v`, `_<base>_v_*`: main row,
 * locales, arrays, versions; `<base>` = the slug in snake case) as Postgres
 * JSON text (`row_to_json`), read in one read-only transaction, plus the
 * normalized Local API views of the published document and the latest
 * version in all locales. The restore replaces the rows of those tables with
 * the snapshot rows in one transaction (children deleted first, parents
 * inserted first, by the foreign keys), so content, status and the version
 * history are exactly as before, including versions Payload pruned
 * (`versions.max`) while the tests ran. Table and column names come from the
 * Payload schema and the database catalog, never from input; row values are
 * query parameters.
 *
 * Nothing here prints row values: summaries are counts and booleans only.
 */
export type GlobalSlug = "about" | "learning-hub";

export type GlobalSnapshot = {
  /** Rows per table as JSON text, sorted. */
  tables: Record<string, string[]>;
  /** Local API views (all locales), without ids and timestamps. */
  views: { published: unknown; latest: unknown };
};

type QueryResult = { rows: Record<string, unknown>[] };
type Client = { query: (text: string, values?: unknown[]) => Promise<QueryResult>; release: (destroy?: boolean) => void };

/** Table base name of a global: its slug in snake case (Payload's default table name). */
export function globalBase(slug: GlobalSlug): string {
  return slug.replaceAll("-", "_");
}

export function isGlobalTable(slug: GlobalSlug, name: string): boolean {
  const base = globalBase(slug);
  return name === base || name.startsWith(`${base}_`) || name === `_${base}_v` || name.startsWith(`_${base}_v_`);
}

/** Names of the global's tables in the Payload schema (main and version tables must exist). */
export function globalTableNames(payload: Payload, slug: GlobalSlug): string[] {
  const names = new Set<string>();
  for (const table of Object.values((payload.db as unknown as PostgresAdapter).tables)) {
    const name = getTableName(table);
    if (isGlobalTable(slug, name)) names.add(name);
  }
  const base = globalBase(slug);
  if (!names.has(base) || !names.has(`_${base}_v`)) throw new Error(`${slug} tables missing from the Payload schema`);
  return [...names].sort();
}

function identifier(name: string): string {
  return `"${name.replaceAll('"', '""')}"`;
}

async function withClient<T>(payload: Payload, work: (client: Client) => Promise<T>): Promise<T> {
  const pool = (payload.db as unknown as PostgresAdapter).pool as unknown as { connect: () => Promise<Client> };
  const client = await pool.connect();
  try {
    return await work(client);
  } finally {
    client.release();
  }
}

async function inTransaction<T>(client: Client, begin: string, work: () => Promise<T>): Promise<T> {
  await client.query(begin);
  try {
    const result = await work();
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  }
}

/**
 * A localized value of a `locale: "all"` read: an object whose keys are all
 * locale codes (`{ id: …, en: … }`). Its `id` key is the Indonesian text,
 * not a record id, so it is never dropped.
 */
function isLocaleMap(value: object): boolean {
  const keys = Object.keys(value);
  return keys.length > 0 && keys.every((key) => (LOCALES as readonly string[]).includes(key));
}

/**
 * Drops record ids (`id`: the global's, every array row's) and the
 * `createdAt`/`updatedAt` timestamps at every depth; keeps everything else,
 * the content of every locale included.
 */
export function normalizeGlobalView(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(normalizeGlobalView);
  if (value && typeof value === "object") {
    const localeMap = isLocaleMap(value);
    const out: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
      if (!localeMap && (key === "id" || key === "createdAt" || key === "updatedAt")) continue;
      out[key] = normalizeGlobalView(item);
    }
    return out;
  }
  return value;
}

async function readViews(payload: Payload, slug: GlobalSlug): Promise<GlobalSnapshot["views"]> {
  const read = (draft: boolean) => payload.findGlobal({ slug, locale: "all", fallbackLocale: false, draft, overrideAccess: true, depth: 0 });
  return { published: normalizeGlobalView(await read(false)), latest: normalizeGlobalView(await read(true)) };
}

export async function snapshotGlobal(payload: Payload, slug: GlobalSlug): Promise<GlobalSnapshot> {
  const names = globalTableNames(payload, slug);
  const tables = await withClient(payload, (client) =>
    inTransaction(client, "BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY", async () => {
      const out: Record<string, string[]> = {};
      for (const name of names) {
        const result = await client.query(`SELECT row_to_json(t)::text AS row FROM ${identifier(name)} t`);
        out[name] = result.rows.map((row) => String(row.row)).sort();
      }
      return out;
    }),
  );
  return { tables, views: await readViews(payload, slug) };
}

/** Parents before children, from the foreign keys between the given tables. */
async function insertOrder(client: Client, names: string[]): Promise<string[]> {
  const result = await client.query(
    `SELECT con.conrelid::regclass::text AS child, con.confrelid::regclass::text AS parent
       FROM pg_constraint con WHERE con.contype = 'f'`,
  );
  const set = new Set(names);
  const parents = new Map(names.map((name) => [name, new Set<string>()]));
  for (const row of result.rows) {
    const child = String(row.child);
    const parent = String(row.parent);
    if (set.has(child) && set.has(parent) && child !== parent) parents.get(child)?.add(parent);
  }
  const order: string[] = [];
  const placed = new Set<string>();
  while (order.length < names.length) {
    const next = names.filter((name) => !placed.has(name) && [...(parents.get(name) ?? [])].every((parent) => placed.has(parent)));
    if (next.length === 0) throw new Error("global tables: foreign key cycle");
    for (const name of next) {
      order.push(name);
      placed.add(name);
    }
  }
  return order;
}

/** Replaces the rows of every table of the global with the snapshot rows, in one transaction. */
export async function restoreGlobal(payload: Payload, slug: GlobalSlug, snapshot: GlobalSnapshot): Promise<void> {
  const names = Object.keys(snapshot.tables).sort();
  const schema = globalTableNames(payload, slug);
  if (JSON.stringify(names) !== JSON.stringify(schema)) throw new Error("snapshot tables differ from the schema; restore refused");
  await withClient(payload, async (client) => {
    const order = await insertOrder(client, names);
    await inTransaction(client, "BEGIN", async () => {
      for (const name of [...order].reverse()) await client.query(`DELETE FROM ${identifier(name)}`);
      for (const name of order) {
        const rows = snapshot.tables[name] ?? [];
        if (rows.length === 0) continue;
        await client.query(
          `INSERT INTO ${identifier(name)} SELECT * FROM json_populate_recordset(NULL::${identifier(name)}, $1::json)`,
          [`[${rows.join(",")}]`],
        );
      }
    });
  });
}

function diffValue(a: unknown, b: unknown, path: string, out: string[]): void {
  if (Object.is(a, b)) return;
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) out.push(`${path}.length`);
    for (let index = 0; index < Math.min(a.length, b.length); index++) diffValue(a[index], b[index], `${path}[${index}]`, out);
    return;
  }
  if (a && b && typeof a === "object" && typeof b === "object" && !Array.isArray(a) && !Array.isArray(b)) {
    const keys = new Set([...Object.keys(a as object), ...Object.keys(b as object)]);
    for (const key of [...keys].sort()) {
      diffValue((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key], `${path}.${key}`, out);
    }
    return;
  }
  out.push(path);
}

/** Paths where two snapshots differ (rows by table and position, views by key); [] when equal. Paths only, no values. */
export function diffGlobal(a: GlobalSnapshot, b: GlobalSnapshot): string[] {
  const out: string[] = [];
  diffValue(a.tables, b.tables, "tables", out);
  diffValue(a.views, b.views, "views", out);
  return out;
}

function viewFacts(view: unknown): string {
  const doc = (view && typeof view === "object" ? view : {}) as Record<string, unknown>;
  const hero = (doc.hero && typeof doc.hero === "object" ? doc.hero : {}) as Record<string, unknown>;
  const titled = Object.entries(hero)
    .filter(([, value]) => value && typeof value === "object" && typeof (value as Record<string, unknown>).title === "string")
    .map(([locale]) => locale);
  const enReady = "enReady" in doc ? ` enReady=${String(doc.enReady)}` : "";
  return `_status=${String(doc._status ?? "none")}${enReady} hero.title locales=${titled.join("+") || "none"}`;
}

/** Row counts per table and the status facts of both views; no content. */
export function summarizeGlobal(snapshot: GlobalSnapshot): string {
  const rows = Object.entries(snapshot.tables)
    .map(([name, list]) => `${name}=${list.length}`)
    .join(" ");
  return `rows: ${rows}; published: ${viewFacts(snapshot.views.published)}; latest: ${viewFacts(snapshot.views.latest)}`;
}
