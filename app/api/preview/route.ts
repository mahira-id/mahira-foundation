import config from "@payload-config";
import { draftMode } from "next/headers";
import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import { getPayload } from "payload";

import { findDraftRef, findDraftResourceRef, staffFromHeaders } from "@/lib/cms/staff-preview";
import { readErrorLabel } from "@/lib/home/homepage-view";
import { aboutPath, parsePreviewRequest, previewTarget, resourcePath } from "@/lib/publications/preview";
import { isCmsEnabled } from "@/payload/env";

/**
 * Staff draft preview entry (M3-05, DECISIONS §2.11 P11 A, P14 A): the
 * Preview button of a Publication in /admin opens `/api/preview?id=<id>`;
 * since M3-09 (DECISIONS §2.15 decision 7B) the Preview button of the
 * `about` global opens `/api/preview?about=<locale>`; since M3-11
 * (DECISIONS §2.16 decision 12A) the Preview button of a Learning Hub guide
 * opens `/api/preview?resource=<id>&locale=<locale>`. Exactly one of the
 * three (parsePreviewRequest). Only an Editor or Admin session (Payload
 * `payload-token` cookie) gets Draft Mode, and only after the check; the
 * redirect goes to the stored draft's detail URL, to `/{locale}/about`
 * built from the validated locale, or to the latest version's guide path
 * `/{locale}/learning-hub/{slug}` (a guide only), never to a URL from the
 * query. Every
 * other request (CMS off, bad or both parameters, no or invalid session,
 * unknown record, no valid locale/slug) gets the same 404, and the Draft
 * Mode cookie is not set. This static route wins over Payload's
 * `/api/[...slug]`.
 */
const PRIVATE = { "Cache-Control": "no-store", "X-Robots-Tag": "noindex" };

function denied(): Response {
  return new Response("Not Found", { status: 404, headers: PRIVATE });
}

export async function GET(request: NextRequest) {
  // Read the request first: the handler is never prerendered (Cache Components).
  const preview = parsePreviewRequest(request.nextUrl.searchParams);
  if (!isCmsEnabled() || preview === null) return denied();

  let target: string | null;
  try {
    const payload = await getPayload({ config });
    const staff = await staffFromHeaders(payload, request.headers);
    if (!staff) return denied();
    if (preview.kind === "about") {
      // The page reads the latest version for this staff session (getAboutPage).
      target = aboutPath(preview.locale);
    } else if (preview.kind === "resource") {
      // Guides only (videos and playlists have no page; toolkit preview is M3-13).
      const doc = await findDraftResourceRef(payload, preview.id, preview.locale, staff);
      target = doc && doc.type === "guide" ? resourcePath(preview.locale, doc.slug) : null;
    } else {
      const doc = await findDraftRef(payload, preview.id, staff);
      target = doc ? previewTarget(doc) : null;
    }
  } catch (error) {
    console.error("[preview] CMS read failed:", readErrorLabel(error));
    return new Response("Preview could not be loaded", { status: 500, headers: PRIVATE });
  }
  if (!target) return denied();

  // Outside the try: enable() sets the cookie, redirect() throws Next's redirect (307).
  (await draftMode()).enable();
  redirect(target);
}
