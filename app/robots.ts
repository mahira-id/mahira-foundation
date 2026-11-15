import type { MetadataRoute } from "next";

import { robotsFor } from "@/lib/seo/metadata";
import { isProductionDeployment } from "@/lib/seo/site";

/**
 * robots.txt (M3-07, DEC-021, Owner M3-07 decision 4): Production allows
 * crawling and lists https://mahira.id/sitemap.xml; every other deployment
 * (Preview, local) answers `Disallow: /`. Static: `VERCEL_ENV` is fixed per
 * Vercel build, so the file is prerendered at build time.
 */
export default function robots(): MetadataRoute.Robots {
  return robotsFor(isProductionDeployment());
}
