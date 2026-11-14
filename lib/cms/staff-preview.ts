import type { Payload } from "payload";

import { DETAIL_POPULATE, DETAIL_SELECT } from "@/lib/cms/publication-detail-query";
import type { Locale } from "@/lib/i18n/locales";
import { staffRoleOfUser } from "@/payload/access/roles";

/**
 * Server-only. Staff draft preview reads (M3-05, DECISIONS §2.11 P11 A,
 * P14 A): the only module that reads drafts for a public URL. Used only
 * behind a verified staff session: the preview handler
 * (app/api/preview/route.ts) checks it before it enables Draft Mode, and
 * getPublicationDetail (lib/cms/public-content.ts) checks it again on every
 * request in Draft Mode. Reads run as that user with `overrideAccess: false`
 * and `fallbackLocale: false`, so Payload access control still applies.
 * Index and homepage reads never come here.
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
