import { APIError } from "payload";
import type { CollectionBeforeDeleteHook } from "payload";
import { lockTranslationGroup } from "../db/lock-translation-group";

/**
 * A Translation Group can be deleted only when no publication uses it, for
 * every caller (Admin, Local API with `overrideAccess`).
 *
 * The foreign keys from `publications` and `_publications_v` are
 * `ON DELETE SET NULL`: deleting a group in use would unlink every language
 * version, ever-published ones included (DEC-016 reserves that to Admin, per
 * version), and leave a null required `translationGroup`. A group is in use
 * when a publication record or the latest version (a pending draft) points
 * to it.
 *
 * The group row is locked first, the same lock `enforceSharedFields` takes:
 * a concurrent save that adds a language version either commits first and is
 * counted here, or runs after the delete and fails on the foreign key.
 */
export const refuseDeletingUsedTranslationGroup: CollectionBeforeDeleteHook = async ({ id, req }) => {
  await lockTranslationGroup(req, id);

  const records = await req.payload.count({
    collection: "publications",
    where: { translationGroup: { equals: id } },
    overrideAccess: true,
    req,
  });
  const latestVersions = await req.payload.countVersions({
    collection: "publications",
    where: { and: [{ latest: { equals: true } }, { "version.translationGroup": { equals: id } }] },
    overrideAccess: true,
    req,
  });

  if (records.totalDocs > 0 || latestVersions.totalDocs > 0) {
    throw new APIError(
      "Translation Group masih dipakai publikasi; hapus atau pindahkan versi bahasanya lebih dulu.",
      400,
      null,
      true,
    );
  }
};
