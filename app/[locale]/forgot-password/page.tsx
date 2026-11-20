import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { EmailField, SubmitButton } from "@/components/account/field";
import { AccountLink, AccountPageFrame } from "@/components/account/page-frame";
import { accountMetadata } from "@/components/account/page-metadata";
import { PageStatus } from "@/components/account/status-message";
import { isAuthEnabled } from "@/lib/auth/env";
import { authHandlerPath, authPagePath } from "@/lib/auth/routes";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { isLocale } from "@/lib/i18n/locales";

/**
 * `/{locale}/forgot-password` (M5-02): asks for the email and posts to
 * `/{locale}/auth/forgot-password`. The answer never says whether the email
 * has an account (DECISIONS §2.18 decision 14a). A failed or expired reset
 * link also lands here with `?status=link-invalid`.
 */
type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export function generateMetadata({ params }: Props): Promise<Metadata> {
  return accountMetadata(params, "forgot-password");
}

export default async function ForgotPasswordPage({ params, searchParams }: Props) {
  const { locale } = await params;
  if (!isLocale(locale) || !isAuthEnabled()) notFound();
  const dictionary = getDictionary(locale).account;

  return (
    <AccountPageFrame locale={locale} page="forgot-password">
      <Suspense fallback={null}>
        <PageStatus locale={locale} page="forgot-password" searchParams={searchParams} />
      </Suspense>
      <form action={authHandlerPath(locale, "forgot-password")} method="post">
        <EmailField id="forgot-email" label={dictionary.fields.email} />
        <SubmitButton>{dictionary.buttons.forgotPassword}</SubmitButton>
      </form>
      <p className="mt-8 text-base">
        <AccountLink href={authPagePath(locale, "login")}>{dictionary.titles.login}</AccountLink>
      </p>
    </AccountPageFrame>
  );
}
