import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense, type ReactNode } from "react";
import { IndexFilters } from "@/components/publication/index-filters";
import { IndexPagination } from "@/components/publication/index-pagination";
import { PublicationList } from "@/components/publication/publication-list";
import { LocaleHeader } from "@/components/site/locale-header";
import { getPublicationIndex } from "@/lib/cms/public-content";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { isLocale, type Locale } from "@/lib/i18n/locales";
import { indexHref, readIndexQuery } from "@/lib/publications/index-params";
import { indexNoindex } from "@/lib/publications/index-view";
import { isCmsEnabled } from "@/payload/env";

/**
 * Publication index (M3-05, DECISIONS §2.11 P1 A–P5 A, P15 A): published +
 * public publications of this locale, 12 per page, filters type/topic/year
 * in the URL. The shell (header, H1, intro) is static; the list is read at
 * request time inside Suspense, so every state answers 200 and the invalid
 * ones get `noindex, follow` through generateMetadata.
 */

type SearchParams = Record<string, string | string[] | undefined>;
type Props = { params: Promise<{ locale: string }>; searchParams: Promise<SearchParams> };

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const title = getDictionary(locale).publications.title;
  if (!isCmsEnabled()) return { title };
  const query = readIndexQuery(await searchParams);
  const result = await getPublicationIndex(locale, query.type, query.topic, query.year, query.page);
  if (result.status === "off") return { title };
  const state = result.status === "ok" ? result.plan.state : "error";
  return indexNoindex(query, state) ? { title, robots: { index: false, follow: true } } : { title };
}

export default async function PublicationsPage({ params, searchParams }: Props) {
  const { locale } = await params;
  if (!isLocale(locale) || !isCmsEnabled()) notFound();
  const dictionary = getDictionary(locale);

  return (
    <>
      <LocaleHeader locale={locale} />
      <main id="main" className="container-editorial py-16">
        <h1 className="text-4xl font-bold tracking-tight">{dictionary.publications.title}</h1>
        <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted">{dictionary.publications.intro}</p>
        <Suspense fallback={<p className="mt-8">{dictionary.publications.loading}</p>}>
          <PublicationIndexResults locale={locale} searchParams={searchParams} />
        </Suspense>
      </main>
    </>
  );
}

function Notice({ children }: { children: ReactNode }) {
  return <div className="mt-8 max-w-2xl text-base leading-relaxed text-ink">{children}</div>;
}

async function PublicationIndexResults({ locale, searchParams }: { locale: Locale; searchParams: Promise<SearchParams> }) {
  // Request-time data: keeps the CMS query out of the build prerender.
  await connection();
  const query = readIndexQuery(await searchParams);
  const result = await getPublicationIndex(locale, query.type, query.topic, query.year, query.page);
  const dictionary = getDictionary(locale).publications;

  if (result.status !== "ok") {
    return (
      <div data-index-state="error">
        <Notice>
          <p role="status">{dictionary.error}</p>
        </Notice>
      </div>
    );
  }

  const { plan, items, facets } = result;
  const clearLink = (
    <Link className="mt-3 inline-block font-semibold text-brand-700 underline underline-offset-4" href={`/${locale}/publications`}>
      {dictionary.clear}
    </Link>
  );

  return (
    <div
      data-index-page={plan.page}
      data-index-pages={plan.pageCount}
      data-index-state={plan.state}
      data-index-total={plan.total}
      data-index-unknown={plan.unknown.length > 0 ? plan.unknown.join(",") : undefined}
    >
      <IndexFilters facets={facets} locale={locale} query={query} />
      {plan.state === "list" || plan.state === "no-results" ? (
        <p aria-live="polite" className="mt-6 text-sm font-semibold text-muted">
          {dictionary.count(plan.total)}
        </p>
      ) : null}
      {plan.state === "list" ? (
        <>
          <PublicationList items={items} locale={locale} />
          <IndexPagination filters={plan.filters} locale={locale} page={plan.page} pageCount={plan.pageCount} />
        </>
      ) : null}
      {plan.state === "empty" ? (
        <Notice>
          <p>{dictionary.empty}</p>
        </Notice>
      ) : null}
      {plan.state === "no-results" ? (
        <Notice>
          <p>{dictionary.noResults}</p>
          {clearLink}
        </Notice>
      ) : null}
      {plan.state === "unknown-filter" ? (
        <Notice>
          <p>{dictionary.unknownFilter(plan.unknown.map((key) => dictionary[key]).join(", "))}</p>
          {clearLink}
        </Notice>
      ) : null}
      {plan.state === "page-not-found" ? (
        <Notice>
          <p>{dictionary.pageNotFound}</p>
          <Link
            className="mt-3 inline-block font-semibold text-brand-700 underline underline-offset-4"
            href={indexHref(locale, plan.filters, 1)}
          >
            {dictionary.firstPage}
          </Link>
        </Notice>
      ) : null}
    </div>
  );
}
