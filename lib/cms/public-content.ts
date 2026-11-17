import config from "@payload-config";
import type { PostgresAdapter } from "@payloadcms/db-postgres";
import { draftMode, headers } from "next/headers";
import { getPayload } from "payload";
import { cache } from "react";
import { aboutPath, isAboutVisible, toAboutPage, type AboutPage } from "@/lib/about/about-view";
import { findPublicAbout } from "@/lib/cms/about-query";
import { findActiveTopics, findHomepagePublications } from "@/lib/cms/homepage-query";
import { findPublicPublication, findPublicRef, findPublicTitle } from "@/lib/cms/publication-detail-query";
import { findLivePublicationOfFile, findPublicFile } from "@/lib/cms/publication-file-query";
import { FileStorageError, signedFileUrl, type StoredFile } from "@/lib/cms/publication-file-storage";
import { findIndexPage, findIndexRefs, findIndexTerms } from "@/lib/cms/publication-index-query";
import { findSearchRanks } from "@/lib/cms/publication-search-query";
import { findSlugOwner } from "@/lib/cms/publication-slug-query";
import { findPublicGuide, findPublicLearningHub, findPublicResource, findPublicResources } from "@/lib/cms/learning-hub-query";
import { findSitemapPublications, type SitemapPublication } from "@/lib/cms/sitemap-query";
import { findDraftAbout, findDraftGuide, findDraftPublication, staffFromHeaders } from "@/lib/cms/staff-preview";
import { readErrorLabel, toHomePublication, toHomeTopics, type HomepageData } from "@/lib/home/homepage-view";
import { LOCALES, otherLocale, type Locale } from "@/lib/i18n/locales";
import {
  catalogTexts,
  isResourceVisible,
  latestTimestamp,
  learningHubPath,
  newestCards,
  planCatalog,
  resourcePath,
  toGuidePage,
  type CatalogPlan,
  type GuidePage,
  type LearningCard,
  type LearningHubDoc,
  type LearningHubSitemap,
  type ResourceDoc,
} from "@/lib/learning-hub/catalog-view";
import { getPublicationAlternates } from "@/lib/publications/alternates";
import { toPublicationDetail, type PublicationDetail } from "@/lib/publications/detail-view";
import { isPublicDownload } from "@/lib/publications/file-access";
import {
  buildFacets,
  inIdOrder,
  planIndex,
  termIds,
  toIndexItem,
  toIndexRef,
  type IndexFacets,
  type IndexItem,
  type IndexPlan,
} from "@/lib/publications/index-view";
import { toTsqueryText } from "@/lib/publications/search-terms";
import { redirectPath } from "@/lib/publications/slug-redirect";
import { isCmsEnabled } from "@/payload/env";
import { SLUG_PATTERN } from "@/payload/fields/slug";

export type { LearningHubSitemap, SitemapPublication };

/**
 * Server-only. Public read layer for locale-prefixed pages (DEC-005, DEC-021).
 *
 * Every read here runs as an anonymous visitor through the Local API, so
 * Payload access control limits publications to published + public
 * (M3-02, P1 A). Rules for public code:
 * - never pass `overrideAccess: true`, `draft: true` or a `user` (the
 *   exceptions, the staff previews of getPublicationDetail and getAboutPage,
 *   go through lib/cms/staff-preview.ts);
 * - always pass `fallbackLocale: false` (no text of another language);
 * - filter linked-entry records by their own `locale` field.
 *
 * The one read outside the Local API is the index search (M3-06, DECISIONS
 * §2.12, ADR-0007): raw SQL in lib/cms/publication-search-query.ts, run by
 * getPublicationIndex only. It is held to the same result in four layers:
 * (1) its WHERE repeats PUBLIC_PUBLICATION_READ and the record `locale` on
 * the main table only; (2) it reads taxonomy names of the route locale only;
 * (3) it returns ids and ranks only, and planIndex keeps the ids that the
 * anonymous scan (findIndexRefs) returned; (4) the rows of the page come
 * from the anonymous findIndexPage.
 *
 * SEO reads (M3-07, DEC-021): the 308 of an old slug reads the slug history
 * `publication-slugs` (rows only say which record last published a URL) and
 * then the target record as an anonymous visitor, so it only names a URL
 * visitors can open; the sitemap and the Open Graph title read published +
 * public records like the detail page.
 *
 * File downloads (M3-08, DECISIONS §2.14): the detail page gets the public
 * files without any storage location (toPublicationDetail), and the
 * download route asks getPublicFileDownload, which reads the file and its
 * publication anonymously and only then signs a 60 s URL.
 *
 * About page (M3-09, DECISIONS §2.15): the `about` global is read
 * anonymously too (published version only, this locale only); a locale's
 * page exists only when isAboutVisible (required fields, EN checkbox).
 * getAboutPage, getAboutHref and getPublicAboutLocales share one cached
 * read per locale and request.
 *
 * Learning Hub (M3-11/12, DECISIONS §2.16): `learning-resources` and the
 * `learning-hub` global are read anonymously too (published only, public
 * types only: never a toolkit before M3-13, this locale only); a resource
 * shows in a locale only when isResourceVisible, and a locale's catalog,
 * menu item, homepage block and sitemap entries exist only with at least
 * one visible resource. The catalog, the link, the homepage block and the
 * sitemap share one cached read per locale and request.
 *
 * Returns `{ status: "off" }` (detail, redirect, title: `null`; sitemap:
 * `[]`) when the CMS is off (see payload/env.ts).
 */

/**
 * Data of the homepage `/` (M3-04, DECISIONS §2.7): the newest Indonesian
 * publications and the active topics, read at request time. Deduplicated per
 * request by React `cache` (the hero cover and the sections both ask).
 * A failed read is logged with the error name only (P3 A) and gives
 * `{ status: "error" }`; the page still answers 200.
 */
export const getHomepageData = cache(async (): Promise<HomepageData> => {
  if (!isCmsEnabled()) return { status: "off" };
  try {
    const payload = await getPayload({ config });
    const publications = await findHomepagePublications(payload);
    const topics = await findActiveTopics(payload);
    return { status: "ok", publications: publications.map(toHomePublication), topics: toHomeTopics(topics) };
  } catch (error) {
    console.error("[homepage] CMS read failed:", readErrorLabel(error));
    return { status: "error" };
  }
});

export type PublicationIndexResult =
  | { status: "off" }
  | { status: "error" }
  | { status: "ok"; plan: IndexPlan; items: IndexItem[]; facets: IndexFacets };

/**
 * One URL of the publication index `/{locale}/publications` (M3-05,
 * DECISIONS §2.11 P1 A–P5 A; search M3-06, §2.12): state, rows of the page
 * and filter options. `q` is the normalized search text (readIndexQuery).
 * Primitive arguments, so React `cache` gives generateMetadata and the page
 * the same read. A failed read is logged with the error name only (P15 A)
 * and gives `{ status: "error" }`; the page still answers 200 (noindex).
 * Read at request time (no `"use cache"`), so a publish or unpublish shows
 * on the next request.
 */
export const getPublicationIndex = cache(
  async (
    locale: Locale,
    q?: string,
    type?: string,
    topic?: string,
    year?: string,
    page?: string,
  ): Promise<PublicationIndexResult> => {
    if (!isCmsEnabled()) return { status: "off" };
    try {
      const payload = await getPayload({ config });
      const refs = (await findIndexRefs(payload, locale)).map(toIndexRef);
      const ids = termIds(refs);
      const types = await findIndexTerms(payload, "publication-types", locale, ids.types);
      const topics = await findIndexTerms(payload, "topics", locale, ids.topics);
      const facets = buildFacets(refs, types, topics, locale);
      // A search text without any word (only punctuation) matches nothing, without a query.
      const tsquery = q ? toTsqueryText(q) : null;
      const ranks = tsquery
        ? await findSearchRanks((query) => (payload.db as unknown as PostgresAdapter).drizzle.execute(query), locale, tsquery)
        : new Map<number, number>();
      const plan = planIndex({ query: { q, type, topic, year, page }, refs, facets, ranks });
      const docs = await findIndexPage(payload, locale, plan.pageIds);
      const items = inIdOrder(docs, plan.pageIds).map((doc) => toIndexItem(doc, locale));
      return { status: "ok", plan, items, facets };
    } catch (error) {
      console.error("[publications] CMS read failed:", readErrorLabel(error));
      return { status: "error" };
    }
  },
);

/**
 * Thrown by getPublicationDetail, getPublicationRedirect,
 * getSitemapPublications, getPublicPublicationTitle and
 * getPublicFileDownload when the CMS read fails. Fixed message and no cause, so nothing of the database error (host,
 * user) reaches the page or the logs of Next.js.
 */
export class PublicationReadError extends Error {
  constructor() {
    super("Publication could not be loaded");
    this.name = "PublicationReadError";
  }
}

export type PublicationDetailResult = {
  mode: "public" | "preview";
  publication: PublicationDetail;
  /** Paths of the published + public records of the Translation Group, by locale ({} without a counterpart). */
  alternates: Partial<Record<Locale, string>>;
};

/**
 * The detail page `/{locale}/publications/{slug}` (M3-05, DECISIONS §2.11
 * P7 A, P8 A): the published + public record of this locale, or null (the
 * page calls notFound()). Deduplicated per request by React `cache`
 * (generateMetadata and the page). A failed read is logged with the error
 * name only and throws PublicationReadError; the page catches it and renders
 * its error state (P15 A as amended 2026-11-13: HTTP 200 + noindex).
 *
 * Staff preview (P11 A): only in Draft Mode, and only when the request's
 * Payload session is an Editor or Admin (checked on every request), the
 * latest version is read through lib/cms/staff-preview.ts and `mode` is
 * "preview". A Draft Mode cookie without a staff session gets exactly the
 * public result.
 */
export const getPublicationDetail = cache(
  async (locale: Locale, slug: string): Promise<PublicationDetailResult | null> => {
    if (!isCmsEnabled()) return null;
    // Request APIs outside the try: Next's own errors must pass through.
    const { isEnabled } = await draftMode();
    const requestHeaders = isEnabled ? await headers() : null;
    try {
      const payload = await getPayload({ config });
      const staff = requestHeaders ? await staffFromHeaders(payload, requestHeaders) : null;
      const doc = staff
        ? await findDraftPublication(payload, locale, slug, staff)
        : await findPublicPublication(payload, locale, slug);
      if (!doc) return null;
      const alternates = await getPublicationAlternates(payload, doc);
      return { mode: staff ? "preview" : "public", publication: toPublicationDetail(doc, locale), alternates };
    } catch (error) {
      console.error("[publication-detail] CMS read failed:", readErrorLabel(error));
      throw new PublicationReadError();
    }
  },
);

/**
 * Where an old publication URL goes (M3-07, DECISIONS §2.11 P9 A): the
 * current detail path of the record that last published `slug` as public in
 * this locale, when visitors can see that record now (published + public,
 * same locale, read anonymously); else null (the page calls notFound()).
 * The page asks only after getPublicationDetail found nothing, so a live
 * slug always wins over the history. Rows point to the record, so a chain
 * A → B → C gives C in one step. Deduplicated per request by React `cache`
 * (generateMetadata and the page). A failed read is logged with the error
 * name only and throws PublicationReadError (the page's error state).
 */
export const getPublicationRedirect = cache(async (locale: Locale, slug: string): Promise<string | null> => {
  if (!isCmsEnabled()) return null;
  try {
    const payload = await getPayload({ config });
    const owner = await findSlugOwner(payload, locale, slug);
    if (owner === null) return null;
    return redirectPath(locale, slug, await findPublicRef(payload, owner));
  } catch (error) {
    console.error("[publication-redirect] CMS read failed:", readErrorLabel(error));
    throw new PublicationReadError();
  }
});

/**
 * The detail pages of the sitemap (M3-07, DEC-021): every published + public
 * record of both locales with its `updatedAt`, read at request time (no
 * `"use cache"`, so no cache tag to revalidate; a publish or unpublish shows
 * on the next request). A failed read is logged with the error name only and
 * throws PublicationReadError.
 */
export const getSitemapPublications = cache(async (): Promise<SitemapPublication[]> => {
  if (!isCmsEnabled()) return [];
  try {
    const payload = await getPayload({ config });
    return await findSitemapPublications(payload);
  } catch (error) {
    console.error("[sitemap] CMS read failed:", readErrorLabel(error));
    throw new PublicationReadError();
  }
});

/**
 * Signed download URL of a publication file, or null (M3-08, DECISIONS
 * §2.14 items 2, 3 and 6; route app/api/files/[fileId]/download). Checks on
 * the server, as an anonymous visitor, on every request:
 * 1. the file is readable anonymously: ready + public (PUBLIC_FILE_READ);
 * 2. the live version of a publication record lists it and that record is
 *    published + public (PUBLIC_PUBLICATION_READ; `draft: false`, so a file
 *    only in a draft finds nothing and an unpublish applies at once);
 * 3. the file is a ready PDF and the stricter of both levels is public
 *    (isPublicDownload);
 * then signs a GET URL valid for 60 s that makes storage answer
 * `Content-Disposition: attachment` (lib/cms/publication-file-storage.ts).
 * Null for every denial. A failed read is logged with the error name only
 * and throws PublicationReadError; a failed signing throws
 * FileStorageError. The URL is never logged. Not cached: every request runs
 * the checks.
 */
export async function getPublicFileDownload(fileId: number): Promise<string | null> {
  if (!isCmsEnabled()) return null;
  let checked: StoredFile | null;
  try {
    const payload = await getPayload({ config });
    const file = await findPublicFile(payload, fileId);
    const publication = file ? await findLivePublicationOfFile(payload, fileId) : null;
    checked = file && publication && isPublicDownload(publication.accessLevel, file) ? file : null;
  } catch (error) {
    console.error("[file-download] CMS read failed:", readErrorLabel(error));
    throw new PublicationReadError();
  }
  if (!checked) return null;
  try {
    return await signedFileUrl(checked);
  } catch (error) {
    console.error("[file-download] signing failed:", readErrorLabel(error));
    throw new FileStorageError();
  }
}

/**
 * Title of the published + public record of this locale with this slug, or
 * null (M3-07, generated Open Graph image of a detail page). A failed read is
 * logged with the error name only and throws PublicationReadError.
 */
export const getPublicPublicationTitle = cache(async (locale: Locale, slug: string): Promise<string | null> => {
  if (!isCmsEnabled()) return null;
  try {
    const payload = await getPayload({ config });
    return await findPublicTitle(payload, locale, slug);
  } catch (error) {
    console.error("[og-image] CMS read failed:", readErrorLabel(error));
    throw new PublicationReadError();
  }
});

/**
 * Thrown by getAboutPage and getPublicAboutLocales when the CMS read fails
 * (M3-09). Fixed message and no cause, as PublicationReadError.
 */
export class AboutReadError extends Error {
  constructor() {
    super("About page could not be loaded");
    this.name = "AboutReadError";
  }
}

/**
 * The published `about` global in this locale when visitors can see that
 * locale's page (isAboutVisible), else null. Anonymous read; one per locale
 * and request (React `cache`); errors propagate to the caller, which logs
 * the error name only.
 */
const readVisibleAbout = cache(async (locale: Locale) => {
  const payload = await getPayload({ config });
  const doc = await findPublicAbout(payload, locale);
  return doc && isAboutVisible(doc, locale) ? doc : null;
});

export type AboutPageResult = {
  mode: "public" | "preview";
  about: AboutPage;
  /** Paths of both locales' public About pages when both exist; else {} (no hreflang). Always {} in preview. */
  alternates: Partial<Record<Locale, string>>;
};

/**
 * The About page `/{locale}/about` (M3-09, DECISIONS §2.15 decisions 1, 3,
 * 4 + 4b(iii), 7B, 8): the published version of this locale when it is
 * visible, or null (the page calls notFound()). Read at request time, so a
 * publish or unpublish shows on the next request without a deploy (SRS
 * FR-020). Deduplicated per request by React `cache` (generateMetadata and
 * the page). A failed read is logged with the error name only and throws
 * AboutReadError (the page's error state, HTTP 200 + noindex).
 *
 * Staff preview (decision 7B): only in Draft Mode, and only when the
 * request's Payload session is an Editor or Admin (checked on every
 * request), the latest version of this locale is read through
 * lib/cms/staff-preview.ts and `mode` is "preview" (also without the EN
 * checkbox; null without an H1). A Draft Mode cookie without a staff
 * session gets exactly the public result.
 */
export const getAboutPage = cache(async (locale: Locale): Promise<AboutPageResult | null> => {
  if (!isCmsEnabled()) return null;
  // Request APIs outside the try: Next's own errors must pass through.
  const { isEnabled } = await draftMode();
  const requestHeaders = isEnabled ? await headers() : null;
  try {
    const payload = await getPayload({ config });
    const staff = requestHeaders ? await staffFromHeaders(payload, requestHeaders) : null;
    if (staff) {
      const draft = await findDraftAbout(payload, locale, staff);
      const about = draft ? toAboutPage(draft, locale) : null;
      return about ? { mode: "preview", about, alternates: {} } : null;
    }
    const doc = await readVisibleAbout(locale);
    const about = doc ? toAboutPage(doc, locale) : null;
    if (!about) return null;
    const other = otherLocale(locale);
    const counterpart = await readVisibleAbout(other);
    const alternates = counterpart ? { [locale]: aboutPath(locale), [other]: aboutPath(other) } : {};
    return { mode: "public", about, alternates };
  } catch (error) {
    console.error("[about] CMS read failed:", readErrorLabel(error));
    throw new AboutReadError();
  }
});

/**
 * Path of this locale's About page when visitors can see it, else null
 * (M3-09 decision 5: the header and homepage links show only then). Never
 * throws: with the CMS off null; a failed read is logged with the error name
 * only and gives null, so a link never breaks the page around it.
 */
export const getAboutHref = cache(async (locale: Locale): Promise<string | null> => {
  if (!isCmsEnabled()) return null;
  try {
    return (await readVisibleAbout(locale)) ? aboutPath(locale) : null;
  } catch (error) {
    console.error("[about-link] CMS read failed:", readErrorLabel(error));
    return null;
  }
});

/**
 * Thrown by getLearningHubCatalog, getLearningResource and
 * getLearningHubSitemap when the CMS read fails (M3-11/12). Fixed message
 * and no cause, as PublicationReadError.
 */
export class LearningHubReadError extends Error {
  constructor() {
    super("Learning Hub could not be loaded");
    this.name = "LearningHubReadError";
  }
}

/**
 * Every published resource of a public type in this locale, read
 * anonymously (lib/cms/learning-hub-query.ts); callers keep the visible ones
 * (isResourceVisible). One read per locale and request (React `cache`),
 * shared by the catalog, the menu link, the homepage block and the sitemap;
 * errors propagate to the caller, which logs the error name only.
 */
const readPublicResources = cache(async (locale: Locale): Promise<ResourceDoc[]> => {
  const payload = await getPayload({ config });
  return (await findPublicResources(payload, locale)) as ResourceDoc[];
});

/** The published `learning-hub` global in this locale, or null; one read per locale and request. */
const readLearningHubTexts = cache(async (locale: Locale): Promise<LearningHubDoc | null> => {
  const payload = await getPayload({ config });
  return (await findPublicLearningHub(payload, locale)) as LearningHubDoc | null;
});

function hasVisibleResource(docs: ResourceDoc[], locale: Locale): boolean {
  return docs.some((doc) => isResourceVisible(doc, locale));
}

export type LearningHubCatalogResult = {
  plan: CatalogPlan;
  /** Both catalog paths when both locales have a catalog; else {} (no hreflang). */
  alternates: Partial<Record<Locale, string>>;
};

/**
 * The Learning Hub catalog `/{locale}/learning-hub` (M3-12, DECISIONS §2.16
 * decisions 10A, 11A, 13A): the plan of this locale's visible resources and
 * the published catalog texts, or null when no resource is visible in this
 * locale (the page calls notFound()) or the CMS is off. Read at request
 * time, so a publish or unpublish shows on the next request. Deduplicated
 * per request by React `cache` (generateMetadata and the page). A failed
 * read is logged with the error name only and throws LearningHubReadError
 * (the page's error state, HTTP 200 + noindex). No staff preview: videos and
 * playlists are checked after publishing (decision 12A).
 */
export const getLearningHubCatalog = cache(async (locale: Locale): Promise<LearningHubCatalogResult | null> => {
  if (!isCmsEnabled()) return null;
  try {
    const plan = planCatalog(await readPublicResources(locale), locale, await readLearningHubTexts(locale));
    if (!plan) return null;
    const other = otherLocale(locale);
    const both = hasVisibleResource(await readPublicResources(other), other);
    return { plan, alternates: both ? { [locale]: learningHubPath(locale), [other]: learningHubPath(other) } : {} };
  } catch (error) {
    console.error("[learning-hub] CMS read failed:", readErrorLabel(error));
    throw new LearningHubReadError();
  }
});

export type LearningResourceResult = {
  mode: "public" | "preview";
  guide: GuidePage;
  /** Paths of this guide in both locales when visitors can see both; else {} (no hreflang). Always {} in preview. */
  alternates: Partial<Record<Locale, string>>;
};

/**
 * A guide's detail page `/{locale}/learning-hub/{slug}` (M3-12, decisions
 * 6A, 7A, 13A): the published guide of this locale with this slug when it
 * is visible, or null (the page calls notFound()). Videos and playlists
 * have no detail page; toolkits are never public before M3-13. Deduplicated
 * per request by React `cache`. A failed read is logged with the error name
 * only and throws LearningHubReadError.
 *
 * Staff preview (decision 12A): only in Draft Mode, and only when the
 * request's Payload session is an Editor or Admin (checked on every
 * request), the latest version of the guide with this slug in this locale
 * is read through lib/cms/staff-preview.ts and `mode` is "preview" (also
 * without the EN checkbox; null without a title). A Draft Mode cookie
 * without a staff session gets exactly the public result.
 */
export const getLearningResource = cache(async (locale: Locale, slug: string): Promise<LearningResourceResult | null> => {
  if (!isCmsEnabled() || !SLUG_PATTERN.test(slug)) return null;
  // Request APIs outside the try: Next's own errors must pass through.
  const { isEnabled } = await draftMode();
  const requestHeaders = isEnabled ? await headers() : null;
  try {
    const payload = await getPayload({ config });
    const staff = requestHeaders ? await staffFromHeaders(payload, requestHeaders) : null;
    if (staff) {
      const draft = (await findDraftGuide(payload, locale, slug, staff)) as ResourceDoc | null;
      const guide = draft ? toGuidePage(draft, locale) : null;
      return guide ? { mode: "preview", guide, alternates: {} } : null;
    }
    const doc = (await findPublicGuide(payload, locale, slug)) as ResourceDoc | null;
    const guide = doc && isResourceVisible(doc, locale) ? toGuidePage(doc, locale) : null;
    if (!doc || !guide) return null;
    const other = otherLocale(locale);
    const counterpart = (await findPublicResource(payload, doc.id, other)) as ResourceDoc | null;
    const otherPath = counterpart && isResourceVisible(counterpart, other) ? resourcePath(other, counterpart.slug) : null;
    const alternates = otherPath ? { [locale]: resourcePath(locale, guide.slug) ?? "", [other]: otherPath } : {};
    return { mode: "public", guide, alternates };
  } catch (error) {
    console.error("[learning-resource] CMS read failed:", readErrorLabel(error));
    throw new LearningHubReadError();
  }
});

/**
 * Path of this locale's Learning Hub catalog when it exists (at least one
 * visible resource), else null (decision 11A: the header and footer menu
 * item shows only then). Never throws: with the CMS off null; a failed read
 * is logged with the error name only and gives null.
 */
export const getLearningHubHref = cache(async (locale: Locale): Promise<string | null> => {
  if (!isCmsEnabled()) return null;
  try {
    return hasVisibleResource(await readPublicResources(locale), locale) ? learningHubPath(locale) : null;
  } catch (error) {
    console.error("[learning-hub-link] CMS read failed:", readErrorLabel(error));
    return null;
  }
});

export type HomeLearningHub = {
  /** `/id/learning-hub`. */
  href: string;
  /** The published ID catalog H1, else "Learning Hub". */
  title: string;
  /** The published ID catalog intro paragraphs ([] without). */
  intro: string[];
  /** Up to 3 newest visible ID resources, newest first. */
  cards: LearningCard[];
};

/**
 * The Learning Hub block of the homepage `/` (Indonesian, decision 11A): up
 * to three newest visible ID resources and the link to `/id/learning-hub`,
 * or null when the ID catalog does not exist (no block). Never throws: with
 * the CMS off null; a failed read is logged with the error name only and
 * gives null, so the homepage never breaks.
 */
export const getHomepageLearningHub = cache(async (): Promise<HomeLearningHub | null> => {
  if (!isCmsEnabled()) return null;
  try {
    const cards = newestCards(await readPublicResources("id"), "id");
    if (cards.length === 0) return null;
    const texts = catalogTexts(await readLearningHubTexts("id"));
    return { href: learningHubPath("id"), title: texts.title, intro: texts.intro, cards };
  } catch (error) {
    console.error("[home-learning-hub] CMS read failed:", readErrorLabel(error));
    return null;
  }
});

/**
 * The Learning Hub entries of the sitemap (decision 13A): the catalog of
 * each locale that exists, with the latest `updatedAt` of its visible
 * resources and published texts, and every visible guide with its
 * `updatedAt`. With the CMS off empty. A failed read is logged with the
 * error name only and throws LearningHubReadError.
 */
export const getLearningHubSitemap = cache(async (): Promise<LearningHubSitemap> => {
  const sitemap: LearningHubSitemap = { catalogs: [], guides: [] };
  if (!isCmsEnabled()) return sitemap;
  try {
    for (const locale of LOCALES) {
      const visible = (await readPublicResources(locale)).filter((doc) => isResourceVisible(doc, locale));
      if (visible.length === 0) continue;
      const texts = await readLearningHubTexts(locale);
      sitemap.catalogs.push({ locale, lastModified: latestTimestamp([...visible.map((doc) => doc.updatedAt), texts?.updatedAt]) });
      for (const doc of visible) {
        if (doc.type !== "guide" || typeof doc.slug !== "string") continue;
        sitemap.guides.push({ locale, slug: doc.slug, lastModified: typeof doc.updatedAt === "string" ? doc.updatedAt : null });
      }
    }
    return sitemap;
  } catch (error) {
    console.error("[sitemap] CMS read failed:", readErrorLabel(error));
    throw new LearningHubReadError();
  }
});

export type PublicAboutLocale = { locale: Locale; updatedAt: string | null };

/**
 * The locales whose About page visitors can see, with the global's
 * `updatedAt` (sitemap, M3-09 decision 8). With the CMS off []. A failed
 * read is logged with the error name only and throws AboutReadError.
 */
export const getPublicAboutLocales = cache(async (): Promise<PublicAboutLocale[]> => {
  if (!isCmsEnabled()) return [];
  try {
    const visible: PublicAboutLocale[] = [];
    for (const locale of LOCALES) {
      const doc = await readVisibleAbout(locale);
      if (doc) visible.push({ locale, updatedAt: typeof doc.updatedAt === "string" ? doc.updatedAt : null });
    }
    return visible;
  } catch (error) {
    console.error("[sitemap] CMS read failed:", readErrorLabel(error));
    throw new AboutReadError();
  }
});
