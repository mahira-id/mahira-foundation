import assert from "node:assert/strict";
import { after, before, describe, test } from "node:test";
import type { Payload } from "payload";

import type { Topic, User } from "../../payload/payload-types";
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
import { assertServerUp, getPage, pageFact, type PageResult } from "../helpers/http";
import { closeTestPayload, getTestPayload } from "../helpers/payload";

/**
 * Locale checks (M3-01; port of the archived m3-01-locale-checks, M3-10):
 * locale routes, <html lang>, per-locale publication sets, language switcher,
 * status codes and no public locale fallback (C4c).
 * Needs `next start` with the full env (bun run test:integration).
 *
 * Fixtures: topic fixture-test-locale-topic-id-only (ID name only) and staff
 * user fixture-test-locale-editor@example.invalid (only the `user` of one
 * Local API read). The archived U0/U1 are the before/after hooks.
 */
const AREA = "locale";
const PREFIX = areaPrefix(AREA);
const TOPIC_SLUG = `${PREFIX}topic-id-only`;
const TOPIC_NAME_ID = `${areaLabel(AREA)}topik hanya ID`;
const STAFF_EMAIL = areaEmail(AREA, "editor");
const LOCALES = ["id", "en"] as const;
type Locale = (typeof LOCALES)[number];

function slugSet(html: string): Set<string> {
  return new Set([...html.matchAll(/data-publication-slug="([^"]+)"/g)].map((match) => match[1] ?? ""));
}

function sameSet(a: Set<string>, b: Set<string>): boolean {
  return a.size === b.size && [...a].every((value) => b.has(value));
}

function list(set: Set<string>): string {
  return `[${[...set].sort().join(", ")}]`;
}

describe("locale (M3-01 routes, lang, status codes, no public fallback)", () => {
  let payload: Payload | undefined;
  let topic: Topic | undefined;
  let staff: User | undefined;
  const expected: Record<Locale, Set<string>> = { id: new Set(), en: new Set() };
  const totals: Record<Locale, number> = { id: 0, en: 0 };
  const pages = new Map<Locale, PageResult>();

  function p(): Payload {
    if (!payload) throw new Error("Payload not initialised (before hook failed)");
    return payload;
  }

  function fixtureTopic(): Topic {
    if (!topic) throw new Error("topic fixture not created (before hook failed)");
    return topic;
  }

  async function indexPage(locale: Locale): Promise<PageResult> {
    const cached = pages.get(locale);
    if (cached) return cached;
    const page = await getPage(`/${locale}/publications`);
    pages.set(locale, page);
    return page;
  }

  before(async (t) => {
    payload = await getTestPayload();
    hookNote(t, `cleanup at start removed ${formatCounts(await cleanupArea(payload, AREA))}`);
    await assertOwnerIntact(payload);
    await assertServerUp();
    // Expected sets: published + public publications of each locale.
    for (const locale of LOCALES) {
      const result = await payload.find({
        collection: "publications",
        where: { and: [{ locale: { equals: locale } }, { _status: { equals: "published" } }, { accessLevel: { equals: "public" } }] },
        overrideAccess: true,
        pagination: false,
        depth: 0,
      });
      expected[locale] = new Set(result.docs.map((doc) => doc.slug));
      totals[locale] = (await payload.count({ collection: "publications", where: { locale: { equals: locale } }, overrideAccess: true })).totalDocs;
    }
    topic = await payload.create({
      collection: "topics",
      data: { name: TOPIC_NAME_ID, slug: TOPIC_SLUG },
      locale: "id",
      overrideAccess: true,
    });
    staff = await payload.create({
      collection: "users",
      data: { email: STAFF_EMAIL, password: randomPassword(), role: "editor" },
      overrideAccess: true,
    });
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

  // ------------------------------------------------------------ L1/L2 per-locale index pages
  for (const [index, locale] of LOCALES.entries()) {
    const n = index + 1;
    const other: Locale = locale === "id" ? "en" : "id";
    test(`L${n}.1 GET /${locale}/publications: 200`, async () => {
      const page = await indexPage(locale);
      assert.equal(page.status, 200, `GET /${locale}/publications ${pageFact(page)}`);
    });
    test(`L${n}.2 /${locale}/publications has <html lang="${locale}">`, async () => {
      assert.ok((await indexPage(locale)).body.includes(`<html lang="${locale}"`), `<html lang="${locale}"> missing`);
    });
    test(`L${n}.3 /${locale}/publications lists exactly the published + public ${locale} slugs`, async (t) => {
      t.diagnostic(`OBSERVED E.${locale} expected ${locale} slugs ${list(expected[locale])} (${expected[locale].size} of ${totals[locale]} ${locale} records)`);
      const seen = slugSet((await indexPage(locale)).body);
      assert.ok(sameSet(seen, expected[locale]), `listed ${list(seen)} expected ${list(expected[locale])}`);
    });
    test(`L${n}.4 /${locale}/publications lists none of the ${other}-only slugs`, async () => {
      // Slugs are unique per locale only, so compare with slugs that exist in the other locale alone.
      const seen = slugSet((await indexPage(locale)).body);
      const otherOnly = [...expected[other]].filter((slug) => !expected[locale].has(slug));
      const leaked = otherOnly.filter((slug) => seen.has(slug));
      assert.equal(leaked.length, 0, `${other}-only published slugs listed: ${leaked.join(", ")} (of ${otherOnly.length})`);
    });
  }

  // ------------------------------------------------------------ S1/S2 language switcher
  for (const [index, [locale, other]] of ([["id", "en"], ["en", "id"]] as const).entries()) {
    test(`S${index + 1} /${locale}/publications links to /${other}/publications with hreflang="${other}"`, async () => {
      const anchors = (await indexPage(locale)).body.match(/<a\s[^>]*>/g) ?? [];
      const link = anchors.find((tag) => tag.includes(`href="/${other}/publications"`));
      // HTML attribute names are case-insensitive; React writes `hrefLang`.
      assert.ok(link !== undefined && link.toLowerCase().includes(`hreflang="${other}"`), `link: ${link ?? "no link"}`);
    });
    test(`S${index + 1}.b /${locale}/publications marks the current language with aria-current="true"`, async () => {
      assert.ok((await indexPage(locale)).body.includes('aria-current="true"'), 'aria-current="true" missing');
    });
  }

  // ------------------------------------------------------------ Q query parameters do not change the page
  for (const [index, query] of ["?fallback-locale=id", "?locale=id", "?fallbackLocale=id"].entries()) {
    test(`Q${index + 1} GET /en/publications${query}: 200 with the en set`, async () => {
      const page = await getPage(`/en/publications${query}`);
      const seen = slugSet(page.body);
      assert.ok(page.status === 200 && sameSet(seen, expected.en), `${pageFact(page)}; listed ${list(seen)} expected ${list(expected.en)}`);
    });
  }

  // ------------------------------------------------------------ R status codes
  for (const [index, path] of ["/id", "/en", "/id/Publications", "/fr/publications", "/does-not-exist", "/id/publications/x"].entries()) {
    test(`R1.${index + 1} GET ${path}: 404`, async () => {
      const result = await getPage(path);
      assert.equal(result.status, 404, `GET ${path} ${pageFact(result)}`);
    });
  }

  // Upper/mixed-case locale segments. isLocale() rejects them, so the app
  // answers 404. On Windows (case-insensitive NTFS) `next start` can instead
  // find the prerendered shell of the lower-case locale on disk
  // (.next/server/app/id/publications.html) and resume it: HTTP 200, header
  // x-nextjs-postponed: 1, lang of the lower-case locale, no publications.
  // That local-filesystem artifact passes on win32 only, with a WINDOWS-FS
  // diagnostic; Linux/Vercel must give 404.
  for (const [index, path] of ["/ID/publications", "/Id/publications", "/iD/publications", "/EN/publications", "/En/publications", "/eN/publications"].entries()) {
    test(`R5.${index + 1} GET ${path}: 404 (win32: prerendered shell without publications allowed)`, async (t) => {
      const result = await getPage(path);
      if (result.status === 404) return;
      const lower = (path.split("/")[1] ?? "").toLowerCase();
      const listed = slugSet(result.body).size;
      const windowsShell =
        process.platform === "win32" && result.status === 200 && result.postponed && result.body.includes(`<html lang="${lower}"`) && listed === 0;
      if (windowsShell) {
        t.diagnostic(`WINDOWS-FS GET ${path} ${pageFact(result)}; prerendered "${lower}" shell resumed, 0 publications listed (Linux/Vercel: verify 404)`);
        return;
      }
      assert.fail(`GET ${path} ${pageFact(result)}; postponed=${result.postponed}; publications listed=${listed} (expected 404)`);
    });
  }

  test("R2 GET /id/publications/: 308 -> /id/publications", async () => {
    const result = await getPage("/id/publications/");
    assert.ok(result.status === 308 && result.location.endsWith("/id/publications") && !result.location.endsWith("/"), `GET /id/publications/ ${pageFact(result)}`);
  });

  test('R3 GET /: 200, "Riset untuk", lang id', async () => {
    const home = await getPage("/");
    assert.ok(
      home.status === 200 && home.body.includes("Riset untuk") && home.body.includes('<html lang="id"'),
      `GET / ${pageFact(home)}; "Riset untuk"=${home.body.includes("Riset untuk")}; lang id=${home.body.includes('<html lang="id"')}`,
    );
  });

  test('R3.b homepage header unchanged: "segera", no /en/publications link', async () => {
    const home = await getPage("/");
    assert.ok(
      home.body.includes("segera") && !home.body.includes('href="/en/publications"'),
      `"segera"=${home.body.includes("segera")}; no /en/publications link=${!home.body.includes('href="/en/publications"')}`,
    );
  });

  for (const [index, path] of ["/logo/MAHIRA_L_BLUE.svg", "/robots.txt", "/icon.svg"].entries()) {
    test(`R4.${index + 1} GET ${path}: 200`, async () => {
      const result = await getPage(path);
      assert.equal(result.status, 200, `GET ${path} ${pageFact(result)}`);
    });
  }

  // ------------------------------------------------------------ F no public locale fallback (C4c)
  test("F1 anonymous REST GET /api/topics?locale=en&fallback-locale=id: 403", async () => {
    const result = await getPage(`/api/topics?locale=en&fallback-locale=id&where[slug][equals]=${TOPIC_SLUG}`);
    assert.equal(result.status, 403, pageFact(result));
  });

  test("F1.b anonymous REST GET /api/topics/<fixture>?locale=en&fallback-locale=id: 403", async () => {
    const result = await getPage(`/api/topics/${fixtureTopic().id}?locale=en&fallback-locale=id`);
    assert.equal(result.status, 403, pageFact(result));
  });

  test("F2 anonymous Local API find(locale en, fallbackLocale id): no ID name", async () => {
    const found = await p().find({
      collection: "topics",
      where: { slug: { equals: TOPIC_SLUG } },
      locale: "en",
      fallbackLocale: "id",
      overrideAccess: false,
      depth: 0,
    });
    const name = found.docs[0]?.name;
    assert.ok(found.docs.length === 1 && name !== TOPIC_NAME_ID, `docs=${found.docs.length}, name=${JSON.stringify(name ?? null)} (expected no ID name)`);
  });

  test("F3 anonymous Local API findByID(locale en, fallbackLocale id): no ID name", async (t) => {
    if (!staff) throw new Error("staff fixture not created (before hook failed)");
    const staffFind = await p().find({
      collection: "topics",
      where: { slug: { equals: TOPIC_SLUG } },
      locale: "en",
      fallbackLocale: "id",
      overrideAccess: false,
      user: { ...staff, collection: "users" },
      depth: 0,
    });
    t.diagnostic(`OBSERVED F4 staff Local API find(locale en, fallbackLocale id): name=${JSON.stringify(staffFind.docs[0]?.name ?? null)} (staff tool keeps the requested fallback)`);
    const found = await p().findByID({
      collection: "topics",
      id: fixtureTopic().id,
      locale: "en",
      fallbackLocale: "id",
      overrideAccess: false,
      depth: 0,
    });
    assert.notEqual(found.name, TOPIC_NAME_ID, `name=${JSON.stringify(found.name ?? null)} (expected no ID name)`);
  });
});
