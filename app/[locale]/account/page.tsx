import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";

import { PasswordField, SubmitButton } from "@/components/account/field";
import { AccountLink, AccountPageFrame } from "@/components/account/page-frame";
import { accountMetadata } from "@/components/account/page-metadata";
import { StatusMessage } from "@/components/account/status-message";
import { isAuthEnabled } from "@/lib/auth/env";
import { authHandlerPath, authPagePath, readStatus } from "@/lib/auth/routes";
import { getAccountUser } from "@/lib/auth/session";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { isLocale, type Locale } from "@/lib/i18n/locales";

/**
 * `/{locale}/account` (M5-02, DECISIONS §2.18 decision 13): email,
 * verification state, access level, change of password and sign out. The
 * shell is static; the account data is read at request time inside Suspense
 * from Supabase Auth (getUser(), lib/auth/session.ts).
 *
 * proxy.ts guards the route: with no valid session a GET never reaches this
 * page (307 to the login page) and the response is `private, no-store`.
 * A session the proxy still passes (its check is local) but the Auth
 * server no longer accepts, for example after sign-out on another device,
 * shows the "session ended" state with no account data. The page never
 * redirects itself (plan D2). Access is always "Terdaftar" in PR-1: the
 * evaluator and subscriber levels come later (M5-03, M7).
 */
type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export function generateMetadata({ params }: Props): Promise<Metadata> {
  return accountMetadata(params, "account");
}

export default async function AccountPage({ params, searchParams }: Props) {
  const { locale } = await params;
  if (!isLocale(locale) || !isAuthEnabled()) notFound();
  const dictionary = getDictionary(locale).account;

  return (
    <AccountPageFrame locale={locale} page="account">
      <Suspense fallback={<p className="mt-8 text-base text-muted" role="status">{dictionary.loading}</p>}>
        <AccountBody locale={locale} searchParams={searchParams} />
      </Suspense>
    </AccountPageFrame>
  );
}

async function AccountBody({
  locale,
  searchParams,
}: {
  locale: Locale;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  // Request-time data: the session is per visitor and never prerendered.
  await connection();
  const user = await getAccountUser();
  const dictionary = getDictionary(locale).account;

  if (!user) {
    return (
      <section aria-labelledby="session-ended-heading" className="mt-8" data-account-session="ended">
        <h2 className="text-2xl font-bold tracking-tight text-ink" id="session-ended-heading">
          {dictionary.sessionEnded.title}
        </h2>
        <p className="mt-3 text-base leading-relaxed text-ink-soft">{dictionary.sessionEnded.body}</p>
        <p className="mt-5 text-base">
          <AccountLink href={authPagePath(locale, "login")}>{dictionary.sessionEnded.login}</AccountLink>
        </p>
      </section>
    );
  }

  const status = readStatus("account", (await searchParams).status);
  const statusTexts: Record<string, string> = dictionary.statuses.account;

  return (
    <div data-account-session="active">
      {status ? <StatusMessage status={status} text={statusTexts[status]} /> : null}

      <section aria-labelledby="account-details-heading" className="mt-10 border-t border-line pt-6">
        <h2 className="text-2xl font-bold tracking-tight text-ink" id="account-details-heading">
          {dictionary.details.heading}
        </h2>
        <dl className="mt-5 grid gap-x-6 gap-y-4 text-base sm:grid-cols-[12rem_1fr]">
          <dt className="font-semibold text-ink-soft">{dictionary.details.email}</dt>
          <dd className="break-all text-ink" data-account-email>
            {user.email}
          </dd>
          <dt className="font-semibold text-ink-soft">{dictionary.details.verification}</dt>
          <dd className="text-ink" data-account-verification={user.emailConfirmed ? "verified" : "unverified"}>
            {user.emailConfirmed ? dictionary.details.verified : dictionary.details.notVerified}
          </dd>
          <dt className="font-semibold text-ink-soft">{dictionary.details.access}</dt>
          <dd className="text-ink" data-account-access="registered">
            {dictionary.details.accessRegistered}
          </dd>
        </dl>
      </section>

      <section aria-labelledby="change-password-heading" className="mt-10 border-t border-line pt-6">
        <h2 className="text-2xl font-bold tracking-tight text-ink" id="change-password-heading">
          {dictionary.details.changePasswordHeading}
        </h2>
        <form action={authHandlerPath(locale, "change-password")} method="post">
          <PasswordField id="change-current" kind="current" label={dictionary.fields.currentPassword} />
          <PasswordField
            hint={dictionary.fields.passwordHint}
            id="change-new"
            kind="new"
            label={dictionary.fields.newPassword}
          />
          <PasswordField id="change-confirm" kind="confirm" label={dictionary.fields.newPasswordConfirm} />
          <SubmitButton>{dictionary.buttons.changePassword}</SubmitButton>
        </form>
      </section>

      <section aria-labelledby="logout-heading" className="mt-10 border-t border-line pt-6">
        <h2 className="text-2xl font-bold tracking-tight text-ink" id="logout-heading">
          {dictionary.details.logoutHeading}
        </h2>
        <form action={authHandlerPath(locale, "logout")} method="post">
          <SubmitButton tone="outline">{dictionary.buttons.logout}</SubmitButton>
        </form>
      </section>
    </div>
  );
}
