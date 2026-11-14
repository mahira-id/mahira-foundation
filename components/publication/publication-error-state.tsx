import type { ReactNode } from "react";

import { getDictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/locales";

/**
 * Error state of the publication detail (M3-05, DECISIONS §2.11 P15 A as
 * amended 2026-11-13): text in the page locale and a reload control; never
 * error details. Rendered by the page on a failed read and by the route's
 * error.tsx for unexpected errors. No hooks, so both can use it.
 */
export function PublicationErrorState({ locale, action }: { locale: Locale; action: ReactNode }) {
  const dictionary = getDictionary(locale).detail;

  return (
    <main className="container-editorial py-16" data-publication-error id="main">
      <h1 className="text-3xl font-bold tracking-tight text-ink">{dictionary.errorTitle}</h1>
      <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted">{dictionary.errorBody}</p>
      <div className="mt-8">{action}</div>
    </main>
  );
}
