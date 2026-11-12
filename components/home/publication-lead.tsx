import Link from "next/link";
import { Fragment, type ReactNode } from "react";

import { AccessBadge } from "@/components/home/access-badge";
import { PublicationCover } from "@/components/home/publication-cover";
import { ArrowIcon } from "@/components/ui/icons";
import type { HomePublication } from "@/lib/home/homepage-view";

function Dot() {
  return <span aria-hidden="true" className="h-1 w-1 rounded-full bg-dark-silver" />;
}

/**
 * Lead publication of `/` (DECISIONS §2.7 P4a A). The title is not linked
 * until the detail page exists (M3-05, P5 A).
 */
export function PublicationLead({ publication }: { publication: HomePublication }) {
  const meta: ReactNode[] = [];
  if (publication.typeName) {
    meta.push(<span className="eyebrow text-brand-700">{publication.typeName}</span>);
  }
  if (publication.topicName) {
    meta.push(<span className="text-sm font-medium text-muted">{publication.topicName}</span>);
  }
  if (publication.publishedAt && publication.dateLabel) {
    meta.push(
      <time className="text-sm text-muted" dateTime={publication.publishedAt}>
        {publication.dateLabel}
      </time>,
    );
  }

  return (
    <div
      className="mt-10 grid gap-10 lg:mt-12 lg:grid-cols-12 lg:items-start lg:gap-12"
      data-home-lead={publication.slug}
    >
      <div className="lg:col-span-5">
        <PublicationCover
          className="mx-auto w-full max-w-[24rem] lg:mx-0 lg:max-w-none"
          title={publication.title}
          tone="blue"
          topic={publication.topicName}
          type={publication.typeName}
          year={publication.year}
        />
      </div>

      <div className="lg:col-span-7">
        {meta.length > 0 ? (
          <div className="flex flex-wrap items-center gap-2.5">
            {meta.map((item, index) => (
              <Fragment key={index}>
                {index > 0 ? <Dot /> : null}
                {item}
              </Fragment>
            ))}
          </div>
        ) : null}

        <h3 className="mt-6 text-[clamp(1.75rem,3vw,2.75rem)] font-bold leading-[1.08] tracking-[-0.03em] text-ink">
          {publication.title}
        </h3>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted">{publication.summary}</p>

        <dl className="mt-8 grid grid-cols-2 gap-x-6 gap-y-5 border-y border-line py-5">
          {publication.authorNames ? (
            <div>
              <dt className="eyebrow text-muted">Penulis</dt>
              <dd className="mt-2 text-sm font-semibold text-ink">{publication.authorNames}</dd>
            </div>
          ) : null}
          {publication.publishedAt && publication.dateLabel ? (
            <div>
              <dt className="eyebrow text-muted">Terbit</dt>
              <dd className="mt-2 text-sm font-semibold text-ink">
                <time dateTime={publication.publishedAt}>{publication.dateLabel}</time>
              </dd>
            </div>
          ) : null}
          {publication.topicName ? (
            <div>
              <dt className="eyebrow text-muted">Topik</dt>
              <dd className="mt-2 text-sm font-semibold text-ink">{publication.topicName}</dd>
            </div>
          ) : null}
          <div>
            <dt className="eyebrow text-muted">Akses</dt>
            <dd className="mt-2">
              <AccessBadge level={publication.accessLevel} />
            </dd>
          </div>
        </dl>

        <div className="mt-8">
          <Link className="btn btn-primary" href="/id/publications">
            Lihat semua publikasi
            <ArrowIcon className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
