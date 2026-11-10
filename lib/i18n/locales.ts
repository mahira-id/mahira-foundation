/**
 * Site locales (DEC-005, ADR-0005). This module imports nothing, so it can be
 * used by Payload config, proxy and components alike.
 */

export const LOCALES = ["id", "en"] as const;

export type Locale = (typeof LOCALES)[number];

/**
 * Owner 2026-11-10, P4c (i): used only for `/` (html lang) and the Payload
 * `localization.defaultLocale`. There is no redirect to a default locale and
 * no content fallback to it.
 */
export const DEFAULT_LOCALE: Locale = "id";

/** Exact, case-sensitive match: `ID` or `Id` are not locales. */
export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}

export function otherLocale(locale: Locale): Locale {
  return locale === "id" ? "en" : "id";
}

/**
 * Target of the language switcher (DEC-005): the eligible counterpart of the
 * current page when there is one, otherwise the publication index of the
 * target locale.
 */
export function languageSwitchHref(
  target: Locale,
  alternates?: Partial<Record<Locale, string>>,
): string {
  return alternates?.[target] ?? `/${target}/publications`;
}
