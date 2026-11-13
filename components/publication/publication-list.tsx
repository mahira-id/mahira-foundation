import Link from "next/link";

import { AccessBadge } from "@/components/home/access-badge";
import type { Locale } from "@/lib/i18n/locales";
import type { IndexItem } from "@/lib/publications/index-view";

/**
 * Rows of the publication index (M3-05, DECISIONS §2.11 P15 A): editorial
 * rows like the homepage index, without cover or lead. The title link holds
 * the title text only and carries `data-publication-slug` (the integration
 * tests read both from the HTML).
 */
export function PublicationList({ items, locale }: { items: IndexItem[]; locale: Locale }) {
  return (
    <ol className="mt-6 border-t border-line">
      {items.map((item) => (
        <li className="grid gap-3 border-b border-line py-6 md:grid-cols-12 md:items-start md:gap-6 md:py-7" key={item.slug}>
          <p className="flex flex-wrap items-center gap-2 text-[0.6875rem] font-bold uppercase tracking-[0.14em] text-muted md:col-span-3 md:pt-1.5">
            {item.publishedAt && item.dateLabel ? <time dateTime={item.publishedAt}>{item.dateLabel}</time> : null}
            {item.dateLabel && item.typeName ? (
              <span aria-hidden="true" className="h-1 w-1 rounded-full bg-dark-silver" />
            ) : null}
            {item.typeName ? <span>{item.typeName}</span> : null}
          </p>
          <div className="md:col-span-9">
            <h2 className="text-lg font-bold leading-tight tracking-[-0.02em] text-ink md:text-xl">
              <Link
                className="underline-offset-4 transition-colors hover:text-brand-700 hover:underline"
                data-publication-slug={item.slug}
                href={`/${locale}/publications/${item.slug}`}
              >
                {item.title}
              </Link>
            </h2>
            {item.authorNames ? <p className="mt-1 text-sm text-muted">{item.authorNames}</p> : null}
            {item.summary ? (
              <p className="mt-3 line-clamp-3 max-w-2xl text-sm leading-relaxed text-muted">{item.summary}</p>
            ) : null}
            <div className="mt-4 flex flex-wrap items-center gap-3">
              {item.topicName ? <span className="text-sm font-medium text-muted">{item.topicName}</span> : null}
              <AccessBadge level={item.accessLevel} locale={locale} />
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
}
