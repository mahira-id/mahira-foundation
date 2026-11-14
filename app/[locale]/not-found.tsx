import Link from "next/link";
import { locale as localeParam } from "next/root-params";

import { LocaleHeader } from "@/components/site/locale-header";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { DEFAULT_LOCALE, isLocale } from "@/lib/i18n/locales";

/**
 * Not-found page of the locale-prefixed pages (M3-05b): every notFound()
 * below the [locale] layout, e.g. an unknown or ineligible publication slug
 * (DECISIONS §2.11 P7 A as amended: HTTP 200 + robots noindex, which Next
 * adds). Text in the URL's locale, the site header, a link to that locale's
 * publication index. A not-found file gets no props, so the locale comes
 * from the root param (`next/root-params`); the [locale] layout already
 * rejected anything else, `DEFAULT_LOCALE` only satisfies the type.
 * A notFound() of the [locale] layout itself (bare `/id`, unknown locale)
 * and unmatched URLs do not reach this file.
 */
export default async function LocaleNotFound() {
  const value = await localeParam();
  const locale = value !== undefined && isLocale(value) ? value : DEFAULT_LOCALE;
  const dictionary = getDictionary(locale).notFound;

  return (
    <>
      <LocaleHeader locale={locale} />
      <main className="container-editorial py-16" data-not-found={locale} id="main">
        <h1 className="text-3xl font-bold tracking-tight text-ink">{dictionary.title}</h1>
        <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted">{dictionary.body}</p>
        <div className="mt-8">
          <Link className="btn btn-primary" href={`/${locale}/publications`}>
            {dictionary.indexLink}
          </Link>
        </div>
      </main>
    </>
  );
}
