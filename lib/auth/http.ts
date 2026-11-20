import { NextResponse, type NextRequest } from "next/server";

import { isLocale, type Locale } from "@/lib/i18n/locales";

import { confirm, FORM_ACTIONS, type ActionContext, type ActionResult, type FormActionName } from "./actions";
import { isAuthEnabled } from "./env";
import { statusHref } from "./routes";
import { AUTH_COOKIE_OPTIONS, AUTH_COOKIE_PATTERN, createAuthClient, logAuthError, type CookieJar, type CookieToSet } from "./supabase";
import { isSameOrigin } from "./validation";

/**
 * Responses of the account route handlers (M5-02). Every step is a
 * full-document request: a native `<form method="post">` → 303 → GET of a
 * page, and the email link GET → 303. The client router never stores an
 * auth redirect (DECISIONS §2.10).
 *
 * - Accounts off (lib/auth/env.ts) or an unknown locale: 404. proxy.ts
 *   already answers 404 then; this repeats it.
 * - POST without a same-origin `Origin` header: 403, no cookie, no
 *   Supabase call.
 * - Otherwise 303 to the action's target, with the cookies Supabase set,
 *   its cache headers, `Cache-Control: private, no-store` and
 *   `X-Robots-Tag: noindex`.
 */
const PRIVATE_HEADERS = { "Cache-Control": "private, no-store", "X-Robots-Tag": "noindex" } as const;

type Params = Promise<{ locale: string }>;

function plain(status: 403 | 404): Response {
  return new Response(status === 404 ? "Not Found" : "Forbidden", {
    status,
    headers: { "Cache-Control": status === 404 ? "no-store" : PRIVATE_HEADERS["Cache-Control"], "X-Robots-Tag": "noindex" },
  });
}

/** Cookie jar over the request's cookies; collects what Supabase sets. */
function requestJar(request: NextRequest): CookieJar & { cookies: CookieToSet[]; headers: Record<string, string> } {
  const jar = {
    cookies: [] as CookieToSet[],
    headers: {} as Record<string, string>,
    getAll: () => request.cookies.getAll().map(({ name, value }) => ({ name, value })),
    setAll(cookies: CookieToSet[], headers: Record<string, string>) {
      jar.cookies.push(...cookies);
      Object.assign(jar.headers, headers);
    },
  };
  return jar;
}

function redirect(request: NextRequest, result: ActionResult, jar: ReturnType<typeof requestJar>, secure: boolean): NextResponse {
  const response = NextResponse.redirect(new URL(result.location, request.url), 303);
  for (const [name, value] of Object.entries(PRIVATE_HEADERS)) response.headers.set(name, value);
  for (const [name, value] of Object.entries(jar.headers)) response.headers.set(name, value);
  for (const { name, value, options } of jar.cookies) response.cookies.set(name, value, options);
  if (result.clearSession) {
    const written = new Set(jar.cookies.map(({ name }) => name));
    for (const { name } of request.cookies.getAll()) {
      if (AUTH_COOKIE_PATTERN.test(name) && !written.has(name)) {
        response.cookies.set(name, "", { ...AUTH_COOKIE_OPTIONS, secure, maxAge: 0 });
      }
    }
  }
  return response;
}

async function localeOf(params: Params): Promise<Locale | null> {
  const { locale } = await params;
  return isLocale(locale) ? locale : null;
}

/** POST `/{locale}/auth/{action}`: Origin check, form read, action, 303. */
export async function authPost(request: NextRequest, params: Params, action: FormActionName): Promise<Response> {
  if (!isAuthEnabled()) return plain(404);
  const locale = await localeOf(params);
  if (locale === null) return plain(404);
  if (!isSameOrigin(request.headers)) return plain(403);

  let form: FormData | URLSearchParams;
  try {
    form = await request.formData();
  } catch {
    form = new URLSearchParams();
  }
  const secure = request.nextUrl.protocol === "https:";
  const jar = requestJar(request);
  const context: ActionContext = {
    locale,
    origin: new URL(request.headers.get("origin") as string).origin,
    nowSeconds: Math.floor(Date.now() / 1000),
  };
  const { run, failure } = FORM_ACTIONS[action];
  let result: ActionResult;
  try {
    result = await run(form, createAuthClient(jar, { secure }), context);
  } catch (error) {
    logAuthError(action, error);
    result = failure(context);
  }
  return redirect(request, result, jar, secure);
}

/** GET `/{locale}/auth/confirm`: the email link (verifyOtp), 303. */
export async function authConfirm(request: NextRequest, params: Params): Promise<Response> {
  // Read the request first: with Cache Components this keeps the handler out of prerendering.
  const search = new URLSearchParams(request.nextUrl.search);
  if (!isAuthEnabled()) return plain(404);
  const locale = await localeOf(params);
  if (locale === null) return plain(404);
  const secure = request.nextUrl.protocol === "https:";
  const jar = requestJar(request);
  const context: ActionContext = { locale, origin: request.nextUrl.origin, nowSeconds: Math.floor(Date.now() / 1000) };
  let result: ActionResult;
  try {
    result = await confirm(search, createAuthClient(jar, { secure }), context);
  } catch (error) {
    logAuthError("confirm", error);
    result = { location: statusHref(locale, "login", "link-invalid") };
  }
  return redirect(request, result, jar, secure);
}
