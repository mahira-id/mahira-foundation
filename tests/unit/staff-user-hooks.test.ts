import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { APIError, ValidationError } from "payload";

import { firstUserIsAdmin } from "../../payload/hooks/first-user-is-admin";
import { keepOneAdminOnDelete, keepOneAdminOnRoleChange } from "../../payload/hooks/keep-one-admin";
import { fakeReq, fakeUser } from "../helpers/fake-req";

// DEC-016: at least one Admin remains; Owner 2026-11-10 P5 A: the first user
// of an empty database is Admin. These breaks run only here, without a
// database (Owner 2026-11-11, P2 A): the DB tests never weaken these guards.
const MESSAGE = "Harus ada minimal satu Admin";

type MemoryUser = { id: number; role: string };
type Where = { and?: Where[]; role?: { equals?: unknown }; id?: { not_in?: unknown[] } };

function matches(user: MemoryUser, where: Where | undefined): boolean {
  if (!where) return true;
  for (const key of Object.keys(where)) {
    // Unknown query shapes fail loudly, so a changed hook query cannot pass
    // against a fake that silently ignores it.
    if (!["and", "role", "id"].includes(key)) throw new Error(`fake payload: unsupported where key ${key}`);
  }
  if (where.and && !where.and.every((part) => matches(user, part))) return false;
  if (where.role) {
    if (Object.keys(where.role).some((op) => op !== "equals")) throw new Error("fake payload: unsupported role operator");
    if (user.role !== where.role.equals) return false;
  }
  if (where.id) {
    if (Object.keys(where.id).some((op) => op !== "not_in")) throw new Error("fake payload: unsupported id operator");
    if ((where.id.not_in ?? []).map(String).includes(String(user.id))) return false;
  }
  return true;
}

/** In-memory `users` collection behind the two Local API calls the hooks use. */
function fakePayload(users: MemoryUser[]) {
  return {
    count: async ({ collection, where }: { collection: string; where?: Where }) => {
      assert.equal(collection, "users");
      return { totalDocs: users.filter((user) => matches(user, where)).length };
    },
    findByID: async ({ collection, id }: { collection: string; id: number | string }) => {
      assert.equal(collection, "users");
      return users.find((user) => String(user.id) === String(id)) ?? null;
    },
  };
}

function reqWith(users: MemoryUser[], context: Record<string, unknown> = {}) {
  return fakeReq({ user: fakeUser("admin", 100), payloadAPI: "REST", payload: fakePayload(users), context });
}

type RoleHook = typeof keepOneAdminOnRoleChange;
type DeleteHook = typeof keepOneAdminOnDelete;

function roleChange(
  users: MemoryUser[],
  data: Record<string, unknown>,
  originalDoc: MemoryUser | undefined,
  operation: "create" | "update" = "update",
) {
  return keepOneAdminOnRoleChange({
    data,
    originalDoc,
    operation,
    req: reqWith(users),
    context: {},
    collection: {},
  } as unknown as Parameters<RoleHook>[0]);
}

function remove(id: number, req: ReturnType<typeof reqWith>) {
  return keepOneAdminOnDelete({ id, req, context: req.context, collection: {} } as unknown as Parameters<DeleteHook>[0]);
}

async function captureError(action: () => Promise<unknown>): Promise<unknown> {
  try {
    await action();
  } catch (error) {
    return error;
  }
  return undefined;
}

describe("payload/hooks/keep-one-admin.ts — keepOneAdminOnRoleChange", () => {
  test("demoting the last Admin: ValidationError on path role with the guard message", async () => {
    const users = [{ id: 1, role: "admin" }, { id: 2, role: "editor" }];
    const error = await captureError(() => roleChange(users, { role: "editor" }, users[0]));
    assert.equal(error instanceof ValidationError, true, "must throw ValidationError");
    const errors = (error as ValidationError).data.errors;
    assert.equal(errors[0]?.path, "role");
    assert.equal(errors[0]?.message.includes(MESSAGE), true, "message must name the last-Admin rule");
  });

  test("demoting an Admin while another Admin remains: allowed", async () => {
    const users = [{ id: 1, role: "admin" }, { id: 3, role: "admin" }];
    const data = { role: "editor" };
    assert.equal(await roleChange(users, data, users[0]), data);
  });

  test("non-admin original, no role in data, role stays admin, create: data returned", async () => {
    const users = [{ id: 1, role: "admin" }, { id: 2, role: "editor" }];
    const editorData = { role: "admin" };
    assert.equal(await roleChange(users, editorData, users[1]), editorData);
    const noRole = { email: "fixture-test-unit-1@example.invalid" };
    assert.equal(await roleChange(users, noRole, users[0]), noRole);
    const stillAdmin = { role: "admin" };
    assert.equal(await roleChange(users, stillAdmin, users[0]), stillAdmin);
    const created = { role: "editor" };
    assert.equal(await roleChange(users, created, undefined, "create"), created);
  });
});

describe("payload/hooks/keep-one-admin.ts — keepOneAdminOnDelete", () => {
  test("deleting the last Admin: APIError 400 with the guard message", async () => {
    const users = [{ id: 1, role: "admin" }, { id: 2, role: "editor" }];
    const error = await captureError(() => remove(1, reqWith(users)));
    assert.equal(error instanceof APIError, true, "must throw APIError");
    assert.equal((error as APIError).status, 400);
    assert.equal((error as APIError).message.includes(MESSAGE), true);
  });

  test("deleting an Editor: allowed", async () => {
    const users = [{ id: 1, role: "admin" }, { id: 2, role: "editor" }];
    assert.equal(await captureError(() => remove(2, reqWith(users))), undefined);
  });

  test("deleting an Admin while another Admin remains: allowed", async () => {
    const users = [{ id: 1, role: "admin" }, { id: 3, role: "admin" }];
    assert.equal(await captureError(() => remove(3, reqWith(users))), undefined);
  });

  test("bulk: two deletes in one request with exactly two Admins, the second is refused", async () => {
    // The fake does not remove users, like concurrent hooks inside one
    // transaction that cannot see each other's deletes; only req.context can.
    const users = [{ id: 1, role: "admin" }, { id: 3, role: "admin" }, { id: 2, role: "editor" }];
    const req = reqWith(users);
    assert.equal(await captureError(() => remove(1, req)), undefined, "first delete passes");
    const error = await captureError(() => remove(3, req));
    assert.equal(error instanceof APIError, true, "second delete must be refused");
    assert.equal((error as APIError).status, 400);
  });

  test("separate requests do not share pending removals", async () => {
    const users = [{ id: 1, role: "admin" }, { id: 3, role: "admin" }];
    assert.equal(await captureError(() => remove(1, reqWith(users))), undefined);
    assert.equal(await captureError(() => remove(3, reqWith(users))), undefined);
  });
});

describe("payload/hooks/first-user-is-admin.ts — firstUserIsAdmin", () => {
  type Hook = typeof firstUserIsAdmin;
  function run(users: MemoryUser[], data: Record<string, unknown>, operation: "create" | "update") {
    return firstUserIsAdmin({
      data,
      operation,
      req: reqWith(users),
      context: {},
      collection: {},
    } as unknown as Parameters<Hook>[0]);
  }

  test("create with 0 users: role admin", async () => {
    const result = (await run([], { role: "editor" }, "create")) as Record<string, unknown>;
    assert.equal(result.role, "admin");
  });

  test("create with 1 user: submitted role kept", async () => {
    const data = { role: "editor" };
    assert.equal(await run([{ id: 1, role: "admin" }], data, "create"), data);
  });

  test("update: data unchanged, even with 0 users", async () => {
    const data = { role: "editor" };
    assert.equal(await run([], data, "update"), data);
  });
});
