import Link from "next/link";
import type { ReactNode } from "react";

import { MahiraMark } from "@/components/brand/mahira";
import { ArrowIcon } from "@/components/ui/icons";
import type { AboutCta, AboutList, AboutPage, AboutSection } from "@/lib/about/about-view";

/**
 * Content of the About page `/{locale}/about` (M3-09, DECISIONS §2.15
 * decisions 2, 10, 14). Server component, no data access: the page passes
 * the view model of lib/about/about-view.ts. Presentation (decision 10): the
 * existing editorial register only (blue hero like the homepage, sections in
 * `container-editorial` with a reading measure, existing `btn-*` classes and
 * tokens, no new colours). Structure (kept by any restyling, asserted by
 * tests/integration/about.test.ts): `<main id="main" data-about-page="<locale>"
 * data-preview>` with the optional preview banner first, one H1 (the hero
 * title), one `<section data-about-section>` per section (`id` = its anchor)
 * with an H2 (the heading, else the label; the label above it when both are
 * set), optional `<blockquote data-about-quote>`, lists as `<ol>`/`<ul>`
 * `data-about-list="numbered|bulleted"` with an optional H3, item titles as
 * `<p data-about-item-title><strong>`, and CTA links `data-about-cta`. All
 * text is plain (no markup from the CMS).
 */
function Paragraphs({ items, className }: { items: string[]; className: string }) {
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
function CtaLink({ cta, className }: { cta: AboutCta; className: string }) {
  const content = (
    <>
      {cta.label}
      <ArrowIcon className="h-3.5 w-3.5" />
    </>
  );
  if (cta.href.startsWith("/")) {
    return (
      <Link className={className} data-about-cta href={cta.href}>
        {content}
      </Link>
    );
  }
  return (
    <a className={className} data-about-cta href={cta.href}>
      {content}
    </a>
  );
}

function Ctas({ ctas, tone }: { ctas: AboutCta[]; tone: "dark" | "light" }) {
  if (ctas.length === 0) return null;
  const classes = tone === "dark" ? ["btn btn-light", "btn btn-ghost-light"] : ["btn btn-primary", "btn btn-outline-dark"];
  return (
    <div className="mt-10 flex flex-wrap gap-3" data-about-ctas>
      {ctas.map((cta, index) => (
        <CtaLink className={classes[Math.min(index, 1)] as string} cta={cta} key={index} />
      ))}
    </div>
  );
}

function List({ list }: { list: AboutList }) {
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
          <p className="text-base font-bold text-ink" data-about-item-title>
            <strong>{item.title}</strong>
          </p>
        ) : null}
        {item.subtitle ? (
          <p className="mt-1 text-sm font-semibold text-brand-700" data-about-item-subtitle>
            <strong>{item.subtitle}</strong>
          </p>
        ) : null}
        {item.text ? <p className={`${item.title || item.subtitle ? "mt-2 " : ""}text-base leading-relaxed text-muted`}>{item.text}</p> : null}
      </div>
    </li>
  ));
  return (
    <div className="mt-12 max-w-3xl" data-about-list-block>
      {list.heading ? <h3 className="text-xl font-bold tracking-[-0.01em] text-ink">{list.heading}</h3> : null}
      <Paragraphs className={`${list.heading ? "mt-4 " : ""}max-w-2xl space-y-4 text-base leading-relaxed text-ink-soft`} items={list.intro} />
      {numbered ? (
        <ol className="mt-6 border-y border-line" data-about-list="numbered">
          {items}
        </ol>
      ) : (
        <ul className="mt-6 border-y border-line" data-about-list="bulleted">
          {items}
        </ul>
      )}
    </div>
  );
}

function Section({ section, index }: { section: AboutSection; index: number }) {
  const heading = section.heading ?? section.label;
  const labelAbove = Boolean(section.heading && section.label);
  return (
    <section className={index % 2 === 0 ? "section-space bg-white" : "section-space bg-silver"} data-about-section id={section.anchor ?? undefined}>
      <div className="container-editorial">
        <div className="grid gap-6 lg:grid-cols-12 lg:gap-8">
          {labelAbove ? (
            <div className="lg:col-span-3">
              <p className="eyebrow text-brand-700" data-about-label>
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
              <blockquote className="mt-10 max-w-3xl border-l-4 border-orange pl-6 md:pl-8" data-about-quote>
                <p className="text-[clamp(1.375rem,2.4vw,1.875rem)] font-semibold leading-snug tracking-[-0.02em] text-ink">{section.quote}</p>
              </blockquote>
            ) : null}
            {section.lists.map((list, listIndex) => (
              <List key={listIndex} list={list} />
            ))}
            <Paragraphs className="mt-10 max-w-2xl space-y-5 text-lg leading-relaxed text-ink-soft" items={section.outro} />
            <Ctas ctas={section.ctas} tone="light" />
          </div>
        </div>
      </div>
    </section>
  );
}

export function AboutContent({ about, preview, banner }: { about: AboutPage; preview: boolean; banner?: ReactNode }) {
  return (
    <main data-about-page={about.locale} data-preview={preview ? "true" : "false"} id="main">
      {banner}
      <header className="on-dark relative overflow-hidden bg-brand-500 text-white" data-about-hero>
        <div aria-hidden="true" className="hero-grid pointer-events-none absolute inset-0 opacity-80" />
        <MahiraMark
          aria-hidden="true"
          className="pointer-events-none absolute -right-48 top-1/2 hidden h-[36rem] w-auto -translate-y-1/2 text-white/[0.045] lg:block"
        />
        <div className="container-editorial relative pt-14 pb-16 sm:pt-16 sm:pb-20 lg:pt-24 lg:pb-28">
          {about.eyebrow ? (
            <p className="eyebrow text-white" data-about-eyebrow>
              {about.eyebrow}
            </p>
          ) : null}
          <h1 className={`${about.eyebrow ? "mt-6 " : ""}max-w-4xl text-[clamp(2.25rem,5.4vw,4.75rem)] font-extrabold leading-[1] tracking-[-0.04em] text-balance`}>
            {about.title}
          </h1>
          <Paragraphs className="mt-8 max-w-2xl space-y-5 text-base leading-relaxed text-white sm:text-lg" items={about.lead} />
          <Ctas ctas={about.ctas} tone="dark" />
        </div>
        <div className="relative h-1 bg-brand-700">
          <span className="absolute inset-y-0 left-0 w-24 bg-orange" />
        </div>
      </header>
      {about.sections.map((section, index) => (
        <Section index={index} key={index} section={section} />
      ))}
    </main>
  );
}
