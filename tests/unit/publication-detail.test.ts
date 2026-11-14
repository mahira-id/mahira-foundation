import assert from "node:assert/strict";
import { describe, test } from "node:test";

import type { Payload } from "payload";

import { findPublicPublication } from "../../lib/cms/publication-detail-query";
import {
  isPublicationSlug,
  summaryParagraphs,
  switcherFor,
  toPublicationDetail,
  type PublicationDetailDoc,
} from "../../lib/publications/detail-view";

/**
 * Publication detail view model and query (M3-05, DECISIONS §2.11 P7 A,
 * P8 A, P15 A). No database, no env. The machine time zone is KST (UTC+9),
 * so the WIB date differs from both UTC and the local zone.
 */
function doc(overrides: Partial<PublicationDetailDoc> = {}): PublicationDetailDoc {
  return {
    id: 7,
    slug: "pub",
    title: "Judul",
    summary: "Paragraf satu.\n\nParagraf dua.",
    accessLevel: "public",
    publicationType: { name: "Policy Brief" },
    topics: [{ name: "Topik nonaktif" }, { name: "Topik kedua" }],
    authors: [{ displayName: "Penulis Satu" }, { displayName: "Penulis Dua" }],
    // 01:30 WIB on 28 Oct 2026; 27 Oct in UTC, 28 Oct 03:30 in KST.
    publishedAt: "2026-10-27T18:30:00.000Z",
    coverImage: null,
    ...overrides,
  };
}

type FindArgs = Record<string, unknown>;

function recordingFind(docs: unknown[]): { payload: Pick<Payload, "find">; calls: FindArgs[] } {
  const calls: FindArgs[] = [];
  const find = async (args: FindArgs) => {
    calls.push(args);
    return { docs };
  };
  return { payload: { find } as unknown as Pick<Payload, "find">, calls };
}

describe("lib/publications/detail-view.ts", () => {
  test("DTU1 isPublicationSlug: lowercase letters, digits and single hyphens only", () => {
    for (const valid of ["pub", "a-b-1", "2090", "fixture-test-detail-pub"]) {
      assert.equal(isPublicationSlug(valid), true, `"${valid}" is a slug`);
    }
    for (const invalid of ["", "Pub", "PUB", "a_b", "a--b", "-a", "a-", "..", "a.b", "a/b", "a b", "é"]) {
      assert.equal(isPublicationSlug(invalid), false, `"${invalid}" is not a slug`);
    }
  });

  test("DTU2 toPublicationDetail: paragraphs on blank lines, topic order with unnamed dropped, ID/EN date in WIB, no date without publishedAt", () => {
    assert.deepEqual(summaryParagraphs("  Satu\nbaris dua.\r\n\r\n \n  Tiga.  \n\n\n"), ["Satu\nbaris dua.", "Tiga."]);
    assert.deepEqual(summaryParagraphs(null), []);

    const id = toPublicationDetail(
      doc({
        summary: "Satu.\n\n \t\nDua.",
        topics: [{ name: "Utama" }, 12, { name: "" }, { name: "  " }, { name: null }, { name: "Ketiga" }],
        authors: [{ displayName: "Penulis Satu" }, 5, { displayName: "" }],
      }),
      "id",
    );
    assert.deepEqual(id.summaryParagraphs, ["Satu.", "Dua."]);
    assert.equal(id.description, "Satu. Dua.", "description = paragraphs joined by a space");
    assert.deepEqual(id.topicNames, ["Utama", "Ketiga"], "stored order, primary first, unnamed and ids dropped");
    assert.deepEqual(id.authorNames, ["Penulis Satu"]);
    assert.equal(id.typeName, "Policy Brief");
    assert.equal(id.dateLabel, "28 Okt 2026");
    assert.equal(id.year, "2026");
    assert.equal(id.locale, "id");

    const en = toPublicationDetail(doc(), "en");
    assert.equal(en.dateLabel, "28 Oct 2026");
    assert.equal(en.publishedAt, "2026-10-27T18:30:00.000Z");

    for (const publishedAt of [null, "", undefined]) {
      const undated = toPublicationDetail(doc({ publishedAt }), "id");
      assert.equal(undated.publishedAt, null);
      assert.equal(undated.dateLabel, null);
      assert.equal(undated.year, null);
    }
    assert.equal(toPublicationDetail(doc({ publicationType: 3 }), "id").typeName, null, "unpopulated type");
  });

  test("DTU3 cover only for a populated image Media with url, width and height; else the typographic cover", () => {
    const image = { url: "https://example.invalid/cover.png", alt: "Sampul", mimeType: "image/png", width: 600, height: 800 };
    assert.deepEqual(toPublicationDetail(doc({ coverImage: image }), "id").cover, {
      url: image.url,
      alt: "Sampul",
      width: 600,
      height: 800,
    });
    assert.equal(toPublicationDetail(doc({ coverImage: { ...image, alt: null } }), "id").cover?.alt, "");
    const noCover = [
      null,
      undefined,
      42,
      { ...image, mimeType: "application/pdf" },
      { ...image, mimeType: null },
      { ...image, url: null },
      { ...image, url: "" },
      { ...image, width: null },
      { ...image, height: 0 },
    ];
    for (const coverImage of noCover) {
      assert.equal(toPublicationDetail(doc({ coverImage }), "id").cover, null, `cover for ${JSON.stringify(coverImage)}`);
    }
  });

  test("DTU4 switcherFor: the counterpart when there is one, else the other index marked unavailable", () => {
    const both = { id: "/id/publications/pub", en: "/en/publications/pub-en" };
    assert.deepEqual(switcherFor("id", both), { href: "/en/publications/pub-en", unavailable: false });
    assert.deepEqual(switcherFor("en", both), { href: "/id/publications/pub", unavailable: false });
    assert.deepEqual(switcherFor("id", {}), { href: "/en/publications", unavailable: true });
    assert.deepEqual(switcherFor("en", {}), { href: "/id/publications", unavailable: true });
    assert.deepEqual(switcherFor("id", { id: "/id/publications/pub" }), { href: "/en/publications", unavailable: true });
  });
});

describe("lib/cms/publication-detail-query.ts", () => {
  test("DTU5 findPublicPublication: anonymous, no draft, no fallback, locale + slug, limit 1, names only, no staff field", async () => {
    const found = recordingFind([{ id: 1, slug: "pub" }]);
    assert.deepEqual(await findPublicPublication(found.payload, "en", "pub"), { id: 1, slug: "pub" });
    assert.equal(found.calls.length, 1);
    const [args] = found.calls;
    assert.ok(args);
    assert.equal(args.collection, "publications");
    assert.deepEqual(args.where, { and: [{ locale: { equals: "en" } }, { slug: { equals: "pub" } }] });
    assert.equal(args.limit, 1);
    assert.equal(args.depth, 1);
    assert.equal(args.locale, "en");
    assert.equal(args.fallbackLocale, false);
    assert.equal(args.draft, false);
    assert.equal(args.overrideAccess, false);
    assert.equal("user" in args, false, "no user");
    assert.deepEqual(Object.keys(args.select as Record<string, unknown>).sort(), [
      "accessLevel",
      "authors",
      "coverImage",
      "locale",
      "publicationType",
      "publishedAt",
      "slug",
      "summary",
      "title",
      "topics",
      "translationGroup",
    ]);
    assert.deepEqual(args.populate, {
      "publication-types": { name: true },
      topics: { name: true },
      authors: { displayName: true },
    });

    const none = recordingFind([]);
    assert.equal(await findPublicPublication(none.payload, "id", "nope"), null);
  });
});
