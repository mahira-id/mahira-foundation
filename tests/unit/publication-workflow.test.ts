import assert from "node:assert/strict";
import { describe, test } from "node:test";
import type { FieldAccess, FieldHook, PayloadRequest } from "payload";

import { PUBLIC_PUBLICATION_READ } from "../../payload/access/public-read";
import { Publications } from "../../payload/collections/Publications";
import { readLiveOnSite } from "../../payload/hooks/live-on-site";
import { fakeReq, fakeUser } from "../helpers/fake-req";

// M3-03 minimum editorial workflow (DEC-015, DECISIONS §2.6), without a
// database: the staff-only virtual column "Tayang di situs" (P4 B) and its
// list configuration. The DB behaviour is covered by
// tests/integration/workflow.test.ts (W1–W13).
type FindOneCall = { collection: string; where: unknown; select: unknown; req: unknown };

/** Fake `payload.db.findOne` that records its calls and returns `result`. */
function fakeDb(result: unknown) {
  const calls: FindOneCall[] = [];
  const payload = {
    db: {
      findOne: async (args: FindOneCall) => {
        calls.push(args);
        return result;
      },
    },
  };
  return { calls, payload };
}

function runLiveOnSite(req: PayloadRequest, data: Record<string, unknown>, overrideAccess = false) {
  return readLiveOnSite({ data, overrideAccess, req, value: undefined } as unknown as Parameters<FieldHook>[0]);
}

function fieldNamed(name: string): Record<string, unknown> {
  const field = Publications.fields.find((candidate) => "name" in candidate && candidate.name === name);
  assert.ok(field, `${name} field must exist`);
  return field as unknown as Record<string, unknown>;
}

function runField(access: FieldAccess | undefined, req: PayloadRequest): unknown {
  assert.equal(typeof access, "function", "field access function must be defined");
  return (access as FieldAccess)({ req } as Parameters<FieldAccess>[0]);
}

describe("payload/hooks/live-on-site.ts — readLiveOnSite", () => {
  test("L1 anonymous Local API (overrideAccess false): undefined, no query", async () => {
    const { calls, payload } = fakeDb({ id: 7 });
    const result = await runLiveOnSite(fakeReq({ payloadAPI: "local", payload }), { id: 7, _status: "published" });
    assert.equal(result, undefined);
    assert.equal(calls.length, 0, "no query for a caller without staff access");
  });

  test("L2 editor, main record matches the public read filter: yes, one query with id + PUBLIC_PUBLICATION_READ", async () => {
    const { calls, payload } = fakeDb({ id: 7 });
    const req = fakeReq({ user: fakeUser("editor", 2), payload });
    assert.equal(await runLiveOnSite(req, { id: 7, _status: "draft" }), "yes");
    assert.equal(calls.length, 1);
    assert.equal(calls[0]?.collection, "publications");
    assert.deepEqual(calls[0]?.where, { and: [{ id: { equals: 7 } }, PUBLIC_PUBLICATION_READ] });
    assert.equal(calls[0]?.req, req, "query runs on the same req (transaction)");
  });

  test("L2 editor, no matching main record: no, even when the read version says published", async () => {
    const { calls, payload } = fakeDb(null);
    assert.equal(await runLiveOnSite(fakeReq({ user: fakeUser("editor", 2), payload }), { id: 7, _status: "published" }), "no");
    assert.equal(calls.length, 1);
  });

  test("L3 overrideAccess true without a user: computed", async () => {
    const { calls, payload } = fakeDb({ id: 9 });
    assert.equal(await runLiveOnSite(fakeReq({ payloadAPI: "local", payload }), { id: 9 }, true), "yes");
    assert.equal(calls.length, 1);
  });

  test("L4 doc without id: no, no query", async () => {
    const { calls, payload } = fakeDb({ id: 1 });
    assert.equal(await runLiveOnSite(fakeReq({ user: fakeUser("admin", 1), payload }), { _status: "published" }), "no");
    assert.equal(calls.length, 0);
  });
});

describe("Publications config — liveOnSite and list columns (DECISIONS §2.6 P4 B)", () => {
  test("liveOnSite is a virtual select, not filterable in the list", () => {
    const field = fieldNamed("liveOnSite");
    assert.equal(field.virtual, true, "must be virtual: no column, no migration");
    assert.equal(field.type, "select");
    assert.equal((field.admin as { disableListFilter?: boolean } | undefined)?.disableListFilter, true);
  });

  test("liveOnSite access: never written, read by staff only", () => {
    const access = fieldNamed("liveOnSite").access as { read?: FieldAccess; create?: FieldAccess; update?: FieldAccess } | undefined;
    const admin = fakeReq({ user: fakeUser("admin", 1) });
    assert.equal(runField(access?.create, admin), false);
    assert.equal(runField(access?.update, admin), false);
    assert.equal(runField(access?.read, fakeReq({ user: fakeUser("editor", 2) })), true);
    assert.equal(runField(access?.read, fakeReq({ payloadAPI: "local" })), false);
  });

  test("defaultColumns: title, locale, Status, Tayang di situs, everPublished, publishedAt, updatedAt", () => {
    assert.deepEqual(Publications.admin?.defaultColumns, [
      "title",
      "locale",
      "_status",
      "liveOnSite",
      "everPublished",
      "publishedAt",
      "updatedAt",
    ]);
  });
});
