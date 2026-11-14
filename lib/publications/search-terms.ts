import type { Locale } from "@/lib/i18n/locales";

/**
 * Search text → Postgres `to_tsquery` input (M3-06, DEC-013, DECISIONS §2.12
 * P2, P5). Pure, no Payload import.
 *
 * Words are runs of letters and digits; everything else (tsquery operators
 * `& | ! ( ) : * < >`, quotes, punctuation) only separates words, so the
 * output never carries operators from the visitor. Every word must match as
 * a whole word after stemming; the last one also as a prefix ("ekon" finds
 * "ekonomi"). The text is still sent as a bound parameter, never as SQL.
 */

/** Postgres text search configuration of each locale (§2.12 P2). */
export const SEARCH_CONFIG: Record<Locale, "indonesian" | "english"> = { id: "indonesian", en: "english" };

/** Words of the search text, in order. */
export function searchTokens(text: string): string[] {
  return text.split(/[^\p{L}\p{N}]+/u).filter((token) => token !== "");
}

/** `a & b & c:*`, or null when the text has no word (then nothing can match). */
export function toTsqueryText(text: string): string | null {
  const tokens = searchTokens(text);
  if (tokens.length === 0) return null;
  const last = tokens.length - 1;
  return tokens.map((token, index) => (index === last ? `${token}:*` : token)).join(" & ");
}
