import assert from "node:assert/strict";
import { after, before, describe, test } from "node:test";
import { sql, type PostgresAdapter } from "@payloadcms/db-postgres";
import type { Payload } from "payload";

import { migrations } from "../../payload/migrations/index";
import { countLeftovers, describeOwner, formatCounts, ownerIntact, ownerState, totalOf } from "../helpers/fixtures";
import { closeTestPayload, getTestPayload } from "../helpers/payload";

/**
 * Read-only invariants of the shared `mahira-cms` database (M3-10). Runs
 * last in `bun run test:integration`, so it also proves the state the other
 * files leave behind; run it alone as the preflight before any writing test.
 *
 *   I1 users = 1 and the only user is a non-fixture Admin (the Owner)
 *   I2 RLS is enabled on every table of schema `public` (DEC-007: every
 *      migration `up()` enables RLS on new tables)
 *   I3 every migration of payload/migrations/index.ts ran (local stand-in for
 *      `payload migrate:status`, DEC-007; CI has no database)
 *   I4 no `fixture-test-` record is left in any collection
 * Prints counts, booleans and table/migration names only.
 */
type Row = Record<string, unknown>;

describe("db-invariants (mahira-cms, read only)", () => {
  let payload: Payload | undefined;

  async function rows(query: ReturnType<typeof sql>): Promise<Row[]> {
    if (!payload) throw new Error("Payload not initialised");
    const db = (payload.db as unknown as PostgresAdapter).drizzle;
    return (await db.execute(query)).rows as Row[];
  }

  before(async () => {
    payload = await getTestPayload();
  });

  after(async () => {
    await closeTestPayload(payload);
  });

  test("I1 users = 1 and the only user is a non-fixture Admin", async (t) => {
    const state = await ownerState(payload as Payload);
    t.diagnostic(describeOwner(state));
    assert.equal(ownerIntact(state), true, `Owner guard: ${describeOwner(state)}`);
  });

  test("I2 RLS enabled on every public table", async (t) => {
    const tables = await rows(sql`
      SELECT c.relname AS name, c.relrowsecurity AS rls
        FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
       WHERE n.nspname = 'public' AND c.relkind = 'r'
       ORDER BY c.relname`);
    const withoutRls = tables.filter((row) => row.rls !== true).map((row) => String(row.name));
    t.diagnostic(`public tables with relrowsecurity=true: ${tables.length - withoutRls.length}/${tables.length}`);
    assert.equal(tables.length > 0, true, "no table found in schema public");
    assert.equal(withoutRls.length, 0, `tables without RLS: ${withoutRls.join(", ")}`);
  });

  test("I3 every repo migration ran (payload_migrations batch >= 1)", async (t) => {
    const applied = await rows(sql`SELECT "name", "batch" FROM "payload_migrations" ORDER BY "id"`);
    const ran = new Set(applied.filter((row) => Number(row.batch) >= 1).map((row) => String(row.name)));
    const repoNames = migrations.map((migration) => migration.name);
    const notRun = repoNames.filter((name) => !ran.has(name));
    const dbOnly = [...new Set(applied.map((row) => String(row.name)))].filter((name) => !repoNames.includes(name));
    t.diagnostic(`repo migrations ran: ${repoNames.length - notRun.length}/${repoNames.length}`);
    if (dbOnly.length > 0) t.diagnostic(`OBSERVED rows in payload_migrations not in the repo: ${dbOnly.join(", ")}`);
    assert.equal(repoNames.length > 0, true, "payload/migrations/index.ts lists no migration");
    assert.equal(notRun.length, 0, `migrations not run: ${notRun.join(", ")}`);
  });

  test("I4 no fixture-test- record left in any collection", async (t) => {
    const leftovers = await countLeftovers(payload as Payload);
    t.diagnostic(`fixture-test- records: ${formatCounts(leftovers)}`);
    assert.equal(totalOf(leftovers), 0, `fixture-test- records left: ${formatCounts(leftovers)}`);
  });
});
