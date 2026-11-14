import assert from "node:assert/strict";
import { describe, test } from "node:test";

import type { Payload } from "payload";

import { findDraftRef, staffFromHeaders, type StaffUser } from "../../lib/cms/staff-preview";
import {
  PREVIEW_EXIT_PATH,
  PREVIEW_PATH,
  exitTarget,
  parsePreviewId,
  previewTarget,
  previewUrl,
} from "../../lib/publications/preview";
import { Publications } from "../../payload/collections/Publications";
import { fakeUser } from "../helpers/fake-req";

/**
 * Staff draft preview helpers (M3-05, DECISIONS §2.11 P11 A, P14 A). No
 * database, no env: the Payload `auth` and `find` methods are fakes.
 */
type AuthArgs = { headers: Headers };

function fakeAuth(user: unknown): { payload: Pick<Payload, "auth">; calls: AuthArgs[] } {
  const calls: AuthArgs[] = [];
  const auth = async (args: AuthArgs) => {
    calls.push(args);
    return { permissions: {}, user };
  };
  return { payload: { auth } as unknown as Pick<Payload, "auth">, calls };
}

function recordingFind(docs: unknown[]): { payload: Pick<Payload, "find">; calls: Record<string, unknown>[] } {
  const calls: Record<string, unknown>[] = [];
  const find = async (args: Record<string, unknown>) => {
    calls.push(args);
    return { docs };
  };
  return { payload: { find } as unknown as Pick<Payload, "find">, calls };
}

describe("lib/publications/preview.ts", () => {
  test("PVU1 previewUrl: /api/preview?id=<id> for a positive integer id, else null (no Preview button)", () => {
    assert.equal(PREVIEW_PATH, "/api/preview");
    assert.equal(PREVIEW_EXIT_PATH, "/api/preview/exit");
    assert.equal(previewUrl({ id: 5 }), "/api/preview?id=5");
    assert.equal(previewUrl({ id: 2147483647 }), "/api/preview?id=2147483647");
    for (const id of [undefined, null, 0, -1, 1.5, "5", Number.NaN, 2147483648]) {
      assert.equal(previewUrl({ id }), null, `previewUrl({ id: ${String(id)} })`);
    }
    assert.equal(previewUrl({}), null);
  });

  test("PVU2 parsePreviewId: digits without a leading zero inside the integer range, else null", () => {
    assert.equal(parsePreviewId("1"), 1);
    assert.equal(parsePreviewId("42"), 42);
    assert.equal(parsePreviewId("2147483647"), 2147483647);
    for (const value of [null, undefined, "", "0", "01", "-1", "+1", "abc", "1.5", "1e3", " 1", "1 ", "0x10", "2147483648", "12345678901"]) {
      assert.equal(parsePreviewId(value), null, `parsePreviewId(${JSON.stringify(value)})`);
    }
  });

  test("PVU3 previewTarget: /{locale}/publications/{slug} of the stored record; bad locale or slug -> null", () => {
    assert.equal(previewTarget({ locale: "id", slug: "a-b-1" }), "/id/publications/a-b-1");
    assert.equal(previewTarget({ locale: "en", slug: "pub" }), "/en/publications/pub");
    const invalid = [
      { locale: "ID", slug: "pub" },
      { locale: "fr", slug: "pub" },
      { locale: "", slug: "pub" },
      { slug: "pub" },
      { locale: "id", slug: "Pub" },
      { locale: "id", slug: "../x" },
      { locale: "id", slug: "a/b" },
      { locale: "id", slug: "//evil.example" },
      { locale: "id", slug: "" },
      { locale: "id", slug: null },
      { locale: "id" },
      {},
    ];
    for (const doc of invalid) {
      assert.equal(previewTarget(doc), null, `previewTarget(${JSON.stringify(doc)})`);
    }
  });

  test("PVU4 exitTarget: the detail path of valid fields, else / (never an outside URL)", () => {
    assert.equal(exitTarget("id", "pub"), "/id/publications/pub");
    assert.equal(exitTarget("en", "pub-en"), "/en/publications/pub-en");
    for (const [locale, slug] of [
      ["", ""],
      ["xx", "pub"],
      ["id", ""],
      ["id", "https://evil.example"],
      ["id", "//evil.example"],
      ["id", "../../admin"],
      ["https://evil.example", "pub"],
    ]) {
      assert.equal(exitTarget(locale as string, slug as string), "/", `exitTarget(${locale}, ${slug})`);
    }
  });
});

describe("lib/cms/staff-preview.ts", () => {
  test("PVU5 staffFromHeaders: Editor or Admin of the users collection -> the user; no user, unknown role, other collection -> null", async () => {
    const headers = new Headers({ Cookie: "payload-token=fake" });
    for (const role of ["editor", "admin"]) {
      const user = fakeUser(role, 3);
      const auth = fakeAuth(user);
      assert.equal(await staffFromHeaders(auth.payload, headers), user, `${role} session`);
      assert.equal(auth.calls.length, 1);
      assert.equal(auth.calls[0]?.headers, headers, "the request headers are passed to payload.auth");
    }
    for (const user of [null, undefined, fakeUser("superuser", 3), fakeUser("", 3), fakeUser("editor", 3, "members")]) {
      assert.equal(await staffFromHeaders(fakeAuth(user).payload, headers), null, `user ${JSON.stringify(user)}`);
    }
  });

  test("PVU7 findDraftRef: latest version by id as the staff user, access control on, slug and locale only", async () => {
    const staff = fakeUser("editor", 3) as unknown as StaffUser;
    const found = recordingFind([{ id: 9, slug: "pub", locale: "id" }]);
    assert.deepEqual(await findDraftRef(found.payload, 9, staff), { id: 9, slug: "pub", locale: "id" });
    const [args] = found.calls;
    assert.ok(args);
    assert.equal(args.collection, "publications");
    assert.deepEqual(args.where, { id: { equals: 9 } });
    assert.equal(args.draft, true);
    assert.equal(args.user, staff);
    assert.equal(args.overrideAccess, false);
    assert.equal(args.depth, 0);
    assert.equal(args.limit, 1);
    assert.deepEqual(args.select, { slug: true, locale: true });
    assert.equal(await findDraftRef(recordingFind([]).payload, 10, staff), null);
  });
});

describe("payload/collections/Publications.ts", () => {
  test("PVU6 admin.preview gives previewUrl of the document (config only)", async () => {
    const preview = Publications.admin?.preview;
    assert.equal(typeof preview, "function", "admin.preview is set");
    const call = (doc: Record<string, unknown>) =>
      (preview as (doc: Record<string, unknown>, options: unknown) => unknown)(doc, { locale: "id", req: {}, token: null });
    assert.equal(await call({ id: 12, slug: "pub", locale: "id" }), "/api/preview?id=12");
    assert.equal(await call({}), null);
  });
});
