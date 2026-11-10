import { NextResponse } from "next/server";
import { isCmsEnabled } from "@/payload/env";

/**
 * CMS gate (M3-00, Owner 2026-11-10, Opsi A).
 *
 * When the CMS is off (no CMS env, or VERCEL_ENV=production; see
 * payload/env.ts), `/admin` and `/api/*` answer 404. Payload Server Functions
 * POST to `/admin`, so they are covered too.
 *
 * This is a gate, not authorization: when the CMS is on, Payload access
 * control still decides every request. `/api/*` is Payload REST only today;
 * revisit the matcher when app API routes arrive (M5).
 */
export function proxy() {
  if (isCmsEnabled()) {
    return NextResponse.next();
  }
  return new NextResponse("Not Found", {
    status: 404,
    headers: { "X-Robots-Tag": "noindex", "Cache-Control": "no-store" },
  });
}

export const config = {
  matcher: ["/admin/:path*", "/api/:path*"],
};
