import type { NextRequest } from "next/server";

import { authPost } from "@/lib/auth/http";

/**
 * Change-password form of the account page (M5-02, DECISIONS §2.18
 * decision 13): POST only. Same-origin check, getUser() (no user: login
 * `session-ended`), the current password checked against that user's
 * email, then updateUser (lib/auth/actions.ts).
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ locale: string }> }) {
  return authPost(request, params, "change-password");
}
