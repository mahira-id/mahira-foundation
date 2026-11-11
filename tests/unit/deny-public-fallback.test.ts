import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { denyPublicFallback } from "../../payload/hooks/deny-public-fallback";
import { fakeReq, fakeUser } from "../helpers/fake-req";

// DEC-005, finding C4c: an anonymous read never falls back to another
// language, whatever the caller asked for. DB counterpart: locale F2/F3.
type Hook = typeof denyPublicFallback;

async function runHook(req: ReturnType<typeof fakeReq>, args: Record<string, unknown>): Promise<unknown> {
  return denyPublicFallback({ args, req, operation: "read", context: {}, collection: {} } as unknown as Parameters<Hook>[0]);
}

describe("payload/hooks/deny-public-fallback.ts — denyPublicFallback", () => {
  for (const requested of ["en", "id", "none", undefined]) {
    test(`anonymous (fallbackLocale ${JSON.stringify(requested)}): forced to false, args unchanged`, async () => {
      const req = fakeReq({ payloadAPI: "local", fallbackLocale: requested });
      const args = { where: { slug: { equals: "fixture-test-unit-slug" } }, locale: "id" };
      const result = await runHook(req, args);
      assert.equal(req.fallbackLocale, false);
      assert.equal(result, args, "the same args object is returned");
      assert.deepEqual(args, { where: { slug: { equals: "fixture-test-unit-slug" } }, locale: "id" });
    });
  }

  test("anonymous REST: forced to false as well", async () => {
    const req = fakeReq({ payloadAPI: "REST", fallbackLocale: "en" });
    await runHook(req, {});
    assert.equal(req.fallbackLocale, false);
  });

  for (const role of ["admin", "editor"]) {
    test(`staff (${role}): requested fallback kept`, async () => {
      const req = fakeReq({ user: fakeUser(role, 5), payloadAPI: "REST", fallbackLocale: "en" });
      const args = { locale: "id" };
      const result = await runHook(req, args);
      assert.equal(req.fallbackLocale, "en");
      assert.equal(result, args);
    });
  }
});
