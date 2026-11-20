import { ValidationError } from "payload";
import type { CollectionBeforeChangeHook, CollectionSlug, Where } from "payload";

type RelationValue = number | string | { id?: number | string } | null | undefined;

/** The id of a relation value (an id or a populated document) as a string, or null. */
export function idOf(value: RelationValue): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "object") return value.id === undefined ? null : String(value.id);
  return String(value);
}

/** The ids of a `files` value (an array of ids or documents); [] for anything else. */
export function fileIdsOf(value: unknown): string[] {
  return Array.isArray(value) ? (value as RelationValue[]).map(idOf).filter((id): id is string => id !== null) : [];
}

/**
 * A beforeChange hook of `collection` (M3-08, DECISIONS §2.14 item 1; since
 * M3-13 also for toolkits, §2.17 decision 1A): a file belongs to exactly
 * one record. A save that lists a file already listed by another record, in
 * its main row (the live version or a never-published draft) or in its
 * latest version (a pending revision), is refused with `message`, and so is
 * a list with the same file twice. Runs only when the save sends `files`.
 * `files` is not localized on either collection, so the check covers both
 * locales of a field-localized record. Older versions are not checked; a
 * version restore is a save and runs this hook. Two saves that attach the
 * same file to two records at the same moment are not serialized
 * (staff-only path, accepted risk).
 */
export function refuseFileOfAnotherRecord(collection: CollectionSlug, message: string): CollectionBeforeChangeHook {
  return async ({ data, originalDoc, req }) => {
    if (!("files" in data) || !Array.isArray(data.files)) return data;
    const ids = fileIdsOf(data.files);
    if (ids.length === 0) return data;

    const errors: { path: string; message: string }[] = [];
    if (new Set(ids).size !== ids.length) {
      errors.push({ path: "files", message: "File yang sama dipasang lebih dari sekali." });
    } else {
      const self = originalDoc?.id;
      const records: Where[] = [{ files: { in: ids } }];
      const versions: Where[] = [{ latest: { equals: true } }, { "version.files": { in: ids } }];
      if (self !== undefined) {
        records.push({ id: { not_equals: self } });
        versions.push({ parent: { not_equals: self } });
      }
      const inRecords = await req.payload.count({ collection, where: { and: records }, overrideAccess: true, req });
      const inVersions = await req.payload.countVersions({ collection, where: { and: versions }, overrideAccess: true, req });
      if (inRecords.totalDocs > 0 || inVersions.totalDocs > 0) errors.push({ path: "files", message });
    }
    if (errors.length > 0) throw new ValidationError({ collection, errors, req });
    return data;
  };
}

/** beforeChange of Publication (M3-08): a file belongs to exactly one publication record (one language). */
export const refuseFileOfAnotherPublication = refuseFileOfAnotherRecord(
  "publications",
  "Satu file hanya untuk satu publikasi; file ini sudah dipasang di publikasi lain. Unggah file terpisah.",
);

/** beforeChange of `learning-resources` (M3-13 decision 1A): a toolkit file belongs to exactly one toolkit (both locales). */
export const refuseFileOfAnotherToolkit = refuseFileOfAnotherRecord(
  "learning-resources",
  "Satu file hanya untuk satu toolkit; file ini sudah dipasang di toolkit lain. Unggah file terpisah.",
);
