import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { notFoundPageProblems } from "../helpers/publication-pages";

/**
 * HTTP checks of the CMS env gate against a running `next start` (M3-00,
 * M3-01; ENVIRONMENTS §3.1). Started by `bun run test:build-matrix`, once per
 * build mode. No Payload import, so it also runs where the CMS is off.
 *
 * GATE_MODE: off  = CMS env absent         -> /admin, /api/* (preview handlers included),
 *                                             /{id,en}/publications and
 *                                             /{id,en}/publications/{slug} 404
 *            prod = VERCEL_ENV=production  -> same as off
 *            on   = full .env.local        -> /admin reachable, anonymous /api/* 403,
 *                                             anonymous /api/preview 404 without the
 *                                             Draft Mode cookie,
 *                                             /{id,en}/publications 200, unknown or
 *                                             upper-case detail slug: not-found page
 *                                             with noindex (M3-05), the Mahira page
 *                                             since M3-05b
 * `/` (M3-04, DECISIONS §2.7): never sample content (G1); off/prod show the
 * empty notice (G7); on renders the CMS block (G8).
 * SEO (M3-07, DEC-021, DECISIONS §2.13), G9: canonical of `/` on
 * https://mahira.id and `/og/site` in every mode; sitemap only `/` with the
 * CMS off, `/` + both indexes on; robots `Allow: /` + Sitemap only in prod,
 * `Disallow: /` in off and on; the index and detail OG images 404 with the
 * CMS off.
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
      // M3-05 (DECISIONS §2.11 P11 A): the staff preview handlers are closed too.
      ["GET", "/api/preview?id=1"],
      ["POST", "/api/preview/exit"],
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

  // M3-07 (DEC-021, DECISIONS §2.13): sitemap, robots, generated OG images and the homepage canonical per gate mode.
  test("G9.1 GET / canonical https://mahira.id and og:image /og/site", async () => {
    const home = await request("GET", "/");
    assert.match(home.body, /<link rel="canonical" href="https:\/\/mahira\.id\/?"/, "canonical of /");
    assert.match(home.body, /<meta property="og:image" content="https:\/\/mahira\.id\/og\/site"/, "og:image of /");
  });

  test("G9.2 GET /og/site: 200 image/png", async () => {
    const image = await request("GET", "/og/site");
    assert.equal(image.status, 200);
    assert.equal(image.headers?.get("content-type"), "image/png");
  });

  test(`G9.3 GET /sitemap.xml: ${MODE === "on" ? "/, both indexes and more" : "only https://mahira.id/"}`, async () => {
    const sitemap = await request("GET", "/sitemap.xml");
    assert.equal(sitemap.status, 200);
    const locs = [...sitemap.body.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
    if (MODE === "on") {
      for (const url of ["https://mahira.id/", "https://mahira.id/id/publications", "https://mahira.id/en/publications"]) {
        assert.equal(locs.includes(url), true, `sitemap lists ${url}`);
      }
    } else {
      assert.deepEqual(locs, ["https://mahira.id/"], "sitemap with the CMS off");
    }
  });

  test(`G9.4 GET /robots.txt: ${MODE === "prod" ? "Allow: / + Sitemap" : "Disallow: /, no Sitemap"}`, async () => {
    const robots = await request("GET", "/robots.txt");
    assert.equal(robots.status, 200);
    if (MODE === "prod") {
      assert.match(robots.body, /User-Agent: \*\s+Allow: \/\s/, "Allow: / on Production");
      assert.equal(/^Disallow:/m.test(robots.body), false, "a Disallow line on Production");
      assert.match(robots.body, /^Sitemap: https:\/\/mahira\.id\/sitemap\.xml$/m, "Sitemap line on Production");
    } else {
      assert.match(robots.body, /User-Agent: \*\s+Disallow: \/\s/, "Disallow: / outside Production");
      assert.equal(/Sitemap:/i.test(robots.body), false, "a Sitemap line outside Production");
    }
  });

  if (MODE === "off" || MODE === "prod") {
    for (const [index, path] of ["/og/id/publications", "/og/en/publications/gate-check"].entries()) {
      test(`G9.${index + 5} GET ${path} with the CMS off: 404`, async () => {
        assert.equal((await request("GET", path)).status, 404);
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
      test(`G6.${index + 3} GET ${path}: Mahira not-found page with noindex`, async (t) => {
        const result = await request("GET", path);
        t.diagnostic(`GET ${path}: HTTP ${result.status}`);
        assert.equal(result.status === 200 || result.status === 404, true, `GET ${path} answered ${result.status}`);
        assert.equal(/<meta name="robots" content="noindex[^"]*"/.test(result.body), true, `robots noindex on ${path}`);
        assert.equal(result.body.includes(NOT_FOUND_DIGEST), true, `notFound() digest on ${path}`);
        assert.equal(result.body.includes("data-publication-detail"), false, `data-publication-detail on ${path}`);
        // M3-05b: the Mahira not-found page in Indonesian (app/[locale]/not-found.tsx).
        assert.deepEqual(notFoundPageProblems(result.body, "id"), [], `Mahira not-found page on ${path}`);
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
    // M3-05 (DECISIONS §2.11 P11 A): without a staff session the preview
    // handler answers 404 and never sets the Draft Mode cookie.
    test("G4.4 GET /api/preview?id=1 anonymous: 404, noindex, no-store, no __prerender_bypass", async () => {
      const result = await request("GET", "/api/preview?id=1");
      assert.equal(result.status, 404, "GET /api/preview?id=1 anonymous");
      assert.equal(result.headers?.get("x-robots-tag"), "noindex", "X-Robots-Tag");
      assert.equal(result.headers?.get("cache-control"), "no-store", "Cache-Control");
      const cookies = result.headers?.getSetCookie() ?? [];
      assert.equal(cookies.some((cookie) => cookie.startsWith("__prerender_bypass=")), false, "__prerender_bypass set");
    });
  }
});
