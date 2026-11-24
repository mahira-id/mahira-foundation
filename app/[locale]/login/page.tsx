import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { EmailField, PasswordField, ReturnPathField, SubmitButton } from "@/components/account/field";
import { AccountLink, AccountPageFrame } from "@/components/account/page-frame";
import { accountMetadata } from "@/components/account/page-metadata";
import { PageStatus } from "@/components/account/status-message";
import { isAuthEnabled } from "@/lib/auth/env";
import { authHandlerPath, authPagePath } from "@/lib/auth/routes";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { isLocale } from "@/lib/i18n/locales";

/**
 * `/{locale}/login` (M5-02, DECISIONS §2.18 decision 13): a native form that
 * posts to `/{locale}/auth/login`, which answers 303. No JavaScript is
 * needed. With accounts off proxy.ts answers 404 before this page runs;
 * the check here keeps it closed without the proxy.
 *
 * `?next=` (M5-04): the download route of a locked `registered` file sends
 * a visitor without a valid session here with the publication's detail
 * path; ReturnPathField posts it back as `next` when it is valid, and the
 * login handler returns there after a successful login.
 */
const LOGIN_FORM_ID = "login-form";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export function generateMetadata({ params }: Props): Promise<Metadata> {
  return accountMetadata(params, "login");
}

export default async function LoginPage({ params, searchParams }: Props) {
  const { locale } = await params;
  if (!isLocale(locale) || !isAuthEnabled()) notFound();
  const dictionary = getDictionary(locale).account;

  return (
    <AccountPageFrame locale={locale} page="login">
      <Suspense fallback={null}>
        <PageStatus locale={locale} page="login" searchParams={searchParams} />
      </Suspense>
      <form action={authHandlerPath(locale, "login")} id={LOGIN_FORM_ID} method="post">
        <Suspense fallback={null}>
          <ReturnPathField formId={LOGIN_FORM_ID} searchParams={searchParams} />
        </Suspense>
        <EmailField id="login-email" label={dictionary.fields.email} />
        <PasswordField id="login-password" kind="login" label={dictionary.fields.password} />
        <SubmitButton>{dictionary.buttons.login}</SubmitButton>
      </form>
      <ul className="mt-8 space-y-3 text-base">
        <li>
          <AccountLink href={authPagePath(locale, "forgot-password")}>{dictionary.links.toForgotPassword}</AccountLink>
        </li>
        <li>
          <AccountLink href={authPagePath(locale, "register")}>{dictionary.links.toRegister}</AccountLink>
        </li>
      </ul>
    </AccountPageFrame>
  );
}
