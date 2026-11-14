import { toHomePublication, type HomePublication, type HomePublicationDoc } from "@/lib/home/homepage-view";
import type { Locale } from "@/lib/i18n/locales";
import { formatPublicationDate, publicationYear } from "@/lib/publications/dates";
import {
  INDEX_FILTER_KEYS,
  PAGE_SIZE,
  hasFilter,
  parsePage,
  type IndexFilterKey,
  type IndexFilters,
  type IndexQuery,
} from "@/lib/publications/index-params";

/**
 * View model of the publication index `/{locale}/publications` (M3-05,
 * DECISIONS §2.11 P1 A–P5 A). Pure: no I/O, no Payload import at runtime.
 * lib/cms/public-content.ts reads the CMS (anonymous, so only published +
 * public records of the page locale) and runs these functions; the page
 * renders the plan. Filter values from the URL are only compared with known
 * options and never echoed.
 */

/** One visible publication of the locale, as the scan query returns it (ids only). */
export type IndexRef = {
  id: number;
  publicationType: number | null;
  topics: number[];
  publishedAt: string | null;
  createdAt: string;
};

type IdRelation = number | { id: number } | null | undefined;

/** The fields the scan query selects (lib/cms/publication-index-query.ts), depth 0. */
export type IndexRefDoc = {
  id: number;
  publicationType?: IdRelation;
  topics?: IdRelation[] | null;
  publishedAt?: string | null;
  createdAt: string;
};

/** A publication type or topic as the term query returns it. */
export type IndexTermDoc = { id: number; slug: string; name?: string | null; isActive?: boolean | null };

export type IndexOption = { value: string; label: string };

export type IndexFacets = {
  types: IndexOption[];
  topics: IndexOption[];
  years: IndexOption[];
  /** slug → term id of the type and topic options (server-side only, for filtering). */
  typeIds: ReadonlyMap<string, number>;
  topicIds: ReadonlyMap<string, number>;
};

export type IndexState = "list" | "empty" | "no-results" | "unknown-filter" | "page-not-found";

export type IndexPlan = {
  state: IndexState;
  /** Matching publications (0 for unknown-filter). */
  total: number;
  /** The requested page; 1 when the value is not a page number. */
  page: number;
  pageCount: number;
  /** Ids of the rows of this page, in display order (empty unless `list`). */
  pageIds: number[];
  unknown: IndexFilterKey[];
  /** The filter values of the query (known or not), for links and the form. */
  filters: IndexFilters;
};

export type IndexItem = Omit<HomePublication, "year">;

function relationId(value: IdRelation): number | null {
  if (typeof value === "number") return value;
  return value && typeof value.id === "number" ? value.id : null;
}

function nonEmpty(value: string | null | undefined): string | null {
  return value && value.trim() ? value : null;
}

export function toIndexRef(doc: IndexRefDoc): IndexRef {
  return {
    id: doc.id,
    publicationType: relationId(doc.publicationType),
    topics: (doc.topics ?? []).map(relationId).filter((id): id is number => id !== null),
    publishedAt: nonEmpty(doc.publishedAt),
    createdAt: doc.createdAt,
  };
}

/** Distinct type and topic ids used by the refs, for the term queries. */
export function termIds(refs: IndexRef[]): { types: number[]; topics: number[] } {
  const types = new Set<number>();
  const topics = new Set<number>();
  for (const ref of refs) {
    if (ref.publicationType !== null) types.add(ref.publicationType);
    for (const topic of ref.topics) topics.add(topic);
  }
  return { types: [...types], topics: [...topics] };
}

/**
 * P4 A: dated refs first, newest publishedAt first; then undated refs,
 * newest createdAt first; ties by the higher id, so pages are stable.
 */
export function orderRefs(refs: IndexRef[]): IndexRef[] {
  return [...refs].sort((a, b) => {
    if (a.publishedAt && !b.publishedAt) return -1;
    if (!a.publishedAt && b.publishedAt) return 1;
    const timeA = Date.parse(a.publishedAt ?? a.createdAt);
    const timeB = Date.parse(b.publishedAt ?? b.createdAt);
    if (timeA !== timeB) return timeB - timeA;
    return b.id - a.id;
  });
}

function termOptions(terms: IndexTermDoc[], used: Set<number>, collator: Intl.Collator): { options: IndexOption[]; ids: Map<string, number> } {
  const options: IndexOption[] = [];
  const ids = new Map<string, number>();
  for (const term of terms) {
    const label = nonEmpty(term.name);
    if (term.isActive !== true || !label || !used.has(term.id) || ids.has(term.slug)) continue;
    options.push({ value: term.slug, label });
    ids.set(term.slug, term.id);
  }
  options.sort((a, b) => collator.compare(a.label, b.label) || collator.compare(a.value, b.value));
  return { options, ids };
}

/**
 * Filter options (P1 A, P5 A): only active terms with a name in this locale
 * that at least one visible publication uses (a topic in any position);
 * years of the dated publications in WIB, newest first.
 */
export function buildFacets(refs: IndexRef[], types: IndexTermDoc[], topics: IndexTermDoc[], locale: Locale): IndexFacets {
  const collator = new Intl.Collator(locale);
  const used = termIds(refs);
  const typeOptions = termOptions(types, new Set(used.types), collator);
  const topicOptions = termOptions(topics, new Set(used.topics), collator);
  const years = new Set<string>();
  for (const ref of refs) if (ref.publishedAt) years.add(publicationYear(ref.publishedAt));
  return {
    types: typeOptions.options,
    topics: topicOptions.options,
    years: [...years].sort((a, b) => Number(b) - Number(a)).map((year) => ({ value: year, label: year })),
    typeIds: typeOptions.ids,
    topicIds: topicOptions.ids,
  };
}

type ResolvedFilters = { typeId?: number; topicId?: number; year?: string };

/**
 * Maps the query values to options. A present value that is not an option is
 * unknown: missing slug, inactive term, term without visible publications in
 * this locale, year without publications, or any other string (P3 A, P5 A).
 */
export function resolveFilters(query: IndexQuery, facets: IndexFacets): { resolved: ResolvedFilters; unknown: IndexFilterKey[] } {
  const resolved: ResolvedFilters = {};
  const unknown: IndexFilterKey[] = [];
  if (query.type) {
    const id = facets.typeIds.get(query.type);
    if (id === undefined) unknown.push("type");
    else resolved.typeId = id;
  }
  if (query.topic) {
    const id = facets.topicIds.get(query.topic);
    if (id === undefined) unknown.push("topic");
    else resolved.topicId = id;
  }
  if (query.year) {
    if (facets.years.some((option) => option.value === query.year)) resolved.year = query.year;
    else unknown.push("year");
  }
  return { resolved, unknown };
}

function matches(ref: IndexRef, filters: ResolvedFilters): boolean {
  if (filters.typeId !== undefined && ref.publicationType !== filters.typeId) return false;
  if (filters.topicId !== undefined && !ref.topics.includes(filters.topicId)) return false;
  if (filters.year !== undefined && (!ref.publishedAt || publicationYear(ref.publishedAt) !== filters.year)) return false;
  return true;
}

function queryFilters(query: IndexQuery): IndexFilters {
  const filters: IndexFilters = {};
  for (const key of INDEX_FILTER_KEYS) if (query[key]) filters[key] = query[key];
  return filters;
}

/**
 * State and rows of one index URL. Precedence: unknown filter value >
 * invalid or out-of-range page > empty (no filter) > no results (filter) >
 * list. Filters combine with AND; `year` excludes undated publications.
 */
export function planIndex({ query, refs, facets }: { query: IndexQuery; refs: IndexRef[]; facets: IndexFacets }): IndexPlan {
  const filters = queryFilters(query);
  const requested = parsePage(query.page);
  const page = requested ?? 1;
  const { resolved, unknown } = resolveFilters(query, facets);
  if (unknown.length > 0) {
    return { state: "unknown-filter", total: 0, page, pageCount: 1, pageIds: [], unknown, filters };
  }
  const ordered = orderRefs(refs.filter((ref) => matches(ref, resolved)));
  const total = ordered.length;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const base = { total, page, pageCount, unknown, filters };
  if (requested === null || requested > pageCount) return { ...base, state: "page-not-found", pageIds: [] };
  if (total === 0) return { ...base, state: hasFilter(query) ? "no-results" : "empty", pageIds: [] };
  const start = (requested - 1) * PAGE_SIZE;
  return { ...base, state: "list", pageIds: ordered.slice(start, start + PAGE_SIZE).map((ref) => ref.id) };
}

/** Docs of the page query in the order of `ids`; ids no longer returned are skipped. */
export function inIdOrder<T extends { id: number }>(docs: T[], ids: number[]): T[] {
  const byId = new Map(docs.map((doc) => [doc.id, doc]));
  return ids.flatMap((id) => {
    const doc = byId.get(id);
    return doc ? [doc] : [];
  });
}

/**
 * One row (P15 A) from the page query (the homepage row fields), same rules
 * as the homepage rows: type and primary topic
 * names even for inactive terms (P5 A), authors joined, the date in the page
 * locale only with publishedAt (P4 A).
 */
export function toIndexItem(doc: HomePublicationDoc, locale: Locale): IndexItem {
  const home = toHomePublication(doc);
  return {
    slug: home.slug,
    title: home.title,
    summary: home.summary,
    typeName: home.typeName,
    topicName: home.topicName,
    authorNames: home.authorNames,
    accessLevel: home.accessLevel,
    publishedAt: home.publishedAt,
    dateLabel: home.publishedAt ? formatPublicationDate(home.publishedAt, locale) : null,
  };
}

const NOINDEX_STATES: ReadonlySet<IndexState | "error"> = new Set(["unknown-filter", "page-not-found", "error"]);

/** P3 A, DEC-021: `noindex, follow` for any non-empty filter and for the invalid and failed states. */
export function indexNoindex(query: IndexQuery, state: IndexState | "error"): boolean {
  return hasFilter(query) || NOINDEX_STATES.has(state);
}
