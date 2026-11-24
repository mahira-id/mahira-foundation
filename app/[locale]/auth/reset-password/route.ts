import type { NextRequest } from "next/server";

import { authPost } from "@/lib/auth/http";

/**
 * New-password form of `/{locale}/reset-password` (M5-02): POST only.
 * Same-origin check; accepted only with verified claims of a session from
 * an email link opened in the last hour (lib/auth/validation.ts
 * hasRecentRecovery), then
 * updateUser; otherwise 303 to the forgot-password page with `link-invalid`.
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ locale: string }> }) {
  return authPost(request, params, "reset-password");
}
