import type { Payload } from "payload";

import { presentDoc, type FindGlobalPort } from "@/lib/cms/about-query";
import type { Locale } from "@/lib/i18n/locales";
import { PUBLIC_LEARNING_RESOURCE_TYPES } from "@/payload/access/public-read";

/**
 * Server-only. Local API reads of the Learning Hub pages (M3-11/12,
 * DECISIONS §2.16). Anonymous, like lib/cms/public-content.ts: no `user`,
 * `overrideAccess: false`, `draft: false`, `fallbackLocale: false`, so
 * Payload access limits `learning-resources` to published records of a
 * public type (PUBLIC_LEARNING_RESOURCE_READ; toolkits since M3-13), their
 * `toolkit-files` to ready files (PUBLIC_TOOLKIT_FILE_READ) and the
 * `learning-hub` global to its published version, in this locale's text
 * only. The queries repeat the public types in their own `where`. `payload`
 * is only the `find` / `findGlobal` method, so unit tests pass a fake.
 */
type FindPort = Pick<Payload, "find">;

/** Card and visibility fields; no staff-only field beyond the visibility inputs (`enReady`, `_status`). */
export const RESOURCE_SELECT = {
  type: true,
  title: true,
  summary: true,
  slug: true,
  materialLanguage: true,
  topic: true,
  youtubeId: true,
  coverImage: true,
  // M3-13: a toolkit's files (visibility needs a ready one; the card shows the count).
  files: true,
  sortOrder: true,
  publishedAt: true,
  createdAt: true,
  updatedAt: true,
  enReady: true,
  _status: true,
} as const;

/** The guide and toolkit detail pages also read their sections. */
export const GUIDE_SELECT = { ...RESOURCE_SELECT, sections: true } as const;

/**
 * Populated fields of the relations. `toolkit-files`: the panel fields only,
 * never `filename`, `prefix`, `_objectKey` or `url` (storage stays on the
 * server; M3-13).
 */
export const RESOURCE_POPULATE = {
  topics: { name: true, description: true, isActive: true },
  media: { url: true, alt: true, mimeType: true, width: true, height: true },
  "toolkit-files": { label: true, language: true, filesize: true, mimeType: true, status: true },
} as const;

/** Types with a detail page `/{locale}/learning-hub/{slug}`: guides and, since M3-13, toolkits. */
export const DETAIL_TYPES = ["guide", "toolkit"] as const;

const PUBLIC_TYPES = { type: { in: [...PUBLIC_LEARNING_RESOURCE_TYPES] } };

/** Every published resource of a public type, in this locale (both catalog and homepage filter them further). */
export async function findPublicResources(payload: FindPort, locale: Locale) {
  const result = await payload.find({
    collection: "learning-resources",
    where: PUBLIC_TYPES,
    select: RESOURCE_SELECT,
    populate: RESOURCE_POPULATE,
    sort: "id",
    depth: 1,
    pagination: false,
    locale,
    fallbackLocale: false,
    draft: false,
    overrideAccess: false,
  });
  return result.docs;
}

/** The published guide or toolkit of this locale with this slug, with its sections (and files); or null. */
export async function findPublicDetail(payload: FindPort, locale: Locale, slug: string) {
  const result = await payload.find({
    collection: "learning-resources",
    where: { and: [{ type: { in: [...DETAIL_TYPES] } }, { slug: { equals: slug } }] },
    select: GUIDE_SELECT,
    populate: RESOURCE_POPULATE,
    limit: 1,
    depth: 1,
    locale,
    fallbackLocale: false,
    draft: false,
    overrideAccess: false,
  });
  return result.docs[0] ?? null;
}

/**
 * The published resource with this id in this locale (a public type only),
 * with the card fields; or null. The language switcher of a guide and the
 * exit of its staff preview use it.
 */
export async function findPublicResource(payload: FindPort, id: number, locale: Locale) {
  const result = await payload.find({
    collection: "learning-resources",
    where: { and: [{ id: { equals: id } }, PUBLIC_TYPES] },
    select: RESOURCE_SELECT,
    populate: RESOURCE_POPULATE,
    limit: 1,
    depth: 1,
    locale,
    fallbackLocale: false,
    draft: false,
    overrideAccess: false,
  });
  return result.docs[0] ?? null;
}

/**
 * The toolkit whose live version lists this file, read as a visitor in this
 * locale (published toolkit, its files populated as ready files only), with
 * the card fields; or null (M3-13 download route). `draft: false` reads the
 * main table, so a file listed only in a draft finds nothing and an
 * unpublish applies at once. A file belongs to one toolkit only
 * (refuseFileOfAnotherToolkit).
 */
export async function findLiveToolkitOfFile(payload: FindPort, fileId: number, locale: Locale) {
  const result = await payload.find({
    collection: "learning-resources",
    where: { and: [{ type: { equals: "toolkit" } }, { files: { equals: fileId } }] },
    select: RESOURCE_SELECT,
    populate: RESOURCE_POPULATE,
    limit: 1,
    pagination: false,
    depth: 1,
    locale,
    fallbackLocale: false,
    draft: false,
    overrideAccess: false,
  });
  return result.docs[0] ?? null;
}

/** The published `learning-hub` global in this locale, or null (never published, or unpublished). */
export async function findPublicLearningHub(payload: FindGlobalPort, locale: Locale) {
  const doc = await payload.findGlobal({
    slug: "learning-hub",
    locale,
    fallbackLocale: false,
    draft: false,
    overrideAccess: false,
    depth: 0,
  });
  return presentDoc(doc);
}
