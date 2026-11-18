/**
 * Readers of the Payload 3.93.0 admin edit view HTML (M3-12b), for a GET of
 * `/admin/globals/<slug>?locale=<l>` or `/admin/collections/<slug>/<id>?locale=<l>`
 * with a staff `payload-token` cookie. The fields render in the browser, but
 * the server sends what the form starts with: the form state in the RSC
 * payload (`"<path>":{"value":…}` inside `self.__next_f.push`, so every quote
 * is escaped as `\"`), the locale name in the header localizer
 * (`localizer-button__current-label`) and the form `action`
 * (`/api/…?depth=0&fallback-locale=null&locale=<l>`) as HTML. No browser and
 * no value is printed: callers assert on booleans.
 */

/**
 * True when the form state starts field `path` (e.g. `hero.title`,
 * `sections.1.lists.0.items.0.title`) with exactly `value`. Only single-line
 * text without quotes or backslashes, which the RSC payload carries unchanged.
 */
export function adminFormHasValue(html: string, path: string, value: string): boolean {
  if (/["\\\r\n]/.test(value) || /["\\]/.test(path)) throw new Error("adminFormHasValue: single-line text without quotes or backslashes only");
  return html.includes(`\\"${path}\\":{\\"value\\":\\"${value}\\"`);
}

/** The locale name shown in the admin header ("Bahasa Indonesia", "English"), or null. */
export function adminLocaleLabel(html: string): string | null {
  return /class="localizer-button__current-label">([^<]*)</.exec(html)?.[1] ?? null;
}

/** The `action` of every `<form>` (the edit form posts there), `&amp;` decoded. */
export function adminFormActions(html: string): string[] {
  return [...html.matchAll(/<form\s[^>]*action="([^"]*)"/g)].map((match) => (match[1] as string).replaceAll("&amp;", "&"));
}

/** The `locale` query parameter of the edit form's action, or null when there is no form or no parameter. */
export function adminFormLocale(html: string): string | null {
  const action = adminFormActions(html).find((value) => value.startsWith("/api/"));
  if (!action) return null;
  return new URL(action, "http://admin.invalid").searchParams.get("locale");
}
