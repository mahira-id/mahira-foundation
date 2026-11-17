import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";

import { getAboutHref } from "@/lib/cms/public-content";
import { getDictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/locales";

/**
 * "Tentang" / "About" link of the `/{locale}/…` header (M3-09, DECISIONS
 * §2.15 decision 5). Shown only while that locale's About page is visible to
 * visitors (published; EN also needs its checkbox and required fields), so
 * it never links to a 404. Read at request time inside Suspense, so the
 * page shell stays static and a publish shows without a deploy; a failed
 * read or the CMS off renders nothing (`getAboutHref` never throws).
 * `current`: the link on the About page itself.
 */
async function HeaderAboutLink({ locale, current }: { locale: Locale; current: boolean }) {
  await connection();
  const href = await getAboutHref(locale);
  if (!href) return null;
  return (
    <Link
      aria-current={current ? "page" : undefined}
      className={`ml-auto pb-0.5 text-[0.8125rem] font-semibold text-white underline-offset-4 hover:underline${current ? " border-b border-orange" : ""}`}
      data-header-about
      href={href}
    >
      {getDictionary(locale).about.navLabel}
    </Link>
  );
}

/** The `aboutLink` slot of `LocaleHeader`. */
export function AboutNavLink({ locale, current = false }: { locale: Locale; current?: boolean }) {
  return (
    <Suspense fallback={null}>
      <HeaderAboutLink current={current} locale={locale} />
    </Suspense>
  );
}
