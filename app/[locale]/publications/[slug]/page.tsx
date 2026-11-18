import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { connection } from "next/server";

import { PublicationDetail } from "@/components/publication/publication-detail";
import { PreviewBanner } from "@/components/publication/preview-banner";
import { PublicationErrorState } from "@/components/publication/publication-error-state";
import { AboutNavLink } from "@/components/site/header-about-link";
import { LearningHubNavLink } from "@/components/site/header-learning-hub-link";
import { LocaleHeader } from "@/components/site/locale-header";
import {
  getPublicationDetail,
  getPublicationRedirect,
  PublicationReadError,
  type PublicationDetailResult,
} from "@/lib/cms/public-content";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { isLocale, type Locale } from "@/lib/i18n/locales";
import { isPublicationSlug, switcherFor } from "@/lib/publications/detail-view";
import { detailMetadata } from "@/lib/seo/metadata";
import { isCmsEnabled } from "@/payload/env";

/**
 * Publication detail (M3-05, DECISIONS §2.11 P7 A, P8 A, P15 A, amended
 * 2026-11-13): only the published + public record of this locale has a page.
 *
 * HTTP status: Next.js 16.4.4 (cacheComponents + partialPrefetching) builds
 * an empty static shell per locale for this route (the [locale] layout has
 * generateStaticParams) and sends it with 200 before the page runs
 * (streaming.md "The HTTP contract"). So an unknown or ineligible slug gets
 * notFound() = 200 + robots noindex + app/[locale]/not-found.tsx, and a failed read
 * gets the error state rendered here on the server = 200 + noindex.
 * `instant = false`: no Suspense and no loading file, so nothing of the
 * page shows before the database answers.
 * Staff draft preview (P11 A): in Draft Mode with a verified Editor/Admin
 * session the read gives the latest version (mode "preview"): banner,
 * data-preview="true", robots noindex/nofollow; Draft Mode responses are
 * no-store (Next).
 * Old slug (M3-07, DECISIONS §2.11 P9 A): when no record has this URL, the
 * slug history may name the record's current URL (getPublicationRedirect,
 * public records of this locale only) and the page calls
 * permanentRedirect() there, without the query string. After the static
 * shell Next 16.4.4 sends that as HTTP 200 whose RSC payload carries the
 * 308 redirect, and the browser's router follows it (no refresh meta, so
 * nothing happens without JavaScript); user agents that get the blocking
 * render (Next's `htmlLimitedBots` list, e.g. Bingbot) get a real 308 with
 * `Location`. A failed history read is the error state.
 */
export const instant = false;

type Props = { params: Promise<{ locale: string; slug: string }> };

/** The cached read, with a failed read as "error" (any other error is rethrown, e.g. Next's own). */
async function readDetail(locale: Locale, slug: string): Promise<PublicationDetailResult | null | "error"> {
  try {
    return await getPublicationDetail(locale, slug);
  } catch (error) {
    if (error instanceof PublicationReadError) return "error";
    throw error;
  }
}

/** The cached redirect read of a URL without a record (null: not-found), with a failed read as "error". */
async function readRedirect(locale: Locale, slug: string): Promise<string | null | "error"> {
  try {
    return await getPublicationRedirect(locale, slug);
  } catch (error) {
    if (error instanceof PublicationReadError) return "error";
    throw error;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isLocale(locale) || !isPublicationSlug(slug) || !isCmsEnabled()) return {};
  await connection();
  const result = await readDetail(locale, slug);
  const target = result === null ? await readRedirect(locale, slug) : null;
  if (result === "error" || target === "error") return { robots: { index: false, follow: true } };
  // Not found or old slug: the page calls notFound() (adds noindex) or permanentRedirect().
  if (!result) return {};
  // Staff draft preview (P11 A): never indexed, links not followed; no canonical, hreflang or Open Graph.
  if (result.mode === "preview") {
    return { title: result.publication.title, description: result.publication.description, robots: { index: false, follow: false } };
  }
  // M3-07 (DEC-021): canonical, hreflang with a public counterpart only, Open Graph `article` + Twitter.
  return detailMetadata(result.publication, result.alternates);
}

export default async function PublicationDetailPage({ params }: Props) {
  const { locale, slug } = await params;
  if (!isLocale(locale) || !isPublicationSlug(slug) || !isCmsEnabled()) notFound();
  // Request-time data: keeps the CMS query out of the build prerender.
  await connection();
  const result = await readDetail(locale, slug);
  const target = result === null ? await readRedirect(locale, slug) : null;

  if (result === "error" || target === "error") {
    return (
      <>
        <LocaleHeader learningHubLink={<LearningHubNavLink locale={locale} />} aboutLink={<AboutNavLink locale={locale} />} locale={locale} />
        <PublicationErrorState
          action={
            // A plain link: a full page load is the reload, with or without JavaScript.
            <a className="btn btn-primary" href={`/${locale}/publications/${slug}`}>
              {getDictionary(locale).detail.reload}
            </a>
          }
          locale={locale}
        />
      </>
    );
  }
  if (!result) {
    if (target) permanentRedirect(target);
    notFound();
  }
  const preview = result.mode === "preview";

  return (
    <>
      <LocaleHeader learningHubLink={<LearningHubNavLink locale={locale} />} aboutLink={<AboutNavLink locale={locale} />} locale={locale} switcher={switcherFor(locale, result.alternates)} />
      <main id="main">
        {preview ? <PreviewBanner id={result.publication.id} locale={locale} slug={result.publication.slug} /> : null}
        <PublicationDetail locale={locale} preview={preview} publication={result.publication} />
      </main>
    </>
  );
}
