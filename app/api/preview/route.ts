import config from "@payload-config";
import { draftMode } from "next/headers";
import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import { getPayload } from "payload";

import { findDraftRef, staffFromHeaders } from "@/lib/cms/staff-preview";
import { readErrorLabel } from "@/lib/home/homepage-view";
import { parsePreviewId, previewTarget } from "@/lib/publications/preview";
import { isCmsEnabled } from "@/payload/env";

/**
 * Staff draft preview entry (M3-05, DECISIONS §2.11 P11 A, P14 A): the
 * Preview button of a Publication in /admin opens `/api/preview?id=<id>`.
 * Only an Editor or Admin session (Payload `payload-token` cookie) gets
 * Draft Mode, and only after the check; the redirect goes to the stored
 * draft's detail URL, never to a URL from the query. Every other request
 * (CMS off, bad id, no or invalid session, unknown record, no valid
 * locale/slug) gets the same 404, and the Draft Mode cookie is not set.
 * This static route wins over Payload's `/api/[...slug]`.
 */
const PRIVATE = { "Cache-Control": "no-store", "X-Robots-Tag": "noindex" };

function denied(): Response {
  return new Response("Not Found", { status: 404, headers: PRIVATE });
}

export async function GET(request: NextRequest) {
  // Read the request first: the handler is never prerendered (Cache Components).
  const id = parsePreviewId(request.nextUrl.searchParams.get("id"));
  if (!isCmsEnabled() || id === null) return denied();

  let target: string | null;
  try {
    const payload = await getPayload({ config });
    const staff = await staffFromHeaders(payload, request.headers);
    if (!staff) return denied();
    const doc = await findDraftRef(payload, id, staff);
    target = doc ? previewTarget(doc) : null;
  } catch (error) {
    console.error("[preview] CMS read failed:", readErrorLabel(error));
    return new Response("Preview could not be loaded", { status: 500, headers: PRIVATE });
  }
  if (!target) return denied();

  // Outside the try: enable() sets the cookie, redirect() throws Next's redirect (307).
  (await draftMode()).enable();
  redirect(target);
}
