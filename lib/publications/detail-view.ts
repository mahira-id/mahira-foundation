import { isLocale, languageSwitchHref, otherLocale, type Locale } from "@/lib/i18n/locales";
import { formatPublicationDate, publicationYear } from "@/lib/publications/dates";
import { isPublicDownload } from "@/lib/publications/file-access";
import { downloadPath } from "@/lib/publications/file-download";
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
/** A file relation with the panel fields (DETAIL_POPULATE); an id when the read could not populate it. */
type FileRelation =
  | number
  | {
    id: number;
    label?: string | null;
    kind?: string | null;
    language?: string | null;
    accessLevel?: string | null;
    status?: string | null;
    filesize?: number | null;
    mimeType?: string | null;
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
  files?: FileRelation[] | null;
};

export type PublicationCoverImage = { url: string; alt: string; width: number; height: number };

export type PublicationFileKind = "preview" | "full_document" | "appendix" | "dataset" | "supplementary" | "other";

/**
 * A downloadable file of the panel (M3-08, DECISIONS §2.14 item 7): only
 * files visitors may download (isPublicDownload), in stored order. No
 * storage URL or object key: the link is `downloadPath`, the app route that
 * checks access again on every request.
 */
export type PublicationFileItem = {
  id: number;
  label: string;
  kind: PublicationFileKind;
  /** Language of the document itself (may differ from the page). */
  language: Locale;
  sizeBytes: number;
  downloadPath: string;
};

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
  /** Public PDF files in stored order; empty = no file panel. */
  files: PublicationFileItem[];
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

const FILE_KINDS: readonly PublicationFileKind[] = ["preview", "full_document", "appendix", "dataset", "supplementary", "other"];

function isFileKind(value: unknown): value is PublicationFileKind {
  return typeof value === "string" && (FILE_KINDS as readonly string[]).includes(value);
}

/**
 * The files visitors may download (M3-08, DECISIONS §2.14 items 3 and 7),
 * in stored order: populated, ready, PDF, the stricter of the publication's
 * and the file's level `public` (isPublicDownload), with a label, a known
 * kind and language and a size. An id (the anonymous read could not
 * populate it) or anything incomplete is dropped. The staff preview uses
 * the same filter, so it shows exactly the files visitors will get.
 */
export function publicFiles(publicationAccess: unknown, files: FileRelation[] | null | undefined): PublicationFileItem[] {
  const items: PublicationFileItem[] = [];
  for (const file of files ?? []) {
    if (!file || typeof file === "number" || typeof file.id !== "number") continue;
    if (!isPublicDownload(publicationAccess, file)) continue;
    const label = nonEmpty(file.label);
    const { kind, language, filesize } = file;
    if (!label || !isFileKind(kind) || typeof language !== "string" || !isLocale(language)) continue;
    if (typeof filesize !== "number" || !Number.isFinite(filesize) || filesize < 0) continue;
    items.push({ id: file.id, label, kind, language, sizeBytes: filesize, downloadPath: downloadPath(file.id) });
  }
  return items;
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
    files: publicFiles(doc.accessLevel, doc.files),
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
