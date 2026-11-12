import assert from "node:assert/strict";
import { describe, test } from "node:test";

import type { Payload } from "payload";

import { findActiveTopics, findHomepagePublications } from "../../lib/cms/homepage-query";
import {
  HOME_LATEST_LIMIT,
  HOME_PUBLICATION_LIMIT,
  formatPublicationDate,
  planHomepage,
  publicationYear,
  readErrorLabel,
  toHomePublication,
  toHomeTopics,
  type HomePublication,
  type HomePublicationDoc,
  type HomepageData,
} from "../../lib/home/homepage-view";

/**
 * Homepage view model (M3-04, DECISIONS §2.7). No database, no env.
 * The machine time zone is KST (UTC+9), so WIB cases differ from both UTC
 * and the local zone.
 */
function doc(overrides: Partial<HomePublicationDoc> = {}): HomePublicationDoc {
  return {
    slug: "pub",
    title: "Judul",
    summary: "Ringkasan",
    accessLevel: "public",
    publicationType: { name: "Policy Brief" },
    topics: [{ name: "Topik Utama" }, { name: "Topik Kedua" }],
    authors: [{ displayName: "Penulis Satu" }, { displayName: "Penulis Dua" }],
    publishedAt: "2026-10-27T18:30:00.000Z",
    createdAt: "2026-10-01T00:00:00.000Z",
    ...overrides,
  };
}

function pubs(count: number): HomePublication[] {
  return Array.from({ length: count }, (_, index) => toHomePublication(doc({ slug: `pub-${index + 1}` })));
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

/** Anonymous public read options (DEC-002, no draft, no locale fallback). */
function assertAnonymousRead(args: FindArgs, label: string, withDraft: boolean): void {
  assert.equal(args.locale, "id", `${label}: locale id`);
  assert.equal(args.fallbackLocale, false, `${label}: fallbackLocale false`);
  assert.equal(args.overrideAccess, false, `${label}: overrideAccess false`);
  assert.equal("user" in args, false, `${label}: no user`);
  if (withDraft) assert.equal(args.draft, false, `${label}: draft false`);
}

describe("lib/home/homepage-view.ts", () => {
  test("H1 dates are formatted in WIB (P9 A), not UTC and not the machine zone", () => {
    assert.equal(formatPublicationDate("2026-10-27T18:30:00Z"), "28 Okt 2026", "01:30 WIB on 28 Oct (UTC: 27 Oct)");
    assert.equal(formatPublicationDate("2026-10-27T15:30:00Z"), "27 Okt 2026", "22:30 WIB on 27 Oct (KST: 28 Oct)");
    assert.equal(formatPublicationDate("2026-10-28T03:00:00Z"), "28 Okt 2026");
  });

  test("H2 Indonesian short month and two-digit day; the year is the WIB year", () => {
    assert.equal(formatPublicationDate("2026-05-04"), "04 Mei 2026");
    assert.equal(formatPublicationDate("2026-08-02"), "02 Agu 2026");
    assert.equal(publicationYear("2089-12-31T18:00:00Z"), "2090", "01:00 WIB on 1 Jan 2090 (UTC: 2089)");
    assert.equal(publicationYear("2089-12-31T16:30:00Z"), "2089", "23:30 WIB on 31 Dec 2089 (KST: 2090)");
  });

  test("H3 toHomePublication: type name, primary topic = topics[0], authors joined, null for ids/empty names and without publishedAt", () => {
    assert.deepEqual(toHomePublication(doc()), {
      slug: "pub",
      title: "Judul",
      summary: "Ringkasan",
      typeName: "Policy Brief",
      topicName: "Topik Utama",
      authorNames: "Penulis Satu, Penulis Dua",
      accessLevel: "public",
      publishedAt: "2026-10-27T18:30:00.000Z",
      dateLabel: "28 Okt 2026",
      year: "2026",
    });
    const unpopulated = toHomePublication(
      doc({ publicationType: 7, topics: [3, { name: "Kedua" }], authors: [5, { displayName: null }, { displayName: "Ada" }] }),
    );
    assert.equal(unpopulated.typeName, null, "relation id -> null");
    assert.equal(unpopulated.topicName, null, "primary topic is an id -> null (not the second topic)");
    assert.equal(unpopulated.authorNames, "Ada");
    const emptyNames = toHomePublication(doc({ publicationType: { name: "" }, topics: [{ name: null }] }));
    assert.equal(emptyNames.typeName, null, "empty type name -> null");
    assert.equal(emptyNames.topicName, null, "null topic name -> null");
    const undated = toHomePublication(doc({ publishedAt: null }));
    assert.deepEqual(
      [undated.publishedAt, undated.dateLabel, undated.year],
      [null, null, null],
      "without publishedAt no date or year, even with createdAt (P4b (i))",
    );
  });

  test("H4 toHomeTopics: only active topics with an ID name, sorted with the id collator, empty description -> null", () => {
    const topics = toHomeTopics([
      { slug: "zebra", name: "Zebra", isActive: true, description: "Z" },
      { slug: "off", name: "Aktif tidak", isActive: false },
      { slug: "unset", name: "Tanpa status", isActive: null },
      { slug: "noname", name: "", isActive: true },
      { slug: "ekonomi", name: "Ekonomi", isActive: true, description: "" },
      { slug: "air", name: "air", isActive: true, description: "Tata kelola air" },
    ]);
    assert.deepEqual(topics, [
      { slug: "air", name: "air", description: "Tata kelola air" },
      { slug: "ekonomi", name: "Ekonomi", description: null },
      { slug: "zebra", name: "Zebra", description: "Z" },
    ]);
  });

  test("H5 planHomepage: off, error, empty, one, many (lead not repeated in the index)", () => {
    const topics = [{ slug: "t", name: "T", description: null }];
    assert.deepEqual(planHomepage({ status: "off" }), { notice: "empty", lead: null, latest: [], topics: [] });
    assert.deepEqual(planHomepage({ status: "error" }), { notice: "error", lead: null, latest: [], topics: [] });
    assert.deepEqual(
      planHomepage({ status: "error", topics } as unknown as HomepageData).topics,
      [],
      "an error result never shows Bidang kerja, even with topics attached (P3 A)",
    );
    assert.deepEqual(planHomepage({ status: "ok", publications: [], topics }), {
      notice: "empty",
      lead: null,
      latest: [],
      topics,
    });
    const [only] = pubs(1);
    assert.deepEqual(planHomepage({ status: "ok", publications: [only], topics }), {
      notice: null,
      lead: only,
      latest: [],
      topics,
    });
    const six = pubs(6);
    const plan = planHomepage({ status: "ok", publications: six, topics });
    assert.equal(plan.notice, null);
    assert.equal(plan.lead?.slug, "pub-1");
    assert.deepEqual(
      plan.latest.map((item) => item.slug),
      ["pub-2", "pub-3", "pub-4", "pub-5"],
    );
    assert.equal(HOME_LATEST_LIMIT, 4);
    assert.equal(HOME_PUBLICATION_LIMIT, 5);
  });

  test("H6 findHomepagePublications: dated query by -publishedAt, then undated by -createdAt for the remainder; anonymous, ID only", async () => {
    const { payload, calls } = recordingFind([[{ slug: "dated-1" }, { slug: "dated-2" }], [{ slug: "undated-1" }]]);
    const docs = await findHomepagePublications(payload);
    assert.equal(calls.length, 2, "two find calls");
    const [dated, undated] = calls;
    for (const [label, args] of [["dated", dated], ["undated", undated]] as const) {
      assert.equal(args.collection, "publications", `${label}: collection`);
      assertAnonymousRead(args, label, true);
      assert.equal(args.depth, 1, `${label}: depth 1`);
    }
    assert.deepEqual(dated.where, { and: [{ locale: { equals: "id" } }, { publishedAt: { exists: true } }] });
    assert.equal(dated.sort, "-publishedAt");
    assert.equal(dated.limit, HOME_PUBLICATION_LIMIT);
    assert.deepEqual(undated.where, { and: [{ locale: { equals: "id" } }, { publishedAt: { exists: false } }] });
    assert.equal(undated.sort, "-createdAt");
    assert.equal(undated.limit, HOME_PUBLICATION_LIMIT - 2, "undated limit = remainder");
    assert.deepEqual(
      docs.map((item) => item.slug),
      ["dated-1", "dated-2", "undated-1"],
      "dated first, then undated",
    );

    const full = recordingFind([pubs(5).map((item) => ({ slug: item.slug }))]);
    const fullDocs = await findHomepagePublications(full.payload);
    assert.equal(full.calls.length, 1, "no undated query when the dated one fills the limit");
    assert.equal(fullDocs.length, 5);
  });

  test("H7 findActiveTopics: isActive equals true, locale id, no fallback, anonymous", async () => {
    const { payload, calls } = recordingFind([[{ slug: "t" }]]);
    await findActiveTopics(payload);
    assert.equal(calls.length, 1);
    const [args] = calls;
    assert.equal(args.collection, "topics");
    assert.deepEqual(args.where, { isActive: { equals: true } });
    assertAnonymousRead(args, "topics", false);
  });

  test("H8 readErrorLabel gives the error name only, never the message (P3 A)", () => {
    const label = readErrorLabel(new Error("connect ECONNREFUSED postgres://u:p@host"));
    assert.equal(label, "Error");
    for (const fragment of ["postgres", "host", "p@"]) {
      assert.equal(label.includes(fragment), false, `label must not contain "${fragment}"`);
    }
    assert.equal(readErrorLabel(new TypeError("x")), "TypeError");
    assert.equal(readErrorLabel("postgres://u:p@host"), "UnknownError");
  });
});
