import { connection } from "next/server";

import { getPublicPublicationTitle, PublicationReadError } from "@/lib/cms/public-content";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { isLocale } from "@/lib/i18n/locales";
import { isPublicationSlug } from "@/lib/publications/detail-view";
import { ogImageResponse, ogNotFound } from "@/lib/seo/og-image";
import { isCmsEnabled } from "@/payload/env";

/**
 * Generated Open Graph image of a publication detail page without a cover
 * (M3-07, DEC-021): the title of the published + public record of this
 * locale, read anonymously through the public read layer (no fallback
 * locale). Unknown, draft, `registered`/`subscriber` or other-locale slugs and
 * the CMS off give 404; a failed read gives 500. `no-store`, so no cache keeps
 * a title after the record is unpublished.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ locale: string; slug: string }> }) {
  await connection();
  const { locale, slug } = await params;
  if (!isLocale(locale) || !isPublicationSlug(slug) || !isCmsEnabled()) return ogNotFound();
  let title: string | null;
  try {
    title = await getPublicPublicationTitle(locale, slug);
  } catch (error) {
    if (!(error instanceof PublicationReadError)) throw error;
    return new Response("Image could not be generated", { status: 500, headers: { "Cache-Control": "no-store" } });
  }
  if (title === null) return ogNotFound();
  return ogImageResponse({ lang: locale, label: getDictionary(locale).publications.title, title }, { "Cache-Control": "no-store" });
}
