import { connection } from "next/server";

import { getDictionary } from "@/lib/i18n/dictionaries";
import { isLocale } from "@/lib/i18n/locales";
import { ogImageResponse, ogNotFound } from "@/lib/seo/og-image";
import { SITE_NAME } from "@/lib/seo/site";
import { isCmsEnabled } from "@/payload/env";

/**
 * Open Graph image of the publication index `/{locale}/publications` (M3-07,
 * DEC-021): the dictionary title of the locale. 404 when the CMS is off (the
 * index itself is 404 then) or the locale is unknown.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ locale: string }> }) {
  await connection();
  const { locale } = await params;
  if (!isLocale(locale) || !isCmsEnabled()) return ogNotFound();
  return ogImageResponse({ lang: locale, label: SITE_NAME, title: getDictionary(locale).publications.title });
}
