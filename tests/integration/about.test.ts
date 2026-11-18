import assert from "node:assert/strict";
import { after, before, describe, test } from "node:test";
import type { Payload } from "payload";

import type { About } from "../../payload/payload-types";
import { diffAbout, restoreAbout, snapshotAbout, summarizeAbout, type AboutSnapshot } from "../helpers/about-state";
import { adminFormHasValue, adminFormLocale, adminLocaleLabel } from "../helpers/admin-form";
import {
  areaEmail,
  areaLabel,
  areaPrefix,
  assertOwnerIntact,
  cleanupArea,
  countLeftovers,
  createGroup,
  firstId,
  formatCounts,
  hookNote,
  randomPassword,
  totalOf,
} from "../helpers/fixtures";
import { BASE_URL, assertServerUp, getPage, login, pageFact, postForm, rest, restFact, type PageResult } from "../helpers/http";
import { closeTestPayload, getTestPayload } from "../helpers/payload";
import { assertNotFoundPage, decodeAmp, robotsContent } from "../helpers/publication-pages";

/**
 * About page `/{locale}/about` from the `about` global (M3-09, DECISIONS
 * §2.15 decisions 1, 3, 4 + 4b(iii), 6, 7B, 8), against `next start` with
 * the full env (bun run test:integration). A locale's page exists only when
 * the global is published and that locale's required fields are filled; EN
 * also needs "Versi EN siap tayang" (`enReady`). Anonymous REST is denied;
 * the staff preview runs through `/api/preview?about=<locale>` + Draft Mode
 * and checks the staff session on every request; the sitemap lists a page
 * only while it exists. The admin edit view starts each locale's form with
 * that locale's stored values (AB11, M3-12b; tests/helpers/admin-form.ts).
 *
 * The global is a singleton on the shared `mahira-cms`: `before` snapshots
 * every About row (tests/helpers/about-state.ts) before any write, a
 * snapshot error aborts the file; then the published About (if any) is
 * unpublished, so every test starts from the same known state. `after`
 * restores the snapshot and proves equality with a second snapshot (rows of
 * every About table and the normalized Local API views), printing both
 * summaries (counts and booleans only). Keep that order when adding tests.
 *
 * Fixture text only: "[FIXTURE] test about <locale> <tag> <part>"; contact
 * email fixture-test-about-contact@example.invalid; Editor
 * fixture-test-about-editor@example.invalid (session token sent as the
 * `payload-token` cookie or JWT, never printed). The Owner guard runs
 * before any write and after cleanup.
 */
type Locale = "id" | "en";
type AboutInput = Partial<Pick<About, "hero" | "sections" | "seo" | "contactEmail" | "enReady">>;

const AREA = "about";
const LABEL = areaLabel(AREA);
const PREFIX = areaPrefix(AREA);
const EDITOR_EMAIL = areaEmail(AREA, "editor");
const CONTACT = areaEmail(AREA, "contact");
const SITE = "https://mahira.id";
const BYPASS = "__prerender_bypass";
const ANCHOR = "fixture-section-two";
const GOOGLEBOT = "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)";
/** The admin Unpublish button of a global (Payload 3.93.0): POST with these query params and body {_status:"draft"}. */
const UNPUBLISH_QUERY = "?depth=0&fallback-locale=null&unpublishAllLocales=true";
const STAFF_ONLY = ["enReady", "en_ready", "_status", "Versi EN siap tayang"];

const fx = (locale: Locale, tag: string, part: string) => `${LABEL}${locale} ${tag} ${part}`;

/** One locale's About content with fixture text; every element of the model once. */
function aboutData(locale: Locale, tag: string): AboutInput {
  const t = (part: string) => fx(locale, tag, part);
  return {
    hero: {
      eyebrow: t("eyebrow"),
      title: t("title"),
      lead: `${t("lead one")}\n\n${t("lead two")}`,
      ctas: [
        { label: t("cta anchor"), kind: "anchor", anchor: ANCHOR },
        { label: t("cta publications"), kind: "publications" },
      ],
    },
    sections: [
      { label: t("s1 label"), heading: t("s1 heading"), body: `${t("s1 p1")}\n\n${t("s1 p2")}`, quote: t("s1 quote") },
      {
        anchor: ANCHOR,
        label: t("s2 label"),
        body: t("s2 intro"),
        lists: [
          {
            style: "numbered",
            items: [
              { title: t("n1 title"), text: t("n1 text") },
              { title: t("n2 title"), subtitle: t("n2 subtitle"), text: t("n2 text") },
            ],
          },
          { heading: t("l2 heading"), intro: t("l2 intro"), style: "bulleted", items: [{ text: t("b1 text") }] },
        ],
        outro: t("s2 outro"),
        ctas: [{ label: t("cta email"), kind: "email" }],
      },
    ],
    seo: { title: t("seo title"), description: t("seo description") },
  };
}

// ---------------------------------------------------------------- HTML readers
type Attributes = Record<string, string>;

function attributes(tag: string): Attributes {
  const out: Attributes = {};
  for (const match of tag.matchAll(/([a-zA-Z:-]+)="([^"]*)"/g)) out[(match[1] as string).toLowerCase()] = decodeAmp(match[2] as string);
  return out;
}

function tags(html: string, name: "meta" | "link"): Attributes[] {
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

/** The header About links (`<a data-header-about>`): their attributes and text. */
function headerLinks(html: string): (Attributes & { text: string })[] {
  return [...html.matchAll(/(<a\s[^>]*\bdata-header-about\b[^>]*>)([^<]*)<\/a>/g)].map((match) => ({
    ...attributes(match[1] as string),
    text: match[2] as string,
  }));
}

/** Value of the Draft Mode cookie a response sets, or undefined when it sets none. */
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

/** Pathname + search of a redirect target; the host must stay BASE_URL's. */
function target(result: PageResult): string {
  const url = new URL(result.location, BASE_URL);
  assert.equal(url.host, new URL(BASE_URL).host, `redirect host ${url.host}`);
  return `${url.pathname}${url.search}`;
}

/** The deny answer of GET /api/preview: 404 "Not Found", no-store, no Draft Mode cookie. */
function assertPreviewDenied(result: PageResult, label: string): void {
  assert.equal(result.status, 404, `${label}: ${pageFact(result)}`);
  assert.equal(result.body, "Not Found", `${label}: body`);
  assert.equal(result.cacheControl, "no-store", `${label}: Cache-Control`);
  assert.equal(bypassCookie(result) !== undefined, false, `${label}: ${BYPASS} set`);
}

/** No About page: the Mahira not-found page with noindex and no fixture text at all. */
function assertAboutAbsent(result: PageResult, label: string, locale: Locale): void {
  assertNotFoundPage(result, label, locale);
  assert.equal(result.body.includes("data-about-page"), false, `${label}: data-about-page`);
  assert.equal(result.body.includes(LABEL), false, `${label}: fixture text in the response`);
}

/** A rendered About page of `locale` with the content of `tag`. */
function assertAboutPage(result: PageResult, label: string, locale: Locale, tag: string, preview = false): void {
  assert.equal(result.status, 200, `${label}: ${pageFact(result)}`);
  const html = result.body;
  const t = (part: string) => fx(locale, tag, part);
  assert.equal(html.includes(`data-about-page="${locale}"`), true, `${label}: data-about-page`);
  assert.equal(html.includes(`data-preview="${preview}"`), true, `${label}: data-preview=${preview}`);
  assert.deepEqual(texts(html, "h1"), [t("title")], `${label}: one H1 = hero title`);
  assert.deepEqual(texts(html, "h2"), [t("s1 heading"), t("s2 label")], `${label}: H2 = heading, else label`);
  for (const part of ["eyebrow", "lead one", "lead two", "s1 label", "s1 p1", "s1 p2", "s2 intro", "n1 title", "n2 subtitle", "b1 text", "l2 heading", "s2 outro"]) {
    assert.equal(html.includes(`>${t(part)}<`), true, `${label}: "${part}"`);
  }
  assert.match(html, /<blockquote[^>]*data-about-quote/, `${label}: quote`);
  assert.match(html, /<ol[^>]*data-about-list="numbered"/, `${label}: numbered list`);
  assert.match(html, /<ul[^>]*data-about-list="bulleted"/, `${label}: bulleted list`);
  assert.match(html, new RegExp(`<section[^>]*id="${ANCHOR}"`), `${label}: section anchor`);
  // Hero CTAs (anchor, publications), then the section CTA (email).
  assert.deepEqual(ctaHrefs(html), [`#${ANCHOR}`, `/${locale}/publications`, `mailto:${CONTACT}`], `${label}: CTA hrefs`);
}

/** `href` of every `<a data-about-cta>` in document order. */
function ctaHrefs(html: string): string[] {
  return (html.match(/<a\s[^>]*>/g) ?? [])
    .filter((tag) => /\sdata-about-cta(?:[\s=>]|$)/.test(tag))
    .map((tag) => decodeAmp(/\shref="([^"]*)"/.exec(tag)?.[1] ?? ""));
}

describe("About page (M3-09: about global, /{locale}/about, preview, SEO, sitemap)", () => {
  let payload: Payload | undefined;
  let snapshot: AboutSnapshot | undefined;
  let editorToken: string | undefined;
  let bypass: string | undefined;

  function p(): Payload {
    if (!payload) throw new Error("Payload not initialised (before hook failed)");
    return payload;
  }

  function editor(): string {
    if (!editorToken) throw new Error("editor login failed (before hook)");
    return editorToken;
  }

  function draftCookie(): string {
    if (!bypass) throw new Error(`no ${BYPASS} cookie from AB7`);
    return `${BYPASS}=${bypass}`;
  }

  const previewHeaders = () => ({ Cookie: `${draftCookie()}; payload-token=${editor()}` });

  async function write(locale: Locale, data: AboutInput, status: "draft" | "published"): Promise<void> {
    await p().updateGlobal({
      slug: "about",
      locale,
      data: { ...data, _status: status },
      draft: status === "draft",
      depth: 0,
      overrideAccess: true,
    });
  }

  /** The stored published document in one locale (Local API, access off). */
  async function stored(locale: Locale): Promise<About> {
    return p().findGlobal({ slug: "about", locale, fallbackLocale: false, draft: false, depth: 0, overrideAccess: true });
  }

  /**
   * H1 of an anonymous Local API read, the way public code reads (no user,
   * access on), also with `draft: true` (public code never passes it; the
   * access filter must still hide drafts). Null when the read gives nothing.
   */
  async function anonymousTitle(locale: Locale, draft: boolean): Promise<string | null> {
    const doc = (await p().findGlobal({ slug: "about", locale, fallbackLocale: false, draft, depth: 0, overrideAccess: false })) as Partial<About>;
    return doc?.hero?.title ?? null;
  }

  const page = (locale: Locale, headers: Record<string, string> = {}) => getPage(`/${locale}/about`, headers);

  async function sitemapLocs(): Promise<string[]> {
    const result = await getPage("/sitemap.xml");
    assert.equal(result.status, 200, `GET /sitemap.xml ${pageFact(result)}`);
    return [...result.body.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1] as string);
  }

  async function sitemapBody(): Promise<string> {
    return (await getPage("/sitemap.xml")).body;
  }

  before(async (t) => {
    payload = await getTestPayload();
    // Snapshot first: an error here aborts the file before any write.
    snapshot = await snapshotAbout(payload);
    hookNote(t, `About before: ${summarizeAbout(snapshot)}`);
    hookNote(t, `cleanup at start removed ${formatCounts(await cleanupArea(payload, AREA))}`);
    await assertOwnerIntact(payload);
    await assertServerUp();

    const secret = randomPassword();
    await p().create({ collection: "users", data: { email: EDITOR_EMAIL, password: secret, role: "editor" }, overrideAccess: true });
    editorToken = await login(EDITOR_EMAIL, secret);

    // Known start: no published About (unpublish like the admin button, content kept).
    const published = (snapshot.views.published ?? {}) as { _status?: unknown };
    if (published._status === "published") {
      await p().updateGlobal({ slug: "about", data: { _status: "draft" }, unpublishAllLocales: true, depth: 0, overrideAccess: true });
    }
  });

  after(async (t) => {
    try {
      if (payload && snapshot) {
        await restoreAbout(payload, snapshot);
        const now = await snapshotAbout(payload);
        const diff = diffAbout(snapshot, now);
        hookNote(t, `About after restore: ${summarizeAbout(now)}`);
        hookNote(t, `About before/after differing paths: ${diff.length}`);
        if (diff.length !== 0) throw new Error(`About global not restored (${diff.length} paths): ${diff.slice(0, 10).join(", ")}`);
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

  test("AB1 draft only (never published or unpublished): /id/about and /en/about not found + noindex + notFound() digest; Googlebot 404; no fixture text", async () => {
    await write("id", { ...aboutData("id", "T1"), contactEmail: CONTACT }, "draft");
    for (const draft of [false, true]) {
      assert.equal(await anonymousTitle("id", draft), null, `anonymous Local API read (draft: ${draft}) of an unpublished About`);
    }
    for (const locale of ["id", "en"] as const) {
      assertAboutAbsent(await page(locale), `GET /${locale}/about`, locale);
      const crawler = await page(locale, { "User-Agent": GOOGLEBOT });
      assert.equal(crawler.status, 404, `Googlebot GET /${locale}/about: ${pageFact(crawler)}`);
      assert.equal(crawler.body.includes(LABEL), false, `Googlebot GET /${locale}/about: fixture text`);
    }
  });

  test("AB2 publish ID: 200 with H1, sections, lists, quote, CTA hrefs; canonical, no hreflang, <title> = SEO title, description, og:image /og/site", async () => {
    await write("id", { ...aboutData("id", "T1"), contactEmail: CONTACT, enReady: false }, "published");
    const result = await page("id");
    assertAboutPage(result, "GET /id/about", "id", "T1");
    const html = result.body;
    assert.equal(robotsContent(html), null, "no robots meta on the public About");
    assert.deepEqual(canonicals(html), [`${SITE}/id/about`], "canonical");
    assert.deepEqual(hreflangs(html), {}, "no hreflang without the EN page");
    assert.equal(html.includes(`<title>${fx("id", "T1", "seo title")}</title>`), true, "<title> = SEO title (absolute)");
    assert.deepEqual(meta(html, "description"), [fx("id", "T1", "seo description")], "meta description");
    assert.deepEqual(meta(html, "og:type"), ["website"], "og:type");
    assert.deepEqual(meta(html, "og:url"), [`${SITE}/id/about`], "og:url");
    assert.deepEqual(meta(html, "og:locale"), ["id_ID"], "og:locale");
    assert.deepEqual(meta(html, "og:image"), [`${SITE}/og/site`], "og:image");
    // The EN page stays absent: nothing EN was written and the checkbox is off.
    assertAboutAbsent(await page("en"), "GET /en/about", "en");
    const crawler = await page("id", { "User-Agent": GOOGLEBOT });
    assert.equal(crawler.status, 200, `Googlebot GET /id/about: ${pageFact(crawler)}`);
    assert.deepEqual(texts(crawler.body, "h1"), [fx("id", "T1", "title")], "Googlebot: H1");
  });

  test("AB9 no staff field or the EN checkbox in the public HTML", async () => {
    const result = await page("id");
    assert.equal(result.status, 200, pageFact(result));
    for (const name of STAFF_ONLY) assert.equal(result.body.includes(name), false, `"${name}" in the HTML`);
  });

  test("AB6 anonymous REST GET (plain, ?locale=en, ?draft=true, fallback), /versions and POST: 403 without content; GraphQL closed; Editor REST read 200", async () => {
    const reads = [
      "/api/globals/about",
      "/api/globals/about?locale=en",
      "/api/globals/about?draft=true",
      "/api/globals/about?locale=all",
      "/api/globals/about?locale=en&fallback-locale=id",
      "/api/globals/about/versions",
    ];
    for (const path of reads) {
      const result = await rest("GET", path);
      assert.equal(result.status, 403, `anonymous GET ${path}: ${restFact(result)}`);
      assert.equal(JSON.stringify(result.body).includes(LABEL), false, `anonymous GET ${path}: content in the body`);
    }
    const post = await rest("POST", "/api/globals/about", { body: { hero: { title: fx("id", "ANON", "title") }, _status: "published" } });
    assert.equal(post.status, 403, `anonymous POST: ${restFact(post)}`);
    const graphql = await rest("POST", "/api/graphql", { body: { query: "{ About { hero { title } } }" } });
    assert.equal(graphql.status >= 400, true, `anonymous POST /api/graphql: ${restFact(graphql)}`);
    assert.equal(JSON.stringify(graphql.body).includes(LABEL), false, "GraphQL: content in the body");
    assert.equal((await stored("id")).hero?.title, fx("id", "T1", "title"), "anonymous POST changed nothing");

    // `locale` as the admin sends it: with `localization.fallback: false`, Payload 3.93.0 REST
    // leaves req.locale unset without the parameter (OBSERVED: hero without its localized fields).
    const staff = await rest("GET", "/api/globals/about?locale=id&depth=0", { token: editor() });
    assert.equal(staff.status, 200, `Editor GET: ${restFact(staff)}`);
    assert.equal((staff.body.hero as { title?: string } | undefined)?.title, fx("id", "T1", "title"), "Editor reads the content");
    const versions = await rest("GET", "/api/globals/about/versions?limit=1&depth=0", { token: editor() });
    assert.equal(versions.status, 200, `Editor GET /versions: ${restFact(versions)}`);
  });

  test("AB5 pending draft over the published version: the public page keeps the published text", async () => {
    await write("id", aboutData("id", "T2"), "draft");
    for (const draft of [false, true]) {
      assert.equal(await anonymousTitle("id", draft), fx("id", "T1", "title"), `anonymous Local API read (draft: ${draft}) gives the published H1`);
    }
    const result = await page("id");
    assertAboutPage(result, "GET /id/about", "id", "T1");
    assert.equal(result.body.includes(fx("id", "T2", "title")), false, "draft H1 on the public page");
    assert.equal(result.body.includes(fx("id", "T2", "seo title")), false, "draft SEO title on the public page");
    assert.equal(result.body.includes("data-preview-banner"), false, "banner on the public page");
  });

  test("AB7 preview: /api/preview?about= is staff-only; Draft Mode + Editor shows the draft with banner, noindex, no-store; cookie alone = public; exit targets", async (t) => {
    // Who gets Draft Mode.
    assertPreviewDenied(await getPage("/api/preview?about=id"), "anonymous ?about=id");
    assertPreviewDenied(await getPage("/api/preview?about=id", { Cookie: "payload-token=invalid.invalid.invalid" }), "invalid token");
    for (const query of ["?about=xx", "?about=ID", "?about=", "?about=id&id=1", "?id=1&about=en"]) {
      assertPreviewDenied(await getPage(`/api/preview${query}`, { Cookie: `payload-token=${editor()}` }), `Editor /api/preview${query}`);
    }
    const entry = await getPage("/api/preview?about=id&next=https://evil.example", { Cookie: `payload-token=${editor()}` });
    assert.equal(entry.status, 307, `Editor ?about=id: ${pageFact(entry)}`);
    const cookie = bypassCookie(entry);
    assert.ok(cookie?.value, `${BYPASS} not set`);
    assert.equal(cookie.attributes.includes("httponly"), true, `${BYPASS} is HttpOnly`);
    bypass = cookie.value;
    assert.equal(target(entry), "/id/about", "target from the validated locale, not the query");
    const entryEn = await getPage("/api/preview?about=en", { Cookie: `payload-token=${editor()}` });
    assert.equal(entryEn.status, 307, `Editor ?about=en: ${pageFact(entryEn)}`);
    assert.equal(target(entryEn), "/en/about");

    // The page in Draft Mode with the Editor session: the latest version (T2).
    const preview = await page("id", previewHeaders());
    assertAboutPage(preview, "preview GET /id/about", "id", "T2", true);
    assert.equal(preview.body.includes("data-preview-banner"), true, "banner");
    assert.match(preview.body, /<form[^>]*action="\/api\/preview\/exit"[^>]*method="post"/, "exit form");
    assert.match(preview.body, /<input[^>]*name="about"[^>]*value="id"/, "exit form about field");
    assert.equal(/<input[^>]*name="id"/.test(preview.body), false, "no publication id field");
    const robots = robotsContent(preview.body) ?? "";
    assert.equal(robots.includes("noindex") && robots.includes("nofollow"), true, `robots ${robots || "missing"}`);
    assert.equal(preview.cacheControl.includes("no-store"), true, `Cache-Control ${preview.cacheControl}`);
    assert.deepEqual(canonicals(preview.body), [], "no canonical in preview");
    assert.equal(preview.body.includes(fx("id", "T1", "title")), false, "published H1 in preview");
    for (const name of STAFF_ONLY) assert.equal(preview.body.includes(name), false, `"${name}" in the preview HTML`);

    // Draft Mode cookie without a staff session: exactly the public result.
    for (const headers of [{ Cookie: draftCookie() }, { Cookie: `${draftCookie()}; payload-token=invalid.invalid.invalid` }]) {
      const visitor = await page("id", headers);
      assertAboutPage(visitor, "cookie without staff GET /id/about", "id", "T1");
      assert.equal(visitor.body.includes(fx("id", "T2", "title")), false, "draft H1 without a staff session");
      assert.equal(visitor.body.includes("data-preview-banner"), false, "banner without a staff session");
    }

    // Exit: staff -> public About when it exists, else /admin/globals/about; no staff -> /{l}/about.
    const exitAs = async (fields: Record<string, string>, headers: Record<string, string>, label: string) => {
      const result = await postForm("/api/preview/exit", fields, headers);
      assert.equal(result.status, 303, `${label}: ${pageFact(result)}`);
      const cleared = bypassCookie(result);
      assert.equal(cleared !== undefined && cleared.value === "", true, `${label}: ${BYPASS} not cleared`);
      return target(result);
    };
    assert.equal(await exitAs({ about: "id", locale: "id" }, previewHeaders(), "Editor ID"), "/id/about");
    assert.equal(await exitAs({ about: "en", locale: "en" }, previewHeaders(), "Editor EN (no EN page)"), "/admin/globals/about");
    for (const [label, headers] of [
      ["cookie only", { Cookie: draftCookie() }],
      ["invalid token", { Cookie: `${draftCookie()}; payload-token=invalid.invalid.invalid` }],
      ["no cookies", {}],
    ] as const) {
      assert.equal(await exitAs({ about: "id", locale: "id" }, headers, `${label} ID`), "/id/about");
      assert.equal(await exitAs({ about: "en", locale: "en" }, headers, `${label} EN`), "/en/about");
      assert.equal(await exitAs({ about: "xx", locale: "id" }, headers, `${label} invalid`), "/");
    }
    const admin = await getPage("/admin/globals/about", { Cookie: `payload-token=${editor()}` });
    t.diagnostic(`GET /admin/globals/about as the Editor: HTTP ${admin.status}`);
    assert.equal(admin.status, 200, `GET /admin/globals/about ${pageFact(admin)}`);
  });

  test("AB8 sitemap: /id/about while the ID page exists, never /en/about without the EN page", async () => {
    const locs = await sitemapLocs();
    assert.equal(locs.includes(`${SITE}/id/about`), true, "/id/about in the sitemap");
    assert.equal(locs.includes(`${SITE}/en/about`), false, "/en/about in the sitemap");
    assert.match(await sitemapBody(), new RegExp(`<loc>${SITE.replace(/[.]/g, "\\.")}/id/about</loc>\\s*<lastmod>[^<]+</lastmod>`), "lastmod");
  });

  test("AB3 EN: required EN field empty with the checkbox on -> not found; complete without the checkbox -> not found; complete + checkbox -> 200 + mutual hreflang", async () => {
    // (a) Half-written EN (meta description empty) saved as a draft, then published from ID with the checkbox on.
    const half = aboutData("en", "E1");
    await write("en", { ...half, seo: { title: fx("en", "E1", "seo title"), description: "" } }, "draft");
    await write("id", { ...aboutData("id", "T2"), contactEmail: CONTACT, enReady: true }, "published");
    const live = await stored("en");
    assert.equal(live.hero?.title, fx("en", "E1", "title"), "precondition: the half-written EN went live with the ID publish");
    assert.equal(live.seo?.description ?? "", "", "precondition: EN meta description empty");
    assert.equal(live.enReady, true, "precondition: checkbox on");
    assertAboutAbsent(await page("en"), "half-written EN + checkbox", "en");
    let id = await page("id");
    assertAboutPage(id, "GET /id/about", "id", "T2");
    assert.deepEqual(hreflangs(id.body), {}, "no hreflang while EN is absent");

    // (b) Complete EN, checkbox off.
    await write("en", { ...aboutData("en", "E2"), enReady: false }, "published");
    assertAboutAbsent(await page("en"), "complete EN without the checkbox", "en");
    assert.equal((await sitemapLocs()).includes(`${SITE}/en/about`), false, "/en/about in the sitemap without the checkbox");

    // (c) Complete EN + checkbox.
    await write("en", { enReady: true }, "published");
    const en = await page("en");
    assertAboutPage(en, "GET /en/about", "en", "E2");
    const pair = { id: `${SITE}/id/about`, en: `${SITE}/en/about` };
    assert.deepEqual(hreflangs(en.body), pair, "EN hreflang");
    assert.deepEqual(canonicals(en.body), [`${SITE}/en/about`], "EN canonical");
    assert.deepEqual(meta(en.body, "og:locale"), ["en_GB"], "EN og:locale");
    assert.equal(en.body.includes(LABEL + "id "), false, "ID text on the EN page");
    id = await page("id");
    assert.deepEqual(hreflangs(id.body), pair, "ID hreflang");
    assert.equal(id.body.includes(LABEL + "en "), false, "EN text on the ID page");
    const locs = await sitemapLocs();
    assert.equal(locs.includes(`${SITE}/id/about`) && locs.includes(`${SITE}/en/about`), true, "both About pages in the sitemap");
  });

  test("AB4 unpublish like the admin button (Editor REST): both pages not found on the next request, out of the sitemap", async () => {
    const result = await rest("POST", `/api/globals/about${UNPUBLISH_QUERY}`, { token: editor(), body: { _status: "draft" } });
    assert.equal(result.status, 200, `Editor unpublish: ${restFact(result)}`);
    assert.equal((await stored("id")).hero?.title, fx("id", "T2", "title"), "precondition: unpublish keeps the content");
    for (const locale of ["id", "en"] as const) {
      for (const draft of [false, true]) {
        assert.equal(await anonymousTitle(locale, draft), null, `anonymous Local API read (${locale}, draft: ${draft}) after unpublish`);
      }
      assertAboutAbsent(await page(locale), `unpublished GET /${locale}/about`, locale);
      const crawler = await page(locale, { "User-Agent": GOOGLEBOT });
      assert.equal(crawler.status, 404, `Googlebot unpublished /${locale}/about: ${pageFact(crawler)}`);
    }
    const locs = await sitemapLocs();
    assert.equal(locs.some((loc) => loc.endsWith("/about")), false, "an About page in the sitemap after unpublish");
  });

  test("AB10 an Editor publishes through REST (DEC-016): the page shows the new version on the next request", async () => {
    const body = { ...aboutData("id", "T3"), contactEmail: CONTACT, enReady: false, _status: "published" };
    const result = await rest("POST", "/api/globals/about?locale=id&depth=0", { token: editor(), body });
    assert.equal(result.status, 200, `Editor publish: ${restFact(result)}`);
    assertAboutPage(await page("id"), "GET /id/about after the Editor publish", "id", "T3");
    assertAboutAbsent(await page("en"), "GET /en/about (checkbox off)", "en");
  });

  // ------------------------------------------------------------ UI (FEAT-B): links and page structure
  const unpublishAll = () =>
    p().updateGlobal({ slug: "about", data: { _status: "draft" }, unpublishAllLocales: true, depth: 0, overrideAccess: true });

  test("ABUI1 header link 'Tentang'/'About' on the index, the detail and the About page only while that locale's About exists; the About page marks it current", async () => {
    // A published + public publication of the area for the detail page (cleaned by the area cleanup).
    const authorId = await firstId(p(), "authors");
    const typeDoc = await p().create({ collection: "publication-types", data: { name: `${LABEL}Jenis`, slug: `${PREFIX}type` }, locale: "id", overrideAccess: true });
    await p().update({ collection: "publication-types", id: typeDoc.id, data: { name: `${LABEL}Jenis EN` }, locale: "en", overrideAccess: true });
    const type = await p().update({ collection: "publication-types", id: typeDoc.id, data: { isActive: true }, locale: "id", overrideAccess: true });
    const topicDoc = await p().create({ collection: "topics", data: { name: `${LABEL}Topik`, slug: `${PREFIX}topic` }, locale: "id", overrideAccess: true });
    await p().update({ collection: "topics", id: topicDoc.id, data: { name: `${LABEL}Topik EN` }, locale: "en", overrideAccess: true });
    const topic = await p().update({ collection: "topics", id: topicDoc.id, data: { isActive: true }, locale: "id", overrideAccess: true });
    const publicationSlug = `${PREFIX}pub`;
    await p().create({
      collection: "publications",
      data: {
        title: `${LABEL}publication`,
        slug: publicationSlug,
        locale: "id",
        translationGroup: await createGroup(p(), AREA, "pub"),
        summary: `${LABEL}summary`,
        publicationType: type.id,
        topics: [topic.id],
        authors: [authorId],
        accessLevel: "public",
        publishedAt: "2090-01-05T03:00:00.000Z",
        _status: "published",
      },
      depth: 0,
      overrideAccess: true,
    });
    const idPages = ["/id/publications", `/id/publications/${publicationSlug}`];
    const links = async (path: string) => {
      const result = await getPage(path);
      assert.equal(result.status, 200, `GET ${path} ${pageFact(result)}`);
      return headerLinks(result.body);
    };

    // 1. ID published, EN not: the ID header shows the link (text, href), the EN header none.
    await write("id", { ...aboutData("id", "T3"), contactEmail: CONTACT, enReady: false }, "published");
    for (const path of idPages) {
      const found = await links(path);
      assert.equal(found.length, 1, `GET ${path}: ${found.length} header About links`);
      assert.equal(found[0]?.href, "/id/about", `GET ${path}: href`);
      assert.equal(found[0]?.text, "Tentang", `GET ${path}: text`);
      assert.equal(found[0]?.["aria-current"], undefined, `GET ${path}: not current`);
    }
    assert.deepEqual(await links("/en/publications"), [], "EN index without the EN About page");
    const own = await links("/id/about");
    assert.deepEqual(own.map((link) => [link.href, link["aria-current"]]), [["/id/about", "page"]], "the About page marks its own link current");

    // 2. EN complete + checkbox: the EN header shows "About".
    await write("en", { ...aboutData("en", "E3"), enReady: true }, "published");
    const en = await links("/en/publications");
    assert.deepEqual(en.map((link) => [link.href, link.text]), [["/en/about", "About"]], "EN index with the EN About page");
    assert.deepEqual((await links("/en/about")).map((link) => [link.href, link["aria-current"]]), [["/en/about", "page"]], "EN About page");

    // 3. Checkbox off: the EN link is gone with the page; ID stays.
    await write("id", { enReady: false }, "published");
    assert.deepEqual(await links("/en/publications"), [], "EN index after the checkbox is off");
    assert.equal((await links("/id/publications")).length, 1, "ID index keeps its link");

    // 4. Unpublished: no link anywhere and no About page.
    await unpublishAll();
    for (const path of ["/id/publications", `/id/publications/${publicationSlug}`, "/en/publications"]) {
      assert.deepEqual(await links(path), [], `GET ${path} after unpublish`);
    }
  });

  test("ABUI2 homepage link 'Selengkapnya tentang Mahira' to /id/about only while the ID About page exists; #tentang stays", async () => {
    const homepage = async () => {
      const result = await getPage("/");
      assert.equal(result.status, 200, `GET / ${pageFact(result)}`);
      assert.equal(result.body.includes('id="tentang"'), true, "#tentang section");
      return (result.body.match(/<a\s[^>]*>/g) ?? []).filter((tag) => /\sdata-home-about-link(?:[\s=>]|$)/.test(tag)).map(attributes);
    };
    assert.deepEqual(await homepage(), [], "link while About is unpublished");
    await write("id", { ...aboutData("id", "T3"), contactEmail: CONTACT, enReady: false }, "published");
    const shown = await homepage();
    assert.deepEqual(shown.map((link) => link.href), ["/id/about"], "link while the ID About page exists");
    assert.equal((await getPage("/")).body.includes("Selengkapnya tentang Mahira"), true, "link text");
    // Only the ID page counts: EN published alone does not matter, and the link stays /id/about.
    await write("en", { ...aboutData("en", "E3"), enReady: true }, "published");
    assert.deepEqual((await homepage()).map((link) => link.href), ["/id/about"], "link with both pages");
    await unpublishAll();
    assert.deepEqual(await homepage(), [], "link after unpublish");
    await write("id", { ...aboutData("id", "T3"), contactEmail: CONTACT, enReady: false }, "published");
  });

  test("ABUI3 page structure: #main, one H1, H2 per section (label above heading only when both), H3 of a list, ol/ul, blockquote, item titles in <strong>, CTA labels; the preview banner is the first element of main", async () => {
    const result = await page("id");
    assertAboutPage(result, "GET /id/about", "id", "T3");
    const html = result.body;
    const t = (part: string) => fx("id", "T3", part);
    assert.match(html, /<main[^>]*\sid="main"/, "main#main");
    assert.equal((html.match(/<main[\s>]/g) ?? []).length, 1, "one main");
    assert.equal((html.match(/<section[^>]*\sdata-about-section/g) ?? []).length, 2, "two sections");
    assert.deepEqual(texts(html, "h3"), [t("l2 heading")], "H3 = list heading");
    assert.deepEqual(texts(html, "p").filter((text) => text === t("s1 label") || text === t("s2 label")), [t("s1 label")], "label above the heading only when both are set");
    assert.match(html, new RegExp(`<p[^>]*data-about-label[^>]*>${t("s1 label").replace(/[[\]]/g, "\\$&")}</p>`), "label marker");
    for (const title of ["n1 title", "n2 title"]) {
      assert.match(html, new RegExp(`<p[^>]*data-about-item-title[^>]*><strong>${t(title).replace(/[[\]]/g, "\\$&")}</strong></p>`), `item title ${title} in <strong>`);
    }
    assert.match(html, new RegExp(`<strong>${t("n2 subtitle").replace(/[[\]]/g, "\\$&")}</strong>`), "item sub-label in <strong>");
    assert.match(html, new RegExp(`<blockquote[^>]*data-about-quote[^>]*><p[^>]*>${t("s1 quote").replace(/[[\]]/g, "\\$&")}</p></blockquote>`), "quote text in its blockquote");
    for (const label of ["cta anchor", "cta publications", "cta email"]) {
      assert.equal(html.includes(`>${t(label)}<`), true, `CTA label "${label}"`);
    }
    assert.equal(html.includes('class="skip-link"') && html.includes('href="#main"'), true, "skip link to #main");

    // Preview: the banner is the first element in main; the page structure is the same.
    await write("id", aboutData("id", "T4"), "draft");
    const preview = await page("id", previewHeaders());
    assertAboutPage(preview, "preview GET /id/about", "id", "T4", true);
    assert.match(preview.body, /<main[^>]*\sid="main"[^>]*><aside[^>]*data-preview-banner/, "banner is the first element of main");
    assert.equal((preview.body.match(/<aside[^>]*data-preview-banner/g) ?? []).length, 1, "one banner element");
  });

  test("AB11 (M3-12b) the admin edit view starts each locale with its stored values (hero, CTAs, sections, lists, SEO), posts to that locale and shows its name", async () => {
    await write("id", { ...aboutData("id", "F"), contactEmail: CONTACT }, "published");
    // A pending EN draft: the EN form starts with it; the ID form keeps the published ID text.
    await write("en", aboutData("en", "F"), "draft");
    const paths: [string, string][] = [
      ["hero.eyebrow", "eyebrow"],
      ["hero.title", "title"],
      ["hero.ctas.0.label", "cta anchor"],
      ["sections.0.label", "s1 label"],
      ["sections.0.heading", "s1 heading"],
      ["sections.0.quote", "s1 quote"],
      ["sections.1.lists.0.items.1.subtitle", "n2 subtitle"],
      ["sections.1.lists.1.heading", "l2 heading"],
      ["sections.1.outro", "s2 outro"],
      ["seo.title", "seo title"],
    ];
    for (const [locale, other, name] of [["id", "en", "Bahasa Indonesia"], ["en", "id", "English"]] as const) {
      const path = `/admin/globals/about?locale=${locale}`;
      const result = await getPage(path, { Cookie: `payload-token=${editor()}` });
      assert.equal(result.status, 200, `GET ${path} as the Editor: ${pageFact(result)}`);
      assert.equal(adminLocaleLabel(result.body), name, `${path}: locale shown in the admin header`);
      assert.equal(adminFormLocale(result.body), locale, `${path}: locale of the form action`);
      for (const [field, part] of paths) {
        assert.equal(adminFormHasValue(result.body, field, fx(locale, "F", part)), true, `${locale} form: ${field} starts with the stored value`);
      }
      assert.equal(result.body.includes(`${LABEL}${other} `), false, `${locale} form: text of ${other}`);
    }
  });
});
