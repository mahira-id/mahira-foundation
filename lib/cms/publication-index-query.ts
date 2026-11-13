import type { Payload } from "payload";

import { PUBLICATION_POPULATE, PUBLICATION_SELECT } from "@/lib/cms/homepage-query";
import type { Locale } from "@/lib/i18n/locales";

/**
 * Server-only. Local API queries of the publication index
 * `/{locale}/publications` (M3-05, DECISIONS §2.11 P1 A–P4 A). Anonymous
 * reads, like lib/cms/public-content.ts: no `user`, `overrideAccess: false`,
 * `draft: false`, `fallbackLocale: false`, so Payload access limits
 * publications to published + public (DEC-002). `payload` is only the `find`
 * method, so unit tests pass a fake. The caller runs them one after the
 * other: one pool connection per request.
 */
type FindPort = Pick<Payload, "find">;

/**
 * Every visible publication of the locale, ids and dates only, for ordering
 * (dated, then undated, P4 A), filtering and the filter options. One query
 * without pagination, because the adapter sorts `-publishedAt` with NULL first.
 */
export async function findIndexRefs(payload: FindPort, locale: Locale) {
  const result = await payload.find({
    collection: "publications",
    where: { locale: { equals: locale } },
    select: { publicationType: true, topics: true, publishedAt: true, createdAt: true },
    depth: 0,
    pagination: false,
    locale,
    fallbackLocale: false,
    draft: false,
    overrideAccess: false,
  });
  return result.docs;
}

/** Active terms among `ids`, with their name in this locale only (P5 A). No query for no ids. */
export async function findIndexTerms(
  payload: FindPort,
  collection: "publication-types" | "topics",
  locale: Locale,
  ids: number[],
) {
  if (ids.length === 0) return [];
  const result = await payload.find({
    collection,
    where: { and: [{ id: { in: ids } }, { isActive: { equals: true } }] },
    select: { name: true, slug: true, isActive: true },
    depth: 0,
    pagination: false,
    locale,
    fallbackLocale: false,
    overrideAccess: false,
  });
  return result.docs;
}

/** The rows of one page (the ids from planIndex); the caller restores the order. No query for no ids. */
export async function findIndexPage(payload: FindPort, locale: Locale, ids: number[]) {
  if (ids.length === 0) return [];
  const result = await payload.find({
    collection: "publications",
    where: { and: [{ locale: { equals: locale } }, { id: { in: ids } }] },
    limit: ids.length,
    depth: 1,
    select: PUBLICATION_SELECT,
    populate: PUBLICATION_POPULATE,
    locale,
    fallbackLocale: false,
    draft: false,
    overrideAccess: false,
  });
  return result.docs;
}
