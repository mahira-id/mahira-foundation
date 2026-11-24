import { isLocale, type Locale } from "@/lib/i18n/locales";

/**
 * Public-account routes (M5-02, DECISIONS §2.18 decision 13, ADR-0005):
 * English segments under the locale prefix, all noindex and outside the
 * sitemap. Pages: `/{locale}/{login,register,forgot-password,reset-password,account}`.
 * Form handlers: `/{locale}/auth/{login,register,logout,forgot-password,
 * reset-password,change-password}` (POST) and `/{locale}/auth/confirm` (GET,
 * the email link). Every redirect target is built here from the locale and
 * a fixed segment; the only request value that reaches one is the login
 * return path (M5-04), and only after validation.readReturnPath accepted it
 * as a publication detail path, so there is no open redirect.
 *
 * Statuses (`?status=`) are closed lists per page. readStatus() ignores any
 * other value, so the page never shows request input.
 *
 * Imports only lib/i18n/locales.ts (itself import-free), because proxy.ts
 * imports it.
 */

export const AUTH_PAGES = ["login", "register", "forgot-password", "reset-password", "account"] as const;
export type AuthPage = (typeof AUTH_PAGES)[number];

export const AUTH_HANDLERS = [
  "login",
  "register",
  "logout",
  "forgot-password",
  "reset-password",
  "change-password",
  "confirm",
] as const;
export type AuthHandler = (typeof AUTH_HANDLERS)[number];

/** Path segment of the form handlers: `/{locale}/auth/...`. */
export const AUTH_HANDLER_SEGMENT = "auth";

/**
 * Form field names shared by the pages and the handlers. `returnTo` is also
 * the login page's query parameter (`?next=`, M5-04): the detail page a
 * locked file came from, checked by validation.readReturnPath wherever it
 * is read.
 */
export const AUTH_FIELDS = {
  email: "email",
  password: "password",
  passwordConfirm: "password_confirm",
  currentPassword: "current_password",
  returnTo: "next",
} as const;

/** Query parameters of the email link (Supabase email templates, ENVIRONMENTS §3.1). */
export const CONFIRM_PARAMS = { tokenHash: "token_hash", type: "type" } as const;

export const AUTH_STATUSES = {
  login: ["invalid", "rate-limited", "error", "signed-out", "session-ended", "link-invalid", "invalid-input"],
  register: ["check-email", "invalid-input", "password-mismatch", "weak-password", "rate-limited", "error"],
  "forgot-password": ["check-email", "invalid-input", "rate-limited", "error", "link-invalid"],
  "reset-password": ["invalid-input", "password-mismatch", "weak-password", "same-password", "error"],
  account: [
    "email-confirmed",
    "password-changed",
    "invalid-current",
    "invalid-input",
    "password-mismatch",
    "weak-password",
    "same-password",
    "error",
  ],
} as const satisfies Record<AuthPage, readonly string[]>;

export type AuthStatus<P extends AuthPage> = (typeof AUTH_STATUSES)[P][number];

export type AuthPath = { locale: Locale; kind: "page" | "account" | "handler" };

/**
 * Classifies a pathname covered by the account matcher entries of proxy.ts:
 * `account` for `/{locale}/account[/...]`, `handler` for `/{locale}/auth[/...]`,
 * `page` for the other account pages; null for anything else.
 */
export function parseAuthPath(pathname: string): AuthPath | null {
  const segments = pathname.split("/");
  if (segments.length < 3 || segments[0] !== "") return null;
  const [, locale, first] = segments;
  if (!isLocale(locale)) return null;
  if (first === "account") return { locale, kind: "account" };
  if (first === AUTH_HANDLER_SEGMENT) return { locale, kind: "handler" };
  if ((AUTH_PAGES as readonly string[]).includes(first)) return { locale, kind: "page" };
  return null;
}

export function authPagePath(locale: Locale, page: AuthPage): string {
  return `/${locale}/${page}`;
}

export function authHandlerPath(locale: Locale, handler: AuthHandler): string {
  return `/${locale}/${AUTH_HANDLER_SEGMENT}/${handler}`;
}

/**
 * Page path with `?status=` and (login, M5-04) `&next=<encoded return
 * path>`; without either, the plain page path. `returnPath` must come from
 * validation.readReturnPath (an internal detail path) or be null.
 */
export function statusHref<P extends AuthPage>(locale: Locale, page: P, status?: AuthStatus<P>, returnPath?: string | null): string {
  const path = authPagePath(locale, page);
  const query = new URLSearchParams();
  if (status) query.set("status", status);
  if (returnPath) query.set(AUTH_FIELDS.returnTo, returnPath);
  const search = query.toString();
  return search ? `${path}?${search}` : path;
}

/**
 * The login page with a return path (M5-04): where the download route sends
 * a visitor without a valid public session. `returnPath` as in statusHref.
 */
export function loginHref(locale: Locale, returnPath: string | null): string {
  return statusHref(locale, "login", undefined, returnPath);
}

/** The page's status from a search parameter value; anything outside its list is null. */
export function readStatus<P extends AuthPage>(page: P, value: string | string[] | undefined | null): AuthStatus<P> | null {
  const first = Array.isArray(value) ? value[0] : value;
  if (typeof first !== "string") return null;
  return (AUTH_STATUSES[page] as readonly string[]).includes(first) ? (first as AuthStatus<P>) : null;
}
