import type { NextRequest } from "next/server";

import { authPost } from "@/lib/auth/http";

/**
 * Registration form of `/{locale}/register` (M5-02): POST only. Same-origin
 * check, then signUp with the email link to `/{locale}/auth/confirm`; 303
 * to the register page with `check-email` whether or not the email already
 * has an account (lib/auth/actions.ts).
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ locale: string }> }) {
  return authPost(request, params, "register");
}
