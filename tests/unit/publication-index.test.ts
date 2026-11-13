import assert from "node:assert/strict";
import { describe, test } from "node:test";

import type { Payload } from "payload";

import { findIndexPage, findIndexRefs, findIndexTerms } from "../../lib/cms/publication-index-query";
import type { HomePublicationDoc } from "../../lib/home/homepage-view";
import { PAGE_SIZE, indexHref, parsePage, readIndexQuery, type IndexQuery } from "../../lib/publications/index-params";
import {
  buildFacets,
  indexNoindex,
  orderRefs,
  planIndex,
  toIndexItem,
  toIndexRef,
  type IndexRef,
  type IndexTermDoc,
} from "../../lib/publications/index-view";

/**
 * Publication index URL contract, view model and queries (M3-05,
 * DECISIONS §2.11 P1 A–P5 A). No database, no env. The machine time zone
 * is KST (UTC+9), so WIB cases differ from both UTC and the local zone.
 */
const CREATED = "2026-01-01T00:00:00.000Z";

function ref(id: number, overrides: Partial<IndexRef> = {}): IndexRef {
  return { id, publicationType: 1, topics: [10], publishedAt: null, createdAt: CREATED, ...overrides };
}

const TYPES: IndexTermDoc[] = [
  { id: 1, slug: "zeta", name: "Zeta", isActive: true },
  { id: 2, slug: "alpha", name: "alpha", isActive: true },
  { id: 3, slug: "off", name: "Nonaktif", isActive: false },
  { id: 4, slug: "noname", name: "", isActive: true },
  { id: 5, slug: "unused", name: "Tidak dipakai", isActive: true },
  { id: 6, slug: "unset", name: "Tanpa status", isActive: null },
];

const TOPICS: IndexTermDoc[] = [
  { id: 10, slug: "zebra", name: "Zebra", isActive: true },
  { id: 11, slug: "air", name: "air", isActive: true },
  { id: 12, slug: "ekonomi", name: "Ekonomi", isActive: true },
  { id: 13, slug: "topic-off", name: "Topik nonaktif", isActive: false },
];

/** Refs that use every type and topic above except "unused" (5). */
function facetRefs(): IndexRef[] {
  return [
    ref(1, { publicationType: 1, topics: [10], publishedAt: "2090-01-05T03:00:00.000Z" }),
    ref(2, { publicationType: 2, topics: [12, 11], publishedAt: "2090-01-04T03:00:00.000Z" }),
    ref(3, { publicationType: 3, topics: [13] }),
    ref(4, { publicationType: 4, topics: [10] }),
    ref(5, { publicationType: 6, topics: [10] }),
  ];
}

function facetsOf(refs: IndexRef[], locale: "id" | "en" = "id") {
  return buildFacets(refs, TYPES, TOPICS, locale);
}

function homeDoc(overrides: Partial<HomePublicationDoc> = {}): HomePublicationDoc {
  return {
    slug: "pub",
    title: "Judul",
    summary: "Ringkasan",
    accessLevel: "public",
    publicationType: { name: "Policy Brief" },
    topics: [{ name: "Topik nonaktif" }, { name: "Topik kedua" }],
    authors: [{ displayName: "Penulis Satu" }, { displayName: "Penulis Dua" }],
    publishedAt: "2026-10-27T18:30:00.000Z",
    createdAt: "2026-10-01T00:00:00.000Z",
    ...overrides,
  };
}

type FindArgs = Record<string, unknown>;

/** A `find` that records its arguments and answers call n with `answers[n]` as docs. */
function recordingFind(answers: unknown[][]): { payload: Pick<Payload, "find">; calls: FindArgs[] } {
  const calls: FindArgs[] = [];
  const find = async (args: FindArgs) => {
    calls.push(args);
    return { docs: answers[calls.length - 1] ?? [] };
  };
  return { payload: { find } as unknown as Pick<Payload, "find">, calls };
}

const STAFF_FIELDS = ["liveOnSite", "everPublished", "translationGroup", "_status"];

/** Anonymous public read options (DEC-002, no locale fallback) and no staff field in `select`. */
function assertAnonymousRead(args: FindArgs, label: string, locale: string, withDraft: boolean): void {
  assert.equal(args.locale, locale, `${label}: locale ${locale}`);
  assert.equal(args.fallbackLocale, false, `${label}: fallbackLocale false`);
  assert.equal(args.overrideAccess, false, `${label}: overrideAccess false`);
  assert.equal("user" in args, false, `${label}: no user`);
  if (withDraft) assert.equal(args.draft, false, `${label}: draft false`);
  const selected = Object.keys((args.select ?? {}) as Record<string, unknown>);
  const staff = selected.filter((key) => STAFF_FIELDS.includes(key));
  assert.deepEqual(staff, [], `${label}: staff fields selected`);
}

describe("lib/publications/index-params.ts", () => {
  test("IXU1 readIndexQuery: first value of an array, empty value = absent, other keys dropped", () => {
    assert.deepEqual(
      readIndexQuery({ type: ["a", "b"], topic: "", year: "2090", page: "2", utm_source: "x", q: "kata", sort: "title" }),
      { type: "a", year: "2090", page: "2" },
    );
    assert.deepEqual(readIndexQuery({ type: ["", "b"], topic: [], page: "" }), {}, "first value empty -> absent");
    assert.deepEqual(readIndexQuery({}), {});
  });

  test("IXU2 parsePage: absent 1, positive integers only (no leading zero, at most 6 digits)", () => {
    assert.equal(parsePage(undefined), 1);
    assert.equal(parsePage("3"), 3);
    assert.equal(parsePage("999999"), 999999);
    for (const value of ["0", "01", "-1", "abc", "1.5", "1000000", " 2", "2 ", "1e3", "+2", ""]) {
      assert.equal(parsePage(value), null, `parsePage(${JSON.stringify(value)})`);
    }
  });

  test("IXU3 indexHref: locale prefix, fixed order type, topic, year, page; page 1 and empty values omitted", () => {
    assert.equal(indexHref("id", { year: "2090", topic: "t", type: "k" }, 2), "/id/publications?type=k&topic=t&year=2090&page=2");
    assert.equal(indexHref("id", { year: "2090", topic: "t", type: "k" }, 1), "/id/publications?type=k&topic=t&year=2090");
    assert.equal(indexHref("en", { type: "", topic: "t", year: "" }, 3), "/en/publications?topic=t&page=3");
    assert.equal(indexHref("en", {}, 1), "/en/publications");
    assert.equal(indexHref("id", {}, 2), "/id/publications?page=2");
  });
});

describe("lib/publications/index-view.ts", () => {
  test("IXU4 orderRefs: dated by publishedAt desc before undated by createdAt desc; ties by id desc in both", () => {
    const refs = [
      ref(1, { publishedAt: "2090-01-01T00:00:00.000Z" }),
      ref(2, { publishedAt: "2090-01-05T00:00:00.000Z" }),
      ref(3, { publishedAt: "2090-01-05T00:00:00.000Z" }),
      ref(4, { createdAt: "2026-01-01T00:00:00.000Z" }),
      ref(5, { createdAt: "2095-01-01T00:00:00.000Z" }),
      ref(6, { createdAt: "2026-01-01T00:00:00.000Z" }),
      ref(7, { publishedAt: "2020-01-01T00:00:00.000Z", createdAt: "2099-01-01T00:00:00.000Z" }),
    ];
    assert.deepEqual(
      orderRefs(refs).map((item) => item.id),
      [3, 2, 1, 7, 5, 6, 4],
      "an undated record created after every publishedAt still comes after the dated ones",
    );
    assert.deepEqual(refs.map((item) => item.id), [1, 2, 3, 4, 5, 6, 7], "input not mutated");
  });

  test("IXU5 facets: only active terms with a name that a visible publication uses (any topic position), collator order", () => {
    const facets = facetsOf(facetRefs());
    assert.deepEqual(facets.types, [
      { value: "alpha", label: "alpha" },
      { value: "zeta", label: "Zeta" },
    ]);
    assert.deepEqual(facets.topics, [
      { value: "air", label: "air" },
      { value: "ekonomi", label: "Ekonomi" },
      { value: "zebra", label: "Zebra" },
    ], "air (second position of ref 2) is an option; inactive topic-off is not");
    assert.equal(facets.typeIds.get("alpha"), 2);
    assert.equal(facets.topicIds.has("topic-off"), false);
    assert.deepEqual(facetsOf([]), { types: [], topics: [], years: [], typeIds: new Map(), topicIds: new Map() });
  });

  test("IXU6 years: distinct WIB years of the dated publications, newest first", () => {
    const facets = facetsOf([
      ref(1, { publishedAt: "2089-12-31T18:00:00Z" }),
      ref(2, { publishedAt: "2089-12-31T16:30:00Z" }),
      ref(3, { publishedAt: "2091-06-01T00:00:00Z" }),
      ref(4, { publishedAt: "2091-02-01T00:00:00Z" }),
      ref(5),
    ]);
    assert.deepEqual(
      facets.years,
      [
        { value: "2091", label: "2091" },
        { value: "2090", label: "2090" },
        { value: "2089", label: "2089" },
      ],
      "01:00 WIB on 1 Jan 2090 is 2090 (UTC: 2089); 23:30 WIB on 31 Dec 2089 is 2089 (KST: 2090)",
    );
  });

  test("IXU7 filters: topic in any position, type, WIB year excluding undated, combined with AND", () => {
    const refs = [
      ref(1, { publicationType: 1, topics: [12, 11], publishedAt: "2089-12-31T18:00:00Z" }),
      ref(2, { publicationType: 2, topics: [11], publishedAt: "2089-06-01T00:00:00Z" }),
      ref(3, { publicationType: 1, topics: [10] }),
      ref(4, { publicationType: 1, topics: [11], publishedAt: "2090-02-01T00:00:00Z" }),
    ];
    const facets = facetsOf(refs);
    const ids = (query: IndexQuery) => planIndex({ query, refs, facets }).pageIds;
    assert.deepEqual(ids({ topic: "air" }), [4, 1, 2], "air is the second topic of ref 1");
    assert.deepEqual(ids({ type: "zeta" }), [4, 1, 3]);
    assert.deepEqual(ids({ year: "2090" }), [4, 1], "WIB year; the undated ref 3 is excluded");
    assert.deepEqual(ids({ type: "zeta", topic: "air" }), [4, 1]);
    assert.deepEqual(ids({ type: "zeta", topic: "air", year: "2090" }), [4, 1]);
    assert.deepEqual(ids({ type: "alpha", year: "2090" }), [], "AND: alpha has no 2090 publication");
    assert.equal(planIndex({ query: { type: "alpha", year: "2090" }, refs, facets }).state, "no-results");
  });

  test("IXU8 unknown filter values give unknown-filter before any page check, without rows", () => {
    const refs = facetRefs();
    const facets = facetsOf(refs);
    const cases: [IndexQuery, string[]][] = [
      [{ type: "nope" }, ["type"]],
      [{ type: "off" }, ["type"]],
      [{ type: "unused" }, ["type"]],
      [{ type: "noname" }, ["type"]],
      [{ type: "../x" }, ["type"]],
      [{ topic: "topic-off" }, ["topic"]],
      [{ year: "1999" }, ["year"]],
      [{ year: "2090x" }, ["year"]],
      [{ type: "nope", topic: "zebra", year: "1999", page: "abc" }, ["type", "year"]],
      [{ type: "constructor" }, ["type"]],
    ];
    for (const [query, unknown] of cases) {
      const plan = planIndex({ query, refs, facets });
      assert.equal(plan.state, "unknown-filter", `state for ${JSON.stringify(query)}`);
      assert.deepEqual(plan.unknown, unknown, `unknown keys for ${JSON.stringify(query)}`);
      assert.deepEqual(plan.pageIds, [], `no rows for ${JSON.stringify(query)}`);
    }
  });

  test("IXU9 page states: page-not-found for invalid and beyond the last page; empty vs no-results; page 2 = rows 13-24", () => {
    const refs = Array.from({ length: 30 }, (_, index) =>
      ref(index + 1, { publishedAt: new Date(Date.UTC(2090, 0, index + 1)).toISOString() }),
    );
    const facets = facetsOf(refs);
    const ordered = orderRefs(refs).map((item) => item.id);
    const page2 = planIndex({ query: { page: "2" }, refs, facets });
    assert.deepEqual([page2.state, page2.total, page2.page, page2.pageCount], ["list", 30, 2, 3]);
    assert.deepEqual(page2.pageIds, ordered.slice(PAGE_SIZE, 2 * PAGE_SIZE), "page 2 = items 13-24");
    assert.equal(PAGE_SIZE, 12);
    assert.deepEqual(planIndex({ query: {}, refs, facets }).pageIds, ordered.slice(0, 12), "page 1 by default");
    assert.deepEqual(planIndex({ query: { page: "3" }, refs, facets }).pageIds, ordered.slice(24), "last page: 6 rows");
    for (const page of ["4", "99", "0", "01", "abc", "-1"]) {
      const plan = planIndex({ query: { page }, refs, facets });
      assert.equal(plan.state, "page-not-found", `page=${page}`);
      assert.deepEqual(plan.pageIds, [], `page=${page}: no rows`);
    }
    assert.equal(planIndex({ query: {}, refs: [], facets: facetsOf([]) }).state, "empty");
    assert.equal(planIndex({ query: { page: "2" }, refs: [], facets: facetsOf([]) }).state, "page-not-found", "page check before empty");
    const two = [ref(1, { publicationType: 1 }), ref(2, { publicationType: 2, topics: [11] })];
    assert.equal(planIndex({ query: { type: "zeta", topic: "air" }, refs: two, facets: facetsOf(two) }).state, "no-results");
    assert.deepEqual(
      planIndex({ query: { type: "zeta", page: "2" }, refs: two, facets: facetsOf(two) }).filters,
      { type: "zeta" },
      "filters keep the query values without page",
    );
  });

  test("IXU10 toIndexItem: dates in the page locale (WIB), inactive term labels kept, no date without publishedAt", () => {
    const id = toIndexItem(homeDoc(), "id");
    assert.deepEqual(id, {
      slug: "pub",
      title: "Judul",
      summary: "Ringkasan",
      typeName: "Policy Brief",
      topicName: "Topik nonaktif",
      authorNames: "Penulis Satu, Penulis Dua",
      accessLevel: "public",
      publishedAt: "2026-10-27T18:30:00.000Z",
      dateLabel: "28 Okt 2026",
    });
    assert.equal(toIndexItem(homeDoc(), "en").dateLabel, "28 Oct 2026", "en-GB, WIB (UTC: 27 Oct)");
    assert.equal(toIndexItem(homeDoc({ publishedAt: "2090-01-04T18:00:00Z" }), "en").dateLabel, "05 Jan 2090");
    assert.equal(toIndexItem(homeDoc({ publishedAt: "2026-05-04T03:00:00Z" }), "id").dateLabel, "04 Mei 2026");
    const undated = toIndexItem(homeDoc({ publishedAt: null }), "id");
    assert.deepEqual([undated.publishedAt, undated.dateLabel], [null, null], "createdAt is not a publication date");
    assert.deepEqual(
      toIndexRef({ id: 9, publicationType: { id: 2 }, topics: [3, { id: 4 }, null], publishedAt: "", createdAt: CREATED }),
      { id: 9, publicationType: 2, topics: [3, 4], publishedAt: null, createdAt: CREATED },
    );
  });

  test("IXU11 indexNoindex: any filter, unknown-filter, page-not-found and error are noindex; plain and ?page=2 lists are not", () => {
    assert.equal(indexNoindex({ type: "a" }, "list"), true);
    assert.equal(indexNoindex({ topic: "a" }, "no-results"), true);
    assert.equal(indexNoindex({ year: "2090" }, "list"), true);
    assert.equal(indexNoindex({}, "unknown-filter"), true);
    assert.equal(indexNoindex({ page: "99" }, "page-not-found"), true);
    assert.equal(indexNoindex({}, "error"), true);
    assert.equal(indexNoindex({}, "list"), false);
    assert.equal(indexNoindex({ page: "2" }, "list"), false);
    assert.equal(indexNoindex({}, "empty"), false);
    assert.equal(indexNoindex(readIndexQuery({ type: "", topic: "", year: "" }), "list"), false, "?type=&topic=&year=");
  });
});

describe("lib/cms/publication-index-query.ts", () => {
  test("IXU12 queries: anonymous, page locale, no fallback, scan without pagination, no call for empty ids, no staff field selected", async () => {
    const scan = recordingFind([[{ id: 1 }]]);
    await findIndexRefs(scan.payload, "en");
    assert.equal(scan.calls.length, 1);
    const [refs] = scan.calls;
    assert.equal(refs.collection, "publications");
    assert.deepEqual(refs.where, { locale: { equals: "en" } });
    assert.deepEqual(refs.select, { publicationType: true, topics: true, publishedAt: true, createdAt: true });
    assert.equal(refs.depth, 0);
    assert.equal(refs.pagination, false, "scan reads every visible record");
    assertAnonymousRead(refs, "refs", "en", true);

    const none = recordingFind([]);
    assert.deepEqual(await findIndexTerms(none.payload, "topics", "id", []), []);
    assert.deepEqual(await findIndexPage(none.payload, "id", []), []);
    assert.equal(none.calls.length, 0, "no term or page query for empty ids");

    const terms = recordingFind([[{ id: 1 }], [{ id: 2 }]]);
    await findIndexTerms(terms.payload, "publication-types", "id", [1, 2]);
    await findIndexTerms(terms.payload, "topics", "id", [3]);
    for (const [label, args, collection, ids] of [
      ["types", terms.calls[0], "publication-types", [1, 2]],
      ["topics", terms.calls[1], "topics", [3]],
    ] as const) {
      assert.equal(args?.collection, collection, `${label}: collection`);
      assert.deepEqual(args?.where, { and: [{ id: { in: ids } }, { isActive: { equals: true } }] }, `${label}: where`);
      assert.deepEqual(args?.select, { name: true, slug: true, isActive: true }, `${label}: select`);
      assert.equal(args?.pagination, false, `${label}: pagination false`);
      assertAnonymousRead(args ?? {}, label, "id", false);
    }

    const page = recordingFind([[{ id: 3 }, { id: 1 }]]);
    await findIndexPage(page.payload, "id", [1, 3]);
    const [rows] = page.calls;
    assert.equal(rows.collection, "publications");
    assert.deepEqual(rows.where, { and: [{ locale: { equals: "id" } }, { id: { in: [1, 3] } }] });
    assert.equal(rows.limit, 2);
    assert.equal(rows.depth, 1);
    assert.deepEqual(rows.populate, {
      "publication-types": { name: true },
      topics: { name: true },
      authors: { displayName: true },
    });
    assertAnonymousRead(rows, "page", "id", true);
  });
});
