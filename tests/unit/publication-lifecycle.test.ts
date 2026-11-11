import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { setPublicationLifecycleFields } from "../../payload/hooks/publication-lifecycle";
import { fakeReq } from "../helpers/fake-req";

// everPublished never turns false again (DEC-016); publishedAt is filled when
// a published save has no date, also when the save clears it (Owner
// 2026-11-10, P3 B (i)). DB counterparts: access LC1–LC5, guards P0–P5.
type Hook = typeof setPublicationLifecycleFields;
type Result = { everPublished?: unknown; publishedAt?: unknown; [key: string]: unknown };

const STORED_DATE = "2026-01-02T03:04:05.000Z";
const EXPLICIT_DATE = "2026-05-06T07:08:09.000Z";

async function runHook(
  data: Record<string, unknown>,
  originalDoc?: Record<string, unknown>,
  operation: "create" | "update" = originalDoc ? "update" : "create",
): Promise<Result> {
  const args = { data, originalDoc, operation, req: fakeReq(), context: {}, collection: {} } as unknown as Parameters<Hook>[0];
  return (await setPublicationLifecycleFields(args)) as Result;
}

function assertNow(value: unknown, before: number, after: number): void {
  assert.equal(typeof value, "string", "publishedAt must be an ISO string");
  const time = Date.parse(value as string);
  assert.equal(new Date(time).toISOString(), value, "publishedAt must be ISO 8601 UTC");
  assert.equal(time >= before && time <= after, true, "publishedAt must be the time of the save");
}

describe("payload/hooks/publication-lifecycle.ts — setPublicationLifecycleFields", () => {
  test("published create without publishedAt: filled with now, everPublished true", async () => {
    const before = Date.now();
    const result = await runHook({ _status: "published", title: "[FIXTURE] test unit" });
    assertNow(result.publishedAt, before, Date.now());
    assert.equal(result.everPublished, true);
    assert.equal(result.title, "[FIXTURE] test unit", "other fields pass through");
  });

  test("published create with an explicit date: date kept", async () => {
    const result = await runHook({ _status: "published", publishedAt: EXPLICIT_DATE });
    assert.equal(result.publishedAt, EXPLICIT_DATE);
    assert.equal(result.everPublished, true);
  });

  test("draft create: no date, everPublished false", async () => {
    const result = await runHook({ _status: "draft" });
    assert.equal(result.publishedAt, undefined);
    assert.equal(result.everPublished, false);
  });

  test("draft save of a once-published record: everPublished stays true", async () => {
    const result = await runHook({ _status: "draft" }, { _status: "published", everPublished: true, publishedAt: STORED_DATE });
    assert.equal(result.everPublished, true);
    assert.equal(result.publishedAt, undefined, "a draft save does not add a date");
  });

  test("status taken from originalDoc when the save does not send _status", async () => {
    const result = await runHook({ title: "x" }, { _status: "published", everPublished: false, publishedAt: STORED_DATE });
    assert.equal(result.everPublished, true);
    assert.equal(result.publishedAt, undefined, "stored date kept (field not sent)");
  });

  test("published save with publishedAt: null and a stored date: refilled with now", async () => {
    const before = Date.now();
    const result = await runHook({ _status: "published", publishedAt: null }, { _status: "published", everPublished: true, publishedAt: STORED_DATE });
    assertNow(result.publishedAt, before, Date.now());
  });

  test("published save without the field and a stored date: stored date kept", async () => {
    const result = await runHook({ _status: "published" }, { _status: "published", everPublished: true, publishedAt: STORED_DATE });
    assert.equal(result.publishedAt, undefined, "the hook does not touch a date it did not receive");
    assert.equal("publishedAt" in result, false);
  });

  test("published save with a new explicit date: new date kept", async () => {
    const result = await runHook({ _status: "published", publishedAt: EXPLICIT_DATE }, { _status: "published", everPublished: true, publishedAt: STORED_DATE });
    assert.equal(result.publishedAt, EXPLICIT_DATE);
  });

  test("a client-sent everPublished: false on a once-published record is overwritten", async () => {
    const result = await runHook({ _status: "draft", everPublished: false }, { _status: "published", everPublished: true });
    assert.equal(result.everPublished, true);
  });
});
