import type { Metadata } from "next";

import { isAuthEnabled } from "@/lib/auth/env";
import type { AuthPage } from "@/lib/auth/routes";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { isLocale } from "@/lib/i18n/locales";

/**
 * Metadata of an account page: its title, never indexed and no links
 * followed (also sent as X-Robots-Tag by proxy.ts). No canonical,
 * hreflang or Open Graph: these pages are outside the sitemap.
 */
export async function accountMetadata(params: Promise<{ locale: string }>, page: AuthPage): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale) || !isAuthEnabled()) return {};
  return { title: getDictionary(locale).account.titles[page], robots: { index: false, follow: false } };
}
