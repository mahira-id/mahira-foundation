import { NextResponse, type NextRequest } from "next/server";

import { ANONYMOUS, type Principal } from "@/lib/access/evaluator";
import { SESSION_CACHE_CONTROL } from "@/lib/publications/file-download";

import { isAuthEnabled } from "./env";
import { hasSessionCookie } from "./proxy-session";
import { createAuthClient, logAuthError, type CookieJar, type CookieToSet } from "./supabase";

/**
 * The public principal of a `registered` file download (M5-04, DECISIONS
 * §2.18 decisions 12 and 13): read by the download route itself, only for
 * a file whose effective level is `registered` (lib/access/file-download.ts).
 *
 * - Accounts off, or no non-empty `sb-<ref>-auth-token` cookie: anonymous,
 *   without a Supabase call.
 * - Otherwise getUser() (verified by the Auth server, never getSession()).
 *   It refreshes an expired access token with the refresh token; the
 *   cookies Supabase sets (refreshed session or removals) and its cache
 *   headers are collected so the route writes them onto its own answer,
 *   whatever that answer is (a dropped refresh would end the session, as
 *   refresh tokens rotate).
 * - Any error or a user without email: anonymous. AuthSessionMissingError
 *   is not logged; other errors log `[auth] download: <code or name>` only.
 * - A user: `public_user` with `emailVerified` from `email_confirmed_at`.
 *
 * The Payload cookie (`payload-token`) is never read: a staff session is
 * anonymous here (DEC-009). proxy.ts does not refresh this route; the
 * refresh happens here, on a 303/307/404 that is never cached.
 */
export type DownloadSession = {
  principal: Principal;
  cookies: CookieToSet[];
  headers: Record<string, string>;
};

type ClientFactory = typeof createAuthClient;

export async function readDownloadPrincipal(request: NextRequest, createClient: ClientFactory = createAuthClient): Promise<DownloadSession> {
  const session: DownloadSession = { principal: ANONYMOUS, cookies: [], headers: {} };
  if (!isAuthEnabled() || !hasSessionCookie(request)) return session;
  const jar: CookieJar = {
    getAll: () => request.cookies.getAll().map(({ name, value }) => ({ name, value })),
    setAll(cookies, headers) {
      session.cookies.push(...cookies);
      Object.assign(session.headers, headers);
    },
  };
  try {
    const { data, error } = await createClient(jar, { secure: request.nextUrl.protocol === "https:" }).getUser();
    if (error) {
      if (error.name !== "AuthSessionMissingError") logAuthError("download", error);
      return session;
    }
    const user = data.user;
    if (!user || typeof user.email !== "string" || user.email === "") return session;
    session.principal = { kind: "public_user", emailVerified: Boolean(user.email_confirmed_at) };
  } catch (error) {
    logAuthError("download", error);
  }
  return session;
}

/**
 * The route's answer with what reading the session produced: Supabase's
 * cache headers, then `Cache-Control: private, no-store` (the answer
 * depends on the session and is never cached), and the cookies Supabase
 * set. Status, body, `Location` and `X-Robots-Tag` stay as they are.
 */
export function withSessionWrites(response: Response, session: DownloadSession): NextResponse {
  const next = new NextResponse(response.body, { status: response.status, headers: response.headers });
  for (const [name, value] of Object.entries(session.headers)) next.headers.set(name, value);
  next.headers.set("Cache-Control", SESSION_CACHE_CONTROL);
  for (const { name, value, options } of session.cookies) next.cookies.set(name, value, options);
  return next;
}
