import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";

import { GuidePage } from "@/components/learning-hub/guide-page";
import { PreviewBanner } from "@/components/publication/preview-banner";
import { AboutNavLink } from "@/components/site/header-about-link";
import { LocaleHeader } from "@/components/site/locale-header";
import { getLearningResource, LearningHubReadError, type LearningResourceResult } from "@/lib/cms/public-content";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { isLocale, type Locale } from "@/lib/i18n/locales";
import { resourcePath } from "@/lib/learning-hub/catalog-view";
import { switcherFor } from "@/lib/publications/detail-view";
import { guideMetadata, NOINDEX_FOLLOW } from "@/lib/seo/metadata";
import { isCmsEnabled } from "@/payload/env";
import { SLUG_PATTERN } from "@/payload/fields/slug";

/**
 * Learning Hub detail page (M3-12, DECISIONS §2.16 decisions 6A, 7A, 12A,
 * 13A): only a guide visible in this locale has a page at
 * `/{locale}/learning-hub/{slug}`; videos and playlists play in the catalog
 * and toolkits are never public before M3-13. Everything else: notFound().
 * No slug history in this run (a published guide's slug must not change,
 * EDITORIAL-WORKFLOW). With the CMS off proxy.ts answers 404 first.
 *
 * Same HTTP contract as the publication detail (200 + noindex for
 * not-found and for a failed read; a real 404 for the `htmlLimitedBots`
 * crawlers). Staff draft preview (decision 12A): in Draft Mode with a
 * verified Editor/Admin session the read gives the latest version (mode
 * "preview"): banner, data-preview="true", robots noindex/nofollow; Draft
 * Mode responses are no-store (Next).
 */
export const instant = false;

type Props = { params: Promise<{ locale: string; slug: string }> };

/** The cached read, with a failed read as "error" (any other error is rethrown, e.g. Next's own). */
async function readGuide(locale: Locale, slug: string): Promise<LearningResourceResult | null | "error"> {
  try {
    return await getLearningResource(locale, slug);
  } catch (error) {
    if (error instanceof LearningHubReadError) return "error";
    throw error;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isLocale(locale) || !SLUG_PATTERN.test(slug) || !isCmsEnabled()) return {};
  await connection();
  const result = await readGuide(locale, slug);
  if (result === "error") return { robots: NOINDEX_FOLLOW };
  if (!result) return {};
  // Staff draft preview: never indexed, links not followed; no canonical, hreflang or Open Graph.
  if (result.mode === "preview") {
    return { title: result.guide.title, description: result.guide.description || undefined, robots: { index: false, follow: false } };
  }
  return guideMetadata(result.guide, result.alternates);
}

export default async function LearningResourcePage({ params }: Props) {
  const { locale, slug } = await params;
  if (!isLocale(locale) || !SLUG_PATTERN.test(slug) || !isCmsEnabled()) notFound();
  // Request-time data: keeps the CMS query out of the build prerender.
  await connection();
  const result = await readGuide(locale, slug);

  if (result === "error") {
    const dictionary = getDictionary(locale);
    return (
      <>
        <LocaleHeader aboutLink={<AboutNavLink locale={locale} />} locale={locale} />
        <main className="container-editorial py-16" data-lh-error id="main">
          <h1 className="text-3xl font-bold tracking-tight text-ink">{dictionary.learningHub.errorTitle}</h1>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted">{dictionary.detail.errorBody}</p>
          <div className="mt-8">
            {/* A plain link: a full page load is the reload, with or without JavaScript. */}
            <a className="btn btn-primary" href={resourcePath(locale, slug) ?? "/"}>
              {dictionary.detail.reload}
            </a>
          </div>
        </main>
      </>
    );
  }
  if (!result) notFound();
  const preview = result.mode === "preview";
  const { guide } = result;

  return (
    <>
      <LocaleHeader aboutLink={<AboutNavLink locale={locale} />} locale={locale} switcher={switcherFor(locale, result.alternates)} />
      <GuidePage
        banner={preview ? <PreviewBanner locale={locale} resource={guide.id} slug={guide.slug} /> : null}
        guide={guide}
        preview={preview}
      />
    </>
  );
}
