import Image from "next/image";
import Link from "next/link";
import { Fragment, type ReactNode } from "react";

import { AccessBadge } from "@/components/home/access-badge";
import { PublicationCover } from "@/components/home/publication-cover";
import { getDictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/locales";
import type { PublicationDetail as PublicationDetailData } from "@/lib/publications/detail-view";

function Dot() {
  return <span aria-hidden="true" className="h-1 w-1 rounded-full bg-dark-silver" />;
}

/**
 * Publication detail (M3-05, DECISIONS §2.11 P7 A, P15 A): breadcrumb,
 * metadata, title, the full summary, authors and access, with the uploaded
 * cover image or the typographic cover. No download panel until M3-08, no
 * related publications.
 */
export function PublicationDetail({ publication, locale }: { publication: PublicationDetailData; locale: Locale }) {
  const dictionary = getDictionary(locale);
  const labels = dictionary.detail;
  const topics = publication.topicNames.join(", ");

  const meta: ReactNode[] = [];
  if (publication.typeName) {
    meta.push(<span className="eyebrow text-brand-700">{publication.typeName}</span>);
  }
  if (topics) {
    meta.push(<span className="text-sm font-medium text-muted">{topics}</span>);
  }
  if (publication.publishedAt && publication.dateLabel) {
    meta.push(
      <time className="text-sm text-muted" dateTime={publication.publishedAt}>
        {publication.dateLabel}
      </time>,
    );
  }
  meta.push(
    <span className="text-sm text-muted">
      <span className="sr-only">{`${labels.language}: `}</span>
      {dictionary.languageNames[locale]}
    </span>,
  );

  return (
    <article
      className="container-editorial pt-10 pb-20 md:pt-12 md:pb-28"
      data-preview="false"
      data-publication-detail={publication.slug}
    >
      <nav aria-label={labels.breadcrumbLabel}>
        <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted">
          <li>
            <Link
              className="font-semibold text-brand-700 underline underline-offset-4 hover:text-brand-900"
              href={`/${locale}/publications`}
            >
              {dictionary.publications.title}
            </Link>
          </li>
          <li aria-hidden="true" className="text-dark-silver">
            /
          </li>
          <li aria-current="page" className="max-w-full text-ink">
            {publication.title}
          </li>
        </ol>
      </nav>

      <div className="mt-10 grid gap-12 lg:mt-14 lg:grid-cols-12 lg:items-start lg:gap-12">
        <div className="lg:col-span-8">
          <div className="flex flex-wrap items-center gap-2.5">
            {meta.map((item, index) => (
              <Fragment key={index}>
                {index > 0 ? <Dot /> : null}
                {item}
              </Fragment>
            ))}
          </div>

          <h1 className="mt-6 text-[clamp(2rem,4vw,3.25rem)] font-bold leading-[1.06] tracking-[-0.03em] text-balance text-ink">
            {publication.title}
          </h1>

          <div className="mt-8 max-w-2xl space-y-5 text-lg leading-relaxed text-ink-soft">
            {publication.summaryParagraphs.map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>

          <dl className="mt-10 grid max-w-2xl gap-x-6 gap-y-5 border-y border-line py-5 sm:grid-cols-2">
            {publication.authorNames.length > 0 ? (
              <div>
                <dt className="eyebrow text-muted">{labels.authors}</dt>
                <dd className="mt-2 text-sm font-semibold text-ink">{publication.authorNames.join(", ")}</dd>
              </div>
            ) : null}
            {publication.publishedAt && publication.dateLabel ? (
              <div>
                <dt className="eyebrow text-muted">{labels.published}</dt>
                <dd className="mt-2 text-sm font-semibold text-ink">
                  <time dateTime={publication.publishedAt}>{publication.dateLabel}</time>
                </dd>
              </div>
            ) : null}
            {topics ? (
              <div>
                <dt className="eyebrow text-muted">{labels.topics}</dt>
                <dd className="mt-2 text-sm font-semibold text-ink">{topics}</dd>
              </div>
            ) : null}
            <div>
              <dt className="eyebrow text-muted">{labels.access}</dt>
              <dd className="mt-2">
                <AccessBadge level={publication.accessLevel} locale={locale} />
              </dd>
            </div>
          </dl>
        </div>

        <div className="lg:col-span-4">
          {publication.cover ? (
            <Image
              alt={publication.cover.alt}
              className="mx-auto h-auto w-full max-w-[22rem] rounded-lg border border-line lg:mx-0 lg:max-w-none"
              height={publication.cover.height}
              src={publication.cover.url}
              unoptimized
              width={publication.cover.width}
            />
          ) : (
            <PublicationCover
              className="mx-auto w-full max-w-[22rem] lg:mx-0 lg:max-w-none"
              title={publication.title}
              tone="blue"
              topic={publication.topicNames[0] ?? null}
              type={publication.typeName}
              year={publication.year}
            />
          )}
        </div>
      </div>
    </article>
  );
}
