import config from "@payload-config";
import { draftMode, headers } from "next/headers";
import { getPayload } from "payload";
import { cache } from "react";
import { findActiveTopics, findHomepagePublications } from "@/lib/cms/homepage-query";
import { findPublicPublication } from "@/lib/cms/publication-detail-query";
import { findIndexPage, findIndexRefs, findIndexTerms } from "@/lib/cms/publication-index-query";
import { findDraftPublication, staffFromHeaders } from "@/lib/cms/staff-preview";
import { readErrorLabel, toHomePublication, toHomeTopics, type HomepageData } from "@/lib/home/homepage-view";
import type { Locale } from "@/lib/i18n/locales";
import { getPublicationAlternates } from "@/lib/publications/alternates";
import { toPublicationDetail, type PublicationDetail } from "@/lib/publications/detail-view";
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
import { isCmsEnabled } from "@/payload/env";

/**
 * Server-only. Public read layer for locale-prefixed pages (DEC-005, DEC-021).
 *
 * Every read here runs as an anonymous visitor through the Local API, so
 * Payload access control limits publications to published + public
 * (M3-02, P1 A). Rules for public code:
 * - never pass `overrideAccess: true`, `draft: true` or a `user` (the one
 *   exception, the staff preview of getPublicationDetail, goes through
 *   lib/cms/staff-preview.ts);
 * - always pass `fallbackLocale: false` (no text of another language);
 * - filter linked-entry records by their own `locale` field.
 *
 * Returns `{ status: "off" }` (detail: `null`) when the CMS is off (see payload/env.ts).
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
 * DECISIONS §2.11 P1 A–P5 A): state, rows of the page and filter options.
 * Primitive arguments, so React `cache` gives generateMetadata and the page
 * the same read. A failed read is logged with the error name only (P15 A)
 * and gives `{ status: "error" }`; the page still answers 200 (noindex).
 */
export const getPublicationIndex = cache(
  async (locale: Locale, type?: string, topic?: string, year?: string, page?: string): Promise<PublicationIndexResult> => {
    if (!isCmsEnabled()) return { status: "off" };
    try {
      const payload = await getPayload({ config });
      const refs = (await findIndexRefs(payload, locale)).map(toIndexRef);
      const ids = termIds(refs);
      const types = await findIndexTerms(payload, "publication-types", locale, ids.types);
      const topics = await findIndexTerms(payload, "topics", locale, ids.topics);
      const facets = buildFacets(refs, types, topics, locale);
      const plan = planIndex({ query: { type, topic, year, page }, refs, facets });
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
 * Thrown by getPublicationDetail when the CMS read fails. Fixed message and
 * no cause, so nothing of the database error (host, user) reaches the page
 * or the logs of Next.js.
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
