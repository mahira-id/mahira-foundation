import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { ReturnPathField } from "../../components/account/field";
import { AUTH_PAGES, AUTH_STATUSES, readStatus, type AuthPage } from "../../lib/auth/routes";
import { dictionaries } from "../../lib/i18n/dictionaries";
import { LOCALES } from "../../lib/i18n/locales";

/**
 * Texts and status reading of the account pages (M5-02, DECISIONS §2.18
 * decisions 9, 13, 14). The pages themselves are checked over HTTP (G12,
 * area `account-pages`).
 */
describe("account pages: texts and statuses (M5-02)", () => {
  test("APU1 every status of every account page has a text in both locales, and the texts are not shared between statuses of a page", () => {
    for (const locale of LOCALES) {
      const statuses: Record<string, Record<string, string>> = dictionaries[locale].account.statuses;
      assert.deepEqual(Object.keys(statuses).sort(), [...AUTH_PAGES].sort(), `${locale}: pages`);
      for (const page of AUTH_PAGES) {
        const texts = statuses[page];
        assert.deepEqual(Object.keys(texts).sort(), [...AUTH_STATUSES[page]].sort(), `${locale} ${page}: statuses`);
        for (const [status, text] of Object.entries(texts)) {
          assert.equal(typeof text === "string" && text.trim().length > 0, true, `${locale} ${page} ${status}: text`);
        }
        const unique = new Set(Object.values(texts));
        assert.equal(unique.size, Object.values(texts).length, `${locale} ${page}: two statuses share a text`);
      }
    }
    for (const page of AUTH_PAGES) {
      for (const status of AUTH_STATUSES[page]) {
        const id = (dictionaries.id.account.statuses[page] as Record<string, string>)[status];
        const en = (dictionaries.en.account.statuses[page] as Record<string, string>)[status];
        assert.notEqual(id, en, `${page} ${status}: the two locales differ`);
      }
    }
  });

  test("APU2 a status outside the page's list is ignored, whatever it is", () => {
    for (const page of AUTH_PAGES as readonly AuthPage[]) {
      for (const value of ["<script>alert(1)</script>", "", "CHECK-EMAIL", "check-email ", "__proto__", "constructor", undefined, ["x"]]) {
        const known = (AUTH_STATUSES[page] as readonly string[]).includes(value as string);
        assert.equal(readStatus(page, value as string | string[] | undefined), known ? value : null, `${page}: ${JSON.stringify(value)}`);
      }
      for (const status of AUTH_STATUSES[page]) {
        assert.equal(readStatus(page, status), status, `${page}: ${status}`);
        assert.equal(readStatus(page, [status, "invalid"]), status, `${page}: first of a list`);
      }
    }
    // A status of another page is not valid here.
    assert.equal(readStatus("reset-password", "check-email"), null);
    assert.equal(readStatus("login", "password-changed"), null);
  });

  test("APU3 the answers to register and forgot-password do not say whether the email has an account (decision 14a)", () => {
    for (const locale of LOCALES) {
      const { statuses } = dictionaries[locale].account;
      const conditional = locale === "id" ? /^Periksa kotak masuk email Anda\. Bila email itu/ : /^Check your inbox\. If that email/;
      assert.match(statuses.register["check-email"], conditional, `${locale} register check-email`);
      assert.match(statuses["forgot-password"]["check-email"], conditional, `${locale} forgot-password check-email`);
      assert.doesNotMatch(statuses.login.invalid, /terdaftar|tidak ditemukan|no account|not registered|unknown/i, `${locale} login invalid`);
    }
  });

  test("APU4 the registration privacy note names the data and the purpose and is labelled a draft (decision 9)", () => {
    const { id, en } = { id: dictionaries.id.account.privacy, en: dictionaries.en.account.privacy };
    assert.match(id.body, /email/i);
    assert.match(id.body, /akun/);
    assert.match(id.body, /unduh/);
    assert.match(id.draft, /draf/);
    assert.match(id.draft, /belum ditinjau hukum/);
    assert.match(en.body, /email/i);
    assert.match(en.body, /account/);
    assert.match(en.body, /download/);
    assert.match(en.draft, /draft/);
    assert.match(en.draft, /not been reviewed by legal/);
  });

  test("APU5 header label: one neutral word per locale, no login state", () => {
    assert.equal(dictionaries.id.account.navLabel, "Akun");
    assert.equal(dictionaries.en.account.navLabel, "Account");
  });

  test("APU6 login return path field (M5-04): a hidden `next` tied to the login form only for a publication detail path; nothing for anything else", async () => {
    const render = (next: string | string[] | undefined) =>
      ReturnPathField({ formId: "login-form", searchParams: Promise.resolve(next === undefined ? {} : { next }) });
    const field = (await render("/en/publications/a-b")) as { type: unknown; props: Record<string, unknown> } | null;
    assert.ok(field, "rendered for a valid path");
    assert.equal(field.type, "input");
    assert.deepEqual(field.props, { form: "login-form", name: "next", type: "hidden", value: "/en/publications/a-b" });
    for (const next of [undefined, "", "https://evil.example", "//evil", "/\\evil", "/id/account", "/api/files/1/download", "/id/publications/Bad"]) {
      assert.equal(await render(next), null, JSON.stringify(next));
    }
  });
});
