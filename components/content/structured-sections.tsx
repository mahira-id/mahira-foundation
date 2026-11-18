import Link from "next/link";

import { ArrowIcon } from "@/components/ui/icons";
import type { StructuredCta, StructuredList, StructuredSection } from "@/lib/content/structured-sections";

/**
 * Presentation of the structured text sections (payload/fields/
 * structured-sections.ts): the About page (M3-09) and, since M3-11, the
 * Learning Hub guides (DECISIONS §2.16 decision 3A). Server components, no
 * data access. Moved out of components/about/about-content.tsx without a
 * change of markup: `marker` only picks the test hooks, `data-about-*` on the
 * About page and `data-lh-*` on a guide. Plain text only (no markup from the
 * CMS); existing classes and tokens only.
 */
export type SectionMarker = "about" | "guide";

function attributes(marker: SectionMarker) {
  const prefix = marker === "about" ? "about" : "lh";
  return (name: string, value: string | true = true): Record<string, string | true> => ({ [`data-${prefix}-${name}`]: value });
}

export function Paragraphs({ items, className }: { items: string[]; className: string }) {
  if (items.length === 0) return null;
  return (
    <div className={className}>
      {items.map((paragraph, index) => (
        <p key={index}>{paragraph}</p>
      ))}
    </div>
  );
}

/** Internal paths use `Link`; anchors and `mailto:` are plain links. */
function CtaLink({ cta, className, marker }: { cta: StructuredCta; className: string; marker: SectionMarker }) {
  const attr = attributes(marker);
  const content = (
    <>
      {cta.label}
      <ArrowIcon className="h-3.5 w-3.5" />
    </>
  );
  if (cta.href.startsWith("/")) {
    return (
      <Link className={className} {...attr("cta")} href={cta.href}>
        {content}
      </Link>
    );
  }
  return (
    <a className={className} {...attr("cta")} href={cta.href}>
      {content}
    </a>
  );
}

export function Ctas({ ctas, tone, marker }: { ctas: StructuredCta[]; tone: "dark" | "light"; marker: SectionMarker }) {
  if (ctas.length === 0) return null;
  const attr = attributes(marker);
  const classes = tone === "dark" ? ["btn btn-light", "btn btn-ghost-light"] : ["btn btn-primary", "btn btn-outline-dark"];
  return (
    <div className="mt-10 flex flex-wrap gap-3" {...attr("ctas")}>
      {ctas.map((cta, index) => (
        <CtaLink className={classes[Math.min(index, 1)] as string} cta={cta} key={index} marker={marker} />
      ))}
    </div>
  );
}

function List({ list, marker }: { list: StructuredList; marker: SectionMarker }) {
  const attr = attributes(marker);
  const numbered = list.style === "numbered";
  const items = list.items.map((item, index) => (
    <li className="grid grid-cols-[2rem_1fr] gap-4 border-b border-line py-5 last:border-b-0" key={index}>
      {numbered ? (
        <span aria-hidden="true" className="pt-1 text-xs font-bold tabular-nums text-brand-700">
          {String(index + 1).padStart(2, "0")}
        </span>
      ) : (
        <span aria-hidden="true" className="mt-2 h-2 w-2 bg-orange" />
      )}
      <div>
        {item.title ? (
          <p className="text-base font-bold text-ink" {...attr("item-title")}>
            <strong>{item.title}</strong>
          </p>
        ) : null}
        {item.subtitle ? (
          <p className="mt-1 text-sm font-semibold text-brand-700" {...attr("item-subtitle")}>
            <strong>{item.subtitle}</strong>
          </p>
        ) : null}
        {item.text ? <p className={`${item.title || item.subtitle ? "mt-2 " : ""}text-base leading-relaxed text-muted`}>{item.text}</p> : null}
      </div>
    </li>
  ));
  return (
    <div className="mt-12 max-w-3xl" {...attr("list-block")}>
      {list.heading ? <h3 className="text-xl font-bold tracking-[-0.01em] text-ink">{list.heading}</h3> : null}
      <Paragraphs className={`${list.heading ? "mt-4 " : ""}max-w-2xl space-y-4 text-base leading-relaxed text-ink-soft`} items={list.intro} />
      {numbered ? (
        <ol className="mt-6 border-y border-line" {...attr("list", "numbered")}>
          {items}
        </ol>
      ) : (
        <ul className="mt-6 border-y border-line" {...attr("list", "bulleted")}>
          {items}
        </ul>
      )}
    </div>
  );
}

/** One section: `<section data-…-section id=anchor>` with an H2 (the heading, else the label; the label above it when both are set). */
export function Section({ section, index, marker }: { section: StructuredSection; index: number; marker: SectionMarker }) {
  const attr = attributes(marker);
  const heading = section.heading ?? section.label;
  const labelAbove = Boolean(section.heading && section.label);
  return (
    <section className={index % 2 === 0 ? "section-space bg-white" : "section-space bg-silver"} {...attr("section")} id={section.anchor ?? undefined}>
      <div className="container-editorial">
        <div className="grid gap-6 lg:grid-cols-12 lg:gap-8">
          {labelAbove ? (
            <div className="lg:col-span-3">
              <p className="eyebrow text-brand-700" {...attr("label")}>
                {section.label}
              </p>
            </div>
          ) : null}
          <div className={labelAbove ? "lg:col-span-9" : "lg:col-span-9 lg:col-start-4"}>
            <h2 className="max-w-3xl text-[clamp(1.75rem,3.4vw,2.875rem)] font-bold leading-[1.06] tracking-[-0.03em] text-balance text-ink">
              {heading}
            </h2>
            <Paragraphs className="mt-8 max-w-2xl space-y-5 text-lg leading-relaxed text-ink-soft" items={section.body} />
            {section.quote ? (
              <blockquote className="mt-10 max-w-3xl border-l-4 border-orange pl-6 md:pl-8" {...attr("quote")}>
                <p className="text-[clamp(1.375rem,2.4vw,1.875rem)] font-semibold leading-snug tracking-[-0.02em] text-ink">{section.quote}</p>
              </blockquote>
            ) : null}
            {section.lists.map((list, listIndex) => (
              <List key={listIndex} list={list} marker={marker} />
            ))}
            <Paragraphs className="mt-10 max-w-2xl space-y-5 text-lg leading-relaxed text-ink-soft" items={section.outro} />
            <Ctas ctas={section.ctas} marker={marker} tone="light" />
          </div>
        </div>
      </div>
    </section>
  );
}
