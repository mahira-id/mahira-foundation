import type { Payload } from "payload";

import { isAboutVisible } from "@/lib/about/about-view";
import { findPublicAbout, presentDoc, type FindGlobalPort } from "@/lib/cms/about-query";
import { findPublicResource, GUIDE_SELECT, RESOURCE_POPULATE } from "@/lib/cms/learning-hub-query";
import { DETAIL_POPULATE, DETAIL_SELECT, findPublicRef } from "@/lib/cms/publication-detail-query";
import { isLocale, type Locale } from "@/lib/i18n/locales";
import { isResourceVisible } from "@/lib/learning-hub/catalog-view";
import {
  ABOUT_ADMIN_PATH,
  aboutPath,
  adminEditPath,
  exitTarget,
  previewTarget,
  resourceAdminPath,
  resourcePath,
} from "@/lib/publications/preview";
import { staffRoleOfUser } from "@/payload/access/roles";

/**
 * Server-only. Staff draft preview reads (M3-05, DECISIONS §2.11 P11 A,
 * P14 A; the About page since M3-09, DECISIONS §2.15 decision 7B): the only
 * module that reads drafts for a public URL. Used only behind a verified
 * staff session: the preview handler (app/api/preview/route.ts) checks it
 * before it enables Draft Mode, getPublicationDetail and getAboutPage
 * (lib/cms/public-content.ts) check it again on every request in Draft
 * Mode, and the exit handler (app/api/preview/exit/route.ts) checks it
 * before it sends anyone to /admin. Since M3-11 also the Learning Hub
 * guide preview (DECISIONS §2.16 decision 12A, getLearningResource). Reads run as that user with
 * `overrideAccess: false` and `fallbackLocale: false`, so Payload access
 * control still applies. Index and homepage reads never come here.
 */
type AuthPort = Pick<Payload, "auth">;
type FindPort = Pick<Payload, "find">;

export type StaffUser = NonNullable<Awaited<ReturnType<Payload["auth"]>>["user"]>;

/** The Editor or Admin of the request's Payload session (`payload-token` cookie or JWT header), else null. */
export async function staffFromHeaders(payload: AuthPort, headers: Headers): Promise<StaffUser | null> {
  const { user } = await payload.auth({ headers });
  return user && staffRoleOfUser(user) !== null ? user : null;
}

/** Locale and slug of the latest version (draft included) of a record, for the preview redirect; or null. */
export async function findDraftRef(payload: FindPort, id: number, user: StaffUser) {
  const result = await payload.find({
    collection: "publications",
    where: { id: { equals: id } },
    limit: 1,
    depth: 0,
    select: { slug: true, locale: true },
    draft: true,
    user,
    overrideAccess: false,
  });
  return result.docs[0] ?? null;
}

/**
 * Fields of the exit form: a publication (`id`, `locale`, `slug`), since
 * M3-09 the About page (`about` = its locale; the other fields unused), or
 * since M3-11 a Learning Hub guide (`resource` = its id, with `locale` and
 * `slug` of the previewed page; `id` unused).
 */
export type ExitForm = { id: number | null; locale: string; slug: string; about?: Locale | null; resource?: number | null };

/** Where the exit goes without a staff session or when the CMS read fails: only paths of this site. */
export function fallbackExitTarget(form: ExitForm): string {
  if (form.about) return aboutPath(form.about);
  if (form.resource) return resourcePath(form.locale, form.slug) ?? "/";
  return exitTarget(form.locale, form.slug);
}

/**
 * Where the exit of the staff preview goes (M3-05b; Owner 2026-11-13).
 * For the Editor or Admin of the request: the public detail of the record's
 * live version when visitors can see it (published + public, read
 * anonymously; its own locale and slug), else the record's edit page in
 * /admin when the record exists. Everyone else, a missing id or an unknown
 * record: exitTarget of the posted fields, as before. Only paths of this
 * site, never a URL from the form.
 *
 * About page (M3-09): for the Editor or Admin, `/{locale}/about` when that
 * locale's About is public (published, required fields, EN checkbox; read
 * anonymously), else the global's edit page in /admin; everyone else
 * `/{locale}/about`.
 *
 * Learning Hub guide (M3-11): for the Editor or Admin, the guide's public
 * page in the posted locale (its own live slug, not the posted one) when
 * visitors can see it there (read anonymously, isResourceVisible), else the
 * record's edit page in /admin; everyone else the posted guide path when
 * locale and slug are valid, else `/`.
 */
export async function previewExitTarget(
  payload: AuthPort & FindPort & FindGlobalPort,
  headers: Headers,
  form: ExitForm,
): Promise<string> {
  const fallback = fallbackExitTarget(form);
  if (form.about) {
    const staff = await staffFromHeaders(payload, headers);
    if (!staff) return fallback;
    const live = await findPublicAbout(payload, form.about);
    return isAboutVisible(live, form.about) ? aboutPath(form.about) : ABOUT_ADMIN_PATH;
  }
  if (form.resource) {
    const staff = await staffFromHeaders(payload, headers);
    if (!staff) return fallback;
    if (!isLocale(form.locale)) return resourceAdminPath(form.resource);
    const live = await findPublicResource(payload, form.resource, form.locale);
    const target = live && live.type === "guide" && isResourceVisible(live, form.locale) ? resourcePath(form.locale, live.slug) : null;
    return target ?? resourceAdminPath(form.resource);
  }
  if (form.id === null) return fallback;
  const staff = await staffFromHeaders(payload, headers);
  if (!staff) return fallback;
  const live = await findPublicRef(payload, form.id);
  const liveTarget = live ? previewTarget(live) : null;
  if (liveTarget) return liveTarget;
  const record = await findDraftRef(payload, form.id, staff);
  return record ? adminEditPath(form.id) : fallback;
}

/** The latest version (draft included) of this locale with this slug, with the detail fields; or null. */
export async function findDraftPublication(payload: FindPort, locale: Locale, slug: string, user: StaffUser) {
  const result = await payload.find({
    collection: "publications",
    where: { and: [{ locale: { equals: locale } }, { slug: { equals: slug } }] },
    limit: 1,
    depth: 1,
    select: DETAIL_SELECT,
    populate: DETAIL_POPULATE,
    locale,
    fallbackLocale: false,
    draft: true,
    user,
    overrideAccess: false,
  });
  return result.docs[0] ?? null;
}

/**
 * Type and this locale's slug of the latest version (draft included) of a
 * Learning Hub resource, for the preview redirect (M3-11); or null.
 */
export async function findDraftResourceRef(payload: FindPort, id: number, locale: Locale, user: StaffUser) {
  const result = await payload.find({
    collection: "learning-resources",
    where: { id: { equals: id } },
    limit: 1,
    depth: 0,
    select: { type: true, slug: true },
    locale,
    fallbackLocale: false,
    draft: true,
    user,
    overrideAccess: false,
  });
  return result.docs[0] ?? null;
}

/** The latest version (draft included) of the guide of this locale with this slug, with the page fields; or null. */
export async function findDraftGuide(payload: FindPort, locale: Locale, slug: string, user: StaffUser) {
  const result = await payload.find({
    collection: "learning-resources",
    where: { and: [{ type: { equals: "guide" } }, { slug: { equals: slug } }] },
    limit: 1,
    depth: 1,
    select: GUIDE_SELECT,
    populate: RESOURCE_POPULATE,
    locale,
    fallbackLocale: false,
    draft: true,
    user,
    overrideAccess: false,
  });
  return result.docs[0] ?? null;
}

/** The latest version (draft included) of the `about` global in this locale, read as the staff user; or null. */
export async function findDraftAbout(payload: FindGlobalPort, locale: Locale, user: StaffUser) {
  const doc = await payload.findGlobal({
    slug: "about",
    locale,
    fallbackLocale: false,
    draft: true,
    user,
    overrideAccess: false,
    depth: 0,
  });
  return presentDoc(doc);
}
