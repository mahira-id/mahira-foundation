import Link from "next/link";

import { getDictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/locales";
import type { LearningCard as LearningCardModel } from "@/lib/learning-hub/catalog-view";

/**
 * One Learning Hub resource card (M3-12, DECISIONS §2.16 decisions 5A, 6A,
 * 8A). Server component, no data access. Structure kept by any restyling
 * (asserted by tests/integration/learning-hub.test.ts):
 * `<article data-lh-card="<type>">` with an H3 title, the summary, the
 * "Bahasa materi" label `data-lh-language`, and for a video or playlist the
 * "Tonton di YouTube" link `a[data-lh-watch]` (URL built from the validated
 * ID), for a guide the link `a[data-lh-read]` to its page. Every text is
 * plain (no markup from the CMS).
 */
export function LearningCard({ card, locale }: { card: LearningCardModel; locale: Locale }) {
  const labels = getDictionary(locale).learningHub;
  return (
    <article className="border-t border-line py-6" data-lh-card={card.type}>
      <p className="eyebrow text-brand-700">{labels.types[card.type]}</p>
      <h3 className="mt-3 text-xl font-bold tracking-[-0.01em] text-ink">{card.title}</h3>
      {card.summary ? <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted">{card.summary}</p> : null}
      {card.materialLanguage ? (
        <p className="mt-3 text-sm font-semibold text-ink-soft" data-lh-language={card.materialLanguage}>
          {labels.materialLanguage[card.materialLanguage]}
        </p>
      ) : null}
      {card.youtube ? (
        <a className="mt-4 inline-flex text-sm font-semibold text-brand-700 underline underline-offset-4" data-lh-watch href={card.youtube.watchUrl} rel="noopener noreferrer" target="_blank">
          {labels.watch}
        </a>
      ) : null}
      {card.href ? (
        <Link className="mt-4 inline-flex text-sm font-semibold text-brand-700 underline underline-offset-4" data-lh-read href={card.href}>
          {labels.read}
        </Link>
      ) : null}
    </article>
  );
}
