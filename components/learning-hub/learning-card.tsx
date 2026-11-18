import Link from "next/link";

import { PublicationCover } from "@/components/home/publication-cover";
import { YouTubeFacade } from "@/components/learning-hub/youtube-facade";
import { getDictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/locales";
import type { LearningCard as LearningCardModel } from "@/lib/learning-hub/catalog-view";

/**
 * One Learning Hub resource card (M3-12, DECISIONS §2.16 decisions 5A, 6A,
 * 8A). Server component, no data access. A video or playlist plays in the
 * card through the click-to-load facade (components/learning-hub/
 * youtube-facade.tsx; no iframe before the click); a guide links to its
 * page. Structure kept by any restyling (asserted by
 * tests/integration/learning-hub.test.ts): `<article data-lh-card="<type>">`
 * with an H3 title, the summary, the "Bahasa materi" label
 * `data-lh-language`, and for a video or playlist the "Tonton di YouTube"
 * link `a[data-lh-watch]` (URL built from the validated ID), for a guide the
 * link `a[data-lh-read]` to its page. Every text is plain (no markup from the
 * CMS); existing classes and tokens only.
 */
export function LearningCard({ card, locale }: { card: LearningCardModel; locale: Locale }) {
  const labels = getDictionary(locale).learningHub;
  const typeLabel = labels.types[card.type];
  return (
    <article className="border-t border-line py-8" data-lh-card={card.type}>
      <div className="grid gap-6 lg:grid-cols-12 lg:gap-8">
        {card.youtube ? (
          <div className="lg:col-span-5">
            <YouTubeFacade
              cover={card.cover}
              embedUrl={card.youtube.embedUrl}
              fallback={<PublicationCover className="aspect-auto h-full w-full" title={card.title} tone="blue" type={typeLabel} />}
              playLabel={labels.play(card.title)}
              thumbnailUrl={card.youtube.thumbnailUrl}
              title={`${typeLabel}: ${card.title}`}
            />
          </div>
        ) : null}
        <div className={card.youtube ? "lg:col-span-7" : "lg:col-span-9"}>
          <p className="eyebrow text-brand-700">{typeLabel}</p>
          <h3 className="mt-3 text-xl font-bold tracking-[-0.01em] text-ink">{card.title}</h3>
          {card.summary ? <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted">{card.summary}</p> : null}
          {card.materialLanguage ? (
            <p className="mt-3 text-sm font-semibold text-ink-soft" data-lh-language={card.materialLanguage}>
              {labels.materialLanguage[card.materialLanguage]}
            </p>
          ) : null}
          {card.youtube ? (
            <a
              className="mt-4 inline-flex text-sm font-semibold text-brand-700 underline underline-offset-4 hover:text-brand-900"
              data-lh-watch
              href={card.youtube.watchUrl}
              rel="noopener noreferrer"
              target="_blank"
            >
              {labels.watch}
            </a>
          ) : null}
          {card.href ? (
            <Link className="mt-4 inline-flex text-sm font-semibold text-brand-700 underline underline-offset-4 hover:text-brand-900" data-lh-read href={card.href}>
              {labels.read}
            </Link>
          ) : null}
        </div>
      </div>
    </article>
  );
}
