import assert from "node:assert/strict";
import { after, before, describe, test } from "node:test";
import type { Payload } from "payload";

import { AUTH_HANDLERS, AUTH_PAGES, AUTH_STATUSES, type AuthPage } from "../../lib/auth/routes";
import { dictionaries } from "../../lib/i18n/dictionaries";
import { loginSession, postAccountForm, sessionTokens, target } from "../helpers/auth-http";
import {
  areaEmail,
  assertOwnerIntact,
  cleanupArea,
  countLeftovers,
  formatCounts,
  hookNote,
  randomPassword,
  totalOf,
} from "../helpers/fixtures";
import { assertServerUp, getPage, login, pageFact, type PageResult } from "../helpers/http";
import { closeTestPayload, getTestPayload } from "../helpers/payload";
import { assertSafeAuthTarget, countAuthUsers, createAuthUser, sweepAuthUsers, type TestUser } from "../helpers/supabase-admin";

/**
 * The account pages over HTTP (M5-02, DECISIONS §2.18 decisions 9, 13, 14),
 * area `account-pages`, against `next start` with accounts on:
 *
 *   AP1 login, register, forgot-password and reset-password answer 200 in
 *       both locales with robots noindex, the right form action and field
 *       names, a switcher to the same page of the other locale, and no
 *       Supabase host in the HTML
 *   AP2 a session: the account page shows email, "Terverifikasi", access
 *       "Terdaftar" and the change-password and logout forms; private no-store (EN too)
 *   AP3 after sign-out the old cookie shows the "session ended" state, no email
 *   AP4 a staff cookie next to the public session changes nothing: the
 *       public email only; a staff cookie alone never reaches the page
 *   AP5 every status text of every page in both locales; an unknown status,
 *       markup in the status and the status of another page show nothing
 *   AP6 no token, key or secret in any page's HTML
 *   AP7 the header link "Akun" / "Account" on the account pages and on `/`
 *       and the publication index
 *   AP8 the registration page carries the privacy note labelled a draft
 *
 * Fixtures: Supabase users `fixture-test-pages-*` (confirmed through the
 * Admin API, no email; swept at start and end) and a Payload Editor
 * `fixture-test-account-pages-editor@example.invalid` (cleaned up with the
 * Owner guard). Tokens and cookies are never printed.
 */
const AREA = "account-pages" as const;
const AUTH_AREA = "pages" as const;
const LOCALES = ["id", "en"] as const;
const FORM_PAGES = ["login", "register", "forgot-password", "reset-password"] as const satisfies readonly AuthPage[];

/** Handler and field names each form page posts (lib/auth/routes.ts AUTH_FIELDS). */
const FORMS: Record<(typeof FORM_PAGES)[number], { handler: (typeof AUTH_HANDLERS)[number]; fields: string[] }> = {
  login: { handler: "login", fields: ["email", "password"] },
  register: { handler: "register", fields: ["email", "password", "password_confirm"] },
  "forgot-password": { handler: "forgot-password", fields: ["email"] },
  "reset-password": { handler: "reset-password", fields: ["password", "password_confirm"] },
};

function describePage(page: PageResult): string {
  return `${pageFact(page)}${page.location ? ` (${target(page.location)})` : ""}`;
}

/** HTML entities React writes for text and attribute values. */
function decode(html: string): string {
  return html
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

function assertNoindex(page: PageResult, label: string): void {
  assert.match(page.body, /<meta name="robots" content="noindex[^"]*"/, `${label}: robots noindex`);
}

function formOf(body: string, action: string): string {
  const open = body.indexOf(`action="${action}"`);
  assert.notEqual(open, -1, `form with action ${action}`);
  const start = body.lastIndexOf("<form", open);
  const end = body.indexOf("</form>", open);
  return body.slice(start, end);
}

describe("account pages (M5-02)", () => {
  let payload: Payload | undefined;
  let editorToken: string | undefined;
  const users = new Map<string, TestUser>();
  const cookies = new Map<string, string>();

  function p(): Payload {
    if (!payload) throw new Error("Payload not initialised (before hook failed)");
    return payload;
  }

  function user(name: string): TestUser {
    const found = users.get(name);
    if (!found) throw new Error(`user ${name} not created (before hook failed)`);
    return found;
  }

  function cookie(name: string): string {
    const found = cookies.get(name);
    if (!found) throw new Error(`session ${name} missing (before hook failed)`);
    return found;
  }

  before(async (t) => {
    assertSafeAuthTarget();
    payload = await getTestPayload();
    hookNote(t, `cleanup at start removed ${formatCounts(await cleanupArea(payload, AREA))}`);
    hookNote(t, `sweep at start removed ${await sweepAuthUsers(AUTH_AREA)} public users`);
    await assertOwnerIntact(payload);
    await assertServerUp();

    const secret = randomPassword();
    await p().create({ collection: "users", data: { email: areaEmail(AREA, "editor"), password: secret, role: "editor" }, overrideAccess: true });
    editorToken = await login(areaEmail(AREA, "editor"), secret);

    for (const name of ["view", "view-en", "logout"]) {
      const created = await createAuthUser(AUTH_AREA, name);
      users.set(name, created);
      const session = await loginSession(created.email, created.password);
      if (!session.cookie) throw new Error(`public login ${name} failed`);
      cookies.set(name, session.cookie);
    }
  });

  after(async (t) => {
    try {
      if (payload) {
        hookNote(t, `cleanup at end removed ${formatCounts(await cleanupArea(payload, AREA))}`);
        await assertOwnerIntact(payload);
        const left = await countLeftovers(payload, AREA);
        if (totalOf(left) !== 0) throw new Error(`fixtures left after cleanup: ${formatCounts(left)}`);
      }
    } finally {
      await closeTestPayload(payload);
    }
    hookNote(t, `sweep at end removed ${await sweepAuthUsers(AUTH_AREA)} public users`);
    const left = await countAuthUsers(AUTH_AREA);
    if (left !== 0) throw new Error(`public fixture users left after the sweep: ${left}`);
  });

  test("AP1 the form pages: 200 in both locales, noindex, the right form action and fields, a switcher to the same page, no Supabase host", async () => {
    for (const locale of LOCALES) {
      for (const page of FORM_PAGES) {
        const label = `${locale}/${page}`;
        const result = await getPage(`/${locale}/${page}`);
        assert.equal(result.status, 200, `${label}: ${describePage(result)}`);
        assert.equal(result.body.includes(`<html lang="${locale}"`), true, `${label}: html lang`);
        assertNoindex(result, label);
        assert.equal(result.body.includes(`data-account-page="${page}"`), true, `${label}: page marker`);
        assert.equal(result.body.includes("supabase.co"), false, `${label}: a Supabase host in the HTML`);

        const { handler, fields } = FORMS[page];
        const form = formOf(result.body, `/${locale}/auth/${handler}`);
        assert.match(form, /method="post"/, `${label}: method post`);
        for (const field of fields) assert.equal(form.includes(`name="${field}"`), true, `${label}: field ${field}`);
        assert.equal(/<label[^>]*for="/.test(form), true, `${label}: labelled fields`);
        assert.equal(form.includes("required"), true, `${label}: required fields`);

        const other = locale === "id" ? "en" : "id";
        assert.equal(result.body.includes(`href="/${other}/${page}"`), true, `${label}: switcher to /${other}/${page}`);
      }
    }
    // Password autocomplete hints and the length rule of the new-password fields.
    const register = (await getPage("/id/register")).body;
    assert.equal(register.includes('autoComplete="new-password"') || register.includes('autocomplete="new-password"'), true, "register: new-password");
    assert.equal(/minLength="8"|minlength="8"/.test(register), true, "register: minlength 8");
    assert.equal(/maxLength="72"|maxlength="72"/.test(register), true, "register: maxlength 72");
    const loginPage = (await getPage("/id/login")).body;
    assert.equal(/autoComplete="current-password"|autocomplete="current-password"/.test(loginPage), true, "login: current-password");
    assert.equal(/autoComplete="email"|autocomplete="email"/.test(loginPage), true, "login: email autocomplete");
  });

  test("AP2 with a session the account page shows email, verification, access and the forms; private no-store; also in English", async () => {
    for (const [locale, name, texts] of [
      ["id", "view", { verified: "Terverifikasi", access: "Terdaftar" }],
      ["en", "view-en", { verified: "Verified", access: "Registered" }],
    ] as const) {
      const result = await getPage(`/${locale}/account`, { Cookie: cookie(name) });
      assert.equal(result.status, 200, `${locale}: ${describePage(result)}`);
      assertNoindex(result, locale);
      assert.match(result.cacheControl, /private/, `${locale}: Cache-Control private (${result.cacheControl})`);
      assert.match(result.cacheControl, /no-store/, `${locale}: Cache-Control no-store (${result.cacheControl})`);
      assert.equal(result.body.includes('data-account-session="active"'), true, `${locale}: active session`);
      assert.equal(decode(result.body).includes(user(name).email), true, `${locale}: the user's email`);
      assert.equal(result.body.includes('data-account-verification="verified"'), true, `${locale}: verification marker`);
      assert.equal(result.body.includes(texts.verified), true, `${locale}: ${texts.verified}`);
      assert.equal(result.body.includes('data-account-access="registered"'), true, `${locale}: access marker`);
      assert.equal(result.body.includes(`>${texts.access}<`), true, `${locale}: ${texts.access}`);
      const change = formOf(result.body, `/${locale}/auth/change-password`);
      for (const field of ["current_password", "password", "password_confirm"]) {
        assert.equal(change.includes(`name="${field}"`), true, `${locale}: change-password field ${field}`);
      }
      const logout = formOf(result.body, `/${locale}/auth/logout`);
      assert.match(logout, /method="post"/, `${locale}: logout method`);
      assert.equal(result.body.includes("data-account-status"), false, `${locale}: no status message without ?status`);
    }
  });

  test("AP3 after sign-out the old cookie (the proxy still passes it) shows the session-ended state and no email", async () => {
    const old = cookie("logout");
    const out = await postAccountForm("/id/auth/logout", {}, old);
    assert.equal(out.status, 303, describePage(out));
    const result = await getPage("/id/account", { Cookie: old });
    assert.equal(result.status, 200, `old cookie: ${describePage(result)}`);
    assert.equal(result.body.includes('data-account-session="ended"'), true, "session-ended state");
    assert.equal(result.body.includes('data-account-session="active"'), false, "no active state");
    assert.equal(decode(result.body).includes(user("logout").email), false, "the user's email is absent");
    assert.equal(result.body.includes("data-account-email"), false, "no account details");
    assert.equal(result.body.includes(`href="/id/login"`), true, "link to the login page");
    assert.match(result.cacheControl, /no-store/, `Cache-Control (${result.cacheControl})`);
    // The English page too.
    const en = await getPage("/en/account", { Cookie: old });
    assert.equal(en.body.includes('data-account-session="ended"'), true, "en: session-ended state");
  });

  test("AP4 a staff cookie next to the public session changes nothing; a staff cookie alone never reaches the page", async () => {
    assert.ok(editorToken, "editor login");
    const staff = `payload-token=${editorToken}`;
    const both = await getPage("/id/account", { Cookie: `${staff}; ${cookie("view")}` });
    assert.equal(both.status, 200, describePage(both));
    assert.equal(decode(both.body).includes(user("view").email), true, "the public email");
    assert.equal(decode(both.body).includes(areaEmail(AREA, "editor")), false, "the staff email never shows");
    const alone = await getPage("/id/account", { Cookie: staff });
    assert.equal(alone.status, 307, describePage(alone));
    assert.equal(target(alone.location), "/id/login", describePage(alone));
  });

  test("AP5 every status text shows on its page in both locales; unknown, markup and foreign statuses show nothing", async () => {
    const sessionCookie = cookie("view");
    for (const locale of LOCALES) {
      for (const page of AUTH_PAGES) {
        const texts = dictionaries[locale].account.statuses[page] as Record<string, string>;
        const headers: Record<string, string> = page === "account" ? { Cookie: sessionCookie } : {};
        for (const status of AUTH_STATUSES[page]) {
          const label = `${locale}/${page}?status=${status}`;
          const result = await getPage(`/${locale}/${page}?status=${status}`, headers);
          assert.equal(result.status, 200, `${label}: ${describePage(result)}`);
          assert.equal(result.body.includes(`data-account-status="${status}"`), true, `${label}: status marker`);
          assert.equal(decode(result.body).includes(texts[status]), true, `${label}: text`);
        }
        for (const [label, value] of [
          ["unknown", "nope"],
          ["markup", encodeURIComponent("<script>alert(1)</script>")],
          ["upper case", "INVALID"],
          ["other page", page === "login" ? "password-changed" : "signed-out"],
        ] as const) {
          const result = await getPage(`/${locale}/${page}?status=${value}`, headers);
          assert.equal(result.status, 200, `${locale}/${page} ${label}: ${describePage(result)}`);
          assert.equal(result.body.includes("data-account-status"), false, `${locale}/${page} ${label}: a status message`);
          assert.equal(result.body.includes("<script>alert"), false, `${locale}/${page} ${label}: raw markup echoed`);
        }
      }
    }
  });

  test("AP6 no token, publishable key or secret key in the HTML of any page", async () => {
    const { accessToken, refreshToken } = sessionTokens(cookie("view"));
    const secrets = [
      accessToken,
      refreshToken,
      process.env.APP_SUPABASE_PUBLISHABLE_KEY ?? "",
      process.env.APP_SUPABASE_SECRET_KEY ?? "",
    ].filter((value) => value.length >= 12);
    assert.equal(secrets.length >= 4, true, "tokens and keys available to check against");
    for (const locale of LOCALES) {
      for (const page of AUTH_PAGES) {
        const result = await getPage(`/${locale}/${page}`, { Cookie: cookie("view") });
        for (const [index, secret] of secrets.entries()) {
          assert.equal(result.body.includes(secret), false, `${locale}/${page}: value #${index} of the secret list in the HTML`);
        }
        assert.equal(/NEXT_PUBLIC_|SERVICE_ROLE|sb_secret_/.test(result.body), false, `${locale}/${page}: key name or prefix`);
      }
    }
  });

  test("AP7 the header link: `Akun` / `Account` to /{locale}/account on the account pages, `/` and the publication index", async () => {
    for (const [path, label, href] of [
      ["/id/login", "Akun", "/id/account"],
      ["/en/register", "Account", "/en/account"],
      ["/id/publications", "Akun", "/id/account"],
      ["/en/publications", "Account", "/en/account"],
      ["/", "Akun", "/id/account"],
    ] as const) {
      const result = await getPage(path);
      assert.equal(result.status, 200, `${path}: ${describePage(result)}`);
      const links = [...result.body.matchAll(/<a\b[^>]*data-header-account[^>]*>([\s\S]*?)<\/a>/g)];
      assert.equal(links.length >= 1, true, `${path}: a header account link`);
      for (const [tag, inner] of links) {
        assert.equal(tag.includes(`href="${href}"`), true, `${path}: href ${href}`);
        assert.equal(inner.replace(/<[^>]*>/g, "").trim(), label, `${path}: label`);
      }
    }
    // The link shows no login state: the same markup with a session.
    const anonymous = await getPage("/id/login");
    const signedIn = await getPage("/id/login", { Cookie: cookie("view") });
    const mark = (html: string) => (html.match(/<a\b[^>]*data-header-account[^>]*>[\s\S]*?<\/a>/) ?? [""])[0];
    assert.equal(mark(signedIn.body), mark(anonymous.body), "the header link is the same with and without a session");
  });

  test("AP8 the registration page carries the privacy note, labelled a draft not yet reviewed by legal (decision 9)", async () => {
    for (const locale of LOCALES) {
      const { privacy } = dictionaries[locale].account;
      const result = await getPage(`/${locale}/register`);
      assert.equal(result.body.includes("data-account-privacy"), true, `${locale}: privacy section`);
      const text = decode(result.body);
      assert.equal(text.includes(privacy.body), true, `${locale}: data and purpose`);
      assert.equal(text.includes(privacy.draft), true, `${locale}: draft label`);
    }
  });
});
