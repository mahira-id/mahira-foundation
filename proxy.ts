import { NextResponse, type NextRequest } from "next/server";
import { isAuthEnabled } from "@/lib/auth/env";
import { refreshAccountSession } from "@/lib/auth/proxy-session";
import { parseAuthPath } from "@/lib/auth/routes";
import { isCmsEnabled } from "@/payload/env";

/**
 * Account gate (M5-02, DECISIONS §2.18 decisions 4, 5 and 13), checked
 * before the CMS gate. The public-account routes `/{id,en}/{login,register,
 * forgot-password,reset-password,account}` and the form handlers
 * `/{id,en}/auth/*` answer the same closed 404 while accounts are off (no
 * APP_SUPABASE_PUBLISHABLE_KEY, or VERCEL_ENV=production; lib/auth/env.ts),
 * also for POST. While they are on, only `GET /{locale}/account` touches the
 * session here: lib/auth/proxy-session.ts refreshes it with getClaims() or
 * answers 307 to `/{locale}/login`. Every other account path goes on with
 * `X-Robots-Tag: noindex`; the handlers check Origin and verify identity
 * themselves. This is a gate, not authorization. The account routes live
 * outside `/api`, so `/api/*` stays behind the CMS gate below. Upgrade
 * review item: the matcher entries (DEC-006, ENVIRONMENTS §3.1).
 *
 * CMS gate (M3-00, Owner 2026-11-10, Opsi A).
 *
 * When the CMS is off (no CMS env, or VERCEL_ENV=production; see
 * payload/env.ts), `/admin` and `/api/*` answer 404. Payload Server Functions
 * POST to `/admin`, so they are covered too. The CMS-backed public pages
 * `/id/publications` and `/en/publications` (M3-01) answer 404 as well, so
 * Production shows no publication pages until M4. The About page
 * `/id/about` and `/en/about` (M3-09, DECISIONS §2.15 decision 1) is
 * CMS-backed too and answers the same 404, and so do the Learning Hub
 * catalog and detail pages `/{id,en}/learning-hub/...` (M3-12, DECISIONS
 * §2.16 decision 7A). Upgrade review item: the matcher entries (DEC-006,
 * ENVIRONMENTS §3.1).
 *
 * This is a gate, not authorization: when the CMS is on, Payload access
 * control and the app route handlers still decide every request. `/api/*`
 * holds Payload REST and the CMS-backed app routes: the staff preview
 * (`/api/preview`, M3-05), the public file download
 * (`/api/files/{id}/download`, M3-08) and the `/api/media/file/*` 404
 * (M3-08); all of them need the CMS, so the whole prefix stays closed while
 * it is off. The M5 account handlers are not under `/api` (see above), so
 * this still holds; revisit it when an app API route must work without the
 * CMS.
 *
 * Admin login redirect (item 1c, DECISIONS §2.10): when the CMS is on, a GET
 * to a protected admin page without a Payload auth cookie gets an HTTP 307 to
 * the login page. Payload would redirect too, but inside the rendered page;
 * with `cacheComponents` and `partialPrefetching` the browser kept that
 * redirect as the `/admin` page and replayed it after login (endless
 * `/admin` ↔ `/admin/login` loop). This only checks that a cookie exists;
 * Payload still verifies the token on every request.
 */
export async function proxy(request: NextRequest) {
  const account = parseAuthPath(request.nextUrl.pathname);
  if (account) {
    if (!isAuthEnabled()) return closed();
    if (account.kind === "account" && request.method === "GET") return refreshAccountSession(request, account.locale);
    const response = NextResponse.next();
    response.headers.set("X-Robots-Tag", "noindex");
    return response;
  }
  if (isCmsEnabled()) {
    return needsAdminLogin(request) ? redirectToAdminLogin(request) : NextResponse.next();
  }
  return closed();
}

function closed(): NextResponse {
  return new NextResponse("Not Found", {
    status: 404,
    headers: { "X-Robots-Tag": "noindex", "Cache-Control": "no-store" },
  });
}

/**
 * Payload's auth cookie is `<cookiePrefix>-token`; payload.config.ts does not
 * set `cookiePrefix`, so Payload 3.93.0 uses its default "payload".
 * Upgrade review item (DEC-006, ENVIRONMENTS §3.1).
 */
export const PAYLOAD_TOKEN_COOKIE = "payload-token";

const ADMIN_ROUTE = "/admin";
const LOGIN_ROUTE = "/admin/login";

/**
 * Admin pages Payload 3.93.0 serves without a login, copied from
 * `isPublicAdminRoute` (@payloadcms/next/dist/utilities/isPublicAdminRoute.js)
 * with the default `admin.routes`: a prefix match on the path after `/admin`
 * (`/logout` also covers `/logout-inactivity`). Upgrade review item (DEC-006,
 * ENVIRONMENTS §3.1).
 */
const PUBLIC_ADMIN_PREFIXES = ["/create-first-user", "/forgot", "/login", "/logout", "/reset", "/unauthorized"] as const;

function isAdminPath(pathname: string): boolean {
  return pathname === ADMIN_ROUTE || pathname.startsWith(`${ADMIN_ROUTE}/`);
}

/**
 * Payload also serves `<auth collection>/verify/<token>` without a login. The
 * collection is not checked here: a wrong slug only passes the request on to
 * Payload, which then decides.
 */
export function isPublicAdminPath(pathname: string): boolean {
  const route = pathname.slice(ADMIN_ROUTE.length);
  const segments = route.split("/").filter(Boolean);
  if (segments.length === 3 && segments[1] === "verify") return true;
  return PUBLIC_ADMIN_PREFIXES.some((prefix) => route.startsWith(prefix));
}

/** GET of a protected admin page without a (non-empty) Payload auth cookie. */
function needsAdminLogin(request: NextRequest): boolean {
  const { pathname } = request.nextUrl;
  return (
    request.method === "GET" &&
    isAdminPath(pathname) &&
    !isPublicAdminPath(pathname) &&
    !request.cookies.get(PAYLOAD_TOKEN_COOKIE)?.value
  );
}

/**
 * 307 to `/admin/login`, with `?redirect=` built like Payload's
 * `handleAuthRedirect`: none for `/admin` itself, otherwise the path and
 * query, without Next's `_rsc` and without an earlier `redirect`.
 */
function redirectToAdminLogin(request: NextRequest): NextResponse {
  const { pathname, search } = request.nextUrl;
  const login = new URL(LOGIN_ROUTE, request.url);
  if (pathname !== ADMIN_ROUTE) {
    const query = new URLSearchParams(search);
    query.delete("_rsc");
    query.delete("redirect");
    const rest = query.toString();
    login.searchParams.set("redirect", rest ? `${pathname}?${rest}` : pathname);
  }
  return NextResponse.redirect(login, 307);
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/api/:path*",
    "/id/publications/:path*",
    "/en/publications/:path*",
    "/id/about/:path*",
    "/en/about/:path*",
    "/id/learning-hub/:path*",
    "/en/learning-hub/:path*",
    // M5-02: the public-account pages and form handlers (lib/auth/routes.ts).
    "/id/login/:path*",
    "/en/login/:path*",
    "/id/register/:path*",
    "/en/register/:path*",
    "/id/forgot-password/:path*",
    "/en/forgot-password/:path*",
    "/id/reset-password/:path*",
    "/en/reset-password/:path*",
    "/id/account/:path*",
    "/en/account/:path*",
    "/id/auth/:path*",
    "/en/auth/:path*",
  ],
};
