import { isLocale } from "@/lib/i18n/locales";
import { SLUG_PATTERN } from "@/payload/fields/slug";

import { AUTH_FIELDS } from "./routes";

/**
 * Input checks of the account forms (M5-02, DECISIONS §2.18 decisions 7
 * and 14), run before any Supabase call. Email: trimmed, at most 254
 * characters, one `@` with a dot in the domain. Password: 8 to 72
 * characters (Supabase minimum 8 without composition rules, decision 7;
 * 72 is the bcrypt limit of Supabase Auth), never trimmed. Unknown form
 * fields are ignored. Results carry statuses of lib/auth/routes.ts only,
 * never the input.
 */
export const EMAIL_MAX_LENGTH = 254;
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 72;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
/** Supabase token hashes: hex, `pkce_` + hex for PKCE flows. */
const TOKEN_HASH_PATTERN = /^[A-Za-z0-9_-]{8,256}$/;
/** Seconds a recovery login stays good for setting a new password. */
export const RECOVERY_MAX_AGE_SECONDS = 3600;

export type FormInput = { get(name: string): FormDataEntryValue | null };

type Invalid<S extends string> = { ok: false; status: S };

function field(form: FormInput, name: string): string {
  const value = form.get(name);
  return typeof value === "string" ? value : "";
}

export function readEmail(form: FormInput): string | null {
  const email = field(form, AUTH_FIELDS.email).trim();
  return email.length <= EMAIL_MAX_LENGTH && EMAIL_PATTERN.test(email) ? email : null;
}

export function isValidPassword(password: string): boolean {
  return password.length >= PASSWORD_MIN_LENGTH && password.length <= PASSWORD_MAX_LENGTH;
}

/** New password + confirmation: invalid-input before password-mismatch. */
function readNewPassword(form: FormInput): { ok: true; password: string } | Invalid<"invalid-input" | "password-mismatch"> {
  const password = field(form, AUTH_FIELDS.password);
  if (!isValidPassword(password)) return { ok: false, status: "invalid-input" };
  if (field(form, AUTH_FIELDS.passwordConfirm) !== password) return { ok: false, status: "password-mismatch" };
  return { ok: true, password };
}

export function parseLogin(form: FormInput): { ok: true; email: string; password: string } | Invalid<"invalid-input"> {
  const email = readEmail(form);
  const password = field(form, AUTH_FIELDS.password);
  if (email === null || !isValidPassword(password)) return { ok: false, status: "invalid-input" };
  return { ok: true, email, password };
}

export function parseRegister(
  form: FormInput,
): { ok: true; email: string; password: string } | Invalid<"invalid-input" | "password-mismatch"> {
  const email = readEmail(form);
  if (email === null) return { ok: false, status: "invalid-input" };
  const next = readNewPassword(form);
  return next.ok ? { ok: true, email, password: next.password } : next;
}

export function parseForgotPassword(form: FormInput): { ok: true; email: string } | Invalid<"invalid-input"> {
  const email = readEmail(form);
  return email === null ? { ok: false, status: "invalid-input" } : { ok: true, email };
}

export function parseResetPassword(form: FormInput): { ok: true; password: string } | Invalid<"invalid-input" | "password-mismatch"> {
  return readNewPassword(form);
}

export function parseChangePassword(
  form: FormInput,
): { ok: true; currentPassword: string; password: string } | Invalid<"invalid-input" | "password-mismatch"> {
  const currentPassword = field(form, AUTH_FIELDS.currentPassword);
  if (!isValidPassword(currentPassword)) return { ok: false, status: "invalid-input" };
  const next = readNewPassword(form);
  return next.ok ? { ok: true, currentPassword, password: next.password } : next;
}

/**
 * CSRF check of the form handlers (DECISIONS §2.18 decision 3): the
 * `Origin` header must be present, not `null`, http(s), and name the host
 * the request was sent to (`x-forwarded-host` behind Vercel, else `host`).
 */
export function isSameOrigin(headers: Headers): boolean {
  const origin = headers.get("origin");
  if (!origin || origin === "null") return false;
  let url: URL;
  try {
    url = new URL(origin);
  } catch {
    return false;
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return false;
  const host = (headers.get("x-forwarded-host") ?? headers.get("host") ?? "").split(",")[0].trim().toLowerCase();
  return host !== "" && url.host.toLowerCase() === host;
}

/** Longest return path kept; a longer value is ignored. */
export const RETURN_PATH_MAX_LENGTH = 200;

const RETURN_PATH_PATTERN = /^\/([a-z]{2})\/publications\/([^/]+)$/;

/**
 * The login page's return path (`?next=` and the form field `next`, M5-04,
 * DECISIONS §2.18 decision 12): the publication detail path the locked
 * file came from, `/{id|en}/publications/<slug>` with a slug of
 * SLUG_PATTERN, at most RETURN_PATH_MAX_LENGTH characters, else null. So it
 * is always an internal path: no scheme, host, `//`, `\`, query, fragment,
 * percent-encoding or other route (an account page, an API route, the
 * download route itself). For an array (repeated parameter) the first value
 * counts.
 */
export function readReturnPath(value: unknown): string | null {
  const first: unknown = Array.isArray(value) ? value[0] : value;
  if (typeof first !== "string" || first.length > RETURN_PATH_MAX_LENGTH) return null;
  const match = RETURN_PATH_PATTERN.exec(first);
  if (!match || !isLocale(match[1]) || !SLUG_PATTERN.test(match[2])) return null;
  return first;
}

export function isTokenHash(value: string | null): value is string {
  return typeof value === "string" && TOKEN_HASH_PATTERN.test(value);
}

export type ConfirmType = "email" | "recovery";

export function parseConfirmType(value: string | null): ConfirmType | null {
  return value === "email" || value === "recovery" ? value : null;
}

/**
 * `amr` methods of a session that came from an email link. Supabase Auth
 * (project mahira.id, checked 2026-11-20) gives `otp` to the session of a
 * recovery link and of a signup link, and `password` to a password login;
 * `recovery` is kept in case a later Auth version names it so. Both prove
 * control of the inbox, which is what a password reset needs.
 */
export const EMAIL_LINK_AMR_METHODS: readonly string[] = ["otp", "recovery"];

/**
 * True when verified JWT claims carry an email-link `amr` entry no older
 * than RECOVERY_MAX_AGE_SECONDS: the session came from a reset (or signup)
 * link opened in the last hour, so a stolen password session cannot set a
 * password without the current one (D5).
 */
export function hasRecentRecovery(claims: unknown, nowSeconds: number): boolean {
  const amr = (claims as { amr?: unknown } | null)?.amr;
  if (!Array.isArray(amr)) return false;
  return amr.some((entry: unknown) => {
    const item = entry as { method?: unknown; timestamp?: unknown } | null;
    return (
      typeof item?.method === "string" &&
      EMAIL_LINK_AMR_METHODS.includes(item.method) &&
      typeof item.timestamp === "number" &&
      item.timestamp >= nowSeconds - RECOVERY_MAX_AGE_SECONDS
    );
  });
}
