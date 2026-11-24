import { createServerClient, type CookieOptions } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

import { readAuthEnv } from "./env";

/**
 * Server-side Supabase Auth adapter (M5-01/M5-02, DECISIONS §2.18
 * decision 3, DEC-008, ADR-0003). The only place that creates a Supabase
 * client; nothing here runs in the browser. One client per request: the
 * cookie jar reads the request's cookies and collects the cookies Supabase
 * wants to set (and the cache headers that must go with them), and the
 * caller writes them onto its own response.
 *
 * Session cookie `sb-<project ref>-auth-token` (chunked as `.0`, `.1`, …
 * when large; the PKCE flow can add `sb-<ref>-auth-token-code-verifier`):
 * HttpOnly, SameSite=Lax, Path=/, host-only, Secure on https.
 *
 * Callers verify identity with getUser() (account data, change of
 * password) or getClaims() (proxy.ts, reset of password), never with
 * getSession().
 */

// Fails `next build` and `next start` when the publishable key is set without the URL (lib/auth/env.ts).
readAuthEnv();

export type CookieToSet = { name: string; value: string; options: CookieOptions };

export type CookieJar = {
  getAll(): { name: string; value: string }[];
  setAll(cookies: CookieToSet[], headers: Record<string, string>): void;
};

/** The auth methods the app uses; nothing else of the Supabase client is reachable. */
export type AuthClient = Pick<
  SupabaseClient["auth"],
  "getClaims" | "getUser" | "resetPasswordForEmail" | "signInWithPassword" | "signOut" | "signUp" | "updateUser" | "verifyOtp"
>;

/** Session cookie names: `sb-<ref>-auth-token` and its chunks `.0`, `.1`, … (not the PKCE verifier). */
export const AUTH_COOKIE_PATTERN = /^sb-[a-z0-9]+-auth-token(?:\.\d+)?$/;

export const AUTH_COOKIE_OPTIONS = { httpOnly: true, sameSite: "lax", path: "/" } as const;

export function createAuthClient(jar: CookieJar, { secure }: { secure: boolean }): AuthClient {
  const env = readAuthEnv();
  if (!env) throw new Error("Auth is off (lib/auth/env.ts).");
  const client = createServerClient(env.url, env.publishableKey, {
    cookies: {
      getAll: () => jar.getAll(),
      setAll: (cookies, headers) => jar.setAll(cookies, headers),
    },
    cookieOptions: { ...AUTH_COOKIE_OPTIONS, secure },
  });
  return client.auth;
}

/** `[auth] <operation>: <code or name>`; never a message, email, token or URL. */
export function logAuthError(operation: string, error: unknown): void {
  const { code, name } = (error ?? {}) as { code?: unknown; name?: unknown };
  const label = typeof code === "string" && code !== "" ? code : typeof name === "string" ? name : "unknown";
  console.error(`[auth] ${operation}: ${label}`);
}
