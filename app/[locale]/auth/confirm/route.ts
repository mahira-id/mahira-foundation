import type { NextRequest } from "next/server";

import { authConfirm } from "@/lib/auth/http";

/**
 * The link of the Supabase emails (M5-02, DECISIONS §2.18 decision 7):
 * `GET /{locale}/auth/confirm?token_hash=…&type=email|recovery`. verifyOtp
 * signs the user in; 303 to the account page (`email-confirmed`), to the
 * reset page (recovery) or to the login page (`link-invalid`). The locale
 * comes from this path, which the email template takes from RedirectTo.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ locale: string }> }) {
  return authConfirm(request, params);
}
