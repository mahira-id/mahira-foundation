import assert from "node:assert/strict";
import { describe, test } from "node:test";
import type { Access, CollectionConfig, FieldAccess, PayloadRequest } from "payload";

import {
  isAdmin,
  isAdminField,
  isAdminOrSelf,
  isAnonymousLocalRead,
  isStaff,
  isStaffField,
  isStaffOrAnonymousLocalRead,
  staffRoleOf,
} from "../../payload/access/roles";
import { Publications } from "../../payload/collections/Publications";
import { PublicationTypes } from "../../payload/collections/PublicationTypes";
import { Topics } from "../../payload/collections/Topics";
import { TranslationGroups } from "../../payload/collections/TranslationGroups";
import { Users } from "../../payload/collections/Users";
import { fakeReq, fakeUser } from "../helpers/fake-req";

// DEC-009 / DEC-016 roles and the collection access rules built on them
// (ACCESS-POLICY §6). Covers the same rules as the DB checks E1–E11, A1.*,
// L1–L3 without a database.
const admin = () => fakeReq({ user: fakeUser("admin", 1) });
const editor = () => fakeReq({ user: fakeUser("editor", 2) });
const anonymousRest = () => fakeReq({ payloadAPI: "REST" });
const anonymousLocal = () => fakeReq({ payloadAPI: "local" });

async function run(access: Access | undefined, req: PayloadRequest): Promise<unknown> {
  assert.equal(typeof access, "function", "access function must be defined");
  return (access as Access)({ req } as Parameters<Access>[0]);
}

function runField(access: FieldAccess | undefined, req: PayloadRequest): unknown {
  assert.equal(typeof access, "function", "field access function must be defined");
  return (access as FieldAccess)({ req } as Parameters<FieldAccess>[0]);
}

function accessOf(collection: CollectionConfig, operation: "read" | "create" | "update" | "delete" | "unlock"): Access | undefined {
  return collection.access?.[operation] as Access | undefined;
}

describe("payload/access/roles.ts", () => {
  test("staffRoleOf: admin, editor, unknown role, no user, other collection", () => {
    assert.equal(staffRoleOf(admin()), "admin");
    assert.equal(staffRoleOf(editor()), "editor");
    assert.equal(staffRoleOf(fakeReq({ user: fakeUser("superuser", 3) })), null);
    assert.equal(staffRoleOf(fakeReq({ user: null })), null);
    assert.equal(staffRoleOf(fakeReq({ user: fakeUser("admin", 4, "members") })), null);
  });

  test("isAdmin / isStaff / isAdminField", async () => {
    assert.equal(await run(isAdmin, admin()), true);
    assert.equal(await run(isAdmin, editor()), false);
    assert.equal(await run(isAdmin, anonymousLocal()), false);
    assert.equal(await run(isStaff, admin()), true);
    assert.equal(await run(isStaff, editor()), true);
    assert.equal(await run(isStaff, anonymousLocal()), false);
    assert.equal(runField(isAdminField, admin()), true);
    assert.equal(runField(isAdminField, editor()), false);
    assert.equal(runField(isAdminField, anonymousRest()), false);
  });

  test("isStaffField: admin and editor, never anonymous Local API or REST", () => {
    assert.equal(runField(isStaffField, admin()), true);
    assert.equal(runField(isStaffField, editor()), true);
    assert.equal(runField(isStaffField, anonymousLocal()), false);
    assert.equal(runField(isStaffField, anonymousRest()), false);
  });

  test("isAnonymousLocalRead: only no user + Local API", () => {
    assert.equal(isAnonymousLocalRead(anonymousLocal()), true);
    assert.equal(isAnonymousLocalRead(anonymousRest()), false);
    assert.equal(isAnonymousLocalRead(fakeReq({ payloadAPI: "GraphQL" })), false);
    assert.equal(isAnonymousLocalRead(fakeReq({ payloadAPI: "local", user: fakeUser("editor", 2) })), false);
  });

  test("isStaffOrAnonymousLocalRead: staff or anonymous Local API, never anonymous REST/GraphQL", async () => {
    assert.equal(await run(isStaffOrAnonymousLocalRead, admin()), true);
    assert.equal(await run(isStaffOrAnonymousLocalRead, editor()), true);
    assert.equal(await run(isStaffOrAnonymousLocalRead, anonymousLocal()), true);
    assert.equal(await run(isStaffOrAnonymousLocalRead, anonymousRest()), false);
    assert.equal(await run(isStaffOrAnonymousLocalRead, fakeReq({ payloadAPI: "GraphQL" })), false);
  });

  test("isAdminOrSelf: admin all, editor own id, anonymous nothing", async () => {
    assert.equal(await run(isAdminOrSelf, admin()), true);
    assert.deepEqual(await run(isAdminOrSelf, editor()), { id: { equals: 2 } });
    assert.equal(await run(isAdminOrSelf, anonymousLocal()), false);
    assert.equal(await run(isAdminOrSelf, anonymousRest()), false);
  });
});

describe("collection access", () => {
  test("Publications.read: staff all, anonymous Local API published+public, anonymous REST denied", async () => {
    const read = accessOf(Publications, "read");
    assert.equal(await run(read, admin()), true);
    assert.equal(await run(read, editor()), true);
    assert.deepEqual(await run(read, anonymousLocal()), {
      and: [{ _status: { equals: "published" } }, { accessLevel: { equals: "public" } }],
    });
    assert.equal(await run(read, anonymousRest()), false);
    assert.equal(await run(read, fakeReq({ payloadAPI: "GraphQL" })), false);
  });

  test("Publications.create/update/readVersions: staff only", async () => {
    for (const operation of ["create", "update"] as const) {
      assert.equal(await run(accessOf(Publications, operation), editor()), true, `${operation} editor`);
      assert.equal(await run(accessOf(Publications, operation), anonymousLocal()), false, `${operation} anonymous`);
    }
    const readVersions = Publications.access?.readVersions as Access | undefined;
    assert.equal(await run(readVersions, editor()), true);
    assert.equal(await run(readVersions, anonymousLocal()), false);
  });

  test("Publications.delete: admin all, editor only never-published, anonymous denied (DEC-016)", async () => {
    const remove = accessOf(Publications, "delete");
    assert.equal(await run(remove, admin()), true);
    assert.deepEqual(await run(remove, editor()), { everPublished: { equals: false } });
    assert.equal(await run(remove, anonymousLocal()), false);
    assert.equal(await run(remove, anonymousRest()), false);
  });

  test("Publications field everPublished: clients can never write it", () => {
    const field = Publications.fields.find((candidate) => "name" in candidate && candidate.name === "everPublished");
    assert.ok(field, "everPublished field must exist");
    const fieldAccess = (field as { access?: { create?: FieldAccess; update?: FieldAccess } }).access;
    assert.equal(runField(fieldAccess?.create, admin()), false);
    assert.equal(runField(fieldAccess?.update, admin()), false);
    assert.equal(runField(fieldAccess?.update, editor()), false);
  });

  test("Users create/delete/unlock: admin only", async () => {
    for (const operation of ["create", "delete", "unlock"] as const) {
      const access = accessOf(Users, operation);
      assert.equal(await run(access, admin()), true, `${operation} admin`);
      assert.equal(await run(access, editor()), false, `${operation} editor`);
      assert.equal(await run(access, anonymousLocal()), false, `${operation} anonymous local`);
      assert.equal(await run(access, anonymousRest()), false, `${operation} anonymous REST`);
    }
  });

  test("Users read/update: admin all, editor own user only", async () => {
    for (const operation of ["read", "update"] as const) {
      const access = accessOf(Users, operation);
      assert.equal(await run(access, admin()), true, `${operation} admin`);
      assert.deepEqual(await run(access, editor()), { id: { equals: 2 } }, `${operation} editor`);
      assert.equal(await run(access, anonymousLocal()), false, `${operation} anonymous`);
    }
  });

  test("Users field role: only Admin may set or change it", () => {
    const field = Users.fields.find((candidate) => "name" in candidate && candidate.name === "role");
    assert.ok(field, "role field must exist");
    const fieldAccess = (field as { access?: { create?: FieldAccess; update?: FieldAccess } }).access;
    assert.equal(runField(fieldAccess?.create, admin()), true);
    assert.equal(runField(fieldAccess?.update, admin()), true);
    assert.equal(runField(fieldAccess?.create, editor()), false);
    assert.equal(runField(fieldAccess?.update, editor()), false);
  });

  for (const collection of [Topics, PublicationTypes]) {
    test(`${collection.slug} create/update/delete: admin only (taxonomy, DEC-016)`, async () => {
      for (const operation of ["create", "update", "delete"] as const) {
        const access = accessOf(collection, operation);
        assert.equal(await run(access, admin()), true, `${collection.slug} ${operation} admin`);
        assert.equal(await run(access, editor()), false, `${collection.slug} ${operation} editor`);
        assert.equal(await run(access, anonymousLocal()), false, `${collection.slug} ${operation} anonymous`);
      }
    });

    test(`${collection.slug} read: staff or anonymous Local API, anonymous REST denied`, async () => {
      const read = accessOf(collection, "read");
      assert.equal(await run(read, editor()), true);
      assert.equal(await run(read, anonymousLocal()), true);
      assert.equal(await run(read, anonymousRest()), false);
    });
  }

  test("translation-groups: staff read/create/update, delete admin only", async () => {
    for (const operation of ["read", "create", "update"] as const) {
      assert.equal(await run(accessOf(TranslationGroups, operation), editor()), true, `${operation} editor`);
      assert.equal(await run(accessOf(TranslationGroups, operation), anonymousLocal()), false, `${operation} anonymous local`);
    }
    const remove = accessOf(TranslationGroups, "delete");
    assert.equal(await run(remove, admin()), true);
    assert.equal(await run(remove, editor()), false);
    assert.equal(await run(remove, anonymousRest()), false);
  });
});
