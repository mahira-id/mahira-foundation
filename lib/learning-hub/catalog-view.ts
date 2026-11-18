import { paragraphs, text, toStructuredSections, type SectionDoc, type StructuredSection, type Text } from "@/lib/content/structured-sections";
import { isLocale, type Locale } from "@/lib/i18n/locales";
import { embedUrl, isYouTubeId, videoThumbnailUrl, watchUrl, type YouTubeKind } from "@/lib/learning-hub/youtube";
import { toolkitFileItems, type ToolkitFileItem, type ToolkitFileRelation } from "@/lib/learning-hub/toolkit-files";
import { learningHubPath, resourcePath } from "@/lib/publications/preview";
import { PUBLIC_LEARNING_RESOURCE_TYPES } from "@/payload/access/public-read";
import { SLUG_PATTERN } from "@/payload/fields/slug";

export { learningHubPath, resourcePath };

/**
 * Learning Hub view model (M3-11/12, DECISIONS §2.16 decisions 2A–14A).
 * Pure: no I/O, no Payload import at runtime. lib/cms/public-content.ts
 * reads the `learning-resources` collection and the `learning-hub` global
 * anonymously (published only, one locale, no fallback) and maps them here;
 * the pages under app/[locale]/learning-hub render the result.
 *
 * - A resource shows in a locale only when isResourceVisible (published, a
 *   public type, that locale's title and summary, a valid slug for a guide
 *   or toolkit or a valid YouTube ID for a video/playlist, an active Topic
 *   with a name in that locale; EN also "Versi EN siap tayang"; a toolkit
 *   also at least one downloadable file in that locale, M3-13 decision 2A:
 *   fail closed).
 * - A locale's catalog exists only with at least one visible resource
 *   (decision 11A): planCatalog returns null otherwise.
 * - Catalog order (decision 10A): one theme per Topic, themes by Topic name
 *   (Intl.Collator of the locale); cards by `sortOrder` (numbered first,
 *   ascending), then newest first (`publishedAt`, `createdAt`, `id`).
 * - Toolkits (M3-13, DECISIONS §2.17 decision 6A): their own section at
 *   the top of the catalog, never inside a theme; same card order.
 * - Every YouTube URL is built from the validated ID (lib/learning-hub/
 *   youtube.ts), never from a stored URL.
 */
export type PublicResourceType = (typeof PUBLIC_LEARNING_RESOURCE_TYPES)[number];

/** Product name, the catalog H1 while the global has none (no copy written by agents). */
export const LEARNING_HUB_NAME = "Learning Hub";

/** Cards of the homepage block (decision 11A). */
export const HOME_LEARNING_HUB_LIMIT = 3;

type TopicRelation = number | { id?: number | null; name?: Text; description?: Text; isActive?: boolean | null } | null | undefined;
type MediaRelation =
  | number
  | { url?: Text; alt?: Text; mimeType?: Text; width?: number | null; height?: number | null }
  | null
  | undefined;

/** A `learning-resources` record as one locale's Local API read returns it (RESOURCE_SELECT). */
export type ResourceDoc = {
  id: number;
  type?: string | null;
  title?: Text;
  summary?: Text;
  slug?: Text;
  materialLanguage?: string | null;
  topic?: TopicRelation;
  youtubeId?: Text;
  coverImage?: MediaRelation;
  sections?: SectionDoc[] | null;
  /** Toolkit files (M3-13), populated with the panel fields only (RESOURCE_POPULATE). */
  files?: ToolkitFileRelation[] | null;
  sortOrder?: number | null;
  publishedAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  enReady?: boolean | null;
  _status?: string | null;
};

/** The `learning-hub` global as one locale's Local API read returns it. */
export type LearningHubDoc = {
  hero?: { title?: Text; intro?: Text } | null;
  seo?: { title?: Text; description?: Text } | null;
  _status?: string | null;
  updatedAt?: string | null;
};

export type ResourceCover = { url: string; alt: string; width: number; height: number };

/** YouTube URLs of a video or playlist card, all built from the validated ID. */
export type ResourceYouTube = {
  kind: YouTubeKind;
  id: string;
  /** youtube-nocookie.com iframe source, loaded only after the play click. */
  embedUrl: string;
  /** "Tonton di YouTube" link. */
  watchUrl: string;
  /** i.ytimg.com thumbnail of a video; null for a playlist (cover or typographic cover). */
  thumbnailUrl: string | null;
};

export type LearningCard = {
  id: number;
  type: PublicResourceType;
  title: string;
  /** The summary as one line (paragraphs joined by a space). */
  summary: string;
  /** "Bahasa materi": the language of the material itself, shown as a label; null when not set. */
  materialLanguage: Locale | null;
  /** Detail page of a guide or toolkit; null for a video or playlist (they play in the catalog). */
  href: string | null;
  /** Number of downloadable files of a toolkit in this locale ("PDF · N file"); null for other types. */
  fileCount: number | null;
  youtube: ResourceYouTube | null;
  /** Uploaded image cover of a playlist; null otherwise (thumbnail or typographic cover). */
  cover: ResourceCover | null;
  publishedAt: string | null;
};

export type CatalogTheme = { topicId: number; name: string; description: string | null; cards: LearningCard[] };

/** The catalog texts of a locale: the published global, else the product name; no agent-written copy. */
export type CatalogTexts = {
  /** H1: the published global's title, else LEARNING_HUB_NAME. */
  title: string;
  intro: string[];
  /** The global's SEO title (a full `<title>`), or null: the H1 with the site-name template. */
  seoTitle: string | null;
  /** The global's meta description, else the first intro paragraph, else null. */
  seoDescription: string | null;
};

export type CatalogPlan = CatalogTexts & {
  locale: Locale;
  /** Toolkit cards (decision 10A, M3-13 decision 6A) in catalog order; the section is hidden while empty. */
  toolkits: LearningCard[];
  /** Themes of the videos, playlists and guides; toolkits are only in `toolkits`. */
  themes: CatalogTheme[];
  cardCount: number;
};

export type GuidePage = {
  id: number;
  /** A guide, or since M3-13 a toolkit (the same page plus its file panel). */
  type: "guide" | "toolkit";
  locale: Locale;
  slug: string;
  title: string;
  summary: string[];
  /** The summary as one line, for the meta description. */
  description: string;
  materialLanguage: Locale | null;
  /** Name of the resource's Topic in this locale, or null. */
  themeName: string | null;
  sections: StructuredSection[];
  /** A toolkit's downloadable files in this locale (toolkitFileItems); [] for a guide. */
  files: ToolkitFileItem[];
  publishedAt: string | null;
};

function isPublicType(value: unknown): value is PublicResourceType {
  return typeof value === "string" && (PUBLIC_LEARNING_RESOURCE_TYPES as readonly string[]).includes(value);
}

type ActiveTopic = { id: number; name: string; description: string | null };

/** The populated Topic when it is active and named in this locale (an id means it could not be read). */
function activeTopic(value: TopicRelation): ActiveTopic | null {
  if (!value || typeof value === "number") return null;
  const name = text(value.name);
  if (value.isActive !== true || !name || typeof value.id !== "number") return null;
  return { id: value.id, name, description: text(value.description) };
}

function namedTopic(value: TopicRelation): string | null {
  return value && typeof value === "object" ? text(value.name) : null;
}

function languageOf(value: unknown): Locale | null {
  return typeof value === "string" && isLocale(value) ? value : null;
}

function hasDetailPage(type: unknown): type is "guide" | "toolkit" {
  return type === "guide" || type === "toolkit";
}

function isSlug(value: unknown): value is string {
  return typeof value === "string" && SLUG_PATTERN.test(value);
}

/** Whether visitors see this resource in this locale (see the module comment). */
export function isResourceVisible(doc: ResourceDoc | null | undefined, locale: Locale): boolean {
  if (!doc || doc._status !== "published" || !isPublicType(doc.type)) return false;
  if (!text(doc.title) || !text(doc.summary) || !activeTopic(doc.topic)) return false;
  if (hasDetailPage(doc.type) ? !isSlug(doc.slug) : !isYouTubeId(doc.type, doc.youtubeId)) return false;
  if (doc.type === "toolkit" && toolkitFileItems(doc.files, locale).length === 0) return false;
  return locale === "id" || doc.enReady === true;
}

/** Only a populated image Media with a URL and its size is a cover. */
function coverOf(value: MediaRelation): ResourceCover | null {
  if (!value || typeof value === "number") return null;
  const url = text(value.url);
  const mimeType = text(value.mimeType);
  const { width, height } = value;
  if (!url || !mimeType || !mimeType.startsWith("image/")) return null;
  if (typeof width !== "number" || typeof height !== "number" || width <= 0 || height <= 0) return null;
  return { url, alt: text(value.alt) ?? "", width, height };
}

function youtubeOf(type: PublicResourceType, id: unknown): ResourceYouTube | null {
  if (type !== "video" && type !== "playlist") return null;
  const embed = embedUrl(type, id);
  const watch = watchUrl(type, id);
  if (!embed || !watch || typeof id !== "string") return null;
  return { kind: type, id, embedUrl: embed, watchUrl: watch, thumbnailUrl: type === "video" ? videoThumbnailUrl(id) : null };
}

/** A visible resource as a card (call after isResourceVisible). */
export function toCard(doc: ResourceDoc, locale: Locale): LearningCard {
  const type = doc.type as PublicResourceType;
  return {
    id: doc.id,
    type,
    title: text(doc.title) ?? "",
    summary: paragraphs(doc.summary).join(" "),
    materialLanguage: languageOf(doc.materialLanguage),
    href: hasDetailPage(type) ? resourcePath(locale, doc.slug) : null,
    fileCount: type === "toolkit" ? toolkitFileItems(doc.files, locale).length : null,
    youtube: youtubeOf(type, doc.youtubeId),
    cover: type === "playlist" ? coverOf(doc.coverImage) : null,
    publishedAt: text(doc.publishedAt),
  };
}

function time(value: unknown): number {
  const ms = typeof value === "string" ? Date.parse(value) : Number.NaN;
  return Number.isNaN(ms) ? Number.NEGATIVE_INFINITY : ms;
}

/** Newest first: publishedAt, then createdAt, then id (all descending). */
function newestFirst(a: ResourceDoc, b: ResourceDoc): number {
  return time(b.publishedAt) - time(a.publishedAt) || time(b.createdAt) - time(a.createdAt) || b.id - a.id;
}

function sortValue(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

/** Catalog order inside a theme: numbered `sortOrder` first (ascending), then newest first. */
export function compareResources(a: ResourceDoc, b: ResourceDoc): number {
  const x = sortValue(a.sortOrder);
  const y = sortValue(b.sortOrder);
  if (x !== null && y !== null && x !== y) return x - y;
  if (x !== null && y === null) return -1;
  if (x === null && y !== null) return 1;
  return newestFirst(a, b);
}

/** H1, intro and SEO texts of the catalog from the published global, else the product name. */
export function catalogTexts(global: LearningHubDoc | null | undefined): CatalogTexts {
  const published = global && global._status === "published" ? global : null;
  const title = text(published?.hero?.title) ?? LEARNING_HUB_NAME;
  const intro = paragraphs(published?.hero?.intro);
  return {
    title,
    intro,
    seoTitle: text(published?.seo?.title),
    seoDescription: text(published?.seo?.description) ?? intro[0] ?? null,
  };
}

/** The catalog of a locale, or null when no resource is visible in it (the page is then not found). */
export function planCatalog(docs: ResourceDoc[], locale: Locale, global: LearningHubDoc | null | undefined): CatalogPlan | null {
  const visible = docs.filter((doc) => isResourceVisible(doc, locale));
  if (visible.length === 0) return null;
  // M3-13 decision 6A: toolkits only in their own section, never repeated in a theme.
  const toolkits = visible.filter((doc) => doc.type === "toolkit");
  const themes = new Map<number, { topic: ActiveTopic; docs: ResourceDoc[] }>();
  for (const doc of visible.filter((candidate) => candidate.type !== "toolkit")) {
    const topic = activeTopic(doc.topic) as ActiveTopic;
    const theme = themes.get(topic.id) ?? { topic, docs: [] };
    theme.docs.push(doc);
    themes.set(topic.id, theme);
  }
  const collator = new Intl.Collator(locale);
  const ordered = [...themes.values()].sort((a, b) => collator.compare(a.topic.name, b.topic.name) || a.topic.id - b.topic.id);
  return {
    ...catalogTexts(global),
    locale,
    toolkits: [...toolkits].sort(compareResources).map((doc) => toCard(doc, locale)),
    themes: ordered.map(({ topic, docs: themeDocs }) => ({
      topicId: topic.id,
      name: topic.name,
      description: topic.description,
      cards: [...themeDocs].sort(compareResources).map((doc) => toCard(doc, locale)),
    })),
    cardCount: visible.length,
  };
}

/** Up to `limit` newest visible resources of a locale as cards (homepage block, decision 11A). */
export function newestCards(docs: ResourceDoc[], locale: Locale, limit: number = HOME_LEARNING_HUB_LIMIT): LearningCard[] {
  return docs
    .filter((doc) => isResourceVisible(doc, locale))
    .sort(newestFirst)
    .slice(0, limit)
    .map((doc) => toCard(doc, locale));
}

/**
 * A guide or (M3-13) a toolkit as its detail page renders it, or null when
 * it is neither or has no title or valid slug in this locale. Visibility is
 * a separate check (isResourceVisible): the staff preview renders a draft
 * visitors cannot see. A toolkit's files go through the same filter as on
 * the public page (toolkitFileItems), so the preview shows exactly the
 * files visitors will get.
 */
export function toGuidePage(doc: ResourceDoc, locale: Locale): GuidePage | null {
  const title = text(doc.title);
  if (!hasDetailPage(doc.type) || !title || !isSlug(doc.slug)) return null;
  const summary = paragraphs(doc.summary);
  return {
    id: doc.id,
    type: doc.type,
    locale,
    slug: doc.slug,
    title,
    summary,
    description: summary.join(" "),
    materialLanguage: languageOf(doc.materialLanguage),
    themeName: namedTopic(doc.topic),
    sections: toStructuredSections(doc.sections, null).sections,
    files: doc.type === "toolkit" ? toolkitFileItems(doc.files, locale) : [],
    publishedAt: text(doc.publishedAt),
  };
}

/**
 * Learning Hub entries of /sitemap.xml (decision 13A; M3-13, DECISIONS §2.17
 * decision 7A): existing catalogs and visible guides and toolkits (`guides`
 * lists every resource with a detail page). Never a PDF.
 */
export type LearningHubSitemap = {
  catalogs: { locale: Locale; lastModified: string | null }[];
  guides: { locale: Locale; slug: string; lastModified: string | null }[];
};

/** Latest of the given timestamps, or null (sitemap `lastmod`). */
export function latestTimestamp(values: unknown[]): string | null {
  let best: string | null = null;
  for (const value of values) if (typeof value === "string" && time(value) > time(best)) best = value;
  return best;
}
