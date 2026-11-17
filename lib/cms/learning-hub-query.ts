import type { Payload } from "payload";

import { presentDoc, type FindGlobalPort } from "@/lib/cms/about-query";
import type { Locale } from "@/lib/i18n/locales";
import { PUBLIC_LEARNING_RESOURCE_TYPES } from "@/payload/access/public-read";

/**
 * Server-only. Local API reads of the Learning Hub pages (M3-11/12,
 * DECISIONS §2.16). Anonymous, like lib/cms/public-content.ts: no `user`,
 * `overrideAccess: false`, `draft: false`, `fallbackLocale: false`, so
 * Payload access limits `learning-resources` to published records of a
 * public type (PUBLIC_LEARNING_RESOURCE_READ: never a toolkit before M3-13)
 * and the `learning-hub` global to its published version, in this locale's
 * text only. The queries repeat the public types in their own `where`.
 * `payload` is only the `find` / `findGlobal` method, so unit tests pass a
 * fake.
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
  sortOrder: true,
  publishedAt: true,
  createdAt: true,
  updatedAt: true,
  enReady: true,
  _status: true,
} as const;

/** The guide detail page also reads its sections. */
export const GUIDE_SELECT = { ...RESOURCE_SELECT, sections: true } as const;

export const RESOURCE_POPULATE = {
  topics: { name: true, description: true, isActive: true },
  media: { url: true, alt: true, mimeType: true, width: true, height: true },
} as const;

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

/** The published guide of this locale with this slug, with its sections; or null. */
export async function findPublicGuide(payload: FindPort, locale: Locale, slug: string) {
  const result = await payload.find({
    collection: "learning-resources",
    where: { and: [{ type: { equals: "guide" } }, { slug: { equals: slug } }] },
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
