import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { ValidationError } from "payload";
import type { CollectionBeforeChangeHook, CollectionBeforeOperationHook, FieldAccess, FieldHook, PayloadRequest } from "payload";

import { PUBLIC_PUBLICATION_READ } from "../../payload/access/public-read";
import { Publications } from "../../payload/collections/Publications";
import { enforceSharedFields } from "../../payload/hooks/enforce-shared-fields";
import { readLiveOnSite } from "../../payload/hooks/live-on-site";
import { setPublicationLifecycleFields } from "../../payload/hooks/publication-lifecycle";
import {
  markStatusNotSent,
  PENDING_DRAFT_MESSAGE,
  refuseImplicitStatusOverPendingDraft,
  STATUS_NOT_SENT,
} from "../../payload/hooks/refuse-implicit-status-over-pending-draft";
import { fakeReq, fakeUser } from "../helpers/fake-req";

// M3-03 minimum editorial workflow (DEC-015, DECISIONS Â§2.6), without a
// database: the staff-only virtual column "Tayang di situs" (P4 B), its list
// configuration, and the refusal of a save without _status over a pending
// draft (P5 A). The DB behaviour is covered by
// tests/integration/workflow.test.ts (W1â€“W13).
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

describe("payload/hooks/live-on-site.ts â€” readLiveOnSite", () => {
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

describe("Publications config â€” liveOnSite and list columns (DECISIONS Â§2.6 P4 B)", () => {
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

describe("payload/hooks/refuse-implicit-status-over-pending-draft.ts (DECISIONS §2.6 P5 A)", () => {
  type P5Options = {
    operation?: "create" | "update";
    /** What the client sends (operation args.data). */
    sent?: Record<string, unknown>;
    draft?: boolean;
    /** The latest version Payload loads as originalDoc. */
    originalDoc?: Record<string, unknown>;
    context?: Record<string, unknown>;
  };

  /** db.findOne stub: `record` is the main-table row; "never" fails the test when it is called. */
  function p5Db(record: Record<string, unknown> | null | "never") {
    const calls: FindOneCall[] = [];
    const payload = {
      db: {
        findOne: async (args: FindOneCall) => {
          if (record === "never") throw new Error("db.findOne must not be called here");
          calls.push(args);
          return record;
        },
      },
    };
    return { calls, payload };
  }

  function mark(operation: string, args: Record<string, unknown>, context: Record<string, unknown>) {
    return markStatusNotSent({ args, context, operation, collection: {}, req: {} } as unknown as Parameters<CollectionBeforeOperationHook>[0]);
  }

  /**
   * Runs both halves as Payload 3.93.0 does: beforeOperation sees the raw
   * arguments; before beforeChange, field beforeValidate fills every field
   * that was not sent from originalDoc (so `_status` is always present there),
   * and a draft save sets `_status: draft`.
   */
  function runP5(options: P5Options, payload: unknown) {
    const operation = options.operation ?? "update";
    const sent = options.sent ?? {};
    const req = fakeReq({ user: fakeUser("editor", 2), payload, context: options.context ?? {} });
    mark(operation, { data: sent, draft: options.draft, req }, req.context);
    const data: Record<string, unknown> = { ...(options.originalDoc ?? {}), ...sent };
    if (options.draft && sent._status !== "published") data._status = "draft";
    const result = refuseImplicitStatusOverPendingDraft({
      data,
      operation,
      originalDoc: operation === "update" ? options.originalDoc : undefined,
      req,
      context: req.context,
      collection: {},
    } as unknown as Parameters<CollectionBeforeChangeHook>[0]);
    return { data, req, result };
  }

  async function captureError(action: () => Promise<unknown>): Promise<unknown> {
    try {
      await action();
    } catch (error) {
      return error;
    }
    return undefined;
  }

  function assertRefusal(error: unknown) {
    assert.equal(error instanceof ValidationError, true, "must throw ValidationError");
    const validation = error as ValidationError;
    assert.equal(validation.status, 400);
    assert.equal(validation.data.errors[0]?.path, "_status");
    assert.equal(validation.data.errors[0]?.message, PENDING_DRAFT_MESSAGE);
  }

  const PENDING = { id: 7, title: "draft title", _status: "draft" } as const;

  test("M1 markStatusNotSent: an update without _status and without draft is marked", () => {
    const context: Record<string, unknown> = {};
    mark("update", { data: { title: "x" } }, context);
    assert.equal(context[STATUS_NOT_SENT], true);
  });

  test("M2 markStatusNotSent: _status sent, draft save, version restore are not marked; reads leave the mark alone", () => {
    for (const [label, operation, args] of [
      ["_status published", "update", { data: { _status: "published" } }],
      ["_status draft (Unpublish)", "update", { data: { _status: "draft" } }],
      ["draft save", "update", { data: { title: "x" }, draft: true }],
      ["restoreVersion", "restoreVersion", { id: 7 }],
    ] as const) {
      const context: Record<string, unknown> = { [STATUS_NOT_SENT]: true };
      mark(operation, args, context);
      assert.equal(context[STATUS_NOT_SENT], false, label);
    }
    const context: Record<string, unknown> = { [STATUS_NOT_SENT]: true };
    mark("read", { where: {} }, context);
    assert.equal(context[STATUS_NOT_SENT], true, "a nested read must not clear the mark");
  });

  test("U1 create: passes, no query", async () => {
    const { payload } = p5Db("never");
    const { data, result } = runP5({ operation: "create", sent: { title: "x" } }, payload);
    assert.equal(await result, data);
  });

  test("U2 Publish over a pending draft (_status published sent): passes, no query", async () => {
    const { payload } = p5Db("never");
    const { data, result } = runP5({ sent: { _status: "published" }, originalDoc: PENDING }, payload);
    assert.equal(await result, data);
  });

  test("U3 Save Draft and Unpublish over a pending draft: pass, no query", async () => {
    const { payload } = p5Db("never");
    const draftSave = runP5({ sent: { title: "x" }, draft: true, originalDoc: PENDING }, payload);
    assert.equal(await draftSave.result, draftSave.data);
    const unpublish = runP5({ sent: { _status: "draft" }, originalDoc: PENDING }, payload);
    assert.equal(await unpublish.result, unpublish.data);
  });

  test("U4 no _status, latest version published (no pending draft): passes, no query", async () => {
    const { payload } = p5Db("never");
    const { data, result } = runP5({ sent: { title: "x" }, originalDoc: { id: 7, _status: "published" } }, payload);
    assert.equal(await result, data);
  });

  test("U5 no _status, latest version draft, record draft (never published or unpublished): passes after one query", async () => {
    const { calls, payload } = p5Db({ id: 7, _status: "draft" });
    const { data, req, result } = runP5({ sent: { title: "x" }, originalDoc: PENDING }, payload);
    assert.equal(await result, data);
    assert.equal(calls.length, 1);
    assert.equal(calls[0]?.collection, "publications");
    assert.deepEqual(calls[0]?.where, { id: { equals: 7 } });
    assert.equal(calls[0]?.req, req, "query runs on the same req (transaction)");
  });

  test("U6 no _status, latest version draft, record published: ValidationError 400 on _status", async () => {
    const { payload } = p5Db({ id: 7, _status: "published" });
    assertRefusal(await captureError(() => runP5({ sent: { title: "x" }, originalDoc: PENDING }, payload).result));
  });

  test("U7 same as U6 with context.sharedFieldSync: still refused", async () => {
    const { payload } = p5Db({ id: 7, _status: "published" });
    assertRefusal(
      await captureError(
        () => runP5({ sent: { accessLevel: "registered" }, originalDoc: PENDING, context: { sharedFieldSync: true } }, payload).result,
      ),
    );
  });

  test("Publications hooks: beforeOperation marks; beforeChange P5 refusal, lifecycle fields, shared fields, in that order", () => {
    assert.deepEqual(Publications.hooks?.beforeOperation, [markStatusNotSent]);
    assert.deepEqual(Publications.hooks?.beforeChange, [
      refuseImplicitStatusOverPendingDraft,
      setPublicationLifecycleFields,
      enforceSharedFields,
    ]);
  });
});

