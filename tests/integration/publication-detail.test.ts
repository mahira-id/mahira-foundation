import assert from "node:assert/strict";
import { after, before, describe, test } from "node:test";
import type { Payload, RequiredDataFromCollectionSlug } from "payload";

import type { Publication, PublicationType, Topic } from "../../payload/payload-types";
import { startNextServer } from "../../scripts/lib/processes";
import {
  areaLabel,
  areaPrefix,
  assertOwnerIntact,
  cleanupArea,
  countLeftovers,
  createGroup,
  firstId,
  formatCounts,
  hookNote,
  totalOf,
} from "../helpers/fixtures";
import { BASE_URL, assertServerUp, getPage, pageFact, type PageResult } from "../helpers/http";
import { closeTestPayload, getTestPayload } from "../helpers/payload";
import { assertNotFoundPage, fetchAllIndexPages, indexState, robotsContent } from "../helpers/publication-pages";

/**
 * Publication detail `/{locale}/publications/{slug}` (M3-05, DECISIONS §2.11
 * P7 A, P8 A, P15 A as amended 2026-11-13): only published + public records
 * of the locale have a page; everything else gets notFound() = robots
 * noindex and the not-found page (HTTP 200, the route's static shell is sent
 * first in Next 16.4.4). A failed read renders the locale error state on the
 * server (HTTP 200, noindex, no DB host). Needs `next start` with the full
 * env (bun run test:integration).
 *
 * Fixtures (slugs fixture-test-detail-*, names and labels "[FIXTURE] test
 * detail *"): type `type` (ID + EN names), active topic `topic-a` (ID + EN),
 * inactive `topic-off` (ID name only); ID `pub` (two summary paragraphs,
 * topics [topic-off, topic-a], 2090-01-05) with its published EN
 * counterpart `pub-en`; ID `solo` whose EN counterpart `solo-en` is a draft
 * (access level is a shared field, DEC-004, so a `registered` counterpart of
 * a public record cannot exist); draft-only `draft`; `registered`;
 * `subscriber`; EN-only `en-only`. No user is created; the Owner guard runs
 * before any fixture is written and after cleanup.
 *
 * DT10 starts a second `next start` on TEST_PORT + 1 (no build) whose
 * database URI points at a closed local port, so every CMS read fails.
 */
type PubData = RequiredDataFromCollectionSlug<"publications">;

const AREA = "detail";
const PREFIX = areaPrefix(AREA);
const LABEL = areaLabel(AREA);
const PARAGRAPHS = ["[FIXTURE] Paragraf satu uji detail M3-05.", "[FIXTURE] Paragraf dua uji detail M3-05."];
const PUBLISHED_AT = "2090-01-05T03:00:00.000Z"; // 10:00 WIB on 5 Jan 2090
const TYPE_NAME = `${LABEL}Jenis Detail`;
const TOPIC_A_NAME = `${LABEL}Topik A`;
const TOPIC_OFF_NAME = `${LABEL}Topik Nonaktif`;
const STAFF_FIELDS = ["liveOnSite", "everPublished", "translationGroup", "_status"];
/** Never in a page of the failing server: the host and the user of its database URI. */
const BROKEN_DB_URI = "postgres://fixture:fixture@127.0.0.1:9/postgres";
const BROKEN_DB_PARTS = ["127.0.0.1", "fixture:fixture"];
/** Port of the second server of DT10 (the shared one is BASE_URL). */
const FAILING_PORT = Number(new URL(BASE_URL).port || "3100") + 1;

const slug = (name: string) => `${PREFIX}${name}`;
const title = (name: string) => `${LABEL}${name}`;

/** Text as React writes it into HTML. */
function htmlText(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

/** Opening tags of the links with this href, lower-cased (React writes `hrefLang`). */
function linksTo(html: string, href: string): string[] {
  return (html.match(/<a\s[^>]*>/g) ?? []).filter((tag) => tag.includes(`href="${href}"`)).map((tag) => tag.toLowerCase());
}

function metaContent(html: string, name: string): string | null {
  for (const match of html.matchAll(/<meta\s[^>]*>/g)) {
    const tag = match[0];
    if (tag.includes(`name="${name}"`)) return /\scontent="([^"]*)"/.exec(tag)?.[1] ?? null;
  }
  return null;
}

describe("publication detail (M3-05 published + public only, switcher, not-found, read failure)", () => {
  let payload: Payload | undefined;
  let author: { id: number; name: string } | undefined;
  let type: PublicationType | undefined;
  let topics: { a: Topic; off: Topic } | undefined;
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

  async function page(path: string): Promise<string> {
    const result = await getPage(path);
    assert.equal(result.status, 200, `GET ${path} ${pageFact(result)}`);
    assert.equal(result.body.includes(`data-publication-detail=`), true, `GET ${path}: data-publication-detail missing`);
    return result.body;
  }

  async function createPub(
    name: string,
    overrides: Partial<PubData>,
    status: "published" | "draft" = "published",
    group?: number,
  ): Promise<Publication> {
    if (!type || !topics || !author) throw new Error("relations not created (before hook failed)");
    const base: PubData = {
      title: title(name),
      slug: slug(name),
      locale: "id",
      translationGroup: group ?? (await createGroup(p(), AREA, name)),
      summary: PARAGRAPHS.join("\n\n"),
      publicationType: type.id,
      topics: [topics.off.id, topics.a.id],
      authors: [author.id],
      accessLevel: "public",
      publishedAt: PUBLISHED_AT,
    };
    const record = await p().create({
      collection: "publications",
      data: { ...base, ...overrides, _status: status },
      draft: status === "draft",
      depth: 0,
      overrideAccess: true,
    });
    pubs.set(name, record);
    return record;
  }

  function groupOf(record: Publication): number {
    return typeof record.translationGroup === "object" ? record.translationGroup.id : record.translationGroup;
  }

  async function setStatus(name: string, status: "draft" | "published"): Promise<void> {
    await p().update({ collection: "publications", id: pub(name).id, data: { _status: status }, depth: 0, overrideAccess: true });
  }

  before(async (t) => {
    payload = await getTestPayload();
    hookNote(t, `cleanup at start removed ${formatCounts(await cleanupArea(payload, AREA))}`);
    await assertOwnerIntact(payload);
    await assertServerUp();

    const authorId = await firstId(p(), "authors");
    const authorDoc = await p().findByID({ collection: "authors", id: authorId, depth: 0, overrideAccess: true });
    author = { id: authorId, name: authorDoc.displayName };

    // Create in `id`, add the EN name, then activate (DEC-004 hook needs both names).
    const typeDoc = await p().create({
      collection: "publication-types",
      data: { name: TYPE_NAME, slug: slug("type") },
      locale: "id",
      overrideAccess: true,
    });
    await p().update({ collection: "publication-types", id: typeDoc.id, data: { name: `${TYPE_NAME} EN` }, locale: "en", overrideAccess: true });
    type = await p().update({ collection: "publication-types", id: typeDoc.id, data: { isActive: true }, locale: "id", overrideAccess: true });
    const topicA = await p().create({ collection: "topics", data: { name: TOPIC_A_NAME, slug: slug("topic-a") }, locale: "id", overrideAccess: true });
    await p().update({ collection: "topics", id: topicA.id, data: { name: `${TOPIC_A_NAME} EN` }, locale: "en", overrideAccess: true });
    topics = {
      a: await p().update({ collection: "topics", id: topicA.id, data: { isActive: true }, locale: "id", overrideAccess: true }),
      off: await p().create({ collection: "topics", data: { name: TOPIC_OFF_NAME, slug: slug("topic-off") }, locale: "id", overrideAccess: true }),
    };

    const main = await createPub("pub", {});
    await createPub("pub-en", { locale: "en" }, "published", groupOf(main));
    const solo = await createPub("solo", {});
    await createPub("solo-en", { locale: "en" }, "draft", groupOf(solo));
    await createPub("draft", {}, "draft");
    await createPub("registered", { accessLevel: "registered" });
    await createPub("subscriber", { accessLevel: "subscriber" });
    await createPub("en-only", { locale: "en" });
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

  test("DT1 ID detail: lang id, H1, both paragraphs, authors, type, inactive topic first, WIB date, language, access, breadcrumb, title and description", async () => {
    const html = await page(`/id/publications/${slug("pub")}`);
    assert.equal(html.includes('<html lang="id"'), true, '<html lang="id">');
    assert.equal(html.includes(`data-publication-detail="${slug("pub")}"`), true, "data-publication-detail of pub");
    assert.match(html, new RegExp(`<h1[^>]*>${htmlText(title("pub")).replace(/[[\]]/g, "\\$&")}</h1>`), "H1 = title");
    for (const paragraph of PARAGRAPHS) {
      assert.equal(html.includes(`<p>${htmlText(paragraph)}</p>`), true, `paragraph "${paragraph}"`);
    }
    for (const text of [
      htmlText(author?.name ?? ""),
      `${TYPE_NAME}<`,
      `${TOPIC_OFF_NAME}, ${TOPIC_A_NAME}<`,
      "05 Jan 2090",
      ">Bahasa: </span>Bahasa Indonesia<",
      "Akses publik",
      `<title>${title("pub")} — Mahira Indonesia Development</title>`,
    ]) {
      assert.equal(html.includes(text), true, `"${text}" on the ID detail`);
    }
    const breadcrumb = /<nav[^>]*aria-label="Navigasi lokasi"[^>]*>([\s\S]*?)<\/nav>/.exec(html);
    assert.ok(breadcrumb, "breadcrumb nav");
    assert.equal((breadcrumb[1] as string).includes('href="/id/publications"'), true, "breadcrumb link to /id/publications");
    assert.equal((breadcrumb[1] as string).includes('aria-current="page"'), true, "breadcrumb current page");
    assert.equal(metaContent(html, "description"), htmlText(PARAGRAPHS.join(" ")), "description = summary");
    assert.equal(robotsContent(html), null, "no robots meta on a public detail");
  });

  test("DT2 not-found page with noindex for draft, registered, subscriber, other-locale, missing, upper-case and invalid slugs", async (t) => {
    const cases: [string, string | null][] = [
      [`/id/publications/${slug("draft")}`, title("draft")],
      [`/id/publications/${slug("registered")}`, title("registered")],
      [`/id/publications/${slug("subscriber")}`, title("subscriber")],
      [`/en/publications/${slug("solo-en")}`, title("solo-en")],
      [`/id/publications/${slug("en-only")}`, title("en-only")],
      [`/en/publications/${slug("pub")}`, null],
      [`/id/publications/${slug("nope")}`, null],
      [`/id/publications/${slug("pub").toUpperCase()}`, null],
      ["/id/publications/a_b", null],
    ];
    const statuses: string[] = [];
    for (const [path, hidden] of cases) {
      const result = await getPage(path);
      statuses.push(`${path}=${assertNotFoundPage(result, `GET ${path}`)}`);
      if (hidden) assert.equal(result.body.includes(hidden), false, `GET ${path}: title "${hidden}" in the HTML`);
    }
    t.diagnostic(`statuses: ${statuses.join(" ")}`);
  });

  test("DT3 switcher on a page with a published + public counterpart links to it with hreflang en", async () => {
    const html = await page(`/id/publications/${slug("pub")}`);
    const links = linksTo(html, `/en/publications/${slug("pub-en")}`);
    assert.equal(links.some((tag) => tag.includes('hreflang="en"')), true, `switcher link: ${links.join(" | ") || "none"}`);
    assert.equal(html.includes("Belum tersedia dalam English"), false, '"Belum tersedia dalam English" on pub');
  });

  test("DT4 switcher without an eligible counterpart (EN draft) links to /en/publications with the unavailable note", async () => {
    const html = await page(`/id/publications/${slug("solo")}`);
    const links = linksTo(html, "/en/publications");
    const switcher = links.find((tag) => tag.includes('hreflang="en"'));
    assert.ok(switcher, `switcher link: ${links.join(" | ") || "none"}`);
    assert.equal(switcher.includes('title="belum tersedia dalam english"'), true, `title on ${switcher}`);
    assert.equal(html.includes(`/en/publications/${slug("solo-en")}`), false, "link to the EN draft");
  });

  test("DT5 trailing slash: 308 to the URL without it", async () => {
    const result = await getPage(`/id/publications/${slug("pub")}/`);
    assert.equal(result.status, 308, pageFact(result));
    assert.equal(result.location.endsWith(`/id/publications/${slug("pub")}`), true, `location ${result.location}`);
  });

  test("DT6 EN detail: lang en, EN date and access, EN names without fallback, logo hreflang id, switcher to the ID counterpart", async () => {
    const html = await page(`/en/publications/${slug("pub-en")}`);
    for (const text of ['<html lang="en"', "05 Jan 2090", "Public access", ">Language: </span>English<", `${TYPE_NAME} EN<`, `${TOPIC_A_NAME} EN<`]) {
      assert.equal(html.includes(text), true, `"${text}" on the EN detail`);
    }
    assert.equal(html.includes(TOPIC_OFF_NAME), false, "ID-only topic name on the EN page (no locale fallback)");
    const logo = linksTo(html, "/");
    assert.equal(logo.length > 0 && logo.every((tag) => tag.includes('hreflang="id"')), true, `logo link: ${logo.join(" | ") || "none"}`);
    const back = linksTo(html, `/id/publications/${slug("pub")}`);
    assert.equal(back.some((tag) => tag.includes('hreflang="id"')), true, `switcher link: ${back.join(" | ") || "none"}`);
    const idLogo = linksTo(await page(`/id/publications/${slug("pub")}`), "/");
    assert.equal(idLogo.length > 0 && idLogo.every((tag) => !tag.includes("hreflang")), true, `ID logo link: ${idLogo.join(" | ")}`);
  });

  test("DT7 unpublish: the next request is not-found and the EN switcher loses the pair; republish: 200 again", async () => {
    await setStatus("pub", "draft");
    try {
      assertNotFoundPage(await getPage(`/id/publications/${slug("pub")}`), "unpublished pub");
      const en = await page(`/en/publications/${slug("pub-en")}`);
      const links = linksTo(en, "/id/publications");
      assert.equal(
        links.some((tag) => tag.includes('hreflang="id"') && tag.includes('title="not available in bahasa indonesia"')),
        true,
        `EN switcher after unpublish: ${links.join(" | ") || "none"}`,
      );
    } finally {
      await setStatus("pub", "published");
    }
    const html = await page(`/id/publications/${slug("pub")}`);
    assert.equal(html.includes(`data-publication-detail="${slug("pub")}"`), true, "pub after republish");
  });

  test("DT8 index rows link to /id/publications/<slug> and the link opens the detail", async () => {
    const all = await fetchAllIndexPages("id");
    for (const name of ["pub", "solo"]) {
      const href = `/id/publications/${slug(name)}`;
      assert.equal(
        all.bodies.some((body) => linksTo(body, href).some((tag) => tag.includes(`data-publication-slug="${slug(name)}"`))),
        true,
        `index link to ${href}`,
      );
      await page(href);
    }
  });

  test("DT9 no staff or internal field names in the detail HTML", async () => {
    for (const path of [`/id/publications/${slug("pub")}`, `/en/publications/${slug("pub-en")}`, `/id/publications/${slug("solo")}`]) {
      const html = await page(path);
      for (const field of STAFF_FIELDS) {
        assert.equal(html.includes(field), false, `"${field}" in the HTML of ${path}`);
      }
    }
  });

  test("DT10 read failure: detail shows the locale error state with noindex and no DB host; index shows its error state", async (t) => {
    const env: Record<string, string | undefined> = { ...process.env, CMS_SUPABASE_DATABASE_URI: BROKEN_DB_URI };
    delete env.NODE_TEST_CONTEXT; // the child is a server, not a test process
    const failing = await startNextServer({ env, port: FAILING_PORT, label: "detail-dt10" });
    const get = async (path: string): Promise<PageResult> => {
      const response = await fetch(`http://localhost:${FAILING_PORT}${path}`, { redirect: "manual" });
      return { status: response.status, location: response.headers.get("location") ?? "", postponed: false, body: await response.text() };
    };
    try {
      const cases: [string, string, string, string][] = [
        [`/id/publications/${slug("pub")}`, "Publikasi belum dapat dimuat.", "Muat ulang", `/id/publications/${slug("pub")}`],
        [`/en/publications/${slug("pub-en")}`, "This publication could not be loaded.", "Reload", `/en/publications/${slug("pub-en")}`],
      ];
      for (const [path, errorTitle, reload, href] of cases) {
        const result = await get(path);
        t.diagnostic(`failing server GET ${path}: HTTP ${result.status}`);
        assert.equal(result.status === 200 || result.status === 500, true, `GET ${path}: HTTP ${result.status}`);
        assert.equal(result.body.includes("data-publication-error"), true, `GET ${path}: data-publication-error`);
        assert.equal(result.body.includes(`>${errorTitle}</h1>`), true, `GET ${path}: H1 "${errorTitle}"`);
        assert.equal(result.body.includes(`href="${href}">${reload}</a>`), true, `GET ${path}: reload link`);
        assert.equal(result.body.includes("data-publication-detail"), false, `GET ${path}: data-publication-detail`);
        assert.equal((robotsContent(result.body) ?? "").includes("noindex"), true, `GET ${path}: robots ${robotsContent(result.body)}`);
        for (const part of BROKEN_DB_PARTS) {
          assert.equal(result.body.includes(part), false, `GET ${path}: DB URI part in the HTML`);
        }
      }
      const index = await get("/id/publications");
      assert.equal(index.status, 200, `failing server GET /id/publications: HTTP ${index.status}`);
      assert.equal(indexState(index.body).state, "error", "data-index-state");
      assert.equal(index.body.includes("Publikasi belum dapat dimuat. Coba muat ulang halaman beberapa saat lagi."), true, "index error text");
      assert.equal(robotsContent(index.body), "noindex, follow", "index robots");
      for (const part of BROKEN_DB_PARTS) {
        assert.equal(index.body.includes(part), false, "DB URI part in the index HTML");
      }
    } finally {
      await failing.stop();
    }
  });
});
