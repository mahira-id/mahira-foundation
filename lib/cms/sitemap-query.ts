import type { Payload } from "payload";

import { isLocale, type Locale } from "@/lib/i18n/locales";
import { isPublicationSlug } from "@/lib/publications/detail-view";

/**
 * Server-only. Local API query of the sitemap (M3-07, DEC-021). Anonymous
 * read, like lib/cms/public-content.ts: no `user`, `overrideAccess: false`,
 * `draft: false`, `fallbackLocale: false`, so Payload access limits the
 * records to published + public (DEC-002). `payload` is only the `find`
 * method, so unit tests pass a fake.
 */
type FindPort = Pick<Payload, "find">;

export type SitemapPublication = { locale: Locale; slug: string; updatedAt: string };

/**
 * Every published + public record (both locales) with a detail URL: locale,
 * slug and `updatedAt` of the live version (a draft save does not change
 * it). One query without pagination, in id order. Records whose locale or
 * slug the detail route does not serve are left out.
 */
export async function findSitemapPublications(payload: FindPort): Promise<SitemapPublication[]> {
  const result = await payload.find({
    collection: "publications",
    select: { slug: true, locale: true, updatedAt: true },
    sort: "id",
    depth: 0,
    pagination: false,
    fallbackLocale: false,
    draft: false,
    overrideAccess: false,
  });
  return result.docs.flatMap((doc) =>
    typeof doc.locale === "string" && isLocale(doc.locale) && typeof doc.slug === "string" && isPublicationSlug(doc.slug)
      ? [{ locale: doc.locale, slug: doc.slug, updatedAt: doc.updatedAt }]
      : [],
  );
}
