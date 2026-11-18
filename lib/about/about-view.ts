import {
  paragraphs,
  text,
  toCtas,
  toStructuredSections,
  type CtaDoc,
  type SectionDoc,
  type StructuredCta,
  type StructuredItem,
  type StructuredList,
  type StructuredSection,
  type Text,
} from "@/lib/content/structured-sections";
import type { Locale } from "@/lib/i18n/locales";
import { aboutPath } from "@/lib/publications/preview";

export { aboutPath, paragraphs };

/**
 * About page view model (M3-09, DECISIONS §2.15 decisions 2, 3, 4 + 4b(iii),
 * 14). Pure: no I/O, no Payload import at runtime. lib/cms/public-content.ts
 * reads the `about` global (payload/globals/About.ts) and maps it through
 * these functions; app/[locale]/about/page.tsx renders the result.
 *
 * The section rules (trimming, paragraphs, CTA hrefs from code, dropped
 * sections/lists/items/anchors) live in lib/content/structured-sections.ts
 * since M3-11, shared with the Learning Hub guides; the About types below
 * are aliases of those types.
 */

export type AboutCta = StructuredCta;

export type AboutItem = StructuredItem;

export type AboutList = StructuredList;

export type AboutSection = StructuredSection;

export type AboutPage = {
  locale: Locale;
  eyebrow: string | null;
  title: string;
  lead: string[];
  ctas: AboutCta[];
  sections: AboutSection[];
  /** `<title>` and meta description; always set on a public page (isAboutVisible), possibly null in a staff preview. */
  seoTitle: string | null;
  seoDescription: string | null;
};

/** The `about` global as one locale's Local API read returns it (payload-types `About` fits). */
export type AboutDoc = {
  hero?: { eyebrow?: Text; title?: Text; lead?: Text; ctas?: CtaDoc[] | null } | null;
  sections?: SectionDoc[] | null;
  seo?: { title?: Text; description?: Text } | null;
  contactEmail?: Text;
  enReady?: boolean | null;
  _status?: string | null;
  updatedAt?: string | null;
};

/** A plain address without spaces or markup characters (the CMS field already checks the format). */
const EMAIL_PATTERN = /^[^\s@<>"'()]+@[^\s@<>"'()]+\.[^\s@<>"'()]+$/;

/**
 * Whether `/{locale}/about` exists for visitors (decisions 3, 4 + 4b(iii)):
 * the read is the published version (the public read layer reads anonymously,
 * payload/access/public-read.ts PUBLIC_ABOUT_READ), its required fields of
 * this locale are filled (H1, SEO title, meta description), and for EN the
 * staff checkbox "Versi EN siap tayang" is checked.
 */
export function isAboutVisible(doc: AboutDoc | null | undefined, locale: Locale): boolean {
  if (!doc || doc._status !== "published") return false;
  if (!text(doc.hero?.title) || !text(doc.seo?.title) || !text(doc.seo?.description)) return false;
  return locale === "id" || doc.enReady === true;
}

/**
 * One locale of the `about` global as the page renders it, or null without
 * an H1 (`hero.title`). Visibility is a separate check (isAboutVisible): the
 * staff preview renders a draft that visitors cannot see.
 */
export function toAboutPage(doc: AboutDoc, locale: Locale): AboutPage | null {
  const title = text(doc.hero?.title);
  if (!title) return null;
  const email = text(doc.contactEmail);
  const validEmail = email && EMAIL_PATTERN.test(email) ? email : null;
  const { sections, anchors } = toStructuredSections(doc.sections, { locale, email: validEmail });
  return {
    locale,
    eyebrow: text(doc.hero?.eyebrow),
    title,
    lead: paragraphs(doc.hero?.lead),
    ctas: toCtas(doc.hero?.ctas, { locale, anchors, email: validEmail }),
    sections,
    seoTitle: text(doc.seo?.title),
    seoDescription: text(doc.seo?.description),
  };
}
