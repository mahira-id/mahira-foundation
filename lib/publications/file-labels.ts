import { getDictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/locales";
import type { PublicationFileKind } from "@/lib/publications/detail-view";

/**
 * Labels of the file panel (M3-08, DECISIONS §2.14 item 7). Pure: the
 * dictionary holds the words, these functions the number formatting.
 */

const KIB = 1024;
const MIB = KIB * KIB;

/** One decimal, without a trailing ",0"; decimal comma in Indonesian, point in English. */
function oneDecimal(value: number, locale: Locale): string {
  const text = (Math.round(value * 10) / 10).toFixed(1).replace(/\.0$/, "");
  return locale === "id" ? text.replace(".", ",") : text;
}

/**
 * "812 B", "340 KB", "10 MB", "1,5 MB" (1 KB = 1024 B, the bucket's limit is
 * 50 MB = 52428800 B). KB is a whole number (at least 1 for a non-empty file);
 * a size that would round to 1024 KB is shown in MB.
 */
export function fileSizeLabel(bytes: number, locale: Locale): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  if (bytes < KIB) return `${Math.round(bytes)} B`;
  const kilobytes = Math.max(1, Math.round(bytes / KIB));
  if (kilobytes < KIB) return `${kilobytes} KB`;
  return `${oneDecimal(bytes / MIB, locale)} MB`;
}

/** "PDF · 10 MB" (every panel file is a PDF, DECISIONS §2.14 item 4). */
export function fileFormatLabel(bytes: number, locale: Locale): string {
  return `PDF · ${fileSizeLabel(bytes, locale)}`;
}

/** Kind of a file in the language of the page. */
export function fileKindLabel(kind: PublicationFileKind, locale: Locale): string {
  return getDictionary(locale).files.kinds[kind];
}

/** Language of the document itself, named in the language of the page ("Bahasa Indonesia", "English"). */
export function fileLanguageLabel(documentLanguage: Locale, locale: Locale): string {
  return getDictionary(locale).languageNames[documentLanguage];
}
