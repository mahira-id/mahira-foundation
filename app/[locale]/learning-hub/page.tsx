import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";

import { LearningHubCatalog } from "@/components/learning-hub/learning-hub-catalog";
import { AboutNavLink } from "@/components/site/header-about-link";
import { LearningHubNavLink } from "@/components/site/header-learning-hub-link";
import { LocaleHeader } from "@/components/site/locale-header";
import { getLearningHubCatalog, LearningHubReadError, type LearningHubCatalogResult } from "@/lib/cms/public-content";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { isLocale, type Locale } from "@/lib/i18n/locales";
import { learningHubPath } from "@/lib/learning-hub/catalog-view";
import { switcherFor } from "@/lib/publications/detail-view";
import { learningHubMetadata, NOINDEX_FOLLOW } from "@/lib/seo/metadata";
import { isCmsEnabled } from "@/payload/env";

/**
 * Learning Hub catalog (M3-12, DECISIONS §2.16 decisions 7A, 10A, 11A,
 * 13A): `/{locale}/learning-hub` exists only while at least one resource is
 * visible in that locale (published, public type, that locale's required
 * fields, an active Topic; EN also "Versi EN siap tayang"); otherwise
 * notFound(). With the CMS off proxy.ts answers 404 before this page runs;
 * the check here keeps the page closed even without the proxy.
 *
 * Same HTTP contract as the About page and the publication detail
 * (DECISIONS §2.11 P7 A as amended 2026-11-13): Next 16.4.4 sends the
 * static shell of the route with 200, so notFound() is 200 + robots noindex
 * + app/[locale]/not-found.tsx (a real 404 for the `htmlLimitedBots`
 * crawlers), and a failed read is the error state rendered here = 200 +
 * noindex. `instant = false`: no Suspense and no loading file. Read at
 * request time: a publish shows without a deploy. No staff preview
 * (decision 12A: videos and playlists are checked after publishing).
 */
export const instant = false;

type Props = { params: Promise<{ locale: string }> };

/** The cached read, with a failed read as "error" (any other error is rethrown, e.g. Next's own). */
async function readCatalog(locale: Locale): Promise<LearningHubCatalogResult | null | "error"> {
  try {
    return await getLearningHubCatalog(locale);
  } catch (error) {
    if (error instanceof LearningHubReadError) return "error";
    throw error;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale) || !isCmsEnabled()) return {};
  await connection();
  const result = await readCatalog(locale);
  if (result === "error") return { robots: NOINDEX_FOLLOW };
  // No visible resource: the page calls notFound() (adds noindex).
  if (!result) return {};
  return learningHubMetadata(result.plan, result.alternates);
}

export default async function LearningHubPage({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale) || !isCmsEnabled()) notFound();
  // Request-time data: keeps the CMS query out of the build prerender.
  await connection();
  const result = await readCatalog(locale);

  if (result === "error") {
    const dictionary = getDictionary(locale);
    return (
      <>
        <LocaleHeader learningHubLink={<LearningHubNavLink current locale={locale} />} aboutLink={<AboutNavLink locale={locale} />} locale={locale} />
        <main className="container-editorial py-16" data-lh-error id="main">
          <h1 className="text-3xl font-bold tracking-tight text-ink">{dictionary.learningHub.errorTitle}</h1>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted">{dictionary.detail.errorBody}</p>
          <div className="mt-8">
            {/* A plain link: a full page load is the reload, with or without JavaScript. */}
            <a className="btn btn-primary" href={learningHubPath(locale)}>
              {dictionary.detail.reload}
            </a>
          </div>
        </main>
      </>
    );
  }
  if (!result) notFound();

  return (
    <>
      <LocaleHeader learningHubLink={<LearningHubNavLink current locale={locale} />} aboutLink={<AboutNavLink locale={locale} />} locale={locale} switcher={switcherFor(locale, result.alternates)} />
      <LearningHubCatalog plan={result.plan} />
    </>
  );
}
