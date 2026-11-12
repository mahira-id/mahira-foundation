import type { Where } from "payload";

/**
 * What an anonymous Local API read of `publications` may see (DEC-002):
 * published records with Access Level public. Public pages read through this
 * filter (payload/collections/Publications.ts, access.read).
 *
 * The same rule defines the staff-only column "Tayang di situs"
 * (`liveOnSite`, DECISIONS §2.6 P4): "Ya" when the record (the live version)
 * matches this filter, so the column shows exactly what visitors see.
 */
export const PUBLIC_PUBLICATION_READ: Where = {
  and: [{ _status: { equals: "published" } }, { accessLevel: { equals: "public" } }],
};
