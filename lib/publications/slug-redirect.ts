import type { Locale } from "../i18n/locales";
import { SLUG_PATTERN } from "../../payload/fields/slug";

/**
 * Target of the 308 for an old publication URL (M3-07, DECISIONS §2.11
 * P9 A). Pure. `ref` is the locale and slug of the record that owns the old
 * slug in the slug history, read as an anonymous visitor (published + public
 * only), or null.
 *
 * A path only when the record is visible, in the URL's locale, under another
 * slug that the detail route serves. Anything else (no visible record,
 * another locale, the same slug) is null: the page shows its not-found, so a
 * redirect never names a record that visitors cannot see and never loops.
 */
export function redirectPath(
  locale: Locale,
  slug: string,
  ref: { locale?: unknown; slug?: unknown } | null,
): string | null {
  if (!ref || ref.locale !== locale) return null;
  if (typeof ref.slug !== "string" || ref.slug === slug || !SLUG_PATTERN.test(ref.slug)) return null;
  return `/${locale}/publications/${ref.slug}`;
}
