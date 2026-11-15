import type { Locale } from "@/lib/i18n/locales";

/**
 * Site constants of the SEO layer (M3-07, DEC-021, DECISIONS §2.13). Only a
 * type import, so layouts, metadata routes and unit tests can use it.
 */

/** Canonical origin of every public URL, also on Vercel Preview (Owner M3-07 decision 1). */
export const SITE_URL = "https://mahira.id";

export const SITE_NAME = "Mahira Indonesia Development";

export const HOME_TITLE = "Mahira Indonesia Development — Riset, Kebijakan, dan Pembelajaran";

export const HOME_DESCRIPTION =
  "Platform publikasi dan pembelajaran Mahira Indonesia Development. Temukan riset, analisis kebijakan, dan materi pembelajaran untuk pembangunan Indonesia yang lebih adil.";

/** `og:locale` per route locale; English dates follow en-GB (DECISIONS §2.11 P15 A). */
export const OG_LOCALE: Record<Locale, string> = { id: "id_ID", en: "en_GB" };

/** Size of every generated Open Graph image (lib/seo/og-image.tsx). */
export const OG_IMAGE_SIZE = { width: 1200, height: 630 } as const;

/**
 * True only on the Vercel Production deployment. robots.txt allows crawling
 * there and nowhere else (Owner M3-07 decision 4); Preview also gets
 * Vercel's own `X-Robots-Tag: noindex` header and Vercel Authentication.
 */
export function isProductionDeployment(): boolean {
  return process.env.VERCEL_ENV === "production";
}
