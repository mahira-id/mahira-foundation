import type { NextRequest } from "next/server";

import { authPost } from "@/lib/auth/http";

/**
 * Logout form of the account page (M5-02): POST only. Same-origin check,
 * then a local sign-out; the session cookies are expired in any case and
 * the answer is 303 to the login page with `signed-out`.
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ locale: string }> }) {
  return authPost(request, params, "logout");
}
