import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { S3Client } from "@aws-sdk/client-s3";
import type { Access, CollectionBeforeChangeHook, CollectionBeforeDeleteHook, Field, Payload, PayloadRequest } from "payload";

import { findLiveToolkitOfFile, RESOURCE_POPULATE, RESOURCE_SELECT } from "../../lib/cms/learning-hub-query";
import { signedFileUrl } from "../../lib/cms/publication-file-storage";
import { findDraftDetail, type StaffUser } from "../../lib/cms/staff-preview";
import { findPublicToolkitFile } from "../../lib/cms/toolkit-file-query";
import { isResourceVisible, newestCards, planCatalog, toCard, toGuidePage, type ResourceDoc } from "../../lib/learning-hub/catalog-view";
import { toolkitDownloadPath, toolkitFileItems } from "../../lib/learning-hub/toolkit-files";
import { attachmentDisposition } from "../../lib/publications/file-download";
import { PUBLIC_TOOLKIT_FILE_READ } from "../../payload/access/public-read";
import { LearningResources } from "../../payload/collections/LearningResources";
import { ToolkitFiles } from "../../payload/collections/ToolkitFiles";
import { requireReadyToolkitFile, TOOLKIT_NEEDS_READY_FILE } from "../../payload/hooks/learning-resources";
import { refuseFileOfAnotherToolkit } from "../../payload/hooks/one-publication-per-file";
import {
  refuseLiveToolkitFileDelete,
  refuseLiveToolkitFileReplacement,
  refuseOversizedFile,
  setFileStatus,
} from "../../payload/hooks/publication-files";
import { FILES_BUCKET, storageClientConfig, TOOLKIT_FILES_PREFIX } from "../../payload/storage";
import { fakeReq, fakeUser } from "../helpers/fake-req";

/**
 * Toolkit files (M3-13, DECISIONS §2.16 decision 9, §2.17): the
 * `toolkit-files` collection and the `files` field (TKU1), the publish and
 * live-file hooks with a fake `req.payload` (TKU2), the panel items and the
 * signed key under `toolkits/` (TKU3), toolkit visibility, cards, catalog
 * section and page (TKU4), and the read contracts (TKU5). No database, no
 * env. Fixture text only ("[FIXTURE] …"). The DB, storage and route
 * behaviour is covered by tests/integration/toolkit-files.test.ts (TK1–TK11).
 */
type Args = Record<string, unknown>;
type NamedField = Field & {
  name?: string;
  label?: unknown;
  localized?: boolean;
  required?: boolean;
  type: string;
  options?: { value: string }[];
  relationTo?: string;
  hasMany?: boolean;
};

const F = "[FIXTURE] test toolkits";
const admin = () => fakeReq({ user: fakeUser("admin", 1) });
const editor = () => fakeReq({ user: fakeUser("editor", 2) });
const anonymousRest = () => fakeReq({ payloadAPI: "REST" });
const anonymousLocal = () => fakeReq({ payloadAPI: "local" });

async function run(access: Access | undefined, req: PayloadRequest): Promise<unknown> {
  assert.equal(typeof access, "function", "access function must be defined");
  return (access as Access)({ req } as Parameters<Access>[0]);
}

function field(fields: Field[], name: string): NamedField {
  const found = (fields as NamedField[]).find((candidate) => candidate.name === name);
  assert.ok(found, `field ${name}`);
  return found;
}

const beforeChangeArgs = (args: Args) => args as unknown as Parameters<CollectionBeforeChangeHook>[0];
const beforeDeleteArgs = (args: Args) => args as unknown as Parameters<CollectionBeforeDeleteHook>[0];

/** A fake `req` whose payload.count / countVersions record their arguments and return the given totals. */
function countingReq(records: number, versions = 0) {
  const calls: { method: string; args: Args }[] = [];
  const payload = {
    count: async (args: Args) => {
      calls.push({ method: "count", args });
      return { totalDocs: records };
    },
    countVersions: async (args: Args) => {
      calls.push({ method: "countVersions", args });
      return { totalDocs: versions };
    },
  };
  return { req: fakeReq({ user: fakeUser("editor", 2), payloadAPI: "local", payload }), calls };
}

function recordingFind(docs: unknown[]) {
  const calls: Args[] = [];
  const find = async (args: Args) => {
    calls.push(args);
    return { docs };
  };
  return { payload: { find } as unknown as Pick<Payload, "find">, calls };
}

function tkFile(overrides: Record<string, unknown> = {}) {
  return { id: 21, label: `${F} panduan`, language: "id", status: "ready", filesize: 2048, mimeType: "application/pdf", ...overrides };
}

function topic(overrides: Record<string, unknown> = {}) {
  return { id: 7, name: `${F} topic`, description: null, isActive: true, ...overrides };
}

function toolkit(overrides: Partial<ResourceDoc> = {}): ResourceDoc {
  return {
    id: 30,
    type: "toolkit",
    title: `${F} title`,
    summary: `${F} summary`,
    slug: "fixture-toolkit",
    materialLanguage: "id",
    topic: topic(),
    youtubeId: null,
    files: [tkFile(), tkFile({ id: 22, label: `${F} lampiran`, language: "en" })],
    sortOrder: null,
    publishedAt: "2090-01-05T03:00:00.000Z",
    createdAt: "2090-01-01T00:00:00.000Z",
    updatedAt: "2090-01-06T00:00:00.000Z",
    enReady: true,
    _status: "published",
    ...overrides,
  };
}

const VIDEO = "dQw4w9WgXcQ";
const video = (overrides: Partial<ResourceDoc> = {}) =>
  toolkit({ id: 40, type: "video", slug: null, youtubeId: VIDEO, files: null, ...overrides });

describe("payload/collections/ToolkitFiles.ts and LearningResources.files", () => {
  test("TKU1 toolkit-files: no versions, PDF only, localized label, Bahasa dokumen, system status; read staff / anonymous Local = ready / REST and GraphQL denied; hooks; files field shared", async () => {
    assert.equal(ToolkitFiles.slug, "toolkit-files");
    assert.equal(ToolkitFiles.versions, undefined, "no versions");
    assert.deepEqual((ToolkitFiles.upload as { mimeTypes?: string[] }).mimeTypes, ["application/pdf"]);
    assert.equal(ToolkitFiles.admin?.useAsTitle, "label");
    assert.deepEqual((ToolkitFiles.fields as NamedField[]).map((candidate) => candidate.name), ["label", "language", "status"]);
    const label = field(ToolkitFiles.fields, "label");
    assert.equal(label.localized, true, "label per locale (decision 3A)");
    assert.equal(label.required, true);
    const language = field(ToolkitFiles.fields, "language");
    assert.equal(language.localized, undefined, "document language shared");
    assert.equal(language.required, true);
    assert.equal(language.label, "Bahasa dokumen");
    assert.deepEqual(language.options?.map((option) => option.value), ["id", "en"]);
    assert.equal(ToolkitFiles.fields.some((candidate) => (candidate as NamedField).name === "accessLevel"), false, "no access level (DEC-014)");
    const status = field(ToolkitFiles.fields, "status") as NamedField & { access?: Record<string, (args?: unknown) => boolean>; defaultValue?: unknown };
    assert.equal(status.access?.create?.({ req: editor() }), false, "status not writable on create");
    assert.equal(status.access?.update?.({ req: editor() }), false, "status not writable on update");
    assert.equal(status.defaultValue, "ready");

    const read = ToolkitFiles.access?.read;
    assert.equal(await run(read, admin()), true);
    assert.equal(await run(read, editor()), true);
    assert.deepEqual(await run(read, anonymousLocal()), PUBLIC_TOOLKIT_FILE_READ);
    assert.deepEqual(PUBLIC_TOOLKIT_FILE_READ, { status: { equals: "ready" } });
    assert.equal(await run(read, anonymousRest()), false, "anonymous REST denied (also /api/toolkit-files/file/<name>)");
    assert.equal(await run(read, fakeReq({ payloadAPI: "GraphQL" })), false, "GraphQL denied");
    assert.equal(await run(read, fakeReq({ user: fakeUser("superuser", 3), payloadAPI: "local" })), false, "unknown role");
    assert.equal(await run(read, fakeReq({ user: fakeUser("editor", 4, "members"), payloadAPI: "local" })), false, "other auth collection");
    for (const operation of ["create", "update", "delete"] as const) {
      const access = ToolkitFiles.access?.[operation];
      assert.equal(await run(access, admin()), true, `${operation} admin`);
      assert.equal(await run(access, editor()), true, `${operation} editor`);
      for (const req of [anonymousLocal(), anonymousRest()]) assert.equal(await run(access, req), false, `${operation} denied`);
    }
    assert.deepEqual(ToolkitFiles.hooks?.beforeChange, [setFileStatus, refuseOversizedFile, refuseLiveToolkitFileReplacement]);
    assert.deepEqual(ToolkitFiles.hooks?.beforeDelete, [refuseLiveToolkitFileDelete]);
    assert.equal(TOOLKIT_FILES_PREFIX, "toolkits");

    const files = field(LearningResources.fields, "files");
    assert.equal(files.type, "upload");
    assert.equal(files.relationTo, "toolkit-files");
    assert.equal(files.hasMany, true);
    assert.equal(files.localized, undefined, "one file list for ID and EN (decision 3A)");
    const condition = (files.admin as { condition?: (data: unknown) => boolean }).condition;
    assert.equal(condition?.({ type: "toolkit" }), true);
    assert.equal(condition?.({ type: "guide" }), false);
  });
});

describe("payload/hooks: toolkit publish rule, one toolkit per file, live files", () => {
  test("TKU2 publish needs a ready file (also a partial publish); one toolkit per file; a live toolkit file cannot be replaced or deleted", async () => {
    // requireReadyToolkitFile
    const refused = (error: unknown) =>
      error instanceof Error && error.name === "ValidationError" && JSON.stringify(error).includes(TOOLKIT_NEEDS_READY_FILE) && JSON.stringify(error).includes('"files"');
    const none = countingReq(0);
    await assert.rejects(async () => requireReadyToolkitFile(beforeChangeArgs({ data: { _status: "published", type: "toolkit", files: [] }, req: none.req })), refused, "no file");
    assert.equal(none.calls.length, 0, "no query without ids");
    const notReady = countingReq(0);
    await assert.rejects(
      async () => requireReadyToolkitFile(beforeChangeArgs({ data: { _status: "published", type: "toolkit", files: [5, { id: 6 }] }, req: notReady.req })),
      refused,
      "files, none ready",
    );
    assert.deepEqual(notReady.calls[0], {
      method: "count",
      args: { collection: "toolkit-files", where: { and: [{ id: { in: ["5", "6"] } }, { status: { equals: "ready" } }] }, overrideAccess: true, req: notReady.req },
    });
    const ready = countingReq(1);
    const data = { _status: "published", type: "toolkit", files: [5] };
    assert.equal(await requireReadyToolkitFile(beforeChangeArgs({ data, req: ready.req })), data, "one ready file: passes");
    // Partial publish: only `_status` sent; type and files from the stored latest version.
    const partial = countingReq(1);
    await requireReadyToolkitFile(beforeChangeArgs({ data: { _status: "published" }, originalDoc: { id: 3, type: "toolkit", files: [8] }, req: partial.req }));
    assert.deepEqual((partial.calls[0]?.args.where as Args).and, [{ id: { in: ["8"] } }, { status: { equals: "ready" } }]);
    await assert.rejects(
      async () => requireReadyToolkitFile(beforeChangeArgs({ data: { _status: "published" }, originalDoc: { id: 3, type: "toolkit", files: [] }, req: countingReq(1).req })),
      refused,
      "partial publish of a toolkit without files",
    );
    // A save without `_status` on a published toolkit that drops its files.
    await assert.rejects(
      async () => requireReadyToolkitFile(beforeChangeArgs({ data: { files: [] }, originalDoc: { id: 3, type: "toolkit", _status: "published", files: [8] }, req: countingReq(1).req })),
      refused,
      "live toolkit loses its files",
    );
    for (const [label, args] of [
      ["draft save", { data: { _status: "draft", type: "toolkit", files: [] } }],
      ["unpublish", { data: { _status: "draft" }, originalDoc: { type: "toolkit", _status: "published", files: [] } }],
      ["a guide", { data: { _status: "published", type: "guide" } }],
      ["a video", { data: { _status: "published" }, originalDoc: { type: "video" } }],
    ] as const) {
      const quiet = countingReq(0);
      await requireReadyToolkitFile(beforeChangeArgs({ ...args, req: quiet.req }));
      assert.equal(quiet.calls.length, 0, `${label}: no query, passes`);
    }

    // refuseFileOfAnotherToolkit
    const isFilesError = (error: unknown) => error instanceof Error && error.name === "ValidationError" && JSON.stringify(error).includes("satu toolkit");
    const free = countingReq(0, 0);
    await refuseFileOfAnotherToolkit(beforeChangeArgs({ data: { files: [5, { id: 6 }] }, originalDoc: { id: 9 }, req: free.req }));
    assert.deepEqual(free.calls.map((call) => [call.method, call.args.collection]), [["count", "learning-resources"], ["countVersions", "learning-resources"]]);
    assert.deepEqual(free.calls[0]?.args.where, { and: [{ files: { in: ["5", "6"] } }, { id: { not_equals: 9 } }] });
    assert.deepEqual(free.calls[1]?.args.where, { and: [{ latest: { equals: true } }, { "version.files": { in: ["5", "6"] } }, { parent: { not_equals: 9 } }] });
    await assert.rejects(async () => refuseFileOfAnotherToolkit(beforeChangeArgs({ data: { files: [5] }, req: countingReq(1, 0).req })), isFilesError, "main row of another toolkit");
    await assert.rejects(async () => refuseFileOfAnotherToolkit(beforeChangeArgs({ data: { files: [5] }, req: countingReq(0, 1).req })), isFilesError, "latest version of another toolkit");
    const twice = countingReq(0, 0);
    await assert.rejects(
      async () => refuseFileOfAnotherToolkit(beforeChangeArgs({ data: { files: [5, 5] }, req: twice.req })),
      (error: unknown) => error instanceof Error && JSON.stringify(error).includes("lebih dari sekali"),
    );
    const untouched = countingReq(1, 1);
    await refuseFileOfAnotherToolkit(beforeChangeArgs({ data: { title: "x" }, req: untouched.req }));
    assert.equal(untouched.calls.length, 0, "no files sent: no query");

    // Live-file guards against learning-resources
    const live = countingReq(1);
    const liveRefused = (pattern: RegExp) => (error: unknown) => error instanceof Error && pattern.test(error.message) && /toolkit/.test(error.message);
    const upload = { size: 10 };
    await assert.rejects(
      async () =>
        refuseLiveToolkitFileReplacement(
          beforeChangeArgs({ data: { filename: "a.pdf" }, operation: "update", originalDoc: { id: 21, filename: "a.pdf" }, req: { ...live.req, file: upload } }),
        ),
      liveRefused(/tidak dapat diganti/),
      "new upload on a live file",
    );
    assert.deepEqual(live.calls[0]?.args, {
      collection: "learning-resources",
      where: { and: [{ files: { equals: 21 } }, { _status: { equals: "published" } }] },
      overrideAccess: true,
      req: { ...live.req, file: upload },
    });
    await assert.rejects(
      async () => refuseLiveToolkitFileReplacement(beforeChangeArgs({ data: { filename: "b.pdf" }, operation: "update", originalDoc: { id: 21, filename: "a.pdf" }, req: countingReq(1).req })),
      liveRefused(/tidak dapat diganti/),
      "renamed live file",
    );
    const draftOnly = countingReq(0);
    await refuseLiveToolkitFileReplacement(beforeChangeArgs({ data: {}, operation: "update", originalDoc: { id: 21, filename: "a.pdf" }, req: { ...draftOnly.req, file: upload } }));
    const meta = countingReq(1);
    await refuseLiveToolkitFileReplacement(beforeChangeArgs({ data: { label: "x", filename: "a.pdf" }, operation: "update", originalDoc: { id: 21, filename: "a.pdf" }, req: meta.req }));
    assert.equal(meta.calls.length, 0, "label edit: no query");
    await assert.rejects(async () => refuseLiveToolkitFileDelete(beforeDeleteArgs({ id: 21, req: countingReq(1).req })), liveRefused(/tidak dapat dihapus/));
    await refuseLiveToolkitFileDelete(beforeDeleteArgs({ id: 21, req: countingReq(0).req }));
  });
});

describe("lib/learning-hub/toolkit-files.ts and the signed key", () => {
  test("TKU3 toolkitFileItems: ready PDFs with a label in the locale, a known language and a size, stored order, no storage fields; ?locale= path; key toolkits/<name> with attachment", async () => {
    assert.equal(toolkitDownloadPath(21, "en"), "/api/learning-hub/files/21/download?locale=en");
    const items = toolkitFileItems(
      [
        tkFile({ id: 2 }),
        5,
        null,
        tkFile({ id: 3, status: "pending" }),
        tkFile({ id: 4, mimeType: "image/png" }),
        tkFile({ id: 6, label: "  " }),
        tkFile({ id: 7, language: "fr" }),
        tkFile({ id: 8, filesize: null }),
        tkFile({ id: 9, filesize: -1 }),
        tkFile({ id: "10" }),
        tkFile({ id: 1, language: "en", filename: "x.pdf", url: "https://example.invalid/x.pdf", prefix: "toolkits", _objectKey: "k" }),
      ],
      "id",
    );
    assert.deepEqual(items.map((item) => item.id), [2, 1], "stored order, invalid ones dropped");
    assert.deepEqual(Object.keys(items[1] ?? {}).sort(), ["downloadPath", "id", "label", "language", "sizeBytes"]);
    assert.deepEqual(items[1], { id: 1, label: `${F} panduan`, language: "en", sizeBytes: 2048, downloadPath: "/api/learning-hub/files/1/download?locale=id" });
    assert.deepEqual(toolkitFileItems(null, "en"), []);
    assert.deepEqual(toolkitFileItems([tkFile({ label: null })], "en"), [], "no label in this locale: not shown");

    const s3 = new S3Client(
      storageClientConfig({
        PAYLOAD_SECRET: "test-payload-secret",
        CMS_SUPABASE_DATABASE_URI: "postgres://test@127.0.0.1:1/test",
        APP_SUPABASE_URL: "https://abcref.supabase.co/",
        APP_SUPABASE_S3_ACCESS_KEY_ID: "test-access-key-id",
        APP_SUPABASE_S3_SECRET_ACCESS_KEY: "test-secret-never-in-url",
      }),
    );
    const name = "fixture-test-toolkits-a.pdf";
    for (const [objectKey, path] of [
      [null, `/storage/v1/s3/${FILES_BUCKET}/toolkits/${name}`],
      ["abc", `/storage/v1/s3/${FILES_BUCKET}/toolkits/abc/${name}`],
    ] as const) {
      const url = new URL(await signedFileUrl({ id: 1, filename: name, prefix: TOOLKIT_FILES_PREFIX, _objectKey: objectKey }, s3));
      assert.equal(url.host, "abcref.storage.supabase.co");
      assert.equal(url.pathname, path, "key under toolkits/ (plugin-cloud-storage layout)");
      assert.equal(url.searchParams.get("X-Amz-Expires"), "60");
      assert.equal(url.searchParams.get("response-content-disposition"), attachmentDisposition(name));
      assert.equal(url.toString().includes("test-secret-never-in-url"), false);
    }
  });
});

describe("lib/learning-hub/catalog-view.ts with toolkits", () => {
  test("TKU4 toolkit visibility (fail closed), card href + file count, Toolkit section before themes and never in a theme, homepage, page with files", () => {
    assert.equal(isResourceVisible(toolkit(), "id"), true);
    assert.equal(isResourceVisible(toolkit(), "en"), true, "EN read with EN labels + enReady");
    assert.equal(isResourceVisible(toolkit({ files: [tkFile({ label: null }), tkFile({ id: 22, label: "" })] }), "en"), false, "no file label in this locale");
    assert.equal(isResourceVisible(toolkit({ enReady: false }), "en"), false, "EN without enReady");
    assert.equal(isResourceVisible(toolkit({ enReady: false }), "id"), true, "ID does not need enReady");
    for (const [label, overrides] of [
      ["no files", { files: [] }],
      ["files not populated (ids)", { files: [21, 22] }],
      ["no ready file", { files: [tkFile({ status: "pending" }), tkFile({ id: 22, status: "failed" })] }],
      ["no slug", { slug: null }],
      ["bad slug", { slug: "Bad Slug" }],
      ["draft", { _status: "draft" }],
      ["inactive topic", { topic: topic({ isActive: false }) }],
    ] as const) {
      assert.equal(isResourceVisible(toolkit(overrides as Partial<ResourceDoc>), "id"), false, label);
    }

    const card = toCard(toolkit(), "id");
    assert.equal(card.href, "/id/learning-hub/fixture-toolkit");
    assert.equal(card.fileCount, 2);
    assert.equal(card.youtube, null);
    assert.equal(toCard(video(), "id").fileCount, null, "fileCount only for toolkits");

    const other = topic({ id: 8, name: `${F} other` });
    const docs = [
      video({ id: 41 }),
      toolkit({ id: 31, sortOrder: 2 }),
      toolkit({ id: 32, topic: other, publishedAt: "2090-03-01T00:00:00.000Z" }),
      toolkit({ id: 33, sortOrder: 1 }),
      toolkit({ id: 34, files: [] }),
    ];
    const plan = planCatalog(docs, "id", null);
    assert.ok(plan);
    assert.deepEqual(plan.toolkits.map((item) => item.id), [33, 31, 32], "Toolkit section: sortOrder, then newest");
    assert.deepEqual(plan.themes.map((theme) => theme.topicId), [7], "the theme of `other` has only a toolkit: dropped");
    assert.deepEqual(plan.themes[0]?.cards.map((item) => item.id), [41], "no toolkit inside a theme");
    assert.equal(plan.cardCount, 4);
    assert.deepEqual(planCatalog([toolkit()], "id", null)?.themes, [], "a catalog of toolkits only has no theme");
    assert.equal(planCatalog([toolkit({ files: [] })], "id", null), null, "no visible resource: no catalog");
    assert.deepEqual(newestCards(docs, "id").map((item) => item.id), [32, 41, 33], "homepage block includes toolkits");

    const page = toGuidePage(toolkit({ files: [tkFile({ id: 2, language: "id" }), tkFile({ id: 3, status: "pending" })] }), "en");
    assert.equal(page?.type, "toolkit");
    assert.deepEqual(page?.files, [{ id: 2, label: `${F} panduan`, language: "id", sizeBytes: 2048, downloadPath: "/api/learning-hub/files/2/download?locale=en" }]);
    assert.equal(toGuidePage(video(), "id"), null);
  });
});

describe("toolkit reads (lib/cms/learning-hub-query.ts, toolkit-file-query.ts, staff-preview.ts)", () => {
  test("TKU5 query contracts: live toolkit of a file and the file read anonymously; populate without storage fields; staff detail read as the user", async () => {
    const anonymous = { fallbackLocale: false, draft: false, overrideAccess: false };
    assert.equal(RESOURCE_SELECT.files, true);
    const populated = Object.keys(RESOURCE_POPULATE["toolkit-files"]).sort();
    assert.deepEqual(populated, ["filesize", "label", "language", "mimeType", "status"]);
    for (const key of ["filename", "prefix", "_objectKey", "url", "thumbnailURL"]) assert.equal(populated.includes(key), false, `${key} never populated`);

    const live = recordingFind([{ id: 30 }]);
    assert.deepEqual(await findLiveToolkitOfFile(live.payload, 21, "en"), { id: 30 });
    const [args] = live.calls;
    assert.ok(args);
    assert.deepEqual(args.where, { and: [{ type: { equals: "toolkit" } }, { files: { equals: 21 } }] });
    assert.equal(args.collection, "learning-resources");
    assert.equal(args.locale, "en");
    assert.equal(args.select, RESOURCE_SELECT);
    assert.equal(args.populate, RESOURCE_POPULATE);
    for (const [key, value] of Object.entries(anonymous)) assert.equal(args[key], value, key);
    assert.equal("user" in args, false, "no user: Payload access applies");
    assert.equal(await findLiveToolkitOfFile(recordingFind([]).payload, 21, "id"), null);

    const fileRead = recordingFind([]);
    assert.equal(await findPublicToolkitFile(fileRead.payload, 21), null);
    assert.deepEqual(fileRead.calls[0], {
      collection: "toolkit-files",
      where: { id: { equals: 21 } },
      limit: 1,
      pagination: false,
      depth: 0,
      select: { filename: true, prefix: true, _objectKey: true, mimeType: true, status: true },
      fallbackLocale: false,
      overrideAccess: false,
    });

    const staff = fakeUser("editor", 3) as unknown as StaffUser;
    const draft = recordingFind([]);
    await findDraftDetail(draft.payload, "en", "fixture-toolkit", staff);
    assert.equal(draft.calls[0]?.draft, true);
    assert.equal(draft.calls[0]?.user, staff);
    assert.equal(draft.calls[0]?.overrideAccess, false);
    assert.equal(draft.calls[0]?.populate, RESOURCE_POPULATE);
    assert.deepEqual(draft.calls[0]?.where, { and: [{ type: { in: ["guide", "toolkit"] } }, { slug: { equals: "fixture-toolkit" } }] });
  });
});
