import assert from "node:assert/strict";
import { after, before, describe, test } from "node:test";
import type { Payload, RequiredDataFromCollectionSlug } from "payload";

import type { Publication } from "../../payload/payload-types";
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
import { BASE_URL, assertServerUp, getPage, pageFact, rest, restFact, type PageResult } from "../helpers/http";
import { closeTestPayload, getTestPayload } from "../helpers/payload";
import { assertNotFoundPage, flightData } from "../helpers/publication-pages";

/**
 * 308 of old publication slugs (M3-07, DECISIONS §2.11 P9 A, slug history
 * `publication-slugs`): every slug a record had when it was saved published
 * + public points to that record; the detail page redirects an old slug to
 * the record's current URL when visitors can see it in the same locale, and
 * shows the not-found page otherwise. Needs `next start` with the full env
 * (bun run test:integration).
 *
 * HTTP status (PP5): the detail route sends its static shell first, so a
 * plain user agent gets HTTP 200 and the RSC payload with the redirect
 * digest `NEXT_REDIRECT;replace;<target>;308;` (the browser's router
 * redirects; Next 16.4.4 writes no refresh meta here, measured 2026-11-15);
 * a user agent of the `htmlLimitedBots` list (Next's default list, e.g.
 * Bingbot, plus Googlebot since M3-07 item 8, lib/seo/html-limited-bots.ts)
 * gets the blocking render and a real 308 with `Location` (RD9: Googlebot).
 *
 * Fixtures (slugs fixture-test-redirect-*, titles and labels "[FIXTURE] test
 * redirect *"), one Translation Group each, reusing an existing author,
 * topic and type, publishedAt 2004-01-05 (never the homepage lead). No user
 * is created; the Owner guard runs before any fixture is written and after
 * cleanup.
 */
type PubData = RequiredDataFromCollectionSlug<"publications">;
type Locale = "id" | "en";

const AREA = "redirect";
const PREFIX = areaPrefix(AREA);
const LABEL = areaLabel(AREA);
const PUBLISHED_AT = "2004-01-05T03:00:00.000Z";
const BINGBOT = "Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)";
const GOOGLEBOT = "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)";
const CHROME = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36";

const slug = (name: string) => `${PREFIX}${name}`;
const title = (name: string) => `${LABEL}${name}`;
const detailPath = (locale: Locale, name: string) => `/${locale}/publications/${slug(name)}`;

describe("slug redirect (M3-07 308 of old publication slugs)", () => {
  let payload: Payload | undefined;
  let relations: { type: number; topic: number; author: number } | undefined;

  function p(): Payload {
    if (!payload) throw new Error("Payload not initialised (before hook failed)");
    return payload;
  }

  async function createPub(name: string, overrides: Partial<PubData> = {}, status: "published" | "draft" = "published"): Promise<Publication> {
    if (!relations) throw new Error("relations not loaded (before hook failed)");
    const data: PubData = {
      title: title(name),
      slug: slug(name),
      locale: "id",
      translationGroup: await createGroup(p(), AREA, name),
      summary: `[FIXTURE] Ringkasan uji redirect ${name}.`,
      publicationType: relations.type,
      topics: [relations.topic],
      authors: [relations.author],
      accessLevel: "public",
      publishedAt: PUBLISHED_AT,
    };
    return p().create({
      collection: "publications",
      data: { ...data, ...overrides, _status: status },
      draft: status === "draft",
      depth: 0,
      overrideAccess: true,
    });
  }

  /** A published save (the admin Publish button) with these changes. */
  async function publish(record: Publication, data: Partial<PubData>): Promise<Publication> {
    return p().update({
      collection: "publications",
      id: record.id,
      data: { ...data, _status: "published" },
      depth: 0,
      overrideAccess: true,
    });
  }

  async function unpublish(record: Publication): Promise<void> {
    await p().update({ collection: "publications", id: record.id, data: { _status: "draft" }, depth: 0, overrideAccess: true });
  }

  /** Slug rows of the history, as "<locale>/<slug>→<publication id>", for this record or slug. */
  async function rows(where: { publication?: number; slug?: string }): Promise<string[]> {
    const conditions = [];
    if (where.publication !== undefined) conditions.push({ publication: { equals: where.publication } });
    if (where.slug !== undefined) conditions.push({ slug: { equals: where.slug } });
    const found = await p().find({
      collection: "publication-slugs",
      where: { and: conditions },
      depth: 0,
      pagination: false,
      overrideAccess: true,
    });
    return found.docs.map((doc) => {
      const owner = typeof doc.publication === "object" ? doc.publication.id : doc.publication;
      return `${doc.locale}/${doc.slug}→${owner}`;
    });
  }

  async function bot(path: string): Promise<PageResult> {
    return getPage(path, { "User-Agent": BINGBOT });
  }

  /** A crawler (Bingbot unless `agent` says otherwise) gets a real 308 to `target` (path only, no query string). */
  async function assert308(path: string, target: string, agent: [string, string] = ["Bingbot", BINGBOT]): Promise<void> {
    const [name, ua] = agent;
    const result = await getPage(path, { "User-Agent": ua });
    assert.equal(result.status, 308, `${name} GET ${path}: ${pageFact(result)}`);
    const location = new URL(result.location, BASE_URL);
    assert.equal(location.pathname, target, `${name} GET ${path}: Location ${result.location}`);
    assert.equal(location.search, "", `${name} GET ${path}: Location keeps no query string`);
  }

  /** The live detail page of `name` for both user agents. */
  async function assertDetail(path: string, name: string): Promise<void> {
    for (const [agent, result] of [
      ["default", await getPage(path)],
      ["Bingbot", await bot(path)],
    ] as const) {
      assert.equal(result.status, 200, `${agent} GET ${path}: ${pageFact(result)}`);
      assert.equal(result.body.includes(`data-publication-detail="${slug(name)}"`), true, `${agent} GET ${path}: detail of ${name}`);
    }
  }

  /**
   * Not-found for both user agents: no Location, no refresh meta, and none of
   * `hidden` (slugs or titles of records the URL must not reveal) in the HTML.
   */
  async function assertNoRedirect(locale: Locale, path: string, hidden: string[], t: { diagnostic: (message: string) => void }) {
    const plain = await getPage(path);
    assertNotFoundPage(plain, `GET ${path}`, locale);
    const crawler = await bot(path);
    t.diagnostic(`GET ${path}: default UA HTTP ${plain.status}, Bingbot HTTP ${crawler.status}`);
    assert.equal(crawler.status === 200 || crawler.status === 404, true, `Bingbot GET ${path}: ${pageFact(crawler)}`);
    for (const [agent, result] of [
      ["default", plain],
      ["Bingbot", crawler],
    ] as const) {
      assert.equal(result.location, "", `${agent} GET ${path}: Location ${result.location}`);
      assert.equal(result.body.includes('http-equiv="refresh"'), false, `${agent} GET ${path}: refresh meta`);
      assert.equal(result.body.includes("NEXT_REDIRECT"), false, `${agent} GET ${path}: redirect digest`);
      for (const text of hidden) assert.equal(result.body.includes(text), false, `${agent} GET ${path}: "${text}" in the HTML`);
    }
  }

  before(async (t) => {
    payload = await getTestPayload();
    hookNote(t, `cleanup at start removed ${formatCounts(await cleanupArea(payload, AREA))}`);
    await assertOwnerIntact(payload);
    await assertServerUp();
    relations = {
      type: await firstId(p(), "publication-types"),
      topic: await firstId(p(), "topics"),
      author: await firstId(p(), "authors"),
    };
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

  test("RD1 A → B: Bingbot gets 308 to B without the query string, a plain agent 200 + the permanent client redirect to B; B is live", async (t) => {
    const record = await createPub("a1");
    await publish(record, { slug: slug("b1") });
    assert.deepEqual((await rows({ publication: record.id })).sort(), [`id/${slug("a1")}→${record.id}`, `id/${slug("b1")}→${record.id}`]);
    await assert308(`${detailPath("id", "a1")}?utm_source=x`, detailPath("id", "b1"));
    const plain = await getPage(detailPath("id", "a1"));
    t.diagnostic(`plain agent GET old slug: HTTP ${plain.status}`);
    assert.equal(plain.status === 200 || plain.status === 308, true, `GET old slug: ${pageFact(plain)}`);
    if (plain.status === 200) {
      assert.equal(flightData(plain.body).includes(`"digest":"NEXT_REDIRECT;replace;${detailPath("id", "b1")};308;"`), true, "plain agent: 308 redirect digest to B in the RSC payload");
    }
    assert.equal(plain.body.includes("data-publication-detail"), false, "no detail under the old slug");
    await assertDetail(detailPath("id", "b1"), "b1");
  });

  test("RD2 A → B → C: both old slugs reach C in one 308", async () => {
    const record = await createPub("c1");
    await publish(record, { slug: slug("c2") });
    await publish(record, { slug: slug("c3") });
    await assert308(detailPath("id", "c1"), detailPath("id", "c3"));
    await assert308(detailPath("id", "c2"), detailPath("id", "c3"));
    await assertDetail(detailPath("id", "c3"), "c3");
  });

  test("RD3 a draft-only rename records nothing: the draft slug is not-found, the live slug stays", async (t) => {
    const record = await createPub("d1");
    await p().update({
      collection: "publications",
      id: record.id,
      data: { slug: slug("d2"), _status: "draft" },
      draft: true,
      depth: 0,
      overrideAccess: true,
    });
    assert.deepEqual(await rows({ publication: record.id }), [`id/${slug("d1")}→${record.id}`], "rows after the draft save");
    await assertNoRedirect("id", detailPath("id", "d2"), [slug("d1"), title("d1")], t);
    await assertDetail(detailPath("id", "d1"), "d1");
  });

  test("RD4 target unpublished or subscriber: not-found without Location and without the new slug; registered (M5-03, accounts on) redirects; published subscriber never gets a row", async (t) => {
    const record = await createPub("t1");
    await publish(record, { slug: slug("t2") });
    const hidden = [slug("t2"), title("t1")];
    await unpublish(record);
    await assertNoRedirect("id", detailPath("id", "t1"), hidden, t);
    await publish(record, {});
    await assert308(detailPath("id", "t1"), detailPath("id", "t2"));
    await publish(record, { accessLevel: "registered" });
    await assert308(detailPath("id", "t1"), detailPath("id", "t2"));
    await publish(record, { accessLevel: "subscriber" });
    await assertNoRedirect("id", detailPath("id", "t1"), hidden, t);
    const subscriber = await createPub("r1", { accessLevel: "subscriber" });
    await publish(subscriber, { slug: slug("r2") });
    assert.deepEqual(await rows({ publication: subscriber.id }), [], "rows of a record that was never visible");
    await assertNoRedirect("id", detailPath("id", "r1"), [slug("r2"), title("r1")], t);
    const registered = await createPub("v1", { accessLevel: "registered" });
    await publish(registered, { slug: slug("v2") });
    assert.equal((await rows({ publication: registered.id })).length > 0, true, "a published registered record records its URL (M5-03)");
    await assert308(detailPath("id", "v1"), detailPath("id", "v2"));
  });

  test("RD5 locale: an old slug never redirects to or from another locale", async (t) => {
    const record = await createPub("l1");
    await publish(record, { locale: "en", slug: slug("l2") });
    await assertNoRedirect("id", detailPath("id", "l1"), [slug("l2"), title("l1")], t);
    await assertNoRedirect("en", detailPath("en", "l1"), [slug("l2"), title("l1")], t);
    await assertNoRedirect("id", detailPath("id", "l2"), [title("l1")], t);
    await assertDetail(detailPath("en", "l2"), "l2");
  });

  test("RD6 slug reuse: the live record of a reused slug wins, and its rename takes the old URL along", async () => {
    const first = await createPub("s1");
    await publish(first, { slug: slug("s2") });
    const second = await createPub("s1-reuse", { slug: slug("s1") });
    assert.deepEqual(await rows({ slug: slug("s1") }), [`id/${slug("s1")}→${second.id}`], "row of s1 moved to the second record");
    const live = await getPage(detailPath("id", "s1"));
    assert.equal(live.status, 200, pageFact(live));
    assert.equal(live.body.includes(title("s1-reuse")), true, "s1 shows the second record");
    await publish(second, { slug: slug("s3") });
    await assert308(detailPath("id", "s1"), detailPath("id", "s3"));
    await assertDetail(detailPath("id", "s2"), "s2");
  });

  test("RD7 deleting an ever-published record (Admin path, hook runs for every caller) removes its rows; old and current URLs are not-found", async (t) => {
    const record = await createPub("x1");
    await publish(record, { slug: slug("x2") });
    assert.equal((await rows({ publication: record.id })).length, 2, "two rows before the delete");
    await p().delete({ collection: "publications", id: record.id, depth: 0, overrideAccess: true });
    assert.deepEqual(await rows({ publication: record.id }), [], "rows after the delete");
    assert.deepEqual([...(await rows({ slug: slug("x1") })), ...(await rows({ slug: slug("x2") }))], [], "rows of x1/x2");
    await assertNoRedirect("id", detailPath("id", "x1"), [slug("x2")], t);
    await assertNoRedirect("id", detailPath("id", "x2"), [], t);
  });

  test("RD8 anonymous REST cannot read or write publication-slugs", async () => {
    const [row] = (
      await p().find({ collection: "publication-slugs", where: { slug: { like: PREFIX } }, depth: 0, limit: 1, overrideAccess: true })
    ).docs;
    assert.ok(row, "a fixture row exists");
    for (const [method, path, body] of [
      ["GET", "/api/publication-slugs", undefined],
      ["GET", `/api/publication-slugs?where[slug][like]=${PREFIX}`, undefined],
      ["GET", `/api/publication-slugs/${row.id}`, undefined],
      ["POST", "/api/publication-slugs", { publication: row.id, locale: "id", slug: slug("rest") }],
      ["DELETE", `/api/publication-slugs/${row.id}`, undefined],
    ] as const) {
      const result = await rest(method, path, { body });
      assert.equal(result.status, 403, `${method} ${path}: ${restFact(result)}`);
      assert.equal("docs" in result.body || "doc" in result.body, false, `${method} ${path}: data in the body`);
    }
    assert.deepEqual(await rows({ slug: slug("rest") }), [], "no row written over REST");
  });

  test("RD9 Googlebot (htmlLimitedBots, M3-07 item 8) gets the real 308 too; a browser user agent keeps HTTP 200 + the client redirect", async () => {
    const record = await createPub("g1");
    await publish(record, { slug: slug("g2") });
    await assert308(`${detailPath("id", "g1")}?utm_source=x`, detailPath("id", "g2"), ["Googlebot", GOOGLEBOT]);
    const browser = await getPage(detailPath("id", "g1"), { "User-Agent": CHROME });
    assert.equal(browser.status, 200, `Chrome GET old slug: ${pageFact(browser)} (a 308 means htmlLimitedBots matches browsers)`);
    assert.equal(
      flightData(browser.body).includes(`"digest":"NEXT_REDIRECT;replace;${detailPath("id", "g2")};308;"`),
      true,
      "Chrome: 308 redirect digest to g2 in the RSC payload",
    );
  });
});
