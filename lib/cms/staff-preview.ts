import type { Payload } from "payload";

import { DETAIL_POPULATE, DETAIL_SELECT, findPublicRef } from "@/lib/cms/publication-detail-query";
import type { Locale } from "@/lib/i18n/locales";
import { adminEditPath, exitTarget, previewTarget } from "@/lib/publications/preview";
import { staffRoleOfUser } from "@/payload/access/roles";

/**
 * Server-only. Staff draft preview reads (M3-05, DECISIONS §2.11 P11 A,
 * P14 A): the only module that reads drafts for a public URL. Used only
 * behind a verified staff session: the preview handler
 * (app/api/preview/route.ts) checks it before it enables Draft Mode,
 * getPublicationDetail (lib/cms/public-content.ts) checks it again on every
 * request in Draft Mode, and the exit handler (app/api/preview/exit/route.ts)
 * checks it before it sends anyone to /admin. Reads run as that user with
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

export type ExitForm = { id: number | null; locale: string; slug: string };

/**
 * Where the exit of the staff preview goes (M3-05b; Owner 2026-11-13).
 * For the Editor or Admin of the request: the public detail of the record's
 * live version when visitors can see it (published + public, read
 * anonymously; its own locale and slug), else the record's edit page in
 * /admin when the record exists. Everyone else, a missing id or an unknown
 * record: exitTarget of the posted fields, as before. Only paths of this
 * site, never a URL from the form.
 */
export async function previewExitTarget(payload: AuthPort & FindPort, headers: Headers, form: ExitForm): Promise<string> {
  const fallback = exitTarget(form.locale, form.slug);
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
