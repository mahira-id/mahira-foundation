import assert from "node:assert/strict";
import { describe, test } from "node:test";

/**
 * HTTP checks of the CMS env gate against a running `next start` (M3-00,
 * M3-01; ENVIRONMENTS §3.1). Started by `bun run test:build-matrix`, once per
 * build mode. No Payload import, so it also runs where the CMS is off.
 *
 * GATE_MODE: off  = CMS env absent         -> /admin, /api/*, /{id,en}/publications 404
 *            prod = VERCEL_ENV=production  -> same as off
 *            on   = full .env.local        -> /admin reachable, anonymous /api/* 403,
 *                                             /{id,en}/publications 200
 * TEST_BASE_URL defaults to http://localhost:3100.
 */
const MODE = process.env.GATE_MODE ?? "";
const BASE_URL = (process.env.TEST_BASE_URL ?? "http://localhost:3100").replace(/\/+$/, "");

type Page = { status: number; location: string; body: string; headers: Headers | null };

async function request(method: string, path: string): Promise<Page> {
  try {
    const response = await fetch(`${BASE_URL}${path}`, { method, redirect: "manual" });
    return {
      status: response.status,
      location: response.headers.get("location") ?? "",
      body: await response.text(),
      headers: response.headers,
    };
  } catch {
    return { status: 0, location: "", body: "", headers: null };
  }
}

function assertClosed(result: Page, label: string): void {
  assert.equal(result.status, 404, `${label}: expected 404 (CMS off)`);
  assert.equal(result.headers?.get("x-robots-tag"), "noindex", `${label}: X-Robots-Tag`);
  assert.equal(result.headers?.get("cache-control"), "no-store", `${label}: Cache-Control`);
}

test("GATE_MODE is off, on or prod", () => {
  assert.equal(["off", "on", "prod"].includes(MODE), true, "set GATE_MODE to off, on or prod");
});

describe(`env gate over HTTP (GATE_MODE=${MODE || "unset"})`, () => {
  test("G1 GET / unchanged: 200, headline, lang id, header 'segera', no /en/publications link", async (t) => {
    t.diagnostic(`base ${BASE_URL}`);
    const home = await request("GET", "/");
    assert.equal(home.status, 200);
    assert.equal(home.body.includes("Riset untuk"), true, 'homepage headline "Riset untuk"');
    assert.equal(home.body.includes('<html lang="id"'), true, '<html lang="id">');
    assert.equal(home.body.includes("segera"), true, 'header marker "segera" (R3.b)');
    assert.equal(home.body.includes('href="/en/publications"'), false, "no /en/publications link on / (R3.b)");
  });

  for (const [index, path] of ["/robots.txt", "/icon.svg", "/favicon.ico"].entries()) {
    test(`G2.${index + 1} GET ${path}: 200`, async () => {
      assert.equal((await request("GET", path)).status, 200);
    });
  }

  if (MODE === "off" || MODE === "prod") {
    const rows: Array<[string, string]> = [
      ["GET", "/admin"],
      ["GET", "/admin/login"],
      ["GET", "/api/publications"],
      ["GET", "/api/users"],
      ["POST", "/admin"],
    ];
    for (const [index, [method, path]] of rows.entries()) {
      test(`G3.${index + 1} ${method} ${path}: 404, noindex, no-store`, async () => {
        assertClosed(await request(method, path), `${method} ${path}`);
      });
    }
    for (const [index, path] of ["/id/publications", "/en/publications"].entries()) {
      test(`G5.${index + 1} GET ${path}: 404, noindex, no-store`, async () => {
        assertClosed(await request("GET", path), `GET ${path}`);
      });
    }
  }

  if (MODE === "on") {
    for (const [index, locale] of ["id", "en"].entries()) {
      test(`G6.${index + 1} GET /${locale}/publications: 200 with <html lang="${locale}">`, async () => {
        const result = await request("GET", `/${locale}/publications`);
        assert.equal(result.status, 200);
        assert.equal(result.body.includes(`<html lang="${locale}"`), true, `<html lang="${locale}">`);
      });
    }
    test("G4.1 GET /admin: 200 or redirect to /admin/login", async () => {
      const admin = await request("GET", "/admin");
      const redirectsToLogin = [302, 303, 307, 308].includes(admin.status) && admin.location.includes("/admin/login");
      assert.equal(admin.status === 200 || redirectsToLogin, true, `GET /admin answered ${admin.status}`);
    });
    for (const [index, path] of ["/api/publications", "/api/users"].entries()) {
      test(`G4.${index + 2} GET ${path}: 403 anonymous`, async () => {
        assert.equal((await request("GET", path)).status, 403);
      });
    }
  }
});
