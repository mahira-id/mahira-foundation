import Link from "next/link";
import { Logo } from "@/components/brand/mahira";
import { LanguageSwitcher } from "@/components/site/language-switcher";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { languageSwitchHref, otherLocale, type Locale } from "@/lib/i18n/locales";

type LocaleHeaderProps = {
  locale: Locale;
  /**
   * Switcher target of a detail page (M3-05, DECISIONS §2.11 P8 A): the
   * counterpart, or the other index with `unavailable: true`. Default: the
   * other locale's publication index.
   */
  switcher?: { href: string; unavailable: boolean };
};

/**
 * Header bar of the locale-prefixed pages; same styling as the homepage
 * header. The logo goes to `/`, which is Indonesian, so English pages mark
 * it with `hrefLang="id"` (P8 A).
 */
export function LocaleHeader({ locale, switcher }: LocaleHeaderProps) {
  const dictionary = getDictionary(locale);

  return (
    <header className="on-dark sticky top-0 z-50 border-b border-white/15 bg-brand-500 text-white">
      <div className="container-editorial flex h-20 items-center justify-between gap-6">
        <Link
          aria-label={dictionary.homeLinkLabel}
          className="shrink-0"
          href="/"
          hrefLang={locale === "id" ? undefined : "id"}
        >
          <Logo className="h-7 w-auto sm:h-8" priority tone="emblem" />
        </Link>
        <LanguageSwitcher
          locale={locale}
          otherHref={switcher?.href ?? languageSwitchHref(otherLocale(locale))}
          otherTitle={switcher?.unavailable ? dictionary.detail.unavailable : undefined}
        />
      </div>
    </header>
  );
}
