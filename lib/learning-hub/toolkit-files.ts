import { text, type Text } from "@/lib/content/structured-sections";
import { isLocale, type Locale } from "@/lib/i18n/locales";

/**
 * Toolkit files on the public site (M3-13, DECISIONS §2.16 decision 9,
 * §2.17 decisions 1A–6A). Pure: no I/O, no Payload import at runtime.
 *
 * A toolkit lists its `toolkit-files` in one ordered list for ID and EN;
 * each file has a localized label and a "Bahasa dokumen". A file shows in a
 * locale only when it is a populated, ready PDF with a label in that locale,
 * a known document language and a size; anything else is dropped (fail
 * closed). No storage URL, file name or object key reaches the page: the
 * link is the app route that checks the file and its toolkit again on every
 * request.
 */
export type ToolkitFileRelation =
  | number
  | {
      id?: number | null;
      label?: Text;
      language?: string | null;
      filesize?: number | null;
      mimeType?: string | null;
      status?: string | null;
    }
  | null
  | undefined;

/** A downloadable toolkit file of the panel; the same shape as a publication file without `kind`. */
export type ToolkitFileItem = {
  id: number;
  label: string;
  /** "Bahasa dokumen": the language of the PDF itself. */
  language: Locale;
  sizeBytes: number;
  downloadPath: string;
};

/**
 * Path of the download link of a toolkit file in a locale. The locale is a
 * query value because the route path is fixed (§2.17 decision 5A); the
 * route checks that the toolkit is visible in that locale.
 */
export function toolkitDownloadPath(id: number, locale: Locale): string {
  return `/api/learning-hub/files/${id}/download?locale=${locale}`;
}

/** The files visitors may download from a toolkit page in this locale, in stored order. */
export function toolkitFileItems(files: ToolkitFileRelation[] | null | undefined, locale: Locale): ToolkitFileItem[] {
  const items: ToolkitFileItem[] = [];
  for (const file of Array.isArray(files) ? files : []) {
    if (!file || typeof file === "number" || typeof file.id !== "number") continue;
    if (file.status !== "ready" || file.mimeType !== "application/pdf") continue;
    const label = text(file.label);
    const { language, filesize } = file;
    if (!label || typeof language !== "string" || !isLocale(language)) continue;
    if (typeof filesize !== "number" || !Number.isFinite(filesize) || filesize < 0) continue;
    items.push({ id: file.id, label, language, sizeBytes: filesize, downloadPath: toolkitDownloadPath(file.id, locale) });
  }
  return items;
}
