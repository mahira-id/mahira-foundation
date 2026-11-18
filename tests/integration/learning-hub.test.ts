import assert from "node:assert/strict";
import { after, before, describe, test } from "node:test";
import { sql, type PostgresAdapter } from "@payloadcms/db-postgres";
import type { Payload } from "payload";

import { findPublicResources } from "../../lib/cms/learning-hub-query";
import { isResourceVisible, newestCards, type ResourceDoc } from "../../lib/learning-hub/catalog-view";
import type { LearningResource } from "../../payload/payload-types";
import {
  areaEmail,
  areaLabel,
  areaPrefix,
  assertOwnerIntact,
  cleanupArea,
  countLeftovers,
  formatCounts,
  hookNote,
  randomPassword,
  totalOf,
} from "../helpers/fixtures";
import { diffGlobal, restoreGlobal, snapshotGlobal, summarizeGlobal, type GlobalSnapshot } from "../helpers/global-state";
import { BASE_URL, assertServerUp, getPage, login, pageFact, postForm, rest, restFact, type PageResult } from "../helpers/http";
import { closeTestPayload, getTestPayload } from "../helpers/payload";
import { assertNotFoundPage, decodeAmp, robotsContent } from "../helpers/publication-pages";

/**
 * Learning Hub (M3-11/12, DECISIONS §2.16) against `next start` with the
 * full env (bun run test:integration): `learning-resources` + the
 * `learning-hub` global, `/{locale}/learning-hub` and
 * `/{locale}/learning-hub/{slug}`. A locale's catalog exists only with at
 * least one visible resource (published, public type, that locale's title
 * and summary, an active Topic; EN also "Versi EN siap tayang"); toolkits
 * never show before M3-13; the YouTube source is reduced to its ID at the
 * save boundary; anonymous REST/GraphQL is denied; the guide preview runs
 * through `/api/preview?resource=<id>&locale=<l>` + Draft Mode and checks
 * the staff session on every request.
 *
 * The `learning-hub` global is a singleton on the shared `mahira-cms`:
 * `before` snapshots every row of its tables (tests/helpers/global-state.ts)
 * before any write (an error aborts the file), then unpublishes it if it is
 * published; `after` restores the snapshot and proves equality with a second
 * snapshot (diffGlobal must be []). Keep that order when adding tests.
 *
 * Real (non-fixture) resources may exist on `mahira-cms` later: checks that
 * need an empty catalog are skipped with an OBSERVED note then, and every
 * other check looks at the fixture theme only. Fixture text only:
 * "[FIXTURE] test learning-hub …", slugs `fixture-test-learning-hub-…`,
 * Editor fixture-test-learning-hub-editor@example.invalid (token never
 * printed). The Owner guard runs before any write and after cleanup.
 */
type Locale = "id" | "en";

const AREA = "learning-hub";
const LABEL = areaLabel(AREA);
const PREFIX = areaPrefix(AREA);
const EDITOR_EMAIL = areaEmail(AREA, "editor");
const SITE = "https://mahira.id";
const BYPASS = "__prerender_bypass";
const GOOGLEBOT = "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)";
/** The admin Unpublish button (Payload 3.93.0): PATCH with these query params and body {_status:"draft"}. */
const UNPUBLISH_QUERY = "?depth=0&fallback-locale=null&unpublishAllLocales=true";
const STAFF_ONLY = ["enReady", "en_ready", "_status", "Versi EN siap tayang", "sortOrder", "sort_order"];
/** Synthetic IDs in the YouTube ID format (no real video or playlist). */
const VIDEO_ID = "fixtureVid1";
const PLAYLIST_ID = "PLfixtureTestLearningHub01";
/** The editor's pasted URLs, with extra parameters that must never be stored or rendered. */
const VIDEO_URL = `https://www.youtube.com/watch?v=${VIDEO_ID}&t=42s&si=fixturetracking`;
const PLAYLIST_URL = `https://www.youtube.com/playlist?list=${PLAYLIST_ID}&si=fixturetracking`;
const GUIDE_SLUG: Record<Locale, string> = { id: `${PREFIX}panduan`, en: `${PREFIX}guide` };
const TOOLKIT_SLUG = `${PREFIX}toolkit`;

const fx = (locale: Locale, tag: string, part: string) => `${LABEL}${locale} ${tag} ${part}`;

// ---------------------------------------------------------------- HTML readers
type Attributes = Record<string, string>;

function attributes(tag: string): Attributes {
  const out: Attributes = {};
  for (const match of tag.matchAll(/([a-zA-Z:-]+)="([^"]*)"/g)) out[(match[1] as string).toLowerCase()] = decodeAmp(match[2] as string);
  return out;
}

function tags(html: string, name: "meta" | "link" | "a"): Attributes[] {
  return [...html.matchAll(new RegExp(`<${name}\\s[^>]*>`, "g"))].map((match) => attributes(match[0]));
}

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

function hreflangs(html: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const tag of tags(html, "link")) if (tag.rel === "alternate" && tag.hreflang) out[tag.hreflang] = tag.href ?? "";
  return out;
}

function texts(html: string, element: string): string[] {
  return [...html.matchAll(new RegExp(`<${element}(?:\\s[^>]*)?>([^<]*)</${element}>`, "g"))].map((match) => match[1] as string);
}

/** The `<section data-lh-theme="<topic id>">…</section>` of the fixture theme, or null. */
function themeSection(html: string, topicId: number): string | null {
  const match = new RegExp(`<section[^>]*\\sdata-lh-theme="${topicId}"[^>]*>([\\s\\S]*?)</section>`).exec(html);
  return match ? (match[1] as string) : null;
}

/** `data-lh-card` types in document order. */
function cardTypes(html: string): string[] {
  return [...html.matchAll(/<article[^>]*\sdata-lh-card="([^"]+)"/g)].map((match) => match[1] as string);
}

function bypassCookie(result: PageResult): { value: string; attributes: string } | undefined {
  for (const cookie of result.setCookies) {
    const [pair = "", ...rest] = cookie.split(";");
    const separator = pair.indexOf("=");
    if (separator !== -1 && pair.slice(0, separator).trim() === BYPASS) {
      return { value: pair.slice(separator + 1).trim(), attributes: rest.join(";").toLowerCase() };
    }
  }
  return undefined;
}

function target(result: PageResult): string {
  const url = new URL(result.location, BASE_URL);
  assert.equal(url.host, new URL(BASE_URL).host, `redirect host ${url.host}`);
  return `${url.pathname}${url.search}`;
}

function assertPreviewDenied(result: PageResult, label: string): void {
  assert.equal(result.status, 404, `${label}: ${pageFact(result)}`);
  assert.equal(result.body, "Not Found", `${label}: body`);
  assert.equal(result.cacheControl, "no-store", `${label}: Cache-Control`);
  assert.equal(bypassCookie(result) !== undefined, false, `${label}: ${BYPASS} set`);
}

/** No Learning Hub page: the Mahira not-found page with noindex and no fixture text. */
function assertAbsent(result: PageResult, label: string, locale: Locale): void {
  assertNotFoundPage(result, label, locale);
  assert.equal(result.body.includes("data-lh-page"), false, `${label}: data-lh-page`);
  assert.equal(result.body.includes(LABEL), false, `${label}: fixture text in the response`);
}

describe("Learning Hub (M3-11/12: resources, catalog, guide pages, YouTube IDs, preview, SEO, sitemap)", () => {
  let payload: Payload | undefined;
  let snapshot: GlobalSnapshot | undefined;
  let editorToken: string | undefined;
  let topicId: number | undefined;
  /** Locales that already had a visible real resource at the start (empty-catalog checks are skipped there). */
  const realCatalog: Record<Locale, boolean> = { id: false, en: false };
  const ids: Record<"draft" | "video" | "playlist" | "guide" | "toolkit", number | undefined> = {
    draft: undefined,
    video: undefined,
    playlist: undefined,
    guide: undefined,
    toolkit: undefined,
  };
  let bypass: string | undefined;

  function p(): Payload {
    if (!payload) throw new Error("Payload not initialised (before hook failed)");
    return payload;
  }

  function editor(): string {
    if (!editorToken) throw new Error("editor login failed (before hook)");
    return editorToken;
  }

  function topic(): number {
    if (topicId === undefined) throw new Error("fixture topic missing (before hook)");
    return topicId;
  }

  function id(name: keyof typeof ids): number {
    const value = ids[name];
    if (value === undefined) throw new Error(`fixture ${name} missing (an earlier test failed)`);
    return value;
  }

  function draftCookie(): string {
    if (!bypass) throw new Error(`no ${BYPASS} cookie from LH7`);
    return `${BYPASS}=${bypass}`;
  }

  const previewHeaders = () => ({ Cookie: `${draftCookie()}; payload-token=${editor()}` });

  async function rows(query: ReturnType<typeof sql>): Promise<Record<string, unknown>[]> {
    return (await (p().db as unknown as PostgresAdapter).drizzle.execute(query)).rows as Record<string, unknown>[];
  }

  /** Anonymous Local API read as public code does it, also with `draft: true` (public code never passes it). */
  async function anonymousIds(locale: Locale, draft: boolean): Promise<number[]> {
    const result = await p().find({ collection: "learning-resources", locale, fallbackLocale: false, draft, depth: 0, pagination: false, overrideAccess: false });
    return result.docs.map((doc) => doc.id);
  }

  async function visibleIn(locale: Locale): Promise<ResourceDoc[]> {
    return ((await findPublicResources(p(), locale)) as ResourceDoc[]).filter((doc) => isResourceVisible(doc, locale));
  }

  type Base = Pick<LearningResource, "type" | "materialLanguage"> & Partial<LearningResource>;

  async function createResource(locale: Locale, input: Base, status: "draft" | "published"): Promise<number> {
    const data = { topic: topic(), ...input, _status: status } as Omit<LearningResource, "id" | "createdAt" | "updatedAt">;
    const options = { collection: "learning-resources", locale, data, depth: 0, overrideAccess: true } as const;
    const doc = status === "draft" ? await p().create({ ...options, draft: true }) : await p().create(options);
    return doc.id;
  }

  async function updateResource(resource: number, locale: Locale, data: Partial<LearningResource>, status: "draft" | "published"): Promise<void> {
    await p().update({
      collection: "learning-resources",
      id: resource,
      locale,
      data: { ...data, _status: status },
      draft: status === "draft",
      depth: 0,
      overrideAccess: true,
    });
  }

  async function writeGlobal(locale: Locale, tag: string, status: "draft" | "published"): Promise<void> {
    await p().updateGlobal({
      slug: "learning-hub",
      locale,
      data: {
        hero: { title: fx(locale, tag, "H1"), intro: `${fx(locale, tag, "intro one")}\n\n${fx(locale, tag, "intro two")}` },
        seo: { title: fx(locale, tag, "seo title"), description: fx(locale, tag, "seo description") },
        _status: status,
      },
      draft: status === "draft",
      depth: 0,
      overrideAccess: true,
    });
  }

  const catalog = (locale: Locale, headers: Record<string, string> = {}) => getPage(`/${locale}/learning-hub`, headers);
  const guidePage = (locale: Locale, slug: string, headers: Record<string, string> = {}) => getPage(`/${locale}/learning-hub/${slug}`, headers);

  async function sitemapLocs(): Promise<string[]> {
    const result = await getPage("/sitemap.xml");
    assert.equal(result.status, 200, `GET /sitemap.xml ${pageFact(result)}`);
    return [...result.body.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1] as string);
  }

  before(async (t) => {
    payload = await getTestPayload();
    // Snapshot first: an error here aborts the file before any write.
    snapshot = await snapshotGlobal(payload, "learning-hub");
    hookNote(t, `learning-hub global before: ${summarizeGlobal(snapshot)}`);
    hookNote(t, `cleanup at start removed ${formatCounts(await cleanupArea(payload, AREA))}`);
    await assertOwnerIntact(payload);
    await assertServerUp();

    for (const locale of ["id", "en"] as const) realCatalog[locale] = (await visibleIn(locale)).length > 0;
    hookNote(t, `real visible resources at start: id=${realCatalog.id} en=${realCatalog.en}`);

    const secret = randomPassword();
    await p().create({ collection: "users", data: { email: EDITOR_EMAIL, password: secret, role: "editor" }, overrideAccess: true });
    editorToken = await login(EDITOR_EMAIL, secret);

    // An active fixture Topic with both names (the theme of every fixture resource).
    const created = await p().create({ collection: "topics", data: { name: `${LABEL}Topik`, slug: `${PREFIX}topic`, description: `${LABEL}Deskripsi topik` }, locale: "id", overrideAccess: true });
    await p().update({ collection: "topics", id: created.id, data: { name: `${LABEL}Topic EN`, description: `${LABEL}Topic description` }, locale: "en", overrideAccess: true });
    await p().update({ collection: "topics", id: created.id, data: { isActive: true }, locale: "id", overrideAccess: true });
    topicId = created.id;

    // Known start: the global unpublished (content kept), like the admin button.
    const published = (snapshot.views.published ?? {}) as { _status?: unknown };
    if (published._status === "published") {
      await p().updateGlobal({ slug: "learning-hub", data: { _status: "draft" }, unpublishAllLocales: true, depth: 0, overrideAccess: true });
    }
  });

  after(async (t) => {
    try {
      if (payload && snapshot) {
        await restoreGlobal(payload, "learning-hub", snapshot);
        const now = await snapshotGlobal(payload, "learning-hub");
        const diff = diffGlobal(snapshot, now);
        hookNote(t, `learning-hub global after restore: ${summarizeGlobal(now)}`);
        hookNote(t, `learning-hub global before/after differing paths: ${diff.length}`);
        if (diff.length !== 0) throw new Error(`learning-hub global not restored (${diff.length} paths): ${diff.slice(0, 10).join(", ")}`);
      }
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

  test("LH8 no visible resource: /id/learning-hub and /en/learning-hub not found (noindex, Googlebot 404), no menu href, out of the sitemap", async (t) => {
    for (const locale of ["id", "en"] as const) {
      if (realCatalog[locale]) {
        t.diagnostic(`OBSERVED: real resources are visible in ${locale}; the empty-catalog check is skipped there`);
        continue;
      }
      assert.equal((await visibleIn(locale)).length, 0, `${locale}: no visible resource (the menu href is null)`);
      assertAbsent(await catalog(locale), `GET /${locale}/learning-hub`, locale);
      const crawler = await catalog(locale, { "User-Agent": GOOGLEBOT });
      assert.equal(crawler.status, 404, `Googlebot GET /${locale}/learning-hub: ${pageFact(crawler)}`);
      assert.equal((await sitemapLocs()).includes(`${SITE}/${locale}/learning-hub`), false, `/${locale}/learning-hub in the sitemap`);
    }
  });

  test("LHUI1a no catalog: no Learning Hub link in the header of the locale pages and no menu item in the homepage header and footer", async (t) => {
    for (const locale of ["id", "en"] as const) {
      if (realCatalog[locale]) {
        t.diagnostic(`OBSERVED: real resources are visible in ${locale}; the no-menu check is skipped there`);
        continue;
      }
      const index = await getPage(`/${locale}/publications`);
      assert.equal(index.status, 200, `GET /${locale}/publications ${pageFact(index)}`);
      // The attribute, not the substring: the About link's class list names the selector `[data-header-learning-hub]+&`.
      assert.equal(index.body.includes('data-header-learning-hub="'), false, `/${locale}/publications: Learning Hub header link`);
      assert.equal(index.body.includes(`/${locale}/learning-hub`), false, `/${locale}/publications: link to /${locale}/learning-hub`);
    }
    if (realCatalog.id) return;
    const home = await getPage("/");
    assert.equal(home.status, 200, `GET / ${pageFact(home)}`);
    assert.equal(home.body.includes("data-home-nav-learning-hub"), false, "/: Learning Hub menu item (header or footer)");
    assert.equal(home.body.includes("/learning-hub"), false, "/: any link to a Learning Hub page");
  });

  test("LHUI2a no catalog: no Learning Hub block on the homepage", async (t) => {
    if (realCatalog.id) {
      t.diagnostic("OBSERVED: real resources are visible in id; the no-block check is skipped");
      return;
    }
    const home = await getPage("/");
    assert.equal(home.status, 200, `GET / ${pageFact(home)}`);
    assert.equal(home.body.includes("data-home-learning-hub"), false, "/: Learning Hub block");
    assert.equal(home.body.includes("data-home-learning-card"), false, "/: Learning Hub card");
    assert.equal(home.body.includes("Learning Hub"), false, "/: the text 'Learning Hub'");
  });

  test("LH1 an unpublished resource is not public: no anonymous Local API read, no catalog", async () => {
    ids.draft = await createResource(
      "id",
      { type: "video", materialLanguage: "id", title: fx("id", "D", "title"), summary: fx("id", "D", "summary"), youtubeId: VIDEO_URL },
      "draft",
    );
    for (const draft of [false, true]) {
      assert.equal((await anonymousIds("id", draft)).includes(id("draft")), false, `anonymous Local API read (draft: ${draft}) of a draft`);
    }
    assert.equal((await visibleIn("id")).some((doc) => doc.id === id("draft")), false, "draft visible");
    const result = await catalog("id");
    if (!realCatalog.id) assertAbsent(result, "GET /id/learning-hub with a draft only", "id");
    assert.equal(result.body.includes(fx("id", "D", "title")), false, "draft title in the response");
  });

  test("LH2 publish a video, a playlist and a guide (ID): catalog 200 with H1, theme H2, cards in order, watch links from the ID, canonical, OG; guide page; the global's texts", async () => {
    ids.video = await createResource(
      "id",
      {
        type: "video",
        materialLanguage: "id",
        title: fx("id", "V", "title"),
        summary: fx("id", "V", "summary"),
        youtubeId: VIDEO_URL,
        publishedAt: "2090-01-03T00:00:00.000Z",
      },
      "published",
    );
    ids.playlist = await createResource(
      "id",
      {
        type: "playlist",
        materialLanguage: "en",
        title: fx("id", "P", "title"),
        summary: fx("id", "P", "summary"),
        youtubeId: PLAYLIST_URL,
        sortOrder: 1,
        publishedAt: "2090-01-01T00:00:00.000Z",
      },
      "published",
    );
    ids.guide = await createResource(
      "id",
      {
        type: "guide",
        materialLanguage: "id",
        title: fx("id", "G", "title"),
        summary: `${fx("id", "G", "summary one")}\n\n${fx("id", "G", "summary two")}`,
        slug: GUIDE_SLUG.id,
        publishedAt: "2090-01-05T00:00:00.000Z",
        sections: [
          { label: fx("id", "G", "s1 label"), heading: fx("id", "G", "s1 heading"), body: fx("id", "G", "s1 body"), quote: fx("id", "G", "s1 quote") },
          { label: fx("id", "G", "s2 label"), lists: [{ style: "numbered", items: [{ title: fx("id", "G", "item title"), text: fx("id", "G", "item text") }] }] },
        ],
      },
      "published",
    );

    // Without a published global: H1 = "Learning Hub", no intro.
    let result = await catalog("id");
    assert.equal(result.status, 200, `GET /id/learning-hub ${pageFact(result)}`);
    let html = result.body;
    assert.equal(html.includes('data-lh-page="catalog"'), true, "catalog main");
    assert.deepEqual(texts(html, "h1"), ["Learning Hub"], "H1 without the global");
    const theme = themeSection(html, topic());
    assert.ok(theme, "fixture theme section");
    assert.deepEqual(texts(theme, "h2"), [`${LABEL}Topik`], "theme H2 = Topic name (ID)");
    assert.equal(theme.includes(`${LABEL}Deskripsi topik`), true, "Topic description");
    assert.deepEqual(cardTypes(theme), ["playlist", "guide", "video"], "sortOrder first, then newest");
    for (const tag of ["V", "P", "G"]) assert.equal(theme.includes(fx("id", tag, "title")), true, `card ${tag}`);
    const watch = tags(theme, "a").filter((tag) => "data-lh-watch" in tag).map((tag) => tag.href);
    assert.deepEqual(watch.sort(), [`https://www.youtube.com/playlist?list=${PLAYLIST_ID}`, `https://www.youtube.com/watch?v=${VIDEO_ID}`], "watch links built from the IDs");
    assert.equal(html.includes("fixturetracking"), false, "the editor's URL parameters never reach the page");
    assert.deepEqual(
      tags(theme, "a").filter((tag) => "data-lh-read" in tag).map((tag) => tag.href),
      [`/id/learning-hub/${GUIDE_SLUG.id}`],
      "guide card links to its page",
    );
    assert.equal(html.includes(fx("id", "D", "title")), false, "draft title");
    assert.equal(robotsContent(html), null, "no robots meta on the public catalog");
    assert.deepEqual(canonicals(html), [`${SITE}/id/learning-hub`], "canonical");
    assert.equal(realCatalog.en || Object.keys(hreflangs(html)).length === 0, true, "no hreflang without the EN catalog");
    assert.deepEqual(meta(html, "og:image"), [`${SITE}/og/site`], "og:image");
    assert.deepEqual(meta(html, "og:type"), ["website"], "og:type");
    assert.equal(html.includes("application/ld+json"), false, "no JSON-LD");
    assert.equal(html.includes("<title>Learning Hub — Mahira Indonesia Development</title>"), true, "<title> = H1 + site name");

    // With the published global: its H1, intro, <title> and description.
    await writeGlobal("id", "H", "published");
    result = await catalog("id");
    html = result.body;
    assert.deepEqual(texts(html, "h1"), [fx("id", "H", "H1")], "H1 from the global");
    for (const part of ["intro one", "intro two"]) assert.equal(html.includes(`>${fx("id", "H", part)}<`), true, `intro ${part}`);
    assert.equal(html.includes(`<title>${fx("id", "H", "seo title")}</title>`), true, "<title> = SEO title");
    assert.deepEqual(meta(html, "description"), [fx("id", "H", "seo description")], "meta description");
    const crawler = await catalog("id", { "User-Agent": GOOGLEBOT });
    assert.equal(crawler.status, 200, `Googlebot ${pageFact(crawler)}`);
    assert.deepEqual(texts(crawler.body, "h1"), [fx("id", "H", "H1")], "Googlebot H1");

    // The guide page.
    const page = await guidePage("id", GUIDE_SLUG.id);
    assert.equal(page.status, 200, `GET guide ${pageFact(page)}`);
    assert.equal(page.body.includes('data-lh-page="guide"'), true, "guide main");
    assert.equal(page.body.includes('data-preview="false"'), true, "not a preview");
    assert.deepEqual(texts(page.body, "h1"), [fx("id", "G", "title")], "guide H1");
    assert.deepEqual(texts(page.body, "h2"), [fx("id", "G", "s1 heading"), fx("id", "G", "s2 label")], "H2 = heading, else label");
    for (const part of ["summary one", "summary two", "s1 body", "s1 quote", "item title", "item text"]) {
      assert.equal(page.body.includes(fx("id", "G", part)), true, `guide "${part}"`);
    }
    assert.deepEqual(canonicals(page.body), [`${SITE}/id/learning-hub/${GUIDE_SLUG.id}`], "guide canonical");
    assert.deepEqual(meta(page.body, "og:type"), ["article"], "guide og:type");
    assert.deepEqual(meta(page.body, "og:image"), [`${SITE}/og/site`], "guide og:image");
    assert.deepEqual(meta(page.body, "description"), [`${fx("id", "G", "summary one")} ${fx("id", "G", "summary two")}`], "guide description");
    assert.deepEqual(hreflangs(page.body), {}, "no hreflang without the EN guide");
    assert.equal(page.body.includes("application/ld+json"), false, "no JSON-LD");
    // Videos and playlists have no detail page; a guide's EN slug is not an ID URL.
    for (const slug of [`${PREFIX}missing`, GUIDE_SLUG.en, "Fixture-Upper", "a_b"]) assertAbsent(await guidePage("id", slug), `GET /id/learning-hub/${slug}`, "id");
  });

  test("LH3 EN: filled EN texts without 'Versi EN siap tayang' -> not shown; with it -> EN catalog with 'In Indonesian', mutual hreflang; EN guide page", async () => {
    await updateResource(id("video"), "en", { title: fx("en", "V", "title"), summary: fx("en", "V", "summary") }, "published");
    await updateResource(id("guide"), "en", { title: fx("en", "G", "title"), summary: fx("en", "G", "summary"), slug: GUIDE_SLUG.en }, "published");
    assert.equal((await visibleIn("en")).some((doc) => doc.id === id("video") || doc.id === id("guide")), false, "EN visible without the checkbox");
    let en = await catalog("en");
    if (!realCatalog.en) assertAbsent(en, "GET /en/learning-hub without the checkbox", "en");
    assert.equal(en.body.includes(fx("en", "V", "title")), false, "EN title without the checkbox");
    assertAbsent(await guidePage("en", GUIDE_SLUG.en), "EN guide without the checkbox", "en");

    await updateResource(id("video"), "id", { enReady: true }, "published");
    await updateResource(id("guide"), "id", { enReady: true }, "published");
    en = await catalog("en");
    assert.equal(en.status, 200, `GET /en/learning-hub ${pageFact(en)}`);
    const theme = themeSection(en.body, topic());
    assert.ok(theme, "EN fixture theme");
    assert.deepEqual(texts(theme, "h2"), [`${LABEL}Topic EN`], "EN Topic name");
    assert.deepEqual(cardTypes(theme), ["guide", "video"], "EN: the playlist (no EN text, no checkbox) is absent");
    assert.equal(theme.includes(fx("en", "V", "title")), true, "EN video title");
    assert.equal(theme.includes("In Indonesian"), true, "'In Indonesian' label (Bahasa materi id)");
    assert.equal(en.body.includes(`${LABEL}id `), false, "ID text on the EN page");
    assert.deepEqual(texts(en.body, "h1"), ["Learning Hub"], "EN H1 without an EN global");
    const pair = { id: `${SITE}/id/learning-hub`, en: `${SITE}/en/learning-hub` };
    assert.deepEqual(hreflangs(en.body), pair, "EN hreflang");
    assert.deepEqual(hreflangs((await catalog("id")).body), pair, "ID hreflang");
    assert.deepEqual(meta(en.body, "og:locale"), ["en_GB"], "EN og:locale");

    const guideEn = await guidePage("en", GUIDE_SLUG.en);
    assert.equal(guideEn.status, 200, `EN guide ${pageFact(guideEn)}`);
    assert.deepEqual(texts(guideEn.body, "h1"), [fx("en", "G", "title")], "EN guide H1");
    const guidePair = { id: `${SITE}/id/learning-hub/${GUIDE_SLUG.id}`, en: `${SITE}/en/learning-hub/${GUIDE_SLUG.en}` };
    assert.deepEqual(hreflangs(guideEn.body), guidePair, "EN guide hreflang");
    assert.deepEqual(hreflangs((await guidePage("id", GUIDE_SLUG.id)).body), guidePair, "ID guide hreflang");
    assertAbsent(await guidePage("en", GUIDE_SLUG.id), "the ID slug under /en", "en");
  });

  test("LH11 no staff field or the EN checkbox in the public HTML", async () => {
    for (const path of ["/id/learning-hub", "/en/learning-hub", `/id/learning-hub/${GUIDE_SLUG.id}`, `/en/learning-hub/${GUIDE_SLUG.en}`]) {
      const result = await getPage(path);
      assert.equal(result.status, 200, `GET ${path} ${pageFact(result)}`);
      for (const name of STAFF_ONLY) assert.equal(result.body.includes(name), false, `"${name}" in ${path}`);
    }
  });

  test("LHUI1b a catalog exists: the Learning Hub link is in the header of the locale pages (current only on the catalog) and the homepage has the menu items", async () => {
    for (const locale of ["id", "en"] as const) {
      const index = await getPage(`/${locale}/publications`);
      assert.equal(index.status, 200, `GET /${locale}/publications ${pageFact(index)}`);
      const links = tags(index.body, "a").filter((tag) => "data-header-learning-hub" in tag);
      assert.deepEqual(links.map((tag) => tag.href), [`/${locale}/learning-hub`], `/${locale}/publications header link`);
      assert.equal("aria-current" in (links[0] as Attributes), false, "not current on another page");
      const onCatalog = tags((await catalog(locale)).body, "a").filter((tag) => "data-header-learning-hub" in tag);
      assert.deepEqual(onCatalog.map((tag) => tag.href), [`/${locale}/learning-hub`], `/${locale}/learning-hub header link`);
      assert.equal((onCatalog[0] as Attributes)["aria-current"], "page", "current on the catalog");
    }
    const guideLinks = tags((await guidePage("id", GUIDE_SLUG.id)).body, "a").filter((tag) => "data-header-learning-hub" in tag);
    assert.deepEqual(guideLinks.map((tag) => tag.href), ["/id/learning-hub"], "guide page header link");
    assert.equal("aria-current" in (guideLinks[0] as Attributes), false, "not current on a guide page");

    // Homepage (Indonesian): the desktop nav and the footer list (the mobile list renders only when open).
    const home = await getPage("/");
    assert.equal(home.status, 200, `GET / ${pageFact(home)}`);
    const items = tags(home.body, "a").filter((tag) => "data-home-nav-learning-hub" in tag);
    assert.equal(items.length >= 2, true, `homepage menu items: ${items.length}`);
    for (const item of items) assert.equal(item.href, "/id/learning-hub", "homepage menu item href");
    assert.equal(home.body.includes('href="/en/learning-hub"'), false, "the Indonesian homepage never links to the EN catalog");
  });

  test("LHUI2b the homepage block: the 3 newest Indonesian resources (guide, video, playlist; the 4th stays out), newest first, the global's H1 and first intro paragraph, link to the catalog", async (t) => {
    // A 4th (oldest) published resource: it must not reach the block. Deleted right after the read so later tests see the same catalog.
    const extra = await createResource(
      "id",
      { type: "video", materialLanguage: "id", title: fx("id", "X", "title"), summary: fx("id", "X", "summary"), youtubeId: VIDEO_URL, publishedAt: "2089-12-01T00:00:00.000Z" },
      "published",
    );
    let home: PageResult;
    try {
      home = await getPage("/");
    } finally {
      await p().delete({ collection: "learning-resources", id: extra, overrideAccess: true });
    }
    assert.equal(home.status, 200, `GET / ${pageFact(home)}`);
    const html = home.body;
    const types = [...html.matchAll(/data-home-learning-card="([^"]+)"/g)].map((match) => match[1] as string);
    assert.equal(html.match(/<section[^>]*\sdata-home-learning-hub="/g)?.length, 1, "one block");
    assert.equal(types.length <= 3, true, `at most 3 cards: ${types.length}`);
    if (realCatalog.id) {
      t.diagnostic("OBSERVED: real resources are visible in id; the card order and the fixture texts are not asserted");
      return;
    }
    assert.deepEqual(types, ["guide", "video", "playlist"], "newest first");
    for (const tag of ["G", "V", "P"]) assert.equal(html.includes(fx("id", tag, "title")), true, `card ${tag}`);
    assert.equal(html.includes(fx("id", "X", "title")), false, "the 4th resource is not on the homepage");
    assert.equal(html.includes(fx("id", "D", "title")), false, "the draft is not on the homepage");
    const block = /<section[^>]*\sdata-home-learning-hub[^>]*>([\s\S]*?)<\/section>/.exec(html)?.[1] ?? "";
    assert.deepEqual(texts(block, "h2"), [fx("id", "H", "H1")], "block title = the ID global's H1");
    assert.equal(block.includes(`>${fx("id", "H", "intro one")}<`), true, "block description = the first intro paragraph");
    assert.equal(block.includes(fx("id", "H", "intro two")), false, "only the first paragraph");
    const links = tags(block, "a");
    assert.deepEqual(links.filter((tag) => "data-home-learning-hub-link" in tag).map((tag) => tag.href), ["/id/learning-hub"], "link to the catalog");
    assert.equal(links.some((tag) => tag.href === `/id/learning-hub/${GUIDE_SLUG.id}`), true, "the guide card links to its page");
    assert.equal(links.some((tag) => tag.href === `https://www.youtube.com/watch?v=${VIDEO_ID}`), true, "the video card links to YouTube (built from the ID)");
    assert.equal(block.includes("<iframe"), false, "no iframe on the homepage");
    assert.equal(html.includes("fixturetracking"), false, "no editor URL parameter on the homepage");
  });

  test("LHUI3 catalog and guide structure: no iframe before the click, a play button per video and playlist, i.ytimg.com only for a video, one H1, theme H2, card H3, guide sections with the shared markup", async () => {
    const result = await catalog("id");
    assert.equal(result.status, 200, `GET /id/learning-hub ${pageFact(result)}`);
    const html = result.body;
    assert.equal(html.includes("<iframe"), false, "an iframe before any click");
    assert.equal(texts(html, "h1").length, 1, "one H1");
    const theme = themeSection(html, topic());
    assert.ok(theme, "fixture theme section");
    assert.equal(theme.match(/<h2[\s>]/g)?.length, 1, "one H2 per theme (the Topic name)");
    assert.equal(theme.match(/<h3[\s>]/g)?.length, 3, "one H3 per card");
    const buttons = [...theme.matchAll(/<button\s[^>]*>/g)].map((match) => attributes(match[0])).filter((tag) => "data-lh-play" in tag);
    assert.deepEqual(buttons.map((tag) => tag["aria-label"]).sort(), [`Putar: ${fx("id", "P", "title")}`, `Putar: ${fx("id", "V", "title")}`], "play buttons with an accessible name");
    for (const tag of buttons) assert.equal(tag.type, "button", "the play control is a button");
    const images = [...theme.matchAll(/<img\s[^>]*>/g)].map((match) => attributes(match[0]).src ?? "");
    assert.deepEqual(images.filter((src) => src.includes("ytimg.com")), [`https://i.ytimg.com/vi/${VIDEO_ID}/hqdefault.jpg`], "only the video uses YouTube's image server");
    assert.equal(theme.includes(PLAYLIST_ID) && theme.includes("ytimg.com/vi/" + PLAYLIST_ID), false, "no thumbnail URL for a playlist");
    assert.equal(theme.includes("publication-cover"), true, "the playlist without an image gets the typographic cover");
    assert.deepEqual([...theme.matchAll(/data-lh-language="([^"]+)"/g)].map((match) => match[1]), ["en", "id", "id"], "'Bahasa materi' label per card");

    const page = await guidePage("id", GUIDE_SLUG.id);
    assert.equal(page.status, 200, `GET guide ${pageFact(page)}`);
    const body = page.body;
    assert.equal(body.includes("<iframe"), false, "an iframe on a guide page");
    assert.equal(texts(body, "h1").length, 1, "guide: one H1");
    assert.equal(body.match(/<section[^>]*\sdata-lh-section/g)?.length, 2, "one section[data-lh-section] per section");
    assert.equal(body.includes("data-lh-quote"), true, "blockquote marker");
    assert.equal(body.includes('data-lh-list="numbered"'), true, "numbered list marker");
    assert.equal(body.includes("<ol"), true, "numbered list is an <ol>");
    assert.equal(body.includes("data-about-"), false, "the About markers stay on the About page");
    assert.equal(body.includes("data-lh-language"), true, "guide 'Bahasa materi' label");
  });

  test("LH4 a non-YouTube, look-alike or malformed source is refused (Local API and Editor REST, drafts too); a valid URL stores only the ID", async () => {
    const bad = [
      `https://youtube.com.evil.example/watch?v=${VIDEO_ID}`,
      `https://evil.example/watch?v=${VIDEO_ID}`,
      `https://www.youtube.com@evil.example/watch?v=${VIDEO_ID}`,
      "javascript:alert(1)",
      `https://www.youtube.com/watch?v=${VIDEO_ID}x`,
      `https://www.youtube.com/watch?v=<script>alert(1)</script>`,
    ];
    const base = { type: "video", materialLanguage: "id", topic: topic(), title: fx("id", "BAD", "title"), summary: fx("id", "BAD", "summary") } as const;
    for (const source of bad) {
      for (const status of ["draft", "published"] as const) {
        await assert.rejects(
          p().create({ collection: "learning-resources", locale: "id", data: { ...base, youtubeId: source, _status: status }, draft: status === "draft", depth: 0, overrideAccess: true }),
          (error: unknown) => {
            const value = error as { name?: string; data?: { errors?: { path?: string }[] } };
            return value.name === "ValidationError" && value.data?.errors?.some((item) => item.path === "youtubeId") === true;
          },
          `Local API ${status}: ${source}`,
        );
        const query = status === "draft" ? "?locale=id&draft=true" : "?locale=id";
        const result = await rest("POST", `/api/learning-resources${query}`, { token: editor(), body: { ...base, youtubeId: source, _status: status } });
        assert.equal(result.status, 400, `Editor REST ${status} ${source}: ${restFact(result)}`);
        assert.equal(restFact(result).includes("youtubeId"), true, `Editor REST ${status}: error on youtubeId (${restFact(result)})`);
      }
    }
    // A playlist URL for a video and a video URL for a playlist are refused too.
    await assert.rejects(
      p().create({ collection: "learning-resources", locale: "id", data: { ...base, youtubeId: PLAYLIST_URL, _status: "draft" }, draft: true, depth: 0, overrideAccess: true }),
      { name: "ValidationError" },
    );
    const titles = await rows(sql`SELECT count(*)::int AS n FROM lh_resources_locales WHERE title LIKE ${`${fx("id", "BAD", "%")}`}`);
    assert.equal(Number(titles[0]?.n), 0, "no record of a refused save");

    // Valid URLs (video, playlist) and a draft save: only the ID in the record and every version row.
    // The draft first: a draft save skips field validation, so only the save hook protects it.
    const expected: [() => number, string][] = [
      [() => id("draft"), VIDEO_ID],
      [() => id("video"), VIDEO_ID],
      [() => id("playlist"), PLAYLIST_ID],
    ];
    for (const [resourceOf, value] of expected) {
      const resource = resourceOf();
      const main = await rows(sql`SELECT youtube_id FROM lh_resources WHERE id = ${resource}`);
      assert.deepEqual(main.map((row) => row.youtube_id), [value], `lh_resources.youtube_id of ${resource}`);
      const versions = await rows(sql`SELECT DISTINCT version_youtube_id AS v FROM _lh_resources_v WHERE parent_id = ${resource}`);
      assert.deepEqual(versions.map((row) => row.v), [value], `_lh_resources_v.version_youtube_id of ${resource}`);
    }
    const guideRow = await rows(sql`SELECT youtube_id FROM lh_resources WHERE id = ${id("guide")}`);
    assert.deepEqual(guideRow.map((row) => row.youtube_id), [null], "a guide stores no YouTube value");
  });

  test("LH5 a published toolkit is never public: no anonymous read, not in the catalog, no page, not in the sitemap or the homepage data", async () => {
    ids.toolkit = await createResource(
      "id",
      {
        type: "toolkit",
        materialLanguage: "id",
        title: fx("id", "T", "title"),
        summary: fx("id", "T", "summary"),
        slug: TOOLKIT_SLUG,
        enReady: true,
        sections: [{ label: fx("id", "T", "s1") }],
      },
      "published",
    );
    await updateResource(id("toolkit"), "en", { title: fx("en", "T", "title"), summary: fx("en", "T", "summary"), slug: TOOLKIT_SLUG }, "published");
    for (const locale of ["id", "en"] as const) {
      for (const draft of [false, true]) {
        assert.equal((await anonymousIds(locale, draft)).includes(id("toolkit")), false, `anonymous Local API read (${locale}, draft: ${draft}) of a toolkit`);
      }
      const page = await catalog(locale);
      assert.equal(page.status, 200, `GET /${locale}/learning-hub ${pageFact(page)}`);
      assert.equal(page.body.includes(fx(locale, "T", "title")), false, `${locale}: toolkit title in the catalog`);
      assert.equal(cardTypes(page.body).includes("toolkit"), false, `${locale}: toolkit card`);
      assert.equal(page.body.includes("data-lh-toolkits"), false, `${locale}: toolkit section (empty until M3-13)`);
      assertAbsent(await guidePage(locale, TOOLKIT_SLUG), `GET /${locale}/learning-hub/${TOOLKIT_SLUG}`, locale);
      const crawler = await guidePage(locale, TOOLKIT_SLUG, { "User-Agent": GOOGLEBOT });
      assert.equal(crawler.status, 404, `Googlebot toolkit page (${locale}): ${pageFact(crawler)}`);
    }
    assert.equal((await sitemapLocs()).some((loc) => loc.includes(TOOLKIT_SLUG)), false, "toolkit in the sitemap");
    const home = newestCards((await findPublicResources(p(), "id")) as ResourceDoc[], "id", 100);
    assert.equal(home.some((card) => card.id === id("toolkit")), false, "toolkit in the homepage data");
    const root = await getPage("/");
    assert.equal(root.body.includes(fx("id", "T", "title")), false, "toolkit title on /");
    const previewEntry = await getPage(`/api/preview?resource=${id("toolkit")}&locale=id`, { Cookie: `payload-token=${editor()}` });
    assertPreviewDenied(previewEntry, "Editor preview of a toolkit (M3-13)");
  });

  test("LH6 anonymous REST and GraphQL are denied without content; the Editor reads through REST", async () => {
    const reads = [
      "/api/learning-resources",
      "/api/learning-resources?locale=en",
      "/api/learning-resources?draft=true",
      "/api/learning-resources?locale=all",
      "/api/learning-resources?where[type][equals]=toolkit",
      `/api/learning-resources/${id("video")}`,
      `/api/learning-resources/${id("draft")}?draft=true`,
      "/api/learning-resources/versions",
      "/api/globals/learning-hub",
      "/api/globals/learning-hub?locale=id",
      "/api/globals/learning-hub?draft=true",
      "/api/globals/learning-hub?locale=en&fallback-locale=id",
      "/api/globals/learning-hub/versions",
    ];
    for (const path of reads) {
      const result = await rest("GET", path);
      assert.equal(result.status === 403 || result.status === 404, true, `anonymous GET ${path}: ${restFact(result)}`);
      assert.equal(JSON.stringify(result.body).includes(LABEL), false, `anonymous GET ${path}: content in the body`);
    }
    const create = await rest("POST", "/api/learning-resources?locale=id", {
      body: { type: "video", materialLanguage: "id", topic: topic(), title: fx("id", "ANON", "title"), summary: "x", youtubeId: VIDEO_ID, _status: "published" },
    });
    assert.equal(create.status, 403, `anonymous POST: ${restFact(create)}`);
    const patch = await rest("PATCH", `/api/learning-resources/${id("video")}?locale=id`, { body: { title: fx("id", "ANON", "title") } });
    assert.equal(patch.status === 403 || patch.status === 404, true, `anonymous PATCH: ${restFact(patch)}`);
    const global = await rest("POST", "/api/globals/learning-hub?locale=id", { body: { hero: { title: fx("id", "ANON", "H1") }, _status: "published" } });
    assert.equal(global.status, 403, `anonymous global POST: ${restFact(global)}`);
    for (const query of ["{ LearningResources { docs { title } } }", "{ LearningHub { hero { title } } }"]) {
      const graphql = await rest("POST", "/api/graphql", { body: { query } });
      assert.equal(graphql.status >= 400, true, `anonymous POST /api/graphql: ${restFact(graphql)}`);
      assert.equal(JSON.stringify(graphql.body).includes(LABEL), false, "GraphQL: content in the body");
    }
    const unchanged = await rows(sql`SELECT count(*)::int AS n FROM lh_resources_locales WHERE title LIKE ${`${fx("id", "ANON", "%")}`}`);
    assert.equal(Number(unchanged[0]?.n), 0, "anonymous writes changed nothing");

    const staff = await rest("GET", `/api/learning-resources/${id("draft")}?locale=id&depth=0&draft=true`, { token: editor() });
    assert.equal(staff.status, 200, `Editor GET draft: ${restFact(staff)}`);
    assert.equal(staff.body.title, fx("id", "D", "title"), "Editor reads the draft");
    const remove = await rest("DELETE", `/api/learning-resources/${id("draft")}`, { token: editor() });
    assert.equal(remove.status === 403 || remove.status === 404, true, `Editor DELETE (Admin only): ${restFact(remove)}`);
    assert.equal((await rows(sql`SELECT count(*)::int AS n FROM lh_resources WHERE id = ${id("draft")}`))[0]?.n, 1, "the record still exists");
  });

  test("LH7 guide preview is staff-only: ?resource= 404 without a staff session; Editor -> Draft Mode, draft + banner + noindex + no-store; cookie alone = public; exit targets", async (t) => {
    const guide = id("guide");
    // No staff session: denied while the latest version is the published one (and again below with a pending draft).
    const denyVisitors = async (when: string) => {
      assertPreviewDenied(await getPage(`/api/preview?resource=${guide}&locale=id`), `anonymous (${when})`);
      assertPreviewDenied(await getPage(`/api/preview?resource=${guide}&locale=id`, { Cookie: "payload-token=invalid.invalid.invalid" }), `invalid token (${when})`);
    };
    await denyVisitors("published, no draft");
    // A pending ID revision of the published guide.
    await updateResource(guide, "id", { title: fx("id", "G2", "title") }, "draft");
    await denyVisitors("pending draft");
    const asEditor = { Cookie: `payload-token=${editor()}` };
    for (const query of [
      `?resource=${guide}`,
      `?resource=${guide}&locale=xx`,
      `?resource=${guide}&locale=ID`,
      `?resource=${guide}&locale=id&id=${guide}`,
      `?resource=${guide}&locale=id&about=id`,
      `?resource=${id("video")}&locale=id`,
      `?resource=${id("playlist")}&locale=id`,
      "?resource=2147483647&locale=id",
      "?resource=abc&locale=id",
    ]) {
      assertPreviewDenied(await getPage(`/api/preview${query}`, asEditor), `Editor /api/preview${query}`);
    }
    const entry = await getPage(`/api/preview?resource=${guide}&locale=id&next=https://evil.example`, asEditor);
    assert.equal(entry.status, 307, `Editor entry: ${pageFact(entry)}`);
    const cookie = bypassCookie(entry);
    assert.ok(cookie?.value, `${BYPASS} not set`);
    assert.equal(cookie.attributes.includes("httponly"), true, `${BYPASS} HttpOnly`);
    bypass = cookie.value;
    assert.equal(target(entry), `/id/learning-hub/${GUIDE_SLUG.id}`, "target = the latest version's slug, not the query");

    const preview = await guidePage("id", GUIDE_SLUG.id, previewHeaders());
    assert.equal(preview.status, 200, `preview ${pageFact(preview)}`);
    assert.deepEqual(texts(preview.body, "h1"), [fx("id", "G2", "title")], "the pending revision in preview");
    assert.equal(preview.body.includes('data-preview="true"'), true, "data-preview=true");
    assert.equal(preview.body.includes("data-preview-banner"), true, "banner");
    assert.match(preview.body, /<input[^>]*name="resource"[^>]*value="\d+"/, "exit form resource field");
    assert.match(preview.body, new RegExp(`<input[^>]*name="slug"[^>]*value="${GUIDE_SLUG.id}"`), "exit form slug field");
    assert.equal(/<input[^>]*name="id"/.test(preview.body), false, "no publication id field");
    const robots = robotsContent(preview.body) ?? "";
    assert.equal(robots.includes("noindex") && robots.includes("nofollow"), true, `robots ${robots || "missing"}`);
    assert.equal(preview.cacheControl.includes("no-store"), true, `Cache-Control ${preview.cacheControl}`);
    assert.deepEqual(canonicals(preview.body), [], "no canonical in preview");
    for (const name of STAFF_ONLY) assert.equal(preview.body.includes(name), false, `"${name}" in the preview HTML`);

    for (const headers of [{ Cookie: draftCookie() }, { Cookie: `${draftCookie()}; payload-token=invalid.invalid.invalid` }]) {
      const visitor = await guidePage("id", GUIDE_SLUG.id, headers);
      assert.deepEqual(texts(visitor.body, "h1"), [fx("id", "G", "title")], "cookie without staff: the published version");
      assert.equal(visitor.body.includes("data-preview-banner"), false, "no banner without staff");
    }
    // The catalog never shows drafts, also in Draft Mode.
    const catalogPreview = await catalog("id", previewHeaders());
    assert.equal(catalogPreview.body.includes(fx("id", "G2", "title")), false, "draft title in the catalog");
    assert.equal(catalogPreview.body.includes(fx("id", "D", "title")), false, "draft resource in the catalog");

    const exitAs = async (fields: Record<string, string>, headers: Record<string, string>, label: string) => {
      const result = await postForm("/api/preview/exit", fields, headers);
      assert.equal(result.status, 303, `${label}: ${pageFact(result)}`);
      const cleared = bypassCookie(result);
      assert.equal(cleared !== undefined && cleared.value === "", true, `${label}: ${BYPASS} not cleared`);
      return target(result);
    };
    const fields = (locale: Locale, slug: string, resource = guide) => ({ resource: String(resource), locale, slug });
    assert.equal(await exitAs(fields("id", "posted-slug"), previewHeaders(), "Editor ID"), `/id/learning-hub/${GUIDE_SLUG.id}`, "staff: the live slug");
    assert.equal(await exitAs(fields("id", "x", id("draft")), previewHeaders(), "Editor, not a visible guide"), `/admin/collections/learning-resources/${id("draft")}`);
    for (const [label, headers] of [
      ["cookie only", { Cookie: draftCookie() }],
      ["invalid token", { Cookie: `${draftCookie()}; payload-token=invalid.invalid.invalid` }],
      ["no cookies", {}],
    ] as const) {
      assert.equal(await exitAs(fields("id", "posted-slug"), headers, `${label}`), "/id/learning-hub/posted-slug", `${label}: the posted path`);
      assert.equal(await exitAs(fields("id", "Bad Slug"), headers, `${label} bad slug`), "/", `${label}: invalid slug`);
    }
    const adminPage = await getPage(`/admin/collections/learning-resources/${guide}`, asEditor);
    t.diagnostic(`GET /admin/collections/learning-resources/<id> as the Editor: HTTP ${adminPage.status}`);
    assert.equal(adminPage.status, 200, `admin edit page ${pageFact(adminPage)}`);

    // Publication and About previews keep their readings.
    assertPreviewDenied(await getPage("/api/preview?id=1&resource=1&locale=id", asEditor), "id + resource");
    assertPreviewDenied(await getPage("/api/preview?about=id&resource=1&locale=id", asEditor), "about + resource");
  });

  test("LH9 sitemap: the catalogs that exist and the visible guides, with lastmod; never a draft, a video page or a toolkit", async () => {
    const locs = await sitemapLocs();
    for (const path of ["/id/learning-hub", "/en/learning-hub", `/id/learning-hub/${GUIDE_SLUG.id}`, `/en/learning-hub/${GUIDE_SLUG.en}`]) {
      assert.equal(locs.includes(`${SITE}${path}`), true, `${path} in the sitemap`);
    }
    assert.equal(new Set(locs).size, locs.length, "no duplicate <loc>");
    assert.equal(locs.some((loc) => loc.includes(TOOLKIT_SLUG)), false, "toolkit");
    assert.equal(locs.filter((loc) => loc.includes(`/learning-hub/${PREFIX}`)).length, 2, "only the two guide URLs of the fixtures");
    const body = (await getPage("/sitemap.xml")).body;
    assert.match(body, new RegExp(`<loc>${SITE.replace(/[.]/g, "\\.")}/id/learning-hub</loc>\\s*<lastmod>[^<]+</lastmod>`), "catalog lastmod");
    assert.match(body, new RegExp(`<loc>${SITE.replace(/[.]/g, "\\.")}/id/learning-hub/${GUIDE_SLUG.id}</loc>\\s*<lastmod>[^<]+</lastmod>`), "guide lastmod");
  });

  test("LH10 an Editor publishes and unpublishes through REST (DEC-015/016): shown and gone on the next request; all unpublished -> no catalog", async () => {
    const body = {
      type: "video",
      materialLanguage: "id",
      topic: topic(),
      title: fx("id", "E", "title"),
      summary: fx("id", "E", "summary"),
      youtubeId: `https://youtu.be/${VIDEO_ID}`,
      _status: "published",
    };
    const created = await rest("POST", "/api/learning-resources?locale=id&depth=0", { token: editor(), body });
    assert.equal(created.status, 201, `Editor publish: ${restFact(created)}`);
    const resource = (created.body.doc as { id?: number; youtubeId?: string } | undefined) ?? {};
    assert.equal(resource.youtubeId, VIDEO_ID, "REST answer holds the ID only");
    assert.equal(themeSection((await catalog("id")).body, topic())?.includes(fx("id", "E", "title")), true, "Editor's video in the catalog");

    const unpublished = await rest("PATCH", `/api/learning-resources/${resource.id}${UNPUBLISH_QUERY}`, { token: editor(), body: { _status: "draft" } });
    assert.equal(unpublished.status, 200, `Editor unpublish: ${restFact(unpublished)}`);
    assert.equal((await catalog("id")).body.includes(fx("id", "E", "title")), false, "unpublished video still in the catalog");

    for (const name of ["video", "playlist", "guide"] as const) {
      const result = await rest("PATCH", `/api/learning-resources/${id(name)}${UNPUBLISH_QUERY}`, { token: editor(), body: { _status: "draft" } });
      assert.equal(result.status, 200, `Editor unpublish ${name}: ${restFact(result)}`);
    }
    for (const locale of ["id", "en"] as const) {
      if (realCatalog[locale]) continue;
      assertAbsent(await catalog(locale), `GET /${locale}/learning-hub after unpublishing everything`, locale);
    }
    assertAbsent(await guidePage("id", GUIDE_SLUG.id), "unpublished guide", "id");
    const locs = await sitemapLocs();
    assert.equal(locs.some((loc) => loc.includes(`/learning-hub/${PREFIX}`)), false, "an unpublished guide in the sitemap");
    if (!realCatalog.id) assert.equal(locs.includes(`${SITE}/id/learning-hub`), false, "the empty catalog in the sitemap");
  });
});
