import Link from "next/link";
import type { ReactNode } from "react";

import { MahiraMark } from "@/components/brand/mahira";
import { Paragraphs, Section } from "@/components/content/structured-sections";
import { PublicationFiles } from "@/components/publication/publication-files";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { learningHubPath, type GuidePage as GuidePageModel } from "@/lib/learning-hub/catalog-view";

/**
 * A Learning Hub guide `/{locale}/learning-hub/{slug}` (M3-12, DECISIONS
 * §2.16 decisions 3A, 6A). Server component, no data access. The sections use
 * the same components as the About page (components/content/
 * structured-sections.tsx, `marker="guide"`). A toolkit (M3-13, DECISIONS
 * §2.17 decision 6A) uses the same page (`data-lh-page="toolkit"`) and adds
 * the publication file panel after its sections, with the "Bahasa materi"
 * labels for the document language and its own preview note. Structure kept by any
 * restyling (asserted by tests/integration/learning-hub.test.ts):
 * `<main id="main" data-lh-page="guide" data-preview>` with the optional
 * preview banner first, one H1 (the guide title), the summary, the "Bahasa
 * materi" label `data-lh-language`, and one `section[data-lh-section]` per
 * structured section with an H2 (the heading, else the label). All text is
 * plain (no markup from the CMS).
 */
export function GuidePage({ guide, preview, banner }: { guide: GuidePageModel; preview: boolean; banner?: ReactNode }) {
  const labels = getDictionary(guide.locale).learningHub;
  return (
    <main data-lh-page={guide.type} data-preview={preview ? "true" : "false"} id="main">
      {banner}
      <header className="on-dark relative overflow-hidden bg-brand-500 text-white" data-lh-hero>
        <div aria-hidden="true" className="hero-grid pointer-events-none absolute inset-0 opacity-80" />
        <MahiraMark
          aria-hidden="true"
          className="pointer-events-none absolute -right-48 top-1/2 hidden h-[36rem] w-auto -translate-y-1/2 text-white/[0.045] lg:block"
        />
        <div className="container-editorial relative pt-14 pb-16 sm:pt-16 sm:pb-20 lg:pt-24 lg:pb-28">
          <p className="eyebrow text-white">
            <Link className="underline-offset-4 hover:underline" href={learningHubPath(guide.locale)}>
              {labels.backToCatalog}
            </Link>
            {guide.themeName ? <span> · {guide.themeName}</span> : null}
          </p>
          <h1 className="mt-6 max-w-4xl text-[clamp(2.25rem,5.4vw,4.75rem)] font-extrabold leading-[1] tracking-[-0.04em] text-balance">{guide.title}</h1>
          <Paragraphs className="mt-8 max-w-2xl space-y-5 text-base leading-relaxed text-white sm:text-lg" items={guide.summary} />
          {guide.materialLanguage ? (
            <p className="mt-6 text-sm font-semibold text-white" data-lh-language={guide.materialLanguage}>
              {labels.materialLanguage[guide.materialLanguage]}
            </p>
          ) : null}
        </div>
        <div className="relative h-1 bg-brand-700">
          <span className="absolute inset-y-0 left-0 w-24 bg-orange" />
        </div>
      </header>
      {guide.sections.map((section, index) => (
        <Section index={index} key={index} marker="guide" section={section} />
      ))}
      {guide.type === "toolkit" ? (
        <div className="container-editorial pb-16 sm:pb-20">
          <PublicationFiles
            files={guide.files}
            languageLabel={(language) => labels.materialLanguage[language]}
            locale={guide.locale}
            preview={preview}
            previewNote={labels.filesPreviewNote}
          />
        </div>
      ) : null}
    </main>
  );
}