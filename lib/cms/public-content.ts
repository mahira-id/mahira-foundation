import config from "@payload-config";
import { getPayload } from "payload";
import type { Locale } from "@/lib/i18n/locales";
import { isCmsEnabled } from "@/payload/env";

/**
 * Server-only. Public read layer for locale-prefixed pages (DEC-005, DEC-021).
 *
 * Every read here runs as an anonymous visitor through the Local API, so
 * Payload access control limits publications to published + public
 * (M3-02, P1 A). Rules for public code:
 * - never pass `overrideAccess: true`, `draft: true` or a `user`;
 * - always pass `fallbackLocale: false` (no text of another language);
 * - filter linked-entry records by their own `locale` field.
 *
 * Returns null when the CMS is off (see payload/env.ts).
 */
export async function listPublishedPublications(locale: Locale) {
  if (!isCmsEnabled()) return null;

  const payload = await getPayload({ config });
  const result = await payload.find({
    collection: "publications",
    where: { locale: { equals: locale } },
    locale,
    fallbackLocale: false,
    draft: false,
    overrideAccess: false,
    depth: 0,
    select: { title: true, slug: true },
    sort: "-publishedAt",
    limit: 100,
  });
  return result.docs;
}
