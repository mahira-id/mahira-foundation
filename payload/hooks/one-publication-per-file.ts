import { ValidationError } from "payload";
import type { CollectionBeforeChangeHook, Where } from "payload";

type RelationValue = number | string | { id?: number | string } | null | undefined;

function idOf(value: RelationValue): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "object") return value.id === undefined ? null : String(value.id);
  return String(value);
}

/**
 * beforeChange of Publication (M3-08, DECISIONS §2.14 item 1): a file
 * belongs to exactly one publication record (one language). A save that
 * lists a file already listed by another record, in its main row (the live
 * version or a never-published draft) or in its latest version (a pending
 * revision), is refused, and so is a list with the same file twice. Runs
 * only when the save sends `files`. Older versions are not checked; a
 * version restore is a save and runs this hook. Two saves that attach the
 * same file to two records at the same moment are not serialized
 * (staff-only path, accepted risk).
 */
export const refuseFileOfAnotherPublication: CollectionBeforeChangeHook = async ({ data, originalDoc, req }) => {
  if (!("files" in data) || !Array.isArray(data.files)) return data;
  const ids = (data.files as RelationValue[]).map(idOf).filter((id): id is string => id !== null);
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
    const inRecords = await req.payload.count({ collection: "publications", where: { and: records }, overrideAccess: true, req });
    const inVersions = await req.payload.countVersions({
      collection: "publications",
      where: { and: versions },
      overrideAccess: true,
      req,
    });
    if (inRecords.totalDocs > 0 || inVersions.totalDocs > 0) {
      errors.push({
        path: "files",
        message: "Satu file hanya untuk satu publikasi; file ini sudah dipasang di publikasi lain. Unggah file terpisah.",
      });
    }
  }
  if (errors.length > 0) throw new ValidationError({ collection: "publications", errors, req });
  return data;
};
