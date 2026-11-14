import assert from "node:assert/strict";
import { after, before, describe, test } from "node:test";
import type { Payload } from "payload";

import type { Publication } from "../../payload/payload-types";
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
import { BASE_URL, assertServerUp, getPage, login, pageFact, postForm, type PageResult } from "../helpers/http";
import { closeTestPayload, getTestPayload } from "../helpers/payload";
import { assertNotFoundPage, fetchAllIndexPages, robotsContent } from "../helpers/publication-pages";

/**
 * Staff draft preview (M3-05, DECISIONS §2.11 P11 A, P14 A). The admin
 * Preview button opens GET /api/preview?id=<id>: only an Editor/Admin
 * session gets Draft Mode (`__prerender_bypass`) and a 307 to the stored
 * draft's detail URL; everything else is the same 404 without the cookie.
 * The detail page in Draft Mode checks the staff session again on every
 * request; the Draft Mode cookie alone gives the public page. Index and
 * homepage never show drafts. POST /api/preview/exit clears the cookie.
 * Needs `next start` with the full env (bun run test:integration).
 *
 * Fixtures (slugs fixture-test-preview-*, titles "[FIXTURE] test preview *"):
 * Editor fixture-test-preview-editor@example.invalid (session token sent as
 * the `payload-token` cookie, never printed); ID draft-only `draft`; ID
 * `live`, published + public, with a pending draft revision titled T2.
 * Relations reuse the first existing author, topic and type. The Owner guard
 * runs before any fixture is written and after cleanup.
 */
const AREA = "preview";
const PREFIX = areaPrefix(AREA);
const LABEL = areaLabel(AREA);
const EDITOR_EMAIL = areaEmail(AREA, "editor");
const BYPASS = "__prerender_bypass";
const DRAFT_TITLE = `${LABEL}draft only`;
const LIVE_TITLE = `${LABEL}live version`;
const T2 = `${LABEL}T2 pending revision`;
/** Newer than any real record, so `live` leads the homepage while this file runs. */
const PUBLISHED_AT = "2099-01-05T03:00:00.000Z";
const STAFF_FIELDS = ["liveOnSite", "everPublished", "translationGroup", "_status"];
/** Larger than any id in the database, inside the Postgres integer range. */
const UNKNOWN_ID = "2147483647";

const slug = (name: string) => `${PREFIX}${name}`;

/** Value of the Draft Mode cookie a response sets, or undefined when it sets none. */
function bypassCookie(result: PageResult): { value: string; attributes: string } | undefined {
  for (const cookie of result.setCookies) {
    const [pair = "", ...attributes] = cookie.split(";");
    const separator = pair.indexOf("=");
    if (separator !== -1 && pair.slice(0, separator).trim() === BYPASS) {
      return { value: pair.slice(separator + 1).trim(), attributes: attributes.join(";").toLowerCase() };
    }
  }
  return undefined;
}

/** Pathname + search of a redirect target, relative to BASE_URL; the host must stay BASE_URL's. */
function target(result: PageResult): string {
  const url = new URL(result.location, BASE_URL);
  assert.equal(url.host, new URL(BASE_URL).host, `redirect host ${url.host}`);
  return `${url.pathname}${url.search}`;
}

/** The single deny answer of GET /api/preview: 404 "Not Found", noindex, no-store, no Draft Mode cookie. */
function assertDenied(result: PageResult, label: string): void {
  assert.equal(result.status, 404, `${label}: ${pageFact(result)}`);
  assert.equal(result.body, "Not Found", `${label}: body`);
  assert.equal(result.cacheControl, "no-store", `${label}: Cache-Control`);
  // A boolean, so a failure never prints the cookie value.
  assert.equal(bypassCookie(result) !== undefined, false, `${label}: ${BYPASS} set`);
}

describe("staff draft preview (M3-05: /api/preview, Draft Mode + staff session, exit)", () => {
  let payload: Payload | undefined;
  let editorToken: string | undefined;
  let bypass: string | undefined;
  const pubs = new Map<string, Publication>();

  function p(): Payload {
    if (!payload) throw new Error("Payload not initialised (before hook failed)");
    return payload;
  }

  function pub(name: string): Publication {
    const record = pubs.get(name);
    if (!record) throw new Error(`fixture ${name} not created (before hook failed)`);
    return record;
  }

  function editor(): string {
    if (!editorToken) throw new Error("editor login failed (before hook)");
    return `payload-token=${editorToken}`;
  }

  function draftCookie(): string {
    if (!bypass) throw new Error(`no ${BYPASS} cookie from PV4`);
    return `${BYPASS}=${bypass}`;
  }

  /** Draft Mode cookie and the Editor session, as the browser sends them after the Preview button. */
  const previewHeaders = () => ({ Cookie: `${draftCookie()}; ${editor()}` });

  before(async (t) => {
    payload = await getTestPayload();
    hookNote(t, `cleanup at start removed ${formatCounts(await cleanupArea(payload, AREA))}`);
    await assertOwnerIntact(payload);
    await assertServerUp();

    const relations = {
      publicationType: await firstId(p(), "publication-types"),
      topics: [await firstId(p(), "topics")],
      authors: [await firstId(p(), "authors")],
    };
    const create = async (name: string, title: string, status: "draft" | "published") => {
      const record = await p().create({
        collection: "publications",
        data: {
          title,
          slug: slug(name),
          locale: "id",
          translationGroup: await createGroup(p(), AREA, name),
          summary: `${LABEL}ringkasan ${name}`,
          ...relations,
          accessLevel: "public",
          publishedAt: PUBLISHED_AT,
          _status: status,
        },
        draft: status === "draft",
        depth: 0,
        overrideAccess: true,
      });
      pubs.set(name, record);
    };
    await create("draft", DRAFT_TITLE, "draft");
    await create("live", LIVE_TITLE, "published");
    // Pending draft revision: the stored record stays live with LIVE_TITLE.
    await p().update({ collection: "publications", id: pub("live").id, data: { title: T2 }, draft: true, depth: 0, overrideAccess: true });

    const secret = randomPassword();
    await p().create({ collection: "users", data: { email: EDITOR_EMAIL, password: secret, role: "editor" }, overrideAccess: true });
    editorToken = await login(EDITOR_EMAIL, secret);
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

  // ------------------------------------------------------------ GET /api/preview: who gets Draft Mode
  test("PV1 anonymous GET /api/preview?id=<draft|live>: 404, no Draft Mode cookie", async () => {
    for (const name of ["draft", "live"]) {
      assertDenied(await getPage(`/api/preview?id=${pub(name).id}`), `anonymous ${name}`);
    }
  });

  test("PV2 Editor session with an invalid, missing or unknown id: the same 404", async () => {
    for (const query of ["?id=abc", "?id=0", "?id=01", "?id=-1", "?id=1.5", "", "?slug=x", `?id=${UNKNOWN_ID}`]) {
      assertDenied(await getPage(`/api/preview${query}`, { Cookie: editor() }), `Editor /api/preview${query}`);
    }
  });

  test("PV3 invalid payload-token cookie: the same 404", async () => {
    const result = await getPage(`/api/preview?id=${pub("draft").id}`, { Cookie: "payload-token=invalid.invalid.invalid" });
    assertDenied(result, "invalid token");
  });

  test("PV4 Editor session: 307 to the stored draft's detail URL with the Draft Mode cookie", async () => {
    const live = await getPage(`/api/preview?id=${pub("live").id}`, { Cookie: editor() });
    assert.equal(live.status, 307, `live: ${pageFact(live)}`);
    const cookie = bypassCookie(live);
    assert.ok(cookie?.value, `live: ${BYPASS} not set`);
    assert.equal(cookie.attributes.includes("httponly"), true, `${BYPASS} is HttpOnly`);
    // Kept before the redirect checks, so PV5–PV10 do not depend on them.
    bypass = cookie.value;
    assert.equal(target(live), `/id/publications/${slug("live")}`);

    const draft = await getPage(`/api/preview?id=${pub("draft").id}&next=https://evil.example`, { Cookie: editor() });
    assert.equal(draft.status, 307, `draft: ${pageFact(draft)}`);
    assert.ok(bypassCookie(draft)?.value, `draft: ${BYPASS} not set`);
    assert.equal(target(draft), `/id/publications/${slug("draft")}`, "target from the stored record, not the query");
  });

  // ------------------------------------------------------------ the detail page in Draft Mode
  test("PV5 Draft Mode + Editor on the draft URL: 200, draft title, banner, data-preview=true, noindex, no-store", async () => {
    const path = `/id/publications/${slug("draft")}`;
    const result = await getPage(path, previewHeaders());
    assert.equal(result.status, 200, `GET ${path} ${pageFact(result)}`);
    const html = result.body;
    assert.equal(html.includes(`data-publication-detail="${slug("draft")}"`), true, "data-publication-detail");
    assert.equal(html.includes('data-preview="true"'), true, 'data-preview="true"');
    assert.equal(html.includes("data-preview-banner"), true, "data-preview-banner");
    assert.equal(html.includes("Pratinjau draf: belum tentu terlihat pengunjung."), true, "banner text");
    assert.match(html, /<form[^>]*action="\/api\/preview\/exit"[^>]*method="post"/, "exit form");
    assert.equal(html.includes(`>${DRAFT_TITLE}</h1>`), true, "H1 = draft title");
    const robots = robotsContent(html) ?? "";
    assert.equal(robots.includes("noindex") && robots.includes("nofollow"), true, `robots ${robots || "missing"}`);
    assert.equal(result.cacheControl.includes("no-store"), true, `Cache-Control ${result.cacheControl}`);
    for (const field of STAFF_FIELDS) {
      assert.equal(html.includes(field), false, `"${field}" in the preview HTML`);
    }
  });

  test("PV6 Draft Mode cookie without a staff session: exactly the public result (draft not found, live title, no banner)", async () => {
    const onlyBypass = { Cookie: draftCookie() };
    const invalidSession = { Cookie: `${draftCookie()}; payload-token=invalid.invalid.invalid` };
    for (const headers of [onlyBypass, invalidSession]) {
      const draft = await getPage(`/id/publications/${slug("draft")}`, headers);
      assertNotFoundPage(draft, "draft URL without a staff session");
      assert.equal(draft.body.includes(DRAFT_TITLE), false, "draft title without a staff session");
      assert.equal(draft.body.includes("data-preview-banner"), false, "banner on the draft URL");

      const live = await getPage(`/id/publications/${slug("live")}`, headers);
      assert.equal(live.status, 200, `live ${pageFact(live)}`);
      assert.equal(live.body.includes(`>${LIVE_TITLE}</h1>`), true, "live title");
      assert.equal(live.body.includes(T2), false, "T2 without a staff session");
      assert.equal(live.body.includes("data-preview-banner"), false, "banner without a staff session");
      assert.equal(live.body.includes('data-preview="false"'), true, 'data-preview="false"');
    }
  });

  test("PV7 pending revision: Draft Mode + Editor shows T2 with the banner; without cookies the live title", async () => {
    const path = `/id/publications/${slug("live")}`;
    const preview = await getPage(path, previewHeaders());
    assert.equal(preview.status, 200, `preview ${pageFact(preview)}`);
    assert.equal(preview.body.includes(`>${T2}</h1>`), true, "T2 in preview");
    assert.equal(preview.body.includes(LIVE_TITLE), false, "live title in preview");
    assert.equal(preview.body.includes("data-preview-banner"), true, "banner in preview");

    const visitor = await getPage(path);
    assert.equal(visitor.status, 200, `visitor ${pageFact(visitor)}`);
    assert.equal(visitor.body.includes(`>${LIVE_TITLE}</h1>`), true, "live title for visitors");
    assert.equal(visitor.body.includes(T2), false, "T2 for visitors");
    assert.equal(visitor.body.includes("data-preview-banner"), false, "banner for visitors");
    assert.equal(robotsContent(visitor.body), null, "no robots meta on the public detail");
  });

  test("PV8 /id/publications (all pages) and / with Draft Mode + Editor: never a draft, T2 or the banner", async () => {
    const index = await fetchAllIndexPages("id", "", previewHeaders());
    assert.equal(index.titles.get(slug("live")), LIVE_TITLE, "live row shows the live title");
    assert.equal(index.slugs.includes(slug("draft")), false, "draft row on the index");
    for (const body of index.bodies) {
      for (const hidden of [T2, DRAFT_TITLE, "data-preview-banner"]) {
        assert.equal(body.includes(hidden), false, `"${hidden}" on the index`);
      }
    }
    const home = await getPage("/", previewHeaders());
    assert.equal(home.status, 200, `GET / ${pageFact(home)}`);
    assert.equal(home.body.includes(LIVE_TITLE), true, "live title on / (newest dated record)");
    for (const hidden of [T2, DRAFT_TITLE, "data-preview-banner"]) {
      assert.equal(home.body.includes(hidden), false, `"${hidden}" on /`);
    }
  });

  // ------------------------------------------------------------ POST /api/preview/exit
  test("PV9 POST /api/preview/exit: 303 to the valid detail URL (else /) and the Draft Mode cookie is cleared", async () => {
    const exit = await postForm("/api/preview/exit", { locale: "id", slug: slug("live") }, previewHeaders());
    assert.equal(exit.status, 303, pageFact(exit));
    assert.equal(target(exit), `/id/publications/${slug("live")}`);
    const cleared = bypassCookie(exit);
    assert.ok(cleared, `no ${BYPASS} Set-Cookie on the exit response`);
    assert.equal(cleared.value === "", true, `${BYPASS} value not empty`);
    assert.equal(
      /expires=thu, 01 jan 1970/.test(cleared.attributes) || /max-age=0(?:;|$)/.test(cleared.attributes),
      true,
      `${BYPASS} not expired: ${cleared.attributes}`,
    );

    const invalid: Record<string, string>[] = [
      { locale: "xx", slug: slug("live") },
      { locale: "id", slug: "../x" },
      { locale: "id", slug: "https://evil.example" },
      { locale: "id", slug: "//evil.example" },
      {},
    ];
    for (const fields of invalid) {
      const result = await postForm("/api/preview/exit", fields, { Cookie: draftCookie() });
      assert.equal(result.status, 303, `${JSON.stringify(fields)}: ${pageFact(result)}`);
      assert.equal(target(result), "/", `${JSON.stringify(fields)}: target`);
    }
  });

  test("PV10 GET /api/preview/exit: 405 (POST only)", async () => {
    const result = await getPage("/api/preview/exit", { Cookie: draftCookie() });
    assert.equal(result.status, 405, pageFact(result));
    assert.equal(bypassCookie(result) !== undefined, false, `${BYPASS} changed by GET`);
  });
});
