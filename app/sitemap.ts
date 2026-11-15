import type { MetadataRoute } from "next";
import { connection } from "next/server";

import { getSitemapPublications } from "@/lib/cms/public-content";
import { sitemapEntries } from "@/lib/seo/metadata";
import { isCmsEnabled } from "@/payload/env";

/**
 * /sitemap.xml (M3-07, DEC-021, Owner M3-07 decision 4). With the CMS off
 * (Vercel Production today) it is static and lists only `/`. With the CMS on
 * it is read at request time through the public read layer (no
 * `"use cache"`, so no cache tag to revalidate; a publish or unpublish shows
 * on the next request): `/`, both indexes and every published + public
 * detail page with its `updatedAt`. A failed read throws (HTTP 500; the read
 * layer logs the error name only).
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  if (!isCmsEnabled()) return sitemapEntries(null);
  await connection();
  return sitemapEntries(await getSitemapPublications());
}
