import type { ReactNode } from "react";

import { MahiraMark } from "@/components/brand/mahira";
import { Ctas, Paragraphs, Section } from "@/components/content/structured-sections";
import type { AboutPage } from "@/lib/about/about-view";

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
 * text is plain (no markup from the CMS). Since M3-11 the section, list and
 * CTA components live in components/content/structured-sections.tsx (shared
 * with the Learning Hub guides); the markup is unchanged.
 */
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
          <Ctas ctas={about.ctas} marker="about" tone="dark" />
        </div>
        <div className="relative h-1 bg-brand-700">
          <span className="absolute inset-y-0 left-0 w-24 bg-orange" />
        </div>
      </header>
      {about.sections.map((section, index) => (
        <Section index={index} key={index} marker="about" section={section} />
      ))}
    </main>
  );
}
