import { ValidationError } from "payload";
import type { CollectionBeforeChangeHook, CollectionBeforeOperationHook } from "payload";
import type { Publication } from "../payload-types";

export const PENDING_DRAFT_MESSAGE =
  "Publikasi ini sedang tayang dan punya draf yang belum diterbitkan. Pilih salah satu: terbitkan perubahan (_status: published) atau simpan sebagai draf (_status: draft).";

/** req.context key: true when the current update neither sends `_status` nor is a draft save. */
export const STATUS_NOT_SENT = "publicationStatusNotSent";

/**
 * beforeOperation half of the P5 guard. Collection beforeChange hooks cannot
 * tell whether the client sent `_status`: field beforeValidate fills every
 * missing field from the stored document first (Payload 3.93.0), so the
 * intent is recorded here, from the raw operation arguments, before that.
 *
 * Set on every update and every version restore (a restore always carries
 * the version's status), never on reads: hooks such as enforceSharedFields
 * run nested reads on the same req.
 */
export const markStatusNotSent: CollectionBeforeOperationHook = ({ args, context, operation }) => {
  if (operation !== "update" && operation !== "restoreVersion") return args;
  const { data, draft } = args as { data?: { _status?: unknown }; draft?: unknown };
  const statusSent = data?._status === "published" || data?._status === "draft";
  context[STATUS_NOT_SENT] = operation === "update" && draft !== true && !statusSent;
  return args;
};

/**
 * DECISIONS §2.6 P5 A. Refuses a non-draft save that does not send `_status`
 * on a publication that is live (record published) and has a pending draft.
 *
 * Payload 3.93.0 bases such a save on the latest version (`updateByID` →
 * `getLatestCollectionVersion`), which is the draft: the record would drop
 * off the public site and the draft content would replace it without anyone
 * pressing Publish or Unpublish. The editor has to choose instead.
 *
 * Not affected: draft saves, Publish and Unpublish (they send `_status`),
 * creates, version restores, and records without a pending draft.
 * `context.sharedFieldSync` is ignored on purpose, so `updateSharedFields()`
 * is refused (and rolled back) for a group with such a sibling.
 * `originalDoc` is the latest version; the record is read from the main
 * table.
 */
export const refuseImplicitStatusOverPendingDraft: CollectionBeforeChangeHook = async ({ context, data, operation, originalDoc, req }) => {
  if (operation !== "update") return data;
  if (context?.[STATUS_NOT_SENT] !== true) return data;
  if (originalDoc?._status !== "draft" || originalDoc.id === undefined) return data;
  const record = await req.payload.db.findOne<Pick<Publication, "id" | "_status">>({
    collection: "publications",
    where: { id: { equals: originalDoc.id } },
    select: { _status: true },
    req,
  });
  if (record?._status !== "published") return data;
  throw new ValidationError({
    collection: "publications",
    errors: [{ path: "_status", message: PENDING_DRAFT_MESSAGE }],
    req,
  });
};
