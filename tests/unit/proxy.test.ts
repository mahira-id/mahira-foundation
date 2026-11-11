import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, test } from "node:test";

import { CMS_ENV_NAMES } from "../../payload/env";
import { config, proxy } from "../../proxy";

// proxy.ts is the CMS gate (M3-00/M3-01): when the CMS is off, the matched
// paths answer 404 and are never indexed or cached. Values are dummies.
const GATE_NAMES = [...CMS_ENV_NAMES, "VERCEL_ENV"] as const;
let saved: Record<string, string | undefined> = {};

function clearGateEnv(): void {
  for (const name of GATE_NAMES) delete process.env[name];
}

function setAll(): void {
  for (const name of CMS_ENV_NAMES) process.env[name] = "unit-test-dummy-value-1234";
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

describe("proxy.ts — CMS gate", () => {
  test("CMS env absent: 404 with X-Robots-Tag noindex and Cache-Control no-store", () => {
    assertGateClosed(proxy());
  });

  test("VERCEL_ENV=production with full CMS env: 404 (Production stays off)", () => {
    setAll();
    process.env.VERCEL_ENV = "production";
    assertGateClosed(proxy());
  });

  test("full CMS env: request passes through (x-middleware-next = 1)", () => {
    setAll();
    const response = proxy();
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
