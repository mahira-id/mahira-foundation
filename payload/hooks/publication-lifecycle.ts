import type { CollectionBeforeChangeHook } from "payload";

/**
 * System lifecycle fields of a Publication, set on every save:
 * - `everPublished` turns true the first time the record is saved as
 *   published and never turns false again (DEC-016: only Admin may delete a
 *   language version that was ever published).
 * - `publishedAt` is filled with the current time (UTC) when the record is
 *   saved as published and has no date yet, including when the save itself
 *   clears the date (`publishedAt: null`); editors may change it later
 *   (Owner 2026-11-10, P3 B (i)).
 *
 * Client values for `everPublished` never reach this hook: its field access
 * denies create/update, and field access runs in beforeValidate.
 */
export const setPublicationLifecycleFields: CollectionBeforeChangeHook = ({ data, originalDoc }) => {
  const status = data._status ?? originalDoc?._status;
  const published = status === "published";
  const next: Record<string, unknown> = { ...data, everPublished: originalDoc?.everPublished === true || published };
  // A value sent in this save wins over the stored one, even when it is null;
  // only a field that is not sent (undefined) keeps the stored date.
  const publishedAt = data.publishedAt !== undefined ? data.publishedAt : originalDoc?.publishedAt;
  if (published && !publishedAt) {
    next.publishedAt = new Date().toISOString();
  }
  return next;
};
