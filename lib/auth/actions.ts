import type { Locale } from "@/lib/i18n/locales";

import { authHandlerPath, authPagePath, statusHref, type AuthPage, type AuthStatus } from "./routes";
import { logAuthError, type AuthClient } from "./supabase";
import {
  hasRecentRecovery,
  isTokenHash,
  parseChangePassword,
  parseConfirmType,
  parseForgotPassword,
  parseLogin,
  parseRegister,
  parseResetPassword,
  type FormInput,
} from "./validation";

/**
 * The account operations (M5-02, DECISIONS §2.18 decisions 3, 7, 13, 14):
 * plain functions from form input and an AuthClient to the redirect target,
 * so they are tested with a fake client (tests/unit/auth-actions.test.ts).
 * lib/auth/http.ts runs them for the route handlers and answers 303.
 *
 * - Messages are generic: an unknown email, a wrong password and an
 *   unconfirmed account all give login `invalid` (decision 14a).
 * - Register and forgot-password answer `check-email` whether or not the
 *   email has an account; only local validation, `weak_password`, 429 and
 *   a server or network failure differ.
 * - signUp never gets `options.data`: no user metadata from the form.
 * - Change of password checks the current password against the email of
 *   the verified user (getUser()); reset of password needs verified claims
 *   of a session from an email link opened in the last hour
 *   (hasRecentRecovery; Supabase gives such a session amr `otp`).
 * - Logs carry `[auth] <operation>: <code or name>` only.
 */
export type ActionContext = {
  locale: Locale;
  /** Origin of the request, already checked against its host (validation.isSameOrigin). */
  origin: string;
  nowSeconds: number;
};

export type ActionResult = {
  location: string;
  /** Logout: also expire the session cookies the request carried. */
  clearSession?: boolean;
};

function to<P extends AuthPage>(context: ActionContext, page: P, status?: AuthStatus<P>): ActionResult {
  return { location: statusHref(context.locale, page, status) };
}

type ErrorFacts = { status?: number; code?: string };

function facts(error: unknown): ErrorFacts {
  const { status, code } = (error ?? {}) as { status?: unknown; code?: unknown };
  return { status: typeof status === "number" ? status : undefined, code: typeof code === "string" ? code : undefined };
}

/** No HTTP status, 0 (network) or 5xx. */
function isServerFailure({ status }: ErrorFacts): boolean {
  return status === undefined || status === 0 || status >= 500;
}

function isClientError({ status }: ErrorFacts): boolean {
  return status !== undefined && status >= 400 && status < 500;
}

/** The email link target: `{origin}/{locale}/auth/confirm` (Supabase "RedirectTo", ENVIRONMENTS §3.1). */
export function confirmUrl(context: ActionContext): string {
  return `${context.origin}${authHandlerPath(context.locale, "confirm")}`;
}

/** Statuses of a failed updateUser({ password }) for the reset and account pages. */
function passwordUpdateStatus(error: unknown): "same-password" | "weak-password" | "error" {
  const { code } = facts(error);
  if (code === "same_password") return "same-password";
  if (code === "weak_password") return "weak-password";
  return "error";
}

export async function login(form: FormInput, client: AuthClient, context: ActionContext): Promise<ActionResult> {
  const input = parseLogin(form);
  if (!input.ok) return to(context, "login", input.status);
  const { error } = await client.signInWithPassword({ email: input.email, password: input.password });
  if (!error) return { location: authPagePath(context.locale, "account") };
  logAuthError("login", error);
  const details = facts(error);
  if (details.status === 429) return to(context, "login", "rate-limited");
  return to(context, "login", isClientError(details) ? "invalid" : "error");
}

export async function register(form: FormInput, client: AuthClient, context: ActionContext): Promise<ActionResult> {
  const input = parseRegister(form);
  if (!input.ok) return to(context, "register", input.status);
  const { error } = await client.signUp({
    email: input.email,
    password: input.password,
    options: { emailRedirectTo: confirmUrl(context) },
  });
  if (!error) return to(context, "register", "check-email");
  logAuthError("register", error);
  const details = facts(error);
  if (details.status === 429) return to(context, "register", "rate-limited");
  if (details.code === "weak_password") return to(context, "register", "weak-password");
  return to(context, "register", isServerFailure(details) ? "error" : "check-email");
}

export async function forgotPassword(form: FormInput, client: AuthClient, context: ActionContext): Promise<ActionResult> {
  const input = parseForgotPassword(form);
  if (!input.ok) return to(context, "forgot-password", input.status);
  const { error } = await client.resetPasswordForEmail(input.email, { redirectTo: confirmUrl(context) });
  if (!error) return to(context, "forgot-password", "check-email");
  logAuthError("forgot-password", error);
  const details = facts(error);
  if (details.status === 429) return to(context, "forgot-password", "rate-limited");
  return to(context, "forgot-password", isServerFailure(details) ? "error" : "check-email");
}

export async function resetPassword(form: FormInput, client: AuthClient, context: ActionContext): Promise<ActionResult> {
  const input = parseResetPassword(form);
  if (!input.ok) return to(context, "reset-password", input.status);
  const { data, error } = await client.getClaims();
  if (error) logAuthError("reset-password", error);
  if (error || !data || !hasRecentRecovery(data.claims, context.nowSeconds)) {
    return to(context, "forgot-password", "link-invalid");
  }
  const { error: updateError } = await client.updateUser({ password: input.password });
  if (!updateError) return to(context, "account", "password-changed");
  logAuthError("reset-password", updateError);
  return to(context, "reset-password", passwordUpdateStatus(updateError));
}

export async function changePassword(form: FormInput, client: AuthClient, context: ActionContext): Promise<ActionResult> {
  const input = parseChangePassword(form);
  if (!input.ok) return to(context, "account", input.status);
  const { data, error } = await client.getUser();
  const email = data.user?.email;
  if (error || !email) {
    if (error) logAuthError("change-password", error);
    return to(context, "login", "session-ended");
  }
  const { error: signInError } = await client.signInWithPassword({ email, password: input.currentPassword });
  if (signInError) {
    logAuthError("change-password", signInError);
    const details = facts(signInError);
    return to(context, "account", isClientError(details) && details.status !== 429 ? "invalid-current" : "error");
  }
  const { error: updateError } = await client.updateUser({ password: input.password });
  if (!updateError) return to(context, "account", "password-changed");
  logAuthError("change-password", updateError);
  return to(context, "account", passwordUpdateStatus(updateError));
}

/** Local sign-out (this device's session only); the session cookies are expired in any case. */
export async function logout(_form: FormInput, client: AuthClient, context: ActionContext): Promise<ActionResult> {
  try {
    const { error } = await client.signOut({ scope: "local" });
    if (error) logAuthError("logout", error);
  } catch (error) {
    logAuthError("logout", error);
  }
  return { ...to(context, "login", "signed-out"), clearSession: true };
}

/**
 * The email link (GET `/{locale}/auth/confirm?token_hash=…&type=email|recovery`).
 * The target depends on the type only: email → account `email-confirmed`;
 * recovery → the reset page; anything invalid or rejected → login `link-invalid`.
 */
export async function confirm(params: URLSearchParams, client: AuthClient, context: ActionContext): Promise<ActionResult> {
  const tokenHash = params.get("token_hash");
  const type = parseConfirmType(params.get("type"));
  if (!isTokenHash(tokenHash) || type === null) return to(context, "login", "link-invalid");
  const { data, error } = await client.verifyOtp({ token_hash: tokenHash, type });
  if (error || !data.session) {
    if (error) logAuthError("confirm", error);
    return to(context, "login", "link-invalid");
  }
  return type === "recovery" ? { location: authPagePath(context.locale, "reset-password") } : to(context, "account", "email-confirmed");
}

/** The POST form handlers, with the target used when an operation throws. */
export const FORM_ACTIONS = {
  login: { run: login, failure: (context: ActionContext) => to(context, "login", "error") },
  register: { run: register, failure: (context: ActionContext) => to(context, "register", "error") },
  "forgot-password": { run: forgotPassword, failure: (context: ActionContext) => to(context, "forgot-password", "error") },
  "reset-password": { run: resetPassword, failure: (context: ActionContext) => to(context, "reset-password", "error") },
  "change-password": { run: changePassword, failure: (context: ActionContext) => to(context, "account", "error") },
  logout: {
    run: logout,
    failure: (context: ActionContext): ActionResult => ({ ...to(context, "login", "signed-out"), clearSession: true }),
  },
} as const;

export type FormActionName = keyof typeof FORM_ACTIONS;
