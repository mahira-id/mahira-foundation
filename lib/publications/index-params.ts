import type { Locale } from "@/lib/i18n/locales";

/**
 * URL contract of the publication index `/{locale}/publications`
 * (M3-05, DECISIONS §2.11 P2 A, P3 A; search M3-06, §2.12 P3, P4, P8). Pure,
 * no Payload import.
 *
 * `?q=<text>&type=<slug>&topic=<slug>&year=<yyyy>&page=<n>`: one value per
 * parameter, an empty value is the same as no value, other parameters (also
 * `sort`) are ignored.
 */
export const PAGE_SIZE = 12;

/** Longest search text, in code points (§2.12 P8); a longer `q` is cut. */
export const SEARCH_MAX_LENGTH = 100;

export type IndexFilterKey = "type" | "topic" | "year";

export const INDEX_FILTER_KEYS: readonly IndexFilterKey[] = ["type", "topic", "year"];

export type IndexQuery = { q?: string; type?: string; topic?: string; year?: string; page?: string };

/** The search text and the filter values: everything of the URL except `page`. */
export type IndexFilters = Pick<IndexQuery, "q" | IndexFilterKey>;

type RawSearchParams = Record<string, string | string[] | undefined>;

const QUERY_KEYS = ["q", "type", "topic", "year", "page"] as const;

/**
 * Search text as the index uses and shows it: NFKC, every run of whitespace
 * or control characters one space, trimmed, then the first
 * SEARCH_MAX_LENGTH code points (a surrogate pair is never split), trimmed
 * again. "" means no search.
 */
export function normalizeSearch(value: string): string {
  const collapsed = value.normalize("NFKC").replace(/[\s\p{Cc}]+/gu, " ").trim();
  return Array.from(collapsed).slice(0, SEARCH_MAX_LENGTH).join("").trim();
}

/** First value of a repeated parameter; "" (for `q`: blank after normalizeSearch) is absent; unknown keys are dropped (P3 A). */
export function readIndexQuery(raw: RawSearchParams): IndexQuery {
  const query: IndexQuery = {};
  for (const key of QUERY_KEYS) {
    const value = raw[key];
    const first = Array.isArray(value) ? value[0] : value;
    if (typeof first !== "string") continue;
    const text = key === "q" ? normalizeSearch(first) : first;
    if (text !== "") query[key] = text;
  }
  return query;
}

const PAGE_PATTERN = /^[1-9][0-9]{0,5}$/;

/** Absent → 1; a positive integer without leading zero (max 6 digits) → that number; anything else → null. */
export function parsePage(value?: string): number | null {
  if (value === undefined) return 1;
  return PAGE_PATTERN.test(value) ? Number(value) : null;
}

/** True when the URL has a search text or a filter value (both make the page `noindex`). */
export function hasFilter(query: IndexQuery): boolean {
  if (query.q !== undefined && query.q !== "") return true;
  return INDEX_FILTER_KEYS.some((key) => query[key] !== undefined && query[key] !== "");
}

/** Index URL with the parameters in a fixed order (q, type, topic, year, page); empty values and page 1 are never written (P2 A). */
export function indexHref(locale: Locale, filters: IndexFilters, page: number): string {
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  for (const key of INDEX_FILTER_KEYS) {
    const value = filters[key];
    if (value) params.set(key, value);
  }
  if (page > 1) params.set("page", String(page));
  const search = params.toString();
  return `/${locale}/publications${search ? `?${search}` : ""}`;
}
