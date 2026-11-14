import assert from "node:assert/strict";
import { after, before, describe, test } from "node:test";
import type { Payload, RequiredDataFromCollectionSlug } from "payload";

import type { Author, Publication, PublicationType, Topic } from "../../payload/payload-types";
import {
  areaLabel,
  areaPrefix,
  assertOwnerIntact,
  cleanupArea,
  countLeftovers,
  createGroup,
  formatCounts,
  hookNote,
  totalOf,
} from "../helpers/fixtures";
import { assertServerUp, getPage, pageFact } from "../helpers/http";
import { closeTestPayload, getTestPayload } from "../helpers/payload";
import { indexState, robotsContent, rowSlugs, type IndexStateAttributes } from "../helpers/publication-pages";

/**
 * Search on the publication index `/{locale}/publications?q=` (M3-06,
 * DEC-013, ADR-0007, DECISIONS §2.12 P1–P8): title (A) > summary (B) >
 * author, topic and type names (C), equal ranks in the M3-05 order; the
 * route locale's text and taxonomy names only (`indonesian` / `english`
 * configuration, stemming, prefix on the last word); AND with the filters;
 * never a draft, a pending draft, a `registered`/`subscriber` record or
 * another locale's text. Needs `next start` with the full env
 * (bun run test:integration --only search).
 *
 * Fixtures (slugs fixture-test-search-*, names "[FIXTURE] test search *"):
 * types A (ID "Jenis Dravek", EN "Type Plimsor") and B; topics "umum" and
 * "brumelak" (ID "Topik Brumelak", EN "Topic Orvantis"); authors "umum" and
 * "brumelak"; synthetic words that no other record in `mahira-cms` uses
 * (checked read-only 2026-11-15), each placed once. publishedAt 2001–2003,
 * so no fixture leads `/`. No user is created; the Owner guard runs before
 * any fixture is written and after cleanup.
 */
type PubData = RequiredDataFromCollectionSlug<"publications">;

const AREA = "search";
const PREFIX = areaPrefix(AREA);
const LABEL = areaLabel(AREA);
const SUMMARY_TEXT = `${LABEL}Ringkasan uji pencarian M3-06.`;
const BRUMELAK_SUMMARY = `${LABEL}Ringkasan tentang brumelak.`;

const slug = (name: string) => `${PREFIX}${name}`;
const TYPE_A = slug("type-a");
const TYPE_B = slug("type-b");
const TOPIC_UMUM = slug("topic-umum");
const TOPIC_BRUMELAK = slug("topic-brumelak");

/** /id?q=brumelak: title (A), summary (B, newer first), then topic and author names (C, M3-05 order). */
const BRUMELAK_ORDER = ["s-title", "s-sum", "s-sum2", "s-topic", "s-author"];
/** /id?q=dravek (type A name, C everywhere): the M3-05 order, publishedAt desc. */
const DRAVEK_ORDER = ["s-topic", "s-sum", "s-author", "halvex", "s-stem", "s-title"];

/** Records the search must never show, with a title fragment that only the record has. */
const HIDDEN: { query: string; locale: "id" | "en"; record: string; text: string; why: string }[] = [
  { query: "vexmora", locale: "id", record: "vexmora", text: "Draf Vexmora", why: "never-published draft" },
  { query: "quillaro", locale: "id", record: "quillaro", text: "Terdaftar Quillaro", why: "published, registered" },
  { query: "snervik", locale: "id", record: "snervik", text: "Pelanggan Snervik", why: "published, subscriber" },
  { query: "glimmeron", locale: "id", record: "halvex", text: "Halvex Glimmeron", why: "pending draft of a live record" },
  { query: "orvantis", locale: "id", record: "s-topic", text: "Kajian empat", why: "EN topic name on an ID record" },
  { query: "plimsor", locale: "id", record: "s-title", text: "Laporan Brumelak", why: "EN type name on ID records" },
  { query: "brumelak", locale: "en", record: "e1", text: "Governance Tarquell", why: "ID topic name on an EN record (no fallback)" },
  { query: "dravek", locale: "en", record: "e1", text: "Governance Tarquell", why: "ID type name on an EN record (no fallback)" },
  { query: "tarquell", locale: "id", record: "e1", text: "Governance Tarquell", why: "EN record on /id" },
  { query: "zelvoran", locale: "en", record: "s-stem", text: "Pembangunan Zelvoran", why: "ID record on /en" },
];

type SearchPage = { html: string; state: IndexStateAttributes; slugs: string[] };

describe("publication search (M3-06 relevance, locale, filters, non-disclosure)", () => {
  let payload: Payload | undefined;
  let types: { a: PublicationType; b: PublicationType } | undefined;
  let topics: { umum: Topic; brumelak: Topic } | undefined;
  let authors: { umum: Author; brumelak: Author } | undefined;
  const records = new Map<string, Publication>();

  function p(): Payload {
    if (!payload) throw new Error("Payload not initialised (before hook failed)");
    return payload;
  }

  function pub(name: string): Publication {
    const record = records.get(name);
    if (!record) throw new Error(`fixture ${name} not created (before hook failed)`);
    return record;
  }

  /** GET /{locale}/publications?<query>: 200, state attributes and row slugs. */
  async function search(locale: "id" | "en", query: string): Promise<SearchPage> {
    const path = `/${locale}/publications?${query}`;
    const result = await getPage(path);
    assert.equal(result.status, 200, `GET ${path} ${pageFact(result)}`);
    return { html: result.body, state: indexState(result.body), slugs: rowSlugs(result.body) };
  }

  const q = (text: string) => `q=${encodeURIComponent(text)}`;

  async function assertRows(locale: "id" | "en", query: string, expected: string[]): Promise<SearchPage> {
    const found = await search(locale, query);
    assert.deepEqual(found.slugs, expected.map(slug), `/${locale}?${query}: rows`);
    assert.equal(found.state.state, "list", `/${locale}?${query}: state`);
    assert.equal(found.state.total, expected.length, `/${locale}?${query}: data-index-total`);
    assert.equal(robotsContent(found.html), "noindex, follow", `/${locale}?${query}: robots`);
    return found;
  }

  async function assertNoResults(locale: "id" | "en", query: string): Promise<SearchPage> {
    const found = await search(locale, query);
    assert.equal(found.state.state, "no-results", `/${locale}?${query}: state`);
    assert.equal(found.state.total, 0, `/${locale}?${query}: data-index-total`);
    assert.deepEqual(found.slugs, [], `/${locale}?${query}: rows`);
    assert.equal(robotsContent(found.html), "noindex, follow", `/${locale}?${query}: robots`);
    return found;
  }

  async function activeTerm(collection: "topics" | "publication-types", termSlug: string, idName: string, enName: string) {
    const term = await p().create({ collection, data: { name: `${LABEL}${idName}`, slug: termSlug }, locale: "id", overrideAccess: true });
    await p().update({ collection, id: term.id, data: { name: `${LABEL}${enName}` }, locale: "en", overrideAccess: true });
    return p().update({ collection, id: term.id, data: { isActive: true }, locale: "id", overrideAccess: true });
  }

  async function createAuthor(name: string, displayName: string): Promise<Author> {
    return p().create({ collection: "authors", data: { displayName: `${LABEL}${displayName}`, slug: slug(`author-${name}`) }, overrideAccess: true });
  }

  async function createPub(name: string, title: string, overrides: Partial<PubData>, status: "published" | "draft" = "published") {
    if (!types || !topics || !authors) throw new Error("relations not created (before hook failed)");
    const data: PubData = {
      title: `${LABEL}${title}`,
      slug: slug(name),
      locale: "id",
      translationGroup: await createGroup(p(), AREA, name),
      summary: SUMMARY_TEXT,
      publicationType: types.a.id,
      topics: [topics.umum.id],
      authors: [authors.umum.id],
      accessLevel: "public",
      ...overrides,
    };
    const record = await p().create({
      collection: "publications",
      data: { ...data, _status: status },
      draft: status === "draft",
      depth: 0,
      overrideAccess: true,
    });
    records.set(name, record);
    return record;
  }

  async function setStatus(name: string, status: "draft" | "published"): Promise<void> {
    await p().update({ collection: "publications", id: pub(name).id, data: { _status: status }, depth: 0, overrideAccess: true });
  }

  const date = (value: string) => `${value}T03:00:00.000Z`;

  before(async (t) => {
    payload = await getTestPayload();
    hookNote(t, `cleanup at start removed ${formatCounts(await cleanupArea(payload, AREA))}`);
    await assertOwnerIntact(payload);
    await assertServerUp();

    types = {
      a: await activeTerm("publication-types", TYPE_A, "Jenis Dravek", "Type Plimsor"),
      b: await activeTerm("publication-types", TYPE_B, "Jenis Lain", "Other Type"),
    };
    topics = {
      umum: await activeTerm("topics", TOPIC_UMUM, "Topik Umum", "General Topic"),
      brumelak: await activeTerm("topics", TOPIC_BRUMELAK, "Topik Brumelak", "Topic Orvantis"),
    };
    authors = { umum: await createAuthor("umum", "Penulis Umum"), brumelak: await createAuthor("brumelak", "Penulis Brumelak") };

    await createPub("s-title", "Laporan Brumelak", { publishedAt: date("2001-01-10") });
    await createPub("s-sum", "Kajian satu", { summary: BRUMELAK_SUMMARY, publishedAt: date("2003-03-10") });
    await createPub("s-sum2", "Kajian dua", { summary: BRUMELAK_SUMMARY, publicationType: types.b.id, publishedAt: date("2002-02-10") });
    await createPub("s-author", "Kajian tiga", { authors: [authors.brumelak.id], publishedAt: date("2003-02-10") });
    await createPub("s-topic", "Kajian empat", { topics: [topics.brumelak.id], publishedAt: date("2003-06-10") });
    await createPub("s-stem", "Kebijakan Pembangunan Zelvoran", { publishedAt: date("2002-05-10") });
    const halvex = await createPub("halvex", "Catatan Halvex", { publishedAt: date("2002-07-10") });
    // Pending draft revision: the stored record stays live without "glimmeron".
    await p().update({
      collection: "publications",
      id: halvex.id,
      data: { title: `${LABEL}Catatan Halvex Glimmeron` },
      draft: true,
      depth: 0,
      overrideAccess: true,
    });
    await createPub("vexmora", "Draf Vexmora", { publishedAt: date("2003-04-10") }, "draft");
    await createPub("quillaro", "Terdaftar Quillaro", { accessLevel: "registered", publishedAt: date("2002-08-10") });
    await createPub("snervik", "Pelanggan Snervik", { accessLevel: "subscriber", publishedAt: date("2002-09-10") });
    await createPub("e1", "Policies of Governance Tarquell", { locale: "en", topics: [topics.brumelak.id], publishedAt: date("2003-01-10") });
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

  test("SR1 /id?q=brumelak: title > summary > names, ties in the M3-05 order, count, noindex; prefix, case, sort ignored; type names", async () => {
    const found = await assertRows("id", q("brumelak"), BRUMELAK_ORDER);
    assert.deepEqual(found.state, { state: "list", total: 5, page: 1, pages: 1, unknown: null });
    assert.equal(found.html.includes("5 publikasi"), true, `"5 publikasi" on the page`);
    await assertRows("id", q("BRUMEL"), BRUMELAK_ORDER);
    await assertRows("id", `${q("brumelak")}&sort=title`, BRUMELAK_ORDER);
    await assertRows("id", q("dravek"), DRAVEK_ORDER);
  });

  test("SR2 /id stemming (indonesian): kebijakannya zelvoran and membangun zelvo match; zelvo kebijakan does not", async () => {
    await assertRows("id", q("kebijakannya zelvoran"), ["s-stem"]);
    await assertRows("id", q("membangun zelvo"), ["s-stem"]);
    await assertRows("id", q("ZELVORAN"), ["s-stem"]);
    await assertNoResults("id", q("zelvo kebijakan"));
  });

  test("SR3 /en (english): policy tarquell, tarq, governing tarquell, EN topic and type names match; the -> no-results", async () => {
    for (const text of ["policy tarquell", "tarq", "governing tarquell", "the tarquell", "orvantis", "plimsor"]) {
      await assertRows("en", q(text), ["e1"]);
    }
    await assertNoResults("en", q("the"));
  });

  test("SR4 q AND type, topic, year; an unknown filter value wins over q", async () => {
    await assertRows("id", `${q("brumelak")}&type=${TYPE_B}`, ["s-sum2"]);
    await assertRows("id", `${q("brumelak")}&topic=${TOPIC_BRUMELAK}`, ["s-topic"]);
    await assertRows("id", `${q("brumelak")}&year=2003`, ["s-sum", "s-topic", "s-author"]);
    await assertRows("id", `${q("brumelak")}&type=${TYPE_A}&year=2001`, ["s-title"]);
    await assertNoResults("id", `${q("zelvoran")}&type=${TYPE_B}`);
    const unknown = await search("id", `${q("brumelak")}&type=${slug("nope")}`);
    assert.deepEqual([unknown.state.state, unknown.state.unknown, unknown.slugs], ["unknown-filter", "type", []]);
  });

  test("SR5 never drafts, pending drafts, registered/subscriber records, other-locale text or names (no fallback)", async () => {
    await assertRows("id", q("halvex"), ["halvex"]);
    // Every case is checked; the assertion lists all that leak.
    const leaks: string[] = [];
    for (const hidden of HIDDEN) {
      const label = `/${hidden.locale}?q=${hidden.query} (${hidden.why})`;
      const found = await search(hidden.locale, q(hidden.query));
      if (found.state.state !== "no-results" || found.state.total !== 0 || found.slugs.length > 0) {
        leaks.push(`${label}: state=${found.state.state} total=${found.state.total} rows=${found.slugs.length}`);
      }
      if (found.html.includes(slug(hidden.record))) leaks.push(`${label}: ${slug(hidden.record)} in the HTML`);
      if (found.html.includes(hidden.text)) leaks.push(`${label}: "${hidden.text}" in the HTML`);
    }
    assert.deepEqual(leaks, [], "hidden records or other-locale text found");
  });

  test("SR6 unpublish is visible on the next request (no cached search); republish brings the record back", async () => {
    await setStatus("halvex", "draft");
    try {
      await assertNoResults("id", q("halvex"));
      await assertNoResults("id", q("glimmeron"));
    } finally {
      await setStatus("halvex", "published");
    }
    const back = await search("id", q("halvex"));
    assert.deepEqual(back.slugs, [slug("halvex")], "republished halvex is found again");
  });

  test("SR7 odd input: no words -> no-results without error; blank q is the plain index; operators are plain text; 100 code points", async () => {
    await assertNoResults("id", q("!!!"));
    const blank = await search("id", "q=%20");
    assert.equal(blank.state.state, "list", "?q=%20: state");
    assert.equal(robotsContent(blank.html), null, "?q=%20: indexable");
    for (const text of ["' OR 1=1 --", "a:*|b&!(", "x'); SELECT 1; --", "\\"]) {
      const found = await search("id", q(text));
      assert.ok(found.state.state === "list" || found.state.state === "no-results", `q=${JSON.stringify(text)}: state ${found.state.state}`);
      assert.equal(robotsContent(found.html), "noindex, follow", `q=${JSON.stringify(text)}: robots`);
    }
    await assertNoResults("id", q("brumelak:*|vexmora"));
    await assertNoResults("id", q("brumelak | quillaro"));
    // 92 + 8 code points are kept; without the cut the last word would be "brumelakvexmora".
    await assertRows("id", q(`${"!".repeat(92)}brumelakvexmora`), BRUMELAK_ORDER);
  });
});
