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

/**
 * What an anonymous Local API read of the `about` global may see (M3-09,
 * DECISIONS §2.15 decision 1): the published version only. Payload 3.93.0
 * applies this filter to the global's main row, which a draft save never
 * changes, so a pending draft stays invisible. Whether a locale has a page
 * also needs its required fields, and for EN the "Versi EN siap tayang"
 * checkbox (lib/about/about-view.ts `isAboutVisible`).
 */
export const PUBLIC_ABOUT_READ: Where = { _status: { equals: "published" } };

/**
 * Resource types visitors may see (M3-11/12, DECISIONS §2.16 decisions 2A,
 * 9A): videos, playlists and guides, and since M3-13 (DECISIONS §2.17)
 * toolkits, now that their PDF download exists.
 */
export const PUBLIC_LEARNING_RESOURCE_TYPES = ["video", "playlist", "guide", "toolkit"] as const;

/**
 * What an anonymous Local API read of `learning-resources` may see: the
 * published version of a record of a public type. All Learning Hub material
 * is public (DEC-014), so there is no access level. Whether a locale shows
 * the record also needs that locale's required fields, an active Topic,
 * for EN "Versi EN siap tayang", and for a toolkit at least one ready file
 * with a label in that locale (lib/learning-hub/catalog-view.ts
 * `isResourceVisible`, §2.17 decision 2A: fail closed).
 */
export const PUBLIC_LEARNING_RESOURCE_READ: Where = {
  and: [{ _status: { equals: "published" } }, { type: { in: [...PUBLIC_LEARNING_RESOURCE_TYPES] } }],
};

/**
 * What an anonymous Local API read of `toolkit-files` may see (M3-13,
 * DECISIONS §2.16 decision 9, §2.17): ready files. No access level: all
 * Learning Hub material is public (DEC-014). Whether a file may be
 * downloaded also needs the live version of its toolkit to be visible in
 * the requested locale (lib/cms/public-content.ts
 * `getPublicToolkitFileDownload`).
 */
export const PUBLIC_TOOLKIT_FILE_READ: Where = { status: { equals: "ready" } };

/**
 * What an anonymous Local API read of the `learning-hub` global (catalog H1,
 * intro, SEO fields) may see: the published version only, as for About.
 */
export const PUBLIC_LEARNING_HUB_READ: Where = { _status: { equals: "published" } };
