import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, test } from "node:test";

import { AUTH_ENV_NAMES, AUTH_KEY_NAME, AUTH_URL_NAME, isAuthEnabled, readAuthEnv } from "../../lib/auth/env";
import {
  AUTH_HANDLERS,
  AUTH_PAGES,
  AUTH_STATUSES,
  authHandlerPath,
  authPagePath,
  parseAuthPath,
  readStatus,
  statusHref,
} from "../../lib/auth/routes";

// The account env gate (M5-02, DECISIONS §2.18 decisions 4 and 5) and the
// account route helpers (decision 13). Values here are dummies.
const GATE_NAMES = [...AUTH_ENV_NAMES, "VERCEL_ENV"] as const;
const DUMMY_URL = "https://unit-test-dummy.supabase.co";
const DUMMY_KEY = "unit-test-dummy-publishable-key";

let saved: Record<string, string | undefined> = {};

function clearGateEnv(): void {
  for (const name of GATE_NAMES) delete process.env[name];
}

beforeEach(() => {
  saved = {};
  for (const name of GATE_NAMES) saved[name] = process.env[name];
  clearGateEnv();
});

afterEach(() => {
  clearGateEnv();
  for (const name of GATE_NAMES) {
    if (saved[name] !== undefined) process.env[name] = saved[name];
  }
});

function thrown(fn: () => unknown): string {
  try {
    fn();
  } catch (error) {
    return error instanceof Error ? error.message : String(error);
  }
  return "";
}

describe("lib/auth/env.ts — account env gate", () => {
  test("AEU1 no key: accounts off, also with APP_SUPABASE_URL set (it belongs to the CMS set too) or the key \"\"", () => {
    assert.equal(readAuthEnv(), null);
    assert.equal(isAuthEnabled(), false);
    process.env[AUTH_URL_NAME] = DUMMY_URL;
    assert.equal(readAuthEnv(), null, "URL alone");
    assert.equal(isAuthEnabled(), false, "URL alone");
    process.env[AUTH_KEY_NAME] = "";
    assert.equal(readAuthEnv(), null, 'key ""');
    assert.equal(isAuthEnabled(), false, 'key ""');
  });

  test("AEU2 URL and key: accounts on, readAuthEnv() returns both (URL without trailing slash)", () => {
    process.env[AUTH_URL_NAME] = `${DUMMY_URL}/`;
    process.env[AUTH_KEY_NAME] = DUMMY_KEY;
    assert.deepEqual(readAuthEnv(), { url: DUMMY_URL, publishableKey: DUMMY_KEY });
    assert.equal(isAuthEnabled(), true);
  });

  test("AEU3 key without URL: readAuthEnv() throws naming only APP_SUPABASE_URL, no value; isAuthEnabled() is false and never throws", () => {
    process.env[AUTH_KEY_NAME] = DUMMY_KEY;
    for (const url of [undefined, ""]) {
      if (url === undefined) delete process.env[AUTH_URL_NAME];
      else process.env[AUTH_URL_NAME] = url;
      const message = thrown(() => readAuthEnv());
      assert.equal(message.startsWith(`Incomplete auth environment; missing: ${AUTH_URL_NAME}.`), true, `message: ${message}`);
      assert.equal(message.includes(AUTH_KEY_NAME), false, "the message names only the missing variable");
      assert.equal(message.includes(DUMMY_KEY), false, "the message must not contain a value");
      assert.equal(isAuthEnabled(), false);
    }
  });

  test("AEU4 VERCEL_ENV=production: accounts off with the full set and with the key alone (no throw)", () => {
    process.env.VERCEL_ENV = "production";
    process.env[AUTH_KEY_NAME] = DUMMY_KEY;
    assert.equal(readAuthEnv(), null, "key alone");
    assert.equal(isAuthEnabled(), false, "key alone");
    process.env[AUTH_URL_NAME] = DUMMY_URL;
    assert.equal(readAuthEnv(), null, "full set");
    assert.equal(isAuthEnabled(), false, "full set");
    process.env.VERCEL_ENV = "preview";
    assert.equal(isAuthEnabled(), true, "VERCEL_ENV=preview with the full set");
  });
});

describe("lib/auth/routes.ts — account routes and statuses", () => {
  test("AEU5 parseAuthPath: account, handler and page paths of both locales; anything else null", () => {
    for (const locale of ["id", "en"] as const) {
      assert.deepEqual(parseAuthPath(`/${locale}/account`), { locale, kind: "account" });
      assert.deepEqual(parseAuthPath(`/${locale}/account/x`), { locale, kind: "account" });
      for (const handler of AUTH_HANDLERS) {
        assert.deepEqual(parseAuthPath(`/${locale}/auth/${handler}`), { locale, kind: "handler" }, handler);
      }
      for (const page of AUTH_PAGES.filter((name) => name !== "account")) {
        assert.deepEqual(parseAuthPath(`/${locale}/${page}`), { locale, kind: "page" }, page);
      }
    }
    for (const path of ["/", "/id", "/id/", "/ID/login", "/fr/login", "/id/loginx", "/id/publications", "/admin", "/api/auth/login", "id/login"]) {
      assert.equal(parseAuthPath(path), null, path);
    }
  });

  test("AEU6 paths, statusHref and readStatus: closed status lists per page, unknown values ignored", () => {
    assert.equal(authPagePath("en", "forgot-password"), "/en/forgot-password");
    assert.equal(authHandlerPath("id", "confirm"), "/id/auth/confirm");
    assert.equal(statusHref("id", "login"), "/id/login");
    assert.equal(statusHref("en", "account", "password-changed"), "/en/account?status=password-changed");
    assert.deepEqual(AUTH_STATUSES, {
      login: ["invalid", "rate-limited", "error", "signed-out", "session-ended", "link-invalid", "invalid-input"],
      register: ["check-email", "invalid-input", "password-mismatch", "weak-password", "rate-limited", "error"],
      "forgot-password": ["check-email", "invalid-input", "rate-limited", "error", "link-invalid"],
      "reset-password": ["invalid-input", "password-mismatch", "weak-password", "same-password", "error"],
      account: ["email-confirmed", "password-changed", "invalid-current", "invalid-input", "password-mismatch", "weak-password", "same-password", "error"],
    });
    for (const page of AUTH_PAGES) {
      for (const status of AUTH_STATUSES[page]) assert.equal(readStatus(page, status), status, `${page} ${status}`);
    }
    assert.equal(readStatus("login", ["signed-out", "invalid"]), "signed-out", "first value of a repeated parameter");
    for (const value of [undefined, null, "", "<script>", "INVALID", "check-email", ["x", "invalid"]]) {
      assert.equal(readStatus("login", value), null, JSON.stringify(value));
    }
    assert.equal(readStatus("account", "invalid"), null, "a status of another page");
  });
});
