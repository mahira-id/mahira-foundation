import assert from "node:assert/strict";
import { afterEach, describe, test } from "node:test";

import robots from "../../app/robots";
import type { PublicationDetail } from "../../lib/publications/detail-view";
import { detailMetadata, homeMetadata, indexMetadata, robotsFor, sitemapEntries } from "../../lib/seo/metadata";
import { titleFontSize } from "../../lib/seo/og-image";
import { isProductionDeployment, OG_IMAGE_SIZE, OG_LOCALE, SITE_URL } from "../../lib/seo/site";

/**
 * SEO metadata rules (M3-07, DEC-021, DECISIONS §2.13): canonical,
 * hreflang, noindex, Open Graph/Twitter, robots and sitemap entries. Pure
 * functions; no database, no env except VERCEL_ENV for robots.
 */
const TEXT = { title: "Publikasi", description: "Publikasi yang terbit dalam Bahasa Indonesia." };

function publication(overrides: Partial<PublicationDetail> = {}): PublicationDetail {
  return {
    id: 7,
    slug: "kajian-air",
    locale: "id",
    title: "Kajian Air Bersih",
    description: "Ringkasan satu baris.",
    summaryParagraphs: ["Ringkasan satu baris."],
    typeName: null,
    topicNames: [],
    authorNames: [],
    accessLevel: "public",
    publishedAt: null,
    dateLabel: null,
    year: null,
    cover: null,
    files: [],
    ...overrides,
  };
}

/** The fields of Metadata the tests read, as plain values. */
function view(metadata: ReturnType<typeof homeMetadata>) {
  const og = (metadata.openGraph ?? {}) as Record<string, unknown>;
  const twitter = (metadata.twitter ?? {}) as Record<string, unknown>;
  const alternates = (metadata.alternates ?? {}) as { canonical?: string; languages?: Record<string, string> };
  return { og, twitter, canonical: alternates.canonical, languages: alternates.languages, robots: metadata.robots };
}

describe("SEO metadata (M3-07)", () => {
  test("SEU1 site constants: https://mahira.id, og:locale id_ID / en_GB, image 1200×630", () => {
    assert.equal(SITE_URL, "https://mahira.id");
    assert.deepEqual(OG_LOCALE, { id: "id_ID", en: "en_GB" });
    assert.deepEqual(OG_IMAGE_SIZE, { width: 1200, height: 630 });
  });

  test("SEU2 homepage: canonical /, Open Graph website id_ID with /og/site, Twitter large image, no hreflang", () => {
    const { og, twitter, canonical, languages, robots } = view(homeMetadata());
    assert.equal(canonical, "/");
    assert.equal(languages, undefined);
    assert.equal(robots, undefined);
    assert.equal(og.type, "website");
    assert.equal(og.locale, "id_ID");
    assert.equal(og.url, "/");
    assert.deepEqual(og.images, [{ url: "/og/site", width: 1200, height: 630, alt: "Mahira Indonesia Development" }]);
    assert.equal(twitter.card, "summary_large_image");
    assert.deepEqual(twitter.images, [{ url: "/og/site", alt: "Mahira Indonesia Development" }]);
  });

  test("SEU3 index page 1 (also ?page=1 and unknown params): self canonical without ?page, hreflang id ↔ en, no x-default", () => {
    for (const query of [{}, { page: "1" }]) {
      const { og, canonical, languages, robots } = view(indexMetadata("id", TEXT, query, "list"));
      assert.equal(canonical, "/id/publications", JSON.stringify(query));
      assert.deepEqual(languages, { id: "/id/publications", en: "/en/publications" });
      assert.equal(robots, undefined);
      assert.equal(og.url, "/id/publications");
      assert.equal(og.locale, "id_ID");
      assert.deepEqual(og.images, [{ url: "/og/id/publications", width: 1200, height: 630, alt: "Publikasi — Mahira Indonesia Development" }]);
    }
    const english = view(indexMetadata("en", { title: "Publications", description: "x" }, {}, "empty"));
    assert.equal(english.canonical, "/en/publications", "empty state stays indexable");
    assert.equal(english.og.locale, "en_GB");
    assert.equal("x-default" in (english.languages ?? {}), false);
  });

  test("SEU4 index ?page=2 without filters: canonical ?page=2, no hreflang", () => {
    const { og, canonical, languages, robots } = view(indexMetadata("id", TEXT, { page: "2" }, "list"));
    assert.equal(canonical, "/id/publications?page=2");
    assert.equal(languages, undefined);
    assert.equal(robots, undefined);
    assert.equal(og.url, "/id/publications?page=2");
  });

  test("SEU5 index with q or any filter, or an invalid/failed state: noindex, follow, no canonical, no hreflang, OG on the base URL", () => {
    const cases: Array<[Record<string, string>, Parameters<typeof indexMetadata>[3]]> = [
      [{ q: "air" }, "list"],
      [{ type: "policy-brief" }, "list"],
      [{ topic: "air" }, "no-results"],
      [{ year: "2026", page: "2" }, "list"],
      [{ type: "nope" }, "unknown-filter"],
      [{ page: "99" }, "page-not-found"],
      [{}, "error"],
    ];
    for (const [query, state] of cases) {
      const label = `${JSON.stringify(query)} ${state}`;
      const { og, twitter, canonical, languages, robots } = view(indexMetadata("id", TEXT, query, state));
      assert.deepEqual(robots, { index: false, follow: true }, label);
      assert.equal(canonical, undefined, label);
      assert.equal(languages, undefined, label);
      assert.equal(og.url, "/id/publications", label);
      assert.equal(twitter.card, "summary_large_image", label);
    }
  });

  test("SEU6 detail without counterpart: self canonical, no hreflang, article, generated image", () => {
    const metadata = detailMetadata(publication(), {});
    const { og, twitter, canonical, languages } = view(metadata);
    assert.equal(metadata.title, "Kajian Air Bersih");
    assert.equal(metadata.description, "Ringkasan satu baris.");
    assert.equal(canonical, "/id/publications/kajian-air");
    assert.equal(languages, undefined);
    assert.equal(og.type, "article");
    assert.equal(og.locale, "id_ID");
    assert.equal(og.url, "/id/publications/kajian-air");
    assert.equal(og.title, "Kajian Air Bersih");
    assert.deepEqual(og.images, [{ url: "/og/id/publications/kajian-air", width: 1200, height: 630, alt: "Kajian Air Bersih" }]);
    assert.deepEqual(twitter.images, [{ url: "/og/id/publications/kajian-air", alt: "Kajian Air Bersih" }]);
    // Only the own locale's path is not a counterpart.
    assert.equal(view(detailMetadata(publication(), { id: "/id/publications/kajian-air" })).languages, undefined);
  });

  test("SEU7 detail with a public counterpart: hreflang id + en (self = canonical), cover image when there is one", () => {
    const cover = { url: "https://example.supabase.co/storage/v1/object/public/media/c.jpg", alt: "", width: 800, height: 1131 };
    const metadata = detailMetadata(publication({ locale: "en", slug: "clean-water", title: "Clean Water", cover }), {
      id: "/id/publications/kajian-air",
      en: "/en/publications/clean-water",
    });
    const { og, canonical, languages } = view(metadata);
    assert.equal(canonical, "/en/publications/clean-water");
    assert.deepEqual(languages, { en: "/en/publications/clean-water", id: "/id/publications/kajian-air" });
    assert.equal(og.locale, "en_GB");
    assert.deepEqual(og.images, [{ url: cover.url, width: 800, height: 1131, alt: "Clean Water" }], "empty alt falls back to the title");
    assert.equal(detailMetadata(publication({ description: "" }), {}).description, undefined, "no empty description");
  });

  test("SEU8 robots: Production allows and lists the sitemap; elsewhere Disallow: / without sitemap", () => {
    assert.deepEqual(robotsFor(true), { rules: { userAgent: "*", allow: "/" }, sitemap: "https://mahira.id/sitemap.xml" });
    assert.deepEqual(robotsFor(false), { rules: { userAgent: "*", disallow: "/" } });
  });

  describe("SEU9 app/robots.ts follows VERCEL_ENV", () => {
    const saved = process.env.VERCEL_ENV;
    afterEach(() => {
      if (saved === undefined) delete process.env.VERCEL_ENV;
      else process.env.VERCEL_ENV = saved;
    });
    for (const [value, production] of [
      ["production", true],
      ["preview", false],
      [undefined, false],
    ] as const) {
      test(`VERCEL_ENV=${value ?? "(unset)"} → ${production ? "allow" : "disallow"}`, () => {
        if (value === undefined) delete process.env.VERCEL_ENV;
        else process.env.VERCEL_ENV = value;
        assert.equal(isProductionDeployment(), production);
        assert.deepEqual(robots(), robotsFor(production));
      });
    }
  });

  test("SEU10 sitemap: CMS off → only /; on → /, both indexes, every detail with lastModified", () => {
    assert.deepEqual(sitemapEntries(null), [{ url: "https://mahira.id/" }]);
    assert.deepEqual(sitemapEntries([]), [
      { url: "https://mahira.id/" },
      { url: "https://mahira.id/id/publications" },
      { url: "https://mahira.id/en/publications" },
    ]);
    const entries = sitemapEntries([
      { locale: "id", slug: "kajian-air", updatedAt: "2026-11-01T00:00:00.000Z" },
      { locale: "en", slug: "clean-water", updatedAt: "2026-11-02T00:00:00.000Z" },
    ]);
    assert.deepEqual(entries.slice(3), [
      { url: "https://mahira.id/id/publications/kajian-air", lastModified: "2026-11-01T00:00:00.000Z" },
      { url: "https://mahira.id/en/publications/clean-water", lastModified: "2026-11-02T00:00:00.000Z" },
    ]);
  });

  test("SEU11 generated image title size shrinks with length (code points)", () => {
    assert.equal(titleFontSize("a".repeat(40)), 76);
    assert.equal(titleFontSize("a".repeat(41)), 64);
    assert.equal(titleFontSize("a".repeat(140)), 52);
    assert.equal(titleFontSize("a".repeat(141)), 44);
    assert.equal(titleFontSize("😀".repeat(40)), 76, "surrogate pairs count once");
  });
});
