import Link from "next/link";
import type { ReactNode } from "react";
import { Logo } from "@/components/brand/mahira";
import { LanguageSwitcher } from "@/components/site/language-switcher";
import { isAuthEnabled } from "@/lib/auth/env";
import { authPagePath } from "@/lib/auth/routes";
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
  /**
   * The "Tentang" / "About" link (M3-09, DECISIONS §2.15 decision 5), put
   * before the language switcher: `<AboutNavLink locale={…} />`, which
   * renders nothing unless that locale's About page is visible. Pages with
   * no CMS read (not-found, error boundary) pass none.
   */
  aboutLink?: ReactNode;
  /**
   * The "Learning Hub" link (M3-12, DECISIONS §2.16 decision 11A), put before
   * the About link: `<LearningHubNavLink locale={…} />`, which renders
   * nothing unless that locale's catalog exists. Pages with no CMS read pass
   * none.
   */
  learningHubLink?: ReactNode;
  /** True on the account page itself: marks the "Akun" link as the current page. */
  accountCurrent?: boolean;
};

/**
 * Header bar of the locale-prefixed pages; same styling as the homepage
 * header. The logo goes to `/`, which is Indonesian, so English pages mark
 * it with `hrefLang="id"` (P8 A).
 *
 * M5-02 (DECISIONS §2.18 decision 13): one neutral "Akun" / "Account" link
 * to `/{locale}/account`, after the other links, only while accounts are on
 * (lib/auth/env.ts). It shows no login state. A plain `<a>`: the client
 * router must not store a redirect of the account gate (plan D2, §2.10).
 */
export function LocaleHeader({ locale, switcher, aboutLink, learningHubLink, accountCurrent = false }: LocaleHeaderProps) {
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
        {learningHubLink}
        {aboutLink}
        {/* After the About link it matches by href: its class list must not name `data-header-about` (ABUI1 counts that token). */}
        {isAuthEnabled() ? (
          <a
            aria-current={accountCurrent ? "page" : undefined}
            className={`ml-auto [[data-header-learning-hub]+&]:ml-0 [a[href$='/about']+&]:ml-0 pb-0.5 text-[0.8125rem] font-semibold text-white underline-offset-4 hover:underline${accountCurrent ? " border-b border-orange" : ""}`}
            data-header-account
            href={authPagePath(locale, "account")}
          >
            {dictionary.account.navLabel}
          </a>
        ) : null}
        <LanguageSwitcher
          locale={locale}
          otherHref={switcher?.href ?? languageSwitchHref(otherLocale(locale))}
          otherTitle={switcher?.unavailable ? dictionary.detail.unavailable : undefined}
        />
      </div>
    </header >
  );
}
