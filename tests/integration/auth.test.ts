import assert from "node:assert/strict";
import { after, before, describe, test } from "node:test";

import {
  SAME_ORIGIN,
  accessTokenFacts,
  applySetCookies,
  getRsc,
  isRemoval,
  loginSession,
  parseSetCookie,
  postAccountForm,
  sessionCookieLines,
  sessionTokens,
  tamperSession,
  target,
} from "../helpers/auth-http";
import { hookNote } from "../helpers/fixtures";
import { assertServerUp, getPage, pageFact, postForm, type PageResult } from "../helpers/http";
import {
  assertSafeAuthTarget,
  authEmail,
  countAuthUsers,
  createAuthUser,
  emailLinkHash,
  getAuthUser,
  sweepAuthUsers,
  type TestUser,
} from "../helpers/supabase-admin";

/**
 * Public accounts over HTTP (M5-01/M5-02, DECISIONS §2.18, SPIKE-002),
 * area `auth`: the form handlers `/{locale}/auth/*`, the email link
 * `/{locale}/auth/confirm` and the session gate of proxy.ts on
 * `/{locale}/account`, against the APP project's Supabase Auth. Needs
 * `next start` with `.env.local` (accounts on; bun run test:integration).
 *
 * Fixture users `fixture-test-auth-core-*@example.invalid` are created
 * confirmed through the Admin API (tests/helpers/supabase-admin.ts); email
 * links come from generateLink. No test submits a valid registration or
 * forgot-password form, so Supabase sends no email. Users are swept at the
 * start and at the end; the end fails if one is left. Passwords, cookies
 * and tokens are never printed: diagnostics carry names, attributes,
 * statuses and booleans only.
 */
const AREA = "core" as const;
const HANDLERS = ["login", "register", "logout", "forgot-password", "reset-password", "change-password"] as const;

function describePage(page: PageResult): string {
  return `${pageFact(page)}${page.location ? ` (${target(page.location)})` : ""}`;
}

function assertPrivate(page: PageResult, label: string): void {
  assert.match(page.cacheControl, /private/, `${label}: Cache-Control private (${page.cacheControl})`);
  assert.match(page.cacheControl, /no-store/, `${label}: Cache-Control no-store (${page.cacheControl})`);
}

function assertSeeOther(page: PageResult, expected: string, label: string): void {
  assert.equal(page.status, 303, `${label}: ${describePage(page)}`);
  assert.equal(target(page.location), expected, `${label}: ${describePage(page)}`);
  assertPrivate(page, label);
}

/** The proxy passed the account request on (no 307 to login); the page itself is Part B. */
function assertPassed(page: PageResult, label: string): void {
  assert.notEqual(page.status, 307, `${label}: ${describePage(page)}`);
  assert.equal(page.status < 500, true, `${label}: ${describePage(page)}`);
  assert.equal(target(page.location).endsWith("/login"), false, `${label}: ${describePage(page)}`);
}

function assertToLogin(page: PageResult, locale: "id" | "en", label: string): void {
  assert.equal(page.status, 307, `${label}: ${describePage(page)}`);
  assert.equal(target(page.location), `/${locale}/login`, `${label}: ${describePage(page)}`);
}

describe("public accounts: form handlers, email link and the account session gate (M5-02)", () => {
  const users = new Map<string, TestUser>();

  function user(name: string): TestUser {
    const found = users.get(name);
    if (!found) throw new Error(`user ${name} not created (before hook failed)`);
    return found;
  }

  before(async (t) => {
    assertSafeAuthTarget();
    await assertServerUp();
    hookNote(t, `sweep at start removed ${await sweepAuthUsers(AREA)} users`);
    for (const name of ["login", "logout", "refresh", "reset", "change"]) users.set(name, await createAuthUser(AREA, name));
    users.set("unconfirmed", await createAuthUser(AREA, "unconfirmed", { confirmed: false }));
  });

  after(async (t) => {
    const removed = await sweepAuthUsers(AREA);
    hookNote(t, `sweep at end removed ${removed} users`);
    const left = await countAuthUsers(AREA);
    if (left !== 0) throw new Error(`fixture users left after the sweep: ${left}`);
  });

  test("AU1 every form handler refuses a POST without a same-origin Origin: 403, no cookie", async () => {
    // Login gets valid credentials (a bypass would sign in). Register and forgot-password get an
    // invalid email, so even a broken Origin check never makes Supabase send an email.
    const fields: Record<(typeof HANDLERS)[number], Record<string, string>> = {
      login: { email: user("login").email, password: user("login").password },
      register: { email: "not-an-email", password: "fixture-pass-1", password_confirm: "fixture-pass-1" },
      logout: {},
      "forgot-password": { email: "not-an-email" },
      "reset-password": { password: "fixture-pass-1", password_confirm: "fixture-pass-1" },
      "change-password": { current_password: "fixture-pass-1", password: "fixture-pass-2", password_confirm: "fixture-pass-2" },
    };
    for (const handler of HANDLERS) {
      for (const [label, headers] of [
        ["no Origin", {}],
        ["Origin null", { Origin: "null" }],
        ["foreign Origin", { Origin: "https://evil.example" }],
      ] as const) {
        const page = await postForm(`/id/auth/${handler}`, fields[handler], headers);
        assert.equal(page.status, 403, `${handler}, ${label}: ${describePage(page)}`);
        assert.deepEqual(page.setCookies, [], `${handler}, ${label}: Set-Cookie`);
      }
    }
  });

  test("AU2 login: 303 to /id/account with the session cookie (HttpOnly, SameSite=Lax, Path=/, host-only), private no-store", async (t) => {
    const { page, cookie } = await loginSession(user("login").email, user("login").password);
    assertSeeOther(page, "/id/account", "login");
    const lines = sessionCookieLines(page);
    assert.ok(lines.length > 0, "a session cookie is set");
    for (const line of lines) {
      const { name, attributes } = parseSetCookie(line);
      const lower = attributes.map((attribute) => attribute.toLowerCase());
      t.diagnostic(`Set-Cookie ${name}; ${attributes.map((attribute) => attribute.split("=")[0]).join("; ")}`);
      assert.equal(lower.includes("httponly"), true, `${name} HttpOnly`);
      assert.equal(lower.includes("samesite=lax"), true, `${name} SameSite=Lax`);
      assert.equal(lower.includes("path=/"), true, `${name} Path=/`);
      assert.equal(lower.some((attribute) => attribute.startsWith("domain=")), false, `${name} host-only`);
      assert.equal(lower.includes("secure"), false, `${name} not Secure on http (Secure on https)`);
    }
    t.diagnostic(`other Set-Cookie names: ${page.setCookies.map((line) => parseSetCookie(line).name).filter((name) => !lines.some((l) => l.startsWith(`${name}=`))).join(", ") || "none"}`);
    t.diagnostic(`access token alg: ${accessTokenFacts(cookie).alg}`);
    assertPassed(await getPage("/id/account", { Cookie: cookie }), "GET /id/account with the session");
  });

  test("AU3 wrong password, unknown email and unconfirmed account: the same 303 login `invalid`, no session cookie", async () => {
    const cases: Array<[string, string, string]> = [
      ["wrong password", user("login").email, `${user("login").password}x`],
      ["unknown email", authEmail(AREA, "nobody"), user("login").password],
      ["unconfirmed", user("unconfirmed").email, user("unconfirmed").password],
    ];
    for (const [label, email, password] of cases) {
      const { page, cookie } = await loginSession(email, password);
      assertSeeOther(page, "/id/login?status=invalid", label);
      assert.equal(cookie, "", `${label}: no session cookie`);
    }
  });

  test("AU4 anonymous GET /{locale}/account (document and RSC): 307 to the own locale's login page", async () => {
    for (const locale of ["id", "en"] as const) {
      const document = await getPage(`/${locale}/account`);
      assertToLogin(document, locale, `document ${locale}`);
      assertPrivate(document, `document ${locale}`);
      assertToLogin(await getRsc(`/${locale}/account`), locale, `RSC ${locale}`);
      assertToLogin(await getRsc(`/${locale}/account`, { Cookie: "payload-token=x" }), locale, `RSC ${locale} staff cookie only`);
    }
  });

  test("AU5 logout: 303 login `signed-out`, session cookie cleared; the old cookie then gets change-password `session-ended`", async (t) => {
    const { cookie } = await loginSession(user("logout").email, user("logout").password);
    assert.notEqual(cookie, "", "logged in");
    const out = await postAccountForm("/id/auth/logout", {}, cookie);
    assertSeeOther(out, "/id/login?status=signed-out", "logout");
    const cleared = sessionCookieLines(out);
    assert.ok(cleared.length > 0, "logout sets the session cookie");
    assert.equal(cleared.every(isRemoval), true, "every session cookie line removes it");
    assert.equal(applySetCookies(cookie, out.setCookies), "", "the browser holds no session cookie after logout");

    // The old cookie, replayed. Its access token stays valid until it expires (a JWT): with asymmetric keys
    // proxy.ts verifies it locally and passes the request on; the handlers ask the Auth server and refuse it.
    const { alg } = accessTokenFacts(cookie);
    const replay = await getPage("/id/account", { Cookie: cookie });
    t.diagnostic(`old cookie on GET /id/account: ${describePage(replay)}; access token alg ${alg}`);
    if (alg.startsWith("HS")) assert.equal(replay.status === 307 || replay.status < 500, true, describePage(replay));
    else assertPassed(replay, "old cookie, asymmetric JWT: the proxy is not the only check");
    const change = await postAccountForm(
      "/id/auth/change-password",
      { current_password: user("logout").password, password: "fixture-new-pass-1", password_confirm: "fixture-new-pass-1" },
      cookie,
    );
    assertSeeOther(change, "/id/login?status=session-ended", "change-password with the old cookie");
  });

  test("AU6 garbage, tampered and expired cookies: 307 to login, never 5xx; a bad access token with a valid refresh token is refreshed", async (t) => {
    const name = `sb-${new URL(process.env.APP_SUPABASE_URL ?? "").hostname.split(".")[0]}-auth-token`;
    for (const [label, cookie] of [
      ["garbage", `${name}=garbage`],
      ["bad base64", `${name}=base64-%%%`],
      ["JSON without tokens", `${name}=base64-${Buffer.from('{"a":1}').toString("base64url")}`],
    ] as const) {
      const page = await getPage("/id/account", { Cookie: cookie });
      assertToLogin(page, "id", label);
    }
    const { cookie } = await loginSession(user("refresh").email, user("refresh").password);
    const past = Math.floor(Date.now() / 1000) - 60;
    const future = Math.floor(Date.now() / 1000) + 3000;
    const badAccessFuture = tamperSession(cookie, { accessToken: "not.a.jwt", expiresAt: future });
    assertToLogin(await getPage("/id/account", { Cookie: badAccessFuture }), "id", "bad access token, not expired");
    const bothBad = tamperSession(cookie, { accessToken: "not.a.jwt", refreshToken: "not-a-refresh-token", expiresAt: past });
    const dead = await getPage("/id/account", { Cookie: bothBad });
    assertToLogin(dead, "id", "bad access and refresh token, expired");
    t.diagnostic(`dead session: ${sessionCookieLines(dead).length} session Set-Cookie lines, all removals=${sessionCookieLines(dead).every(isRemoval)}`);
    assert.equal(sessionCookieLines(dead).every(isRemoval), true, "a dead session is only ever removed");

    const refreshable = tamperSession(cookie, { accessToken: "not.a.jwt", expiresAt: past });
    const refreshed = await getPage("/id/account", { Cookie: refreshable });
    assertPassed(refreshed, "bad access token, valid refresh token");
    const lines = sessionCookieLines(refreshed);
    assert.ok(lines.length > 0 && lines.some((line) => !isRemoval(line)), "refreshed session cookie set");
    assertPrivate(refreshed, "refresh response");
    const renewed = applySetCookies(refreshable, refreshed.setCookies);
    assert.notEqual(sessionTokens(renewed).refreshToken, sessionTokens(cookie).refreshToken, "the refresh token rotated");
    assertPassed(await getPage("/id/account", { Cookie: renewed }), "the refreshed cookie");
  });

  test("AU7 email link: confirms and signs in (account `email-confirmed`); reuse, wrong type, missing or malformed token: login `link-invalid`; /en stays /en", async () => {
    const email = authEmail(AREA, "signup");
    const { hash, userId } = await emailLinkHash("signup", email);
    assert.equal((await getAuthUser(userId))?.emailConfirmed, false, "unconfirmed before the link");
    const confirmed = await getPage(`/id/auth/confirm?token_hash=${encodeURIComponent(hash)}&type=email`);
    assertSeeOther(confirmed, "/id/account?status=email-confirmed", "signup link");
    assert.equal((await getAuthUser(userId))?.emailConfirmed, true, "confirmed after the link");
    const cookie = applySetCookies("", sessionCookieLines(confirmed));
    assert.notEqual(cookie, "", "the link signs the user in");
    assertPassed(await getPage("/id/account", { Cookie: cookie }), "account after the link");

    for (const [label, query] of [
      ["reused", `token_hash=${encodeURIComponent(hash)}&type=email`],
      ["wrong type", `token_hash=${encodeURIComponent(hash)}&type=signup`],
      ["missing token", "type=email"],
      ["malformed token", "token_hash=%3Cscript%3E&type=email"],
      ["unknown token", `token_hash=${"0".repeat(56)}&type=email`],
    ] as const) {
      const page = await getPage(`/id/auth/confirm?${query}`);
      assertSeeOther(page, "/id/login?status=link-invalid", label);
      assert.deepEqual(sessionCookieLines(page).filter((line) => !isRemoval(line)), [], `${label}: no session`);
    }

    const { hash: enHash } = await emailLinkHash("signup", authEmail(AREA, "signup-en"));
    assertSeeOther(await getPage(`/en/auth/confirm?token_hash=${encodeURIComponent(enHash)}&type=email&next=https://evil.example`), "/en/account?status=email-confirmed", "en link");
    assertSeeOther(await getPage("/en/auth/confirm?token_hash=x&type=email"), "/en/login?status=link-invalid", "en invalid");
  });

  test("AU8 reset: recovery link → /id/reset-password with a session → new password; it works, the old one fails; a password session cannot reset", async () => {
    const reset = user("reset");
    const { hash } = await emailLinkHash("recovery", reset.email);
    const link = await getPage(`/id/auth/confirm?token_hash=${encodeURIComponent(hash)}&type=recovery`);
    assertSeeOther(link, "/id/reset-password", "recovery link");
    const cookie = applySetCookies("", sessionCookieLines(link));
    assert.notEqual(cookie, "", "the recovery link signs the user in");

    const next = "fixture-reset-pass-2";
    assertSeeOther(
      await postAccountForm("/id/auth/reset-password", { password: next, password_confirm: next }, cookie),
      "/id/account?status=password-changed",
      "reset",
    );
    const fresh = await loginSession(reset.email, next);
    assertSeeOther(fresh.page, "/id/account", "login with the new password");
    assertSeeOther((await loginSession(reset.email, reset.password)).page, "/id/login?status=invalid", "login with the old password");
    reset.password = next;

    assertSeeOther(
      await postAccountForm("/id/auth/reset-password", { password: "fixture-reset-pass-3", password_confirm: "fixture-reset-pass-3" }, fresh.cookie),
      "/id/forgot-password?status=link-invalid",
      "reset with a password session",
    );
    assertSeeOther(
      await postAccountForm("/id/auth/reset-password", { password: "fixture-reset-pass-3", password_confirm: "fixture-reset-pass-3" }),
      "/id/forgot-password?status=link-invalid",
      "reset without a session",
    );
  });

  test("AU9 change-password: wrong current, mismatch, too short, same password, success (the old password then fails)", async () => {
    const change = user("change");
    const { cookie } = await loginSession(change.email, change.password);
    assert.notEqual(cookie, "", "logged in");
    const next = "fixture-change-pass-2";
    const cases: Array<[string, Record<string, string>, string]> = [
      ["wrong current", { current_password: `${change.password}x`, password: next, password_confirm: next }, "invalid-current"],
      ["mismatch", { current_password: change.password, password: next, password_confirm: `${next}x` }, "password-mismatch"],
      ["too short", { current_password: change.password, password: "short", password_confirm: "short" }, "invalid-input"],
    ];
    for (const [label, fields, status] of cases) {
      assertSeeOther(await postAccountForm("/id/auth/change-password", fields, cookie), `/id/account?status=${status}`, label);
    }
    const ok = await postAccountForm("/id/auth/change-password", { current_password: change.password, password: next, password_confirm: next }, cookie);
    assertSeeOther(ok, "/id/account?status=password-changed", "success");
    const after = applySetCookies(cookie, ok.setCookies);
    assertSeeOther(
      await postAccountForm("/id/auth/change-password", { current_password: next, password: next, password_confirm: next }, after),
      "/id/account?status=same-password",
      "same password",
    );
    assertSeeOther((await loginSession(change.email, change.password)).page, "/id/login?status=invalid", "the old password");
    change.password = next;
  });

  test("AU10 invalid input answers its status without Supabase (no cookie), also on /en; register and forgot never get a valid form here", async () => {
    const cases: Array<[string, Record<string, string>, string]> = [
      ["/id/auth/login", { email: "not-an-email", password: "fixture-pass-1" }, "/id/login?status=invalid-input"],
      ["/id/auth/login", { email: authEmail(AREA, "x"), password: "short" }, "/id/login?status=invalid-input"],
      ["/id/auth/register", { email: "not-an-email", password: "fixture-pass-1", password_confirm: "fixture-pass-1" }, "/id/register?status=invalid-input"],
      ["/en/auth/register", { email: authEmail(AREA, "x"), password: "fixture-pass-1", password_confirm: "fixture-pass-2" }, "/en/register?status=password-mismatch"],
      ["/id/auth/forgot-password", { email: "" }, "/id/forgot-password?status=invalid-input"],
      ["/id/auth/reset-password", { password: "short", password_confirm: "short" }, "/id/reset-password?status=invalid-input"],
      ["/en/auth/reset-password", { password: "fixture-pass-1", password_confirm: "fixture-pass-2" }, "/en/reset-password?status=password-mismatch"],
      ["/id/auth/change-password", { current_password: "fixture-pass-1", password: "fixture-pass-2", password_confirm: "x" }, "/id/account?status=password-mismatch"],
    ];
    for (const [path, fields, expected] of cases) {
      const page = await postForm(path, fields, { ...SAME_ORIGIN });
      assertSeeOther(page, expected, path);
      assert.deepEqual(page.setCookies, [], `${path}: no cookie`);
    }
  });
});
