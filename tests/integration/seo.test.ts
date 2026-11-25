import assert from "node:assert/strict";
import { after, before, describe, test } from "node:test";
import type { Payload, RequiredDataFromCollectionSlug } from "payload";

import type { Publication } from "../../payload/payload-types";
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
import { BASE_URL, assertServerUp, getPage, pageFact, type PageResult } from "../helpers/http";
import { closeTestPayload, getTestPayload } from "../helpers/payload";
import { decodeAmp, robotsContent } from "../helpers/publication-pages";

/**
 * SEO of the public pages (M3-07, DEC-021, DECISIONS §2.13): canonical,
 * hreflang, noindex, Open Graph/Twitter, /sitemap.xml, /robots.txt and the
 * generated Open Graph images, against `next start` with the full env (CMS
 * on, no VERCEL_ENV, so robots.txt is the non-Production one). Metadata,
 * sitemap and images must never name a draft, an unpublished,
 * `subscriber` or other-locale record (a `registered` one is eligible since M5-03, accounts on).
 *
 * Metadata is read from the HTML wherever Next puts it (head for crawlers of
 * the `htmlLimitedBots` list, streamed into the body for other agents), for a
 * plain agent and for Bingbot.
 *
 * Fixtures (slugs fixture-test-seo-*, titles and labels "[FIXTURE] test seo
 * *"), reusing an existing author, topic and type, publishedAt 2005-01-05
 * (never the homepage lead). No user is created; the Owner guard runs before
 * any fixture is written and after cleanup.
 */
type PubData = RequiredDataFromCollectionSlug<"publications">;
type Locale = "id" | "en";

const AREA = "seo";
const PREFIX = areaPrefix(AREA);
const LABEL = areaLabel(AREA);
const SITE = "https://mahira.id";
const PUBLISHED_AT = "2005-01-05T03:00:00.000Z";
const BINGBOT = "Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)";

const slug = (name: string) => `${PREFIX}${name}`;
const title = (name: string) => `${LABEL}${name}`;
const detailPath = (locale: Locale, name: string) => `/${locale}/publications/${slug(name)}`;

type Attributes = Record<string, string>;

function attributes(tag: string): Attributes {
  const out: Attributes = {};
  for (const match of tag.matchAll(/([a-zA-Z:-]+)="([^"]*)"/g)) out[(match[1] as string).toLowerCase()] = decodeAmp(match[2] as string);
  return out;
}

function tags(html: string, name: "meta" | "link"): Attributes[] {
  return [...html.matchAll(new RegExp(`<${name}\\s[^>]*>`, "g"))].map((match) => attributes(match[0]));
}

/** `content` of every `<meta property|name="key">`. */
function meta(html: string, key: string): string[] {
  return tags(html, "meta")
    .filter((tag) => tag.property === key || tag.name === key)
    .map((tag) => tag.content ?? "");
}

function canonicals(html: string): string[] {
  return tags(html, "link")
    .filter((tag) => tag.rel === "canonical")
    .map((tag) => tag.href ?? "");
}

/** hreflang → href of every `<link rel="alternate" hreflang>` (the language switcher is an `<a>`, not counted). */
function hreflangs(html: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const tag of tags(html, "link")) if (tag.rel === "alternate" && tag.hreflang) out[tag.hreflang] = tag.href ?? "";
  return out;
}

type Binary = { status: number; contentType: string; cacheControl: string; bytes: Uint8Array };

async function getBinary(path: string): Promise<Binary> {
  const response = await fetch(`${BASE_URL}${path}`, { redirect: "manual" });
  return {
    status: response.status,
    contentType: response.headers.get("content-type") ?? "",
    cacheControl: response.headers.get("cache-control") ?? "",
    bytes: new Uint8Array(await response.arrayBuffer()),
  };
}

/** Width and height of a PNG from its IHDR chunk, or null when the bytes are not a PNG. */
function pngSize(bytes: Uint8Array): { width: number; height: number } | null {
  const signature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  if (bytes.length < 24 || signature.some((byte, index) => bytes[index] !== byte)) return null;
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  return { width: view.getUint32(16), height: view.getUint32(20) };
}

describe("SEO (M3-07 metadata, sitemap, robots, Open Graph images)", () => {
  let payload: Payload | undefined;
  let relations: { type: number; topic: number; author: number } | undefined;

  function p(): Payload {
    if (!payload) throw new Error("Payload not initialised (before hook failed)");
    return payload;
  }

  async function createPub(
    name: string,
    overrides: Partial<PubData> = {},
    status: "published" | "draft" = "published",
  ): Promise<Publication> {
    if (!relations) throw new Error("relations not loaded (before hook failed)");
    const data: PubData = {
      title: title(name),
      slug: slug(name),
      locale: "id",
      translationGroup: overrides.translationGroup ?? (await createGroup(p(), AREA, name)),
      summary: `[FIXTURE] Ringkasan uji SEO ${name}.`,
      publicationType: relations.type,
      topics: [relations.topic],
      authors: [relations.author],
      accessLevel: "public",
      publishedAt: PUBLISHED_AT,
    };
    return p().create({
      collection: "publications",
      data: { ...data, ...overrides, _status: status },
      draft: status === "draft",
      depth: 0,
      overrideAccess: true,
    });
  }

  async function unpublish(record: Publication): Promise<void> {
    await p().update({ collection: "publications", id: record.id, data: { _status: "draft" }, depth: 0, overrideAccess: true });
  }

  /** Slugs and titles of records no public SEO output may name. */
  const hidden: string[] = [];

  before(async (t) => {
    payload = await getTestPayload();
    hookNote(t, `cleanup at start removed ${formatCounts(await cleanupArea(payload, AREA))}`);
    await assertOwnerIntact(payload);
    await assertServerUp();
    relations = {
      type: await firstId(p(), "publication-types"),
      topic: await firstId(p(), "topics"),
      author: await firstId(p(), "authors"),
    };
    // A public pair (hreflang both ways).
    const pair = await createPub("pair-id");
    const group = typeof pair.translationGroup === "object" ? pair.translationGroup.id : pair.translationGroup;
    await createPub("pair-en", { locale: "en", translationGroup: group, summary: "[FIXTURE] English SEO summary pair." });
    // Public ID records whose EN counterpart is a draft or `registered` (no hreflang).
    const solo = await createPub("solo-id");
    const soloGroup = typeof solo.translationGroup === "object" ? solo.translationGroup.id : solo.translationGroup;
    await createPub("solo-en-draft", { locale: "en", translationGroup: soloGroup }, "draft");
    // (Access Level is shared across a Translation Group, DEC-004, so a `registered` counterpart of a public record cannot exist.)
    const unpub = await createPub("unpubpair-id");
    const unpubGroup = typeof unpub.translationGroup === "object" ? unpub.translationGroup.id : unpub.translationGroup;
    const unpubEn = await createPub("unpubpair-en-unpublished", { locale: "en", translationGroup: unpubGroup });
    await unpublish(unpubEn);
    // Ineligible records.
    await createPub("draft", {}, "draft");
    // M5-03: `registered` is eligible while accounts are on (SE5 sitemap, SE7 image); `subscriber` never.
    await createPub("registered", { accessLevel: "registered" });
    await createPub("subscriber", { accessLevel: "subscriber" });
    await unpublish(await createPub("unpublished"));
    for (const name of ["solo-en-draft", "unpubpair-en-unpublished", "draft", "subscriber", "unpublished"]) {
      hidden.push(slug(name), title(name));
    }
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

  async function both(path: string): Promise<Array<[string, PageResult]>> {
    return [
      ["default", await getPage(path)],
      ["Bingbot", await getPage(path, { "User-Agent": BINGBOT })],
    ];
  }

  function assertNoHidden(body: string, label: string): void {
    for (const text of hidden) assert.equal(body.includes(text), false, `${label}: "${text}" in the response`);
  }

  test("SE1 detail: self canonical on mahira.id, Open Graph article in the route locale, generated image, Twitter large image", async () => {
    for (const [locale, name, ogLocale] of [
      ["id", "pair-id", "id_ID"],
      ["en", "pair-en", "en_GB"],
    ] as const) {
      const url = `${SITE}${detailPath(locale, name)}`;
      for (const [agent, result] of await both(detailPath(locale, name))) {
        const label = `${agent} GET ${detailPath(locale, name)}`;
        assert.equal(result.status, 200, `${label}: ${pageFact(result)}`);
        assert.equal(robotsContent(result.body)?.includes("noindex") ?? false, false, `${label}: noindex`);
        assert.deepEqual(canonicals(result.body), [url], `${label}: canonical`);
        assert.deepEqual(meta(result.body, "og:type"), ["article"], `${label}: og:type`);
        assert.deepEqual(meta(result.body, "og:url"), [url], `${label}: og:url`);
        assert.deepEqual(meta(result.body, "og:locale"), [ogLocale], `${label}: og:locale`);
        assert.deepEqual(meta(result.body, "og:title"), [title(name)], `${label}: og:title`);
        assert.deepEqual(meta(result.body, "og:site_name"), ["Mahira Indonesia Development"], `${label}: og:site_name`);
        assert.deepEqual(meta(result.body, "og:image"), [`${SITE}/og/${locale}/publications/${slug(name)}`], `${label}: og:image`);
        assert.deepEqual(meta(result.body, "og:image:width"), ["1200"], `${label}: og:image:width`);
        assert.deepEqual(meta(result.body, "twitter:card"), ["summary_large_image"], `${label}: twitter:card`);
        assert.deepEqual(meta(result.body, "twitter:image"), [`${SITE}/og/${locale}/publications/${slug(name)}`], `${label}: twitter:image`);
        const other = locale === "id" ? "pair-en" : "pair-id";
        assert.equal(meta(result.body, "og:title").includes(title(other)), false, `${label}: title of the other locale`);
        assert.equal(result.body.includes("localhost:3100/"), false, `${label}: a localhost URL`);
      }
    }
  });

  test("SE2 hreflang: reciprocal for a public pair; none when the counterpart is a draft or unpublished (no disclosure)", async () => {
    const pair = { id: `${SITE}${detailPath("id", "pair-id")}`, en: `${SITE}${detailPath("en", "pair-en")}` };
    for (const path of [detailPath("id", "pair-id"), detailPath("en", "pair-en")]) {
      for (const [agent, result] of await both(path)) {
        assert.deepEqual(hreflangs(result.body), pair, `${agent} GET ${path}: hreflang`);
        assert.equal("x-default" in hreflangs(result.body), false, `${agent} GET ${path}: x-default`);
      }
    }
    for (const name of ["solo-id", "unpubpair-id"]) {
      for (const [agent, result] of await both(detailPath("id", name))) {
        const label = `${agent} GET ${detailPath("id", name)}`;
        assert.equal(result.status, 200, `${label}: ${pageFact(result)}`);
        assert.deepEqual(hreflangs(result.body), {}, `${label}: hreflang`);
        assert.deepEqual(canonicals(result.body), [`${SITE}${detailPath("id", name)}`], `${label}: canonical`);
        assertNoHidden(result.body, label);
      }
    }
  });

  test("SE3 index: self canonical + hreflang on page 1 (also ?page=1, ?utm_source); q or a filter: noindex, follow, no canonical, no hreflang", async () => {
    for (const locale of ["id", "en"] as const) {
      for (const query of ["", "?page=1", "?utm_source=x"]) {
        const path = `/${locale}/publications${query}`;
        const result = await getPage(path);
        assert.equal(result.status, 200, `GET ${path}: ${pageFact(result)}`);
        assert.equal(robotsContent(result.body), null, `GET ${path}: robots`);
        assert.deepEqual(canonicals(result.body), [`${SITE}/${locale}/publications`], `GET ${path}: canonical`);
        assert.deepEqual(hreflangs(result.body), { id: `${SITE}/id/publications`, en: `${SITE}/en/publications` }, `GET ${path}: hreflang`);
        assert.deepEqual(meta(result.body, "og:url"), [`${SITE}/${locale}/publications`], `GET ${path}: og:url`);
        assert.deepEqual(meta(result.body, "og:image"), [`${SITE}/og/${locale}/publications`], `GET ${path}: og:image`);
      }
    }
    for (const query of ["?q=kajian", `?topic=${PREFIX}x`, "?type=x&page=2", "?year=2005", "?page=999"]) {
      const path = `/id/publications${query}`;
      for (const [agent, result] of await both(path)) {
        const label = `${agent} GET ${path}`;
        assert.equal(robotsContent(result.body), "noindex, follow", `${label}: robots`);
        assert.deepEqual(canonicals(result.body), [], `${label}: canonical`);
        assert.deepEqual(hreflangs(result.body), {}, `${label}: hreflang`);
        assert.deepEqual(meta(result.body, "og:url"), [`${SITE}/id/publications`], `${label}: og:url`);
      }
    }
  });

  test("SE4 homepage: canonical https://mahira.id, Open Graph website id_ID with the site image, no hreflang", async () => {
    for (const [agent, result] of await both("/")) {
      const label = `${agent} GET /`;
      assert.equal(result.status, 200, `${label}: ${pageFact(result)}`);
      assert.deepEqual(canonicals(result.body), [SITE], `${label}: canonical`);
      assert.deepEqual(hreflangs(result.body), {}, `${label}: hreflang`);
      assert.deepEqual(meta(result.body, "og:type"), ["website"], `${label}: og:type`);
      assert.deepEqual(meta(result.body, "og:locale"), ["id_ID"], `${label}: og:locale`);
      assert.deepEqual(meta(result.body, "og:url"), [SITE], `${label}: og:url`);
      assert.deepEqual(meta(result.body, "og:image"), [`${SITE}/og/site`], `${label}: og:image`);
      assert.deepEqual(meta(result.body, "twitter:card"), ["summary_large_image"], `${label}: twitter:card`);
    }
  });

  test("SE5 sitemap: /, both indexes and the public (and, M5-03, registered) records of both locales on mahira.id; never draft, unpublished, subscriber", async () => {
    const result = await getPage("/sitemap.xml");
    assert.equal(result.status, 200, `GET /sitemap.xml: ${pageFact(result)}`);
    const locs = [...result.body.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1] as string);
    for (const url of [`${SITE}/`, `${SITE}/id/publications`, `${SITE}/en/publications`]) {
      assert.equal(locs.includes(url), true, `sitemap lists ${url}`);
    }
    for (const [locale, name] of [
      ["id", "pair-id"],
      ["en", "pair-en"],
      ["id", "solo-id"],
      ["id", "unpubpair-id"],
      ["id", "registered"],
    ] as const) {
      assert.equal(locs.includes(`${SITE}${detailPath(locale, name)}`), true, `sitemap lists ${name}`);
    }
    assert.equal(locs.every((loc) => loc.startsWith(`${SITE}/`)), true, "every <loc> on https://mahira.id");
    assert.equal(new Set(locs).size, locs.length, "no duplicate <loc>");
    const entry = result.body.match(new RegExp(`<loc>${SITE}${detailPath("id", "pair-id")}</loc>\\s*<lastmod>([^<]+)</lastmod>`));
    assert.ok(entry && !Number.isNaN(Date.parse(entry[1] as string)), "lastmod of a detail entry");
    assertNoHidden(result.body, "GET /sitemap.xml");
  });

  test("SE6 robots.txt outside Production: Disallow: / and no sitemap", async () => {
    const result = await getPage("/robots.txt");
    assert.equal(result.status, 200, `GET /robots.txt: ${pageFact(result)}`);
    assert.match(result.body, /User-Agent: \*\s+Disallow: \/\s/);
    assert.equal(/^Allow:/m.test(result.body), false, "an Allow line");
    assert.equal(/Sitemap:/i.test(result.body), false, "a Sitemap line");
  });

  test("SE7 generated Open Graph images: 1200×630 PNG for /, an index and a public detail (detail no-store)", async () => {
    for (const path of ["/og/site", "/og/id/publications", "/og/en/publications", `/og/id/publications/${slug("pair-id")}`, `/og/en/publications/${slug("pair-en")}`, `/og/id/publications/${slug("registered")}`]) {
      const image = await getBinary(path);
      assert.equal(image.status, 200, `GET ${path}: HTTP ${image.status}`);
      assert.equal(image.contentType, "image/png", `GET ${path}: content-type`);
      assert.deepEqual(pngSize(image.bytes), { width: 1200, height: 630 }, `GET ${path}: PNG size`);
      if (path.split("/").length === 5) assert.match(image.cacheControl, /no-store/, `GET ${path}: Cache-Control`);
    }
  });

  test("SE8 generated detail image: 404 for draft, unpublished, subscriber, other-locale, unknown and invalid slugs", async () => {
    const paths = [
      ...["draft", "unpublished", "subscriber"].map((name) => `/og/id/publications/${slug(name)}`),
      ...["unpubpair-en-unpublished", "solo-en-draft"].map((name) => `/og/en/publications/${slug(name)}`),
      `/og/en/publications/${slug("pair-id")}`,
      `/og/id/publications/${slug("pair-en")}`,
      `/og/id/publications/${PREFIX}no-such-slug`,
      `/og/id/publications/${slug("Pair-Id")}`,
      `/og/xx/publications/${slug("pair-id")}`,
      "/og/xx/publications",
    ];
    for (const path of paths) {
      const image = await getBinary(path);
      assert.equal(image.status, 404, `GET ${path}: HTTP ${image.status}`);
      assert.equal(image.contentType.startsWith("image/"), false, `GET ${path}: content-type ${image.contentType}`);
    }
  });
});
