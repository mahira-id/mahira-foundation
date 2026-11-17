import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";

import { AboutContent } from "@/components/about/about-content";
import { PreviewBanner } from "@/components/publication/preview-banner";
import { LocaleHeader } from "@/components/site/locale-header";
import { AboutReadError, getAboutPage, type AboutPageResult } from "@/lib/cms/public-content";
import { aboutPath } from "@/lib/about/about-view";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { isLocale, type Locale } from "@/lib/i18n/locales";
import { switcherFor } from "@/lib/publications/detail-view";
import { aboutMetadata, NOINDEX_FOLLOW } from "@/lib/seo/metadata";
import { isCmsEnabled } from "@/payload/env";

/**
 * About page (M3-09, DECISIONS §2.15 decisions 1, 3, 4 + 4b(iii), 7B, 8):
 * `/{locale}/about` exists only when that locale's version of the `about`
 * global is published (and, for EN, "Versi EN siap tayang" is checked and
 * the required EN fields are filled); otherwise notFound(). With the CMS
 * off proxy.ts answers 404 before this page runs; the check here keeps the
 * page closed even without the proxy.
 *
 * Same HTTP contract as the publication detail (DECISIONS §2.11 P7 A as
 * amended 2026-11-13): Next 16.4.4 sends the static shell of the route with
 * 200, so notFound() is 200 + robots noindex + app/[locale]/not-found.tsx
 * (a real 404 for the `htmlLimitedBots` crawlers), and a failed read is the
 * error state rendered here = 200 + noindex. `instant = false`: no Suspense
 * and no loading file, so nothing of the page shows before the database
 * answers. Read at request time: a publish shows without a deploy (SRS
 * FR-020).
 * Staff draft preview (decision 7B): in Draft Mode with a verified
 * Editor/Admin session the read gives the latest version (mode "preview"):
 * banner, data-preview="true", robots noindex/nofollow; Draft Mode
 * responses are no-store (Next).
 */
export const instant = false;

type Props = { params: Promise<{ locale: string }> };

/** The cached read, with a failed read as "error" (any other error is rethrown, e.g. Next's own). */
async function readAbout(locale: Locale): Promise<AboutPageResult | null | "error"> {
  try {
    return await getAboutPage(locale);
  } catch (error) {
    if (error instanceof AboutReadError) return "error";
    throw error;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale) || !isCmsEnabled()) return {};
  await connection();
  const result = await readAbout(locale);
  if (result === "error") return { robots: NOINDEX_FOLLOW };
  // Not visible: the page calls notFound() (adds noindex).
  if (!result) return {};
  // Staff draft preview: never indexed, links not followed; no canonical, hreflang or Open Graph.
  if (result.mode === "preview") {
    const { about } = result;
    return {
      title: { absolute: about.seoTitle ?? about.title },
      description: about.seoDescription ?? undefined,
      robots: { index: false, follow: false },
    };
  }
  return aboutMetadata(result.about, result.alternates);
}

export default async function AboutRoutePage({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale) || !isCmsEnabled()) notFound();
  // Request-time data: keeps the CMS query out of the build prerender.
  await connection();
  const result = await readAbout(locale);

  if (result === "error") {
    const dictionary = getDictionary(locale);
    return (
      <>
        <LocaleHeader locale={locale} />
        <main className="container-editorial py-16" data-about-error id="main">
          <h1 className="text-3xl font-bold tracking-tight text-ink">{dictionary.about.errorTitle}</h1>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted">{dictionary.detail.errorBody}</p>
          <div className="mt-8">
            {/* A plain link: a full page load is the reload, with or without JavaScript. */}
            <a className="btn btn-primary" href={aboutPath(locale)}>
              {dictionary.detail.reload}
            </a>
          </div>
        </main>
      </>
    );
  }
  if (!result) notFound();
  const preview = result.mode === "preview";

  return (
    <>
      <LocaleHeader locale={locale} switcher={switcherFor(locale, result.alternates)} />
      <AboutContent about={result.about} banner={preview ? <PreviewBanner about locale={locale} /> : null} preview={preview} />
    </>
  );
}
