/**
 * M2-02 localization checks (spike only): DEC-004 hybrid localization and
 * DEC-005 slug per locale on Payload 3.93.0, through the Local API and REST.
 *
 * Usage (production server running, e.g. `bun run start --port 3100`):
 *   bun run payload run scripts/spike/m2-02-localization-checks.ts
 * SPIKE_BASE_URL overrides http://localhost:3100. Needs the M2-01 seed
 * (scripts/spike/m2-01-seed.ts) and SPIKE_ADMIN_EMAIL / SPIKE_ADMIN_PASSWORD
 * for the staff REST calls (JWT kept in memory, never printed).
 *
 * Output: one line per sub-check `PASS|FAIL|OBSERVED <id> <fact>`, then a
 * SUMMARY line. PASS/FAIL lines are must-pass; exit code 1 if any FAIL.
 *
 * Fixtures: publications with slug `fixture-m2-chk-*` and translation groups
 * labelled `[FIXTURE] chk *`. The script deletes them at start (spike-created
 * data only) and leaves the new ones in place for inspection.
 */
import { getPayload, ValidationError } from "payload";
import type { RequiredDataFromCollectionSlug } from "payload";
import config from "@payload-config";
import { requireEnv } from "../../payload/env";
import { getPublicationAlternates } from "../../lib/publications/alternates";
import { updateSharedFields } from "../../lib/publications/update-shared-fields";
import type { Publication } from "../../payload/payload-types";

type PubData = RequiredDataFromCollectionSlug<"publications">;
type Status = "published" | "draft";
type JsonObject = Record<string, unknown>;
type RestResult = { status: number; body: JsonObject };
type RestError = { message?: string; data?: { errors?: { path?: string; message?: string }[] } };

const BASE_URL = process.env.SPIKE_BASE_URL ?? "http://localhost:3100";
const SLUG_PREFIX = "fixture-m2-chk-";
const GROUP_PREFIX = "[FIXTURE] chk ";
const SUMMARY_TEXT = "[FIXTURE] Ringkasan uji lokalisasi M2-02.";
const HOOK_MESSAGE = "Field bersama harus sama";

const payload = await getPayload({ config });
const counts = { pass: 0, fail: 0, observed: 0 };

function check(id: string, pass: boolean, fact: string): void {
  if (pass) {
    counts.pass++;
  } else {
    counts.fail++;
    process.exitCode = 1;
  }
  console.log(`${pass ? "PASS" : "FAIL"} ${id} ${fact}`);
}

function observe(id: string, fact: string): void {
  counts.observed++;
  console.log(`OBSERVED ${id} ${fact}`);
}

function describeError(error: unknown): string {
  if (error instanceof ValidationError) {
    const items = error.data.errors.map((item) => `${item.path}: ${item.message}`).join("; ");
    const origin = items.includes("Value must be unique")
      ? " (message produced by @payloadcms/drizzle handleUpsertError for Postgres 23505)"
      : "";
    return `ValidationError ${error.status} [${items}]${origin}`;
  }
  if (error instanceof Error) return `${error.name}: ${error.message}`;
  return String(error);
}

type Attempt<T> = { ok: true; value: T } | { ok: false; error: string; byHook: boolean };

async function attempt<T>(task: () => Promise<T>): Promise<Attempt<T>> {
  try {
    return { ok: true, value: await task() };
  } catch (error) {
    const text = describeError(error);
    return { ok: false, error: text, byHook: text.includes(HOOK_MESSAGE) };
  }
}

function outcome<T>(result: Attempt<T>): string {
  return result.ok ? "ACCEPTED" : `rejected: ${result.error}`;
}

async function rest(method: string, path: string, options: { token?: string; body?: unknown } = {}): Promise<RestResult> {
  const headers: Record<string, string> = {};
  if (options.token) headers.Authorization = `JWT ${options.token}`;
  if (options.body !== undefined) headers["Content-Type"] = "application/json";
  try {
    const response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    });
    const text = await response.text();
    let body: JsonObject = {};
    try {
      body = text ? (JSON.parse(text) as JsonObject) : {};
    } catch {
      body = { nonJson: true };
    }
    return { status: response.status, body };
  } catch (error) {
    return { status: 0, body: { fetchError: error instanceof Error ? error.message : String(error) } };
  }
}

function restErrors(body: JsonObject): string {
  const errors = (body.errors ?? []) as RestError[];
  return errors
    .map((error) =>
      error.data?.errors?.length
        ? error.data.errors.map((item) => `${item.path}: ${item.message}`).join("; ")
        : (error.message ?? ""),
    )
    .join(" | ");
}

function restDocs(body: JsonObject): JsonObject[] {
  return (body.docs ?? []) as JsonObject[];
}

function restRejectedByHook(result: RestResult): boolean {
  return result.status === 400 && restErrors(result.body).includes(HOOK_MESSAGE);
}

function restFact(result: RestResult): string {
  const errors = restErrors(result.body);
  return `HTTP ${result.status}${errors ? ` [${errors}]` : ""}`;
}

async function idBySlug(collection: "authors" | "topics" | "publication-types", slug: string): Promise<number> {
  const found = await payload.find({ collection, where: { slug: { equals: slug } }, limit: 1, depth: 0, overrideAccess: true });
  const doc = found.docs[0];
  if (!doc) throw new Error(`Seed fixture ${slug} missing; run scripts/spike/m2-01-seed.ts`);
  return doc.id;
}

async function cleanup(): Promise<string> {
  const publications = await payload.find({ collection: "publications", depth: 0, pagination: false, overrideAccess: true });
  const ownPublications = publications.docs.filter((doc) => doc.slug.startsWith(SLUG_PREFIX));
  for (const doc of ownPublications) {
    await payload.delete({ collection: "publications", id: doc.id, overrideAccess: true });
  }
  const groups = await payload.find({ collection: "translation-groups", depth: 0, pagination: false, overrideAccess: true });
  const ownGroups = groups.docs.filter((doc) => doc.label.startsWith(GROUP_PREFIX));
  for (const doc of ownGroups) {
    await payload.delete({ collection: "translation-groups", id: doc.id, overrideAccess: true });
  }
  return `publications=${ownPublications.length} groups=${ownGroups.length}`;
}

async function createGroup(name: string): Promise<number> {
  const group = await payload.create({ collection: "translation-groups", data: { label: `${GROUP_PREFIX}${name}` }, overrideAccess: true });
  return group.id;
}

async function createPub(data: PubData, status: Status): Promise<Publication> {
  return payload.create({
    collection: "publications",
    data: { ...data, _status: status },
    draft: status === "draft",
    depth: 0,
    overrideAccess: true,
  });
}

async function readStaff(id: number, draft = false): Promise<Publication> {
  return payload.findByID({ collection: "publications", id, depth: 0, draft, overrideAccess: true });
}

function sameJson(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

function sortedKeys(record: Record<string, string | undefined>): Record<string, string | undefined> {
  return Object.fromEntries(Object.entries(record).sort(([a], [b]) => a.localeCompare(b)));
}

async function run(): Promise<void> {
  console.log(`INFO cleanup deleted ${await cleanup()}`);

  const typePolicy = await idBySlug("publication-types", "fixture-type-policy-brief");
  const typeRiset = await idBySlug("publication-types", "fixture-type-riset");
  const topicEnergi = await idBySlug("topics", "fixture-topic-energi");
  const topicIdOnly = await idBySlug("topics", "fixture-topic-id-only");
  const authorA = await idBySlug("authors", "fixture-author-a");
  const authorB = await idBySlug("authors", "fixture-author-b");

  const pubData = (title: string, slug: string, locale: "id" | "en", group: number, overrides: Partial<PubData> = {}): PubData => ({
    title,
    slug,
    locale,
    translationGroup: group,
    summary: SUMMARY_TEXT,
    publicationType: typePolicy,
    topics: [topicEnergi],
    authors: [authorA],
    accessLevel: "public",
    ...overrides,
  });

  const login = await rest("POST", "/api/users/login", {
    body: { email: requireEnv("SPIKE_ADMIN_EMAIL"), password: requireEnv("SPIKE_ADMIN_PASSWORD") },
  });
  const token = typeof login.body.token === "string" ? login.body.token : undefined;
  console.log(`INFO staff REST login HTTP ${login.status} token=${token ? "received" : "missing"}`);

  // ---------------------------------------------------------------- C1 slug per locale
  const g1 = await createGroup("G1 slug");
  const g2 = await createGroup("G2 slug");
  const c1a = await attempt(() => createPub(pubData("[FIXTURE] Chk dup ID", "fixture-m2-chk-dup", "id", g1), "published"));
  check("C1a", c1a.ok, `published locale id slug fixture-m2-chk-dup in G1: ${outcome(c1a)}`);
  const c1b = await attempt(() => createPub(pubData("[FIXTURE] Chk dup ID G2", "fixture-m2-chk-dup", "id", g2), "published"));
  check("C1b", !c1b.ok, `same locale id + slug in another group G2: ${outcome(c1b)}`);
  const c1c = await attempt(() => createPub(pubData("[FIXTURE] Chk dup EN", "fixture-m2-chk-dup", "en", g1), "published"));
  check("C1c", c1c.ok, `locale en + same slug fixture-m2-chk-dup: ${outcome(c1c)}`);

  const docB = await createPub(pubData("[FIXTURE] Chk B", "fixture-m2-chk-b", "id", g2), "published");
  const c1dDraft = await attempt(() =>
    payload.update({ collection: "publications", id: docB.id, data: { slug: "fixture-m2-chk-dup" }, draft: true, depth: 0, overrideAccess: true }),
  );
  const bDraft = await readStaff(docB.id, true);
  observe(
    "C1d",
    `draft save of published B (locale id) with taken slug fixture-m2-chk-dup: ${outcome(c1dDraft)}; latest draft slug=${bDraft.slug} (versions table _publications_v has no unique index)`,
  );
  const c1dPublish = await attempt(() =>
    payload.update({
      collection: "publications",
      id: docB.id,
      data: { slug: "fixture-m2-chk-dup", _status: "published" },
      depth: 0,
      overrideAccess: true,
    }),
  );
  const bPublic = await payload.findByID({ collection: "publications", id: docB.id, depth: 0, overrideAccess: false });
  check(
    "C1d-publish",
    !c1dPublish.ok && bPublic.slug === "fixture-m2-chk-b",
    `publishing B with the taken slug: ${outcome(c1dPublish)}; anonymous slug of B=${bPublic.slug}`,
  );
  const c1e = await attempt(() => createPub(pubData("[FIXTURE] Chk dup EN 2", "fixture-m2-chk-dup-en2", "en", g1), "published"));
  check("C1e", !c1e.ok, `second en record in G1: ${outcome(c1e)}`);

  // ---------------------------------------------------------------- C2 shared fields
  const g4 = await createGroup("G4 shared");
  const sharedSet = { topics: [topicEnergi, topicIdOnly], authors: [authorA, authorB] };
  await createPub(pubData("[FIXTURE] Chk shared ID", "fixture-m2-chk-shared-id", "id", g4, sharedSet), "published");

  const c2a = await attempt(() =>
    createPub(pubData("[FIXTURE] Chk shared EN", "fixture-m2-chk-shared-en", "en", g4, { ...sharedSet, accessLevel: "registered" }), "published"),
  );
  check("C2a-local", !c2a.ok && c2a.byHook, `Local API create EN sibling with accessLevel registered (ID has public): ${outcome(c2a)}`);
  const c2aRest = await rest("POST", "/api/publications", {
    token,
    body: {
      ...pubData("[FIXTURE] Chk shared EN rest", "fixture-m2-chk-shared-en-rest", "en", g4, { ...sharedSet, accessLevel: "subscriber" }),
      _status: "published",
    },
  });
  check("C2a-rest", restRejectedByHook(c2aRest), `REST POST EN sibling with accessLevel subscriber: ${restFact(c2aRest)}`);

  const sharedEn = await createPub(pubData("[FIXTURE] Chk shared EN", "fixture-m2-chk-shared-en", "en", g4, sharedSet), "published");

  const c2b = await attempt(() =>
    payload.update({
      collection: "publications",
      id: sharedEn.id,
      data: { topics: [topicIdOnly, topicEnergi] },
      depth: 0,
      overrideAccess: true,
    }),
  );
  check("C2b-local", !c2b.ok && c2b.byHook, `Local API update EN topics order swapped: ${outcome(c2b)}`);

  const c2c = await attempt(() =>
    payload.update({ collection: "publications", id: sharedEn.id, data: { publicationType: typeRiset }, draft: true, depth: 0, overrideAccess: true }),
  );
  check("C2c-local", !c2c.ok && c2c.byHook, `Local API draft save (draft: true) with other publicationType: ${outcome(c2c)}`);
  const c2cRest = await rest("PATCH", `/api/publications/${sharedEn.id}?draft=true&depth=0`, { token, body: { publicationType: typeRiset } });
  check("C2c-rest", restRejectedByHook(c2cRest), `REST PATCH ?draft=true with other publicationType: ${restFact(c2cRest)}`);

  const c2d = await attempt(() =>
    payload.update({
      collection: "publications",
      id: sharedEn.id,
      data: { authors: [authorB], _status: "published" },
      depth: 0,
      overrideAccess: true,
    }),
  );
  check("C2d-local", !c2d.ok && c2d.byHook, `Local API publish (_status published) with authors [B] (ID has [A,B]): ${outcome(c2d)}`);
  const c2dRest = await rest("PATCH", `/api/publications/${sharedEn.id}?draft=true&depth=0`, {
    token,
    body: { authors: [authorB, authorA], _status: "published" },
  });
  check("C2d-rest", restRejectedByHook(c2dRest), `REST publish (?draft=true + _status published, as the admin Publish button) with authors order [B,A]: ${restFact(c2dRest)}`);

  const c2e = await attempt(() =>
    payload.update({ collection: "publications", id: sharedEn.id, data: { title: "[FIXTURE] Chk shared EN (edited)" }, depth: 0, overrideAccess: true }),
  );
  check("C2e-local", c2e.ok, `Local API title-only update: ${outcome(c2e)}`);
  const c2eRest = await rest("PATCH", `/api/publications/${sharedEn.id}?depth=0`, { token, body: { title: "[FIXTURE] Chk shared EN (edited via REST)" } });
  check("C2e-rest", c2eRest.status === 200, `REST title-only PATCH: ${restFact(c2eRest)}`);

  const c2f = await attempt(() => updateSharedFields(payload, g4, { accessLevel: "registered" }));
  const g4After = await payload.find({ collection: "publications", where: { translationGroup: { equals: g4 } }, depth: 0, overrideAccess: true, pagination: false });
  const g4Levels = g4After.docs.map((doc) => `${doc.locale}=${doc.accessLevel}`).sort().join(",");
  check(
    "C2f",
    c2f.ok && g4After.docs.length === 2 && g4After.docs.every((doc) => doc.accessLevel === "registered"),
    `updateSharedFields(G4, accessLevel registered): ${c2f.ok ? `updated ${c2f.value.length} records` : c2f.error}; now ${g4Levels}`,
  );

  const g5 = await createGroup("G5 rollback");
  const rbId = await createPub(pubData("[FIXTURE] Chk rollback ID", "fixture-m2-chk-rb-id", "id", g5), "published");
  const rbEnData = { ...pubData("[FIXTURE] Chk rollback EN draft", "fixture-m2-chk-rb-en", "en", g5), summary: undefined } as unknown as PubData;
  const rbEn = await createPub(rbEnData, "draft");
  const c2fRollback = await attempt(() => updateSharedFields(payload, g5, { accessLevel: "subscriber" }));
  const rbIdAfter = await readStaff(rbId.id);
  const rbEnAfter = await readStaff(rbEn.id, true);
  check(
    "C2f-rollback",
    !c2fRollback.ok && rbIdAfter.accessLevel === "public" && rbEnAfter.accessLevel === "public",
    `updateSharedFields(G5) where the 2nd record (EN draft without summary) fails validation: ${outcome(c2fRollback)}; after: id=${rbIdAfter.accessLevel} (updated first, lower id), en=${rbEnAfter.accessLevel}`,
  );

  const c2g = await rest("PATCH", `/api/publications/${sharedEn.id}?depth=0`, { token, body: { accessLevel: "subscriber" } });
  check("C2g", restRejectedByHook(c2g), `REST PATCH accessLevel subscriber (group has registered) with staff JWT: ${restFact(c2g)}`);
  const c2h = await rest("PATCH", `/api/publications/${sharedEn.id}?depth=0&context[sharedFieldSync]=true&sharedFieldSync=true`, {
    token,
    body: { accessLevel: "subscriber", context: { sharedFieldSync: true } },
  });
  const sharedEnAfter = await readStaff(sharedEn.id);
  check(
    "C2h",
    restRejectedByHook(c2h) && sharedEnAfter.accessLevel === "registered",
    `REST PATCH with context in body and query: ${restFact(c2h)}; accessLevel still ${sharedEnAfter.accessLevel}`,
  );

  // ---------------------------------------------------------------- C3 no draft leak
  const g3 = await createGroup("G3 draft leak");
  const leakEn = await createPub(pubData("[FIXTURE] Chk leak EN", "fixture-m2-chk-leak-en", "en", g3), "published");
  const leakId = await createPub(pubData("[FIXTURE] Chk leak ID draft", "fixture-m2-chk-leak-id", "id", g3), "draft");
  const g6 = await createGroup("G6 pending draft");
  const publishedTitle = "[FIXTURE] Chk P published title";
  const draftTitle = "[FIXTURE] DRAFT-ONLY TITLE";
  const docP = await createPub(pubData(publishedTitle, "fixture-m2-chk-leak-p", "id", g6), "published");
  await payload.update({ collection: "publications", id: docP.id, data: { title: draftTitle }, draft: true, depth: 0, overrideAccess: true });
  const staffDraftTitle = (await readStaff(docP.id, true)).title;
  console.log(`INFO C3 setup: staff draft read of P shows ${staffDraftTitle === draftTitle ? "the draft-only title" : "another title"}`);

  const c3aRest = await rest("GET", `/api/publications?where[translationGroup][equals]=${g3}&depth=0`);
  const c3aDocs = restDocs(c3aRest.body);
  check(
    "C3a-rest",
    c3aRest.status === 200 && c3aDocs.length === 1 && c3aDocs[0].locale === "en",
    `anonymous list of G3: HTTP ${c3aRest.status} docs=${c3aDocs.length} locales=${c3aDocs.map((doc) => doc.locale).join(",")}`,
  );
  const c3aLocal = await payload.find({ collection: "publications", where: { translationGroup: { equals: g3 } }, depth: 0, overrideAccess: false });
  check(
    "C3a-local",
    c3aLocal.docs.length === 1 && c3aLocal.docs[0].locale === "en",
    `Local API overrideAccess:false list of G3: docs=${c3aLocal.docs.length} locales=${c3aLocal.docs.map((doc) => doc.locale).join(",")}`,
  );

  const c3bRest = await rest("GET", `/api/publications/${leakId.id}?depth=0`);
  check("C3b-rest", c3bRest.status === 403 || c3bRest.status === 404, `anonymous GET of the draft-only ID record: ${restFact(c3bRest)}`);
  const c3bLocal = await attempt(() => payload.findByID({ collection: "publications", id: leakId.id, depth: 0, overrideAccess: false }));
  check("C3b-local", !c3bLocal.ok, `Local API overrideAccess:false findByID of the draft-only record: ${outcome(c3bLocal)}`);

  const c3cRest = await rest("GET", `/api/publications?draft=true&where[translationGroup][equals]=${g3}&depth=0`);
  const c3cDocs = restDocs(c3cRest.body);
  check(
    "C3c-rest",
    c3cRest.status === 200 && c3cDocs.every((doc) => doc._status === "published" && doc.locale === "en"),
    `anonymous list ?draft=true of G3: HTTP ${c3cRest.status} docs=${c3cDocs.length} statuses=${c3cDocs.map((doc) => `${doc.locale}:${doc._status}`).join(",")}`,
  );
  const c3cLocal = await payload.find({ collection: "publications", where: { translationGroup: { equals: g3 } }, draft: true, depth: 0, overrideAccess: false });
  check(
    "C3c-local",
    c3cLocal.docs.every((doc) => doc._status === "published" && doc.locale === "en"),
    `Local API overrideAccess:false draft:true list of G3: docs=${c3cLocal.docs.length} statuses=${c3cLocal.docs.map((doc) => `${doc.locale}:${doc._status}`).join(",")}`,
  );

  const c3dDraftParam = await rest("GET", `/api/publications/${docP.id}?draft=true&depth=0`);
  const c3dPlain = await rest("GET", `/api/publications/${docP.id}?depth=0`);
  const c3dList = await rest("GET", `/api/publications?draft=true&where[slug][equals]=fixture-m2-chk-leak-p&depth=0`);
  const titleLabel = (title: unknown): string =>
    title === publishedTitle ? "published" : title === draftTitle ? "DRAFT" : title === undefined ? "none" : String(title);
  const c3dTitles = [c3dDraftParam.body.title, c3dPlain.body.title, restDocs(c3dList.body)[0]?.title];
  const c3dLeak = [...c3dTitles, JSON.stringify(c3dDraftParam.body), JSON.stringify(c3dList.body)].some((value) =>
    String(value).includes(draftTitle),
  );
  // Must-pass: the draft-only title never reaches an anonymous reader and the
  // plain GET shows the published title. What ?draft=true returns is recorded.
  check(
    "C3d-rest",
    !c3dLeak && c3dPlain.status === 200 && c3dPlain.body.title === publishedTitle,
    `anonymous reads of P with pending draft: draft title leaked=${c3dLeak}; plain GET HTTP ${c3dPlain.status} title=${titleLabel(c3dPlain.body.title)}`,
  );
  observe(
    "C3d-draftparam",
    `anonymous ?draft=true on P: GET by id HTTP ${c3dDraftParam.status} title=${titleLabel(c3dTitles[0])}; list by slug HTTP ${c3dList.status} docs=${restDocs(c3dList.body).length} title=${titleLabel(c3dTitles[2])}`,
  );
  const c3dLocalDraft = await attempt(() =>
    payload.findByID({ collection: "publications", id: docP.id, draft: true, depth: 0, overrideAccess: false }),
  );
  const c3dLocalPlain = await payload.findByID({ collection: "publications", id: docP.id, depth: 0, overrideAccess: false });
  check(
    "C3d-local",
    (!c3dLocalDraft.ok || c3dLocalDraft.value.title !== draftTitle) && c3dLocalPlain.title === publishedTitle,
    `Local API overrideAccess:false on P: draft:true ${c3dLocalDraft.ok ? `title=${titleLabel(c3dLocalDraft.value.title)}` : c3dLocalDraft.error}; plain title=${titleLabel(c3dLocalPlain.title)}`,
  );

  const c3eRest = await rest("GET", "/api/publications/versions");
  check("C3e-rest", c3eRest.status === 401 || c3eRest.status === 403, `anonymous GET /api/publications/versions: ${restFact(c3eRest)}`);
  const c3eLocal = await attempt(() => payload.findVersions({ collection: "publications", depth: 0, limit: 1, overrideAccess: false }));
  check("C3e-local", !c3eLocal.ok, `Local API overrideAccess:false findVersions: ${outcome(c3eLocal)}`);

  // ---------------------------------------------------------------- C4 fallback false
  const c4a = await payload.findByID({ collection: "topics", id: topicIdOnly, locale: "en", depth: 0, overrideAccess: false });
  const c4aId = await payload.findByID({ collection: "topics", id: topicIdOnly, locale: "id", depth: 0, overrideAccess: false });
  check(
    "C4a",
    (c4a.name === null || c4a.name === undefined) && Boolean(c4aId.name),
    `Local API topic fixture-topic-id-only locale en: name=${c4a.name === undefined ? "undefined" : JSON.stringify(c4a.name)} (locale id name present=${Boolean(c4aId.name)})`,
  );
  const c4b = await rest("GET", `/api/topics/${topicIdOnly}?locale=en&depth=0`);
  check(
    "C4b",
    c4b.status === 200 && (c4b.body.name === null || c4b.body.name === undefined),
    `REST topic ?locale=en: HTTP ${c4b.status} name=${"name" in c4b.body ? JSON.stringify(c4b.body.name) : "absent"}`,
  );
  const c4c = await rest("GET", `/api/topics/${topicIdOnly}?locale=en&fallback-locale=id&depth=0`);
  observe(
    "C4c",
    `REST topic ?locale=en&fallback-locale=id: HTTP ${c4c.status} name=${"name" in c4c.body ? JSON.stringify(c4c.body.name) : "absent"} -> client ${c4c.body.name ? "CAN" : "cannot"} force fallback with the query param`,
  );
  const g7 = await createGroup("G7 only id");
  await createPub(pubData("[FIXTURE] Chk only ID", "fixture-m2-chk-only-id", "id", g7), "published");
  const c4dLocal = await payload.find({
    collection: "publications",
    where: { and: [{ translationGroup: { equals: g7 } }, { locale: { equals: "en" } }] },
    depth: 0,
    overrideAccess: false,
  });
  const c4dRest = await rest("GET", `/api/publications?where[translationGroup][equals]=${g7}&where[locale][equals]=en&depth=0`);
  check(
    "C4d",
    c4dLocal.totalDocs === 0 && c4dRest.status === 200 && restDocs(c4dRest.body).length === 0,
    `group with only an ID record, query locale en: Local API docs=${c4dLocal.totalDocs}, REST HTTP ${c4dRest.status} docs=${restDocs(c4dRest.body).length}`,
  );

  // ---------------------------------------------------------------- C5 hreflang
  const g8 = await createGroup("G8 hreflang");
  const hlId = await createPub(pubData("[FIXTURE] Chk hreflang ID", "fixture-m2-chk-hl-id", "id", g8), "published");
  const hlEn = await createPub(pubData("[FIXTURE] Chk hreflang EN", "fixture-m2-chk-hl-en", "en", g8), "published");
  const expectedPair = { en: "/en/publications/fixture-m2-chk-hl-en", id: "/id/publications/fixture-m2-chk-hl-id" };
  const c5aFromId = sortedKeys(await getPublicationAlternates(payload, hlId));
  const c5aFromEn = sortedKeys(await getPublicationAlternates(payload, hlEn));
  check(
    "C5a",
    sameJson(c5aFromId, expectedPair) && sameJson(c5aFromEn, expectedPair),
    `ID+EN both published: from id ${JSON.stringify(c5aFromId)}; from en ${JSON.stringify(c5aFromEn)}`,
  );
  const c5b = await getPublicationAlternates(payload, leakEn);
  check("C5b", sameJson(c5b, {}), `EN published + ID draft (G3): ${JSON.stringify(c5b)}`);
  const g9 = await createGroup("G9 same slug other group");
  await createPub(pubData("[FIXTURE] Chk hreflang other group", "fixture-m2-chk-hl-en", "id", g9), "published");
  const c5c = sortedKeys(await getPublicationAlternates(payload, hlEn));
  check("C5c", sameJson(c5c, expectedPair), `G9 has a published id record with slug fixture-m2-chk-hl-en; G8 alternates: ${JSON.stringify(c5c)}`);
  await payload.update({ collection: "publications", id: hlId.id, data: { _status: "draft" }, depth: 0, overrideAccess: true });
  const c5dFromEn = await getPublicationAlternates(payload, hlEn);
  const c5dFromId = await getPublicationAlternates(payload, hlId);
  check(
    "C5d",
    sameJson(c5dFromEn, {}) && sameJson(c5dFromId, {}),
    `after unpublishing the ID sibling (update _status draft): from en ${JSON.stringify(c5dFromEn)}; from id ${JSON.stringify(c5dFromId)}`,
  );

  // ---------------------------------------------------------------- C6 version restore isolation
  const g10 = await createGroup("G10 restore");
  const rsId = await createPub(pubData("[FIXTURE] RS ID v1", "fixture-m2-chk-rs-id", "id", g10), "published");
  const rsEn = await createPub(pubData("[FIXTURE] RS EN v1", "fixture-m2-chk-rs-en", "en", g10), "published");
  for (const title of ["[FIXTURE] RS EN v2", "[FIXTURE] RS EN v3"]) {
    await payload.update({ collection: "publications", id: rsEn.id, data: { title }, depth: 0, overrideAccess: true });
  }
  await payload.update({ collection: "publications", id: rsId.id, data: { title: "[FIXTURE] RS ID v2" }, depth: 0, overrideAccess: true });
  const idBefore = await readStaff(rsId.id);
  const enVersions = await payload.findVersions({
    collection: "publications",
    where: { parent: { equals: rsEn.id } },
    sort: "createdAt",
    depth: 0,
    pagination: false,
    overrideAccess: true,
  });
  const enV1 = enVersions.docs.find((doc) => doc.version.title === "[FIXTURE] RS EN v1");
  if (!enV1) throw new Error("C6 setup: EN v1 version not found");
  const c6aRestore = await attempt(() => payload.restoreVersion({ collection: "publications", id: enV1.id, depth: 0, overrideAccess: true }));
  const enAfter = await readStaff(rsEn.id);
  const idAfter = await readStaff(rsId.id);
  check(
    "C6a",
    c6aRestore.ok && enAfter.title === "[FIXTURE] RS EN v1" && idAfter.title === idBefore.title && idAfter.updatedAt === idBefore.updatedAt,
    `restore EN v1 (EN versions before restore=${enVersions.docs.length}): ${outcome(c6aRestore)}; EN title=${enAfter.title}; ID title=${idAfter.title}, ID updatedAt ${idAfter.updatedAt === idBefore.updatedAt ? "unchanged" : "CHANGED"}`,
  );

  await updateSharedFields(payload, g10, { accessLevel: "registered" });
  const c6bRestore = await attempt(() => payload.restoreVersion({ collection: "publications", id: enV1.id, depth: 0, overrideAccess: true }));
  const enAfterB = await readStaff(rsEn.id);
  const idAfterB = await readStaff(rsId.id);
  check(
    "C6b",
    !c6bRestore.ok && c6bRestore.byHook && enAfterB.accessLevel === "registered" && idAfterB.accessLevel === "registered",
    `after updateSharedFields(G10, registered), restore EN v1 (accessLevel public): ${outcome(c6bRestore)}; now en=${enAfterB.accessLevel}, id=${idAfterB.accessLevel}`,
  );

  // ---------------------------------------------------------------- C7 `locale` field vs locale param
  const localeField = payload.collections.publications.config.fields.find((field) => "name" in field && field.name === "locale");
  check("C7a", Boolean(localeField), `Publications field named 'locale' accepted by config sanitization and migrate:create (type ${localeField?.type ?? "missing"}; no rename to 'language')`);

  const c7bPlain = await rest("GET", `/api/publications?where[translationGroup][equals]=${g1}&depth=0&sort=locale`);
  const c7bLocale = await rest("GET", `/api/publications?where[translationGroup][equals]=${g1}&depth=0&sort=locale&locale=en`);
  const plainLocales = restDocs(c7bPlain.body).map((doc) => `${doc.locale}:${doc.slug}`);
  const paramLocales = restDocs(c7bLocale.body).map((doc) => `${doc.locale}:${doc.slug}`);
  check(
    "C7b",
    plainLocales.length === 2 && sameJson(plainLocales, paramLocales),
    `REST G1 without locale param ${JSON.stringify(plainLocales)}; with ?locale=en ${JSON.stringify(paramLocales)}`,
  );
  const c7c = await rest("GET", `/api/publications?where[translationGroup][equals]=${g1}&where[locale][equals]=en&depth=0`);
  const c7cDocs = restDocs(c7c.body).map((doc) => `${doc.locale}:${doc.slug}`);
  check("C7c", c7c.status === 200 && sameJson(c7cDocs, ["en:fixture-m2-chk-dup"]), `REST where[locale][equals]=en in G1: ${JSON.stringify(c7cDocs)}`);

  const c7dParam = await payload.find({
    collection: "publications",
    where: { translationGroup: { equals: g1 } },
    locale: "en",
    sort: "locale",
    depth: 0,
    overrideAccess: false,
  });
  const c7dWhere = await payload.find({
    collection: "publications",
    where: { and: [{ translationGroup: { equals: g1 } }, { locale: { equals: "en" } }] },
    depth: 0,
    overrideAccess: false,
  });
  const c7dParamDocs = c7dParam.docs.map((doc) => `${doc.locale}:${doc.slug}`);
  const c7dWhereDocs = c7dWhere.docs.map((doc) => `${doc.locale}:${doc.slug}`);
  check(
    "C7d",
    sameJson(c7dParamDocs, plainLocales) && sameJson(c7dWhereDocs, c7cDocs),
    `Local API find({ locale: 'en' }) ${JSON.stringify(c7dParamDocs)} (= REST without where on locale); where locale equals en ${JSON.stringify(c7dWhereDocs)} (= REST C7c)`,
  );
}

try {
  await run();
} catch (error) {
  check("setup", false, `script aborted: ${describeError(error)}`);
} finally {
  console.log(`SUMMARY pass=${counts.pass} fail=${counts.fail} observed=${counts.observed}`);
  await payload.destroy();
}
// See m2-01-db-smoke.ts: short wait avoids a libuv exit assertion on Windows;
// the payload bin would otherwise exit 0 and drop process.exitCode.
await new Promise((resolve) => setTimeout(resolve, 250));
process.exit(process.exitCode ?? 0);
