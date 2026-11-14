import assert from "node:assert/strict";
import { describe, test } from "node:test";

/**
 * HTTP checks of the CMS env gate against a running `next start` (M3-00,
 * M3-01; ENVIRONMENTS §3.1). Started by `bun run test:build-matrix`, once per
 * build mode. No Payload import, so it also runs where the CMS is off.
 *
 * GATE_MODE: off  = CMS env absent         -> /admin, /api/*, /{id,en}/publications and
 *                                             /{id,en}/publications/{slug} 404
 *            prod = VERCEL_ENV=production  -> same as off
 *            on   = full .env.local        -> /admin reachable, anonymous /api/* 403,
 *                                             /{id,en}/publications 200, unknown or
 *                                             upper-case detail slug: not-found page
 *                                             with noindex (M3-05)
 * `/` (M3-04, DECISIONS §2.7): never sample content (G1); off/prod show the
 * empty notice (G7); on renders the CMS block (G8).
 * TEST_BASE_URL defaults to http://localhost:3100.
 */
const MODE = process.env.GATE_MODE ?? "";
const BASE_URL = (process.env.TEST_BASE_URL ?? "http://localhost:3100").replace(/\/+$/, "");

/** Texts of the removed sample homepage content (M3-04); none may appear on `/`. */
const SAMPLE_TEXTS = [
  "Transisi Energi yang Adil",
  "Tim Riset",
  "Learning Hub",
  "Katalog 2026",
  "Enam bidang kerja",
  "Perlu akun",
  "Membaca Data Energi",
];

/**
 * Digest of notFound() in the streamed RSC data (Next 16.4.4). The visible
 * not-found text is in every page's payload, so it proves nothing; this
 * digest is only there when notFound() was thrown.
 */
const NOT_FOUND_DIGEST = "NEXT_HTTP_ERROR_FALLBACK;404";

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
  test("G1 GET / unchanged: 200, headline, lang id, header 'segera', no /en/publications link, no sample content", async (t) => {
    t.diagnostic(`base ${BASE_URL}`);
    const home = await request("GET", "/");
    assert.equal(home.status, 200);
    assert.equal(home.body.includes("Riset untuk"), true, 'homepage headline "Riset untuk"');
    assert.equal(home.body.includes('<html lang="id"'), true, '<html lang="id">');
    assert.equal(home.body.includes("segera"), true, 'header marker "segera" (R3.b)');
    assert.equal(home.body.includes('href="/en/publications"'), false, "no /en/publications link on / (R3.b)");
    // M3-04 (DECISIONS §2.7 P1, P2, P8): no sample publication, author, topic,
    // Learning Hub block or menu item. Case-sensitive: the metadata keyword
    // "learning hub" (app/(site)/layout.tsx) stays until M3-07.
    for (const sample of SAMPLE_TEXTS) {
      assert.equal(home.body.includes(sample), false, `sample text "${sample}" on /`);
    }
  });

  if (MODE === "off" || MODE === "prod") {
    test("G7 GET / with the CMS off: empty notice, no CMS blocks, no /id/publications link", async () => {
      const home = await request("GET", "/");
      assert.equal(home.status, 200);
      assert.equal(home.body.includes('data-home-notice="empty"'), true, 'data-home-notice="empty"');
      assert.equal(home.body.includes("Belum ada publikasi yang terbit"), true, "empty notice text (P1 A)");
      for (const marker of ["data-home-lead", "data-home-latest", "data-home-topic", 'href="/id/publications"']) {
        assert.equal(home.body.includes(marker), false, `${marker} on / with the CMS off`);
      }
    });
  }

  if (MODE === "on") {
    test("G8 GET / with the CMS on: the CMS block is rendered (lead or notice)", async () => {
      const home = await request("GET", "/");
      assert.equal(home.status, 200);
      assert.equal(
        home.body.includes("data-home-lead=") || home.body.includes("data-home-notice="),
        true,
        "data-home-lead= or data-home-notice= on /",
      );
    });
  }

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
    // G5.3/G5.4 (M3-05, DECISIONS §2.11 P14 A): detail URLs are closed too.
    for (const [index, path] of ["/id/publications", "/en/publications", "/id/publications/gate-check", "/en/publications/gate-check"].entries()) {
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
    // M3-05 (DECISIONS §2.11 P7 A as amended 2026-11-13): a slug without a
    // published + public record, or not matching the slug pattern, gets the
    // not-found page with robots noindex. Next 16.4.4 sends the route's static
    // shell first, so the status is 200 (404 is accepted too).
    for (const [index, path] of ["/id/publications/gate-no-such-slug", "/id/publications/Gate-Upper"].entries()) {
      test(`G6.${index + 3} GET ${path}: not-found page with noindex`, async (t) => {
        const result = await request("GET", path);
        t.diagnostic(`GET ${path}: HTTP ${result.status}`);
        assert.equal(result.status === 200 || result.status === 404, true, `GET ${path} answered ${result.status}`);
        assert.equal(/<meta name="robots" content="noindex[^"]*"/.test(result.body), true, `robots noindex on ${path}`);
        assert.equal(result.body.includes(NOT_FOUND_DIGEST), true, `notFound() digest on ${path}`);
        assert.equal(result.body.includes("data-publication-detail"), false, `data-publication-detail on ${path}`);
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
