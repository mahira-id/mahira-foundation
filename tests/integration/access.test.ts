import assert from "node:assert/strict";
import { after, before, describe, test } from "node:test";
import type { Payload, RequiredDataFromCollectionSlug } from "payload";

import type { Publication, Topic, User } from "../../payload/payload-types";
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
import { assertServerUp, login, rest, restDoc, restErrors, restFact, type JsonObject } from "../helpers/http";
import { closeTestPayload, getTestPayload } from "../helpers/payload";

/**
 * Access checks (M3-02; port of the archived m3-02-access-checks, M3-10):
 * staff roles, role-based access, closed anonymous REST/GraphQL, anonymous
 * Local API sees only published + public, lifecycle fields and isActive.
 * Needs `next start` with the full env (bun run test:integration).
 *
 * The archived S0/S9 (users count before/after) are the before/after hooks
 * here: the Owner guard runs before any fixture is written and after cleanup.
 * Fixtures: users fixture-test-access-*@example.invalid, slugs
 * fixture-test-access-*, labels "[FIXTURE] test access *".
 */
type PubData = RequiredDataFromCollectionSlug<"publications">;

const AREA = "access";
const PREFIX = areaPrefix(AREA);
const LABEL = areaLabel(AREA);
const ADMIN_EMAIL = areaEmail(AREA, "admin");
const EDITOR_EMAIL = areaEmail(AREA, "editor");
const TEMP_EMAIL = areaEmail(AREA, "temp");
const TOPIC_SLUG = `${PREFIX}topic-id-only`;
const TOPIC_EN_NAME = `${LABEL}topic EN`;
const SUMMARY_TEXT = "[FIXTURE] Ringkasan uji akses M3-10.";
const IS_ACTIVE_MESSAGE = "Term aktif wajib punya nama Bahasa Indonesia dan English";

type Fixtures = {
  admin: User;
  editor: User;
  publicPub: Publication;
  registeredPub: Publication;
  draftPub: Publication;
  topic: Topic;
  adminToken: string | undefined;
  editorToken: string | undefined;
  pubData: (label: string, slug: string, group: number, overrides?: Partial<PubData>) => PubData;
};

describe("access (M3-02 role access, anonymous REST and Local API, lifecycle)", () => {
  let payload: Payload | undefined;
  let fx: Fixtures | undefined;
  let lcAuto: Publication | undefined;

  function p(): Payload {
    if (!payload) throw new Error("Payload not initialised (before hook failed)");
    return payload;
  }

  function f(): Fixtures {
    if (!fx) throw new Error("fixtures not created (before hook failed)");
    return fx;
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

  async function exists(id: number): Promise<boolean> {
    const found = await p().find({
      collection: "publications",
      where: { id: { equals: id } },
      depth: 0,
      draft: true,
      limit: 1,
      overrideAccess: true,
    });
    return found.docs.length === 1;
  }

  before(async (t) => {
    payload = await getTestPayload();
    hookNote(t, `cleanup at start removed ${formatCounts(await cleanupArea(payload, AREA))}`);
    await assertOwnerIntact(payload);
    await assertServerUp();

    const publicationType = await firstId(payload, "publication-types");
    const topicId = await firstId(payload, "topics");
    const author = await firstId(payload, "authors");
    const pubData = (label: string, slug: string, group: number, overrides: Partial<PubData> = {}): PubData => ({
      title: `${LABEL}${label}`,
      slug: `${PREFIX}${slug}`,
      locale: "id",
      translationGroup: group,
      summary: SUMMARY_TEXT,
      publicationType,
      topics: [topicId],
      authors: [author],
      accessLevel: "public",
      ...overrides,
    });

    const adminSecret = randomPassword();
    const editorSecret = randomPassword();
    const admin = await payload.create({
      collection: "users",
      data: { email: ADMIN_EMAIL, password: adminSecret, role: "admin" },
      overrideAccess: true,
    });
    const editor = await payload.create({
      collection: "users",
      data: { email: EDITOR_EMAIL, password: editorSecret, role: "editor" },
      overrideAccess: true,
    });
    const publicPub = await createPub(pubData("published public", "public", await createGroup(payload, AREA, "public")), "published");
    const registeredPub = await createPub(
      pubData("published registered", "registered", await createGroup(payload, AREA, "registered"), { accessLevel: "registered" }),
      "published",
    );
    const draftPub = await createPub(pubData("draft only", "draft", await createGroup(payload, AREA, "draft")), "draft");
    const topic = await payload.create({
      collection: "topics",
      data: { name: `${LABEL}topik hanya ID`, slug: TOPIC_SLUG },
      locale: "id",
      overrideAccess: true,
    });
    fx = {
      admin,
      editor,
      publicPub,
      registeredPub,
      draftPub,
      topic,
      adminToken: await login(ADMIN_EMAIL, adminSecret),
      editorToken: await login(EDITOR_EMAIL, editorSecret),
      pubData,
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

  // ------------------------------------------------------------ setup
  test("S1 fixture users created: admin role admin, editor role editor", () => {
    const { admin, editor } = f();
    assert.ok(admin.role === "admin" && editor.role === "editor", `admin role=${admin.role}, editor role=${editor.role}`);
  });

  test("S2 fixture logins via POST /api/users/login return a token", () => {
    const { adminToken, editorToken } = f();
    assert.ok(Boolean(adminToken) && Boolean(editorToken), `admin token=${Boolean(adminToken)} editor token=${Boolean(editorToken)}`);
  });

  // ------------------------------------------------------------ anonymous REST
  const anonymousPaths: Array<[string, () => string]> = [
    ["/api/publications", () => "/api/publications"],
    ["/api/publications/<public fixture>", () => `/api/publications/${f().publicPub.id}`],
    ["/api/publications?draft=true", () => "/api/publications?draft=true"],
    ["/api/authors", () => "/api/authors"],
    ["/api/topics", () => "/api/topics"],
    ["/api/topics?locale=en&fallback-locale=id", () => "/api/topics?locale=en&fallback-locale=id"],
    ["/api/publication-types", () => "/api/publication-types"],
    ["/api/media", () => "/api/media"],
    ["/api/translation-groups", () => "/api/translation-groups"],
    ["/api/users", () => "/api/users"],
  ];
  for (const [index, [label, path]] of anonymousPaths.entries()) {
    test(`A1.${index + 1} anonymous GET ${label}: 403`, async () => {
      const result = await rest("GET", path());
      assert.equal(result.status, 403, `anonymous GET ${label}: ${restFact(result)} (expected 403)`);
    });
  }

  test("A2 anonymous POST /api/graphql: not 200 (GraphQL disabled)", async () => {
    const graphql = await rest("POST", "/api/graphql", { body: { query: "{ Publications { docs { id } } }" } });
    assert.notEqual(graphql.status, 200, `anonymous POST /api/graphql: HTTP ${graphql.status} (expected not 200)`);
  });

  // ------------------------------------------------------------ anonymous Local API
  test("L1 anonymous Local API find publications: only published + public", async (t) => {
    const { publicPub, registeredPub, draftPub } = f();
    const anonymousTopics = await p().find({ collection: "topics", depth: 0, limit: 1, overrideAccess: false });
    t.diagnostic(`OBSERVED L4 anonymous Local API find topics: ${anonymousTopics.totalDocs} docs (read allowed for public pages)`);
    const found = await p().find({ collection: "publications", depth: 0, pagination: false, overrideAccess: false });
    const allPublicPublished = found.docs.every((doc) => doc._status === "published" && doc.accessLevel === "public");
    const ids = new Set(found.docs.map((doc) => doc.id));
    const expected = await p().count({
      collection: "publications",
      where: { and: [{ _status: { equals: "published" } }, { accessLevel: { equals: "public" } }] },
      overrideAccess: true,
    });
    assert.ok(
      allPublicPublished &&
        ids.has(publicPub.id) &&
        !ids.has(registeredPub.id) &&
        !ids.has(draftPub.id) &&
        found.totalDocs === expected.totalDocs,
      `anonymous find: ${found.totalDocs} docs (overrideAccess count published+public = ${expected.totalDocs}); ` +
        `all published+public=${allPublicPublished}; public fixture=${ids.has(publicPub.id)}, ` +
        `registered fixture=${ids.has(registeredPub.id)}, draft fixture=${ids.has(draftPub.id)}`,
    );
  });

  for (const [id, label, pick] of [
    ["L2", "registered", (fixtures: Fixtures) => fixtures.registeredPub.id],
    ["L3", "draft-only", (fixtures: Fixtures) => fixtures.draftPub.id],
  ] as const) {
    test(`${id} anonymous Local API findByID ${label} fixture: NotFound`, async () => {
      let outcome = "found";
      try {
        await p().findByID({ collection: "publications", id: pick(f()), depth: 0, overrideAccess: false });
      } catch (error) {
        outcome = error instanceof Error ? error.name : String(error);
      }
      assert.equal(outcome, "NotFound", `anonymous findByID ${label} fixture: ${outcome} (expected NotFound)`);
    });
  }

  // ------------------------------------------------------------ Editor REST
  test("E1 editor POST /api/users: 403, no user created", async () => {
    const result = await rest("POST", "/api/users", {
      token: f().editorToken,
      body: { email: TEMP_EMAIL, password: randomPassword(), role: "editor" },
    });
    const created = await p().count({ collection: "users", where: { email: { equals: TEMP_EMAIL } }, overrideAccess: true });
    assert.ok(result.status === 403 && created.totalDocs === 0, `editor POST /api/users: ${restFact(result)}; user created=${created.totalDocs > 0}`);
  });

  test("E2 editor GET /api/users: only self", async () => {
    const { editor, editorToken } = f();
    const result = await rest("GET", "/api/users", { token: editorToken });
    const ids = ((result.body.docs ?? []) as JsonObject[]).map((doc) => doc.id);
    assert.ok(
      result.status === 200 && result.body.totalDocs === 1 && ids[0] === editor.id,
      `editor GET /api/users: HTTP ${result.status}, totalDocs=${String(result.body.totalDocs)}, only self=${ids[0] === editor.id}`,
    );
  });

  test("E3 editor PATCH own role=admin: stored role stays editor", async () => {
    const { editor, editorToken } = f();
    const result = await rest("PATCH", `/api/users/${editor.id}`, { token: editorToken, body: { role: "admin" } });
    const stored = await p().findByID({ collection: "users", id: editor.id, depth: 0, overrideAccess: true });
    assert.equal(stored.role, "editor", `editor PATCH own role=admin: ${restFact(result)}; stored role=${stored.role}`);
  });

  test("E4 editor PATCH/DELETE another user: refused, admin unchanged", async () => {
    const { admin, editorToken } = f();
    const patch = await rest("PATCH", `/api/users/${admin.id}`, { token: editorToken, body: { role: "editor" } });
    const remove = await rest("DELETE", `/api/users/${admin.id}`, { token: editorToken });
    const stored = await p().findByID({ collection: "users", id: admin.id, depth: 0, overrideAccess: true });
    assert.ok(
      patch.status !== 200 && remove.status !== 200 && stored.role === "admin",
      `editor PATCH other user: ${restFact(patch)}; DELETE other user: ${restFact(remove)}; admin role=${stored.role}`,
    );
  });

  test("E5 editor POST /api/users/unlock: 403", async () => {
    const result = await rest("POST", "/api/users/unlock", { token: f().editorToken, body: { email: ADMIN_EMAIL } });
    assert.equal(result.status, 403, `editor POST /api/users/unlock: ${restFact(result)}`);
  });

  test("E6 editor POST/PATCH topics and POST publication-types: 403 each", async () => {
    const { editorToken, topic } = f();
    const postTopic = await rest("POST", "/api/topics", {
      token: editorToken,
      body: { name: `${LABEL}topik editor`, slug: `${PREFIX}topic-editor` },
    });
    const patchTopic = await rest("PATCH", `/api/topics/${topic.id}`, { token: editorToken, body: { description: "x" } });
    const postType = await rest("POST", "/api/publication-types", {
      token: editorToken,
      body: { name: `${LABEL}jenis editor`, slug: `${PREFIX}type-editor` },
    });
    assert.ok(
      postTopic.status === 403 && patchTopic.status === 403 && postType.status === 403,
      `editor POST /api/topics: ${restFact(postTopic)}; PATCH /api/topics/<id>: ${restFact(patchTopic)}; ` +
        `POST /api/publication-types: ${restFact(postType)} (expected 403 each)`,
    );
  });

  test("E7 editor POST published publication: everPublished forced true, publishedAt set", async () => {
    const { editorToken, pubData } = f();
    const group = await createGroup(p(), AREA, "editor create");
    const result = await rest("POST", "/api/publications", {
      token: editorToken,
      body: { ...pubData("editor create", "editor-create", group), _status: "published", everPublished: false },
    });
    const created = restDoc(result);
    try {
      assert.ok(
        result.status === 201 && created.everPublished === true && typeof created.publishedAt === "string",
        `editor POST /api/publications (client sends everPublished=false): ${restFact(result)}; ` +
          `everPublished=${String(created.everPublished)}; publishedAt set=${typeof created.publishedAt === "string"}`,
      );
    } finally {
      if (typeof created.id === "number") await p().delete({ collection: "publications", id: created.id, overrideAccess: true });
    }
  });

  test("E8 editor GET /api/publications?draft=true includes the draft fixture", async () => {
    const { draftPub, editorToken } = f();
    const result = await rest("GET", `/api/publications?draft=true&where[slug][equals]=${encodeURIComponent(draftPub.slug)}`, {
      token: editorToken,
    });
    const ids = ((result.body.docs ?? []) as JsonObject[]).map((doc) => doc.id);
    assert.ok(result.status === 200 && ids.includes(draftPub.id), `HTTP ${result.status}, draft fixture found=${ids.includes(draftPub.id)}`);
  });

  test("E9 editor PATCH draft everPublished=true: stored false", async () => {
    const { draftPub, editorToken } = f();
    const result = await rest("PATCH", `/api/publications/${draftPub.id}?draft=true`, { token: editorToken, body: { everPublished: true } });
    const stored = await p().findByID({ collection: "publications", id: draftPub.id, depth: 0, draft: true, overrideAccess: true });
    assert.notEqual(stored.everPublished, true, `editor PATCH draft everPublished=true: ${restFact(result)}; stored ${String(stored.everPublished)}`);
  });

  test("E10 editor DELETE ever-published publication: refused, still exists", async () => {
    const { editorToken, publicPub } = f();
    const result = await rest("DELETE", `/api/publications/${publicPub.id}`, { token: editorToken });
    const still = await exists(publicPub.id);
    assert.ok(result.status !== 200 && still, `editor DELETE ever-published fixture: ${restFact(result)}; still exists=${still}`);
  });

  test("E11 editor DELETE never-published draft: deleted", async () => {
    const { draftPub, editorToken } = f();
    const result = await rest("DELETE", `/api/publications/${draftPub.id}`, { token: editorToken });
    const gone = !(await exists(draftPub.id));
    assert.ok(result.status === 200 && gone, `editor DELETE never-published draft: ${restFact(result)}; deleted=${gone}`);
  });

  // ------------------------------------------------------------ Admin REST
  test("D1 admin POST /api/users and DELETE it: 201, 200", async () => {
    const { adminToken } = f();
    const created = await rest("POST", "/api/users", {
      token: adminToken,
      body: { email: TEMP_EMAIL, password: randomPassword(), role: "editor" },
    });
    const id = restDoc(created).id;
    const removed = typeof id === "number" ? await rest("DELETE", `/api/users/${id}`, { token: adminToken }) : { status: 0, body: {} };
    assert.ok(created.status === 201 && removed.status === 200, `admin POST /api/users: ${restFact(created)}; DELETE /api/users/<temp>: ${restFact(removed)}`);
  });

  test("D2 admin PATCH topic isActive=true with only an ID name: 400 on isActive", async () => {
    const { adminToken, topic } = f();
    const result = await rest("PATCH", `/api/topics/${topic.id}`, { token: adminToken, body: { isActive: true } });
    const errors = restErrors(result.body);
    assert.ok(
      result.status === 400 && errors.includes("isActive") && errors.includes(IS_ACTIVE_MESSAGE),
      `admin PATCH topic isActive=true with only an ID name: ${restFact(result)} (expected 400 on isActive)`,
    );
  });

  test("D3 admin adds the EN name, then activates the topic (?locale=id)", async (t) => {
    const { adminToken, topic } = f();
    const addEnglish = await rest("PATCH", `/api/topics/${topic.id}?locale=en`, { token: adminToken, body: { name: TOPIC_EN_NAME } });
    // Payload 3.93.0 with `fallback: false` keeps a missing ?locale as null and
    // loads originalDoc with locale null; once both locale rows exist the
    // stored name is not found for validation. The admin UI always sends
    // ?locale, so the activation is sent the same way; D3x records the quirk.
    const noLocale = await rest("PATCH", `/api/topics/${topic.id}`, { token: adminToken, body: { description: `${LABEL}tanpa locale` } });
    t.diagnostic(`OBSERVED D3x admin PATCH without ?locale on an inactive term with ID and EN names (isActive not sent): ${restFact(noLocale)}`);
    const activate = await rest("PATCH", `/api/topics/${topic.id}?locale=id`, { token: adminToken, body: { isActive: true } });
    const stored = await p().findByID({ collection: "topics", id: topic.id, depth: 0, overrideAccess: true });
    assert.ok(
      addEnglish.status === 200 && activate.status === 200 && stored.isActive === true,
      `PATCH ?locale=en name: ${restFact(addEnglish)}; ?locale=id isActive=true: ${restFact(activate)}; stored isActive=${String(stored.isActive)}`,
    );
  });

  test("D3b admin PATCH ?locale=en name='' on an active term: 400, EN name kept", async () => {
    const { adminToken, topic } = f();
    const result = await rest("PATCH", `/api/topics/${topic.id}?locale=en`, { token: adminToken, body: { name: "" } });
    const stored = await p().findByID({ collection: "topics", id: topic.id, locale: "en", depth: 0, overrideAccess: true });
    assert.ok(
      result.status === 400 && stored.name === TOPIC_EN_NAME,
      `admin PATCH ?locale=en name="": ${restFact(result)}; stored EN name kept=${stored.name === TOPIC_EN_NAME}`,
    );
  });

  test("D4 admin DELETE ever-published publication: deleted", async () => {
    const { adminToken, publicPub } = f();
    const result = await rest("DELETE", `/api/publications/${publicPub.id}`, { token: adminToken });
    const gone = !(await exists(publicPub.id));
    assert.ok(result.status === 200 && gone, `admin DELETE ever-published fixture: ${restFact(result)}; deleted=${gone}`);
  });

  // ------------------------------------------------------------ lifecycle (Local API)
  test("LC1 published create without publishedAt: publishedAt now, everPublished true", async () => {
    const startedAt = Date.now();
    lcAuto = await createPub(f().pubData("lifecycle auto", "lc-auto", await createGroup(p(), AREA, "lc auto")), "published");
    const time = lcAuto.publishedAt ? Date.parse(lcAuto.publishedAt) : Number.NaN;
    assert.ok(
      Number.isFinite(time) && time >= startedAt - 5 * 60_000 && time <= Date.now() + 60_000 && lcAuto.everPublished === true,
      `publishedAt=${lcAuto.publishedAt ?? "null"}, everPublished=${String(lcAuto.everPublished)}`,
    );
  });

  test("LC2 published create with an explicit publishedAt keeps it", async () => {
    const explicitDate = "2026-01-15T00:00:00.000Z";
    const explicit = await createPub(
      f().pubData("lifecycle explicit", "lc-explicit", await createGroup(p(), AREA, "lc explicit"), { publishedAt: explicitDate }),
      "published",
    );
    assert.equal(explicit.publishedAt, explicitDate, `stored ${explicit.publishedAt ?? "null"}`);
  });

  test("LC3 draft create: no publishedAt, everPublished not true", async () => {
    const draft = await createPub(f().pubData("lifecycle draft", "lc-draft", await createGroup(p(), AREA, "lc draft")), "draft");
    assert.ok(!draft.publishedAt && draft.everPublished !== true, `publishedAt=${draft.publishedAt ?? "null"}, everPublished=${String(draft.everPublished)}`);
  });

  test("LC4 update of a published record sending everPublished=false: stays true", async () => {
    if (!lcAuto) throw new Error("LC1 did not create its record");
    const reset = await p().update({
      collection: "publications",
      id: lcAuto.id,
      data: { everPublished: false, title: `${LABEL}lifecycle auto (edited)` },
      depth: 0,
      overrideAccess: true,
    });
    assert.equal(reset.everPublished, true, `stored everPublished=${String(reset.everPublished)}`);
  });

  test("LC5 unpublish (save as draft): everPublished stays true", async () => {
    if (!lcAuto) throw new Error("LC1 did not create its record");
    const unpublished = await p().update({
      collection: "publications",
      id: lcAuto.id,
      data: { _status: "draft" },
      depth: 0,
      overrideAccess: true,
    });
    assert.equal(unpublished.everPublished, true, `everPublished=${String(unpublished.everPublished)}`);
  });
});
