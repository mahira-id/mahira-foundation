import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, test } from "node:test";

import { CMS_ENV_NAMES, isCmsEnabled, readCmsEnv } from "../../payload/env";

// The env gate (M3-00, ENVIRONMENTS §3.1): all five CMS variables or none;
// VERCEL_ENV=production always turns the CMS off. Values here are dummies.
const GATE_NAMES = [...CMS_ENV_NAMES, "VERCEL_ENV"] as const;
const DUMMY = "unit-test-dummy-value-1234";

let saved: Record<string, string | undefined> = {};

function clearGateEnv(): void {
  for (const name of GATE_NAMES) delete process.env[name];
}

function setAll(): void {
  CMS_ENV_NAMES.forEach((name, index) => {
    process.env[name] = `${DUMMY}-${index}`;
  });
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

describe("payload/env.ts — CMS env gate", () => {
  test("none set: CMS off, readCmsEnv() returns null", () => {
    assert.equal(readCmsEnv(), null);
    assert.equal(isCmsEnabled(), false);
  });

  test("all five set: CMS on, readCmsEnv() returns exactly those values", () => {
    setAll();
    const env = readCmsEnv();
    assert.ok(env, "readCmsEnv() must return an object when all five are set");
    assert.deepEqual(Object.keys(env).sort(), [...CMS_ENV_NAMES].sort());
    CMS_ENV_NAMES.forEach((name, index) => {
      assert.equal(env[name] === `${DUMMY}-${index}`, true, `${name} must carry its own value`);
    });
    assert.equal(isCmsEnabled(), true);
  });

  test('an empty string counts as missing ("" for all five = none set)', () => {
    for (const name of CMS_ENV_NAMES) process.env[name] = "";
    assert.equal(readCmsEnv(), null);
    assert.equal(isCmsEnabled(), false);
  });

  test('one variable "" and the rest set: incomplete, throws', () => {
    setAll();
    process.env.APP_SUPABASE_URL = "";
    assert.throws(() => readCmsEnv(), /missing: APP_SUPABASE_URL\./);
    assert.equal(isCmsEnabled(), false);
  });

  for (let count = 1; count <= 4; count++) {
    test(`partial set (${count} of 5): throws, names every missing variable and no value`, () => {
      const set = CMS_ENV_NAMES.slice(0, count);
      const missing = CMS_ENV_NAMES.slice(count);
      for (const name of set) process.env[name] = DUMMY;
      let message = "";
      try {
        readCmsEnv();
      } catch (error) {
        message = error instanceof Error ? error.message : String(error);
      }
      assert.equal(message.startsWith("Incomplete CMS environment; missing:"), true, "partial set must throw the gate error");
      for (const name of missing) {
        assert.equal(message.includes(name), true, `message must name missing ${name}`);
      }
      assert.equal(message.includes(DUMMY), false, "message must not contain any value");
      assert.equal(isCmsEnabled(), false, "isCmsEnabled() never throws and is false");
    });
  }

  test("VERCEL_ENV=production with all five set: CMS off", () => {
    setAll();
    process.env.VERCEL_ENV = "production";
    assert.equal(readCmsEnv(), null);
    assert.equal(isCmsEnabled(), false);
  });

  test("VERCEL_ENV=production with a partial set: CMS off, no throw", () => {
    process.env.PAYLOAD_SECRET = DUMMY;
    process.env.VERCEL_ENV = "production";
    assert.equal(readCmsEnv(), null);
    assert.equal(isCmsEnabled(), false);
  });

  test("VERCEL_ENV=preview with all five set: CMS on", () => {
    setAll();
    process.env.VERCEL_ENV = "preview";
    assert.notEqual(readCmsEnv(), null);
    assert.equal(isCmsEnabled(), true);
  });
});
