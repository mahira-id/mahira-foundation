import Link from "next/link";
import type { ReactNode } from "react";

import { getDictionary } from "@/lib/i18n/dictionaries";
import { learningHubPath, type GuidePage as GuidePageModel } from "@/lib/learning-hub/catalog-view";

/**
 * A Learning Hub guide `/{locale}/learning-hub/{slug}` (M3-12, DECISIONS
 * §2.16 decisions 3A, 6A). Server component, no data access. Structure kept
 * by any restyling (asserted by tests/integration/learning-hub.test.ts):
 * `<main id="main" data-lh-page="guide" data-preview>` with the optional
 * preview banner first, one H1 (the guide title), the summary, the
 * "Bahasa materi" label `data-lh-language`, and one
 * `section[data-lh-section]` per structured section with an H2 (the
 * heading, else the label). All text is plain (no markup from the CMS).
 */
export function GuidePage({ guide, preview, banner }: { guide: GuidePageModel; preview: boolean; banner?: ReactNode }) {
  const labels = getDictionary(guide.locale).learningHub;
  return (
    <main data-lh-page="guide" data-preview={preview ? "true" : "false"} id="main">
      {banner}
      <header className="on-dark bg-brand-500 text-white" data-lh-hero>
        <div className="container-editorial pt-14 pb-16 sm:pt-16 sm:pb-20">
          <p className="eyebrow text-white">
            <Link className="underline-offset-4 hover:underline" href={learningHubPath(guide.locale)}>
              {labels.backToCatalog}
            </Link>
            {guide.themeName ? <span> · {guide.themeName}</span> : null}
          </p>
          <h1 className="mt-6 max-w-4xl text-[clamp(2.25rem,5.4vw,4.75rem)] font-extrabold leading-[1] tracking-[-0.04em] text-balance">{guide.title}</h1>
          <div className="mt-8 max-w-2xl space-y-5 text-base leading-relaxed text-white sm:text-lg">
            {guide.summary.map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>
          {guide.materialLanguage ? (
            <p className="mt-6 text-sm font-semibold text-white" data-lh-language={guide.materialLanguage}>
              {labels.materialLanguage[guide.materialLanguage]}
            </p>
          ) : null}
        </div>
      </header>
      {guide.sections.map((section, index) => (
        <section className="section-space bg-white" data-lh-section id={section.anchor ?? undefined} key={index}>
          <div className="container-editorial max-w-3xl">
            <h2 className="text-[clamp(1.75rem,3.4vw,2.875rem)] font-bold leading-[1.06] tracking-[-0.03em] text-ink">{section.heading ?? section.label}</h2>
            {section.body.map((paragraph, bodyIndex) => (
              <p className="mt-5 text-lg leading-relaxed text-ink-soft" key={bodyIndex}>
                {paragraph}
              </p>
            ))}
            {section.quote ? (
              <blockquote className="mt-8 border-l-4 border-orange pl-6" data-lh-quote>
                <p className="text-xl font-semibold text-ink">{section.quote}</p>
              </blockquote>
            ) : null}
            {section.lists.map((list, listIndex) => {
              const items = list.items.map((item, itemIndex) => (
                <li className="py-2 text-base text-ink-soft" key={itemIndex}>
                  {item.title ? <strong className="text-ink">{item.title}</strong> : null}
                  {item.subtitle ? <span> {item.subtitle}</span> : null}
                  {item.text ? <span> {item.text}</span> : null}
                </li>
              ));
              return (
                <div className="mt-8" key={listIndex}>
                  {list.heading ? <h3 className="text-xl font-bold text-ink">{list.heading}</h3> : null}
                  {list.intro.map((paragraph, introIndex) => (
                    <p className="mt-3 text-base text-ink-soft" key={introIndex}>
                      {paragraph}
                    </p>
                  ))}
                  {list.style === "numbered" ? (
                    <ol className="mt-4 list-decimal pl-6" data-lh-list="numbered">
                      {items}
                    </ol>
                  ) : (
                    <ul className="mt-4 list-disc pl-6" data-lh-list="bulleted">
                      {items}
                    </ul>
                  )}
                </div>
              );
            })}
            {section.outro.map((paragraph, outroIndex) => (
              <p className="mt-5 text-lg leading-relaxed text-ink-soft" key={outroIndex}>
                {paragraph}
              </p>
            ))}
          </div>
        </section>
      ))}
    </main>
  );
}
