import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { ANONYMOUS, evaluateFileAccess, requiredLevel, type Principal } from "../../lib/access/evaluator";
import type { AccessLevel } from "../../lib/publications/file-access";

/**
 * Access evaluator of publication files (M5-03, DECISIONS §2.18 decisions
 * 11, 12 and 14b; ACCESS-POLICY §6–§7; SRS §12.1 columns Visitor,
 * Registered, Editor, Admin). Pure functions, no env, no I/O. Staff have no
 * principal of their own: the route never reads the Payload cookie, so a
 * staff session is `anonymous` (DEC-009); EV3 checks that row through that
 * principal.
 */
const LEVELS: AccessLevel[] = ["public", "registered", "subscriber"];
const VERIFIED: Principal = { kind: "public_user", emailVerified: true };
const UNVERIFIED: Principal = { kind: "public_user", emailVerified: false };

function file(overrides: Record<string, unknown> = {}) {
  return { status: "ready", mimeType: "application/pdf", accessLevel: "public", ...overrides };
}

describe("lib/access/evaluator.ts requiredLevel", () => {
  test("EV1 level of a ready PDF = the stricter of publication and file; registered only with accounts on; subscriber and unknown never (3×3×2)", () => {
    const expected = (stricter: AccessLevel, accountsEnabled: boolean) =>
      stricter === "public" ? "public" : stricter === "registered" && accountsEnabled ? "registered" : null;
    const rank: Record<AccessLevel, number> = { public: 0, registered: 1, subscriber: 2 };
    for (const accountsEnabled of [false, true]) {
      for (const publication of LEVELS) {
        for (const level of LEVELS) {
          const stricter = rank[level] > rank[publication] ? level : publication;
          assert.equal(
            requiredLevel(publication, file({ accessLevel: level }), { accountsEnabled }),
            expected(stricter, accountsEnabled),
            `accounts ${accountsEnabled ? "on" : "off"}, publication ${publication}, file ${level}`,
          );
        }
      }
    }
    assert.equal(requiredLevel("registered", file({ accessLevel: "public" }), { accountsEnabled: true }), "registered", "a looser file has no effect");
    assert.equal(requiredLevel("subscriber", file({ accessLevel: "public" }), { accountsEnabled: true }), null, "public file on a subscriber publication");
  });

  test("EV2 fail closed: unknown or missing level, not ready, not a PDF give null whatever the accounts", () => {
    for (const accountsEnabled of [false, true]) {
      for (const unknown of [undefined, null, "", "Public", "REGISTERED", "admin", 0, {}]) {
        assert.equal(requiredLevel(unknown, file(), { accountsEnabled }), null, `publication ${JSON.stringify(unknown)}`);
        assert.equal(requiredLevel("public", file({ accessLevel: unknown }), { accountsEnabled }), null, `file ${JSON.stringify(unknown)}`);
      }
      for (const status of ["pending", "failed", "quarantined", "archived", undefined, "READY"]) {
        assert.equal(requiredLevel("public", file({ status }), { accountsEnabled }), null, `status ${String(status)}`);
        assert.equal(requiredLevel("registered", file({ status, accessLevel: "registered" }), { accountsEnabled }), null, `registered, status ${String(status)}`);
      }
      for (const mimeType of ["application/octet-stream", "image/png", undefined, "application/PDF"]) {
        assert.equal(requiredLevel("public", file({ mimeType }), { accountsEnabled }), null, `mimeType ${String(mimeType)}`);
      }
    }
  });
});

describe("lib/access/evaluator.ts evaluateFileAccess", () => {
  test("EV3 SRS §12.1: public allows Visitor, Registered, Editor, Admin; registered allows only a verified public user; anonymous (also staff) must log in; unverified is unavailable", () => {
    for (const principal of [ANONYMOUS, VERIFIED, UNVERIFIED]) {
      assert.deepEqual(evaluateFileAccess("public", principal), { allowed: true, reason: "public_access" }, `public, ${JSON.stringify(principal)}`);
    }
    assert.deepEqual(evaluateFileAccess("registered", VERIFIED), { allowed: true, reason: "authenticated_access" });
    assert.deepEqual(
      evaluateFileAccess("registered", ANONYMOUS),
      { allowed: false, reason: "authentication_required", requiredAction: "login" },
      "Visitor, and Editor/Admin (staff session = anonymous, DEC-009)",
    );
    assert.deepEqual(evaluateFileAccess("registered", UNVERIFIED), { allowed: false, reason: "resource_unavailable" }, "unverified email");
  });

  test("EV4 malformed principals and levels are denied (no truthy shortcuts)", () => {
    const forged = [
      { kind: "public_user", emailVerified: "true" },
      { kind: "public_user", emailVerified: 1 },
      { kind: "public_user" },
      { kind: "staff_user", emailVerified: true },
      { kind: "subscriber", emailVerified: true },
    ] as unknown as Principal[];
    for (const principal of forged) {
      assert.equal(evaluateFileAccess("registered", principal).allowed, false, JSON.stringify(principal));
    }
    for (const level of ["subscriber", "", "REGISTERED", undefined] as unknown as ("public" | "registered")[]) {
      assert.deepEqual(evaluateFileAccess(level, VERIFIED), { allowed: false, reason: "resource_unavailable" }, `level ${String(level)}`);
    }
    assert.deepEqual(ANONYMOUS, { kind: "anonymous" });
  });
});
