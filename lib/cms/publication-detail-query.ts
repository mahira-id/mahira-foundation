import type { Payload } from "payload";

import type { Locale } from "@/lib/i18n/locales";

/**
 * Server-only. Local API query of the publication detail
 * `/{locale}/publications/{slug}` (M3-05, DECISIONS §2.11 P7 A). Anonymous
 * read, like lib/cms/public-content.ts: no `user`, `overrideAccess: false`,
 * `draft: false`, `fallbackLocale: false`, so Payload access limits the
 * record to published + public (DEC-002). `payload` is only the `find`
 * method, so unit tests pass a fake.
 */
type FindPort = Pick<Payload, "find">;

/**
 * Detail fields; no staff field. `translationGroup` is read for the language
 * switcher only (lib/publications/alternates.ts) and stays an id: anonymous
 * reads cannot read Translation Groups. Media is populated in full (cover).
 */
export const DETAIL_SELECT = {
  title: true,
  slug: true,
  locale: true,
  summary: true,
  publishedAt: true,
  accessLevel: true,
  publicationType: true,
  topics: true,
  authors: true,
  coverImage: true,
  translationGroup: true,
} as const;

export const DETAIL_POPULATE = {
  "publication-types": { name: true },
  topics: { name: true },
  authors: { displayName: true },
} as const;

/** The published + public record of this locale with this slug, or null. */
export async function findPublicPublication(payload: FindPort, locale: Locale, slug: string) {
  const result = await payload.find({
    collection: "publications",
    where: { and: [{ locale: { equals: locale } }, { slug: { equals: slug } }] },
    limit: 1,
    depth: 1,
    select: DETAIL_SELECT,
    populate: DETAIL_POPULATE,
    locale,
    fallbackLocale: false,
    draft: false,
    overrideAccess: false,
  });
  return result.docs[0] ?? null;
}
