import type { NextRequest } from "next/server";

import { authPost } from "@/lib/auth/http";

/**
 * Forgot-password form of `/{locale}/forgot-password` (M5-02): POST only.
 * Same-origin check, then resetPasswordForEmail with the email link to
 * `/{locale}/auth/confirm`; 303 with `check-email` whether or not the email
 * has an account (lib/auth/actions.ts).
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ locale: string }> }) {
  return authPost(request, params, "forgot-password");
}
