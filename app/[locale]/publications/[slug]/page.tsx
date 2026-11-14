import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";

import { PublicationDetail } from "@/components/publication/publication-detail";
import { PreviewBanner } from "@/components/publication/preview-banner";
import { PublicationErrorState } from "@/components/publication/publication-error-state";
import { LocaleHeader } from "@/components/site/locale-header";
import { getPublicationDetail, PublicationReadError, type PublicationDetailResult } from "@/lib/cms/public-content";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { isLocale, type Locale } from "@/lib/i18n/locales";
import { isPublicationSlug, switcherFor } from "@/lib/publications/detail-view";
import { isCmsEnabled } from "@/payload/env";

/**
 * Publication detail (M3-05, DECISIONS §2.11 P7 A, P8 A, P15 A, amended
 * 2026-11-13): only the published + public record of this locale has a page.
 *
 * HTTP status: Next.js 16.4.4 (cacheComponents + partialPrefetching) builds
 * an empty static shell per locale for this route (the [locale] layout has
 * generateStaticParams) and sends it with 200 before the page runs
 * (streaming.md "The HTTP contract"). So an unknown or ineligible slug gets
 * notFound() = 200 + robots noindex + the not-found page, and a failed read
 * gets the error state rendered here on the server = 200 + noindex.
 * `instant = false`: no Suspense and no loading file, so nothing of the
 * page shows before the database answers.
 * Staff draft preview (P11 A): in Draft Mode with a verified Editor/Admin
 * session the read gives the latest version (mode "preview"): banner,
 * data-preview="true", robots noindex/nofollow; Draft Mode responses are
 * no-store (Next).
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

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isLocale(locale) || !isPublicationSlug(slug) || !isCmsEnabled()) return {};
  await connection();
  const result = await readDetail(locale, slug);
  if (result === "error") return { robots: { index: false, follow: true } };
  // Not found: the page calls notFound(), which adds noindex.
  if (!result) return {};
  const metadata: Metadata = { title: result.publication.title, description: result.publication.description };
  // Staff draft preview (P11 A): never indexed, links not followed.
  if (result.mode === "preview") metadata.robots = { index: false, follow: false };
  return metadata;
}

export default async function PublicationDetailPage({ params }: Props) {
  const { locale, slug } = await params;
  if (!isLocale(locale) || !isPublicationSlug(slug) || !isCmsEnabled()) notFound();
  // Request-time data: keeps the CMS query out of the build prerender.
  await connection();
  const result = await readDetail(locale, slug);

  if (result === "error") {
    return (
      <>
        <LocaleHeader locale={locale} />
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
  if (!result) notFound();
  const preview = result.mode === "preview";

  return (
    <>
      <LocaleHeader locale={locale} switcher={switcherFor(locale, result.alternates)} />
      <main id="main">
        {preview ? <PreviewBanner locale={locale} slug={result.publication.slug} /> : null}
        <PublicationDetail locale={locale} preview={preview} publication={result.publication} />
      </main>
    </>
  );
}
