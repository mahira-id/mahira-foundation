import { APIError } from "payload";
import type { CollectionBeforeChangeHook, CollectionBeforeDeleteHook, CollectionSlug, PayloadRequest } from "payload";

/**
 * Hooks of the upload collections `publication-files` (M3-08, DECISIONS
 * §2.14 items 1, 4 and 8) and, since M3-13, `toolkit-files` (DECISIONS
 * §2.16 decision 9, §2.17 decision 4A): same bucket, same status rule, same
 * size limit, and the same live-file rule against the collection that lists
 * the files (`publications` or `learning-resources`).
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
 * True when the live version of a record of `collection` lists the file: a
 * main row whose `files` holds the id and whose `_status` is published
 * (what visitors get, whatever its Access Level or visibility). A file
 * listed only in a draft (a never-published record, or a pending revision)
 * is not live. `files` and `_status` are not localized on either
 * collection, so one count covers both locales. Runs in the caller's
 * transaction (`req`), without access control.
 */
export async function isOnLiveRecord(req: PayloadRequest, collection: CollectionSlug, id: number | string): Promise<boolean> {
  const live = await req.payload.count({
    collection,
    where: { and: [{ files: { equals: id } }, { _status: { equals: "published" } }] },
    overrideAccess: true,
    req,
  });
  return live.totalDocs > 0;
}

type LiveFileRule = {
  /** The collection whose records list the files in `files`. */
  collection: CollectionSlug;
  replaceRefused: string;
  deleteRefused: string;
};

/**
 * Decision 8 (DECISIONS §2.14, EDITORIAL-WORKFLOW; for toolkits §2.17
 * decision 4A): the content of a file on a live record cannot be replaced
 * and the file cannot be deleted. A new upload (`req.file`) or a new
 * `filename` on an update counts as a replacement; metadata edits (label,
 * kind, language, Access Level) are allowed and apply at once (no
 * versions). The plugin's own metadata update after an upload has no
 * `req.file` and the same filename, so it passes. The delete guard runs for
 * every caller.
 */
export function liveFileGuards(rule: LiveFileRule): {
  refuseReplacement: CollectionBeforeChangeHook;
  refuseDelete: CollectionBeforeDeleteHook;
} {
  const refuseReplacement: CollectionBeforeChangeHook = async ({ data, operation, originalDoc, req }) => {
    if (operation !== "update" || !originalDoc) return data;
    const renamed = typeof data.filename === "string" && data.filename !== originalDoc.filename;
    if (!req.file && !renamed) return data;
    if (await isOnLiveRecord(req, rule.collection, originalDoc.id)) throw new APIError(rule.replaceRefused, 400, null, true);
    return data;
  };
  const refuseDelete: CollectionBeforeDeleteHook = async ({ id, req }) => {
    if (await isOnLiveRecord(req, rule.collection, id)) throw new APIError(rule.deleteRefused, 400, null, true);
  };
  return { refuseReplacement, refuseDelete };
}

const publicationGuards = liveFileGuards({
  collection: "publications",
  replaceRefused:
    "File ini dipakai versi publikasi yang sedang tayang, jadi isinya tidak dapat diganti. " +
    "Unggah file baru, pasang di draf publikasi, lalu terbitkan; sesudah itu file lama dapat dilepas dan dihapus.",
  deleteRefused:
    "File ini dipakai versi publikasi yang sedang tayang dan tidak dapat dihapus. " +
    "Lepaskan file dari publikasi dan terbitkan perubahannya lebih dulu.",
});

/** Decision 8: the content of a file on a live publication cannot be replaced. */
export const refuseLiveFileReplacement = publicationGuards.refuseReplacement;

/** Decision 8: a file on a live publication cannot be deleted, for every caller. */
export const refuseLiveFileDelete = publicationGuards.refuseDelete;

const toolkitGuards = liveFileGuards({
  collection: "learning-resources",
  replaceRefused:
    "File ini dipakai versi toolkit yang sedang tayang, jadi isinya tidak dapat diganti. " +
    "Unggah file baru, pasang di draf toolkit, lalu terbitkan; sesudah itu file lama dapat dilepas dan dihapus.",
  deleteRefused:
    "File ini dipakai versi toolkit yang sedang tayang dan tidak dapat dihapus. " +
    "Lepaskan file dari toolkit dan terbitkan perubahannya lebih dulu.",
});

/** M3-13 decision 4A: the content of a file on a live (published) toolkit cannot be replaced. */
export const refuseLiveToolkitFileReplacement = toolkitGuards.refuseReplacement;

/** M3-13 decision 4A: a file on a live (published) toolkit cannot be deleted, for every caller. */
export const refuseLiveToolkitFileDelete = toolkitGuards.refuseDelete;
