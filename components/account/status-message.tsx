import { readStatus, type AuthPage } from "@/lib/auth/routes";
import { getDictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/locales";

/**
 * Status message of an account page (M5-02, closed lists of
 * lib/auth/routes.ts). The text always carries the meaning; the left bar
 * colour only supports it. A value outside the page's list shows nothing,
 * and request input is never echoed.
 */
const POSITIVE = new Set<string>(["check-email", "signed-out", "email-confirmed", "password-changed"]);

export function StatusMessage({ status, text }: { status: string; text: string }) {
  const positive = POSITIVE.has(status);
  return (
    <p
      className={`mt-8 border-l-4 bg-silver px-4 py-3 text-base leading-relaxed text-ink ${positive ? "border-green" : "border-orange"}`}
      data-account-status={status}
      role={positive ? "status" : "alert"}
    >
      {text}
    </p>
  );
}

type SearchParams = Record<string, string | string[] | undefined>;

/**
 * Reads `?status=` of the page inside a Suspense boundary (the page shell
 * stays static; publications/page.tsx pattern).
 */
export async function PageStatus({
  locale,
  page,
  searchParams,
}: {
  locale: Locale;
  page: AuthPage;
  searchParams: Promise<SearchParams>;
}) {
  const status = readStatus(page, (await searchParams).status);
  if (status === null) return null;
  const texts: Record<string, string> = getDictionary(locale).account.statuses[page];
  return <StatusMessage status={status} text={texts[status]} />;
}
