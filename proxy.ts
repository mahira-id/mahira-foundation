import { NextResponse, type NextRequest } from "next/server";
import { isCmsEnabled } from "@/payload/env";

/**
 * CMS gate (M3-00, Owner 2026-11-10, Opsi A).
 *
 * When the CMS is off (no CMS env, or VERCEL_ENV=production; see
 * payload/env.ts), `/admin` and `/api/*` answer 404. Payload Server Functions
 * POST to `/admin`, so they are covered too. The CMS-backed public pages
 * `/id/publications` and `/en/publications` (M3-01) answer 404 as well, so
 * Production shows no publication pages until M4.
 *
 * This is a gate, not authorization: when the CMS is on, Payload access
 * control still decides every request. `/api/*` is Payload REST only today;
 * revisit the matcher when app API routes arrive (M5).
 *
 * Admin login redirect (item 1c, DECISIONS §2.10): when the CMS is on, a GET
 * to a protected admin page without a Payload auth cookie gets an HTTP 307 to
 * the login page. Payload would redirect too, but inside the rendered page;
 * with `cacheComponents` and `partialPrefetching` the browser kept that
 * redirect as the `/admin` page and replayed it after login (endless
 * `/admin` ↔ `/admin/login` loop). This only checks that a cookie exists;
 * Payload still verifies the token on every request.
 */
export function proxy(request: NextRequest) {
  if (isCmsEnabled()) {
    return needsAdminLogin(request) ? redirectToAdminLogin(request) : NextResponse.next();
  }
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
  matcher: ["/admin/:path*", "/api/:path*", "/id/publications/:path*", "/en/publications/:path*"],
};
