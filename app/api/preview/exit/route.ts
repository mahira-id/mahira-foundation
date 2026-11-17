import config from "@payload-config";
import { draftMode } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { getPayload } from "payload";

import { fallbackExitTarget, previewExitTarget, type ExitForm } from "@/lib/cms/staff-preview";
import { readErrorLabel } from "@/lib/home/homepage-view";
import { isLocale } from "@/lib/i18n/locales";
import { parsePreviewId } from "@/lib/publications/preview";
import { isCmsEnabled } from "@/payload/env";

/**
 * Exit of the staff draft preview (M3-05, DECISIONS §2.11 P11 A; target
 * since M3-05b): the native POST form of the preview banner (fields `id`,
 * `locale`, `slug`; since M3-09 the About banner posts `about` = its
 * locale). Disables Draft Mode (Next adds the clearing `__prerender_bypass`
 * cookie to this response) and answers 303 to previewExitTarget: for a
 * verified Editor/Admin session the public detail of the live version (or
 * the public About page), else the record's (or the global's) edit page in
 * /admin; without a staff session, the detail URL of the posted locale and
 * slug when both are valid (the About path of a valid `about` locale), else
 * `/`. A failed CMS read logs the error name only and uses that last
 * target. POST only; Next answers other methods with 405.
 */
export async function POST(request: NextRequest) {
  if (!isCmsEnabled()) {
    return new Response("Not Found", { status: 404, headers: { "Cache-Control": "no-store", "X-Robots-Tag": "noindex" } });
  }

  const form: ExitForm = { id: null, locale: "", slug: "", about: null };
  try {
    const body = await request.formData();
    const field = (name: string) => {
      const value = body.get(name);
      return typeof value === "string" ? value : "";
    };
    form.id = parsePreviewId(field("id"));
    form.locale = field("locale");
    form.slug = field("slug");
    const about = field("about");
    form.about = isLocale(about) ? about : null;
  } catch {
    // Not a form body: no fields, so the exit goes to `/`.
  }

  (await draftMode()).disable();
  let target = fallbackExitTarget(form);
  try {
    const payload = await getPayload({ config });
    target = await previewExitTarget(payload, request.headers, form);
  } catch (error) {
    console.error("[preview] CMS read failed:", readErrorLabel(error));
  }
  return NextResponse.redirect(new URL(target, request.url), 303);
}
