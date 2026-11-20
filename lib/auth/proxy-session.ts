import { NextResponse, type NextRequest } from "next/server";

import type { Locale } from "@/lib/i18n/locales";

import { authPagePath } from "./routes";
import { AUTH_COOKIE_PATTERN, createAuthClient, logAuthError, type CookieToSet } from "./supabase";

/**
 * Session refresh of proxy.ts on `GET /{locale}/account` (M5-02, DECISIONS
 * §2.18 decision 13; Supabase SSR guide, read 2026-11-20). A coarse gate,
 * not authorization: the account page reads the user with getUser() and
 * the form handlers verify on their own.
 *
 * - No session cookie: 307 to `/{locale}/login`, without a Supabase call.
 * - getClaims() fails (bad or expired token that cannot be refreshed,
 *   garbage cookie, network error): 307 to `/{locale}/login`, with the
 *   cookie removals Supabase asked for.
 * - Valid: the request goes on with the refreshed cookies (request and
 *   response), Supabase's cache headers, `Cache-Control: private, no-store`
 *   and `X-Robots-Tag: noindex`.
 *
 * The login target has no query string and no return path: nothing from
 * the request goes into a redirect.
 */
const PRIVATE_HEADERS = { "Cache-Control": "private, no-store", "X-Robots-Tag": "noindex" } as const;

export function hasSessionCookie(request: NextRequest): boolean {
  return request.cookies.getAll().some(({ name, value }) => value !== "" && AUTH_COOKIE_PATTERN.test(name));
}

function decorate(response: NextResponse, cookies: CookieToSet[], cacheHeaders: Record<string, string>): NextResponse {
  for (const [name, value] of Object.entries(PRIVATE_HEADERS)) response.headers.set(name, value);
  for (const [name, value] of Object.entries(cacheHeaders)) response.headers.set(name, value);
  for (const { name, value, options } of cookies) response.cookies.set(name, value, options);
  return response;
}

function toLogin(request: NextRequest, locale: Locale, cookies: CookieToSet[] = [], cacheHeaders: Record<string, string> = {}): NextResponse {
  return decorate(NextResponse.redirect(new URL(authPagePath(locale, "login"), request.url), 307), cookies, cacheHeaders);
}

export async function refreshAccountSession(request: NextRequest, locale: Locale): Promise<NextResponse> {
  if (!hasSessionCookie(request)) return toLogin(request, locale);

  const cookies: CookieToSet[] = [];
  const cacheHeaders: Record<string, string> = {};
  const client = createAuthClient(
    {
      getAll: () => request.cookies.getAll().map(({ name, value }) => ({ name, value })),
      setAll(toSet, headers) {
        for (const cookie of toSet) {
          cookies.push(cookie);
          // The page renders from the request's cookies: hand it the refreshed ones.
          if (cookie.value === "") request.cookies.delete(cookie.name);
          else request.cookies.set(cookie.name, cookie.value);
        }
        Object.assign(cacheHeaders, headers);
      },
    },
    { secure: request.nextUrl.protocol === "https:" },
  );

  let valid = false;
  try {
    const { data, error } = await client.getClaims();
    if (error) logAuthError("proxy", error);
    valid = !error && typeof data?.claims?.sub === "string" && data.claims.sub !== "";
  } catch (error) {
    logAuthError("proxy", error);
  }
  if (!valid) return toLogin(request, locale, cookies, cacheHeaders);
  return decorate(NextResponse.next({ request }), cookies, cacheHeaders);
}
