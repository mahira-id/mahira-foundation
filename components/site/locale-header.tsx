import Link from "next/link";
import { Logo } from "@/components/brand/mahira";
import { LanguageSwitcher } from "@/components/site/language-switcher";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { languageSwitchHref, otherLocale, type Locale } from "@/lib/i18n/locales";

/**
 * Header bar of the locale-prefixed pages; same styling as the homepage
 * header. The switcher goes to the other locale's publication index until
 * detail pages pass their counterparts (M3-05, DEC-005).
 */
export function LocaleHeader({ locale }: { locale: Locale }) {
  const dictionary = getDictionary(locale);

  return (
    <header className="on-dark sticky top-0 z-50 border-b border-white/15 bg-brand-500 text-white">
      <div className="container-editorial flex h-20 items-center justify-between gap-6">
        <Link aria-label={dictionary.homeLinkLabel} className="shrink-0" href="/">
          <Logo className="h-7 w-auto sm:h-8" priority tone="emblem" />
        </Link>
        <LanguageSwitcher
          locale={locale}
          otherHref={languageSwitchHref(otherLocale(locale))}
        />
      </div>
    </header>
  );
}
