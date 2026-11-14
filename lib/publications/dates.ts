import type { Locale } from "@/lib/i18n/locales";

/**
 * Publication dates of the public pages (DECISIONS §2.7 P9 A, §2.11 P15 A):
 * "28 Okt 2026" (id-ID) and "28 Oct 2026" (en-GB), always in WIB, because
 * dates from the admin are stored in UTC. Pure, no Payload import.
 */
const DATE_FORMATS: Record<Locale, Intl.DateTimeFormat> = {
  id: new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short", year: "numeric", timeZone: "Asia/Jakarta" }),
  en: new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric", timeZone: "Asia/Jakarta" }),
};
const YEAR_FORMAT = new Intl.DateTimeFormat("id-ID", { year: "numeric", timeZone: "Asia/Jakarta" });

export function formatPublicationDate(iso: string, locale: Locale): string {
  return DATE_FORMATS[locale].format(new Date(iso));
}

/** The year in WIB ("2090" for 2089-12-31T18:00:00Z). */
export function publicationYear(iso: string): string {
  return YEAR_FORMAT.format(new Date(iso));
}
