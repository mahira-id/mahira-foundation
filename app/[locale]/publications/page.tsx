import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { LocaleHeader } from "@/components/site/locale-header";
import { listPublishedPublications } from "@/lib/cms/public-content";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { isLocale, type Locale } from "@/lib/i18n/locales";
import { isCmsEnabled } from "@/payload/env";

/**
 * Publication index skeleton (M3-01): titles of the published + public
 * publications of this locale only. Filters, pagination and detail links
 * follow in M3-05.
 */

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return { title: getDictionary(locale).publications.title };
}

export default async function PublicationsPage({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale) || !isCmsEnabled()) notFound();
  const dictionary = getDictionary(locale);

  return (
    <>
      <LocaleHeader locale={locale} />
      <main id="main" className="container-editorial py-16">
        <h1 className="text-4xl font-bold tracking-tight">{dictionary.publications.title}</h1>
        <Suspense fallback={<p className="mt-8">{dictionary.publications.loading}</p>}>
          <PublicationList locale={locale} />
        </Suspense>
      </main>
    </>
  );
}

async function PublicationList({ locale }: { locale: Locale }) {
  // Request-time data: keeps the CMS query out of the build prerender.
  await connection();
  const publications = await listPublishedPublications(locale);
  const dictionary = getDictionary(locale);

  if (!publications || publications.length === 0) {
    return <p className="mt-8">{dictionary.publications.empty}</p>;
  }

  return (
    <ol className="mt-8 divide-y divide-line border-y border-line">
      {publications.map((publication) => (
        <li className="py-4 text-lg font-semibold" data-publication-slug={publication.slug} key={publication.id}>
          {publication.title}
        </li>
      ))}
    </ol>
  );
}
