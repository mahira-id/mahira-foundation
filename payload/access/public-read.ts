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

/**
 * What an anonymous Local API read of `publication-files` may see (M3-08,
 * DECISIONS §2.14): ready files with Access Level public. Files with
 * `registered`/`subscriber` stay hidden on the public site until M5 (§2.14
 * item 3). Whether the file may be downloaded also needs its publication's
 * live version to match PUBLIC_PUBLICATION_READ and the stricter of both
 * levels to be public (lib/publications/file-access.ts).
 */
export const PUBLIC_FILE_READ: Where = {
  and: [{ status: { equals: "ready" } }, { accessLevel: { equals: "public" } }],
};
