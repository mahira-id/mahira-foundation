import type { Metadata, Viewport } from "next";
import { Hanken_Grotesk } from "next/font/google";
import Link from "next/link";

import { Logo } from "@/components/brand/mahira";
import { THEME_COLOR } from "@/lib/design/tokens";
import { getDictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/locales";
import { SITE_NAME, SITE_URL } from "@/lib/seo/site";
import { isCmsEnabled } from "@/payload/env";
import "./globals.css";

/**
 * Global 404 page (M3-07 item 9, DECISIONS §2.13; `experimental.globalNotFound`
 * in next.config.ts): URLs that match no route, e.g. `/foo`, `/id`, `/en`,
 * `/id/foo`. The app has two root layouts ((site) and [locale]), so there is
 * no app/not-found.tsx; Next renders this file instead of a layout, with
 * HTTP 404 and robots noindex. notFound() below the [locale] layout keeps
 * app/[locale]/not-found.tsx.
 *
 * The URL gives no locale, so the page is in both languages: Indonesian
 * first (`<html lang="id">`), then English in a `lang="en"` section. Links
 * to the publication indexes only while the CMS is on; with the CMS off
 * (Production today) proxy.ts answers 404 for them, so only `/` is linked.
 */
const hankenGrotesk = Hanken_Grotesk({
  variable: "--font-hanken-grotesk",
  subsets: ["latin"],
  display: "swap",
});

const id = getDictionary("id");
const en = getDictionary("en");

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: `${id.notFound.title} — ${SITE_NAME}`,
};

export const viewport: Viewport = {
  themeColor: THEME_COLOR,
  colorScheme: "light",
};

function NotFoundLinks({ locale, withIndex }: { locale: Locale; withIndex: boolean }) {
  const text = getDictionary(locale).notFound;
  return (
    <div className="mt-8 flex flex-wrap gap-3">
      {withIndex ? (
        <Link className="btn btn-primary" href={`/${locale}/publications`}>
          {text.indexLink}
        </Link>
      ) : null}
      <Link className={withIndex ? "btn btn-outline-dark" : "btn btn-primary"} href="/" hrefLang={locale === "id" ? undefined : "id"}>
        {text.homeLink}
      </Link>
    </div>
  );
}

export default function GlobalNotFound() {
  const withIndex = isCmsEnabled();
  return (
    <html lang="id" className={`${hankenGrotesk.variable} h-full antialiased`}>
      <body className="min-h-full bg-white font-sans text-ink">
        <a href="#main" className="skip-link">
          {id.skipLink}
        </a>
        <header className="on-dark border-b border-white/15 bg-brand-500 text-white">
          <div className="container-editorial flex h-20 items-center">
            <Link aria-label={id.homeLinkLabel} className="shrink-0" href="/">
              <Logo className="h-7 w-auto sm:h-8" priority tone="emblem" />
            </Link>
          </div>
        </header>
        <main className="container-editorial py-16" data-global-not-found="" id="main">
          <div className="grid gap-12 md:grid-cols-2">
            <section aria-labelledby="not-found-id">
              <h1 className="text-3xl font-bold tracking-tight text-ink" id="not-found-id">
                {id.notFound.title}
              </h1>
              <p className="mt-4 max-w-xl text-lg leading-relaxed text-muted">{id.notFound.body}</p>
              <NotFoundLinks locale="id" withIndex={withIndex} />
            </section>
            <section
              aria-labelledby="not-found-en"
              className="border-t border-line pt-12 md:border-l md:border-t-0 md:pl-12 md:pt-0"
              lang="en"
            >
              <h2 className="text-3xl font-bold tracking-tight text-ink" id="not-found-en">
                {en.notFound.title}
              </h2>
              <p className="mt-4 max-w-xl text-lg leading-relaxed text-muted">{en.notFound.body}</p>
              <NotFoundLinks locale="en" withIndex={withIndex} />
            </section>
          </div>
        </main>
      </body>
    </html>
  );
}
