import assert from "node:assert/strict";
import { after, before, describe, test } from "node:test";
import { commitTransaction, createLocalReq, initTransaction, killTransaction, ValidationError } from "payload";
import type { Payload, RequiredDataFromCollectionSlug } from "payload";

import { updateSharedFields } from "../../lib/publications/update-shared-fields";
import type { Publication } from "../../payload/payload-types";
import {
  areaLabel,
  areaPrefix,
  assertOwnerIntact,
  cleanupArea,
  countLeftovers,
  createGroup,
  firstId,
  formatCounts,
  hookNote,
  totalOf,
} from "../helpers/fixtures";
import { closeTestPayload, getTestPayload } from "../helpers/payload";

/**
 * Race checks (M3-02, DEC-004; port of the archived m3-02-race-checks,
 * M3-10): shared fields of a Translation Group under concurrent writers on
 * Payload 3.93.0 + Postgres. The row lock in
 * payload/db/lock-translation-group.ts reads an internal of
 * @payloadcms/drizzle, so this file must pass again on every Payload upgrade
 * (ENVIRONMENTS §3.1). Local API only, no server needed:
 *   node --import tsx --test --test-reporter=spec tests/integration/race.test.ts
 *
 * Fixtures: slugs fixture-test-race-*, labels "[FIXTURE] test race *"; no
 * users. The archived users check is the after hook (Owner guard).
 */
type PubData = RequiredDataFromCollectionSlug<"publications">;
type AccessLevel = Publication["accessLevel"];
type Attempt<T> = { ok: true; value: T } | { ok: false; error: string; byHook: boolean };

const AREA = "race";
const PREFIX = areaPrefix(AREA);
const LABEL = areaLabel(AREA);
const SUMMARY_TEXT = "[FIXTURE] Ringkasan uji race M3-10.";
const HOOK_MESSAGE = "Field bersama harus sama";
const PENDING_WAIT_MS = 3000;
const R2_ROUNDS = 10;

function describeError(error: unknown): string {
  if (error instanceof ValidationError) {
    const items = error.data.errors.map((item) => `${item.path}: ${item.message}`).join("; ");
    return `ValidationError ${error.status} [${items}]`;
  }
  if (error instanceof Error) return `${error.name}: ${error.message}`;
  return String(error);
}

async function attempt<T>(task: () => Promise<T>): Promise<Attempt<T>> {
  try {
    return { ok: true, value: await task() };
  } catch (error) {
    const text = describeError(error);
    return { ok: false, error: text, byHook: text.includes(HOOK_MESSAGE) };
  }
}

function outcome<T>(result: Attempt<T>): string {
  if (result.ok) return "ACCEPTED";
  return result.byHook ? "rejected by enforceSharedFields" : `rejected: ${result.error}`;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

describe("race (DEC-004 shared fields under concurrent writers)", () => {
  let payload: Payload | undefined;
  let pubData: ((label: string, slug: string, locale: "id" | "en", group: number, accessLevel: AccessLevel) => PubData) | undefined;

  function p(): Payload {
    if (!payload) throw new Error("Payload not initialised (before hook failed)");
    return payload;
  }

  function data(label: string, slug: string, locale: "id" | "en", group: number, accessLevel: AccessLevel): PubData {
    if (!pubData) throw new Error("relations not resolved (before hook failed)");
    return pubData(label, slug, locale, group, accessLevel);
  }

  async function createPublished(value: PubData): Promise<Publication> {
    return p().create({ collection: "publications", data: { ...value, _status: "published" }, depth: 0, overrideAccess: true });
  }

  async function groupState(groupId: number): Promise<{ consistent: boolean; levels: string }> {
    const found = await p().find({
      collection: "publications",
      where: { translationGroup: { equals: groupId } },
      depth: 0,
      draft: true,
      pagination: false,
      sort: "locale",
      overrideAccess: true,
    });
    const values = new Set(found.docs.map((doc) => doc.accessLevel));
    return { consistent: values.size <= 1, levels: `[${found.docs.map((doc) => `${doc.locale}:${doc.accessLevel}`).join(",")}]` };
  }

  async function deleteLocale(groupId: number, locale: "id" | "en"): Promise<void> {
    const found = await p().find({
      collection: "publications",
      where: { and: [{ translationGroup: { equals: groupId } }, { locale: { equals: locale } }] },
      depth: 0,
      draft: true,
      pagination: false,
      overrideAccess: true,
    });
    for (const doc of found.docs) await p().delete({ collection: "publications", id: doc.id, overrideAccess: true });
  }

  before(async (t) => {
    payload = await getTestPayload();
    hookNote(t, `cleanup at start removed ${formatCounts(await cleanupArea(payload, AREA))}`);
    await assertOwnerIntact(payload);
    const publicationType = await firstId(payload, "publication-types");
    const topic = await firstId(payload, "topics");
    const author = await firstId(payload, "authors");
    pubData = (label, slug, locale, group, accessLevel) => ({
      title: `${LABEL}${label}`,
      slug: `${PREFIX}${slug}`,
      locale,
      translationGroup: group,
      summary: SUMMARY_TEXT,
      publicationType,
      topics: [topic],
      authors: [author],
      accessLevel,
    });
  });

  after(async (t) => {
    try {
      if (payload) {
        hookNote(t, `cleanup at end removed ${formatCounts(await cleanupArea(payload, AREA))}`);
        await assertOwnerIntact(payload);
        const left = await countLeftovers(payload, AREA);
        if (totalOf(left) !== 0) throw new Error(`fixtures left after cleanup: ${formatCounts(left)}`);
      }
    } finally {
      await closeTestPayload(payload);
    }
  });

  test("R1 writer B waits for writer A's open transaction, then is rejected by enforceSharedFields", async (t) => {
    // Writer A changes the ID record's accessLevel inside an open transaction;
    // writer B creates the EN record with the old value meanwhile.
    const group = await createGroup(p(), AREA, "R1");
    const baselineStart = Date.now();
    const idRecord = await createPublished(data("R1 ID", "r1-id", "id", group, "public"));
    const baselineMs = Date.now() - baselineStart;
    const reqA = await createLocalReq({}, p());
    await initTransaction(reqA);
    let aOpen = true;
    try {
      await p().update({ collection: "publications", id: idRecord.id, data: { accessLevel: "registered" }, depth: 0, overrideAccess: true, req: reqA });
      let settled = false;
      let settledAt = 0;
      const createStart = Date.now();
      const create = attempt(() => createPublished(data("R1 EN", "r1-en", "en", group, "public"))).finally(() => {
        settled = true;
        settledAt = Date.now();
      });
      // One create costs ~15 round trips to the database, so a fixed wait
      // cannot tell "blocked" from "slow"; wait at least 3x an unblocked create.
      const waitMs = Math.max(PENDING_WAIT_MS, baselineMs * 3);
      await sleep(waitMs);
      const pendingWhileOpen = !settled;
      await commitTransaction(reqA);
      const commitAt = Date.now();
      aOpen = false;
      const created = await create;
      const state = await groupState(group);
      t.diagnostic(
        `R1.timing unblocked create (setup) ${baselineMs} ms; B settled ${settledAt - createStart} ms after start, ${settledAt - commitAt} ms after A committed`,
      );
      assert.ok(
        pendingWhileOpen && !created.ok && created.byHook && state.consistent,
        `A (ID public->registered, open tx) vs B (create EN public): B pending after ${waitMs} ms=${pendingWhileOpen}; ` +
          `B ${outcome(created)}; group ${state.levels} consistent=${state.consistent}`,
      );
    } finally {
      if (aOpen) await killTransaction(reqA);
    }
  });

  test(`R2 updateSharedFields vs a concurrent EN create with the old value: ${R2_ROUNDS}/${R2_ROUNDS} rounds consistent`, async (t) => {
    const group = await createGroup(p(), AREA, "R2");
    await createPublished(data("R2 ID", "r2-id", "id", group, "public"));
    let current: AccessLevel = "public";
    let consistentRounds = 0;
    for (let round = 1; round <= R2_ROUNDS; round++) {
      const next: AccessLevel = current === "public" ? "registered" : "public";
      const [sync, create] = await Promise.all([
        attempt(() => updateSharedFields(p(), group, { accessLevel: next })),
        attempt(() => createPublished(data(`R2 EN ${round}`, `r2-en-${round}`, "en", group, current))),
      ]);
      const state = await groupState(group);
      if (state.consistent) consistentRounds++;
      t.diagnostic(
        `R2.${round} sync ${current}->${next} ${outcome(sync)}; create EN ${current} ${outcome(create)}; group ${state.levels} consistent=${state.consistent}`,
      );
      await deleteLocale(group, "en");
      const idRecord = await p().find({
        collection: "publications",
        where: { and: [{ translationGroup: { equals: group } }, { locale: { equals: "id" } }] },
        depth: 0,
        draft: true,
        limit: 1,
        overrideAccess: true,
      });
      current = idRecord.docs[0]?.accessLevel ?? current;
    }
    assert.equal(consistentRounds, R2_ROUNDS, `${consistentRounds}/${R2_ROUNDS} rounds consistent`);
  });

  test("R3 two concurrent creates in an empty group with different values: exactly one accepted", async () => {
    const group = await createGroup(p(), AREA, "R3");
    const [first, second] = await Promise.all([
      attempt(() => createPublished(data("R3 ID", "r3-id", "id", group, "public"))),
      attempt(() => createPublished(data("R3 EN", "r3-en", "en", group, "registered"))),
    ]);
    const accepted = [first, second].filter((result) => result.ok).length;
    const byHook = [first, second].filter((result) => !result.ok && result.byHook).length;
    const state = await groupState(group);
    assert.ok(
      accepted === 1 && byHook === 1 && state.consistent,
      `create ID public ${outcome(first)}; create EN registered ${outcome(second)}; group ${state.levels} consistent=${state.consistent}`,
    );
  });
});
