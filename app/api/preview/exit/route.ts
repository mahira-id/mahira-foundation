import { draftMode } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";

import { exitTarget } from "@/lib/publications/preview";
import { isCmsEnabled } from "@/payload/env";

/**
 * Exit of the staff draft preview (M3-05, DECISIONS §2.11 P11 A): the
 * native POST form of the preview banner. Disables Draft Mode (Next adds
 * the clearing `__prerender_bypass` cookie to this response) and answers
 * 303 to the detail URL of the posted locale and slug when both are valid,
 * else to `/`. POST only; Next answers other methods with 405.
 */
export async function POST(request: NextRequest) {
  if (!isCmsEnabled()) {
    return new Response("Not Found", { status: 404, headers: { "Cache-Control": "no-store", "X-Robots-Tag": "noindex" } });
  }

  let locale = "";
  let slug = "";
  try {
    const form = await request.formData();
    const field = (name: string) => {
      const value = form.get(name);
      return typeof value === "string" ? value : "";
    };
    locale = field("locale");
    slug = field("slug");
  } catch {
    // Not a form body: no fields, so the exit goes to `/`.
  }

  (await draftMode()).disable();
  return NextResponse.redirect(new URL(exitTarget(locale, slug), request.url), 303);
}
