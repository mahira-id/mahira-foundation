import type { CollectionBeforeChangeHook } from "payload";

/**
 * System lifecycle fields of a Publication, set on every save:
 * - `everPublished` turns true the first time the record is saved as
 *   published and never turns false again (DEC-016: only Admin may delete a
 *   language version that was ever published).
 * - `publishedAt` is filled with the current time (UTC) when the record is
 *   saved as published and has no date yet; editors may change it later
 *   (Owner 2026-11-10, P3 B (i)).
 *
 * Client values for `everPublished` never reach this hook: its field access
 * denies create/update, and field access runs in beforeValidate.
 */
export const setPublicationLifecycleFields: CollectionBeforeChangeHook = ({ data, originalDoc }) => {
  const status = data._status ?? originalDoc?._status;
  const published = status === "published";
  const next: Record<string, unknown> = { ...data, everPublished: originalDoc?.everPublished === true || published };
  if (published && !(data.publishedAt ?? originalDoc?.publishedAt)) {
    next.publishedAt = new Date().toISOString();
  }
  return next;
};
