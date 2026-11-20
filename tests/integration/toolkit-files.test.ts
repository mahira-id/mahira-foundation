import assert from "node:assert/strict";
import { after, before, describe, test } from "node:test";
import type { Payload } from "payload";

import { findPublicResources } from "../../lib/cms/learning-hub-query";
import { signedFileUrl } from "../../lib/cms/publication-file-storage";
import { findPublicToolkitFile } from "../../lib/cms/toolkit-file-query";
import { newestCards, type ResourceDoc } from "../../lib/learning-hub/catalog-view";
import { attachmentDisposition } from "../../lib/publications/file-download";
import type { LearningResource, PublicationFile, ToolkitFile, User } from "../../payload/payload-types";
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
import { BASE_URL, assertServerUp, getPage, login, pageFact, rest, restErrors, restFact } from "../helpers/http";
import { closeTestPayload, getTestPayload } from "../helpers/payload";
import { fixturePdf } from "../helpers/pdf";
import { assertNotFoundPage } from "../helpers/publication-pages";

/**
 * Toolkit files and the toolkit download (M3-13, DECISIONS §2.16 decision
 * 9, §2.17 decisions 1A–5A), area `toolkits`. The files go to the private
 * bucket `publication-files` under `toolkits/` (shared by Preview, local
 * runs and tests): every object name starts with `fixture-test-toolkits-`
 * and cleanup deletes the resources first, then the file records, and with
 * them the objects. Needs `next start` with the full env
 * (bun run test:integration).
 *
 * Fixtures: Editor fixture-test-toolkits-editor@example.invalid (Local API
 * user and REST token; never printed); Topic `topic` (active, ID/EN names)
 * and `off` (inactive). Files (synthetic `[FIXTURE]` PDFs uploaded by the
 * Editor; ID and EN label unless noted): `a` and `b` (ID label only) and
 * `pending` (status set to pending after the publish) on `live` (published,
 * EN ready); `draft` only in a pending draft revision of `live`; `never` on
 * the draft-only `never`; `unpub` on `unpub` (published, unpublished in
 * TK5); `idonly` on `idonly` (published, EN not ready); `inactive` on
 * `inactive` (published, inactive Topic); `free` on no toolkit. One
 * publication file `pubfile` on a published + public publication `pub` for
 * the cross-route checks. The UI tests (TKUI1–TKUI5, decisions 6A and 7A)
 * add, on first use: files `u1` (ID document), `u2` (EN document), `u3`;
 * toolkit `ui` (published 2090, newest, EN ready, files u1 + u2), draft-only
 * toolkit `prev` (file u3) and guide `gd` (a theme in the same Topic). The
 * Owner guard runs before any fixture is written and after cleanup.
 *
 * Signed URLs are bearer credentials: assertions and diagnostics never
 * print a Location or a URL, only statuses, hosts as booleans and header
 * names.
 */
type Locale = "id" | "en";

const AREA = "toolkits";
const PREFIX = areaPrefix(AREA);
const LABEL = areaLabel(AREA);
const EDITOR_EMAIL = areaEmail(AREA, "editor");
/** Larger than any id in the database, inside the Postgres integer range. */
const UNKNOWN_ID = "2147483647";
const PUBLISHED_AT = "2004-03-05T03:00:00.000Z";

const fileName = (name: string) => `${PREFIX}${name}.pdf`;
const slug = (name: string, locale: Locale = "id") => `${PREFIX}${name}${locale === "en" ? "-en" : ""}`;

type Raw = { status: number; headers: Headers; bytes: Buffer };

/** GET without following redirects; the URL is never printed. */
async function rawGet(url: string, headers: Record<string, string> = {}): Promise<Raw> {
  const response = await fetch(url, { headers, redirect: "manual" });
  return { status: response.status, headers: response.headers, bytes: Buffer.from(await response.arrayBuffer()) };
}

/** `/api/learning-hub/files/{id}/download?locale=…` on the test server (`query` replaces the locale query). */
function download(id: number | string, locale: Locale | null = "id", headers: Record<string, string> = {}, query?: string): Promise<Raw> {
  const search = query ?? (locale ? `?locale=${locale}` : "");
  return rawGet(`${BASE_URL}/api/learning-hub/files/${id}/download${search}`, headers);
}

function assertPrivateHeaders(result: Raw, label: string): void {
  assert.equal(result.headers.get("cache-control"), "no-store", `${label}: Cache-Control`);
  assert.equal(result.headers.get("x-robots-tag"), "noindex", `${label}: X-Robots-Tag`);
}

/** The one deny answer of the download route: 404 "Not Found", no Location, no-store + noindex. */
function assertDenied(result: Raw, label: string): void {
  assert.equal(result.status, 404, `${label}: HTTP ${result.status}`);
  assert.equal(result.headers.get("location"), null, `${label}: Location set`);
  assert.equal(result.bytes.toString("utf8"), "Not Found", `${label}: body`);
  assertPrivateHeaders(result, label);
}

/** The host and path of a signed URL as booleans (never the URL itself). */
function signedUrlFacts(location: string | null): { storageHost: boolean; toolkitPath: boolean; ttl60: boolean } {
  if (!location) return { storageHost: false, toolkitPath: false, ttl60: false };
  const url = new URL(location);
  return {
    storageHost: url.protocol === "https:" && url.host.endsWith(".storage.supabase.co"),
    toolkitPath: url.pathname.startsWith("/storage/v1/s3/publication-files/toolkits/"),
    ttl60: url.searchParams.get("X-Amz-Expires") === "60",
  };
}

describe("toolkit files and the toolkit download (M3-13: private bucket under toolkits/, signed attachment URL, server-side checks)", () => {
  let payload: Payload | undefined;
  let editor: User | undefined;
  let editorToken: string | undefined;
  let topicId: number | undefined;
  let offTopicId: number | undefined;
  const files = new Map<string, ToolkitFile>();
  const bytes = new Map<string, Buffer>();
  const toolkits = new Map<string, LearningResource>();
  let pubFile: PublicationFile | undefined;

  function p(): Payload {
    if (!payload) throw new Error("Payload not initialised (before hook failed)");
    return payload;
  }

  function editorUser(): User {
    if (!editor) throw new Error("editor not created (before hook failed)");
    return editor;
  }

  function token(): string {
    if (!editorToken) throw new Error("editor login failed (before hook)");
    return editorToken;
  }

  function file(name: string): ToolkitFile {
    const record = files.get(name);
    if (!record) throw new Error(`file ${name} not created (before hook failed)`);
    return record;
  }

  function kit(name: string): LearningResource {
    const record = toolkits.get(name);
    if (!record) throw new Error(`toolkit ${name} not created (before hook failed)`);
    return record;
  }

  /** Upload as the Editor through the Local API (access control on). `status` is sent to prove clients cannot set it. */
  async function upload(name: string, labels: { en?: boolean } = { en: true }, language: "id" | "en" = "id"): Promise<ToolkitFile> {
    const data = fixturePdf(`toolkits ${name}`);
    const record = await p().create({
      collection: "toolkit-files",
      locale: "id",
      data: { label: `${LABEL}id ${name}`, language, status: "failed" } as never,
      file: { data, mimetype: "application/pdf", name: fileName(name), size: data.length },
      user: editorUser(),
      overrideAccess: false,
      depth: 0,
    });
    if (labels.en) {
      await p().update({ collection: "toolkit-files", id: record.id, locale: "en", data: { label: `${LABEL}en ${name}` }, user: editorUser(), overrideAccess: false, depth: 0 });
    }
    files.set(name, record);
    bytes.set(name, data);
    return record;
  }

  /** A toolkit in both locales; `published` sends `_status` in both saves, `draft` saves drafts only. */
  async function createToolkit(
    name: string,
    fileNames: string[],
    status: "published" | "draft",
    options: { enReady?: boolean; topic?: number; publishedAt?: string } = {},
  ): Promise<LearningResource> {
    const record = await p().create({
      collection: "learning-resources",
      locale: "id",
      data: {
        type: "toolkit",
        materialLanguage: "id",
        topic: options.topic ?? (topicId as number),
        title: `${LABEL}id ${name}`,
        summary: `${LABEL}id ringkasan ${name}`,
        slug: slug(name),
        enReady: options.enReady ?? true,
        files: fileNames.map((key) => file(key).id),
        publishedAt: options.publishedAt ?? PUBLISHED_AT,
        _status: status,
      },
      draft: status === "draft",
      depth: 0,
      overrideAccess: true,
    });
    await p().update({
      collection: "learning-resources",
      id: record.id,
      locale: "en",
      data: { title: `${LABEL}en ${name}`, summary: `${LABEL}en summary ${name}`, slug: slug(name, "en"), _status: status },
      draft: status === "draft",
      depth: 0,
      overrideAccess: true,
    });
    toolkits.set(name, record);
    return record;
  }

  /** Location of a 307 of the download route (asserted), for one request. */
  async function signedLocation(name: string, locale: Locale = "id"): Promise<string> {
    const result = await download(file(name).id, locale);
    assert.equal(result.status, 307, `download ${name} (${locale}): HTTP ${result.status}`);
    const location = result.headers.get("location");
    assert.ok(location, `download ${name}: no Location`);
    return location;
  }

  before(async (t) => {
    payload = await getTestPayload();
    hookNote(t, `cleanup at start removed ${formatCounts(await cleanupArea(payload, AREA))}`);
    await assertOwnerIntact(payload);
    await assertServerUp();

    const secret = randomPassword();
    editor = await p().create({ collection: "users", data: { email: EDITOR_EMAIL, password: secret, role: "editor" }, overrideAccess: true });
    editorToken = await login(EDITOR_EMAIL, secret);

    for (const [key, active] of [
      ["topic", true],
      ["off", false],
    ] as const) {
      const created = await p().create({ collection: "topics", locale: "id", data: { name: `${LABEL}Topik ${key}`, slug: `${PREFIX}${key}` }, overrideAccess: true });
      await p().update({ collection: "topics", id: created.id, locale: "en", data: { name: `${LABEL}Topic ${key}` }, overrideAccess: true });
      if (active) await p().update({ collection: "topics", id: created.id, locale: "id", data: { isActive: true }, overrideAccess: true });
      if (key === "topic") topicId = created.id;
      else offTopicId = created.id;
    }

    for (const name of ["a", "pending", "draft", "never", "unpub", "idonly", "inactive", "free"]) await upload(name);
    await upload("b", { en: false }, "en");

    await createToolkit("live", ["a", "b", "pending"], "published");
    // Pending draft revision: `draft` is listed only in the latest version.
    await p().update({
      collection: "learning-resources",
      id: kit("live").id,
      locale: "id",
      data: { files: ["a", "b", "pending", "draft"].map((key) => file(key).id) },
      draft: true,
      depth: 0,
      overrideAccess: true,
    });
    // Status set after the publish, as a future processing step would (the field is read-only for clients).
    await p().update({ collection: "toolkit-files", id: file("pending").id, data: { status: "pending" }, depth: 0, overrideAccess: true });
    await createToolkit("never", ["never"], "draft");
    await createToolkit("unpub", ["unpub"], "published");
    await createToolkit("idonly", ["idonly"], "published", { enReady: false });
    await createToolkit("inactive", ["inactive"], "published", { topic: offTopicId });

    // A publication file on a published + public publication, for the cross-route checks.
    const pdf = fixturePdf("toolkits pubfile");
    pubFile = await p().create({
      collection: "publication-files",
      data: { label: `${LABEL}pubfile`, kind: "full_document", language: "id", accessLevel: "public", status: "ready" },
      file: { data: pdf, mimetype: "application/pdf", name: fileName("pubfile"), size: pdf.length },
      overrideAccess: true,
      depth: 0,
    });
    await p().create({
      collection: "publications",
      data: {
        title: `${LABEL}pub`,
        slug: slug("pub"),
        locale: "id",
        translationGroup: await createGroup(p(), AREA, "pub"),
        summary: `${LABEL}ringkasan pub`,
        publicationType: await firstId(p(), "publication-types"),
        topics: [await firstId(p(), "topics")],
        authors: [await firstId(p(), "authors")],
        accessLevel: "public",
        publishedAt: PUBLISHED_AT,
        files: [pubFile.id],
        _status: "published",
      },
      depth: 0,
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

  // ------------------------------------------------------------ upload and publish rules
  test("TK1 an Editor uploads a PDF: ready (client status ignored), prefix toolkits, ID/EN label, Bahasa dokumen; non-PDF bytes and text/plain are refused", async () => {
    const a = file("a");
    assert.equal(a.status, "ready", "status is system-set");
    assert.equal(a.mimeType, "application/pdf");
    assert.equal(a.filesize, bytes.get("a")?.length);
    assert.equal(a.filename, fileName("a"));
    assert.equal(a.prefix, "toolkits", "stored under toolkits/");
    assert.equal(a.language, "id");
    const en = await p().findByID({ collection: "toolkit-files", id: a.id, locale: "en", fallbackLocale: false, depth: 0, overrideAccess: true });
    assert.equal(en.label, `${LABEL}en a`, "EN label");
    const id = await p().findByID({ collection: "toolkit-files", id: file("b").id, locale: "en", fallbackLocale: false, depth: 0, overrideAccess: true });
    assert.equal(id.label ?? null, null, "`b` has no EN label");

    const cases: [string, Buffer, string, string][] = [
      ["text bytes as .pdf", Buffer.from("[FIXTURE] not a pdf at all\n".repeat(20)), "application/pdf", fileName("bad-text")],
      ["%PDF- header without xref/%%EOF", Buffer.from(`%PDF-1.4\n${"[FIXTURE] x\n".repeat(50)}`), "application/pdf", fileName("bad-trailer")],
      ["text/plain", Buffer.from("[FIXTURE] plain text\n"), "text/plain", `${PREFIX}bad-plain.txt`],
    ];
    for (const [label, data, mimetype, name] of cases) {
      await assert.rejects(
        async () =>
          p().create({
            collection: "toolkit-files",
            locale: "id",
            data: { label: `${LABEL}${label}`, language: "id", status: "ready" },
            file: { data, mimetype, name, size: data.length },
            user: editorUser(),
            overrideAccess: false,
            depth: 0,
          }),
        (error: unknown) => error instanceof Error && error.name === "ValidationError",
        label,
      );
    }
    const stored = await p().find({ collection: "toolkit-files", where: { filename: { like: `${PREFIX}bad-` } }, overrideAccess: true, depth: 0 });
    assert.equal(stored.totalDocs, 0, "no record for a refused file");
  });

  test("TK2 publishing a toolkit without a ready file is refused (Local API create and partial publish, REST create and publish); a draft passes", async () => {
    const isRefused = (error: unknown) =>
      error instanceof Error && error.name === "ValidationError" && JSON.stringify(error).includes("minimal satu file berstatus ready");
    const base = {
      type: "toolkit" as const,
      materialLanguage: "id" as const,
      topic: topicId as number,
      title: `${LABEL}id nofile`,
      summary: `${LABEL}id ringkasan nofile`,
      slug: slug("nofile"),
    };
    await assert.rejects(
      async () => p().create({ collection: "learning-resources", locale: "id", data: { ...base, _status: "published" }, depth: 0, overrideAccess: true }),
      isRefused,
      "Local create, published, no file",
    );
    await assert.rejects(
      async () =>
        p().create({ collection: "learning-resources", locale: "id", data: { ...base, files: [file("pending").id], _status: "published" }, depth: 0, overrideAccess: true }),
      isRefused,
      "Local create, published, only a non-ready file",
    );
    const draft = await p().create({ collection: "learning-resources", locale: "id", data: { ...base, _status: "draft" }, draft: true, depth: 0, overrideAccess: true });
    toolkits.set("nofile", draft);
    await assert.rejects(
      async () => p().update({ collection: "learning-resources", id: draft.id, locale: "id", data: { _status: "published" }, depth: 0, overrideAccess: true }),
      isRefused,
      "Local partial publish (only _status)",
    );
    const restPublish = await rest("PATCH", `/api/learning-resources/${draft.id}?locale=id`, { token: token(), body: { _status: "published" } });
    assert.equal(restPublish.status, 400, `REST publish as the Editor: ${restFact(restPublish)}`);
    assert.match(restErrors(restPublish.body), /files: Toolkit hanya dapat diterbitkan dengan minimal satu file berstatus ready/);
    const restCreate = await rest("POST", "/api/learning-resources?locale=id", {
      token: token(),
      body: { ...base, title: `${LABEL}id rest`, slug: slug("rest"), _status: "published" },
    });
    assert.equal(restCreate.status, 400, `REST create published as the Editor: ${restFact(restCreate)}`);
    const restDraft = await rest("POST", "/api/learning-resources?locale=id&draft=true", {
      token: token(),
      body: { ...base, title: `${LABEL}id rest draft`, slug: slug("rest-draft"), _status: "draft" },
    });
    assert.equal(restDraft.status, 201, `REST draft as the Editor: ${restFact(restDraft)}`);
    const after = await p().findByID({ collection: "learning-resources", id: draft.id, depth: 0, overrideAccess: true });
    assert.equal(after._status, "draft", "the refused publish changed nothing");
  });

  test("TK3 a file belongs to one toolkit: another toolkit's main row or latest version refuses the save, in either locale; the same file twice is refused", async () => {
    const attach = (name: string, fileNames: string[], locale: Locale = "id") =>
      p().update({
        collection: "learning-resources",
        id: kit(name).id,
        locale,
        data: { files: fileNames.map((key) => file(key).id) },
        draft: true,
        depth: 0,
        overrideAccess: true,
      });
    const isFilesError = (error: unknown) => error instanceof Error && error.name === "ValidationError" && JSON.stringify(error).includes("satu toolkit");
    await assert.rejects(async () => attach("nofile", ["a"]), isFilesError, "`a` is live on `live`");
    await assert.rejects(async () => attach("nofile", ["a"], "en"), isFilesError, "`a` is live on `live` (EN save, files shared)");
    await assert.rejects(async () => attach("nofile", ["draft"]), isFilesError, "`draft` is in the latest version of `live`");
    await assert.rejects(async () => attach("nofile", ["never"]), isFilesError, "`never` is in the draft-only `never`");
    await assert.rejects(
      async () => attach("nofile", ["free", "free"]),
      (error: unknown) => error instanceof Error && JSON.stringify(error).includes("lebih dari sekali"),
      "the same file twice",
    );
    await attach("nofile", ["free"]);
    await assert.rejects(async () => attach("unpub", ["unpub", "free"]), isFilesError, "`free` is now in the latest version of `nofile`");
    await attach("nofile", []);
  });

  // ------------------------------------------------------------ the download route
  test("TK4 a ready file on a published toolkit visible in the locale: 307 to a 60 s signed URL under toolkits/ with response-content-disposition attachment; the URL gives the same PDF with Content-Disposition: attachment and the stored name", async (t) => {
    for (const locale of ["id", "en"] as const) {
      const result = await download(file("a").id, locale);
      assert.equal(result.status, 307, `${locale}: HTTP ${result.status}`);
      assertPrivateHeaders(result, `${locale}: 307`);
      assert.equal(result.bytes.length, 0, `${locale}: no body with the redirect`);
      const location = result.headers.get("location");
      assert.deepEqual(signedUrlFacts(location), { storageHost: true, toolkitPath: true, ttl60: true }, `${locale}: signed URL facts`);
      const disposition = attachmentDisposition(file("a").filename as string);
      assert.equal(disposition.startsWith("attachment; "), true);
      assert.equal(new URL(location as string).searchParams.get("response-content-disposition"), disposition, `${locale}: signed URL asks for attachment`);
      const object = await rawGet(location as string);
      assert.equal(object.status, 200, `${locale}: signed URL: HTTP ${object.status}`);
      assert.equal(object.headers.get("content-type"), "application/pdf");
      assert.equal(object.headers.get("content-disposition"), disposition, `${locale}: Content-Disposition attachment with the stored name`);
      assert.equal(Buffer.compare(object.bytes, bytes.get("a") as Buffer), 0, `${locale}: same bytes as uploaded`);
    }
    t.diagnostic(`OBSERVED stored folder of an Editor upload: prefix=${file("a").prefix} _objectKey=${Boolean(file("a")._objectKey)}`);
    for (const [name, locale] of [
      ["b", "id"],
      ["idonly", "id"],
    ] as const) {
      assert.equal((await download(file(name).id, locale)).status, 307, `${name} (${locale}) downloadable`);
    }
  });

  test("TK5 every denial is the same 404 without Location: bad id or locale, draft-only, never published, unpublished, EN not ready, no EN label, inactive Topic, non-ready file, unattached, cross-route ids", async (t) => {
    for (const id of [UNKNOWN_ID, "abc", "0", "01", "-1", "1.5", "2147483648", "1e3"]) assertDenied(await download(id), `id ${id}`);
    for (const query of ["", "?locale=", "?locale=xx", "?locale=ID", "?lang=id", "?locale=all"]) {
      assertDenied(await download(file("a").id, null, {}, query), `locale query "${query}"`);
    }
    const denied: [string, Locale, string][] = [
      ["draft", "id", "file only in a pending draft revision"],
      ["draft", "en", "file only in a pending draft revision (EN)"],
      ["never", "id", "toolkit never published"],
      ["idonly", "en", "EN without Versi EN siap tayang"],
      ["b", "en", "file without an EN label"],
      ["inactive", "id", "inactive Topic"],
      ["inactive", "en", "inactive Topic (EN)"],
      ["pending", "id", "file not ready"],
      ["free", "id", "file on no toolkit"],
    ];
    for (const [name, locale, label] of denied) assertDenied(await download(file(name).id, locale), label);
    // A staff session gives no bypass on the public route.
    assertDenied(await download(file("draft").id, "id", { Authorization: `JWT ${token()}` }), "Editor token, draft-only file");

    assert.equal((await download(file("unpub").id)).status, 307, "unpub before unpublish");
    await p().update({ collection: "learning-resources", id: kit("unpub").id, locale: "id", data: { _status: "draft" }, depth: 0, overrideAccess: true });
    assertDenied(await download(file("unpub").id), "after unpublish (next request)");

    // Cross-route ids: a publication file never downloads here, a toolkit file never on /api/files.
    const pub = pubFile as PublicationFile;
    const toolkitIds = [...files.values()].map((record) => record.id);
    const sameIdToolkit = await p().find({ collection: "toolkit-files", where: { id: { equals: pub.id } }, depth: 0, overrideAccess: true });
    t.diagnostic(`OBSERVED a toolkit file with the publication file's id exists: ${sameIdToolkit.totalDocs > 0}`);
    if (sameIdToolkit.totalDocs === 0) {
      assert.equal(toolkitIds.includes(pub.id), false, "ids differ");
      assert.equal((await rawGet(`${BASE_URL}/api/files/${pub.id}/download`)).status, 307, "the publication file downloads on its own route");
      for (const locale of ["id", "en"] as const) assertDenied(await download(pub.id, locale), `publication file id on the toolkit route (${locale})`);
    } else {
      assert.equal(toolkitIds.includes(pub.id), false, "the colliding toolkit file is not a fixture of this file");
      assertDenied(await download(pub.id, "id"), "publication file id that is also a non-fixture toolkit file id (not on a live toolkit)");
    }
    const samePub = await p().find({ collection: "publication-files", where: { id: { in: toolkitIds } }, depth: 0, pagination: false, overrideAccess: true });
    const taken = new Set(samePub.docs.map((doc) => doc.id));
    const free = [...files.values()].find((record) => record.id === file("a").id && !taken.has(record.id)) ?? [...files.values()].find((record) => !taken.has(record.id));
    assert.ok(free, "a toolkit file id that no publication file uses");
    t.diagnostic(`OBSERVED toolkit file ids also used by a publication file: ${taken.size}`);
    assertDenied(await rawGet(`${BASE_URL}/api/files/${free.id}/download`), "toolkit file id on /api/files");
  });

  test("TK6 REST: anonymous list, by id and /file/<name> are refused, GraphQL too; the Editor gets a signed 302 under toolkits/ on /file/<name>", async () => {
    for (const path of [
      "/api/toolkit-files",
      "/api/toolkit-files?locale=en",
      `/api/toolkit-files/${file("a").id}`,
      `/api/toolkit-files/file/${fileName("a")}`,
      `/api/toolkit-files/file/${fileName("pending")}`,
    ]) {
      const result = await rawGet(`${BASE_URL}${path}`);
      assert.equal(result.status >= 200 && result.status < 400, false, `anonymous ${path}: HTTP ${result.status}`);
      assert.equal(result.headers.get("location"), null, `anonymous ${path}: Location`);
      assert.equal(result.bytes.includes(Buffer.from("%PDF-")), false, `anonymous ${path}: PDF bytes`);
      assert.equal(result.bytes.includes(Buffer.from(LABEL)), false, `anonymous ${path}: fixture labels`);
    }
    const graphql = await rest("POST", "/api/graphql", { body: { query: "{ ToolkitFiles { docs { label filename } } }" } });
    assert.equal(graphql.status >= 400, true, `anonymous POST /api/graphql: ${restFact(graphql)}`);
    assert.equal(JSON.stringify(graphql.body).includes(LABEL), false, "GraphQL: content in the body");
    const auth = { Authorization: `JWT ${token()}` };
    const staff = await rawGet(`${BASE_URL}/api/toolkit-files/file/${fileName("pending")}`, auth);
    assert.equal(staff.status, 302, `Editor /file/<pending>: HTTP ${staff.status}`);
    assert.deepEqual(signedUrlFacts(staff.headers.get("location")), { storageHost: true, toolkitPath: true, ttl60: true }, "staff signed URL");
    const byId = await rawGet(`${BASE_URL}/api/toolkit-files/${file("pending").id}`, auth);
    assert.equal(byId.status, 200, `Editor GET by id (pending file): HTTP ${byId.status}`);
  });

  test("TK7 direct storage URLs of a private toolkit object are not readable: public object URL, unauthenticated object URL, unsigned S3 URL", async () => {
    const appUrl = (process.env.APP_SUPABASE_URL ?? "").replace(/\/+$/, "");
    assert.ok(appUrl, "APP_SUPABASE_URL");
    const ref = new URL(appUrl).hostname.split(".")[0];
    const key = `toolkits/${encodeURIComponent(fileName("a"))}`;
    for (const [label, url] of [
      ["public object URL", `${appUrl}/storage/v1/object/public/publication-files/${key}`],
      ["object URL without auth", `${appUrl}/storage/v1/object/publication-files/${key}`],
      ["unsigned S3 URL", `https://${ref}.storage.supabase.co/storage/v1/s3/publication-files/${key}`],
    ] as const) {
      const result = await rawGet(url);
      assert.equal(result.status === 200 || result.status === 206, false, `${label}: HTTP ${result.status}`);
      assert.equal(result.bytes.includes(Buffer.from("%PDF-")), false, `${label}: PDF bytes`);
    }
    // The same object is there: the app's signer reads it.
    const signed = await rawGet(await signedFileUrl(file("a")));
    assert.equal(signed.status, 200, `signed GET of the same key: HTTP ${signed.status}`);
  });

  test("TK11 an anonymous Local API read of toolkit-files returns ready files only (as public code reads)", async () => {
    const found = await p().find({ collection: "toolkit-files", where: { filename: { like: PREFIX } }, depth: 0, pagination: false, overrideAccess: false });
    const ids = found.docs.map((doc) => doc.id);
    assert.equal(ids.includes(file("pending").id), false, "pending file hidden");
    for (const name of ["a", "b", "free"]) assert.equal(ids.includes(file(name).id), true, `${name} readable`);
    assert.equal(found.docs.every((doc) => doc.status === "ready"), true, "every anonymous result is ready");
    assert.equal(await findPublicToolkitFile(p(), file("pending").id), null, "findPublicToolkitFile: pending → null");
    assert.equal((await findPublicToolkitFile(p(), file("a").id))?.id, file("a").id);
  });

  // ------------------------------------------------------------ decision 4A
  test("TK8 a live toolkit file cannot be replaced or deleted; a draft-only one can; a label edit applies at once", async () => {
    const replacement = fixturePdf("toolkits replacement");
    const replaceAs = (name: string, data: Buffer) =>
      p().update({
        collection: "toolkit-files",
        id: file(name).id,
        data: {},
        file: { data, mimetype: "application/pdf", name: fileName(name), size: data.length },
        user: editorUser(),
        overrideAccess: false,
        depth: 0,
      });
    const refused = (pattern: RegExp) => (error: unknown) => error instanceof Error && pattern.test(error.message) && /toolkit/.test(error.message);
    await assert.rejects(async () => replaceAs("a", replacement), refused(/tidak dapat diganti/), "replace a live file");
    await assert.rejects(
      async () => p().delete({ collection: "toolkit-files", id: file("a").id, user: editorUser(), overrideAccess: false }),
      refused(/tidak dapat dihapus/),
      "delete a live file",
    );
    await assert.rejects(
      async () => p().delete({ collection: "toolkit-files", id: file("pending").id, user: editorUser(), overrideAccess: false }),
      refused(/tidak dapat dihapus/),
      "delete a live (non-ready) file",
    );
    const still = await rawGet(await signedLocation("a"));
    assert.equal(Buffer.compare(still.bytes, bytes.get("a") as Buffer), 0, "live content unchanged");

    const replaced = await replaceAs("draft", replacement);
    assert.equal(replaced.filesize, replacement.length, "draft-only file replaced");
    await p().delete({ collection: "toolkit-files", id: file("never").id, user: editorUser(), overrideAccess: false });
    files.delete("never");

    await p().update({ collection: "toolkit-files", id: file("a").id, locale: "en", data: { label: `${LABEL}en a v2` }, user: editorUser(), overrideAccess: false, depth: 0 });
    const relabelled = await p().findByID({ collection: "toolkit-files", id: file("a").id, locale: "en", fallbackLocale: false, depth: 0, overrideAccess: true });
    assert.equal(relabelled.label, `${LABEL}en a v2`, "label edit applies at once (no versions)");
    assert.equal((await download(file("a").id, "en")).status, 307, "still downloadable after the label edit");
  });

  // ------------------------------------------------------------ client uploads (browser → bucket)
  test("TK9 client upload: presign is staff-only; a PDF PUT + create gives a ready file under toolkits/ that the download signer reaches", async (t) => {
    type Signed = { url: string; filename: string; headers: Record<string, string>; clientUploadContext: { prefix?: string; _objectKey?: string; signedReceipt: string } };
    const presign = async (filename: string, data: Buffer, auth: boolean) => {
      const response = await fetch(`${BASE_URL}/api/storage-s3-generate-signed-url`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(auth ? { Authorization: `JWT ${token()}` } : {}) },
        body: JSON.stringify({ collectionSlug: "toolkit-files", filename, filesize: data.length, mimeType: "application/pdf" }),
      });
      return { status: response.status, body: (await response.json().catch(() => ({}))) as Signed };
    };
    const pdf = fixturePdf("toolkits client upload");
    assert.equal((await presign(fileName("client"), pdf, false)).status, 403, "anonymous presign refused");
    const signed = await presign(fileName("client"), pdf, true);
    assert.equal(signed.status, 200, `Editor presign: HTTP ${signed.status}`);
    assert.equal(new URL(signed.body.url).host.endsWith(".storage.supabase.co"), true, "presigned PUT goes to the storage host");
    assert.equal(new URL(signed.body.url).pathname.includes("/publication-files/toolkits/"), true, "presigned PUT under toolkits/");
    assert.equal(signed.body.filename.startsWith(PREFIX), true, "fixture object name");
    const put = await fetch(signed.body.url, { method: "PUT", headers: signed.body.headers, body: new Uint8Array(pdf) });
    assert.equal(put.status, 200, "PUT of the PDF");
    const form = new FormData();
    form.append("_payload", JSON.stringify({ label: `${LABEL}id client`, language: "en" }));
    form.append(
      "file",
      JSON.stringify({
        clientUploadContext: { prefix: signed.body.clientUploadContext.prefix, signedReceipt: signed.body.clientUploadContext.signedReceipt },
        collectionSlug: "toolkit-files",
        filename: signed.body.filename,
        mimeType: "application/pdf",
        size: pdf.length,
      }),
    );
    const response = await fetch(`${BASE_URL}/api/toolkit-files?locale=id`, { method: "POST", headers: { Authorization: `JWT ${token()}` }, body: form });
    const created = (await response.json().catch(() => ({}))) as { doc?: ToolkitFile };
    assert.equal(response.status, 201, `create from the client upload: HTTP ${response.status}`);
    assert.equal(created.doc?.status, "ready");
    const record = await p().findByID({ collection: "toolkit-files", id: created.doc?.id as number, depth: 0, overrideAccess: true });
    t.diagnostic(`OBSERVED client upload folder: prefix=${record.prefix} _objectKey=${Boolean(record._objectKey)}`);
    assert.equal(record.prefix, "toolkits");
    const viaSigner = await rawGet(await signedFileUrl(record));
    assert.equal(viaSigner.status, 200, `download signer, client-uploaded object: HTTP ${viaSigner.status}`);
    assert.equal(Buffer.compare(viaSigner.bytes, pdf), 0, "download signer reaches the same object");
  });

  test("TK10 the Editor's toolkit preview: /api/preview?resource= answers 307 to the toolkit page (published and draft-only); anonymous 404", async () => {
    const asEditor = { Cookie: `payload-token=${token()}` };
    for (const [name, locale] of [
      ["live", "id"],
      ["live", "en"],
      ["never", "id"],
    ] as const) {
      const entry = await getPage(`/api/preview?resource=${kit(name).id}&locale=${locale}`, asEditor);
      assert.equal(entry.status, 307, `Editor preview of ${name} (${locale}): ${pageFact(entry)}`);
      assert.equal(new URL(entry.location, BASE_URL).pathname, `/${locale}/learning-hub/${slug(name, locale)}`, `${name} (${locale}) target`);
    }
    const anonymous = await getPage(`/api/preview?resource=${kit("live").id}&locale=id`);
    assert.equal(anonymous.status, 404, `anonymous preview entry: ${pageFact(anonymous)}`);
  });

  // ------------------------------------------------------------ UI (DECISIONS §2.17 decisions 6A, 7A)
  const UI_PUBLISHED_AT = "2090-01-01T03:00:00.000Z";
  const titleOf = (name: string, locale: Locale) => `${LABEL}${locale} ${name}`;
  const strip = (html: string) => html.replace(/<!--[\s\S]*?-->/g, "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  let uiReady: Promise<void> | undefined;

  /** UI fixtures once: files u1 (ID document) and u2 (EN document), toolkit `ui` (newest, published, EN ready), guide `gd` (a theme in the same Topic), draft-only toolkit `prev` with file u3. */
  function uiFixtures(): Promise<void> {
    uiReady ??= (async () => {
      await upload("u1", { en: true }, "id");
      await upload("u2", { en: true }, "en");
      await upload("u3");
      await createToolkit("ui", ["u1", "u2"], "published", { publishedAt: UI_PUBLISHED_AT });
      await createToolkit("prev", ["u3"], "draft");
      const guide = await p().create({
        collection: "learning-resources",
        locale: "id",
        data: {
          type: "guide",
          materialLanguage: "id",
          topic: topicId as number,
          title: titleOf("gd", "id"),
          summary: `${LABEL}id ringkasan gd`,
          slug: slug("gd"),
          enReady: true,
          publishedAt: PUBLISHED_AT,
          _status: "published",
        },
        depth: 0,
        overrideAccess: true,
      });
      await p().update({
        collection: "learning-resources",
        id: guide.id,
        locale: "en",
        data: { title: titleOf("gd", "en"), summary: `${LABEL}en summary gd`, slug: slug("gd", "en"), _status: "published" },
        depth: 0,
        overrideAccess: true,
      });
      toolkits.set("gd", guide);
    })();
    return uiReady;
  }

  /** The `<article data-lh-card="toolkit">` of a toolkit title in a catalog page, or null. */
  function toolkitCard(html: string, title: string): string | null {
    for (const match of html.matchAll(/<article[^>]*\sdata-lh-card="toolkit"[^>]*>([\s\S]*?)<\/article>/g)) {
      if ((match[1] as string).includes(`>${title}<`)) return match[1] as string;
    }
    return null;
  }

  /** Panel rows in document order: file id, link href (null without a link) and the visible text. */
  function panelRows(html: string): { id: number; href: string | null; text: string; html: string }[] {
    return [...html.matchAll(/<li[^>]*\sdata-publication-file="(\d+)"[^>]*>([\s\S]*?)<\/li>/g)].map((match) => ({
      id: Number(match[1]),
      html: match[2] as string,
      href: /<a[^>]*\shref="([^"]+)"/.exec(match[2] as string)?.[1] ?? null,
      text: strip(match[2] as string),
    }));
  }

  test("TKUI1 catalog: the Toolkit section comes before the first theme; the card shows title, summary, Bahasa materi, “PDF · N file” and the detail link, never a download link, never repeated in a theme", async () => {
    await uiFixtures();
    for (const locale of ["id", "en"] as const) {
      const page = await getPage(`/${locale}/learning-hub`);
      assert.equal(page.status, 200, `GET /${locale}/learning-hub: ${pageFact(page)}`);
      const html = page.body;
      const sectionAt = html.search(/<section[^>]*\sdata-lh-toolkits/);
      const themeAt = html.search(/<section[^>]*\sdata-lh-theme="/);
      assert.ok(sectionAt !== -1, `${locale}: Toolkit section exists`);
      assert.ok(themeAt !== -1, `${locale}: a theme exists (the guide fixture)`);
      assert.ok(sectionAt < themeAt, `${locale}: Toolkit section (${sectionAt}) before the first theme (${themeAt})`);
      const section = /<section[^>]*\sdata-lh-toolkits[^>]*>([\s\S]*?)<\/section>/.exec(html)?.[1] ?? "";
      assert.match(section, /<h2[^>]*>Toolkit<\/h2>/, `${locale}: section heading`);
      const card = toolkitCard(section, titleOf("ui", locale));
      assert.ok(card, `${locale}: the toolkit card is in the Toolkit section`);
      const text = strip(card);
      assert.ok(text.includes(locale === "id" ? `${LABEL}id ringkasan ui` : `${LABEL}en summary ui`), `${locale}: summary`);
      assert.equal(/data-lh-language="id"/.test(card), true, `${locale}: Bahasa materi attribute`);
      assert.ok(text.includes(locale === "id" ? "Berbahasa Indonesia" : "In Indonesian"), `${locale}: Bahasa materi label`);
      assert.equal(/<p[^>]*\sdata-lh-files="2"/.test(card), true, `${locale}: file count attribute`);
      assert.ok(text.includes(locale === "id" ? "PDF · 2 file" : "PDF · 2 files"), `${locale}: file count text`);
      const links = [...card.matchAll(/<a[^>]*\shref="([^"]+)"/g)].map((match) => match[1]);
      assert.deepEqual(links, [`/${locale}/learning-hub/${slug("ui", locale)}`], `${locale}: the only link of the card is the detail page`);
      assert.equal(/<a[^>]*\sdata-lh-read/.test(card), true, `${locale}: detail link marker`);
      assert.equal(html.includes("/api/learning-hub/files/"), false, `${locale}: no download link anywhere in the catalog`);
      const themeHtml = html.slice(html.indexOf("</section>", sectionAt));
      assert.equal(themeHtml.includes(`>${titleOf("ui", locale)}<`), false, `${locale}: the toolkit is not repeated in a theme`);
      assert.equal(themeHtml.includes(`>${titleOf("gd", locale)}<`), true, `${locale}: the guide is in its theme`);
    }
  });

  test("TKUI2 detail page: the file panel lists the files in stored order with locale labels, document language (“In Indonesian” on the EN page) and ?locale= links; no file name, key or storage URL in the HTML", async () => {
    await uiFixtures();
    for (const locale of ["id", "en"] as const) {
      const page = await getPage(`/${locale}/learning-hub/${slug("ui", locale)}`);
      assert.equal(page.status, 200, `GET toolkit page (${locale}): ${pageFact(page)}`);
      const html = page.body;
      assert.equal(html.includes('data-lh-page="toolkit"'), true, `${locale}: toolkit main`);
      assert.equal(html.includes('data-files-mode="live"'), true, `${locale}: live panel`);
      assert.equal(html.includes("data-files-preview-note"), false, `${locale}: no preview note on a live page`);
      const rows = panelRows(html);
      assert.deepEqual(
        rows.map((row) => row.id),
        [file("u1").id, file("u2").id],
        `${locale}: stored order`,
      );
      assert.deepEqual(
        rows.map((row) => row.href),
        [file("u1").id, file("u2").id].map((id) => `/api/learning-hub/files/${id}/download?locale=${locale}`),
        `${locale}: download links carry the page locale`,
      );
      const [first, second] = rows.map((row) => row.text);
      assert.ok((first as string).includes(`${LABEL}${locale} u1`) && (first as string).includes("PDF ·"), `${locale}: first label and format`);
      assert.ok((second as string).includes(`${LABEL}${locale} u2`), `${locale}: second label`);
      assert.ok((first as string).includes(locale === "id" ? "Berbahasa Indonesia" : "In Indonesian"), `${locale}: u1 is an Indonesian document`);
      assert.ok((second as string).includes(locale === "id" ? "Berbahasa Inggris" : "In English"), `${locale}: u2 is an English document`);
      // The language label is written in the page language, so it must not carry the document's `lang`
      // (WCAG 2.2 SC 3.1.2): a screen reader would read "In Indonesian" with an Indonesian voice.
      const [firstRow, secondRow] = rows;
      for (const [row, label] of [
        [firstRow, locale === "id" ? "Berbahasa Indonesia" : "In Indonesian"],
        [secondRow, locale === "id" ? "Berbahasa Inggris" : "In English"],
      ] as const) {
        const span = new RegExp(`<span([^>]*)>${label}</span>`).exec(row?.html ?? "");
        assert.ok(span, `${locale}: the language label “${label}” is its own span`);
        assert.equal(/\slang=/.test(span[1] as string), false, `${locale}: the language label “${label}” carries no lang attribute (page language ${locale})`);
      }
      for (const name of ["u1", "u2"]) {
        assert.equal(html.includes(fileName(name)), false, `${locale}: stored file name of ${name} in the HTML`);
      }
      assert.equal(/storage\.supabase\.co|X-Amz-|toolkits\/|_objectKey|"prefix"/.test(html), false, `${locale}: no storage location in the HTML`);
    }
  });

  test("TKUI3 staff draft preview: the files show without links and with the note “Unduhan aktif setelah diterbitkan.”; anonymous visitors get not-found", async () => {
    await uiFixtures();
    const entry = await getPage(`/api/preview?resource=${kit("prev").id}&locale=id`, { Cookie: `payload-token=${token()}` });
    assert.equal(entry.status, 307, `Editor preview entry: ${pageFact(entry)}`);
    let bypass: string | undefined;
    for (const cookie of entry.setCookies) {
      const [pair = ""] = cookie.split(";");
      if (pair.startsWith("__prerender_bypass=")) bypass = pair;
    }
    assert.ok(bypass, "Draft Mode cookie set");
    const path = `/id/learning-hub/${slug("prev")}`;
    const page = await getPage(path, { Cookie: `${bypass}; payload-token=${token()}` });
    assert.equal(page.status, 200, `Editor preview page: ${pageFact(page)}`);
    const html = page.body;
    assert.equal(html.includes('data-lh-page="toolkit"'), true, "toolkit main");
    assert.equal(html.includes('data-preview="true"'), true, "preview mode");
    assert.equal(html.includes('data-files-mode="preview"'), true, "preview panel");
    const rows = panelRows(html);
    assert.deepEqual(
      rows.map((row) => row.id),
      [file("u3").id],
      "the draft toolkit's ready file is listed",
    );
    assert.deepEqual(
      rows.map((row) => row.href),
      [null],
      "no link in the preview",
    );
    assert.equal(html.includes("/api/learning-hub/files/"), false, "no download path in the preview");
    assert.match(strip(/<p[^>]*\sdata-files-preview-note[^>]*>[\s\S]*?<\/p>/.exec(html)?.[0] ?? ""), /^Unduhan aktif setelah diterbitkan\.$/);
    const anonymous = await getPage(path);
    assertNotFoundPage(anonymous, `anonymous GET ${path}`, "id");
    assert.equal(anonymous.body.includes(titleOf("prev", "id")), false, "draft title for an anonymous visitor");
  });

  test("TKUI4 homepage and sitemap: a visible toolkit joins the 3 newest block and links to its detail page; the sitemap lists the detail pages and no PDF", async (t) => {
    await uiFixtures();
    const home = await getPage("/");
    assert.equal(home.status, 200, `GET /: ${pageFact(home)}`);
    const newest = newestCards(await findPublicResources(p(), "id").then((docs) => docs as ResourceDoc[]), "id");
    const inBlock = newest.some((card) => card.id === kit("ui").id);
    if (!inBlock) {
      t.diagnostic("OBSERVED: real resources outrank the fixture toolkit; the homepage card check is skipped");
    } else {
      const item = /<li[^>]*\sdata-home-learning-card="toolkit"[^>]*>([\s\S]*?)<\/li>/g;
      const cards = [...home.body.matchAll(item)].map((match) => match[1] as string);
      const card = cards.find((html) => html.includes(`>${titleOf("ui", "id")}<`));
      assert.ok(card, "the toolkit is a card of the homepage block");
      const hrefs = [...card.matchAll(/<a[^>]*\shref="([^"]+)"/g)].map((match) => match[1]);
      assert.deepEqual(hrefs, [`/id/learning-hub/${slug("ui")}`], "the card links to the detail page only");
    }
    assert.equal(home.body.includes("/api/learning-hub/files/"), false, "no download link on the homepage");

    const sitemap = await getPage("/sitemap.xml");
    assert.equal(sitemap.status, 200, `GET /sitemap.xml: ${pageFact(sitemap)}`);
    const locs = [...sitemap.body.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1] as string);
    for (const locale of ["id", "en"] as const) {
      assert.equal(locs.includes(`https://mahira.id/${locale}/learning-hub/${slug("ui", locale)}`), true, `${locale}: toolkit detail page in the sitemap`);
    }
    assert.equal(locs.some((loc) => loc.includes(slug("prev"))), false, "draft-only toolkit not in the sitemap");
    assert.equal(locs.some((loc) => /\.pdf|\/api\/|\/files\//i.test(loc)), false, "no PDF or download URL in the sitemap");
  });

  test("TKUI5 EN only with “Versi EN siap tayang”: the ID-only toolkit is in the ID catalog and page, not in EN", async () => {
    await uiFixtures();
    const idCatalog = await getPage("/id/learning-hub");
    assert.ok(toolkitCard(idCatalog.body, titleOf("idonly", "id")), "ID catalog card of the toolkit without the EN checkbox");
    assert.equal((await getPage(`/id/learning-hub/${slug("idonly")}`)).status, 200, "ID page");
    const enCatalog = await getPage("/en/learning-hub");
    assert.equal(enCatalog.body.includes(titleOf("idonly", "en")), false, "EN catalog: title");
    assert.equal(enCatalog.body.includes(slug("idonly")), false, "EN catalog: slug");
    const enPage = await getPage(`/en/learning-hub/${slug("idonly", "en")}`);
    assertNotFoundPage(enPage, "EN page of a toolkit without Versi EN siap tayang", "en");
    assert.equal(enPage.body.includes('data-lh-page="toolkit"'), false, "no toolkit page in EN");
  });
});
