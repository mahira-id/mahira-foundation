import Link from "next/link";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { otherLocale, type Locale } from "@/lib/i18n/locales";

type LanguageSwitcherProps = {
  locale: Locale;
  /** Target of the other language; build it with `languageSwitchHref`. */
  otherHref: string;
  /**
   * Note on the link, in the page language, e.g. "Belum tersedia dalam
   * English" when the page has no counterpart (M3-05, DECISIONS §2.11 P8 A).
   * Shown as `title` and read by screen readers.
   */
  otherTitle?: string;
};

/** Server-rendered language switcher (DEC-005). */
export function LanguageSwitcher({ locale, otherHref, otherTitle }: LanguageSwitcherProps) {
  const dictionary = getDictionary(locale);
  const other = otherLocale(locale);

  return (
    <nav
      aria-label={dictionary.languageSwitcherLabel}
      className="flex items-center gap-2 text-[0.6875rem] font-bold uppercase tracking-[0.16em]"
    >
      <span aria-current="true" className="border-b border-orange pb-0.5 text-white" lang={locale}>
        <span aria-hidden="true">{locale}</span>
        <span className="sr-only">{dictionary.languageNames[locale]}</span>
      </span>
      <span aria-hidden="true" className="text-white/35">
        /
      </span>
      <Link
        className="pb-0.5 text-white underline-offset-4 hover:underline"
        href={otherHref}
        hrefLang={other}
        lang={other}
        title={otherTitle}
      >
        <span aria-hidden="true">{other}</span>
        <span className="sr-only">{dictionary.languageNames[other]}</span>
        {otherTitle ? (
          <span className="sr-only" lang={locale}>
            {` (${otherTitle})`}
          </span>
        ) : null}
      </Link>
    </nav>
  );
}
