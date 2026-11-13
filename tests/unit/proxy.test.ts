import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, test } from "node:test";
import { NextRequest } from "next/server";

import { CMS_ENV_NAMES } from "../../payload/env";
import { PAYLOAD_TOKEN_COOKIE, config, isPublicAdminPath, proxy } from "../../proxy";

// proxy.ts is the CMS gate (M3-00/M3-01): when the CMS is off, the matched
// paths answer 404 and are never indexed or cached. When the CMS is on, a GET
// to a protected admin page without a Payload auth cookie gets a 307 to the
// login page (item 1c, DECISIONS §2.10). Values are dummies.
const GATE_NAMES = [...CMS_ENV_NAMES, "VERCEL_ENV"] as const;
const ORIGIN = "http://localhost:3100";
let saved: Record<string, string | undefined> = {};

function clearGateEnv(): void {
  for (const name of GATE_NAMES) delete process.env[name];
}

function setAll(): void {
  for (const name of CMS_ENV_NAMES) process.env[name] = "unit-test-dummy-value-1234";
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

function assertGateClosed(response: Response): void {
  assert.equal(response.status, 404);
  assert.equal(response.headers.get("X-Robots-Tag"), "noindex");
  assert.equal(response.headers.get("Cache-Control"), "no-store");
  assert.equal(response.headers.get("x-middleware-next"), null, "a closed gate must not pass the request on");
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

describe("proxy.ts — CMS gate", () => {
  test("CMS env absent: 404 with X-Robots-Tag noindex and Cache-Control no-store", () => {
    assertGateClosed(proxy(request("/admin")));
  });

  test("VERCEL_ENV=production with full CMS env: 404 (Production stays off)", () => {
    setAll();
    process.env.VERCEL_ENV = "production";
    assertGateClosed(proxy(request("/admin")));
  });

  test("CMS off: 404 before the login check, with or without an auth cookie", () => {
    for (const path of ["/admin", "/admin/collections/topics", "/admin/login", "/api/users/me", "/id/publications"]) {
      assertGateClosed(proxy(request(path)));
    }
    assertGateClosed(proxy(request("/admin", { cookie: `${PAYLOAD_TOKEN_COOKIE}=abc` })));
    assertGateClosed(proxy(request("/admin", { method: "POST" })));
  });

  test("full CMS env: request passes through (x-middleware-next = 1)", () => {
    setAll();
    const response = proxy(request("/id/publications"));
    assert.equal(response.headers.get("x-middleware-next"), "1");
    assert.notEqual(response.status, 404);
  });

  test("matcher covers exactly /admin, /api and both publication indexes", () => {
    assert.deepEqual(config.matcher, [
      "/admin/:path*",
      "/api/:path*",
      "/id/publications/:path*",
      "/en/publications/:path*",
    ]);
  });
});

describe("proxy.ts — admin login redirect (CMS on, item 1c)", () => {
  beforeEach(() => setAll());

  test("PX1 GET /admin without a cookie: 307 to /admin/login without a redirect parameter", () => {
    assert.equal(loginRedirectTarget(proxy(request("/admin")), "GET /admin"), null);
    assert.equal(loginRedirectTarget(proxy(request("/admin?foo=1")), "GET /admin?foo=1"), null);
  });

  test("PX2 deep link without a cookie: redirect = path + query, without _rsc and an earlier redirect", () => {
    const cases: Array<[string, string]> = [
      ["/admin/collections/topics", "/admin/collections/topics"],
      ["/admin/collections/topics?limit=10", "/admin/collections/topics?limit=10"],
      ["/admin/collections/topics?limit=10&_rsc=abc123", "/admin/collections/topics?limit=10"],
      ["/admin/collections/topics/2?_rsc=abc123", "/admin/collections/topics/2"],
      ["/admin/account?redirect=%2Fadmin%2Fx&tab=1", "/admin/account?tab=1"],
      ["/admin/globals/settings", "/admin/globals/settings"],
    ];
    for (const [path, expected] of cases) {
      assert.equal(loginRedirectTarget(proxy(request(path)), `GET ${path}`), expected, `GET ${path}`);
    }
  });

  test("PX3 Payload's public admin routes pass without a cookie", () => {
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
    for (const path of paths) assertPassedOn(proxy(request(path)), `GET ${path}`);
  });

  test("PX4 isPublicAdminPath: protected admin pages are not public", () => {
    for (const path of ["/admin", "/admin/", "/admin/account", "/admin/collections/users", "/admin/users/verify", "/admin/users/verify/a/b"]) {
      assert.equal(isPublicAdminPath(path), false, path);
    }
  });

  test("PX5 a Payload auth cookie passes; an empty one or another cookie does not", () => {
    assertPassedOn(proxy(request("/admin", { cookie: `${PAYLOAD_TOKEN_COOKIE}=any.token.value` })), "GET /admin with cookie");
    assertPassedOn(
      proxy(request("/admin/collections/topics", { cookie: `other=1; ${PAYLOAD_TOKEN_COOKIE}=x` })),
      "deep link with cookie",
    );
    loginRedirectTarget(proxy(request("/admin", { cookie: `${PAYLOAD_TOKEN_COOKIE}=` })), "empty cookie");
    loginRedirectTarget(proxy(request("/admin", { cookie: "payload-token-other=x; session=1" })), "other cookies only");
  });

  test("PX6 non-GET admin requests (Server Functions) and other matched paths pass without a cookie", () => {
    for (const method of ["POST", "HEAD", "PUT"]) assertPassedOn(proxy(request("/admin", { method })), `${method} /admin`);
    for (const path of ["/api/users/me", "/api/users/login", "/api/publications", "/id/publications", "/en/publications"]) {
      assertPassedOn(proxy(request(path)), `GET ${path}`);
    }
  });
});
