import assert from "node:assert/strict";
import { after, before, describe, test } from "node:test";
import type { Payload, RequiredDataFromCollectionSlug } from "payload";

import type { Publication } from "../../payload/payload-types";
import {
  areaEmail,
  areaLabel,
  areaPrefix,
  assertOwnerIntact,
  cleanupArea,
  countLeftovers,
  createGroup,
  firstId,
  formatCounts,
  hookNote,
  randomPassword,
  totalOf,
} from "../helpers/fixtures";
import { assertServerUp, getPage, login, pageFact, rest, restDoc, restErrors, restFact, type JsonObject } from "../helpers/http";
import { closeTestPayload, getTestPayload } from "../helpers/payload";

/**
 * Editorial workflow checks (M3-03, DEC-015, DECISIONS §2.6): draft →
 * publish → revise → unpublish → republish, required fields checked only on
 * publish, status per language, the public index page reflecting every change
 * on the next request (P3 A), the staff-only column liveOnSite (P4 B).
 * Needs `next start` with the full env (bun run test:integration).
 *
 * Editor actions go through REST, as the admin UI sends them; state checks
 * use the Local API (overrideAccess for the stored state, anonymous for what
 * visitors get). W1–W7 are one chain on one record.
 *
 * Fixtures: user fixture-test-workflow-editor@example.invalid, slugs
 * fixture-test-workflow-*, titles and labels "[FIXTURE] test workflow *".
 * The Owner guard runs before any fixture is written and after cleanup.
 */
type PubData = RequiredDataFromCollectionSlug<"publications">;
type Locale = "id" | "en";

const AREA = "workflow";
const PREFIX = areaPrefix(AREA);
const LABEL = areaLabel(AREA);
const EDITOR_EMAIL = areaEmail(AREA, "editor");
const SUMMARY_TEXT = "[FIXTURE] Ringkasan uji workflow M3-03.";
const T1 = `${LABEL}chain T1`;
const T2 = `${LABEL}chain T2 revisi`;
const REQUIRED_ON_PUBLISH = ["summary", "publicationType", "topics", "authors", "accessLevel"] as const;
/** The admin Unpublish button (Payload 3.93.0): PATCH with these query params and body {_status:"draft"}. */
const UNPUBLISH_QUERY = "?depth=0&fallback-locale=null&unpublishAllLocales=true";

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Title shown for `slug` on a public index page, or undefined when it is not listed. */
function titleOnPage(html: string, slug: string): string | undefined {
  const match = new RegExp(`data-publication-slug="${escapeRegExp(slug)}"[^>]*>([^<]*)<`).exec(html);
  return match ? match[1] : undefined;
}

function isRecent(value: string | null | undefined, startedAt: number): boolean {
  if (!value) return false;
  const time = Date.parse(value);
  return Number.isFinite(time) && time >= startedAt - 5 * 60_000 && time <= Date.now() + 60_000;
}

type Relations = { publicationType: number; topic: number; author: number };

describe("workflow (M3-03 draft, publish, revise, unpublish, public page, liveOnSite)", () => {
  let payload: Payload | undefined;
  let relations: Relations | undefined;
  let editorToken: string | undefined;
  let chain: { id: number; slug: string; group: number } | undefined;
  let d1: string | undefined;
  let w8: { id: Publication; en: Publication } | undefined;

  function p(): Payload {
    if (!payload) throw new Error("Payload not initialised (before hook failed)");
    return payload;
  }

  function rel(): Relations {
    if (!relations) throw new Error("relations not resolved (before hook failed)");
    return relations;
  }

  function token(): string {
    if (!editorToken) throw new Error("editor login failed (before hook)");
    return editorToken;
  }

  function chained(): { id: number; slug: string; group: number } {
    if (!chain) throw new Error("W1 did not create the chain record");
    return chain;
  }

  function fullData(label: string, slug: string, group: number, overrides: Partial<PubData> = {}): PubData {
    const { publicationType, topic, author } = rel();
    return {
      title: `${LABEL}${label}`,
      slug: `${PREFIX}${slug}`,
      locale: "id",
      translationGroup: group,
      summary: SUMMARY_TEXT,
      publicationType,
      topics: [topic],
      authors: [author],
      accessLevel: "public",
      ...overrides,
    };
  }

  async function createPub(data: PubData, status: "published" | "draft"): Promise<Publication> {
    return p().create({
      collection: "publications",
      data: { ...data, _status: status },
      draft: status === "draft",
      depth: 0,
      overrideAccess: true,
    });
  }

  /** The record in the main table: the version visitors get. */
  async function stored(id: number): Promise<Publication> {
    return p().findByID({ collection: "publications", id, depth: 0, draft: false, overrideAccess: true });
  }

  /** The latest version (a pending draft when there is one). */
  async function latest(id: number): Promise<Publication> {
    return p().findByID({ collection: "publications", id, depth: 0, draft: true, overrideAccess: true });
  }

  /** "found:<title>" or the error name of an anonymous Local API findByID. */
  async function anonymous(id: number): Promise<string> {
    try {
      const doc = await p().findByID({ collection: "publications", id, depth: 0, overrideAccess: false });
      return `found:${doc.title}`;
    } catch (error) {
      return error instanceof Error ? error.name : String(error);
    }
  }

  async function listed(locale: Locale, slug: string): Promise<string | undefined> {
    const page = await getPage(`/${locale}/publications`);
    assert.equal(page.status, 200, `GET /${locale}/publications ${pageFact(page)}`);
    return titleOnPage(page.body, slug);
  }

  /** Staff REST read of the latest version, as the admin edit view loads it. */
  async function staffRead(id: number): Promise<JsonObject> {
    const result = await rest("GET", `/api/publications/${id}?draft=true&depth=0`, { token: token() });
    assert.equal(result.status, 200, `staff GET /api/publications/<id>?draft=true: ${restFact(result)}`);
    return result.body;
  }

  async function unpublish(id: number) {
    return rest("PATCH", `/api/publications/${id}${UNPUBLISH_QUERY}`, { token: token(), body: { _status: "draft" } });
  }

  before(async (t) => {
    payload = await getTestPayload();
    hookNote(t, `cleanup at start removed ${formatCounts(await cleanupArea(payload, AREA))}`);
    await assertOwnerIntact(payload);
    await assertServerUp();
    relations = {
      publicationType: await firstId(payload, "publication-types"),
      topic: await firstId(payload, "topics"),
      author: await firstId(payload, "authors"),
    };
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

  // ------------------------------------------------------------ W1–W7 one record through the workflow
  test("W1 editor saves an incomplete draft: 201, not ever published, not public, liveOnSite no", async () => {
    const group = await createGroup(p(), AREA, "chain");
    const slug = `${PREFIX}chain`;
    const result = await rest("POST", "/api/publications?draft=true", {
      token: token(),
      body: { title: T1, slug, locale: "id", translationGroup: group, _status: "draft" },
    });
    const doc = restDoc(result);
    assert.equal(result.status, 201, `editor POST ?draft=true (title, slug, locale, group only): ${restFact(result)}`);
    assert.equal(typeof doc.id, "number", "response has the new id");
    chain = { id: doc.id as number, slug, group };
    const record = await stored(chain.id);
    const seen = await anonymous(chain.id);
    const onPage = await listed("id", slug);
    assert.ok(
      record.everPublished === false && !record.publishedAt && doc.liveOnSite === "no" && seen === "NotFound" && onPage === undefined,
      `everPublished=${String(record.everPublished)}, publishedAt=${record.publishedAt ?? "null"}, response liveOnSite=${String(doc.liveOnSite)}, ` +
      `anonymous findByID=${seen}, listed on /id/publications=${onPage !== undefined}`,
    );
  });

  test("W2 editor publishes the incomplete draft: 400 naming the missing required fields, still not public", async () => {
    const { id } = chained();
    const result = await rest("PATCH", `/api/publications/${id}`, { token: token(), body: { _status: "published" } });
    const errors = restErrors(result.body);
    const missing = REQUIRED_ON_PUBLISH.filter((path) => !errors.includes(`${path}:`));
    const record = await stored(id);
    const seen = await anonymous(id);
    assert.ok(
      result.status === 400 && missing.length === 0 && seen === "NotFound" && record.everPublished === false,
      `editor PATCH _status=published: ${restFact(result)}; required paths not reported=[${missing.join(", ")}]; ` +
      `anonymous findByID=${seen}; everPublished=${String(record.everPublished)}`,
    );
  });

  test("W3 editor completes and publishes: 200, everPublished, publishedAt now, public, listed with T1, liveOnSite yes", async () => {
    const { id, slug } = chained();
    const { publicationType, topic, author } = rel();
    const startedAt = Date.now();
    const result = await rest("PATCH", `/api/publications/${id}`, {
      token: token(),
      body: { summary: SUMMARY_TEXT, publicationType, topics: [topic], authors: [author], accessLevel: "public", _status: "published" },
    });
    assert.equal(result.status, 200, `editor PATCH complete + _status=published: ${restFact(result)}`);
    const record = await stored(id);
    d1 = record.publishedAt ?? undefined;
    const seen = await anonymous(id);
    const onPage = await listed("id", slug);
    const staff = await staffRead(id);
    assert.ok(
      record._status === "published" && record.everPublished === true && isRecent(record.publishedAt, startedAt) &&
      seen === `found:${T1}` && onPage === T1 && staff.liveOnSite === "yes",
      `stored _status=${record._status}, everPublished=${String(record.everPublished)}, publishedAt=${record.publishedAt ?? "null"} (expected now); ` +
      `anonymous findByID=${seen}; listed title=${onPage ?? "not listed"}; staff liveOnSite=${String(staff.liveOnSite)}`,
    );
  });

  test("W4 editor saves a revision as draft: site still shows T1, staff sees T2 as draft with liveOnSite yes", async () => {
    const { id, slug } = chained();
    const result = await rest("PATCH", `/api/publications/${id}?draft=true`, { token: token(), body: { title: T2, _status: "draft" } });
    assert.equal(result.status, 200, `editor PATCH ?draft=true title=T2: ${restFact(result)}`);
    const onPage = await listed("id", slug);
    const seen = await anonymous(id);
    const staff = await staffRead(id);
    const record = await stored(id);
    const draftView = await latest(id);
    assert.ok(
      onPage === T1 && seen === `found:${T1}` && staff.title === T2 && staff._status === "draft" && staff.liveOnSite === "yes" &&
      record.title === T1 && record._status === "published" && draftView.title === T2,
      `listed title=${onPage ?? "not listed"} (expected T1); anonymous findByID=${seen}; ` +
      `staff draft read title=${String(staff.title)}, _status=${String(staff._status)}, liveOnSite=${String(staff.liveOnSite)}; ` +
      `stored title T1=${record.title === T1}, _status=${record._status}; latest version title T2=${draftView.title === T2}`,
    );
  });

  test("W5 editor publishes the revision: next page request shows T2, publishedAt unchanged", async () => {
    const { id, slug } = chained();
    const result = await rest("PATCH", `/api/publications/${id}`, { token: token(), body: { _status: "published" } });
    assert.equal(result.status, 200, `editor PATCH _status=published: ${restFact(result)}`);
    const onPage = await listed("id", slug);
    const record = await stored(id);
    assert.ok(
      onPage === T2 && record.title === T2 && d1 !== undefined && record.publishedAt === d1,
      `listed title=${onPage ?? "not listed"} (expected T2); stored title=${record.title}; publishedAt kept=${record.publishedAt === d1}`,
    );
  });

  test("W6 editor unpublishes like the admin button: off the site, everPublished and publishedAt kept, liveOnSite no, editor DELETE 403", async () => {
    const { id, slug } = chained();
    const result = await unpublish(id);
    assert.equal(result.status, 200, `editor PATCH ${UNPUBLISH_QUERY} {_status:draft}: ${restFact(result)}`);
    const onPage = await listed("id", slug);
    const seen = await anonymous(id);
    const record = await stored(id);
    const staff = await staffRead(id);
    const remove = await rest("DELETE", `/api/publications/${id}`, { token: token() });
    const still = (await stored(id)).id === id;
    assert.ok(
      onPage === undefined && seen === "NotFound" && record._status === "draft" && record.everPublished === true &&
      record.publishedAt === d1 && staff.liveOnSite === "no" && remove.status === 403 && still,
      `listed=${onPage !== undefined}; anonymous findByID=${seen}; stored _status=${record._status}, everPublished=${String(record.everPublished)}, ` +
      `publishedAt kept=${record.publishedAt === d1}; staff liveOnSite=${String(staff.liveOnSite)}; editor DELETE ${restFact(remove)}; still exists=${still}`,
    );
  });

  test("W7 editor republishes: listed again, publishedAt still the first date", async () => {
    const { id, slug } = chained();
    const result = await rest("PATCH", `/api/publications/${id}`, { token: token(), body: { _status: "published" } });
    assert.equal(result.status, 200, `editor PATCH _status=published: ${restFact(result)}`);
    const onPage = await listed("id", slug);
    const record = await stored(id);
    assert.ok(
      onPage === T2 && record._status === "published" && record.publishedAt === d1,
      `listed title=${onPage ?? "not listed"}; stored _status=${record._status}; publishedAt kept=${record.publishedAt === d1}`,
    );
  });

  // ------------------------------------------------------------ W8 status per language
  test("W8 unpublishing the ID version leaves the EN version live", async () => {
    const group = await createGroup(p(), AREA, "w8");
    const idRecord = await createPub(fullData("w8 ID", "w8-id", group), "published");
    const enRecord = await createPub(fullData("w8 EN", "w8-en", group, { locale: "en" }), "published");
    w8 = { id: idRecord, en: enRecord };
    const shownBefore = { id: await listed("id", idRecord.slug), en: await listed("en", enRecord.slug) };
    const result = await unpublish(idRecord.id);
    const shownAfter = { id: await listed("id", idRecord.slug), en: await listed("en", enRecord.slug) };
    const en = await stored(enRecord.id);
    assert.ok(
      shownBefore.id !== undefined && shownBefore.en !== undefined && result.status === 200 &&
      shownAfter.id === undefined && shownAfter.en === enRecord.title && en._status === "published",
      `before: ID listed=${shownBefore.id !== undefined}, EN listed=${shownBefore.en !== undefined}; unpublish ID ${restFact(result)}; ` +
      `after: ID listed=${shownAfter.id !== undefined}, EN listed=${shownAfter.en !== undefined}; stored EN _status=${en._status}`,
    );
  });

  // ------------------------------------------------------------ W9 liveOnSite in the staff list
  test("W9 staff list: liveOnSite yes only for published + public records", async () => {
    if (!w8) throw new Error("W8 did not create its records");
    const registered = await createPub(
      fullData("w9 registered", "w9-registered", await createGroup(p(), AREA, "w9 registered"), { accessLevel: "registered" }),
      "published",
    );
    const draftOnly = await createPub(fullData("w9 draft", "w9-draft", await createGroup(p(), AREA, "w9 draft")), "draft");
    const result = await rest("GET", `/api/publications?draft=true&depth=0&limit=100&where[slug][like]=${PREFIX}`, { token: token() });
    const docs = (Array.isArray(result.body.docs) ? result.body.docs : []) as JsonObject[];
    const live = new Map(docs.map((doc) => [String(doc.slug), doc.liveOnSite]));
    const expected: Array<[string, string]> = [
      [chained().slug, "yes"],
      [w8.en.slug, "yes"],
      [w8.id.slug, "no"],
      [registered.slug, "no"],
      [draftOnly.slug, "no"],
    ];
    const wrong = expected.filter(([slug, value]) => live.get(slug) !== value).map(([slug, value]) => `${slug}=${String(live.get(slug))} (expected ${value})`);
    assert.ok(result.status === 200 && wrong.length === 0, `staff GET list: ${restFact(result)}; ${docs.length} docs; wrong: [${wrong.join("; ")}]`);
  });

  test("W9b anonymous Local API find without select: no liveOnSite key", async () => {
    const found = await p().find({
      collection: "publications",
      where: { slug: { equals: chained().slug } },
      depth: 0,
      overrideAccess: false,
    });
    const doc = found.docs[0];
    assert.ok(doc !== undefined && !("liveOnSite" in doc), `docs=${found.docs.length}; liveOnSite key present=${doc ? "liveOnSite" in doc : "no doc"}`);
  });

  // ------------------------------------------------------------ W13 saves without _status that must stay allowed
  test("W13 save without _status: accepted on a live record without a draft, a never-published draft, an unpublished record", async () => {
    const live = await createPub(fullData("w13 live", "w13-live", await createGroup(p(), AREA, "w13 live")), "published");
    const draft = await createPub(fullData("w13 draft", "w13-draft", await createGroup(p(), AREA, "w13 draft")), "draft");
    const gone = await createPub(fullData("w13 unpublished", "w13-unpublished", await createGroup(p(), AREA, "w13 unpublished")), "published");
    const unpublished = await unpublish(gone.id);
    assert.equal(unpublished.status, 200, `unpublish setup: ${restFact(unpublished)}`);
    const outcomes: string[] = [];
    for (const [name, record, status] of [
      ["a live", live, "published"],
      ["b draft", draft, "draft"],
      ["c unpublished", gone, "draft"],
    ] as const) {
      const title = `${LABEL}w13 ${name} edited`;
      let outcome = "ACCEPTED";
      try {
        await p().update({ collection: "publications", id: record.id, data: { title }, depth: 0, overrideAccess: true });
      } catch (error) {
        outcome = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
      }
      const saved = await stored(record.id);
      const ok = outcome === "ACCEPTED" && saved._status === status && saved.title === title;
      outcomes.push(`(${name}) ${outcome}, stored _status=${saved._status} (expected ${status}), title updated=${saved.title === title}${ok ? "" : " <-"}`);
    }
    assert.ok(outcomes.every((line) => !line.endsWith(" <-")), outcomes.join("; "));
  });
});
