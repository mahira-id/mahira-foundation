import assert from "node:assert/strict";
import { after, before, describe, test } from "node:test";
import { sql, type PostgresAdapter } from "@payloadcms/db-postgres";
import type { Payload, RequiredDataFromCollectionSlug } from "payload";

import type { Publication, PublicationType, Topic } from "../../payload/payload-types";
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
import { assertServerUp, getPage, pageFact } from "../helpers/http";
import { closeTestPayload, getTestPayload } from "../helpers/payload";
import { decodeAmp, fetchAllIndexPages, indexState, robotsContent, rowSlugs } from "../helpers/publication-pages";

/**
 * Publication index `/{locale}/publications` (M3-05, DECISIONS §2.11 P1 A–P5 A,
 * P15 A): 12 rows per page, dated (publishedAt desc) before undated
 * (createdAt desc), ties by id desc; filters type/topic/year (WIB) with AND;
 * options only for active, named terms used by visible publications; invalid
 * values and pages answer 200 with their state and `noindex, follow`.
 * Needs `next start` with the full env (bun run test:integration).
 *
 * Fixtures (slugs fixture-test-index-*, names and labels "[FIXTURE] test
 * index *"): active type `type-a` and `type-reg` (used only by a registered
 * record), active topics `topic-a`, `topic-b`, `topic-c`, inactive
 * `topic-off`; 13 dated ID records d01–d13 (d06 and d07 share publishedAt,
 * d01 is 2089-12-31T18:00Z = 2090 in WIB), 2 undated ID records u1, u2 (date
 * cleared by a raw UPDATE restricted to the fixture id and slug prefix, as in
 * homepage.test.ts), one draft, one registered, two EN records. Filtering by
 * the fixture type isolates them from other records in `mahira-cms`.
 * No user is created; the Owner guard runs before any fixture is written and
 * after cleanup.
 */
type PubData = RequiredDataFromCollectionSlug<"publications">;

const AREA = "index";
const PREFIX = areaPrefix(AREA);
const LABEL = areaLabel(AREA);
const SUMMARY_TEXT = "[FIXTURE] Ringkasan uji indeks M3-05.";
const STAFF_FIELDS = ["liveOnSite", "everPublished", "translationGroup", "_status"];

const slug = (name: string) => `${PREFIX}${name}`;
const TYPE_A = slug("type-a");
const TYPE_REG = slug("type-reg");
const TOPIC_A = slug("topic-a");
const TOPIC_B = slug("topic-b");
const TOPIC_C = slug("topic-c");
const TOPIC_OFF = slug("topic-off");

const DATED = Array.from({ length: 13 }, (_, index) => `d${String(index + 1).padStart(2, "0")}`);
/** Expected order of the type-a ID records: d13 … d01 (d07 before d06: same date, higher id), then u2, u1. */
const EXPECTED_ORDER = [...[...DATED].reverse(), "u2", "u1"].map(slug);

function datedPublishedAt(name: string): string {
  if (name === "d01") return "2089-12-31T18:00:00.000Z"; // 01:00 WIB on 1 Jan 2090
  const day = name === "d07" ? 6 : Number(name.slice(1)); // d07 = d06
  return `2090-01-${String(day).padStart(2, "0")}T03:00:00.000Z`;
}

/** Values of the options of the select `name` (the "Semua" option has value ""). */
function selectOptions(html: string, name: string): string[] {
  const match = new RegExp(`<select[^>]*\\sname="${name}"[^>]*>([\\s\\S]*?)</select>`).exec(html);
  if (!match) return [];
  return [...(match[1] as string).matchAll(/<option[^>]*\svalue="([^"]*)"/g)].map((option) => option[1] as string);
}

/** Value of the selected option of the select `name`, or null. */
function selectedOption(html: string, name: string): string | null {
  const match = new RegExp(`<select[^>]*\\sname="${name}"[^>]*>([\\s\\S]*?)</select>`).exec(html);
  if (!match) return null;
  const selected = /<option[^>]*\svalue="([^"]*)"[^>]*\sselected=""/.exec(match[1] as string);
  return selected ? (selected[1] as string) : null;
}

/** Decoded hrefs inside the pagination nav. */
function paginationHrefs(html: string): string[] {
  const nav = /<nav[^>]*aria-label="Paginasi"[^>]*>([\s\S]*?)<\/nav>/.exec(html);
  if (!nav) return [];
  return [...(nav[1] as string).matchAll(/href="([^"]+)"/g)].map((match) => decodeAmp(match[1] as string));
}

describe("publication index (M3-05 filters, pagination, URL state, noindex)", () => {
  let payload: Payload | undefined;
  let author: number | undefined;
  let types: { a: PublicationType; reg: PublicationType } | undefined;
  let topics: { a: Topic; b: Topic; c: Topic; off: Topic } | undefined;

  function p(): Payload {
    if (!payload) throw new Error("Payload not initialised (before hook failed)");
    return payload;
  }

  async function page(path: string): Promise<string> {
    const result = await getPage(path);
    assert.equal(result.status, 200, `GET ${path} ${pageFact(result)}`);
    return result.body;
  }

  // Create in `id` (inactive), add the EN name, then activate (DEC-004 hook needs both names).
  async function activeTopic(name: string, termSlug: string): Promise<Topic> {
    const term = await p().create({ collection: "topics", data: { name: `${LABEL}${name}`, slug: termSlug }, locale: "id", overrideAccess: true });
    await p().update({ collection: "topics", id: term.id, data: { name: `${LABEL}${name} EN` }, locale: "en", overrideAccess: true });
    return p().update({ collection: "topics", id: term.id, data: { isActive: true }, locale: "id", overrideAccess: true });
  }

  async function activeType(name: string, termSlug: string): Promise<PublicationType> {
    const term = await p().create({
      collection: "publication-types",
      data: { name: `${LABEL}${name}`, slug: termSlug },
      locale: "id",
      overrideAccess: true,
    });
    await p().update({ collection: "publication-types", id: term.id, data: { name: `${LABEL}${name} EN` }, locale: "en", overrideAccess: true });
    return p().update({ collection: "publication-types", id: term.id, data: { isActive: true }, locale: "id", overrideAccess: true });
  }

  async function createPub(name: string, overrides: Partial<PubData>, status: "published" | "draft" = "published"): Promise<Publication> {
    if (!types || !topics || author === undefined) throw new Error("relations not created (before hook failed)");
    const base: PubData = {
      title: `${LABEL}${name}`,
      slug: slug(name),
      locale: "id",
      translationGroup: await createGroup(p(), AREA, name),
      summary: SUMMARY_TEXT,
      publicationType: types.a.id,
      topics: [topics.a.id],
      authors: [author],
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
  async function clearPublishedAt(record: Publication): Promise<void> {
    const db = (p().db as unknown as PostgresAdapter).drizzle;
    await db.execute(
      sql`UPDATE "publications" SET "published_at" = NULL WHERE "id" = ${record.id} AND "slug" LIKE ${`${PREFIX}%`}`,
    );
    const stored = await p().findByID({ collection: "publications", id: record.id, depth: 0, overrideAccess: true });
    assert.equal(stored.publishedAt ?? null, null, `publishedAt of ${record.slug} after the UPDATE`);
  }

  before(async (t) => {
    payload = await getTestPayload();
    hookNote(t, `cleanup at start removed ${formatCounts(await cleanupArea(payload, AREA))}`);
    await assertOwnerIntact(payload);
    await assertServerUp();

    author = await firstId(p(), "authors");
    types = {
      a: await activeType("Jenis A", TYPE_A),
      reg: await activeType("Jenis Terdaftar", TYPE_REG),
    };
    topics = {
      a: await activeTopic("Topik A", TOPIC_A),
      b: await activeTopic("Topik B", TOPIC_B),
      c: await activeTopic("Topik C", TOPIC_C),
      off: await p().create({ collection: "topics", data: { name: `${LABEL}Topik Nonaktif`, slug: TOPIC_OFF }, locale: "id", overrideAccess: true }),
    };

    for (const name of DATED) {
      const overrides: Partial<PubData> = { publishedAt: datedPublishedAt(name) };
      if (name === "d03") overrides.topics = [topics.b.id, topics.a.id];
      if (name === "d04") overrides.topics = [topics.a.id, topics.off.id];
      await createPub(name, overrides);
    }
    await clearPublishedAt(await createPub("u1", { topics: [topics.a.id, topics.c.id] }));
    await clearPublishedAt(await createPub("u2", {}));
    await createPub("draft", { publishedAt: "2090-03-02T03:00:00.000Z" }, "draft");
    await createPub("registered", { publishedAt: "2090-03-01T03:00:00.000Z", accessLevel: "registered", publicationType: types.reg.id });
    await createPub("en-1", { publishedAt: "2090-02-01T03:00:00.000Z", locale: "en" });
    await createPub("en-2", { publishedAt: "2090-02-02T03:00:00.000Z", locale: "en" });
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

  test("IX1 ?type=<type-a> page 1: 200, list, 12 rows dated desc (id tie-break) then undated, count, type preselected, noindex", async () => {
    const html = await page(`/id/publications?type=${TYPE_A}`);
    assert.deepEqual(indexState(html), { state: "list", total: 15, page: 1, pages: 2, unknown: null });
    assert.deepEqual(rowSlugs(html), EXPECTED_ORDER.slice(0, 12));
    assert.equal(html.includes("15 publikasi"), true, `"15 publikasi" on the page`);
    assert.equal(selectedOption(html, "type"), TYPE_A, "type select shows the URL value");
    assert.equal(robotsContent(html), "noindex, follow");
  });

  test("IX2 page 2: the remaining rows; pagination links keep type, no empty values, page 1 without page", async () => {
    const first = await page(`/id/publications?type=${TYPE_A}`);
    assert.deepEqual(paginationHrefs(first), [`/id/publications?type=${TYPE_A}&page=2`, `/id/publications?type=${TYPE_A}&page=2`], "page 1: link to 2 and Berikutnya");
    const html = await page(`/id/publications?type=${TYPE_A}&page=2`);
    assert.deepEqual(indexState(html), { state: "list", total: 15, page: 2, pages: 2, unknown: null });
    assert.deepEqual(rowSlugs(html), EXPECTED_ORDER.slice(12), "d01, then u2, u1 (undated by createdAt desc)");
    const hrefs = paginationHrefs(html);
    assert.deepEqual(hrefs, [`/id/publications?type=${TYPE_A}`, `/id/publications?type=${TYPE_A}`], "page 2: Sebelumnya and 1");
    for (const href of [...hrefs, ...paginationHrefs(first)]) {
      assert.equal(/=&|=$/.test(href), false, `empty value in ${href}`);
      assert.equal(/[?&]page=1(&|$)/.test(href), false, `page=1 in ${href}`);
    }
    assert.equal(html.includes("Halaman 2 dari 2"), true, `"Halaman 2 dari 2" on page 2`);
  });

  test("IX3 topic matches any position; year is WIB and excludes undated; filters combine with AND", async () => {
    const byTopicA = await fetchAllIndexPages("id", `topic=${TOPIC_A}`);
    assert.deepEqual(byTopicA.slugs, EXPECTED_ORDER, "topic-a includes d03 (topic-a in second position)");
    assert.deepEqual((await fetchAllIndexPages("id", `topic=${TOPIC_B}`)).slugs, [slug("d03")]);
    const by2090 = await fetchAllIndexPages("id", `type=${TYPE_A}&year=2090`);
    assert.deepEqual(by2090.slugs, EXPECTED_ORDER.slice(0, 13), "d13 … d01 (d01 is 2090 in WIB), no undated record");
    assert.deepEqual((await fetchAllIndexPages("id", `type=${TYPE_A}&topic=${TOPIC_B}`)).slugs, [slug("d03")], "type AND topic");
    const none = await page(`/id/publications?topic=${TOPIC_C}&year=2090`);
    assert.equal(indexState(none).state, "no-results", "topic-c is used only by the undated u1");
    assert.deepEqual(rowSlugs(none), []);
    for (const text of ["0 publikasi", "Tidak ada publikasi yang cocok dengan filter ini.", "Hapus filter"]) {
      assert.equal(none.includes(text), true, `"${text}" on the no-results page`);
    }
  });

  test("IX4 options: active, named and used terms only; years of visible publications", async () => {
    const html = await page("/id/publications");
    const typeOptions = selectOptions(html, "type");
    const topicOptions = selectOptions(html, "topic");
    assert.equal(typeOptions[0], "", 'first option "Semua" has an empty value');
    assert.equal(typeOptions.includes(TYPE_A), true, `type options: ${typeOptions.join(", ")}`);
    assert.equal(typeOptions.includes(TYPE_REG), false, "type-reg is used only by a registered record");
    for (const value of [TOPIC_A, TOPIC_B, TOPIC_C]) {
      assert.equal(topicOptions.includes(value), true, `${value} in topic options: ${topicOptions.join(", ")}`);
    }
    assert.equal(topicOptions.includes(TOPIC_OFF), false, "inactive topic-off (used by d04) is not an option");
    assert.equal(selectOptions(html, "year").includes("2090"), true, "year 2090 is an option");
    assert.equal(html.includes(`${LABEL}Jenis A<`), true, "type-a label in the ID locale");
  });

  test("IX5 unknown filter values: 200, unknown-filter, Hapus filter, noindex", async () => {
    const cases: [string, string][] = [
      [`type=${slug("nope")}`, "type"],
      [`topic=${TOPIC_OFF}`, "topic"],
      ["year=1999", "year"],
      [`type=${TYPE_REG}`, "type"],
    ];
    for (const [query, key] of cases) {
      const html = await page(`/id/publications?${query}`);
      const state = indexState(html);
      assert.equal(state.state, "unknown-filter", `?${query}: state`);
      assert.equal(state.unknown, key, `?${query}: data-index-unknown`);
      assert.deepEqual(rowSlugs(html), [], `?${query}: no rows`);
      assert.equal(html.includes("Hapus filter"), true, `?${query}: "Hapus filter"`);
      assert.equal(robotsContent(html), "noindex, follow", `?${query}: robots`);
    }
    assert.equal((await page(`/id/publications?type=${slug("nope")}`)).includes("Filter tidak dikenal: Jenis."), true);
  });

  test("IX6 invalid or out-of-range page: 200, page-not-found, link to page 1, noindex", async () => {
    for (const value of ["0", "abc", "01", "99"]) {
      const html = await page(`/id/publications?type=${TYPE_A}&page=${value}`);
      assert.equal(indexState(html).state, "page-not-found", `page=${value}: state`);
      assert.deepEqual(rowSlugs(html), [], `page=${value}: no rows`);
      assert.equal(html.includes(`href="/id/publications?type=${TYPE_A}">Kembali ke halaman 1</a>`), true, `page=${value}: link to page 1`);
      assert.equal(robotsContent(html), "noindex, follow", `page=${value}: robots`);
    }
  });

  test("IX7 plain index, unknown parameters and empty filter values are indexable lists", async () => {
    for (const path of ["/id/publications", "/id/publications?utm_source=x", "/id/publications?type=&topic=&year="]) {
      const html = await page(path);
      assert.equal(indexState(html).state, "list", `${path}: state`);
      assert.equal(robotsContent(html), null, `${path}: robots meta`);
    }
  });

  test("IX8 draft, registered and EN records are never listed on /id/publications (all pages)", async () => {
    const all = await fetchAllIndexPages("id");
    const fixtures = all.slugs.filter((rowSlug) => rowSlug.startsWith(PREFIX));
    assert.deepEqual(fixtures, EXPECTED_ORDER, "the 15 public ID fixtures, in order");
    for (const name of ["draft", "registered", "en-1", "en-2"]) {
      assert.equal(all.bodies.some((body) => body.includes(slug(name))), false, `${slug(name)} on /id/publications`);
    }
  });

  test("IX9 /en/publications lists the EN fixtures with /en/publications/<slug> links and English strings", async () => {
    const html = await page(`/en/publications?type=${TYPE_A}`);
    assert.deepEqual(rowSlugs(html), [slug("en-2"), slug("en-1")]);
    for (const name of ["en-1", "en-2"]) {
      assert.equal(html.includes(`href="/en/publications/${slug(name)}"`), true, `link to /en/publications/${slug(name)}`);
    }
    for (const text of ['<html lang="en"', "Publications published in English.", "2 publications", "Filter publications", "Apply", "Public access", "02 Feb 2090", `${LABEL}Jenis A EN<`]) {
      assert.equal(html.includes(text), true, `"${text}" on /en/publications`);
    }
    const all = await fetchAllIndexPages("en");
    assert.equal(all.slugs.filter((rowSlug) => rowSlug.startsWith(PREFIX)).join(","), [slug("en-2"), slug("en-1")].join(","), "only the EN fixtures");
  });

  test("IX10 no staff or internal field names in the index HTML", async () => {
    for (const path of [`/id/publications?type=${TYPE_A}`, `/id/publications?type=${TYPE_A}&page=2`, `/en/publications?type=${TYPE_A}`, "/id/publications"]) {
      const html = await page(path);
      for (const field of STAFF_FIELDS) {
        assert.equal(html.includes(field), false, `"${field}" in the HTML of ${path}`);
      }
    }
  });
});
