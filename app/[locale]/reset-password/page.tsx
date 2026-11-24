import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { PasswordField, SubmitButton } from "@/components/account/field";
import { AccountLink, AccountPageFrame } from "@/components/account/page-frame";
import { accountMetadata } from "@/components/account/page-metadata";
import { PageStatus } from "@/components/account/status-message";
import { isAuthEnabled } from "@/lib/auth/env";
import { authHandlerPath, authPagePath } from "@/lib/auth/routes";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { isLocale } from "@/lib/i18n/locales";

/**
 * `/{locale}/reset-password` (M5-02): the target of a recovery email link
 * (`/{locale}/auth/confirm?type=recovery` signs the visitor in and sends
 * them here). The form posts to `/{locale}/auth/reset-password`, which
 * accepts it only for a session that came from an email link in the last
 * hour (lib/auth/actions.ts resetPassword); anything else goes to
 * forgot-password `link-invalid`. The page itself shows no account data.
 */
type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export function generateMetadata({ params }: Props): Promise<Metadata> {
  return accountMetadata(params, "reset-password");
}

export default async function ResetPasswordPage({ params, searchParams }: Props) {
  const { locale } = await params;
  if (!isLocale(locale) || !isAuthEnabled()) notFound();
  const dictionary = getDictionary(locale).account;

  return (
    <AccountPageFrame locale={locale} page="reset-password">
      <Suspense fallback={null}>
        <PageStatus locale={locale} page="reset-password" searchParams={searchParams} />
      </Suspense>
      <form action={authHandlerPath(locale, "reset-password")} method="post">
        <PasswordField
          hint={dictionary.fields.passwordHint}
          id="reset-password"
          kind="new"
          label={dictionary.fields.newPassword}
        />
        <PasswordField id="reset-password-confirm" kind="confirm" label={dictionary.fields.newPasswordConfirm} />
        <SubmitButton>{dictionary.buttons.resetPassword}</SubmitButton>
      </form>
      <p className="mt-8 text-base">
        <AccountLink href={authPagePath(locale, "forgot-password")}>{dictionary.links.toForgotPassword}</AccountLink>
      </p>
    </AccountPageFrame>
  );
}
