import Link from "next/link";

import { AccessBadge } from "@/components/home/access-badge";
import { ArrowIcon, PlusIcon } from "@/components/ui/icons";
import type { HomePublication } from "@/lib/home/homepage-view";

/**
 * Index rows of `/` (DECISIONS §2.7 P4a A, P5 A): each row opens to show the
 * summary and a "Baca publikasi" link to the detail page, outside the
 * `<summary>` so the row still only toggles (M3-05, §2.11 P10 A).
 */
export function LatestPublications({ items }: { items: HomePublication[] }) {
  return (
    <div className="mt-2">
      {items.map((publication, index) => (
        <details
          className="publication-row border-b border-line"
          data-home-latest={publication.slug}
          key={publication.slug}
        >
          <summary className="group grid cursor-pointer gap-3 rounded-sm px-1 py-5 transition-colors hover:bg-silver/60 md:grid-cols-12 md:items-center md:gap-6 md:px-3 md:py-6">
            <span className="text-xs font-bold tabular-nums text-muted md:col-span-1">
              {String(index + 1).padStart(2, "0")}
            </span>
            <span className="flex flex-wrap items-center gap-2 text-[0.6875rem] font-bold uppercase tracking-[0.14em] text-muted md:col-span-2">
              {publication.publishedAt && publication.dateLabel ? (
                <time dateTime={publication.publishedAt}>{publication.dateLabel}</time>
              ) : null}
              {publication.dateLabel && publication.typeName ? (
                <span aria-hidden="true" className="h-1 w-1 rounded-full bg-dark-silver" />
              ) : null}
              {publication.typeName ? <span>{publication.typeName}</span> : null}
            </span>
            <div className="md:col-span-6">
              <h3 className="text-lg font-bold leading-tight tracking-[-0.02em] text-ink transition-colors group-hover:text-brand-700 md:text-xl">
                {publication.title}
              </h3>
              {publication.authorNames ? (
                <span className="mt-1 block text-sm text-muted">{publication.authorNames}</span>
              ) : null}
            </div>
            <span className="flex items-center justify-between gap-4 md:col-span-3 md:justify-end">
              <AccessBadge level={publication.accessLevel} />
              <span className="row-icon inline-flex h-8 w-8 items-center justify-center rounded-sm border border-line text-ink">
                <PlusIcon className="h-4 w-4" />
              </span>
            </span>
          </summary>
          <div className="px-1 pb-6 md:grid md:grid-cols-12 md:px-3">
            <div className="md:col-span-9 md:col-start-4">
              <p className="max-w-2xl text-sm leading-relaxed text-muted">{publication.summary}</p>
              <Link
                className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-brand-700 underline underline-offset-4 transition-colors hover:text-brand-900"
                data-home-read={publication.slug}
                href={`/id/publications/${publication.slug}`}
              >
                Baca publikasi
                <ArrowIcon className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </details>
      ))}
    </div>
  );
}
