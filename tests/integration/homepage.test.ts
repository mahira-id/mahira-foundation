import assert from "node:assert/strict";
import { after, before, describe, test, type TestContext } from "node:test";
import { sql, type PostgresAdapter } from "@payloadcms/db-postgres";
import type { Payload, RequiredDataFromCollectionSlug } from "payload";

import type { Publication, Topic } from "../../payload/payload-types";
import {
  areaLabel,
  areaPrefix,
  assertOwnerIntact,
  cleanupArea,
  countLeftovers,
  createGroup,
  firstId,
  formatCounts,
  hookNote,
  totalOf,
} from "../helpers/fixtures";
import { startNextServer } from "../../scripts/lib/processes";
import { BASE_URL, assertServerUp, getPage, pageFact, type JsonObject } from "../helpers/http";
import { closeTestPayload, getTestPayload } from "../helpers/payload";
import { inlineSegments } from "../helpers/publication-pages";

/**
 * Homepage `/` from CMS data (M3-04, DECISIONS §2.7): lead = newest dated
 * published + public Indonesian publication, then up to 4 more (dated before
 * undated, undated by createdAt), no registered/draft/EN record, WIB dates,
 * active topics only sorted by name, read at request time.
 * Needs `next start` with the full env (bun run test:integration).
 *
 * The 2090 dates put the fixtures ahead of every existing record. Publishing
 * always fills publishedAt (§2.4 P3 B), so the undated fixtures get their
 * date cleared by a raw UPDATE restricted to the fixture id and slug prefix.
 *
 * Fixtures: slugs fixture-test-home-*, titles, names and labels
 * "[FIXTURE] test home *". No user is created; the Owner guard runs before
 * any fixture is written and after cleanup.
 *
 * HP8 and HP9 are regression tests of the Payload init-order bug (TEST-PLAN
 * §12.5): each starts a second, fresh `next start` on TEST_PORT + 1 (no
 * build), lets GET / (HP8) or GET /admin/login (HP9) create the Payload instance,
 * and checks an anonymous empty login for REST field-error details.
 */
type PubData = RequiredDataFromCollectionSlug<"publications">;

const AREA = "home";
const PREFIX = areaPrefix(AREA);
const LABEL = areaLabel(AREA);
const SUMMARY_TEXT = "[FIXTURE] Ringkasan uji homepage M3-04.";
const TOPIC_OFF_NAME = `${LABEL}Topik Nonaktif`;

const slug = (name: string) => `${PREFIX}${name}`;

/** Port of the second, fresh server of HP8/HP9 (the shared one is BASE_URL). */
const FRESH_PORT = Number(new URL(BASE_URL).port || "3100") + 1;

/** "status=<n> name=<name> data=<yes|no> paths=<a,b>" of the first REST error. */
function firstErrorFact(status: number, body: JsonObject): string {
  const error = (Array.isArray(body.errors) ? body.errors[0] : undefined) as
    | { name?: string; data?: { errors?: { path?: string }[] } }
    | undefined;
  const paths = (error?.data?.errors ?? []).map((item) => item.path).join(",");
  return `status=${status} name=${error?.name ?? "-"} data=${error?.data ? "yes" : "no"} paths=${paths || "-"}`;
}

function matches(html: string, attribute: string): string[] {
  return [...html.matchAll(new RegExp(`${attribute}="([^"]+)"`, "g"))].map((match) => match[1] as string);
}

/** Rows of the latest list in page order, with the row's <time datetime> if any. */
function latestRows(html: string): { slug: string; dateTime?: string }[] {
  const starts = [...html.matchAll(/data-home-latest="([^"]+)"/g)];
  return starts.map((match, index) => {
    const end = starts[index + 1]?.index ?? html.length;
    const row = html.slice(match.index, end);
    const close = row.indexOf("</details>");
    const time = (close === -1 ? row : row.slice(0, close)).match(/<time[^>]*\sdatetime="([^"]+)"/i);
    return { slug: match[1] as string, dateTime: time?.[1] };
  });
}

type Fixtures = {
  topics: { a: Topic; b: Topic; off: Topic };
  pubs: Record<"new" | "old" | "undated1" | "undated2" | "registered" | "draft" | "en", Publication>;
};

describe("homepage (M3-04 / from CMS data)", () => {
  let payload: Payload | undefined;
  let relations: { publicationType: number; author: number; topic: number } | undefined;
  let fx: Fixtures | undefined;

  function p(): Payload {
    if (!payload) throw new Error("Payload not initialised (before hook failed)");
    return payload;
  }

  function f(): Fixtures {
    if (!fx) throw new Error("fixtures not created (before hook failed)");
    return fx;
  }

  async function home(): Promise<string> {
    const page = await getPage("/");
    assert.equal(page.status, 200, `GET / ${pageFact(page)}`);
    return page.body;
  }

  /** Create in `id` (inactive), add the EN name, then activate (DEC-004 hook needs both names). */
  async function activeTopic(name: string, topicSlug: string): Promise<Topic> {
    const topic = await p().create({
      collection: "topics",
      data: { name: `${LABEL}${name}`, slug: slug(topicSlug) },
      locale: "id",
      overrideAccess: true,
    });
    await p().update({ collection: "topics", id: topic.id, data: { name: `${LABEL}${name} EN` }, locale: "en", overrideAccess: true });
    return p().update({ collection: "topics", id: topic.id, data: { isActive: true }, locale: "id", overrideAccess: true });
  }

  async function createPub(name: string, overrides: Partial<PubData>, status: "published" | "draft" = "published"): Promise<Publication> {
    if (!relations) throw new Error("relations not resolved (before hook failed)");
    const base: PubData = {
      title: `${LABEL}${name}`,
      slug: slug(name),
      locale: "id",
      translationGroup: await createGroup(p(), AREA, name),
      summary: SUMMARY_TEXT,
      publicationType: relations.publicationType,
      topics: [relations.topic],
      authors: [relations.author],
      accessLevel: "public",
    };
    return p().create({
      collection: "publications",
      data: { ...base, ...overrides, _status: status },
      draft: status === "draft",
      depth: 0,
      overrideAccess: true,
    });
  }

  /** Clears published_at of one fixture record (raw SQL, fixture id and slug prefix only). */
  async function clearPublishedAt(record: Publication): Promise<Publication> {
    const db = (p().db as unknown as PostgresAdapter).drizzle;
    await db.execute(
      sql`UPDATE "publications" SET "published_at" = NULL WHERE "id" = ${record.id} AND "slug" LIKE ${`${PREFIX}%`}`,
    );
    const stored = await p().findByID({ collection: "publications", id: record.id, depth: 0, overrideAccess: true });
    assert.equal(stored.publishedAt ?? null, null, `publishedAt of ${record.slug} after the UPDATE`);
    return stored;
  }

  before(async (t) => {
    payload = await getTestPayload();
    hookNote(t, `cleanup at start removed ${formatCounts(await cleanupArea(payload, AREA))}`);
    await assertOwnerIntact(payload);
    await assertServerUp();

    // Topic B before A, so an unsorted list would not give A first by id.
    const b = await activeTopic("Topik B", "topic-b");
    const a = await activeTopic("Topik A", "topic-a");
    const off = await p().create({
      collection: "topics",
      data: { name: TOPIC_OFF_NAME, slug: slug("topic-off") },
      locale: "id",
      overrideAccess: true,
    });
    relations = {
      publicationType: await firstId(p(), "publication-types"),
      author: await firstId(p(), "authors"),
      topic: a.id,
    };

    const newest = await createPub("new", { publishedAt: "2090-01-05T03:00:00.000Z", topics: [off.id] });
    const old = await createPub("old", { publishedAt: "2090-01-01T18:30:00.000Z" });
    const undated1 = await clearPublishedAt(await createPub("undated-1", {}));
    const undated2 = await clearPublishedAt(await createPub("undated-2", {}));
    const registered = await createPub("registered", { publishedAt: "2090-02-01T03:00:00.000Z", accessLevel: "registered" });
    const draft = await createPub("draft", { publishedAt: "2090-03-01T03:00:00.000Z" }, "draft");
    const en = await createPub("en", { publishedAt: "2090-04-01T03:00:00.000Z", locale: "en" });
    fx = { topics: { a, b, off }, pubs: { new: newest, old, undated1, undated2, registered, draft, en } };
  });

  after(async (t) => {
    try {
      if (payload) {
        hookNote(t, `cleanup at end removed ${formatCounts(await cleanupArea(payload, AREA))}`);
        await assertOwnerIntact(payload);
        const left = await countLeftovers(payload, AREA);
        if (totalOf(left) !== 0) throw new Error(`fixtures left after cleanup: ${formatCounts(left)}`);
      }
    } finally {
      await closeTestPayload(payload);
    }
  });

  // Checks order properties and the relative order of this file's fixtures,
  // not fixed positions: other published + public ID records in the shared
  // database (dated or not) may share the four rows.
  test("HP1 GET /: lead = newest dated, dated rows (newest first) before undated, fixtures in order, at most 4 rows", async () => {
    const html = await home();
    const leads = matches(html, "data-home-lead");
    assert.deepEqual(leads, [slug("new")], `data-home-lead values: ${leads.join(", ")}`);
    const rows = latestRows(html);
    const fact = rows.map((row) => `${row.slug}@${row.dateTime ?? "-"}`).join(", ");
    assert.equal(rows.length >= 1 && rows.length <= 4, true, `latest rows (${rows.length}): ${fact}`);
    const firstUndated = rows.findIndex((row) => row.dateTime === undefined);
    const datedAfterUndated = firstUndated !== -1 && rows.slice(firstUndated).some((row) => row.dateTime !== undefined);
    assert.equal(datedAfterUndated, false, `dated row after an undated row: ${fact}`);
    const dated = rows.flatMap((row) => (row.dateTime === undefined ? [] : [Date.parse(row.dateTime)]));
    assert.equal(dated.every((time, index) => index === 0 || (dated[index - 1] as number) >= time), true, `dated rows not newest first: ${fact}`);
    // "old" (2090) is newer than every non-fixture record, so it is always shown.
    const expected = [slug("old"), slug("undated-2"), slug("undated-1")];
    const shown = rows.map((row) => row.slug).filter((rowSlug) => expected.includes(rowSlug));
    assert.equal(shown[0], slug("old"), `"old" not the first fixture row: ${fact}`);
    assert.deepEqual(shown, expected.slice(0, shown.length), `fixture rows out of order: ${fact}`);
  });

  test("HP2 registered, draft and EN fixtures are not on / (DEC-002, no draft, locale id only)", async () => {
    const html = await home();
    for (const name of ["registered", "draft", "en"]) {
      assert.equal(html.includes(slug(name)), false, `${slug(name)} on /`);
    }
  });

  test("HP3 WIB dates, hero year caption, fixture titles and the public access badge", async () => {
    const html = await home();
    for (const text of ["05 Jan 2090", "02 Jan 2090", "Publikasi terbaru · 2090", `${LABEL}new`, "Akses publik"]) {
      assert.equal(html.includes(text), true, `"${text}" on /`);
    }
  });

  test("HP4 Bidang kerja: active topics only, A before B, no inactive topic", async () => {
    const html = await home();
    const topics = matches(html, "data-home-topic");
    const indexA = topics.indexOf(slug("topic-a"));
    const indexB = topics.indexOf(slug("topic-b"));
    assert.equal(indexA !== -1 && indexB !== -1 && indexA < indexB, true, `data-home-topic order: ${topics.join(", ")}`);
    const inactive = await p().find({
      collection: "topics",
      where: { isActive: { not_equals: true } },
      depth: 0,
      pagination: false,
      overrideAccess: true,
    });
    const shown = inactive.docs.map((doc) => doc.slug).filter((inactiveSlug) => topics.includes(inactiveSlug));
    assert.equal(inactive.docs.some((doc) => doc.slug === slug("topic-off")), true, "topic-off is inactive");
    assert.deepEqual(shown, [], `inactive topics listed: ${shown.join(", ")}`);
  });

  test("HP5 the inactive primary topic of the lead still shows as its label (P10 A)", async () => {
    const html = await home();
    const leadStart = html.indexOf(`data-home-lead="${slug("new")}"`);
    assert.notEqual(leadStart, -1, "lead block present");
    const leadEnd = html.indexOf("</h3>", leadStart);
    assert.equal(html.slice(leadStart, leadEnd).includes(TOPIC_OFF_NAME), true, `"${TOPIC_OFF_NAME}" in the lead block`);
  });

  test("HP6 unpublishing the lead shows the next one as lead on the next request (request-time read)", async () => {
    const before = matches(await home(), "data-home-lead");
    assert.deepEqual(before, [slug("new")], `lead before: ${before.join(", ")}`);
    await p().update({
      collection: "publications",
      id: f().pubs.new.id,
      data: { _status: "draft" },
      depth: 0,
      overrideAccess: true,
    });
    const html = await home();
    const leads = matches(html, "data-home-lead");
    const latest = matches(html, "data-home-latest");
    assert.deepEqual(leads, [slug("old")], `lead after unpublish: ${leads.join(", ")}`);
    assert.equal(latest.includes(slug("new")), false, `unpublished record in the index: ${latest.join(", ")}`);
  });

  test("HP7 no staff or internal field names in the HTML of /", async () => {
    const html = await home();
    for (const field of ["liveOnSite", "everPublished", "translationGroup"]) {
      assert.equal(html.includes(field), false, `"${field}" in the HTML of /`);
    }
  });

  // M3-05 (DECISIONS §2.11 P10 A): runs after HP6, so the lead is "old";
  // the checks hold for whichever record is the lead.
  test("HP10 the lead title and each latest row link to /id/publications/<slug>; the row link is outside <summary>", async () => {
    // Streamed rows can arrive as separate segments; put them back first.
    const html = inlineSegments(await home());
    const [lead] = matches(html, "data-home-lead");
    assert.ok(lead, "a lead on /");
    const leadStart = html.indexOf(`data-home-lead="${lead}"`);
    const leadTitle = html.slice(leadStart, html.indexOf("</h3>", leadStart));
    assert.equal(leadTitle.includes(`href="/id/publications/${lead}"`), true, `lead title link to /id/publications/${lead}`);
    const rows = matches(html, "data-home-latest");
    assert.equal(rows.length >= 1, true, "latest rows on /");
    for (const row of rows) {
      const start = html.indexOf(`data-home-latest="${row}"`);
      const block = html.slice(start, html.indexOf("</details>", start));
      const summaryEnd = block.indexOf("</summary>");
      assert.notEqual(summaryEnd, -1, `${row}: </summary>`);
      assert.equal(block.slice(0, summaryEnd).includes("data-home-read"), false, `${row}: read link inside <summary>`);
      const link = new RegExp(`<a\\s[^>]*data-home-read="${row}"[^>]*>`).exec(block.slice(summaryEnd))?.[0] ?? "";
      assert.equal(link.includes(`href="/id/publications/${row}"`), true, `${row}: read link ${link || "missing"}`);
    }
    assert.equal(html.includes("Baca publikasi"), true, '"Baca publikasi" on /');
  });

  // Payload init order (fixed after M3-04; TEST-PLAN §12.5): a fresh
  // `next start` whose first request is a page or /admin must still return
  // REST ValidationErrors with their field details (`errors[0].data`).
  test("HP8 page-first Payload init (GET / first) keeps REST field-error details (errors[0].data)", async (t) => {
    // startNextServer waits for GET / = 200, so the page creates the instance.
    await assertFreshServerFieldErrors(t, "home-hp8");
  });

  test("HP9 admin-first Payload init (GET /admin/login first) keeps REST field-error details (errors[0].data)", async (t) => {
    // Since item 1c an anonymous GET /admin gets a 307 from proxy.ts and never
    // reaches Payload; /admin/login is rendered by the same admin page.
    await assertFreshServerFieldErrors(t, "home-hp9", "/admin/login");
  });
});

/**
 * Starts a second, fresh `next start` on FRESH_PORT (no build), lets
 * `warmPath` (or GET /) be its first request, then sends an anonymous empty
 * login and asserts HTTP 400 with `errors[0].data` present.
 */
async function assertFreshServerFieldErrors(t: TestContext, label: string, warmPath?: string): Promise<void> {
  const env: Record<string, string | undefined> = { ...process.env };
  delete env.NODE_TEST_CONTEXT; // the child is a server, not a test process
  const fresh = await startNextServer({ env, port: FRESH_PORT, label, warmPath });
  try {
    const response = await fetch(`http://localhost:${FRESH_PORT}/api/users/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    });
    const body = (await response.json()) as JsonObject;
    const fact = firstErrorFact(response.status, body);
    t.diagnostic(`fresh server (${warmPath ?? "/"} first), empty login: ${fact}`);
    assert.equal(response.status, 400, `empty login on the fresh server: ${fact}`);
    assert.equal(fact.includes("data=yes"), true, `errors[0].data missing after ${warmPath ?? "/"}-first init: ${fact}`);
  } finally {
    await fresh.stop();
  }
}
