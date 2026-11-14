import { languageSwitchHref, otherLocale, type Locale } from "@/lib/i18n/locales";
import { formatPublicationDate, publicationYear } from "@/lib/publications/dates";
import type { Publication } from "@/payload/payload-types";
import { SLUG_PATTERN } from "@/payload/fields/slug";

/**
 * Publication detail view model (M3-05, DECISIONS §2.11 P7 A, P8 A, P15 A).
 * Pure: no I/O, no Payload import at runtime. lib/cms/public-content.ts
 * reads the record and maps it through these functions;
 * app/[locale]/publications/[slug]/page.tsx renders the result.
 */

/** A relation as the Local API returns it: an id when not populated, else the (selected) document. */
type NamedRelation = number | { name?: string | null } | null | undefined;
type AuthorRelation = number | { displayName?: string | null } | null | undefined;
type MediaRelation =
  | number
  | {
      url?: string | null;
      alt?: string | null;
      mimeType?: string | null;
      width?: number | null;
      height?: number | null;
    }
  | null
  | undefined;

/** The publication fields the detail query selects (lib/cms/publication-detail-query.ts). */
export type PublicationDetailDoc = {
  id: number;
  slug: string;
  title: string;
  summary?: string | null;
  publishedAt?: string | null;
  accessLevel: Publication["accessLevel"];
  publicationType?: NamedRelation;
  topics?: NamedRelation[] | null;
  authors?: AuthorRelation[] | null;
  coverImage?: MediaRelation;
};

export type PublicationCoverImage = { url: string; alt: string; width: number; height: number };

export type PublicationDetail = {
  id: number;
  slug: string;
  locale: Locale;
  title: string;
  /** The summary as one line (paragraphs joined by a space), for the description meta tag. */
  description: string;
  summaryParagraphs: string[];
  typeName: string | null;
  /** Named topics in stored order; the primary topic (topics[0], DEC-003) first. */
  topicNames: string[];
  authorNames: string[];
  accessLevel: Publication["accessLevel"];
  publishedAt: string | null;
  dateLabel: string | null;
  year: string | null;
  /** An uploaded image cover, or null for the typographic cover. */
  cover: PublicationCoverImage | null;
};

/** Slug of the detail URL: the same rule as the slug field (lowercase, digits, single hyphens). */
export function isPublicationSlug(value: string): boolean {
  return SLUG_PATTERN.test(value);
}

function nonEmpty(value: string | null | undefined): string | null {
  return value && value.trim() ? value.trim() : null;
}

function relationName(value: NamedRelation): string | null {
  if (!value || typeof value === "number") return null;
  return nonEmpty(value.name);
}

function authorName(value: AuthorRelation): string | null {
  if (!value || typeof value === "number") return null;
  return nonEmpty(value.displayName);
}

function isName(value: string | null): value is string {
  return value !== null;
}

/** Paragraphs of the summary: split on blank lines, trimmed, empty ones dropped (P7 A). */
export function summaryParagraphs(summary: string | null | undefined): string[] {
  return (summary ?? "")
    .replace(/\r\n?/g, "\n")
    .split(/\n[ \t]*\n/)
    .map((paragraph) => paragraph.trim())
    .filter((paragraph) => paragraph.length > 0);
}

/**
 * Only a populated image Media with a URL and its size is a cover; a PDF,
 * an id (Media not readable) or missing data gives the typographic cover.
 */
function coverOf(value: MediaRelation): PublicationCoverImage | null {
  if (!value || typeof value === "number") return null;
  const { url, mimeType, width, height } = value;
  if (typeof url !== "string" || !url) return null;
  if (typeof mimeType !== "string" || !mimeType.startsWith("image/")) return null;
  if (typeof width !== "number" || typeof height !== "number" || width <= 0 || height <= 0) return null;
  return { url, alt: value.alt ?? "", width, height };
}

/**
 * Type and topic labels show even when the term is inactive, if the term has
 * a name in this locale (P5 A). Without publishedAt no date is shown.
 */
export function toPublicationDetail(doc: PublicationDetailDoc, locale: Locale): PublicationDetail {
  const publishedAt = nonEmpty(doc.publishedAt);
  const paragraphs = summaryParagraphs(doc.summary);
  return {
    id: doc.id,
    slug: doc.slug,
    locale,
    title: doc.title,
    description: paragraphs.join(" "),
    summaryParagraphs: paragraphs,
    typeName: relationName(doc.publicationType),
    topicNames: (doc.topics ?? []).map(relationName).filter(isName),
    authorNames: (doc.authors ?? []).map(authorName).filter(isName),
    accessLevel: doc.accessLevel,
    publishedAt,
    dateLabel: publishedAt ? formatPublicationDate(publishedAt, locale) : null,
    year: publishedAt ? publicationYear(publishedAt) : null,
    cover: coverOf(doc.coverImage),
  };
}

export type DetailSwitcher = { href: string; unavailable: boolean };

/**
 * Language switcher of a detail page (P8 A): the published + public
 * counterpart when there is one, otherwise the other locale's index with
 * the "not available" note.
 */
export function switcherFor(locale: Locale, alternates: Partial<Record<Locale, string>>): DetailSwitcher {
  const other = otherLocale(locale);
  return { href: languageSwitchHref(other, alternates), unavailable: !alternates[other] };
}
