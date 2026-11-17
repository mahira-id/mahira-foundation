import type { Payload } from "payload";

import type { Locale } from "@/lib/i18n/locales";

/**
 * Server-only. Local API read of the `about` global for the public page
 * `/{locale}/about` (M3-09, DECISIONS §2.15 decision 1). Anonymous, like
 * lib/cms/public-content.ts: no `user`, `overrideAccess: false`,
 * `draft: false`, `fallbackLocale: false`, so Payload access limits the
 * read to the published version (PUBLIC_ABOUT_READ) and this locale's text
 * only. `payload` is only the `findGlobal` method, so unit tests pass a fake.
 */
export type FindGlobalPort = Pick<Payload, "findGlobal">;

/**
 * Payload 3.93.0 answers `{}` (not null) when the access filter matches no
 * row; an empty object is no document.
 */
export function presentDoc<T extends object>(doc: T | null | undefined): T | null {
  return doc && Object.keys(doc).length > 0 ? doc : null;
}

/** The published `about` global in this locale, or null (never published, or unpublished). */
export async function findPublicAbout(payload: FindGlobalPort, locale: Locale) {
  const doc = await payload.findGlobal({
    slug: "about",
    locale,
    fallbackLocale: false,
    draft: false,
    overrideAccess: false,
    depth: 0,
  });
  return presentDoc(doc);
}
