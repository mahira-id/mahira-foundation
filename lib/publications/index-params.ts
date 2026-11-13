import type { Locale } from "@/lib/i18n/locales";

/**
 * URL contract of the publication index `/{locale}/publications`
 * (M3-05, DECISIONS §2.11 P2 A, P3 A). Pure, no Payload import.
 *
 * `?type=<slug>&topic=<slug>&year=<yyyy>&page=<n>`: one value per filter,
 * an empty value is the same as no value, other parameters are ignored.
 */
export const PAGE_SIZE = 12;

export type IndexFilterKey = "type" | "topic" | "year";

export const INDEX_FILTER_KEYS: readonly IndexFilterKey[] = ["type", "topic", "year"];

export type IndexQuery = { type?: string; topic?: string; year?: string; page?: string };

export type IndexFilters = Pick<IndexQuery, IndexFilterKey>;

type RawSearchParams = Record<string, string | string[] | undefined>;

const QUERY_KEYS = ["type", "topic", "year", "page"] as const;

/** First value of a repeated parameter; "" is absent; unknown keys are dropped (P3 A). */
export function readIndexQuery(raw: RawSearchParams): IndexQuery {
  const query: IndexQuery = {};
  for (const key of QUERY_KEYS) {
    const value = raw[key];
    const first = Array.isArray(value) ? value[0] : value;
    if (typeof first === "string" && first !== "") query[key] = first;
  }
  return query;
}

const PAGE_PATTERN = /^[1-9][0-9]{0,5}$/;

/** Absent → 1; a positive integer without leading zero (max 6 digits) → that number; anything else → null. */
export function parsePage(value?: string): number | null {
  if (value === undefined) return 1;
  return PAGE_PATTERN.test(value) ? Number(value) : null;
}

export function hasFilter(query: IndexQuery): boolean {
  return INDEX_FILTER_KEYS.some((key) => query[key] !== undefined && query[key] !== "");
}

/** Index URL with the parameters in a fixed order; empty values and page 1 are never written (P2 A). */
export function indexHref(locale: Locale, filters: IndexFilters, page: number): string {
  const params = new URLSearchParams();
  for (const key of INDEX_FILTER_KEYS) {
    const value = filters[key];
    if (value) params.set(key, value);
  }
  if (page > 1) params.set("page", String(page));
  const search = params.toString();
  return `/${locale}/publications${search ? `?${search}` : ""}`;
}
