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
 * never a draft, a pending draft, a `subscriber` record (a `registered` one is found since M5-03, SR12) or
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
 *
 * M3-06b (SR13–SR16): records `h-*` (type B, so outside the dravek order)
 * with a hyphen or plus before digits in the title, summary or an author
 * name ("[Zr7-4817]", "Plurvex-19", "2187-2193", "+7319", "Trevolk-552",
 * "Drovak-6620", EN "Zentrax-21") and a hyphenated word without digits
 * ("sosial-ekonomi"); words and numbers checked read-only 2026-11-25 to
 * appear in no other record of `mahira-cms`.
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
  let authors: { umum: Author; brumelak: Author; hyph: Author } | undefined;
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
    authors = {
      umum: await createAuthor("umum", "Penulis Umum"),
      brumelak: await createAuthor("brumelak", "Penulis Brumelak"),
      hyph: await createAuthor("hyph", "Penulis Drovak-6620"),
    };

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
    // M5-03: a published `registered` record is found (accounts on); type B keeps it out of the dravek (type A) order.
    await createPub("quillaro", "Terdaftar Quillaro", { accessLevel: "registered", publicationType: types.b.id, publishedAt: date("2002-08-10") });
    await createPub("snervik", "Pelanggan Snervik", { accessLevel: "subscriber", publishedAt: date("2002-09-10") });
    await createPub("e1", "Policies of Governance Tarquell", { locale: "en", topics: [topics.brumelak.id], publishedAt: date("2003-01-10") });
    // M3-06b: a hyphen or plus before digits; type B keeps these out of the dravek (type A) order.
    const typeB = { publicationType: types.b.id };
    await createPub("h-code", "[Zr7-4817] Laporan Kronvid", { ...typeB, publishedAt: date("2001-03-10") });
    await createPub("h-word", "Dampak Plurvex-19 terhadap Usaha", { ...typeB, summary: `${LABEL}Ringkasan kode Trevolk-552.`, publishedAt: date("2001-04-10") });
    await createPub("h-range", "Rencana Kerja Quendor 2187-2193", { ...typeB, authors: [authors.hyph.id], publishedAt: date("2001-05-10") });
    await createPub("h-plus", "Kode Wilayah +7319 Brivant", { ...typeB, publishedAt: date("2001-06-10") });
    await createPub("h-hword", "Kajian sosial-ekonomi Varnoth", { ...typeB, publishedAt: date("2001-07-10") });
    await createPub("h-en", "Policy Brief Zentrax-21", { ...typeB, locale: "en", publishedAt: date("2001-08-10") });
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

  test("SR12 a published registered record is found on /id (M5-03, accounts on); the subscriber one stays hidden (SR5)", async () => {
    await assertRows("id", q("quillaro"), ["quillaro"]);
    await assertRows("id", `${q("quillaro")}&type=${TYPE_B}`, ["quillaro"]);
  });

  test("SR5 never drafts, pending drafts, subscriber records, other-locale text or names (no fallback)", async () => {
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

  test("SR8 search field: the normalized q is echoed (150 chars -> 100), escaped, with a permanent label and maxlength 100", async () => {
    const echoed = inputTag((await search("id", q("  Kebijakan   Pembangunan  "))).html);
    assert.match(echoed, /\bvalue="Kebijakan Pembangunan"/, "normalized q in the input");
    assert.match(echoed, /\bmaxlength="100"/i, "maxlength 100");
    assert.match(echoed, /\btype="search"/, "type=search");
    const long = inputTag((await search("id", q("a".repeat(150)))).html);
    assert.match(long, new RegExp(`\\bvalue="a{100}"`), "150 chars echoed as 100");
    assert.doesNotMatch(long, /a{101}/, "no 101st character");
    const hostile = await search("id", q("<script>alert(1)</script>"));
    assert.match(inputTag(hostile.html), /value="&lt;script&gt;alert\(1\)&lt;\/script&gt;"/, "q escaped in the input");
    assert.equal(hostile.html.includes("<script>alert"), false, "no raw <script>alert in the page");
    assert.match(hostile.html, /<label[^>]*for="filter-q"[^>]*>Cari publikasi<\/label>/, "ID label");
    assert.match((await search("en", q("tarquell"))).html, /<label[^>]*for="filter-q"[^>]*>Search publications<\/label>/, "EN label");
    assert.match(inputTag((await search("id", "")).html), /\bname="q"/, "the field is also there without q");
    assert.match(inputTag((await search("id", "")).html), /\bvalue=""/, "empty value without q");
  });

  test("SR9 one GET form to /{locale}/publications with q before type, topic and year (URL order)", async () => {
    const { html } = await search("id", `${q("brumelak")}&type=${TYPE_A}`);
    assert.match(html, /<form[^>]*\baction="\/id\/publications"/, "form action");
    const order = ["q", "type", "topic", "year"].map((name) => html.indexOf(`name="${name}"`));
    assert.equal(order.includes(-1), false, `fields q, type, topic, year all present: ${order.join(",")}`);
    assert.deepEqual([...order].sort((a, b) => a - b), order, "DOM order = q, type, topic, year");
    assert.equal(html.includes('name="sort"'), false, "no sort control");
  });

  test("SR10 no-results copy: search wording without the term, search clear label; filters only keep the filter wording", async () => {
    const term = "zxqvbnm";
    const strip = (page: string) =>
      page
        .replace(/<script[\s\S]*?<\/script>/g, "")
        .replace(/<input\b[^>]*>/g, "")
        .toLowerCase();
    const id = await assertNoResults("id", q(term));
    assert.equal(id.html.includes("<p>Tidak ada publikasi yang cocok dengan pencarian ini.</p>"), true, "ID copy");
    assert.equal(id.html.includes("Hapus pencarian dan filter"), true, "ID clear label");
    assert.equal(id.html.includes("cocok dengan filter ini"), false, "no filter wording for a search");
    assert.equal(strip(id.html).includes(term), false, "the term is not quoted on the page");
    const en = await assertNoResults("en", q(term));
    assert.equal(en.html.includes("<p>No publications match this search.</p>"), true, "EN copy");
    assert.equal(en.html.includes("Clear search and filters"), true, "EN clear label");
    assert.equal(strip(en.html).includes(term), false, "the term is not quoted on the EN page");
    const filtered = await assertNoResults("id", `${q("brumelak")}&type=${TYPE_B}&topic=${TOPIC_BRUMELAK}`);
    assert.equal(filtered.html.includes("<p>Tidak ada publikasi yang cocok dengan pencarian ini.</p>"), true, "q + filters: search copy");
    const onlyFilters = await search("id", `type=${TYPE_B}&topic=${TOPIC_BRUMELAK}`);
    assert.equal(onlyFilters.state.state, "no-results", "filters only: state");
    assert.equal(onlyFilters.html.includes("<p>Tidak ada publikasi yang cocok dengan filter ini.</p>"), true, "filters only: filter wording");
    assert.equal(onlyFilters.html.includes("Hapus filter"), true, "filters only: filter clear label");
  });

  test("SR11 a page beyond the last keeps q: page-not-found links back to /id/publications?q=", async () => {
    const found = await search("id", `${q("brumelak")}&page=99`);
    assert.equal(found.state.state, "page-not-found", "state");
    assert.equal(robotsContent(found.html), "noindex, follow", "robots");
    assert.equal(found.html.includes('href="/id/publications?q=brumelak"'), true, "link to page 1 with q");
  });

  test("SR13 M3-06b title: a hyphen or plus before digits separates words as in q (whole, parts, digits alone, prefix)", async () => {
    for (const text of ["Zr7-4817", "[ZR7-4817]", "zr7 4817", "4817", "Zr7-48", "laporan zr7-4817 kronvid"]) {
      await assertRows("id", q(text), ["h-code"]);
    }
    for (const text of ["Plurvex-19", "plurvex 19", "Plurvex-1", "dampak plurvex-19 terhadap usaha"]) {
      await assertRows("id", q(text), ["h-word"]);
    }
    for (const text of ["2187-2193", "quendor 2193", "2187", "2187-219", "rencana kerja 2187-2193"]) {
      await assertRows("id", q(text), ["h-range"]);
    }
    for (const text of ["+7319", "7319 brivant", "kode wilayah +73"]) {
      await assertRows("id", q(text), ["h-plus"]);
    }
  });

  test("SR14 M3-06b summary (B): Trevolk-552 matches whole and in parts", async () => {
    for (const text of ["Trevolk-552", "trevolk 552", "552 trevolk"]) {
      await assertRows("id", q(text), ["h-word"]);
    }
  });

  test("SR15 M3-06b author name (C): Drovak-6620 matches whole, in parts and by its digits", async () => {
    for (const text of ["Drovak-6620", "drovak 6620", "6620"]) {
      await assertRows("id", q(text), ["h-range"]);
    }
  });

  test("SR16 M3-06b hyphenated words without digits still match; english config; locale isolation", async () => {
    for (const text of ["sosial-ekonomi varnoth", "varnoth sosial ekonomi", "varnoth sosial-ekon", "Varnoth ekonomi"]) {
      await assertRows("id", q(text), ["h-hword"]);
    }
    for (const text of ["Zentrax-21", "zentrax 21", "Zentrax-2", "policy brief zentrax-21"]) {
      await assertRows("en", q(text), ["h-en"]);
    }
    await assertNoResults("id", q("zentrax-21"));
    await assertNoResults("en", q("zr7-4817"));
  });
});

/** The search `<input>` of the index (id `filter-q`), as one tag. */
function inputTag(html: string): string {
  const tag = /<input\b[^>]*\bid="filter-q"[^>]*>/.exec(html);
  assert.ok(tag, "search input #filter-q in the page");
  return tag[0];
}
