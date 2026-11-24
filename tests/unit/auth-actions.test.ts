import assert from "node:assert/strict";
import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { after, afterEach, before, beforeEach, describe, test } from "node:test";
import { NextRequest } from "next/server";

import {
  changePassword,
  confirm,
  FORM_ACTIONS,
  forgotPassword,
  login,
  logout,
  register,
  resetPassword,
  type ActionContext,
} from "../../lib/auth/actions";
import { AUTH_KEY_NAME, AUTH_URL_NAME } from "../../lib/auth/env";
import { authConfirm, authPost } from "../../lib/auth/http";
import { loginHref, statusHref } from "../../lib/auth/routes";
import { AUTH_COOKIE_OPTIONS, AUTH_COOKIE_PATTERN, createAuthClient, logAuthError, type AuthClient, type CookieToSet } from "../../lib/auth/supabase";
import {
  hasRecentRecovery,
  isSameOrigin,
  isTokenHash,
  parseChangePassword,
  parseLogin,
  parseRegister,
  parseResetPassword,
  readReturnPath,
} from "../../lib/auth/validation";

/**
 * Account operations with a fake Supabase client (M5-02, DECISIONS §2.18
 * decisions 3, 7, 13, 14): input checks, the arguments each Supabase call
 * gets, the mapping of errors to the closed statuses of lib/auth/routes.ts,
 * logs, cookie options and the handler wrapper (Origin check, 303, headers).
 * No network except AUU11/AUU12, which talk to a local HTTP server standing
 * in for Supabase Auth. Passwords and keys are dummies.
 */
const NOW = 1_800_000_000;
const ORIGIN = "http://localhost:3100";
const CONTEXT: ActionContext = { locale: "id", origin: ORIGIN, nowSeconds: NOW };
const EN: ActionContext = { ...CONTEXT, locale: "en" };
const EMAIL = "reader@example.invalid";
const PASSWORD = "dummy-password-1";
const NEW_PASSWORD = "dummy-password-2";

type Call = { method: string; args: unknown[] };
type Reply = Record<string, unknown>;

function apiError(status: number | undefined, code?: string, name = "AuthApiError") {
  return { name, status, code, message: "secret message with reader@example.invalid" };
}

/** Fake AuthClient: records every call; each method answers from `replies` (default: success). */
function fakeClient(replies: Partial<Record<keyof AuthClient, Reply | (() => Reply)>> = {}) {
  const calls: Call[] = [];
  const answer = (method: keyof AuthClient, fallback: Reply) => async (...args: unknown[]) => {
    calls.push({ method, args });
    const reply = replies[method];
    return typeof reply === "function" ? reply() : (reply ?? fallback);
  };
  const client = {
    signInWithPassword: answer("signInWithPassword", { data: { session: {} }, error: null }),
    signUp: answer("signUp", { data: {}, error: null }),
    resetPasswordForEmail: answer("resetPasswordForEmail", { data: {}, error: null }),
    updateUser: answer("updateUser", { data: {}, error: null }),
    verifyOtp: answer("verifyOtp", { data: { session: { access_token: "x" } }, error: null }),
    signOut: answer("signOut", { error: null }),
    getUser: answer("getUser", { data: { user: { email: EMAIL, email_confirmed_at: "2026-11-20T00:00:00Z" } }, error: null }),
    // A recovery-link session: Supabase Auth gives it amr method `otp` (checked 2026-11-20).
    getClaims: answer("getClaims", { data: { claims: { sub: "u", amr: [{ method: "otp", timestamp: NOW - 60 }] } }, error: null }),
  };
  return { client: client as unknown as AuthClient, calls, methods: () => calls.map((call) => call.method) };
}

function form(fields: Record<string, string>): URLSearchParams {
  return new URLSearchParams(fields);
}

const CREDENTIALS = { email: EMAIL, password: PASSWORD };
const NEW = { password: NEW_PASSWORD, password_confirm: NEW_PASSWORD };

let logs: string[] = [];
const originalError = console.error;
beforeEach(() => {
  logs = [];
  console.error = (...args: unknown[]) => {
    logs.push(args.map(String).join(" "));
  };
});
afterEach(() => {
  console.error = originalError;
});

describe("lib/auth/validation.ts — input checks", () => {
  test("AUU1 email, password, confirmation, Origin, token hash", () => {
    assert.deepEqual(parseLogin(form({ email: `  ${EMAIL}  `, password: PASSWORD })), { ok: true, ...CREDENTIALS }, "email trimmed");
    for (const email of ["", "reader", "reader@host", "a b@x.id", "@x.id", `${"a".repeat(245)}@example.id`]) {
      assert.deepEqual(parseLogin(form({ email, password: PASSWORD })), { ok: false, status: "invalid-input" }, `email ${email.length}`);
    }
    for (const password of ["", "1234567", "x".repeat(73)]) {
      assert.deepEqual(parseLogin(form({ email: EMAIL, password })), { ok: false, status: "invalid-input" }, `password ${password.length}`);
    }
    assert.equal(parseLogin(form({ email: EMAIL, password: "12345678" })).ok, true, "8 characters");
    assert.equal(parseLogin(form({ email: EMAIL, password: "x".repeat(72) })).ok, true, "72 characters");
    assert.equal(parseLogin(form({ email: EMAIL, password: ` ${PASSWORD} ` })).ok, true, "a password is never trimmed");
    assert.deepEqual(parseRegister(form({ ...CREDENTIALS, password_confirm: "other-password" })), { ok: false, status: "password-mismatch" });
    assert.deepEqual(parseRegister(form({ email: "x", password: "1", password_confirm: "2" })), { ok: false, status: "invalid-input" }, "invalid input first");
    assert.deepEqual(parseRegister(form({ ...CREDENTIALS, password_confirm: PASSWORD, role: "admin" })), { ok: true, ...CREDENTIALS }, "extra fields ignored");
    assert.deepEqual(parseResetPassword(form({ password: NEW_PASSWORD })), { ok: false, status: "password-mismatch" });
    assert.deepEqual(parseChangePassword(form({ current_password: "short", ...NEW })), { ok: false, status: "invalid-input" });
    assert.deepEqual(parseChangePassword(form({ current_password: PASSWORD, ...NEW })), { ok: true, currentPassword: PASSWORD, password: NEW_PASSWORD });

    const headers = (values: Record<string, string>) => new Headers(values);
    assert.equal(isSameOrigin(headers({ host: "localhost:3100", origin: ORIGIN })), true, "same origin");
    assert.equal(isSameOrigin(headers({ host: "localhost:3100" })), false, "no Origin");
    assert.equal(isSameOrigin(headers({ host: "localhost:3100", origin: "null" })), false, "Origin null");
    assert.equal(isSameOrigin(headers({ host: "localhost:3100", origin: "https://evil.example" })), false, "foreign Origin");
    assert.equal(isSameOrigin(headers({ host: "localhost:3100", origin: "http://localhost:3101" })), false, "other port");
    assert.equal(isSameOrigin(headers({ host: "localhost:3100", origin: "not a url" })), false, "malformed");
    assert.equal(isSameOrigin(headers({ host: "localhost:3100", origin: "ftp://localhost:3100" })), false, "not http(s)");
    assert.equal(
      isSameOrigin(headers({ host: "internal:3000", "x-forwarded-host": "preview.vercel.app", origin: "https://preview.vercel.app" })),
      true,
      "x-forwarded-host wins over host",
    );
    assert.equal(isSameOrigin(headers({ host: "preview.vercel.app", "x-forwarded-host": "other.app", origin: "https://preview.vercel.app" })), false);

    assert.equal(isTokenHash("pkce_0123456789abcdef"), true);
    for (const value of [null, "", "short", "a".repeat(257), "abc def ghi", "abc/../def", "abc%20defgh"]) {
      assert.equal(isTokenHash(value), false, String(value));
    }
  });
});

describe("lib/auth/actions.ts — operations with a fake client", () => {
  test("AUU2 login: account on success; invalid credentials, unknown and unconfirmed email all `invalid`; 429; server failure; no call on bad input", async () => {
    const ok = fakeClient();
    assert.deepEqual(await login(form(CREDENTIALS), ok.client, CONTEXT), { location: "/id/account" });
    assert.deepEqual(ok.calls, [{ method: "signInWithPassword", args: [CREDENTIALS] }]);
    for (const [error, status] of [
      [apiError(400, "invalid_credentials"), "invalid"],
      [apiError(400, "email_not_confirmed"), "invalid"],
      [apiError(422, "validation_failed"), "invalid"],
      [apiError(429, "over_request_rate_limit"), "rate-limited"],
      [apiError(500, "unexpected_failure"), "error"],
      [apiError(0, undefined, "AuthRetryableFetchError"), "error"],
    ] as const) {
      const fake = fakeClient({ signInWithPassword: { data: { session: null }, error } });
      assert.deepEqual(await login(form(CREDENTIALS), fake.client, EN), { location: `/en/login?status=${status}` }, String(error.code));
    }
    const none = fakeClient();
    assert.deepEqual(await login(form({ email: "x", password: PASSWORD }), none.client, CONTEXT), { location: "/id/login?status=invalid-input" });
    assert.deepEqual(none.calls, [], "no Supabase call on invalid input");
  });

  test("AUU13 login return path (M5-04): only a publication detail path; success goes there, every failure keeps it; anything else ends on the account page", async () => {
    const detail = "/id/publications/laporan-energi-2026";
    assert.equal(readReturnPath(detail), detail);
    assert.equal(readReturnPath("/en/publications/a"), "/en/publications/a");
    assert.equal(readReturnPath([detail, "https://evil.example"]), detail, "first value of a repeated parameter");
    const hostile = [
      "https://evil.example",
      "http://evil.example/id/publications/a",
      "//evil.example",
      "//evil.example/id/publications/a",
      "/\\evil.example",
      "/\\/evil.example",
      "\\\\evil.example",
      "/id/account",
      "/id/login",
      "/api/files/1/download",
      "/id/publications",
      "/id/publications/",
      "/id/publications/Bad",
      "/id/publications/a_b",
      "/id/publications/a/b",
      "/id/publications/a?x=1",
      "/id/publications/a#x",
      "/id/publications/a%2F..",
      "/id/publications/%2F%2Fevil",
      "%2F%2Fevil.example",
      "/xx/publications/a",
      "/ID/publications/a",
      " /id/publications/a",
      "/id/publications/a ",
      "javascript:alert(1)",
      `/id/publications/${"a".repeat(200)}`,
      "",
      undefined,
      null,
      42,
      ["https://evil.example", detail],
    ];
    for (const value of hostile) assert.equal(readReturnPath(value), null, JSON.stringify(value));

    assert.equal(loginHref("id", detail), "/id/login?next=%2Fid%2Fpublications%2Flaporan-energi-2026");
    assert.equal(loginHref("en", null), "/en/login");
    assert.equal(statusHref("id", "login", "invalid", detail), "/id/login?status=invalid&next=%2Fid%2Fpublications%2Flaporan-energi-2026");
    assert.equal(statusHref("id", "account", "error"), "/id/account?status=error", "unchanged without a return path");

    const ok = fakeClient();
    assert.deepEqual(await login(form({ ...CREDENTIALS, next: detail }), ok.client, CONTEXT), { location: detail }, "success: back to the detail page");
    assert.deepEqual(ok.calls, [{ method: "signInWithPassword", args: [CREDENTIALS] }], "next is never sent to Supabase");
    for (const value of hostile.filter((item): item is string => typeof item === "string")) {
      const fake = fakeClient();
      assert.deepEqual(await login(form({ ...CREDENTIALS, next: value }), fake.client, CONTEXT), { location: "/id/account" }, `success with next ${JSON.stringify(value)}`);
    }
    const kept = "next=%2Fid%2Fpublications%2Flaporan-energi-2026";
    for (const [error, status] of [
      [apiError(400, "invalid_credentials"), "invalid"],
      [apiError(429, "over_request_rate_limit"), "rate-limited"],
      [apiError(500, "unexpected_failure"), "error"],
    ] as const) {
      const fake = fakeClient({ signInWithPassword: { data: { session: null }, error } });
      assert.deepEqual(await login(form({ ...CREDENTIALS, next: detail }), fake.client, CONTEXT), { location: `/id/login?status=${status}&${kept}` }, status);
    }
    assert.deepEqual(
      await login(form({ email: "x", password: PASSWORD, next: detail }), fakeClient().client, CONTEXT),
      { location: `/id/login?status=invalid-input&${kept}` },
      "invalid input keeps it",
    );
    assert.deepEqual(
      await login(form({ ...CREDENTIALS, next: "https://evil.example" }), fakeClient({ signInWithPassword: { data: {}, error: apiError(400, "invalid_credentials") } }).client, CONTEXT),
      { location: "/id/login?status=invalid" },
      "an invalid return path is dropped on failure",
    );
    assert.deepEqual(FORM_ACTIONS.login.failure(CONTEXT, form({ next: detail })), { location: `/id/login?status=error&${kept}` }, "a thrown login keeps it");
  });

  test("AUU3 register: signUp gets email, password and the confirm URL only (never options.data); check-email whatever the account state", async () => {
    const ok = fakeClient();
    const result = await register(form({ ...CREDENTIALS, password_confirm: PASSWORD, role: "admin", data: "x" }), ok.client, CONTEXT);
    assert.deepEqual(result, { location: "/id/register?status=check-email" });
    assert.deepEqual(ok.calls, [
      { method: "signUp", args: [{ email: EMAIL, password: PASSWORD, options: { emailRedirectTo: `${ORIGIN}/id/auth/confirm` } }] },
    ]);
    const options = (ok.calls[0]?.args[0] as { options: Record<string, unknown> }).options;
    assert.deepEqual(Object.keys(options), ["emailRedirectTo"], "no options.data");
    for (const [error, status] of [
      [apiError(422, "user_already_exists"), "check-email"],
      [apiError(400, "email_address_invalid"), "check-email"],
      [apiError(422, "weak_password", "AuthWeakPasswordError"), "weak-password"],
      [apiError(429, "over_email_send_rate_limit"), "rate-limited"],
      [apiError(500, "unexpected_failure"), "error"],
      [apiError(0, undefined, "AuthRetryableFetchError"), "error"],
    ] as const) {
      const fake = fakeClient({ signUp: { data: {}, error } });
      assert.deepEqual(
        await register(form({ ...CREDENTIALS, password_confirm: PASSWORD }), fake.client, EN),
        { location: `/en/register?status=${status}` },
        String(error.code),
      );
    }
    const enConfirm = fakeClient();
    await register(form({ ...CREDENTIALS, password_confirm: PASSWORD }), enConfirm.client, EN);
    assert.equal((enConfirm.calls[0]?.args[0] as { options: { emailRedirectTo: string } }).options.emailRedirectTo, `${ORIGIN}/en/auth/confirm`);
    const none = fakeClient();
    assert.deepEqual(await register(form({ ...CREDENTIALS, password_confirm: "x" }), none.client, CONTEXT), {
      location: "/id/register?status=password-mismatch",
    });
    assert.deepEqual(none.calls, []);
  });

  test("AUU4 forgot-password: resetPasswordForEmail(email, { redirectTo: confirm URL }); check-email unless 429 or a server failure", async () => {
    const ok = fakeClient();
    assert.deepEqual(await forgotPassword(form({ email: EMAIL }), ok.client, CONTEXT), { location: "/id/forgot-password?status=check-email" });
    assert.deepEqual(ok.calls, [{ method: "resetPasswordForEmail", args: [EMAIL, { redirectTo: `${ORIGIN}/id/auth/confirm` }] }]);
    for (const [error, status] of [
      [apiError(400, "user_not_found"), "check-email"],
      [apiError(429, "over_email_send_rate_limit"), "rate-limited"],
      [apiError(503, undefined), "error"],
    ] as const) {
      const fake = fakeClient({ resetPasswordForEmail: { data: {}, error } });
      assert.deepEqual(await forgotPassword(form({ email: EMAIL }), fake.client, CONTEXT), { location: `/id/forgot-password?status=${status}` });
    }
    assert.deepEqual(await forgotPassword(form({ email: "bad" }), fakeClient().client, CONTEXT), { location: "/id/forgot-password?status=invalid-input" });
  });

  test("AUU5 reset-password: only verified claims of a recovery login in the last hour; then updateUser", async () => {
    const ok = fakeClient();
    assert.deepEqual(await resetPassword(form(NEW), ok.client, CONTEXT), { location: "/id/account?status=password-changed" });
    assert.deepEqual(ok.methods(), ["getClaims", "updateUser"]);
    assert.deepEqual(ok.calls[1]?.args, [{ password: NEW_PASSWORD }]);
    const linkInvalid = { location: "/id/forgot-password?status=link-invalid" };
    for (const [label, reply] of [
      ["password login", { data: { claims: { sub: "u", amr: [{ method: "password", timestamp: NOW - 10 }] } }, error: null }],
      ["old recovery", { data: { claims: { sub: "u", amr: [{ method: "otp", timestamp: NOW - 3601 }] } }, error: null }],
      ["no amr", { data: { claims: { sub: "u" } }, error: null }],
      ["no session", { data: null, error: null }],
      ["invalid JWT", { data: null, error: apiError(undefined, undefined, "AuthInvalidJwtError") }],
    ] as const) {
      const fake = fakeClient({ getClaims: reply });
      assert.deepEqual(await resetPassword(form(NEW), fake.client, CONTEXT), linkInvalid, label);
      assert.deepEqual(fake.methods(), ["getClaims"], `${label}: no updateUser`);
    }
    for (const [error, status] of [
      [apiError(422, "same_password"), "same-password"],
      [apiError(422, "weak_password", "AuthWeakPasswordError"), "weak-password"],
      [apiError(403, "session_not_found"), "error"],
    ] as const) {
      const fake = fakeClient({ updateUser: { data: {}, error } });
      assert.deepEqual(await resetPassword(form(NEW), fake.client, CONTEXT), { location: `/id/reset-password?status=${status}` });
    }
    const none = fakeClient();
    assert.deepEqual(await resetPassword(form({ password: "short", password_confirm: "short" }), none.client, CONTEXT), {
      location: "/id/reset-password?status=invalid-input",
    });
    assert.deepEqual(none.calls, []);
  });

  test("AUU6 hasRecentRecovery: an email-link amr entry (`otp`, as Supabase gives a recovery link, or `recovery`) no older than 3600 s", () => {
    assert.equal(hasRecentRecovery({ amr: [{ method: "otp", timestamp: NOW - 3600 }] }, NOW), true);
    assert.equal(hasRecentRecovery({ amr: [{ method: "recovery", timestamp: NOW - 3600 }] }, NOW), true);
    assert.equal(hasRecentRecovery({ amr: [{ method: "otp", timestamp: NOW + 3 }] }, NOW), true, "server clock a few seconds ahead");
    assert.equal(hasRecentRecovery({ amr: [{ method: "password", timestamp: NOW }, { method: "otp", timestamp: NOW - 5 }] }, NOW), true);
    for (const claims of [
      null,
      {},
      { amr: "otp" },
      { amr: [{ method: "otp", timestamp: NOW - 3601 }] },
      { amr: [{ method: "recovery", timestamp: NOW - 3601 }] },
      { amr: [{ method: "otp", timestamp: String(NOW) }] },
      { amr: [{ method: "password", timestamp: NOW }] },
      { amr: [{ method: "totp", timestamp: NOW }] },
      { amr: [{ method: "OTP", timestamp: NOW }] },
      { amr: [null] },
    ]) {
      assert.equal(hasRecentRecovery(claims, NOW), false, JSON.stringify(claims));
    }
  });

  test("AUU7 change-password: the current password is checked against the email of getUser(), never a form field; statuses", async () => {
    const ok = fakeClient();
    const fields = { email: "attacker@example.invalid", current_password: PASSWORD, ...NEW };
    assert.deepEqual(await changePassword(form(fields), ok.client, CONTEXT), { location: "/id/account?status=password-changed" });
    assert.deepEqual(ok.methods(), ["getUser", "signInWithPassword", "updateUser"]);
    assert.deepEqual(ok.calls[1]?.args, [{ email: EMAIL, password: PASSWORD }], "email from getUser()");
    assert.deepEqual(ok.calls[2]?.args, [{ password: NEW_PASSWORD }]);
    for (const [label, reply] of [
      ["no user", { data: { user: null }, error: apiError(undefined, undefined, "AuthSessionMissingError") }],
      ["session gone", { data: { user: null }, error: apiError(403, "session_not_found") }],
      ["user without email", { data: { user: { email: "" } }, error: null }],
    ] as const) {
      const fake = fakeClient({ getUser: reply });
      assert.deepEqual(await changePassword(form(fields), fake.client, CONTEXT), { location: "/id/login?status=session-ended" }, label);
      assert.deepEqual(fake.methods(), ["getUser"], label);
    }
    for (const [error, status] of [
      [apiError(400, "invalid_credentials"), "invalid-current"],
      [apiError(429, "over_request_rate_limit"), "error"],
      [apiError(500, undefined), "error"],
    ] as const) {
      const fake = fakeClient({ signInWithPassword: { data: { session: null }, error } });
      assert.deepEqual(await changePassword(form(fields), fake.client, CONTEXT), { location: `/id/account?status=${status}` });
      assert.deepEqual(fake.methods(), ["getUser", "signInWithPassword"], "no updateUser");
    }
    const same = fakeClient({ updateUser: { data: {}, error: apiError(422, "same_password") } });
    assert.deepEqual(await changePassword(form(fields), same.client, EN), { location: "/en/account?status=same-password" });
    const none = fakeClient();
    assert.deepEqual(await changePassword(form({ current_password: PASSWORD, password: NEW_PASSWORD }), none.client, CONTEXT), {
      location: "/id/account?status=password-mismatch",
    });
    assert.deepEqual(none.calls, []);
  });

  test("AUU8 logout: a local sign-out; signed-out and clearSession, also when Supabase fails or throws", async () => {
    const ok = fakeClient();
    assert.deepEqual(await logout(form({}), ok.client, CONTEXT), { location: "/id/login?status=signed-out", clearSession: true });
    assert.deepEqual(ok.calls, [{ method: "signOut", args: [{ scope: "local" }] }]);
    const failing = fakeClient({ signOut: { error: apiError(500, undefined) } });
    assert.deepEqual(await logout(form({}), failing.client, EN), { location: "/en/login?status=signed-out", clearSession: true });
    const throwing = fakeClient({
      signOut: () => {
        throw new TypeError("boom");
      },
    });
    assert.deepEqual(await logout(form({}), throwing.client, CONTEXT), { location: "/id/login?status=signed-out", clearSession: true });
  });

  test("AUU9 confirm: verifyOtp({ token_hash, type }); target by type only; anything invalid is link-invalid without a call", async () => {
    const hash = "pkce_0123456789abcdef0123456789";
    const email = fakeClient();
    assert.deepEqual(await confirm(new URLSearchParams({ token_hash: hash, type: "email" }), email.client, CONTEXT), {
      location: "/id/account?status=email-confirmed",
    });
    assert.deepEqual(email.calls, [{ method: "verifyOtp", args: [{ token_hash: hash, type: "email" }] }]);
    const recovery = fakeClient();
    assert.deepEqual(await confirm(new URLSearchParams({ token_hash: hash, type: "recovery", next: "https://evil.example" }), recovery.client, EN), {
      location: "/en/reset-password",
    });
    for (const query of [
      "",
      `token_hash=${hash}`,
      `token_hash=${hash}&type=signup`,
      `token_hash=${hash}&type=magiclink`,
      "token_hash=bad&type=email",
      `token_hash=${hash}%3Cx%3E&type=email`,
    ]) {
      const fake = fakeClient();
      assert.deepEqual(await confirm(new URLSearchParams(query), fake.client, CONTEXT), { location: "/id/login?status=link-invalid" }, query);
      assert.deepEqual(fake.calls, [], query);
    }
    for (const reply of [
      { data: { session: null }, error: apiError(403, "otp_expired") },
      { data: { session: null }, error: null },
    ]) {
      const fake = fakeClient({ verifyOtp: reply });
      assert.deepEqual(await confirm(new URLSearchParams({ token_hash: hash, type: "email" }), fake.client, CONTEXT), {
        location: "/id/login?status=link-invalid",
      });
    }
  });

  test("AUU10 logs: `[auth] <operation>: <code or name>` only, never the message, an email or a password", async () => {
    await login(form(CREDENTIALS), fakeClient({ signInWithPassword: { data: { session: null }, error: apiError(400, "invalid_credentials") } }).client, CONTEXT);
    await register(form({ ...CREDENTIALS, password_confirm: PASSWORD }), fakeClient({ signUp: { data: {}, error: apiError(0, undefined, "AuthRetryableFetchError") } }).client, CONTEXT);
    logAuthError("x", null);
    assert.deepEqual(logs, ["[auth] login: invalid_credentials", "[auth] register: AuthRetryableFetchError", "[auth] x: unknown"]);
    for (const line of logs) {
      assert.equal(line.includes(EMAIL), false);
      assert.equal(line.includes(PASSWORD), false);
      assert.equal(line.includes("secret message"), false);
    }
  });
});

describe("lib/auth/supabase.ts and lib/auth/http.ts — against a local stand-in for Supabase Auth", () => {
  const AUTH_NAMES = [AUTH_URL_NAME, AUTH_KEY_NAME, "VERCEL_ENV"] as const;
  let saved: Record<string, string | undefined> = {};
  let server: Server;
  let base = "";
  const seen: string[] = [];

  before(async () => {
    server = createServer((request, response) => {
      seen.push(`${request.method} ${request.url?.split("?")[0]}`);
      response.writeHead(503, { "Content-Type": "application/json" });
      response.end(JSON.stringify({ code: 503, error_code: "unexpected_failure", msg: "stand-in" }));
    });
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  });

  after(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  beforeEach(() => {
    saved = {};
    for (const name of AUTH_NAMES) saved[name] = process.env[name];
    delete process.env.VERCEL_ENV;
    process.env[AUTH_URL_NAME] = base;
    process.env[AUTH_KEY_NAME] = "unit-test-dummy-publishable-key";
    seen.length = 0;
  });

  afterEach(() => {
    for (const name of AUTH_NAMES) {
      if (saved[name] === undefined) delete process.env[name];
      else process.env[name] = saved[name];
    }
  });

  test("AUU11 cookies Supabase sets carry HttpOnly, SameSite=Lax, Path=/, no Domain; Secure only on https; the PKCE verifier cookie name", async (t) => {
    assert.deepEqual(AUTH_COOKIE_OPTIONS, { httpOnly: true, sameSite: "lax", path: "/" });
    for (const secure of [false, true]) {
      const set: CookieToSet[] = [];
      const client = createAuthClient({ getAll: () => [], setAll: (cookies) => void set.push(...cookies) }, { secure });
      // signUp with the PKCE flow stores the code verifier before its request (which the stand-in answers 503).
      const { error } = await client.signUp({ email: EMAIL, password: PASSWORD, options: { emailRedirectTo: `${ORIGIN}/id/auth/confirm` } });
      assert.ok(error, "the stand-in fails the request");
      assert.ok(set.length > 0, "a cookie was set");
      t.diagnostic(`secure=${secure}: ${set.map(({ name, value }) => `${name}${value === "" ? " (removed)" : ""}`).join(", ")}`);
      for (const { name, options } of set) {
        assert.match(name, /^sb-127-auth-token-code-verifier$|^sb-127-auth-token-/, name);
        assert.equal(AUTH_COOKIE_PATTERN.test(name), false, `${name} is not a session cookie`);
        assert.equal(options.httpOnly, true, `${name} HttpOnly`);
        assert.equal(options.sameSite, "lax", `${name} SameSite`);
        assert.equal(options.path, "/", `${name} Path`);
        assert.equal(options.domain, undefined, `${name} host-only`);
        assert.equal(options.secure, secure, `${name} Secure`);
      }
    }
    assert.equal(AUTH_COOKIE_PATTERN.test("sb-dmtbieetvgkvncadbkmd-auth-token"), true);
    assert.equal(AUTH_COOKIE_PATTERN.test("sb-dmtbieetvgkvncadbkmd-auth-token.1"), true);
    assert.equal(AUTH_COOKIE_PATTERN.test("payload-token"), false);
  });

  function post(path: string, fields: Record<string, string>, headers: Record<string, string> = {}): NextRequest {
    return new NextRequest(`${ORIGIN}${path}`, {
      method: "POST",
      headers: { host: "localhost:3100", "content-type": "application/x-www-form-urlencoded", ...headers },
      body: new URLSearchParams(fields).toString(),
    });
  }

  const params = (locale: string) => Promise.resolve({ locale });

  test("AUU12 authPost/authConfirm: 404 when off or for another locale; 403 without a same-origin Origin (no cookie, no call); 303 with private headers", async () => {
    const valid = { origin: ORIGIN };
    // Bad Origin: 403 before any Supabase call.
    const badOrigins: Record<string, string>[] = [{}, { origin: "null" }, { origin: "https://evil.example" }];
    for (const headers of badOrigins) {
      const response = await authPost(post("/id/auth/login", CREDENTIALS, headers), params("id"), "login");
      assert.equal(response.status, 403, JSON.stringify(headers));
      assert.equal(response.headers.get("set-cookie"), null);
      assert.equal(response.headers.get("x-robots-tag"), "noindex");
      assert.match(response.headers.get("cache-control") ?? "", /no-store/);
    }
    assert.deepEqual(seen, [], "no request reached Supabase");

    // Invalid input: 303 to the status, no Supabase call.
    const invalid = await authPost(post("/id/auth/register", { email: "x" }, valid), params("id"), "register");
    assert.equal(invalid.status, 303);
    assert.equal(invalid.headers.get("location"), `${ORIGIN}/id/register?status=invalid-input`);
    assert.equal(invalid.headers.get("cache-control"), "private, no-store");
    assert.equal(invalid.headers.get("x-robots-tag"), "noindex");
    assert.deepEqual(seen, []);

    // A Supabase failure: login error, never 5xx.
    const failed = await authPost(post("/en/auth/login", CREDENTIALS, valid), params("en"), "login");
    assert.equal(failed.status, 303);
    assert.equal(failed.headers.get("location"), `${ORIGIN}/en/login?status=error`);
    assert.deepEqual(seen, ["POST /auth/v1/token"]);

    // Logout expires the session cookies the request carried (also its chunks), even when Supabase fails.
    const cookie = "sb-dmtbieetvgkvncadbkmd-auth-token=garbage; sb-dmtbieetvgkvncadbkmd-auth-token.1=x; payload-token=keep";
    const out = await authPost(post("/id/auth/logout", {}, { ...valid, cookie }), params("id"), "logout");
    assert.equal(out.status, 303);
    assert.equal(out.headers.get("location"), `${ORIGIN}/id/login?status=signed-out`);
    const cleared = out.headers.getSetCookie();
    for (const name of ["sb-dmtbieetvgkvncadbkmd-auth-token", "sb-dmtbieetvgkvncadbkmd-auth-token.1"]) {
      const line = cleared.find((value) => value.startsWith(`${name}=`));
      assert.ok(line, `${name} expired`);
      assert.match(line, /Max-Age=0/i);
      assert.match(line, /HttpOnly/i);
    }
    assert.equal(cleared.some((value) => value.startsWith("payload-token=")), false, "the staff cookie is untouched");

    // Off, or an unknown locale: 404.
    assert.equal((await authPost(post("/xx/auth/login", CREDENTIALS, valid), params("xx"), "login")).status, 404);
    assert.equal((await authConfirm(new NextRequest(`${ORIGIN}/xx/auth/confirm`), params("xx"))).status, 404);
    process.env[AUTH_KEY_NAME] = "";
    const off = await authPost(post("/id/auth/login", CREDENTIALS, valid), params("id"), "login");
    assert.equal(off.status, 404);
    assert.equal(off.headers.get("cache-control"), "no-store");
    assert.equal((await authConfirm(new NextRequest(`${ORIGIN}/id/auth/confirm`), params("id"))).status, 404);
    process.env[AUTH_KEY_NAME] = "unit-test-dummy-publishable-key";

    // A bare confirm link: 303 link-invalid with private headers, no call.
    seen.length = 0;
    const bare = await authConfirm(new NextRequest(`${ORIGIN}/en/auth/confirm?next=https://evil.example`), params("en"));
    assert.equal(bare.status, 303);
    assert.equal(bare.headers.get("location"), `${ORIGIN}/en/login?status=link-invalid`);
    assert.equal(bare.headers.get("cache-control"), "private, no-store");
    assert.deepEqual(seen, []);
  });
});
