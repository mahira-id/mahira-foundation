import assert from "node:assert/strict";
import { after, before, describe, test } from "node:test";
import type { Payload } from "payload";

import {
  areaEmail,
  assertOwnerIntact,
  cleanupArea,
  countLeftovers,
  formatCounts,
  hookNote,
  randomPassword,
  totalOf,
} from "../helpers/fixtures";
import { BASE_URL, assertServerUp, getPage, login, pageFact, rest, restFact, type PageResult } from "../helpers/http";
import { closeTestPayload, getTestPayload } from "../helpers/payload";

/**
 * Admin login redirect (item 1c, DECISIONS §2.10). Before the fix, opening
 * `/admin` without a login and then logging in looped between `/admin` and
 * `/admin/login` in the browser: Payload's anonymous redirect was rendered
 * inside the `/admin` page, the client router kept it as that page, and
 * replayed it after login. Now proxy.ts answers a protected admin GET without
 * a Payload auth cookie with an HTTP 307, so no anonymous `/admin` page reaches
 * the browser, and the admin page awaits `connection()` before RootPage.
 * Needs `next start` with the full env (bun run test:integration).
 *
 * The browser part (router cache, hidden Activity routes) is not automated
 * here: no browser test runner is installed (DECISIONS §2.10 answer 3 a). The
 * Playwright MCP runs in the task folder and the Owner's Preview steps
 * (ENVIRONMENTS §3.1) cover it.
 *
 * Fixtures: user fixture-test-admin-editor@example.invalid. The Owner guard
 * runs before any fixture is written and after cleanup. The session token is
 * sent as the `payload-token` cookie, the way the browser sends it, and is
 * never printed.
 */
const AREA = "admin";
const EDITOR_EMAIL = areaEmail(AREA, "editor");
const LOGIN_PATH = "/admin/login";

/** Pathname + search of a redirect target, relative to BASE_URL. */
function normalise(target: string): string {
  const url = new URL(target.replace(/&amp;/g, "&"), BASE_URL);
  return `${url.pathname}${url.search}`;
}

/**
 * Every redirect a response asks for: the Location of a 3xx, the redirects
 * Next streams inside a page (`NEXT_REDIRECT` digest in the RSC data) and the
 * meta refresh Next adds to HTML after the shell was sent.
 */
function redirectTargets(page: PageResult): string[] {
  const targets: string[] = [];
  if (page.status >= 300 && page.status < 400 && page.location) targets.push(page.location);
  for (const match of page.body.matchAll(/NEXT_REDIRECT;(?:push|replace);([^;"\\]+);\d{3}/g)) targets.push(match[1]);
  for (const match of page.body.matchAll(/http-equiv="refresh" content="\d+;\s*url=([^"]+)"/g)) targets.push(match[1]);
  return [...new Set(targets.map(normalise))];
}

const toLogin = (targets: string[]) => targets.filter((target) => target === LOGIN_PATH || target.startsWith(`${LOGIN_PATH}?`));

function describePage(page: PageResult): string {
  const targets = redirectTargets(page);
  return `${pageFact(page)}; redirects=${targets.length > 0 ? targets.join(",") : "none"}`;
}

/**
 * RSC request (`RSC: 1`), as the client router sends it on navigation. Next
 * 16 answers an RSC request whose `_rsc` value does not match its router
 * headers with a 307 to the same path with the right `_rsc`; that one
 * redirect is followed. Any other response is returned as it is.
 */
async function getRsc(path: string, headers: Record<string, string> = {}): Promise<PageResult> {
  const rscHeaders = { ...headers, RSC: "1" };
  const first = await getPage(path, rscHeaders);
  if (first.status !== 307 || !first.location) return first;
  const target = new URL(first.location, BASE_URL);
  if (target.pathname !== new URL(path, BASE_URL).pathname || !target.searchParams.has("_rsc")) return first;
  return getPage(`${target.pathname}${target.search}`, rscHeaders);
}

describe("admin login redirect (item 1c: proxy 307, staff session on /admin)", () => {
  let payload: Payload | undefined;
  let editorToken: string | undefined;

  function cookie(): Record<string, string> {
    if (!editorToken) throw new Error("editor login failed (before hook)");
    return { Cookie: `payload-token=${editorToken}` };
  }

  before(async (t) => {
    payload = await getTestPayload();
    hookNote(t, `cleanup at start removed ${formatCounts(await cleanupArea(payload, AREA))}`);
    await assertOwnerIntact(payload);
    await assertServerUp();
    const secret = randomPassword();
    await payload.create({
      collection: "users",
      data: { email: EDITOR_EMAIL, password: secret, role: "editor" },
      overrideAccess: true,
    });
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

  // ------------------------------------------------------------ without a cookie: proxy.ts
  test("AD1 anonymous GET /admin: HTTP 307 to /admin/login without a redirect parameter", async () => {
    const page = await getPage("/admin");
    assert.equal(page.status, 307, describePage(page));
    assert.equal(normalise(page.location), LOGIN_PATH, describePage(page));
  });

  test("AD2 anonymous deep link: HTTP 307 to /admin/login?redirect=<path and query>, also for an RSC request", async () => {
    const expected = `${LOGIN_PATH}?redirect=${encodeURIComponent("/admin/collections/topics?limit=10")}`;
    const page = await getPage("/admin/collections/topics?limit=10");
    assert.equal(page.status, 307, describePage(page));
    assert.equal(normalise(page.location), expected, describePage(page));
    const rsc = await getRsc("/admin/collections/topics?limit=10");
    assert.equal(rsc.status, 307, `RSC: ${describePage(rsc)}`);
    assert.equal(normalise(rsc.location), expected, `RSC: ${describePage(rsc)}`);
  });

  test("AD3 Payload's public admin routes are not redirected by the proxy: 200", async () => {
    const paths = [
      "/admin/login",
      "/admin/forgot",
      "/admin/reset/not-a-token",
      "/admin/logout-inactivity",
      "/admin/create-first-user",
      "/admin/unauthorized",
      "/admin/users/verify/not-a-token",
    ];
    for (const path of paths) {
      const page = await getPage(path);
      assert.equal(page.status, 200, `${path}: ${describePage(page)}`);
    }
  });

  test("AD4 anonymous POST /admin (Server Function endpoint) and GET /api/users/me are not redirected", async () => {
    const post = await rest("POST", "/admin", { body: {} });
    assert.ok(post.status !== 0 && (post.status < 300 || post.status >= 400), `POST /admin: ${restFact(post)}`);
    const me = await rest("GET", "/api/users/me");
    assert.equal(me.status, 200, `GET /api/users/me: ${restFact(me)}`);
    assert.equal(me.body.user ?? null, null, "anonymous /api/users/me has no user");
  });

  // ------------------------------------------------------------ with a cookie: Payload decides
  test("AD5 staff session: GET /admin renders the dashboard, no redirect to /admin/login (document and RSC)", async () => {
    const page = await getPage("/admin", cookie());
    assert.equal(page.status, 200, describePage(page));
    assert.deepEqual(toLogin(redirectTargets(page)), [], `document: ${describePage(page)}`);
    assert.equal(page.body.includes("dashboard"), true, "dashboard markup in the /admin HTML");
    const rsc = await getRsc("/admin", cookie());
    assert.equal(rsc.status, 200, `RSC: ${describePage(rsc)}`);
    assert.deepEqual(toLogin(redirectTargets(rsc)), [], `RSC: ${describePage(rsc)}`);
  });

  test("AD6 staff session: /admin/login sends the user on to /admin (the server sees the session)", async () => {
    const page = await getRsc(LOGIN_PATH, cookie());
    assert.equal(page.status, 200, describePage(page));
    assert.ok(redirectTargets(page).includes("/admin"), describePage(page));
  });

  test("AD7 invalid cookie: the proxy passes it on and Payload still redirects to /admin/login itself", async (t) => {
    // The proxy only checks that a cookie exists. This is the case that can
    // still bounce once in the browser (Next bug vercel/next.js#92767).
    const page = await getRsc("/admin", { Cookie: "payload-token=invalid.invalid.invalid" });
    t.diagnostic(`invalid cookie, GET /admin (RSC): ${describePage(page)}`);
    assert.equal(page.status, 200, describePage(page));
    assert.ok(toLogin(redirectTargets(page)).length > 0, describePage(page));
  });
});
