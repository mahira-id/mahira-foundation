import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, test } from "node:test";
import { NextRequest } from "next/server";

import { AUTH_ENV_NAMES } from "../../lib/auth/env";
import { CMS_ENV_NAMES } from "../../payload/env";
import { PAYLOAD_TOKEN_COOKIE, config, isPublicAdminPath, proxy } from "../../proxy";

// proxy.ts is the CMS gate (M3-00/M3-01): when the CMS is off, the matched
// paths answer 404 and are never indexed or cached. When the CMS is on, a GET
// to a protected admin page without a Payload auth cookie gets a 307 to the
// login page (item 1c, DECISIONS §2.10). Since M5-02 it is also the account
// gate (DECISIONS §2.18): the account routes answer the same 404 while
// accounts are off, and GET /{locale}/account without a session cookie gets
// a 307 to the locale's login page. Values are dummies; no test here reaches
// Supabase (a request with a session cookie is the integration area `auth`).
const GATE_NAMES = [...new Set([...CMS_ENV_NAMES, ...AUTH_ENV_NAMES]), "VERCEL_ENV"] as const;
const ORIGIN = "http://localhost:3100";
const AUTH_STATES = ["accounts off", "accounts on"] as const;
let saved: Record<string, string | undefined> = {};

function clearGateEnv(): void {
  for (const name of GATE_NAMES) delete process.env[name];
}

function setAll(): void {
  for (const name of CMS_ENV_NAMES) process.env[name] = "unit-test-dummy-value-1234";
}

function setAuth(): void {
  process.env.APP_SUPABASE_URL ||= "https://unit-test-dummy.supabase.co";
  process.env.APP_SUPABASE_PUBLISHABLE_KEY = "unit-test-dummy-publishable-key";
}

function request(path: string, options: { method?: string; cookie?: string } = {}): NextRequest {
  const headers: Record<string, string> = {};
  if (options.cookie !== undefined) headers.cookie = options.cookie;
  return new NextRequest(`${ORIGIN}${path}`, { method: options.method ?? "GET", headers });
}

beforeEach(() => {
  saved = {};
  for (const name of GATE_NAMES) saved[name] = process.env[name];
  clearGateEnv();
});

afterEach(() => {
  clearGateEnv();
  for (const name of GATE_NAMES) {
    if (saved[name] !== undefined) process.env[name] = saved[name];
  }
});

function assertGateClosed(response: Response, label = ""): void {
  assert.equal(response.status, 404, `${label} status`);
  assert.equal(response.headers.get("X-Robots-Tag"), "noindex", `${label} X-Robots-Tag`);
  assert.equal(response.headers.get("Cache-Control"), "no-store", `${label} Cache-Control`);
  assert.equal(response.headers.get("x-middleware-next"), null, `${label}: a closed gate must not pass the request on`);
}

function assertPassedOn(response: Response, label: string): void {
  assert.equal(response.headers.get("x-middleware-next"), "1", `${label}: passed on to the app`);
  assert.equal(response.headers.get("location"), null, `${label}: no redirect`);
}

/** Asserts a 307 to /admin/login and returns its `redirect` parameter (null when absent). */
function loginRedirectTarget(response: Response, label: string): string | null {
  assert.equal(response.status, 307, `${label}: status`);
  const location = new URL(response.headers.get("location") ?? "", ORIGIN);
  assert.equal(`${location.origin}${location.pathname}`, `${ORIGIN}/admin/login`, `${label}: Location`);
  return location.searchParams.get("redirect");
}

const ACCOUNT_PATHS = [
  "/id/login",
  "/en/login",
  "/id/register",
  "/en/forgot-password",
  "/id/reset-password",
  "/en/reset-password",
  "/id/account",
  "/en/account",
  "/id/auth/login",
  "/en/auth/register",
  "/id/auth/confirm",
  "/id/auth/logout",
] as const;

describe("proxy.ts — CMS gate", () => {
  test("CMS env absent: 404 with X-Robots-Tag noindex and Cache-Control no-store", async () => {
    assertGateClosed(await proxy(request("/admin")));
  });

  test("VERCEL_ENV=production with full CMS env: 404 (Production stays off)", async () => {
    setAll();
    process.env.VERCEL_ENV = "production";
    assertGateClosed(await proxy(request("/admin")));
  });

  test("CMS off: 404 before the login check, with or without an auth cookie", async () => {
    for (const path of [
      "/admin",
      "/admin/collections/topics",
      "/admin/login",
      "/api/users/me",
      "/id/publications",
      "/id/about",
      "/en/about",
      "/id/learning-hub",
      "/en/learning-hub/fixture-guide",
    ]) {
      assertGateClosed(await proxy(request(path)), path);
    }
    assertGateClosed(await proxy(request("/admin", { cookie: `${PAYLOAD_TOKEN_COOKIE}=abc` })));
    assertGateClosed(await proxy(request("/admin", { method: "POST" })));
  });

  test("full CMS env: request passes through (x-middleware-next = 1)", async () => {
    setAll();
    const response = await proxy(request("/id/publications"));
    assert.equal(response.headers.get("x-middleware-next"), "1");
    assert.notEqual(response.status, 404);
  });

  test("PX7 matcher: /admin, /api, publication indexes, About (M3-09), Learning Hubs (M3-12) and the account routes (M5-02), 20 entries", () => {
    assert.deepEqual(config.matcher, [
      "/admin/:path*",
      "/api/:path*",
      "/id/publications/:path*",
      "/en/publications/:path*",
      "/id/about/:path*",
      "/en/about/:path*",
      "/id/learning-hub/:path*",
      "/en/learning-hub/:path*",
      "/id/login/:path*",
      "/en/login/:path*",
      "/id/register/:path*",
      "/en/register/:path*",
      "/id/forgot-password/:path*",
      "/en/forgot-password/:path*",
      "/id/reset-password/:path*",
      "/en/reset-password/:path*",
      "/id/account/:path*",
      "/en/account/:path*",
      "/id/auth/:path*",
      "/en/auth/:path*",
    ]);
  });
});

for (const auth of AUTH_STATES) {
  describe(`proxy.ts — admin login redirect (CMS on, item 1c, ${auth})`, () => {
    beforeEach(() => {
      setAll();
      if (auth === "accounts on") setAuth();
    });

    test("PX1 GET /admin without a cookie: 307 to /admin/login without a redirect parameter", async () => {
      assert.equal(loginRedirectTarget(await proxy(request("/admin")), "GET /admin"), null);
      assert.equal(loginRedirectTarget(await proxy(request("/admin?foo=1")), "GET /admin?foo=1"), null);
    });

    test("PX2 deep link without a cookie: redirect = path + query, without _rsc and an earlier redirect", async () => {
      const cases: Array<[string, string]> = [
        ["/admin/collections/topics", "/admin/collections/topics"],
        ["/admin/collections/topics?limit=10", "/admin/collections/topics?limit=10"],
        ["/admin/collections/topics?limit=10&_rsc=abc123", "/admin/collections/topics?limit=10"],
        ["/admin/collections/topics/2?_rsc=abc123", "/admin/collections/topics/2"],
        ["/admin/account?redirect=%2Fadmin%2Fx&tab=1", "/admin/account?tab=1"],
        ["/admin/globals/settings", "/admin/globals/settings"],
      ];
      for (const [path, expected] of cases) {
        assert.equal(loginRedirectTarget(await proxy(request(path)), `GET ${path}`), expected, `GET ${path}`);
      }
    });

    test("PX3 Payload's public admin routes pass without a cookie", async () => {
      const paths = [
        "/admin/login",
        "/admin/login?redirect=%2Fadmin%2Fcollections%2Ftopics",
        "/admin/forgot",
        "/admin/reset/some-token",
        "/admin/create-first-user",
        "/admin/logout",
        "/admin/logout-inactivity",
        "/admin/unauthorized",
        "/admin/users/verify/some-token",
      ];
      for (const path of paths) assertPassedOn(await proxy(request(path)), `GET ${path}`);
    });

    test("PX4 isPublicAdminPath: protected admin pages are not public", () => {
      for (const path of ["/admin", "/admin/", "/admin/account", "/admin/collections/users", "/admin/users/verify", "/admin/users/verify/a/b"]) {
        assert.equal(isPublicAdminPath(path), false, path);
      }
    });

    test("PX5 a Payload auth cookie passes; an empty one, another cookie or a Supabase session cookie does not", async () => {
      assertPassedOn(await proxy(request("/admin", { cookie: `${PAYLOAD_TOKEN_COOKIE}=any.token.value` })), "GET /admin with cookie");
      assertPassedOn(
        await proxy(request("/admin/collections/topics", { cookie: `other=1; ${PAYLOAD_TOKEN_COOKIE}=x` })),
        "deep link with cookie",
      );
      loginRedirectTarget(await proxy(request("/admin", { cookie: `${PAYLOAD_TOKEN_COOKIE}=` })), "empty cookie");
      loginRedirectTarget(await proxy(request("/admin", { cookie: "payload-token-other=x; session=1" })), "other cookies only");
      loginRedirectTarget(await proxy(request("/admin", { cookie: "sb-dmtbieetvgkvncadbkmd-auth-token=base64-x" })), "public session cookie");
    });

    test("PX6 non-GET admin requests (Server Functions) and other matched paths pass without a cookie", async () => {
      for (const method of ["POST", "HEAD", "PUT"]) assertPassedOn(await proxy(request("/admin", { method })), `${method} /admin`);
      for (const path of [
        "/api/users/me",
        "/api/users/login",
        "/api/publications",
        "/id/publications",
        "/en/publications",
        "/id/about",
        "/en/about",
        "/id/learning-hub",
        "/en/learning-hub/fixture-guide",
      ]) {
        assertPassedOn(await proxy(request(path)), `GET ${path}`);
      }
    });
  });
}

describe("proxy.ts — account gate (M5-02)", () => {
  test("PX8 accounts off (no key, key alone with VERCEL_ENV=production, or the full set in production): every account path 404 for GET and POST, also with the CMS on", async () => {
    const setups: Array<[string, () => void]> = [
      ["no env", () => { }],
      ["CMS on, no key", () => setAll()],
      ["CMS on, key, VERCEL_ENV=production", () => {
        setAll();
        setAuth();
        process.env.VERCEL_ENV = "production";
      }],
    ];
    for (const [label, setup] of setups) {
      clearGateEnv();
      setup();
      for (const path of ACCOUNT_PATHS) {
        for (const method of ["GET", "POST"]) {
          assertGateClosed(await proxy(request(path, { method, cookie: "sb-dmtbieetvgkvncadbkmd-auth-token=base64-x" })), `${label}: ${method} ${path}`);
        }
      }
    }
  });

  test("PX9 accounts on, GET /{locale}/account without a session cookie: 307 to that locale's login page, no query, private no-store, noindex", async () => {
    setAll();
    setAuth();
    for (const locale of ["id", "en"]) {
      for (const cookie of [undefined, "payload-token=staff", "sb-dmtbieetvgkvncadbkmd-auth-token=", "sb-dmtbieetvgkvncadbkmd-auth-token-code-verifier=x"]) {
        const response = await proxy(request(`/${locale}/account?next=https://evil.example`, { cookie }));
        const label = `${locale} ${cookie ?? "no cookie"}`;
        assert.equal(response.status, 307, label);
        assert.equal(response.headers.get("location"), `${ORIGIN}/${locale}/login`, label);
        assert.equal(response.headers.get("cache-control"), "private, no-store", label);
        assert.equal(response.headers.get("x-robots-tag"), "noindex", label);
        assert.equal(response.headers.get("x-middleware-next"), null, label);
      }
    }
  });

  test("PX10 accounts on: the other account pages, every handler path and non-GET /account pass on with noindex", async () => {
    setAll();
    setAuth();
    for (const path of ACCOUNT_PATHS) {
      for (const method of ["GET", "POST"]) {
        if (method === "GET" && path.endsWith("/account")) continue;
        const response = await proxy(request(path, { method }));
        assertPassedOn(response, `${method} ${path}`);
        assert.equal(response.headers.get("x-robots-tag"), "noindex", `${method} ${path}`);
      }
    }
  });
});
