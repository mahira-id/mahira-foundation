import Link from "next/link";

import { getDictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/locales";
import { indexHref, type IndexFilters } from "@/lib/publications/index-params";

/**
 * Pagination of the publication index (M3-05, DECISIONS §2.11 P2 A):
 * "Sebelumnya", every page number, "Berikutnya" and "Halaman x dari y".
 * Links keep the filters, never write empty values and omit page 1.
 */
export function IndexPagination({
  locale,
  filters,
  page,
  pageCount,
}: {
  locale: Locale;
  filters: IndexFilters;
  page: number;
  pageCount: number;
}) {
  if (pageCount <= 1) return null;
  const dictionary = getDictionary(locale).publications.pagination;
  const pages = Array.from({ length: pageCount }, (_, index) => index + 1);
  const linkClass =
    "inline-flex min-h-11 min-w-11 items-center justify-center rounded-sm border border-line px-3 text-sm font-semibold text-ink transition-colors hover:border-brand-500 hover:text-brand-700";
  const inactiveClass = "inline-flex min-h-11 min-w-11 items-center justify-center px-3 text-sm font-semibold";

  return (
    <nav aria-label={dictionary.label} className="mt-10 flex flex-wrap items-center justify-between gap-4">
      <ul className="flex flex-wrap items-center gap-2">
        <li>
          {page > 1 ? (
            <Link className={linkClass} href={indexHref(locale, filters, page - 1)}>
              {dictionary.previous}
            </Link>
          ) : (
            <span aria-disabled="true" className={`${inactiveClass} text-dark-silver`}>
              {dictionary.previous}
            </span>
          )}
        </li>
        {pages.map((number) => (
          <li key={number}>
            {number === page ? (
              <span aria-current="page" className={`${inactiveClass} rounded-sm bg-brand-500 text-white`}>
                <span className="sr-only">{dictionary.page(number)}</span>
                <span aria-hidden="true">{number}</span>
              </span>
            ) : (
              <Link aria-label={dictionary.page(number)} className={linkClass} href={indexHref(locale, filters, number)}>
                {number}
              </Link>
            )}
          </li>
        ))}
        <li>
          {page < pageCount ? (
            <Link className={linkClass} href={indexHref(locale, filters, page + 1)}>
              {dictionary.next}
            </Link>
          ) : (
            <span aria-disabled="true" className={`${inactiveClass} text-dark-silver`}>
              {dictionary.next}
            </span>
          )}
        </li>
      </ul>
      <p className="text-sm text-muted">{dictionary.pageOf(page, pageCount)}</p>
    </nav>
  );
}
