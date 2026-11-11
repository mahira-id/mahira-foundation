import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { DEFAULT_LOCALE, LOCALES, isLocale, languageSwitchHref, otherLocale } from "../../lib/i18n/locales";

// DEC-005 / ADR-0005: two locales, exact lower-case match, no fallback.
describe("lib/i18n/locales.ts", () => {
  test("LOCALES is [id, en] and DEFAULT_LOCALE is id", () => {
    assert.deepEqual([...LOCALES], ["id", "en"]);
    assert.equal(DEFAULT_LOCALE, "id");
  });

  test("isLocale accepts id and en", () => {
    assert.equal(isLocale("id"), true);
    assert.equal(isLocale("en"), true);
  });

  for (const value of ["ID", "Id", "EN", "fr", ""]) {
    test(`isLocale rejects ${JSON.stringify(value)} (case-sensitive, unknown, empty)`, () => {
      assert.equal(isLocale(value), false);
    });
  }

  test("otherLocale swaps id and en", () => {
    assert.equal(otherLocale("id"), "en");
    assert.equal(otherLocale("en"), "id");
  });

  test("languageSwitchHref without an alternate goes to the target publication index", () => {
    assert.equal(languageSwitchHref("en"), "/en/publications");
    assert.equal(languageSwitchHref("id", {}), "/id/publications");
    assert.equal(languageSwitchHref("en", { id: "/id/publications/x" }), "/en/publications");
  });

  test("languageSwitchHref uses the counterpart page when there is one", () => {
    assert.equal(languageSwitchHref("en", { en: "/en/publications/fixture-test-unit-slug" }), "/en/publications/fixture-test-unit-slug");
  });
});
