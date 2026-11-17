import type { Locale } from "@/lib/i18n/locales";
import { SLUG_PATTERN } from "@/payload/fields/slug";

/**
 * View model of the structured text sections (payload/fields/
 * structured-sections.ts): the About page since M3-09 (lib/about/
 * about-view.ts) and, since M3-11, the Learning Hub guides (DECISIONS §2.16
 * decision 3A). Pure: no I/O, no Payload import at runtime.
 *
 * Rules (unchanged from M3-09):
 * - every text is trimmed; an empty text is null;
 * - multi-paragraph texts are split on blank lines; the line breaks inside
 *   a paragraph become spaces;
 * - CTA hrefs are resolved here from the CTA kind, never from a stored URL:
 *   `anchor` → `#<anchor>` of a section on the page, `publications` →
 *   `/{locale}/publications`, `email` → `mailto:` the contact email. A CTA
 *   whose target is missing (no such section, no valid email) or without a
 *   label is dropped; without CTA targets (guides) every section has none;
 * - a section without label and heading, a list without items and an item
 *   without title and text are dropped; a repeated or reserved anchor is
 *   dropped (the section stays, without an id).
 */

export type StructuredCta = { label: string; href: string };

export type StructuredItem = { title: string | null; subtitle: string | null; text: string | null };

export type StructuredList = {
  heading: string | null;
  intro: string[];
  style: "numbered" | "bulleted";
  items: StructuredItem[];
};

export type StructuredSection = {
  /** Element id of the section (target of `#anchor` CTAs), or null. */
  anchor: string | null;
  label: string | null;
  heading: string | null;
  body: string[];
  quote: string | null;
  lists: StructuredList[];
  outro: string[];
  ctas: StructuredCta[];
};

export type Text = string | null | undefined;
export type CtaDoc = { label?: Text; kind?: string | null; anchor?: Text };
type ItemDoc = { title?: Text; subtitle?: Text; text?: Text };
type ListDoc = { heading?: Text; intro?: Text; style?: string | null; items?: ItemDoc[] | null };
export type SectionDoc = {
  anchor?: Text;
  label?: Text;
  heading?: Text;
  body?: Text;
  quote?: Text;
  lists?: ListDoc[] | null;
  outro?: Text;
  ctas?: CtaDoc[] | null;
};

/** Element ids the page layout already uses; an anchor may not take them. */
const RESERVED_ANCHORS = new Set(["main"]);

export function text(value: unknown): string | null {
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

function toItem(doc: ItemDoc): StructuredItem | null {
  const item = { title: text(doc.title), subtitle: text(doc.subtitle), text: text(doc.text) };
  return item.title === null && item.text === null ? null : item;
}

function toList(doc: ListDoc): StructuredList | null {
  const items = (doc.items ?? []).map(toItem).filter((item): item is StructuredItem => item !== null);
  if (items.length === 0) return null;
  return {
    heading: text(doc.heading),
    intro: paragraphs(doc.intro),
    style: doc.style === "numbered" ? "numbered" : "bulleted",
    items,
  };
}

/** Where CTAs may point: the page locale, the section anchors on the page, a valid contact email (or null). */
export type CtaTargets = { locale: Locale; anchors: Set<string>; email: string | null };

export function toCtas(docs: CtaDoc[] | null | undefined, targets: CtaTargets): StructuredCta[] {
  const ctas: StructuredCta[] = [];
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
 * The sections of one locale as the page renders them, and the set of
 * section anchors on the page (for CTAs outside the sections, e.g. the
 * About hero). `ctaTargets` null: no CTA at all (guides have none).
 */
export function toStructuredSections(
  docs: SectionDoc[] | null | undefined,
  ctaTargets: { locale: Locale; email: string | null } | null,
): { sections: StructuredSection[]; anchors: Set<string> } {
  const anchors = new Set<string>();
  const sectionDocs = (docs ?? []).filter((section) => text(section.label) !== null || text(section.heading) !== null);
  const sectionAnchors = sectionDocs.map((section) => {
    const anchor = text(section.anchor);
    if (!anchor || !SLUG_PATTERN.test(anchor) || RESERVED_ANCHORS.has(anchor) || anchors.has(anchor)) return null;
    anchors.add(anchor);
    return anchor;
  });
  const targets: CtaTargets | null = ctaTargets ? { ...ctaTargets, anchors } : null;
  const sections = sectionDocs.map(
    (section, index): StructuredSection => ({
      anchor: sectionAnchors[index] ?? null,
      label: text(section.label),
      heading: text(section.heading),
      body: paragraphs(section.body),
      quote: text(section.quote),
      lists: (section.lists ?? []).map(toList).filter((list): list is StructuredList => list !== null),
      outro: paragraphs(section.outro),
      ctas: targets ? toCtas(section.ctas, targets) : [],
    }),
  );
  return { sections, anchors };
}
