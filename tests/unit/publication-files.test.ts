import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { APIError, ValidationError } from "payload";
import type {
  Access,
  CollectionBeforeChangeHook,
  CollectionBeforeDeleteHook,
  CollectionConfig,
  Field,
  FieldAccess,
  Payload,
  PayloadRequest,
} from "payload";

import { findLivePublicationOfFile, findPublicFile } from "../../lib/cms/publication-file-query";
import { FileStorageError } from "../../lib/cms/publication-file-storage";
import { publicFiles, toPublicationDetail, type PublicationDetailDoc } from "../../lib/publications/detail-view";
import { isPublicDownload, stricterAccess, type AccessLevel } from "../../lib/publications/file-access";
import { DOWNLOAD_HEADERS, downloadPath, downloadResponse, parseFileId } from "../../lib/publications/file-download";
import { PUBLIC_FILE_READ, PUBLIC_PUBLICATION_READ } from "../../payload/access/public-read";
import { PublicationFiles } from "../../payload/collections/PublicationFiles";
import { Publications } from "../../payload/collections/Publications";
import { SHARED_FIELDS } from "../../payload/hooks/enforce-shared-fields";
import { refuseFileOfAnotherPublication } from "../../payload/hooks/one-publication-per-file";
import {
  PUBLICATION_FILE_MAX_BYTES,
  refuseLiveFileDelete,
  refuseLiveFileReplacement,
  refuseOversizedFile,
  setFileStatus,
} from "../../payload/hooks/publication-files";
import { fakeReq, fakeUser } from "../helpers/fake-req";

/**
 * Publication files and public downloads (M3-08, DECISIONS §2.14). No
 * database, no env: effective access (FU1, FU2), the detail panel filter
 * (FU3), the download queries (FU4), the route's id and answers (FU5, FU6),
 * the collection and field configuration (FU7) and the hooks with a fake
 * `req.payload` (FU8, FU9). The DB and storage behaviour is covered by
 * tests/integration/publication-files.test.ts (DL1–DL13).
 */
const LEVELS: AccessLevel[] = ["public", "registered", "subscriber"];

type Args = Record<string, unknown>;

function recordingFind(docs: unknown[]): { payload: Pick<Payload, "find">; calls: Args[] } {
  const calls: Args[] = [];
  const find = async (args: Args) => {
    calls.push(args);
    return { docs };
  };
  return { payload: { find } as unknown as Pick<Payload, "find">, calls };
}

/** A fake `req` whose payload.count / countVersions record their arguments and return the given totals. */
function countingReq(records: number, versions = 0, user = fakeUser("editor", 2)) {
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
  return { req: fakeReq({ user, payloadAPI: "local", payload }), calls };
}

function file(overrides: Record<string, unknown> = {}) {
  return {
    id: 11,
    label: "Laporan lengkap",
    kind: "full_document",
    language: "id",
    accessLevel: "public",
    status: "ready",
    filesize: 1_234_567,
    mimeType: "application/pdf",
    ...overrides,
  };
}

function detailDoc(overrides: Partial<PublicationDetailDoc> = {}): PublicationDetailDoc {
  return { id: 7, slug: "pub", title: "Judul", summary: "Ringkasan.", accessLevel: "public", publishedAt: null, ...overrides };
}

async function runAccess(access: Access | undefined, req: PayloadRequest): Promise<unknown> {
  assert.equal(typeof access, "function", "access function must be defined");
  return (access as Access)({ req } as Parameters<Access>[0]);
}

function fieldOf(collection: CollectionConfig, name: string): Field & Record<string, unknown> {
  const field = collection.fields.find((candidate) => "name" in candidate && candidate.name === name);
  assert.ok(field, `field ${name} exists`);
  return field as Field & Record<string, unknown>;
}

/** An uploaded file on the fake request, as `req.file` (only `size` is read). */
function attachFile(req: PayloadRequest, size: number): void {
  (req as unknown as { file: { size: number } }).file = { size };
}

const beforeChangeArgs = (args: Args) => args as unknown as Parameters<CollectionBeforeChangeHook>[0];
const beforeDeleteArgs = (args: Args) => args as unknown as Parameters<CollectionBeforeDeleteHook>[0];

describe("lib/publications/file-access.ts", () => {
  test("FU1 stricterAccess: the stricter of publication and file (3×3); an unknown value gives subscriber", () => {
    const expected: Record<AccessLevel, Record<AccessLevel, AccessLevel>> = {
      public: { public: "public", registered: "registered", subscriber: "subscriber" },
      registered: { public: "registered", registered: "registered", subscriber: "subscriber" },
      subscriber: { public: "subscriber", registered: "subscriber", subscriber: "subscriber" },
    };
    for (const publication of LEVELS) {
      for (const level of LEVELS) {
        assert.equal(stricterAccess(publication, level), expected[publication][level], `publication ${publication}, file ${level}`);
      }
    }
    for (const unknown of [undefined, null, "", "Public", "admin", 0]) {
      assert.equal(stricterAccess("public", unknown), "subscriber", `file ${String(unknown)}`);
      assert.equal(stricterAccess(unknown, "public"), "subscriber", `publication ${String(unknown)}`);
    }
  });

  test("FU2 isPublicDownload: ready + PDF + stricter level public only", () => {
    assert.equal(isPublicDownload("public", file()), true);
    assert.equal(isPublicDownload("registered", file()), false, "registered publication, public file (looser file has no effect)");
    assert.equal(isPublicDownload("subscriber", file()), false);
    assert.equal(isPublicDownload("public", file({ accessLevel: "registered" })), false);
    assert.equal(isPublicDownload("public", file({ accessLevel: "subscriber" })), false);
    for (const status of ["pending", "failed", "quarantined", "archived", undefined, "READY"]) {
      assert.equal(isPublicDownload("public", file({ status })), false, `status ${String(status)}`);
    }
    for (const mimeType of ["application/octet-stream", "image/png", undefined, "application/PDF"]) {
      assert.equal(isPublicDownload("public", file({ mimeType })), false, `mimeType ${String(mimeType)}`);
    }
    assert.equal(isPublicDownload(undefined, file()), false, "missing publication level");
  });
});

describe("lib/publications/detail-view.ts files", () => {
  test("FU3 publicFiles: populated public ready PDFs in stored order; ids, restricted, not ready and incomplete dropped; no storage keys", () => {
    const files = [
      file({ id: 3, label: "Ringkasan", kind: "preview" }),
      42,
      null,
      file({ id: 4, accessLevel: "registered" }),
      file({ id: 5, accessLevel: "subscriber" }),
      file({ id: 6, status: "pending" }),
      file({ id: 7, mimeType: "image/png" }),
      file({ id: 8, label: "  " }),
      file({ id: 9, kind: "cover" }),
      file({ id: 10, language: "fr" }),
      file({ id: 12, filesize: null }),
      file({ id: 1, label: " Lampiran ", kind: "appendix", language: "en", filesize: 0 }),
    ];
    const items = publicFiles("public", files);
    assert.deepEqual(items, [
      { id: 3, label: "Ringkasan", kind: "preview", language: "id", sizeBytes: 1_234_567, downloadPath: "/api/files/3/download" },
      { id: 1, label: "Lampiran", kind: "appendix", language: "en", sizeBytes: 0, downloadPath: "/api/files/1/download" },
    ]);
    for (const item of items) {
      assert.deepEqual(Object.keys(item).sort(), ["downloadPath", "id", "kind", "label", "language", "sizeBytes"], "no url, filename, prefix, _objectKey");
    }
    assert.deepEqual(publicFiles("registered", files), [], "registered publication: no file");
    assert.deepEqual(publicFiles("public", null), []);

    const detail = toPublicationDetail(detailDoc({ files: [file({ id: 3 }), 99] }), "id");
    assert.deepEqual(detail.files.map((item) => item.id), [3]);
    assert.deepEqual(toPublicationDetail(detailDoc(), "en").files, [], "no files: empty list (no panel)");
    const serialized = JSON.stringify(toPublicationDetail(detailDoc({ files: [file({ id: 3, url: "https://x.storage.supabase.co/a", filename: "a.pdf", prefix: "p", _objectKey: "k" })] }), "id"));
    for (const key of ["storage.supabase.co", "a.pdf", "_objectKey", '"prefix"', '"url"']) {
      assert.equal(serialized.includes(key), false, `${key} in the view model`);
    }
  });
});

describe("lib/cms/publication-file-query.ts", () => {
  test("FU4 findPublicFile and findLivePublicationOfFile: anonymous, access on, live version only, no fallback", async () => {
    const files = recordingFind([{ id: 5, filename: "a.pdf" }]);
    assert.deepEqual(await findPublicFile(files.payload, 5), { id: 5, filename: "a.pdf" });
    const [fileArgs] = files.calls;
    assert.ok(fileArgs);
    assert.equal(fileArgs.collection, "publication-files");
    assert.deepEqual(fileArgs.where, { id: { equals: 5 } });
    assert.equal(fileArgs.limit, 1);
    assert.equal(fileArgs.depth, 0);
    assert.equal(fileArgs.overrideAccess, false);
    assert.equal(fileArgs.fallbackLocale, false);
    assert.equal("user" in fileArgs, false, "no user");
    assert.equal("draft" in fileArgs, false, "files have no drafts");
    assert.deepEqual(Object.keys(fileArgs.select as Args).sort(), ["_objectKey", "accessLevel", "filename", "mimeType", "prefix", "status"]);

    const pubs = recordingFind([{ id: 9, accessLevel: "public" }]);
    assert.deepEqual(await findLivePublicationOfFile(pubs.payload, 5), { id: 9, accessLevel: "public" });
    const [pubArgs] = pubs.calls;
    assert.ok(pubArgs);
    assert.equal(pubArgs.collection, "publications");
    assert.deepEqual(pubArgs.where, { files: { equals: 5 } });
    assert.equal(pubArgs.draft, false, "main table = live version");
    assert.equal(pubArgs.overrideAccess, false);
    assert.equal(pubArgs.fallbackLocale, false);
    assert.equal(pubArgs.limit, 1);
    assert.equal("user" in pubArgs, false, "no user");
    assert.deepEqual(pubArgs.select, { accessLevel: true });

    assert.equal(await findPublicFile(recordingFind([]).payload, 5), null);
    assert.equal(await findLivePublicationOfFile(recordingFind([]).payload, 5), null);
  });
});

describe("lib/publications/file-download.ts", () => {
  test("FU5 parseFileId: positive integer ids in the Postgres integer range only", () => {
    assert.equal(parseFileId("1"), 1);
    assert.equal(parseFileId("2147483647"), 2_147_483_647);
    for (const invalid of ["0", "-1", "1e3", "abc", "01", "1.5", " 1", "1 ", "", "2147483648", "12345678901", "0x10"]) {
      assert.equal(parseFileId(invalid), null, `"${invalid}"`);
    }
    assert.equal(parseFileId(null), null);
    assert.equal(parseFileId(undefined), null);
    assert.equal(downloadPath(42), "/api/files/42/download");
  });

  test("FU6 downloadResponse: 307 + Location, 404, 503, always no-store + noindex; FileStorageError says nothing", async () => {
    const url = "https://ref.storage.supabase.co/storage/v1/s3/publication-files/a.pdf?X-Amz-Expires=60";
    const redirect = downloadResponse({ kind: "redirect", url });
    assert.equal(redirect.status, 307);
    assert.equal(redirect.headers.get("location"), url);
    assert.equal(await redirect.text(), "", "the URL is only in Location");
    const notFound = downloadResponse({ kind: "not-found" });
    assert.equal(notFound.status, 404);
    assert.equal(notFound.headers.get("location"), null);
    assert.equal(await notFound.text(), "Not Found");
    const unavailable = downloadResponse({ kind: "unavailable" });
    assert.equal(unavailable.status, 503);
    assert.equal(unavailable.headers.get("location"), null);
    for (const response of [redirect, notFound, unavailable]) {
      assert.equal(response.headers.get("cache-control"), "no-store");
      assert.equal(response.headers.get("x-robots-tag"), "noindex");
    }
    assert.deepEqual(DOWNLOAD_HEADERS, { "Cache-Control": "no-store", "X-Robots-Tag": "noindex" });
    const error = new FileStorageError();
    assert.equal(error.name, "FileStorageError");
    assert.equal(error.message, "File URL could not be signed");
    assert.equal(error.cause, undefined);
  });
});

describe("payload/collections/PublicationFiles.ts and Publications.files", () => {
  test("FU7 access, fields and upload config: staff write, anonymous Local read = ready + public, REST denied, PDF only, no versions", async () => {
    const admin = fakeReq({ user: fakeUser("admin", 1) });
    const editor = fakeReq({ user: fakeUser("editor", 2) });
    const anonymousLocal = fakeReq({ payloadAPI: "local" });
    const anonymousRest = fakeReq({ payloadAPI: "REST" });
    const other = fakeReq({ user: fakeUser("editor", 3, "members") });
    const read = PublicationFiles.access?.read as Access;
    assert.equal(await runAccess(read, admin), true);
    assert.equal(await runAccess(read, editor), true);
    assert.deepEqual(await runAccess(read, anonymousLocal), PUBLIC_FILE_READ);
    assert.equal(await runAccess(read, anonymousRest), false);
    assert.equal(await runAccess(read, other), false);
    assert.deepEqual(PUBLIC_FILE_READ, { and: [{ status: { equals: "ready" } }, { accessLevel: { equals: "public" } }] });
    for (const operation of ["create", "update", "delete"] as const) {
      const access = PublicationFiles.access?.[operation] as Access;
      assert.equal(await runAccess(access, admin), true, `${operation} admin`);
      assert.equal(await runAccess(access, editor), true, `${operation} editor`);
      assert.equal(await runAccess(access, anonymousLocal), false, `${operation} anonymous Local API`);
      assert.equal(await runAccess(access, anonymousRest), false, `${operation} anonymous REST`);
    }
    assert.equal(PublicationFiles.versions, undefined, "no versions: edits apply at once");
    const upload = PublicationFiles.upload as { mimeTypes?: string[] };
    assert.deepEqual(upload.mimeTypes, ["application/pdf"]);

    const accessLevel = fieldOf(PublicationFiles, "accessLevel");
    assert.equal(accessLevel.required, true);
    assert.equal("defaultValue" in accessLevel, false, "accessLevel has no default");
    assert.deepEqual((accessLevel.options as { value: string }[]).map((option) => option.value), LEVELS);
    const kind = fieldOf(PublicationFiles, "kind");
    assert.deepEqual(
      (kind.options as { value: string }[]).map((option) => option.value),
      ["preview", "full_document", "appendix", "dataset", "supplementary", "other"],
    );
    for (const name of ["label", "kind", "language"]) assert.equal(fieldOf(PublicationFiles, name).required, true, `${name} required`);
    const status = fieldOf(PublicationFiles, "status");
    const statusAccess = status.access as { create: FieldAccess; update: FieldAccess };
    assert.equal(statusAccess.create({ req: admin } as Parameters<FieldAccess>[0]), false, "status not writable on create");
    assert.equal(statusAccess.update({ req: admin } as Parameters<FieldAccess>[0]), false, "status not writable on update");
    assert.deepEqual(PublicationFiles.hooks?.beforeChange, [setFileStatus, refuseOversizedFile, refuseLiveFileReplacement]);
    assert.deepEqual(PublicationFiles.hooks?.beforeDelete, [refuseLiveFileDelete]);

    const files = fieldOf(Publications, "files");
    assert.equal(files.type, "upload");
    assert.equal(files.relationTo, "publication-files");
    assert.equal(files.hasMany, true);
    assert.equal((SHARED_FIELDS as readonly string[]).includes("files"), false, "files are not a DEC-004 shared field");
    assert.deepEqual(PUBLIC_PUBLICATION_READ, { and: [{ _status: { equals: "published" } }, { accessLevel: { equals: "public" } }] });
  });
});

describe("payload/hooks/publication-files.ts", () => {
  test("FU8 status ready on create, size limit, decision 8: replace or delete refused on a live publication", async () => {
    assert.deepEqual(await setFileStatus(beforeChangeArgs({ data: { label: "x", status: "failed" }, operation: "create" })), {
      label: "x",
      status: "ready",
    });
    assert.deepEqual(await setFileStatus(beforeChangeArgs({ data: { label: "y" }, operation: "update" })), { label: "y" });

    const withFile = (size: number) => {
      const req = fakeReq({ user: fakeUser("editor", 2) });
      attachFile(req, size);
      return req;
    };
    assert.deepEqual(
      await refuseOversizedFile(beforeChangeArgs({ data: { filesize: PUBLICATION_FILE_MAX_BYTES }, req: withFile(PUBLICATION_FILE_MAX_BYTES) })),
      { filesize: PUBLICATION_FILE_MAX_BYTES },
    );
    await assert.rejects(async () => refuseOversizedFile(beforeChangeArgs({ data: {}, req: withFile(PUBLICATION_FILE_MAX_BYTES + 1) })), APIError);
    await assert.rejects(
      async () => refuseOversizedFile(beforeChangeArgs({ data: { filesize: PUBLICATION_FILE_MAX_BYTES + 1 }, req: withFile(10) })),
      APIError,
    );
    const noFile = fakeReq({ user: fakeUser("editor", 2) });
    assert.deepEqual(await refuseOversizedFile(beforeChangeArgs({ data: { filesize: PUBLICATION_FILE_MAX_BYTES + 1 }, req: noFile })), {
      filesize: PUBLICATION_FILE_MAX_BYTES + 1,
    }, "metadata edit without a file: not checked");
    assert.equal(PUBLICATION_FILE_MAX_BYTES, 52_428_800);

    const original = { id: 5, filename: "a.pdf" };
    // Live publication lists the file: a new upload is refused.
    const live = countingReq(1);
    attachFile(live.req, 10);
    await assert.rejects(
      async () => refuseLiveFileReplacement(beforeChangeArgs({ data: { filename: "a.pdf" }, operation: "update", originalDoc: original, req: live.req })),
      (error: unknown) => error instanceof APIError && error.status === 400 && /tidak dapat diganti/.test(error.message),
    );
    assert.equal(live.calls.length, 1);
    assert.equal(live.calls[0]?.method, "count");
    assert.equal(live.calls[0]?.args.collection, "publications");
    assert.deepEqual(live.calls[0]?.args.where, { and: [{ files: { equals: 5 } }, { _status: { equals: "published" } }] });
    assert.equal(live.calls[0]?.args.overrideAccess, true);
    assert.equal(live.calls[0]?.args.req, live.req, "the save's transaction");
    // A new filename without a file counts as a replacement too.
    const renamed = countingReq(1);
    await assert.rejects(async () =>
      refuseLiveFileReplacement(beforeChangeArgs({ data: { filename: "b.pdf" }, operation: "update", originalDoc: original, req: renamed.req })),
    );
    // Not live: allowed.
    const draftOnly = countingReq(0);
    attachFile(draftOnly.req, 10);
    assert.deepEqual(
      await refuseLiveFileReplacement(beforeChangeArgs({ data: { filename: "a.pdf" }, operation: "update", originalDoc: original, req: draftOnly.req })),
      { filename: "a.pdf" },
    );
    // Metadata edit (no file, same filename) and create: no query.
    const metadata = countingReq(1);
    await refuseLiveFileReplacement(beforeChangeArgs({ data: { filename: "a.pdf", label: "Baru" }, operation: "update", originalDoc: original, req: metadata.req }));
    await refuseLiveFileReplacement(beforeChangeArgs({ data: { filename: "a.pdf" }, operation: "create", req: metadata.req }));
    assert.equal(metadata.calls.length, 0, "no query for a metadata edit or a create");

    const deleteLive = countingReq(1);
    await assert.rejects(
      async () => refuseLiveFileDelete(beforeDeleteArgs({ id: 5, req: deleteLive.req })),
      (error: unknown) => error instanceof APIError && error.status === 400 && /tidak dapat dihapus/.test(error.message),
    );
    const deleteFree = countingReq(0);
    await refuseLiveFileDelete(beforeDeleteArgs({ id: 5, req: deleteFree.req }));
    assert.deepEqual(deleteFree.calls[0]?.args.where, { and: [{ files: { equals: 5 } }, { _status: { equals: "published" } }] });
  });
});

describe("payload/hooks/one-publication-per-file.ts", () => {
  test("FU9 a file belongs to one publication: other records' main rows and latest versions, duplicates in the list", async () => {
    const free = countingReq(0, 0);
    const data = { files: [5, { id: 6 }] };
    assert.equal(await refuseFileOfAnotherPublication(beforeChangeArgs({ data, originalDoc: { id: 9 }, req: free.req })), data);
    assert.deepEqual(free.calls.map((call) => call.method), ["count", "countVersions"]);
    assert.deepEqual(free.calls[0]?.args.where, { and: [{ files: { in: ["5", "6"] } }, { id: { not_equals: 9 } }] });
    assert.deepEqual(free.calls[1]?.args.where, {
      and: [{ latest: { equals: true } }, { "version.files": { in: ["5", "6"] } }, { parent: { not_equals: 9 } }],
    });
    for (const call of free.calls) {
      assert.equal(call.args.overrideAccess, true);
      assert.equal(call.args.req, free.req);
    }

    const created = countingReq(0, 0);
    await refuseFileOfAnotherPublication(beforeChangeArgs({ data: { files: [5] }, req: created.req }));
    assert.deepEqual(created.calls[0]?.args.where, { and: [{ files: { in: ["5"] } }] }, "create: no self to exclude");

    const isFilesError = (error: unknown) => error instanceof ValidationError && JSON.stringify(error.data).includes('"path":"files"');
    await assert.rejects(async () => refuseFileOfAnotherPublication(beforeChangeArgs({ data: { files: [5] }, originalDoc: { id: 9 }, req: countingReq(1, 0).req })), isFilesError);
    await assert.rejects(async () => refuseFileOfAnotherPublication(beforeChangeArgs({ data: { files: [5] }, originalDoc: { id: 9 }, req: countingReq(0, 1).req })), isFilesError);
    const duplicate = countingReq(0, 0);
    await assert.rejects(async () => refuseFileOfAnotherPublication(beforeChangeArgs({ data: { files: [5, 5] }, originalDoc: { id: 9 }, req: duplicate.req })), isFilesError);
    assert.equal(duplicate.calls.length, 0);

    const none = countingReq(1, 1);
    for (const value of [{}, { files: [] }, { files: null }, { title: "x" }]) {
      await refuseFileOfAnotherPublication(beforeChangeArgs({ data: value, originalDoc: { id: 9 }, req: none.req }));
    }
    assert.equal(none.calls.length, 0, "no query without files in the save");
  });
});
