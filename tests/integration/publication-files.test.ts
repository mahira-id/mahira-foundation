import assert from "node:assert/strict";
import { after, before, describe, test } from "node:test";
import { createLocalReq, type Payload, type PayloadRequest, type RequiredDataFromCollectionSlug } from "payload";

import { findPublicPublication } from "../../lib/cms/publication-detail-query";
import { signedFileUrl } from "../../lib/cms/publication-file-storage";
import { findDraftPublication, type StaffUser } from "../../lib/cms/staff-preview";
import { toPublicationDetail } from "../../lib/publications/detail-view";
import type { Publication, PublicationFile, User } from "../../payload/payload-types";
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
import { BASE_URL, assertServerUp, getPage, login, pageFact } from "../helpers/http";
import { closeTestPayload, getTestPayload } from "../helpers/payload";
import { fixturePdf } from "../helpers/pdf";
import { fetchAllIndexPages, inlineSegments } from "../helpers/publication-pages";
import { attachmentDisposition } from "../../lib/publications/file-download";
import { fileFormatLabel } from "../../lib/publications/file-labels";

/**
 * Publication files and the public download (M3-08, DECISIONS §2.14),
 * area `downloads`. The files go to the private bucket `publication-files`
 * (shared by Preview, local runs and tests): every object name starts with
 * `fixture-test-downloads-` and cleanup deletes the file records, and with
 * them the objects, after the publications. Needs `next start` with the
 * full env (bun run test:integration).
 *
 * Fixtures: Editor fixture-test-downloads-editor@example.invalid (Local API
 * user and REST token; never printed). Files (all synthetic `[FIXTURE]` PDFs,
 * uploaded by the Editor through the Local API): `a` public on `live`; `reg`
 * registered and `sub` subscriber on `live`; `draft` public, only in a
 * pending draft revision of `live`; `never` public on the draft-only `never`;
 * `regpub` public on `regpub` (published, Access Level registered); `unpub`
 * public on `unpub` (published, unpublished in DL5); `free` on no record;
 * `dengan spasi (v2)` public on `spaced` (published; a stored name with
 * spaces and parentheses, like real file names, for the attachment header).
 * Publications reuse the first existing author, topic and type; ID locale;
 * publishedAt 2004 so they never lead the homepage. The Owner guard runs
 * before any fixture is written and after cleanup.
 *
 * Signed URLs are bearer credentials: assertions and diagnostics never print
 * a Location or a URL, only statuses, hosts as booleans and header names.
 */
type PubData = RequiredDataFromCollectionSlug<"publications">;
type Level = PublicationFile["accessLevel"];

const AREA = "downloads";
const PREFIX = areaPrefix(AREA);
const LABEL = areaLabel(AREA);
const EDITOR_EMAIL = areaEmail(AREA, "editor");
const PUBLISHED_AT = "2004-02-05T03:00:00.000Z";
/** Larger than any id in the database, inside the Postgres integer range. */
const UNKNOWN_ID = "2147483647";
const PANEL_FIELDS = ["accessLevel", "filesize", "id", "kind", "label", "language", "mimeType", "status"];
/** Fixture key of a file whose stored name has spaces and parentheses. */
const SPACED = "dengan spasi (v2)";
const STORAGE_KEYS = ["url", "filename", "prefix", "_objectKey", "thumbnailURL"];

const slug = (name: string) => `${PREFIX}${name}`;
const fileName = (name: string) => `${PREFIX}${name}.pdf`;

type Raw = { status: number; headers: Headers; bytes: Buffer };

/** GET without following redirects; the URL is never printed. */
async function rawGet(url: string, headers: Record<string, string> = {}): Promise<Raw> {
  const response = await fetch(url, { headers, redirect: "manual" });
  return { status: response.status, headers: response.headers, bytes: Buffer.from(await response.arrayBuffer()) };
}

/** `/api/files/{id}/download` on the test server. */
function download(id: number | string, headers: Record<string, string> = {}): Promise<Raw> {
  return rawGet(`${BASE_URL}/api/files/${id}/download`, headers);
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
function signedUrlFacts(location: string | null): { storageHost: boolean; bucketPath: boolean; ttl60: boolean } {
  if (!location) return { storageHost: false, bucketPath: false, ttl60: false };
  const url = new URL(location);
  return {
    storageHost: url.protocol === "https:" && url.host.endsWith(".storage.supabase.co"),
    bucketPath: url.pathname.startsWith("/storage/v1/s3/publication-files/"),
    ttl60: url.searchParams.get("X-Amz-Expires") === "60",
  };
}

describe("publication files and public downloads (M3-08: private bucket, signed URL, access checks)", () => {
  let payload: Payload | undefined;
  let editor: User | undefined;
  let editorToken: string | undefined;
  const files = new Map<string, PublicationFile>();
  const bytes = new Map<string, Buffer>();
  const pubs = new Map<string, Publication>();

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

  function file(name: string): PublicationFile {
    const record = files.get(name);
    if (!record) throw new Error(`file ${name} not created (before hook failed)`);
    return record;
  }

  function pub(name: string): Publication {
    const record = pubs.get(name);
    if (!record) throw new Error(`publication ${name} not created (before hook failed)`);
    return record;
  }

  /** Upload as the Editor through the Local API (access control on). `status` is sent to prove clients cannot set it. */
  async function upload(
    name: string,
    accessLevel: Level,
    data = fixturePdf(`downloads ${name}`),
    meta: { kind?: PublicationFile["kind"]; language?: PublicationFile["language"] } = {},
  ): Promise<PublicationFile> {
    const record = await p().create({
      collection: "publication-files",
      data: { label: `${LABEL}${name}`, kind: meta.kind ?? "full_document", language: meta.language ?? "id", accessLevel, status: "failed" },
      file: { data, mimetype: "application/pdf", name: fileName(name), size: data.length },
      user: editorUser(),
      overrideAccess: false,
      depth: 0,
    });
    files.set(name, record);
    bytes.set(name, data);
    return record;
  }

  async function createPub(
    name: string,
    fileNames: string[],
    status: "published" | "draft",
    accessLevel: Level = "public",
    locale: "id" | "en" = "id",
  ): Promise<Publication> {
    const data: PubData = {
      title: `${LABEL}${name}`,
      slug: slug(name),
      locale,
      translationGroup: await createGroup(p(), AREA, name),
      summary: `${LABEL}ringkasan ${name}`,
      publicationType: await firstId(p(), "publication-types"),
      topics: [await firstId(p(), "topics")],
      authors: [await firstId(p(), "authors")],
      accessLevel,
      publishedAt: PUBLISHED_AT,
      files: fileNames.map((fileNameKey) => file(fileNameKey).id),
    };
    const record = await p().create({
      collection: "publications",
      data: { ...data, _status: status },
      draft: status === "draft",
      depth: 0,
      overrideAccess: true,
    });
    pubs.set(name, record);
    return record;
  }

  /** Location of a 307 of the download route (asserted), for one request. */
  async function signedLocation(name: string): Promise<string> {
    const result = await download(file(name).id);
    assert.equal(result.status, 307, `download ${name}: HTTP ${result.status}`);
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

    for (const [name, level] of [
      ["a", "public"],
      ["reg", "registered"],
      ["sub", "subscriber"],
      ["draft", "public"],
      ["never", "public"],
      ["regpub", "public"],
      ["unpub", "public"],
      ["free", "public"],
      ["onlyreg", "registered"],
      [SPACED, "public"],
    ] as const) {
      await upload(name, level);
    }
    // Panel fixtures (DLU): an English page with an Indonesian appendix.
    await upload("enfile", "public", fixturePdf("downloads enfile"), { kind: "appendix", language: "id" });
    await createPub("live", ["a", "reg", "sub"], "published");
    // Pending draft revision: `draft` is listed only in the latest version.
    await p().update({
      collection: "publications",
      id: pub("live").id,
      data: { files: [file("a").id, file("reg").id, file("sub").id, file("draft").id] },
      draft: true,
      depth: 0,
      overrideAccess: true,
    });
    await createPub("never", ["never"], "draft");
    await createPub("regpub", ["regpub"], "published", "registered");
    await createPub("unpub", ["unpub"], "published");
    await createPub("nofiles", [], "published");
    await createPub("restricted", ["onlyreg"], "published");
    await createPub("spaced", [SPACED], "published");
    await createPub("enlive", ["enfile"], "published", "public", "en");
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

  // ------------------------------------------------------------ upload rules
  test("DL1 an Editor uploads a PDF through the Local API: stored as ready (client status ignored), PDF, size, fixture name", () => {
    const a = file("a");
    assert.equal(a.status, "ready", "status is system-set");
    assert.equal(a.mimeType, "application/pdf");
    assert.equal(a.filesize, bytes.get("a")?.length);
    assert.equal(a.filename, fileName("a"));
    assert.equal(a.accessLevel, "public");
    assert.equal(file("reg").accessLevel, "registered");
    assert.equal(file("sub").accessLevel, "subscriber");
  });

  test("DL2 content check: non-PDF bytes named .pdf, a PDF header without trailer, PNG bytes claimed as PDF, and text/plain are refused", async () => {
    const cases: [string, Buffer, string, string][] = [
      ["text bytes as .pdf", Buffer.from("[FIXTURE] not a pdf at all\n".repeat(20)), "application/pdf", fileName("bad-text")],
      ["%PDF- header without xref/%%EOF", Buffer.from(`%PDF-1.4\n${"[FIXTURE] x\n".repeat(50)}`), "application/pdf", fileName("bad-trailer")],
      [
        "PNG bytes claimed as PDF",
        Buffer.from("89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000d4944415478da63f8ffff3f0005fe02fea7d6a4a20000000049454e44ae426082", "hex"),
        "application/pdf",
        fileName("bad-png"),
      ],
      ["text/plain", Buffer.from("[FIXTURE] plain text\n"), "text/plain", `${PREFIX}bad-plain.txt`],
    ];
    for (const [label, data, mimetype, name] of cases) {
      await assert.rejects(
        async () =>
          p().create({
            collection: "publication-files",
            data: { label: `${LABEL}${label}`, kind: "other", language: "id", accessLevel: "public", status: "ready" },
            file: { data, mimetype, name, size: data.length },
            user: editorUser(),
            overrideAccess: false,
            depth: 0,
          }),
        (error: unknown) => error instanceof Error && error.name === "ValidationError",
        label,
      );
    }
    const stored = await p().find({ collection: "publication-files", where: { filename: { like: `${PREFIX}bad-` } }, overrideAccess: true, depth: 0 });
    assert.equal(stored.totalDocs, 0, "no record for a refused file");
  });

  test("DL3 accessLevel is required and has no default: missing or unknown value refused", async () => {
    const data = fixturePdf("downloads no level");
    for (const [label, level] of [["missing", undefined], ["unknown", "staff"]] as const) {
      await assert.rejects(
        async () =>
          p().create({
            collection: "publication-files",
            data: { label: `${LABEL}${label}`, kind: "other", language: "id", ...(level ? { accessLevel: level } : {}) } as never,
            file: { data, mimetype: "application/pdf", name: fileName(`no-level-${label}`), size: data.length },
            user: editorUser(),
            overrideAccess: false,
            depth: 0,
          }),
        (error: unknown) => error instanceof Error && error.name === "ValidationError" && JSON.stringify(error).includes("accessLevel"),
        label,
      );
    }
  });

  // ------------------------------------------------------------ the download route
  test("DL4 public file on a published + public record: 307 to a 60 s signed URL of the bucket with response-content-disposition attachment; the URL gives the same PDF with Content-Disposition: attachment and the stored name", async (t) => {
    for (const name of ["a", SPACED]) {
      const result = await download(file(name).id);
      assert.equal(result.status, 307, `${name}: HTTP ${result.status}`);
      assertPrivateHeaders(result, `${name}: 307`);
      assert.equal(result.bytes.length, 0, `${name}: no body with the redirect`);
      const location = result.headers.get("location");
      assert.deepEqual(signedUrlFacts(location), { storageHost: true, bucketPath: true, ttl60: true }, `${name}: signed URL facts`);
      // Owner 2026-11-16 (DECISIONS §2.14 item 6): the browser downloads instead of opening inline.
      const stored = file(name).filename as string;
      const disposition = attachmentDisposition(stored);
      assert.equal(disposition.startsWith("attachment; "), true, `${name}: attachment`);
      assert.equal(new URL(location as string).searchParams.get("response-content-disposition"), disposition, `${name}: signed URL asks for attachment`);
      const object = await rawGet(location as string);
      assert.equal(object.status, 200, `${name}: signed URL: HTTP ${object.status}`);
      assert.equal(object.headers.get("content-type"), "application/pdf");
      assert.equal(object.headers.get("content-disposition"), disposition, `${name}: storage answers Content-Disposition: attachment with the stored name`);
      assert.equal(Buffer.compare(object.bytes, bytes.get(name) as Buffer), 0, `${name}: same bytes as uploaded`);
      t.diagnostic(`OBSERVED ${name}: stored name has a space=${stored.includes(" ")}; storage Cache-Control: ${object.headers.get("cache-control") ?? "(none)"}`);
    }
  });

  test("DL5 every denial is the same 404: unknown/invalid id, draft-only, never published, registered record, restricted file, unattached, unpublished", async () => {
    for (const id of [UNKNOWN_ID, "abc", "0", "01", "-1", "1.5", "2147483648", "1e3"]) {
      assertDenied(await download(id), `id ${id}`);
    }
    const denied: [string, string][] = [
      ["draft", "file only in a pending draft revision"],
      ["never", "record never published"],
      ["regpub", "published record with Access Level registered"],
      ["reg", "registered file on a public record"],
      ["sub", "subscriber file on a public record"],
      ["free", "file on no record"],
    ];
    for (const [name, label] of denied) {
      assertDenied(await download(file(name).id), label);
    }
    // A staff session gives no bypass on the public route (DEC-009).
    assertDenied(await download(file("draft").id, { Authorization: `JWT ${token()}` }), "Editor token, draft-only file");

    assert.equal((await download(file("unpub").id)).status, 307, "unpub before unpublish");
    await p().update({ collection: "publications", id: pub("unpub").id, data: { _status: "draft" }, depth: 0, overrideAccess: true });
    assertDenied(await download(file("unpub").id), "after unpublish (next request)");
  });

  test("DL6 REST: anonymous list, by id and /file/<name> are refused; the Editor gets a signed 302 on /file/<name>", async () => {
    for (const path of [
      "/api/publication-files",
      `/api/publication-files/${file("a").id}`,
      `/api/publication-files/file/${fileName("a")}`,
      `/api/publication-files/file/${fileName("reg")}`,
    ]) {
      const result = await rawGet(`${BASE_URL}${path}`);
      assert.equal(result.status >= 200 && result.status < 400, false, `anonymous ${path}: HTTP ${result.status}`);
      assert.equal(result.headers.get("location"), null, `anonymous ${path}: Location`);
      assert.equal(result.bytes.includes(Buffer.from("%PDF-")), false, `anonymous ${path}: PDF bytes`);
    }
    const auth = { Authorization: `JWT ${token()}` };
    const staff = await rawGet(`${BASE_URL}/api/publication-files/file/${fileName("reg")}`, auth);
    assert.equal(staff.status, 302, `Editor /file/<reg>: HTTP ${staff.status}`);
    assert.deepEqual(signedUrlFacts(staff.headers.get("location")), { storageHost: true, bucketPath: true, ttl60: true }, "staff signed URL");
    const list = await rawGet(`${BASE_URL}/api/publication-files/${file("sub").id}`, auth);
    assert.equal(list.status, 200, `Editor GET by id (subscriber file): HTTP ${list.status}`);
  });

  test("DL7 direct storage URLs of a private object are not readable: public object URL, unauthenticated object URL, unsigned S3 URL", async () => {
    const appUrl = (process.env.APP_SUPABASE_URL ?? "").replace(/\/+$/, "");
    assert.ok(appUrl, "APP_SUPABASE_URL");
    const ref = new URL(appUrl).hostname.split(".")[0];
    const key = encodeURIComponent(fileName("a"));
    const urls: [string, string][] = [
      ["public object URL", `${appUrl}/storage/v1/object/public/publication-files/${key}`],
      ["object URL without auth", `${appUrl}/storage/v1/object/publication-files/${key}`],
      ["unsigned S3 URL", `https://${ref}.storage.supabase.co/storage/v1/s3/publication-files/${key}`],
    ];
    for (const [label, url] of urls) {
      const result = await rawGet(url);
      assert.equal(result.status === 200 || result.status === 206, false, `${label}: HTTP ${result.status}`);
      assert.equal(result.bytes.includes(Buffer.from("%PDF-")), false, `${label}: PDF bytes`);
    }
  });

  // ------------------------------------------------------------ decision 8 and one record per file
  test("DL8 a live file cannot be replaced or deleted; a draft-only one can; an Access Level edit applies on the next request", async () => {
    const replacement = fixturePdf("downloads replacement");
    const replaceAs = (name: string, data: Buffer) =>
      p().update({
        collection: "publication-files",
        id: file(name).id,
        data: {},
        file: { data, mimetype: "application/pdf", name: fileName(name), size: data.length },
        user: editorUser(),
        overrideAccess: false,
        depth: 0,
      });
    const refused = (pattern: RegExp) => (error: unknown) => error instanceof Error && pattern.test(error.message);
    await assert.rejects(async () => replaceAs("a", replacement), refused(/tidak dapat diganti/), "replace a live file");
    await assert.rejects(
      async () => p().delete({ collection: "publication-files", id: file("a").id, user: editorUser(), overrideAccess: false }),
      refused(/tidak dapat dihapus/),
      "delete a live file",
    );
    const still = await rawGet(await signedLocation("a"));
    assert.equal(Buffer.compare(still.bytes, bytes.get("a") as Buffer), 0, "live content unchanged");

    // Draft-only (pending revision of `live`, and the never-published record): allowed.
    const replaced = await replaceAs("draft", replacement);
    assert.equal(replaced.filesize, replacement.length, "draft-only file replaced");
    await p().delete({ collection: "publication-files", id: file("never").id, user: editorUser(), overrideAccess: false });
    files.delete("never");

    // Label and Access Level edits apply at once (no versions).
    const setLevel = (accessLevel: Level) =>
      p().update({ collection: "publication-files", id: file("a").id, data: { accessLevel }, user: editorUser(), overrideAccess: false, depth: 0 });
    await setLevel("registered");
    try {
      assertDenied(await download(file("a").id), "accessLevel registered on a live file");
    } finally {
      await setLevel("public");
    }
    assert.equal((await download(file("a").id)).status, 307, "back to public");
  });

  test("DL9 a file belongs to one publication record: another record's main row or latest version refuses the save", async () => {
    const attach = (name: string, fileNames: string[], draft: boolean) =>
      p().update({
        collection: "publications",
        id: pub(name).id,
        data: { files: fileNames.map((key) => file(key).id) },
        draft,
        depth: 0,
        overrideAccess: true,
      });
    const isFilesError = (error: unknown) => error instanceof Error && error.name === "ValidationError" && JSON.stringify(error).includes("files");
    await assert.rejects(async () => attach("regpub", ["regpub", "a"], true), isFilesError, "`a` is live on `live`");
    await assert.rejects(async () => attach("regpub", ["regpub", "draft"], true), isFilesError, "`draft` is in the latest version of `live`");
    await assert.rejects(async () => attach("regpub", ["regpub", "regpub"], true), isFilesError, "the same file twice");
    await attach("regpub", ["regpub", "free"], true);
    await assert.rejects(async () => attach("unpub", ["unpub", "free"], true), isFilesError, "`free` is now in the latest version of `regpub`");
  });

  test("DL10 /api/media/file/* answers 404 + noindex + no-store (was HTTP 500)", async () => {
    for (const path of ["/api/media/file/x", "/api/media/file/x.png", "/api/media/file/a/b.pdf"]) {
      const result = await rawGet(`${BASE_URL}${path}`);
      assert.equal(result.status, 404, `${path}: HTTP ${result.status}`);
      assertPrivateHeaders(result, path);
    }
  });

  test("DL11 the signed URL expires: 200 at once, refused after 61 s", async () => {
    const location = await signedLocation("a");
    assert.equal((await rawGet(location)).status, 200, "readable at once");
    await new Promise((resolve) => setTimeout(resolve, 61_000));
    const expired = await rawGet(location);
    assert.equal(expired.status >= 400 && expired.status < 500, true, `after 61 s: HTTP ${expired.status}`);
    assert.equal(expired.bytes.includes(Buffer.from("%PDF-")), false, "no PDF bytes after expiry");
  });

  // ------------------------------------------------------------ client uploads (browser → bucket)
  test("DL12 client upload: presign is staff-only; a PDF PUT + create gives a ready file; non-PDF bytes are refused on create; a text/plain PUT is refused by the bucket", async (t) => {
    type Signed = { url: string; filename: string; headers: Record<string, string>; clientUploadContext: { prefix?: string; _objectKey?: string; signedReceipt: string } };
    const presign = async (filename: string, data: Buffer, mimeType: string, auth: boolean) => {
      const response = await fetch(`${BASE_URL}/api/storage-s3-generate-signed-url`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(auth ? { Authorization: `JWT ${token()}` } : {}) },
        body: JSON.stringify({ collectionSlug: "publication-files", filename, filesize: data.length, mimeType }),
      });
      return { status: response.status, body: (await response.json().catch(() => ({}))) as Signed };
    };
    const put = async (signed: Signed, data: Buffer) =>
      (await fetch(signed.url, { method: "PUT", headers: signed.headers, body: new Uint8Array(data) })).status;
    const createFromUpload = async (signed: Signed, mimeType: string, size: number) => {
      const form = new FormData();
      form.append("_payload", JSON.stringify({ label: `${LABEL}client ${signed.filename}`, kind: "appendix", language: "en", accessLevel: "public" }));
      form.append(
        "file",
        JSON.stringify({
          clientUploadContext: { prefix: signed.clientUploadContext.prefix, signedReceipt: signed.clientUploadContext.signedReceipt },
          collectionSlug: "publication-files",
          filename: signed.filename,
          mimeType,
          size,
        }),
      );
      const response = await fetch(`${BASE_URL}/api/publication-files`, { method: "POST", headers: { Authorization: `JWT ${token()}` }, body: form });
      return { status: response.status, body: (await response.json().catch(() => ({}))) as { doc?: PublicationFile } };
    };
    /** Signed GET of a stored object, through the app's signer (the URL is never printed). */
    const objectStatus = async (signed: Signed) =>
      (
        await rawGet(
          await signedFileUrl({ id: 0, filename: signed.filename, prefix: signed.clientUploadContext.prefix ?? "", _objectKey: signed.clientUploadContext._objectKey }),
        )
      ).status;
    /** Removes a bucket object that has no record, with the storage plugin's own delete. */
    const deleteOrphan = async (signed: Signed) => {
      const config = p().collections["publication-files"].config;
      const hooks = config.hooks.afterDelete ?? [];
      const pluginDelete = hooks[hooks.length - 1];
      assert.ok(pluginDelete, "storage plugin afterDelete hook");
      const req = (await createLocalReq({}, p())) as PayloadRequest;
      const doc = { id: 0, filename: signed.filename, prefix: signed.clientUploadContext.prefix ?? "", _objectKey: signed.clientUploadContext._objectKey };
      await pluginDelete({ collection: config, context: {}, doc, id: 0, req } as never);
    };

    const pdf = fixturePdf("downloads client upload");
    assert.equal((await presign(fileName("client"), pdf, "application/pdf", false)).status, 403, "anonymous presign refused");

    const signed = await presign(fileName("client"), pdf, "application/pdf", true);
    assert.equal(signed.status, 200, `Editor presign: HTTP ${signed.status}`);
    assert.equal(new URL(signed.body.url).host.endsWith(".storage.supabase.co"), true, "presigned PUT goes to the storage host");
    assert.equal(signed.body.filename.startsWith(PREFIX), true, "fixture object name");
    assert.equal(await put(signed.body, pdf), 200, "PUT of the PDF");
    const created = await createFromUpload(signed.body, "application/pdf", pdf.length);
    assert.equal(created.status, 201, `create from the client upload: HTTP ${created.status}`);
    assert.equal(created.body.doc?.status, "ready");
    const staff = await rawGet(`${BASE_URL}/api/publication-files/file/${encodeURIComponent(signed.body.filename)}`, { Authorization: `JWT ${token()}` });
    assert.equal(staff.status, 302, `staff file URL: HTTP ${staff.status}`);
    const object = await rawGet(staff.headers.get("location") as string);
    assert.equal(Buffer.compare(object.bytes, pdf), 0, "stored object = uploaded PDF");
    // The public download signer builds the same key as the adapter for an admin (client) upload.
    const record = await p().findByID({ collection: "publication-files", id: created.body.doc?.id as number, depth: 0, overrideAccess: true });
    t.diagnostic(`OBSERVED client upload folder: prefix=${Boolean(record.prefix)} _objectKey=${Boolean(record._objectKey)}`);
    const viaSigner = await rawGet(await signedFileUrl(record));
    assert.equal(viaSigner.status, 200, `download signer, client-uploaded object: HTTP ${viaSigner.status}`);
    assert.equal(Buffer.compare(viaSigner.bytes, pdf), 0, "download signer reaches the same object");

    // Non-PDF bytes declared as PDF: the bucket takes the PUT, Payload refuses the record (content check).
    const fake = Buffer.from("[FIXTURE] not a pdf\n".repeat(40));
    const fakeSigned = await presign(fileName("client-fake"), fake, "application/pdf", true);
    assert.equal(fakeSigned.status, 200, `presign fake: HTTP ${fakeSigned.status}`);
    try {
      t.diagnostic(`OBSERVED PUT of non-PDF bytes as application/pdf: HTTP ${await put(fakeSigned.body, fake)}`);
      const refused = await createFromUpload(fakeSigned.body, "application/pdf", fake.length);
      assert.equal(refused.status, 400, `create from non-PDF bytes: HTTP ${refused.status}`);
      t.diagnostic(`OBSERVED object left in the bucket after the refused create: HTTP ${await objectStatus(fakeSigned.body)} (known limitation, no orphan cleanup in Payload 3.93.0)`);
    } finally {
      await deleteOrphan(fakeSigned.body);
    }
    assert.equal(await objectStatus(fakeSigned.body), 404, "orphan object removed by the test");

    // text/plain: Payload signs any valid MIME type; the bucket's allowlist refuses the PUT.
    const text = Buffer.from("[FIXTURE] plain\n");
    const textSigned = await presign(`${PREFIX}client-text.txt`, text, "text/plain", true);
    t.diagnostic(`OBSERVED presign text/plain: HTTP ${textSigned.status}`);
    if (textSigned.status === 200) {
      const status = await put(textSigned.body, text);
      t.diagnostic(`OBSERVED PUT text/plain to the bucket: HTTP ${status}`);
      if (status >= 200 && status < 300) await deleteOrphan(textSigned.body);
      assert.equal(status >= 400, true, `PUT text/plain to the bucket: HTTP ${status}`);
    } else {
      assert.equal(textSigned.status, 400, `presign text/plain: HTTP ${textSigned.status}`);
    }
  });

  // ------------------------------------------------------------ the public read path and the staff preview
  test("DL13 detail read: anonymous gets only the public ready file, with panel fields and no storage keys; staff preview gets the draft list, filtered the same way", async (t) => {
    const doc = await findPublicPublication(p(), "id", slug("live"));
    assert.ok(doc, "live record readable anonymously");
    const raw = (doc.files ?? []) as unknown[];
    t.diagnostic(`OBSERVED anonymous files relation: ${raw.map((value) => (value === null ? "null" : typeof value === "object" ? "doc" : typeof value)).join(",")}`);
    const populated = raw.filter((value): value is Record<string, unknown> => value !== null && typeof value === "object");
    assert.deepEqual(populated.map((value) => value.id), [file("a").id], "only the public ready file is populated");
    for (const value of populated) {
      assert.deepEqual(Object.keys(value).sort(), PANEL_FIELDS, "panel fields only");
      for (const key of STORAGE_KEYS) assert.equal(key in value, false, `${key} in the anonymous read`);
    }
    for (const value of raw) {
      if (typeof value === "number") assert.notEqual(value, file("a").id);
    }
    assert.equal(raw.includes(file("draft").id), false, "draft-only file not in the live version");
    assert.deepEqual(toPublicationDetail(doc, "id").files.map((item) => item.id), [file("a").id], "view model");
    const view = JSON.stringify(toPublicationDetail(doc, "id"));
    for (const name of ["a", "reg", "sub", "draft"]) {
      assert.equal(view.includes(fileName(name)), false, `file name of ${name} in the view model`);
    }

    const staff = { ...editorUser(), collection: "users" } as unknown as StaffUser;
    const draft = await findDraftPublication(p(), "id", slug("live"), staff);
    assert.ok(draft, "staff reads the latest version");
    const staffFiles = (draft.files ?? []) as unknown[];
    assert.equal(staffFiles.every((value) => value !== null && typeof value === "object"), true, "staff read populates every file");
    assert.deepEqual(toPublicationDetail(draft, "id").files.map((item) => item.id), [file("a").id, file("draft").id], "preview: public files of the draft, in order");
  });

  // ------------------------------------------------------------ the file panel on the detail page (M3-08 UI, DECISIONS §2.14 item 7)
  /** The detail page with React's streamed segments put back in place. */
  async function detailHtml(path: string, headers: Record<string, string> = {}): Promise<string> {
    const result = await getPage(path, headers);
    assert.equal(result.status, 200, `GET ${path}: ${pageFact(result)}`);
    return inlineSegments(result.body);
  }
  /** File ids of the panel rows, in page order. */
  const panelIds = (html: string) => [...html.matchAll(/data-publication-file="(\d+)"/g)].map((match) => Number(match[1]));
  /** Ids in the download links of the page, in page order. */
  const linkIds = (html: string) => [...html.matchAll(/<a\s[^>]*href="\/api\/files\/(\d+)\/download"[^>]*>/g)].map((match) => Number(match[1]));
  /** A label as a whole text node (the file label is the text of its own element). */
  const hasLabel = (html: string, name: string) => html.includes(`>${LABEL}${name}<`);
  /** Text of the download link of one file (tags removed). */
  function linkText(html: string, id: number): string {
    const match = new RegExp(`<a\\s[^>]*href="/api/files/${id}/download"[^>]*>([\\s\\S]*?)</a>`).exec(html);
    assert.ok(match, `no link for file ${id}`);
    return (match[1] as string).replace(/<[^>]*>/g, "");
  }
  /** Row HTML of one file. */
  function rowOf(html: string, id: number): string {
    const match = new RegExp(`<li[^>]*data-publication-file="${id}"[^>]*>([\\s\\S]*?)</li>`).exec(html);
    assert.ok(match, `no row for file ${id}`);
    return (match[1] as string).replace(/<!-- -->/g, "");
  }

  test("DLU1 panel: a published page lists only the public file with label, kind, document language, 'PDF · size' and a plain download link (ID and EN)", async () => {
    const html = await detailHtml(`/id/publications/${slug("live")}`);
    assert.ok(html.includes(`data-publication-detail="${slug("live")}"`), "detail page");
    assert.ok(html.includes('data-files-mode="live"'), "live mode");
    assert.deepEqual(panelIds(html), [file("a").id], "panel rows");
    assert.deepEqual(linkIds(html), [file("a").id], "download links");
    assert.ok(html.includes(`href="/api/files/${file("a").id}/download"`), "href of the download route");
    const row = rowOf(html, file("a").id);
    for (const text of [`${LABEL}a`, "Dokumen lengkap", "Bahasa Indonesia", fileFormatLabel(bytes.get("a")?.length ?? 0, "id")]) {
      assert.ok(row.includes(text), `row has "${text}"`);
    }
    assert.ok(row.includes('<span lang="id">Bahasa Indonesia</span>'), "document language name carries lang=id");
    assert.ok(html.includes('id="publication-files-heading"') && html.includes(">Dokumen</h2>"), "heading");
    assert.equal(linkText(html, file("a").id), `Unduh PDF: ${LABEL}a`, "link name has the action and the label");
    assert.equal(html.includes("data-files-preview-note"), false, "no preview note on the public page");

    // English page: English copy, the document language is its own (Indonesian), the kind in English.
    const en = await detailHtml(`/en/publications/${slug("enlive")}`);
    assert.deepEqual(panelIds(en), [file("enfile").id], "EN panel rows");
    const enRow = rowOf(en, file("enfile").id);
    for (const text of [`${LABEL}enfile`, "Appendix", "Bahasa Indonesia", fileFormatLabel(bytes.get("enfile")?.length ?? 0, "en")]) {
      assert.ok(enRow.includes(text), `EN row has "${text}"`);
    }
    assert.ok(enRow.includes('<span lang="id">Bahasa Indonesia</span>'), "EN page: Indonesian name carries lang=id");
    assert.ok(en.includes(">Documents</h2>"), "EN heading");
    assert.equal(linkText(en, file("enfile").id), `Download PDF: ${LABEL}enfile`, "EN link name");
    assert.equal(en.includes("Unduh PDF"), false, "no Indonesian copy on the EN page");
    assert.equal(enRow.includes("Lampiran"), false, "no Indonesian kind on the EN page");
  });

  test("DLU2 no panel without public files: no files, and only a restricted file", async () => {
    for (const name of ["nofiles", "restricted"]) {
      const html = await detailHtml(`/id/publications/${slug(name)}`);
      assert.ok(html.includes(`data-publication-detail="${slug(name)}"`), `${name}: detail page`);
      assert.equal(html.includes("data-publication-files"), false, `${name}: panel`);
      assert.equal(html.includes("publication-files-heading"), false, `${name}: heading`);
      assert.equal(html.includes("/api/files/"), false, `${name}: download link`);
      assert.equal(hasLabel(html, "onlyreg"), false, `${name}: restricted label`);
    }
  });

  test("DLU3 nothing restricted or private reaches the HTML: no restricted label, no storage URL, object key or file name", async () => {
    const html = await detailHtml(`/id/publications/${slug("live")}`);
    for (const name of ["reg", "sub", "draft"]) {
      assert.equal(hasLabel(html, name), false, `label of ${name}`);
      assert.equal(html.includes(fileName(name)), false, `file name of ${name}`);
    }
    assert.equal(html.includes(fileName("a")), false, "file name of the listed file");
    for (const forbidden of [".storage.supabase.co", "storage/v1", "publication-files/file", "_objectKey", "X-Amz-", "signedDownloads"]) {
      assert.equal(html.includes(forbidden), false, `"${forbidden}" in the HTML`);
    }
    assert.equal(html.includes(`/api/files/${file("reg").id}/`), false, "link of the registered file");
    assert.equal(html.includes(`/api/files/${file("sub").id}/`), false, "link of the subscriber file");
    assert.equal(html.includes(`/api/files/${file("draft").id}/`), false, "link of the draft-only file");
  });

  test("DLU4 staff draft preview: files of the draft listed without links, with the note; the public page of the same record keeps its links", async () => {
    const start = await getPage(`/api/preview?id=${pub("live").id}`, { Cookie: `payload-token=${token()}` });
    assert.equal(start.status, 307, `GET /api/preview: ${pageFact(start)}`);
    let bypass: string | undefined;
    for (const cookie of start.setCookies) {
      const [pair = ""] = cookie.split(";");
      if (pair.startsWith("__prerender_bypass=")) bypass = pair;
    }
    assert.ok(bypass, "Draft Mode cookie");
    const html = await detailHtml(`/id/publications/${slug("live")}`, { Cookie: `${bypass}; payload-token=${token()}` });
    assert.ok(html.includes('data-preview="true"') && html.includes("data-preview-banner"), "preview page with banner");
    assert.ok(html.includes('data-files-mode="preview"'), "preview mode");
    assert.deepEqual(panelIds(html), [file("a").id, file("draft").id], "public files of the draft, in order");
    assert.equal(hasLabel(html, "a") && hasLabel(html, "draft"), true, "labels");
    assert.equal(hasLabel(html, "reg") || hasLabel(html, "sub"), false, "restricted labels stay hidden");
    assert.deepEqual(linkIds(html), [], "no download link");
    assert.equal(html.includes("/api/files/"), false, "no download path in the HTML");
    assert.ok(html.includes("data-files-preview-note") && html.includes("Unduhan aktif setelah publikasi diterbitkan."), "note");
    assert.equal(html.includes("Unduh PDF"), false, "no download button");

    const live = await detailHtml(`/id/publications/${slug("live")}`);
    assert.deepEqual(linkIds(live), [file("a").id], "the public page of the same record still has the link");
  });

  test("DLU5 index and homepage show no files: no panel and no download link", async () => {
    const index = await fetchAllIndexPages("id");
    assert.ok(index.slugs.includes(slug("live")), "the fixture with files is on the index (the check is meaningful)");
    const home = await getPage("/");
    assert.equal(home.status, 200, `GET /: ${pageFact(home)}`);
    const pages = [
      ["/id/publications", index.bodies],
      ["/en/publications", (await fetchAllIndexPages("en")).bodies],
      ["/", [home.body]],
    ] as const;
    for (const [path, bodies] of pages) {
      assert.ok(bodies.length > 0, `${path}: no page read`);
      for (const body of bodies) {
        assert.equal(body.includes("/api/files/"), false, `${path}: download link`);
        assert.equal(body.includes("data-publication-files"), false, `${path}: panel`);
      }
    }
  });
});
