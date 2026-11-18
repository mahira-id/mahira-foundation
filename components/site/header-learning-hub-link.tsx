import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";

import { getLearningHubHref } from "@/lib/cms/public-content";
import { getDictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/locales";

/**
 * "Learning Hub" link of the `/{locale}/…` header (M3-12, DECISIONS §2.16
 * decision 11A). Shown only while that locale's catalog exists (at least one
 * visible resource), so it never links to a 404. Same pattern as the About
 * link: read at request time inside Suspense, so the page shell stays static
 * and a publish shows without a deploy; a failed read or the CMS off renders
 * nothing (`getLearningHubHref` never throws). It takes the free space
 * (`ml-auto`) and the About link that follows loses its own (`ml-0`).
 * `current`: the link on the catalog page itself.
 */
async function HeaderLearningHubLink({ locale, current }: { locale: Locale; current: boolean }) {
  await connection();
  const href = await getLearningHubHref(locale);
  if (!href) return null;
  return (
    <Link
      aria-current={current ? "page" : undefined}
      className={`ml-auto pb-0.5 text-[0.8125rem] font-semibold text-white underline-offset-4 hover:underline${current ? " border-b border-orange" : ""}`}
      data-header-learning-hub
      href={href}
    >
      {getDictionary(locale).learningHub.navLabel}
    </Link>
  );
}

/** The `learningHubLink` slot of `LocaleHeader`. */
export function LearningHubNavLink({ locale, current = false }: { locale: Locale; current?: boolean }) {
  return (
    <Suspense fallback={null}>
      <HeaderLearningHubLink current={current} locale={locale} />
    </Suspense>
  );
}