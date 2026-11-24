import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { EmailField, PasswordField, SubmitButton } from "@/components/account/field";
import { AccountLink, AccountPageFrame } from "@/components/account/page-frame";
import { accountMetadata } from "@/components/account/page-metadata";
import { PageStatus } from "@/components/account/status-message";
import { isAuthEnabled } from "@/lib/auth/env";
import { authHandlerPath, authPagePath } from "@/lib/auth/routes";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { isLocale } from "@/lib/i18n/locales";

/**
 * `/{locale}/register` (M5-02): email + password, a native form posting to
 * `/{locale}/auth/register`. The privacy note (DECISIONS §2.18 decision 9)
 * says which data is collected and why, labelled as a draft not yet reviewed
 * by legal. The answer to a valid submit is the same whether or not the
 * email has an account (`check-email`).
 */
type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export function generateMetadata({ params }: Props): Promise<Metadata> {
  return accountMetadata(params, "register");
}

export default async function RegisterPage({ params, searchParams }: Props) {
  const { locale } = await params;
  if (!isLocale(locale) || !isAuthEnabled()) notFound();
  const dictionary = getDictionary(locale).account;

  return (
    <AccountPageFrame locale={locale} page="register">
      <Suspense fallback={null}>
        <PageStatus locale={locale} page="register" searchParams={searchParams} />
      </Suspense>
      <form action={authHandlerPath(locale, "register")} method="post">
        <EmailField id="register-email" label={dictionary.fields.email} />
        <PasswordField hint={dictionary.fields.passwordHint} id="register-password" kind="new" label={dictionary.fields.password} />
        <PasswordField id="register-password-confirm" kind="confirm" label={dictionary.fields.passwordConfirm} />
        <section aria-labelledby="register-privacy" className="mt-8 border-t border-line pt-5" data-account-privacy>
          <h2 className="text-sm font-bold text-ink" id="register-privacy">
            {dictionary.privacy.heading}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-ink-soft">{dictionary.privacy.body}</p>
          <p className="mt-1 text-sm font-semibold text-muted">{dictionary.privacy.draft}</p>
        </section>
        <SubmitButton>{dictionary.buttons.register}</SubmitButton>
      </form>
      <p className="mt-8 text-base">
        <AccountLink href={authPagePath(locale, "login")}>{dictionary.links.toLogin}</AccountLink>
      </p>
    </AccountPageFrame>
  );
}
