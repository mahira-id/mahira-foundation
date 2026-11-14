"use client";

import { useParams } from "next/navigation";

import { PublicationErrorState } from "@/components/publication/publication-error-state";
import { LocaleHeader } from "@/components/site/locale-header";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { isLocale, type Locale } from "@/lib/i18n/locales";

/**
 * Error boundary of the publication detail for unexpected errors (M3-05).
 * A failed CMS read does not reach it: the page renders the same error
 * state itself on the server (DECISIONS §2.11 P15 A as amended 2026-11-13).
 * No error details are shown.
 */
export default function PublicationDetailError({ retry }: { error: unknown; retry: () => void }) {
  const params = useParams<{ locale?: string }>();
  const value = typeof params?.locale === "string" ? params.locale : "";
  const locale: Locale = isLocale(value) ? value : "id";

  return (
    <>
      <LocaleHeader locale={locale} />
      <PublicationErrorState
        action={
          <button className="btn btn-primary" onClick={() => retry()} type="button">
            {getDictionary(locale).detail.reload}
          </button>
        }
        locale={locale}
      />
    </>
  );
}
