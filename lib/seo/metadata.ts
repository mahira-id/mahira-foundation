import type { Metadata, MetadataRoute } from "next";

import { aboutPath, type AboutPage } from "@/lib/about/about-view";
import type { SitemapPublication } from "@/lib/cms/sitemap-query";
import { LOCALES, otherLocale, type Locale } from "@/lib/i18n/locales";
import type { PublicationDetail } from "@/lib/publications/detail-view";
import { indexHref, parsePage, type IndexQuery } from "@/lib/publications/index-params";
import { indexNoindex, type IndexState } from "@/lib/publications/index-view";
import { HOME_DESCRIPTION, HOME_TITLE, OG_IMAGE_SIZE, OG_LOCALE, SITE_NAME, SITE_URL } from "@/lib/seo/site";

/**
 * SEO metadata of the public pages (M3-07, DEC-021, DECISIONS §2.13). Pure:
 * no I/O; the pages pass what the public read layer already returned
 * (published + public records of the route locale only), so nothing here can
 * name a draft, a `registered`/`subscriber` record or another locale's text.
 *
 * URLs are paths; `metadataBase` (https://mahira.id, both root layouts) makes
 * them absolute. Rules (Owner M3-07 decisions 2, 3, 5, 6):
 * - a self-referencing canonical on every indexable page; page 1 of the index
 *   has no `?page`; a URL with `q`, a filter or an invalid/failed state is
 *   `noindex, follow` and has no canonical and no hreflang;
 * - hreflang: index page 1 `id` ↔ `en`; a detail page only when the other
 *   locale's record of its Translation Group is published + public; no
 *   x-default; `/` has none;
 * - Open Graph + Twitter on every page: title, description, URL, locale,
 *   `article` on a detail page; image = the cover, else the generated
 *   typographic image of `/og/...`;
 * - no JSON-LD.
 */

type OgImage = { url: string; width: number; height: number; alt: string };

type Social = {
  type: "website" | "article";
  locale: Locale;
  title: string;
  description?: string;
  url: string;
  image: OgImage;
};

function social({ type, locale, title, description, url, image }: Social): Pick<Metadata, "openGraph" | "twitter"> {
  return {
    openGraph: { type, locale: OG_LOCALE[locale], siteName: SITE_NAME, url, title, description, images: [image] },
    twitter: { card: "summary_large_image", title, description, images: [{ url: image.url, alt: image.alt }] },
  };
}

function generatedImage(path: string, alt: string): OgImage {
  return { url: path, ...OG_IMAGE_SIZE, alt };
}

/** The homepage `/` (Indonesian only, no hreflang). */
export function homeMetadata(): Metadata {
  return {
    alternates: { canonical: "/" },
    ...social({
      type: "website",
      locale: "id",
      title: HOME_TITLE,
      description: HOME_DESCRIPTION,
      url: "/",
      image: generatedImage("/og/site", SITE_NAME),
    }),
  };
}

export const NOINDEX_FOLLOW = { index: false, follow: true } as const;

/** hreflang of index page 1: both locales. */
function indexLanguages(): Record<Locale, string> {
  return Object.fromEntries(LOCALES.map((locale) => [locale, indexHref(locale, {}, 1)])) as Record<Locale, string>;
}

/**
 * One URL of the publication index. `state` is the plan state, or "error"
 * for a failed read. `title` and `description` are the dictionary texts of
 * the locale.
 */
export function indexMetadata(
  locale: Locale,
  text: { title: string; description: string },
  query: IndexQuery,
  state: IndexState | "error",
): Metadata {
  const base = indexHref(locale, {}, 1);
  const ogTitle = `${text.title} — ${SITE_NAME}`;
  const image = generatedImage(`/og/${locale}/publications`, ogTitle);
  const common = { title: text.title, description: text.description };
  if (indexNoindex(query, state)) {
    return {
      ...common,
      robots: NOINDEX_FOLLOW,
      ...social({ type: "website", locale, title: ogTitle, description: text.description, url: base, image }),
    };
  }
  // Indexable: no filter, a valid page (indexNoindex covers page-not-found).
  const page = parsePage(query.page) ?? 1;
  const canonical = indexHref(locale, {}, page);
  return {
    ...common,
    alternates: page === 1 ? { canonical, languages: indexLanguages() } : { canonical },
    ...social({ type: "website", locale, title: ogTitle, description: text.description, url: canonical, image }),
  };
}

/**
 * A public detail page (mode "public"). `alternates` are the paths of the
 * published + public records of the Translation Group ({} without a
 * counterpart, lib/publications/alternates.ts).
 */
export function detailMetadata(publication: PublicationDetail, alternates: Partial<Record<Locale, string>>): Metadata {
  const { locale, slug, title, cover } = publication;
  const description = publication.description || undefined;
  const canonical = `/${locale}/publications/${slug}`;
  const counterpart = alternates[otherLocale(locale)];
  const image: OgImage = cover
    ? { url: cover.url, width: cover.width, height: cover.height, alt: cover.alt || title }
    : generatedImage(`/og/${locale}/publications/${slug}`, title);
  return {
    title,
    description,
    alternates: counterpart
      ? { canonical, languages: { [locale]: canonical, [otherLocale(locale)]: counterpart } }
      : { canonical },
    ...social({ type: "article", locale, title, description, url: canonical, image }),
  };
}

/**
 * The public About page (M3-09, DECISIONS §2.15 decision 8): `<title>` =
 * the SEO title as is (no site-name template; the field is the full title),
 * the meta description, a self canonical `/{locale}/about`, hreflang only
 * when both locales' pages exist (`alternates` from getAboutPage, {}
 * otherwise), Open Graph `website` with the generated site image `/og/site`.
 */
export function aboutMetadata(about: AboutPage, alternates: Partial<Record<Locale, string>>): Metadata {
  const { locale } = about;
  const title = about.seoTitle ?? about.title;
  const description = about.seoDescription ?? undefined;
  const canonical = aboutPath(locale);
  const counterpart = alternates[otherLocale(locale)];
  return {
    title: { absolute: title },
    description,
    alternates: counterpart
      ? { canonical, languages: { [locale]: canonical, [otherLocale(locale)]: counterpart } }
      : { canonical },
    ...social({ type: "website", locale, title, description, url: canonical, image: generatedImage("/og/site", SITE_NAME) }),
  };
}

/**
 * Entries of /sitemap.xml. `publications` null = CMS off (Vercel Production
 * today): only `/`. Otherwise `/`, both indexes, the About page of every
 * locale where it exists (M3-09 decision 8, with the global's `updatedAt`)
 * and every published + public detail page with its `updatedAt` (Owner
 * M3-07 decision 4).
 */
export function sitemapEntries(
  publications: SitemapPublication[] | null,
  aboutLocales: { locale: Locale; updatedAt: string | null }[] = [],
): MetadataRoute.Sitemap {
  const home = { url: `${SITE_URL}/` };
  if (publications === null) return [home];
  return [
    home,
    ...LOCALES.map((locale) => ({ url: `${SITE_URL}${indexHref(locale, {}, 1)}` })),
    ...aboutLocales.map(({ locale, updatedAt }) => ({
      url: `${SITE_URL}${aboutPath(locale)}`,
      ...(updatedAt ? { lastModified: updatedAt } : {}),
    })),
    ...publications.map((publication) => ({
      url: `${SITE_URL}/${publication.locale}/publications/${publication.slug}`,
      lastModified: publication.updatedAt,
    })),
  ];
}

/** robots.txt: crawling and the sitemap on Production only; `Disallow: /` elsewhere (Owner M3-07 decision 4). */
export function robotsFor(production: boolean): MetadataRoute.Robots {
  if (!production) return { rules: { userAgent: "*", disallow: "/" } };
  return { rules: { userAgent: "*", allow: "/" }, sitemap: `${SITE_URL}/sitemap.xml` };
}
