import type { ReactNode } from "react";

import { LocaleHeader } from "@/components/site/locale-header";
import { authPagePath, type AuthPage } from "@/lib/auth/routes";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { otherLocale, type Locale } from "@/lib/i18n/locales";

/**
 * Shell of an account page (M5-02): the locale header (its switcher goes to
 * the same page in the other locale, never to the publication index, which
 * may be closed), H1 and intro. The product register of PDD §1.1: compact,
 * task-oriented, one narrow column.
 */
export function AccountPageFrame({
  locale,
  page,
  children,
}: {
  locale: Locale;
  page: AuthPage;
  children: ReactNode;
}) {
  const dictionary = getDictionary(locale).account;
  return (
    <>
      <LocaleHeader
        accountCurrent={page === "account"}
        locale={locale}
        switcher={{ href: authPagePath(otherLocale(locale), page), unavailable: false }}
      />
      <main className="container-editorial py-16" data-account-page={page} id="main">
        <div className="max-w-xl">
          <h1 className="text-4xl font-bold tracking-tight text-ink">{dictionary.titles[page]}</h1>
          <p className="mt-4 text-lg leading-relaxed text-muted">{dictionary.intros[page]}</p>
          {children}
        </div>
      </main>
    </>
  );
}

/** A plain link in the account pages (never next/link: DECISIONS §2.10, plan D2). */
export function AccountLink({ href, children }: { href: string; children: string }) {
  return (
    <a className="font-semibold text-brand-700 underline underline-offset-4 hover:text-brand-900" href={href}>
      {children}
    </a>
  );
}
