import type { FieldHook } from "payload";
import { PUBLIC_PUBLICATION_READ } from "../access/public-read";
import { staffRoleOf } from "../access/roles";

/**
 * afterRead hook of the virtual field `liveOnSite` ("Tayang di situs",
 * DECISIONS §2.6 P4): "yes" when the record in the main table (the version
 * visitors get) matches the public read filter, "no" otherwise. A draft read
 * (`draft: true`) returns the latest version, so `data._status` alone cannot
 * tell a live record with a pending revision from one that is not live.
 *
 * Field afterRead hooks run before field read access in Payload 3.93.0, so a
 * caller without staff access is skipped here without a query; the field's
 * read access then removes the key.
 *
 * `db.findOne` reads the main table without running afterRead again
 * (`findByID` would recurse into this hook).
 */
export const readLiveOnSite: FieldHook = async ({ data, overrideAccess, req }) => {
  if (!overrideAccess && staffRoleOf(req) === null) return undefined;
  const id = (data as { id?: number | string } | undefined)?.id;
  if (id === undefined || id === null) return "no";
  const record = await req.payload.db.findOne({
    collection: "publications",
    where: { and: [{ id: { equals: id } }, PUBLIC_PUBLICATION_READ] },
    select: { id: true },
    req,
  });
  return record ? "yes" : "no";
};
