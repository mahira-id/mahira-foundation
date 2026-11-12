import type { Payload } from "payload";

import { HOME_PUBLICATION_LIMIT } from "@/lib/home/homepage-view";

/**
 * Server-only. Local API queries of the homepage `/` (M3-04, DECISIONS §2.7).
 * Anonymous reads, like lib/cms/public-content.ts: no `user`,
 * `overrideAccess: false`, `draft: false`, `fallbackLocale: false`, so
 * Payload access limits publications to published + public (DEC-002).
 * `payload` is only the `find` method, so unit tests pass a fake.
 */
type FindPort = Pick<Payload, "find">;

const PUBLICATION_SELECT = {
  title: true,
  slug: true,
  summary: true,
  publishedAt: true,
  accessLevel: true,
  publicationType: true,
  topics: true,
  authors: true,
  createdAt: true,
} as const;

const PUBLICATION_POPULATE = {
  "publication-types": { name: true },
  topics: { name: true },
  authors: { displayName: true },
} as const;

/**
 * Newest Indonesian publications: dated ones by publishedAt first, then the
 * undated ones by createdAt (P4b (i)). Two queries, because the adapter sorts
 * `-publishedAt` as `published_at DESC` without NULLS LAST and Postgres puts
 * NULL first. Run one after the other: one pool connection per request.
 */
export async function findHomepagePublications(payload: FindPort, limit: number = HOME_PUBLICATION_LIMIT) {
  const dated = await payload.find({
    collection: "publications",
    where: { and: [{ locale: { equals: "id" } }, { publishedAt: { exists: true } }] },
    sort: "-publishedAt",
    limit,
    locale: "id",
    fallbackLocale: false,
    draft: false,
    overrideAccess: false,
    depth: 1,
    select: PUBLICATION_SELECT,
    populate: PUBLICATION_POPULATE,
  });
  if (dated.docs.length >= limit) return dated.docs;

  const undated = await payload.find({
    collection: "publications",
    where: { and: [{ locale: { equals: "id" } }, { publishedAt: { exists: false } }] },
    sort: "-createdAt",
    limit: limit - dated.docs.length,
    locale: "id",
    fallbackLocale: false,
    draft: false,
    overrideAccess: false,
    depth: 1,
    select: PUBLICATION_SELECT,
    populate: PUBLICATION_POPULATE,
  });
  return [...dated.docs, ...undated.docs];
}

/** Active topics (P10 A); the Indonesian-name filter and the sort are in toHomeTopics. */
export async function findActiveTopics(payload: FindPort) {
  const result = await payload.find({
    collection: "topics",
    where: { isActive: { equals: true } },
    locale: "id",
    fallbackLocale: false,
    overrideAccess: false,
    depth: 0,
    limit: 100,
    select: { name: true, slug: true, description: true, isActive: true },
  });
  return result.docs;
}
