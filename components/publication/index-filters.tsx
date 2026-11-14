import Form from "next/form";
import Link from "next/link";

import { getDictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/locales";
import { hasFilter, type IndexFilterKey, type IndexQuery } from "@/lib/publications/index-params";
import type { IndexFacets, IndexOption } from "@/lib/publications/index-view";

/**
 * Filters of the publication index (M3-05, DECISIONS §2.11 P1 A, P2 A): a GET
 * form (`next/form`, works without JavaScript) with one select per filter
 * that has options; no form when no filter has options (SRS FR-005).
 * Submitting drops `page`, so the list goes back to page 1. "Hapus filter"
 * shows whenever the URL has a filter value.
 */
export function IndexFilters({ locale, facets, query }: { locale: Locale; facets: IndexFacets; query: IndexQuery }) {
  const dictionary = getDictionary(locale).publications;
  const selects: { key: IndexFilterKey; label: string; options: IndexOption[] }[] = [
    { key: "type", label: dictionary.type, options: facets.types },
    { key: "topic", label: dictionary.topic, options: facets.topics },
    { key: "year", label: dictionary.year, options: facets.years },
  ];
  const shown = selects.filter((select) => select.options.length > 0);
  const filtered = hasFilter(query);
  if (shown.length === 0 && !filtered) return null;

  return (
    <div className="mt-10 flex flex-wrap items-end gap-x-6 gap-y-4 border-y border-line py-5">
      {shown.length > 0 ? (
        <Form
          action={`/${locale}/publications`}
          aria-label={dictionary.filtersLabel}
          className="flex flex-wrap items-end gap-x-4 gap-y-4"
        >
          {shown.map((select) => {
            // Only a known value is preselected; an unknown one shows "Semua".
            const current = select.options.some((option) => option.value === query[select.key]) ? (query[select.key] ?? "") : "";
            return (
              <div className="flex min-w-40 flex-col gap-2" key={select.key}>
                <label className="eyebrow text-muted" htmlFor={`filter-${select.key}`}>
                  {select.label}
                </label>
                <select
                  className="min-h-11 rounded-sm border border-line bg-white px-3 text-sm text-ink"
                  defaultValue={current}
                  id={`filter-${select.key}`}
                  // A new key remounts the select when the URL value changes
                  // (client navigation keeps uncontrolled selects otherwise).
                  key={`${select.key}:${current}`}
                  name={select.key}
                >
                  <option value="">{dictionary.all}</option>
                  {select.options.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            );
          })}
          <button className="btn btn-primary min-h-11" type="submit">
            {dictionary.apply}
          </button>
        </Form>
      ) : null}
      {filtered ? (
        <Link className="min-h-11 py-3 text-sm font-semibold text-brand-700 underline underline-offset-4" href={`/${locale}/publications`}>
          {dictionary.clear}
        </Link>
      ) : null}
    </div>
  );
}
