import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { PgDialect } from "drizzle-orm/pg-core";

import { buildSearchSql, findSearchRanks, type SqlExecute } from "../../lib/cms/publication-search-query";
import { LOCALES } from "../../lib/i18n/locales";
import { SEARCH_MAX_LENGTH, hasFilter, indexHref, normalizeSearch, readIndexQuery } from "../../lib/publications/index-params";
import { buildFacets, compareRefs, indexNoindex, planIndex, type IndexRef, type IndexTermDoc } from "../../lib/publications/index-view";
import { SEARCH_CONFIG, searchTokens, toTsqueryText } from "../../lib/publications/search-terms";
import { publicPublicationRead } from "../../payload/access/public-read";
import { withAccounts } from "../helpers/auth-env";

/**
 * Publication index search (M3-06, DEC-013, DECISIONS §2.12 P1–P8): the `q`
 * contract, the tsquery text, the ranked plan and the SQL of the search
 * query. No database, no env: the SQL is compiled with drizzle's PgDialect
 * (the dialect of @payloadcms/db-postgres) and checked as text + params.
 */
const CREATED = "2026-01-01T00:00:00.000Z";

function ref(id: number, overrides: Partial<IndexRef> = {}): IndexRef {
  return { id, publicationType: 1, topics: [10], publishedAt: null, createdAt: CREATED, ...overrides };
}

const TYPES: IndexTermDoc[] = [
  { id: 1, slug: "riset", name: "Riset", isActive: true },
  { id: 2, slug: "brief", name: "Brief", isActive: true },
];
const TOPICS: IndexTermDoc[] = [{ id: 10, slug: "ekonomi", name: "Ekonomi", isActive: true }];

function compile(locale: "id" | "en", tsquery: string): { sql: string; params: unknown[] } {
  return new PgDialect().sqlToQuery(buildSearchSql(locale, tsquery));
}

/** Values of the parameters that `pattern` (with one `$n` group) refers to. */
function paramsOf(compiled: { sql: string; params: unknown[] }, pattern: RegExp): unknown[] {
  return [...compiled.sql.matchAll(pattern)].map((match) => compiled.params[Number(match[1]) - 1]);
}

describe("lib/publications/index-params.ts (q)", () => {
  test("SRU1 normalizeSearch/readIndexQuery: first value, NFKC, whitespace runs, 100 code points, blank = absent", () => {
    assert.equal(SEARCH_MAX_LENGTH, 100);
    assert.equal(normalizeSearch("  kebijakan \t\n  fiskal  "), "kebijakan fiskal");
    assert.equal(normalizeSearch("ｅｋｏｎｏｍｉ\u00a0ﬁskal"), "ekonomi fiskal", "fullwidth letters, NBSP and the fi ligature (NFKC)");
    assert.equal(normalizeSearch("a\u0000b\u0007c"), "a b c", "control characters separate words");
    assert.equal(normalizeSearch("x".repeat(150)), "x".repeat(100));
    const emoji = normalizeSearch(`${"a".repeat(99)}\u{1F600}b`);
    assert.equal(Array.from(emoji).length, 100, "100 code points");
    assert.equal(emoji.endsWith("\u{1F600}"), true, "the surrogate pair at position 100 is kept whole");
    assert.equal(normalizeSearch(`${"a".repeat(99)} b`), "a".repeat(99), "a space at the cut is trimmed");
    assert.equal(normalizeSearch(" \t "), "");

    assert.deepEqual(readIndexQuery({ q: ["  Ekonomi   Hijau ", "lain"] }), { q: "Ekonomi Hijau" }, "first value, normalized");
    assert.deepEqual(readIndexQuery({ q: "   " }), {}, "whitespace-only q is absent");
    assert.deepEqual(readIndexQuery({ q: ["", "x"] }), {}, "first value empty -> absent");
    assert.equal(readIndexQuery({ q: "y".repeat(101) }).q, "y".repeat(100));
    assert.deepEqual(readIndexQuery({ q: "!!!" }), { q: "!!!" }, "punctuation stays: the search finds nothing");
  });

  test("SRU2 indexHref: q first, then type, topic, year, page; empty values omitted; text URL-encoded", () => {
    assert.equal(
      indexHref("id", { year: "2090", topic: "t", type: "k", q: "kata kunci" }, 2),
      "/id/publications?q=kata+kunci&type=k&topic=t&year=2090&page=2",
    );
    assert.equal(indexHref("en", { q: "a&b=c" }, 1), "/en/publications?q=a%26b%3Dc");
    assert.equal(indexHref("id", { q: "", type: "k" }, 1), "/id/publications?type=k");
    assert.equal(indexHref("id", { q: "ekon" }, 3), "/id/publications?q=ekon&page=3");
  });

  test("SRU3 hasFilter/indexNoindex: a search text is a filter (noindex, follow); a blank one is not", () => {
    assert.equal(hasFilter({ q: "x" }), true);
    assert.equal(hasFilter({ q: "" }), false);
    assert.equal(indexNoindex({ q: "x" }, "list"), true);
    assert.equal(indexNoindex({ q: "!!!" }, "no-results"), true);
    assert.equal(indexNoindex(readIndexQuery({ q: " " }), "list"), false, "?q=%20 is the plain index");
  });
});

describe("lib/publications/search-terms.ts", () => {
  test("SRU4 tokens: letters and digits only; all words AND, prefix on the last; no word -> null", () => {
    assert.equal(toTsqueryText("a:*|b&!(c)"), "a & b & c:*", "tsquery operators only separate words");
    assert.equal(toTsqueryText("ekon"), "ekon:*");
    assert.equal(toTsqueryText("Ekonomi 2026"), "Ekonomi & 2026:*");
    assert.equal(toTsqueryText("Ünïcödé café-kopi"), "Ünïcödé & café & kopi:*");
    assert.equal(toTsqueryText("' OR 1=1 --"), "OR & 1 & 1:*");
    assert.equal(toTsqueryText("Indonesia's"), "Indonesia & s:*");
    for (const text of ["!!!", "", " ", "-- ;", "'\"<>", "\u{1F600}"]) {
      assert.equal(toTsqueryText(text), null, `toTsqueryText(${JSON.stringify(text)})`);
    }
    assert.deepEqual(searchTokens("  kebijakan,fiskal.. 2026 "), ["kebijakan", "fiskal", "2026"]);
    for (const text of ["x'); DROP TABLE publications; --", "a <-> b", "\\x00 & | ! ( ) : *", "日本 語"]) {
      const output = toTsqueryText(text) ?? "";
      assert.match(output, /^[\p{L}\p{N}]+(?: & [\p{L}\p{N}]+)*:\*$/u, `only words, " & " and the final ":*" for ${JSON.stringify(text)}`);
    }
  });

  test("SRU5 SEARCH_CONFIG: id -> indonesian, en -> english, one per locale", () => {
    assert.deepEqual(SEARCH_CONFIG, { id: "indonesian", en: "english" });
    assert.deepEqual(Object.keys(SEARCH_CONFIG).sort(), [...LOCALES].sort());
  });
});

describe("lib/publications/index-view.ts (ranked plan)", () => {
  const refs = [
    ref(1, { publishedAt: "2090-01-01T00:00:00.000Z" }),
    ref(2, { publishedAt: "2090-01-05T00:00:00.000Z", publicationType: 2 }),
    ref(3, { publishedAt: "2090-01-05T00:00:00.000Z" }),
    ref(4),
    ref(5, { publishedAt: "2089-06-01T00:00:00.000Z" }),
  ];
  const facets = buildFacets(refs, TYPES, TOPICS, "id");

  test("SRU6 planIndex with q: only ranked visible refs, rank desc, ties in M3-05 order, AND filters, fail closed", () => {
    const ranks = new Map([
      [1, 0.6],
      [2, 0.2],
      [3, 0.2],
      [4, 0.2],
      [99, 1.0],
    ]);
    const plan = planIndex({ query: { q: "kata" }, refs, facets, ranks });
    assert.deepEqual(plan.pageIds, [1, 3, 2, 4], "1 (highest rank) first; 3 before 2 (same date, higher id); undated 4 last; 99 is not visible");
    assert.deepEqual([plan.state, plan.total], ["list", 4], "total counts visible refs only");
    assert.deepEqual(plan.filters, { q: "kata" }, "filters carry q for links");
    assert.equal(compareRefs(refs[2] as IndexRef, refs[1] as IndexRef) < 0, true, "compareRefs: same date, higher id first");

    assert.deepEqual(planIndex({ query: { q: "kata", type: "brief" }, refs, facets, ranks }).pageIds, [2], "q AND type");
    assert.deepEqual(planIndex({ query: { q: "kata", year: "2090" }, refs, facets, ranks }).pageIds, [1, 3, 2], "q AND year (undated 4 out)");
    const unknown = planIndex({ query: { q: "kata", type: "nope", page: "abc" }, refs, facets, ranks });
    assert.deepEqual([unknown.state, unknown.unknown, unknown.pageIds], ["unknown-filter", ["type"], []], "unknown filter first");

    const none = planIndex({ query: { q: "kata" }, refs, facets, ranks: new Map([[99, 1]]) });
    assert.deepEqual([none.state, none.total, none.pageIds], ["no-results", 0, []], "only a hidden id matched");
    assert.equal(planIndex({ query: { q: "kata" }, refs, facets }).state, "no-results", "no ranks: nothing matches (fail closed)");
    assert.equal(planIndex({ query: { q: "kata" }, refs: [], facets: buildFacets([], TYPES, TOPICS, "id"), ranks }).state, "no-results");
    assert.deepEqual(
      planIndex({ query: {}, refs, facets, ranks: new Map([[5, 9]]) }).pageIds,
      [3, 2, 1, 5, 4],
      "without q the ranks are ignored (M3-05 order)",
    );

    const many = Array.from({ length: 13 }, (_, index) => ref(index + 1, { publishedAt: new Date(Date.UTC(2090, 0, index + 1)).toISOString() }));
    const manyFacets = buildFacets(many, TYPES, TOPICS, "id");
    const manyRanks = new Map(many.map((item) => [item.id, 0.1]));
    const page2 = planIndex({ query: { q: "kata", page: "2" }, refs: many, facets: manyFacets, ranks: manyRanks });
    assert.deepEqual([page2.state, page2.total, page2.pageCount, page2.pageIds], ["list", 13, 2, [1]], "13 matches: page 2 has the oldest");
    assert.equal(planIndex({ query: { q: "kata", page: "3" }, refs: many, facets: manyFacets, ranks: manyRanks }).state, "page-not-found");
  });
});

describe("lib/cms/publication-search-query.ts", () => {
  test("SRU7 SQL: visitor text, locale and access levels only as parameters; public filter, locale, both _locale, weights A/B/C; no versions table", async () => {
    for (const [on, levels] of [
      [false, ["public"]],
      [true, ["public", "registered"]],
    ] as const) {
      await withAccounts(on, () => {
        assert.deepEqual(
          publicPublicationRead(),
          { and: [{ _status: { equals: "published" } }, { accessLevel: { in: levels } }] },
          "the search WHERE repeats publicPublicationRead: change both together",
        );
        const compiled = compile("id", "kata");
        const match = /p\."_status" = 'published' AND p\."access_level"::text IN \(([^)]*)\)/.exec(compiled.sql.replace(/\s+/g, " "));
        assert.ok(match, `accounts ${on ? "on" : "off"}: published + access level list`);
        const params = [...match[1].matchAll(/\$(\d+)/g)].map((found) => compiled.params[Number(found[1]) - 1]);
        assert.deepEqual(params, levels, `accounts ${on ? "on" : "off"}: the levels are bound parameters, never subscriber`);
      });
    }
    const hostile = "x') OR 1=1 --";
    for (const locale of LOCALES) {
      const compiled = compile(locale, hostile);
      const text = compiled.sql.replace(/\s+/g, " ");
      assert.equal(text.includes(hostile), false, `${locale}: the tsquery text is not in the SQL`);
      assert.equal(compiled.params.includes(hostile), true, `${locale}: the tsquery text is a parameter`);
      assert.deepEqual(paramsOf(compiled, /to_tsquery\(\$(\d+)::regconfig, \$\d+\)/g), [SEARCH_CONFIG[locale]], `${locale}: to_tsquery config`);
      assert.deepEqual(
        paramsOf(compiled, /to_tsvector\(\$(\d+)::regconfig/g),
        [SEARCH_CONFIG[locale], SEARCH_CONFIG[locale], SEARCH_CONFIG[locale]],
        `${locale}: one config for title, summary and names`,
      );
      assert.deepEqual(paramsOf(compiled, /p\."locale"::text = \$(\d+)/g), [locale], `${locale}: record locale`);
      assert.deepEqual(paramsOf(compiled, /"_locale"::text = \$(\d+)/g), [locale, locale], `${locale}: topic and type names of the route locale`);
      assert.deepEqual(paramsOf(compiled, /p\."access_level"::text IN \(\$(\d+)\)/g), ["public"], `${locale}: published + public (accounts off in the unit env)`);
      assert.match(text, /p\."_status" = 'published' AND p\."access_level"::text IN /, `${locale}: published`);
      assert.equal(text.includes("subscriber"), false, `${locale}: never subscriber`);
      assert.match(text, /FROM "publications" p /, `${locale}: main table`);
      assert.equal(/_publications_v|version_/.test(text), false, `${locale}: never the versions table`);
      assert.match(text, /setweight\(to_tsvector\(\$\d+::regconfig, coalesce\(p\."title", ''\)\), 'A'\)/, `${locale}: title A`);
      assert.match(text, /setweight\(to_tsvector\(\$\d+::regconfig, coalesce\(p\."summary", ''\)\), 'B'\)/, `${locale}: summary B`);
      assert.match(text, /a\."display_name".*t\."name".*y\."name".*\)\), 'C'\)/, `${locale}: author, topic and type names C`);
      assert.match(text, /r\."path" = 'authors'.*r\."path" = 'topics'/, `${locale}: relation paths`);
      assert.match(text, /ts_rank\('\{0\.1,0\.2,0\.4,1\.0\}', d\."document", d\."query"\)/, `${locale}: weights D, C, B, A`);
      assert.match(text, /WHERE d\."document" @@ d\."query"/, `${locale}: only matching documents`);
      assert.equal(compiled.params.every((value) => typeof value === "string"), true, `${locale}: string parameters only`);
    }

    const calls: unknown[] = [];
    const execute: SqlExecute = async (query) => {
      calls.push(query);
      return {
        rows: [
          { id: 1, rank: 0.5 },
          { id: "2", rank: 0.1 },
          { id: 3, rank: Number.NaN },
          { id: 1.5, rank: 0.2 },
          { id: 2 ** 53, rank: 0.2 },
          { id: 5, rank: "0.3" },
          null,
          "row",
          { id: 4, rank: 0 },
        ],
      };
    };
    const ranks = await findSearchRanks(execute, "id", "ekon:*");
    assert.deepEqual([...ranks], [[1, 0.5], [4, 0]], "invalid ids and ranks dropped");
    assert.equal(calls.length, 1, "one query");
    assert.deepEqual(new PgDialect().sqlToQuery(calls[0] as ReturnType<typeof buildSearchSql>).params.includes("ekon:*"), true);
  });
});
