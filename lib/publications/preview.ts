import { isLocale } from "../i18n/locales";
import { SLUG_PATTERN } from "../../payload/fields/slug";

/**
 * Staff draft preview URLs (M3-05, DECISIONS §2.11 P11 A, P14 A). Pure, no
 * Payload import at runtime; relative imports because the Payload config
 * (payload/collections/Publications.ts `admin.preview`) loads this module.
 *
 * Flow: the admin Preview button opens `/api/preview?id=<id>`; the handler
 * (app/api/preview/route.ts) checks the staff session, enables Draft Mode
 * and redirects to the stored draft's detail URL; the banner's form posts
 * to `/api/preview/exit`, which disables Draft Mode and redirects to the
 * live public page or, without one, to the record's edit page in /admin
 * (M3-05b, lib/cms/staff-preview.ts `previewExitTarget`).
 */
export const PREVIEW_PATH = "/api/preview";
export const PREVIEW_EXIT_PATH = "/api/preview/exit";

/** Largest id of the Postgres `integer` primary key; a bigger number is never a record. */
const MAX_ID = 2_147_483_647;

/** URL of the admin Preview button for a saved document, or null (no button) without a positive integer id. */
export function previewUrl(doc: { id?: unknown }): string | null {
  const { id } = doc;
  if (typeof id !== "number" || !Number.isInteger(id) || id < 1 || id > MAX_ID) return null;
  return `${PREVIEW_PATH}?id=${id}`;
}

/** The `id` query value as a record id: digits without a leading zero, at most the integer range; else null. */
export function parsePreviewId(value: string | null | undefined): number | null {
  if (typeof value !== "string" || !/^[1-9][0-9]{0,9}$/.test(value)) return null;
  const id = Number(value);
  return id <= MAX_ID ? id : null;
}

/** Detail path of the stored draft, or null when its locale or slug cannot make a public detail URL. */
export function previewTarget(doc: { locale?: unknown; slug?: unknown }): string | null {
  const { locale, slug } = doc;
  if (typeof locale !== "string" || !isLocale(locale)) return null;
  if (typeof slug !== "string" || !SLUG_PATTERN.test(slug)) return null;
  return `/${locale}/publications/${slug}`;
}

/** Where the exit form goes: the detail path of valid fields, else the homepage (never an outside URL). */
export function exitTarget(locale: string, slug: string): string {
  return previewTarget({ locale, slug }) ?? "/";
}

/**
 * Edit page of a Publication in /admin (Payload 3.93.0 default `routes.admin`
 * and `admin/collections/<slug>/<id>`), for an id from parsePreviewId; the
 * exit of a preview without a public live version goes there (M3-05b).
 */
export function adminEditPath(id: number): string {
  return `/admin/collections/publications/${id}`;
}
