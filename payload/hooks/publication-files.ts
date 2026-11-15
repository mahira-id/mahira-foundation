import { APIError } from "payload";
import type { CollectionBeforeChangeHook, CollectionBeforeDeleteHook, PayloadRequest } from "payload";

/**
 * Hooks of the upload collection `publication-files` (M3-08, DECISIONS
 * §2.14 items 1, 4 and 8).
 */

/** Size limit of the private bucket `publication-files`, set by the Owner (50 MB = 52428800 bytes). */
export const PUBLICATION_FILE_MAX_BYTES = 52_428_800;

/**
 * `status` is system-set (DATA-MODEL §4.2): a new file is `ready`, because
 * no processing step exists yet (no virus scan, no text extraction). Client
 * values never reach this hook: the field's create/update access is false,
 * and field access runs in beforeValidate. Updates keep the stored value.
 */
export const setFileStatus: CollectionBeforeChangeHook = ({ data, operation }) =>
  operation === "create" ? { ...data, status: "ready" } : data;

/**
 * Refuses a file larger than the bucket limit (item 4). The global
 * `upload.limits.fileSize` is not set because it would also apply to
 * `media`. For a client upload (browser → bucket) the size is the one the
 * browser declared; the bucket itself refuses a larger PUT.
 */
export const refuseOversizedFile: CollectionBeforeChangeHook = ({ data, req }) => {
  if (!req.file) return data;
  const declared = typeof data.filesize === "number" ? data.filesize : 0;
  if (Math.max(req.file.size ?? 0, declared) > PUBLICATION_FILE_MAX_BYTES) {
    throw new APIError("File lebih besar dari batas 50 MB.", 400, null, true);
  }
  return data;
};

/**
 * True when the live version of a Publication lists the file: a main
 * `publications` row with `_status` published (what visitors get, whatever
 * its Access Level). A file listed only in a draft (a never-published
 * record, or a pending revision) is not live. Runs in the caller's
 * transaction (`req`), without access control.
 */
async function isOnLivePublication(req: PayloadRequest, id: number | string): Promise<boolean> {
  const live = await req.payload.count({
    collection: "publications",
    where: { and: [{ files: { equals: id } }, { _status: { equals: "published" } }] },
    overrideAccess: true,
    req,
  });
  return live.totalDocs > 0;
}

const REPLACE_REFUSED =
  "File ini dipakai versi publikasi yang sedang tayang, jadi isinya tidak dapat diganti. " +
  "Unggah file baru, pasang di draf publikasi, lalu terbitkan; sesudah itu file lama dapat dilepas dan dihapus.";

const DELETE_REFUSED =
  "File ini dipakai versi publikasi yang sedang tayang dan tidak dapat dihapus. " +
  "Lepaskan file dari publikasi dan terbitkan perubahannya lebih dulu.";

/**
 * Decision 8 (DECISIONS §2.14, EDITORIAL-WORKFLOW): the content of a file on
 * a live publication cannot be replaced. A new upload (`req.file`) or a new
 * `filename` on an update counts as a replacement; edits of label, kind,
 * language and Access Level are allowed and apply at once (no versions).
 * The plugin's own metadata update after an upload has no `req.file` and
 * the same filename, so it passes.
 */
export const refuseLiveFileReplacement: CollectionBeforeChangeHook = async ({ data, operation, originalDoc, req }) => {
  if (operation !== "update" || !originalDoc) return data;
  const renamed = typeof data.filename === "string" && data.filename !== originalDoc.filename;
  if (!req.file && !renamed) return data;
  if (await isOnLivePublication(req, originalDoc.id)) throw new APIError(REPLACE_REFUSED, 400, null, true);
  return data;
};

/** Decision 8: a file on a live publication cannot be deleted, for every caller. */
export const refuseLiveFileDelete: CollectionBeforeDeleteHook = async ({ id, req }) => {
  if (await isOnLivePublication(req, id)) throw new APIError(DELETE_REFUSED, 400, null, true);
};
