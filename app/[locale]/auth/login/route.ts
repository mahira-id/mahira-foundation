import type { NextRequest } from "next/server";

import { authPost } from "@/lib/auth/http";

/**
 * Login form of `/{locale}/login` (M5-02): POST only (Next answers other
 * methods with 405). Same-origin check, then signInWithPassword; 303 to
 * the account page or back to the login page with a generic status
 * (lib/auth/actions.ts).
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ locale: string }> }) {
  return authPost(request, params, "login");
}
