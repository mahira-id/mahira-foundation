import type { Locale } from "@/lib/i18n/locales";
import { aboutPath } from "@/lib/publications/preview";
import { SLUG_PATTERN } from "@/payload/fields/slug";

export { aboutPath };

/**
 * About page view model (M3-09, DECISIONS §2.15 decisions 2, 3, 4 + 4b(iii),
 * 14). Pure: no I/O, no Payload import at runtime. lib/cms/public-content.ts
 * reads the `about` global (payload/globals/About.ts) and maps it through
 * these functions; app/[locale]/about/page.tsx renders the result.
 *
 * Rules:
 * - every text is trimmed; an empty text is null;
 * - multi-paragraph texts are split on blank lines; the line breaks inside
 *   a paragraph become spaces;
 * - CTA hrefs are resolved here from the CTA kind, never from a stored URL:
 *   `anchor` → `#<anchor>` of a section on the page, `publications` →
 *   `/{locale}/publications`, `email` → `mailto:` the contact email. A CTA
 *   whose target is missing (no such section, no valid email) or without a
 *   label is dropped;
 * - a section without label and heading, a list without items and an item
 *   without title and text are dropped; a repeated or reserved anchor is
 *   dropped (the section stays, without an id).
 */

export type AboutCta = { label: string; href: string };

export type AboutItem = { title: string | null; subtitle: string | null; text: string | null };

export type AboutList = {
  heading: string | null;
  intro: string[];
  style: "numbered" | "bulleted";
  items: AboutItem[];
};

export type AboutSection = {
  /** Element id of the section (target of `#anchor` CTAs), or null. */
  anchor: string | null;
  label: string | null;
  heading: string | null;
  body: string[];
  quote: string | null;
  lists: AboutList[];
  outro: string[];
  ctas: AboutCta[];
};

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

type Text = string | null | undefined;
type CtaDoc = { label?: Text; kind?: string | null; anchor?: Text };
type ItemDoc = { title?: Text; subtitle?: Text; text?: Text };
type ListDoc = { heading?: Text; intro?: Text; style?: string | null; items?: ItemDoc[] | null };
type SectionDoc = {
  anchor?: Text;
  label?: Text;
  heading?: Text;
  body?: Text;
  quote?: Text;
  lists?: ListDoc[] | null;
  outro?: Text;
  ctas?: CtaDoc[] | null;
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

/** Element ids the page layout already uses; an anchor may not take them. */
const RESERVED_ANCHORS = new Set(["main"]);

/** A plain address without spaces or markup characters (the CMS field already checks the format). */
const EMAIL_PATTERN = /^[^\s@<>"'()]+@[^\s@<>"'()]+\.[^\s@<>"'()]+$/;

function text(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

/** Paragraphs of a textarea: split on blank lines, inner line breaks become spaces, empty ones dropped. */
export function paragraphs(value: unknown): string[] {
  if (typeof value !== "string") return [];
  return value
    .replace(/\r\n?/g, "\n")
    .split(/\n[ \t]*\n/)
    .map((paragraph) => paragraph.replace(/\s*\n\s*/g, " ").trim())
    .filter((paragraph) => paragraph !== "");
}

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

function toItem(doc: ItemDoc): AboutItem | null {
  const item = { title: text(doc.title), subtitle: text(doc.subtitle), text: text(doc.text) };
  return item.title === null && item.text === null ? null : item;
}

function toList(doc: ListDoc): AboutList | null {
  const items = (doc.items ?? []).map(toItem).filter((item): item is AboutItem => item !== null);
  if (items.length === 0) return null;
  return {
    heading: text(doc.heading),
    intro: paragraphs(doc.intro),
    style: doc.style === "numbered" ? "numbered" : "bulleted",
    items,
  };
}

type CtaTargets = { locale: Locale; anchors: Set<string>; email: string | null };

function toCtas(docs: CtaDoc[] | null | undefined, targets: CtaTargets): AboutCta[] {
  const ctas: AboutCta[] = [];
  for (const doc of docs ?? []) {
    const label = text(doc.label);
    if (!label) continue;
    let href: string | null = null;
    if (doc.kind === "publications") href = `/${targets.locale}/publications`;
    if (doc.kind === "email" && targets.email) href = `mailto:${targets.email}`;
    if (doc.kind === "anchor") {
      const anchor = text(doc.anchor);
      if (anchor && targets.anchors.has(anchor)) href = `#${anchor}`;
    }
    if (href) ctas.push({ label, href });
  }
  return ctas;
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
  const anchors = new Set<string>();
  const sectionDocs = (doc.sections ?? []).filter((section) => text(section.label) !== null || text(section.heading) !== null);
  const sectionAnchors = sectionDocs.map((section) => {
    const anchor = text(section.anchor);
    if (!anchor || !SLUG_PATTERN.test(anchor) || RESERVED_ANCHORS.has(anchor) || anchors.has(anchor)) return null;
    anchors.add(anchor);
    return anchor;
  });
  const targets: CtaTargets = { locale, anchors, email: email && EMAIL_PATTERN.test(email) ? email : null };
  const sections = sectionDocs.map(
    (section, index): AboutSection => ({
      anchor: sectionAnchors[index] ?? null,
      label: text(section.label),
      heading: text(section.heading),
      body: paragraphs(section.body),
      quote: text(section.quote),
      lists: (section.lists ?? []).map(toList).filter((list): list is AboutList => list !== null),
      outro: paragraphs(section.outro),
      ctas: toCtas(section.ctas, targets),
    }),
  );
  return {
    locale,
    eyebrow: text(doc.hero?.eyebrow),
    title,
    lead: paragraphs(doc.hero?.lead),
    ctas: toCtas(doc.hero?.ctas, targets),
    sections,
    seoTitle: text(doc.seo?.title),
    seoDescription: text(doc.seo?.description),
  };
}
