import assert from "node:assert/strict";
import { after, before, describe, test } from "node:test";
import { createLocalReq, initTransaction, killTransaction, ValidationError } from "payload";
import type { Payload, PayloadRequest, RequiredDataFromCollectionSlug } from "payload";

import type { Publication, User } from "../../payload/payload-types";
import {
  areaEmail,
  areaLabel,
  areaPrefix,
  assertOwnerIntact,
  cleanupArea,
  countLeftovers,
  createGroup,
  firstId,
  formatCounts,
  hookNote,
  ownerIdForRolledBackTransaction,
  ownerState,
  randomPassword,
  totalOf,
} from "../helpers/fixtures";
import { assertServerUp, login, rest, restErrors, restFact } from "../helpers/http";
import { closeTestPayload, getTestPayload } from "../helpers/payload";

/**
 * Review-fix checks (M3-02 review findings 1-3; port of the archived
 * m3-02-review-fixes-checks, M3-10): Translation Group delete (T), publishedAt
 * refill on a published save (P), last-Admin guard (G).
 * Needs `next start` with the full env (bun run test:integration).
 *
 * Owner safety (Owner 2026-11-11, P2 A): the Owner's account is touched only
 * inside database transactions that are always rolled back (killTransaction
 * in `finally`); its email and id are never printed. Committed writes go to
 * fixtures only: users fixture-test-guard-*@example.invalid, slugs
 * fixture-test-guard-*, labels "[FIXTURE] test guard *". The archived S0/S9
 * are the before/after hooks (Owner guard).
 */
type PubData = RequiredDataFromCollectionSlug<"publications">;

const AREA = "guard";
const PREFIX = areaPrefix(AREA);
const LABEL = areaLabel(AREA);
const ADMIN1_EMAIL = areaEmail(AREA, "admin1");
const ADMIN2_EMAIL = areaEmail(AREA, "admin2");
const EDITOR_EMAIL = areaEmail(AREA, "editor");
const SUMMARY_TEXT = "[FIXTURE] Ringkasan uji perbaikan review M3-10.";
const GROUP_IN_USE = "masih dipakai publikasi";
const LAST_ADMIN = "Harus ada minimal satu Admin";

function describeError(error: unknown): string {
  if (error instanceof ValidationError) {
    const items = error.data.errors.map((item) => `${item.path}: ${item.message}`).join("; ");
    return `ValidationError ${error.status} [${items}]`;
  }
  if (error instanceof Error) return `${error.name}: ${error.message}`;
  return String(error);
}

/** "ACCEPTED" or the error text (no ids, no emails). */
async function attempt(task: () => Promise<unknown>): Promise<string> {
  try {
    await task();
    return "ACCEPTED";
  } catch (error) {
    return describeError(error);
  }
}

function groupOf(pub: Publication): number | null {
  const value = pub.translationGroup as unknown;
  if (value === null || value === undefined) return null;
  if (typeof value === "object") return (value as { id: number }).id;
  return value as number;
}

function isRecent(value: string | null | undefined, startedAt: number): boolean {
  if (!value) return false;
  const time = Date.parse(value);
  return Number.isFinite(time) && time >= startedAt - 5 * 60_000 && time <= Date.now() + 60_000;
}

describe("guards (M3-02 review fixes: group delete, publishedAt, last Admin)", () => {
  let payload: Payload | undefined;

  function p(): Payload {
    if (!payload) throw new Error("Payload not initialised (before hook failed)");
    return payload;
  }

  /**
   * Runs `task` inside a new transaction and always rolls it back. Payload
   * kills the transaction itself when an operation throws; killTransaction
   * is a no-op then. Returns whether the transaction was still open when
   * `task` finished.
   */
  async function inRolledBackTransaction(task: (req: PayloadRequest) => Promise<void>): Promise<boolean> {
    const req = await createLocalReq({}, p());
    const started = await initTransaction(req);
    if (!started || !req.transactionID) {
      await killTransaction(req);
      throw new Error("could not open a database transaction; Owner checks skipped");
    }
    let stillOpen = false;
    try {
      await task(req);
      stillOpen = Boolean(req.transactionID);
    } finally {
      await killTransaction(req);
    }
    return stillOpen;
  }

  async function ownerIsAdmin(): Promise<boolean> {
    return (await ownerState(p())).ownerRole === "admin";
  }

  async function usersCount(): Promise<number> {
    return (await p().count({ collection: "users", overrideAccess: true })).totalDocs;
  }

  async function groupExists(id: number): Promise<boolean> {
    const found = await p().find({ collection: "translation-groups", where: { id: { equals: id } }, depth: 0, limit: 1, overrideAccess: true });
    return found.docs.length === 1;
  }

  async function readPub(id: number, draft: boolean): Promise<Publication> {
    return p().findByID({ collection: "publications", id, depth: 0, draft, overrideAccess: true });
  }

  before(async (t) => {
    payload = await getTestPayload();
    hookNote(t, `cleanup at start removed ${formatCounts(await cleanupArea(payload, AREA))}`);
    await assertOwnerIntact(payload);
    await assertServerUp();
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

  // ------------------------------------------------------------ finding 3, Owner as the only Admin (rolled back)
  describe("last-Admin guard on the Owner, inside rolled-back transactions", () => {
    let ownerId: number | undefined;

    function owner(): number {
      if (ownerId === undefined) throw new Error("Owner not resolved (before hook failed)");
      return ownerId;
    }

    before(async () => {
      ownerId = await ownerIdForRolledBackTransaction(p());
    });

    test("G1 demote the only Admin (Local API, overrideAccess): ValidationError, role kept", async () => {
      let outcome = "not run";
      await inRolledBackTransaction(async (req) => {
        outcome = await attempt(() => p().update({ collection: "users", id: owner(), data: { role: "editor" }, depth: 0, overrideAccess: true, req }));
      });
      const admin = await ownerIsAdmin();
      assert.ok(outcome.startsWith("ValidationError") && outcome.includes(LAST_ADMIN) && admin, `rolled-back tx: ${outcome}; Owner is Admin after rollback=${admin}`);
    });

    test("G2 delete the only Admin by id: refused, users = 1", async () => {
      let outcome = "not run";
      await inRolledBackTransaction(async (req) => {
        outcome = await attempt(() => p().delete({ collection: "users", id: owner(), overrideAccess: true, req }));
      });
      const users = await usersCount();
      const admin = await ownerIsAdmin();
      assert.ok(outcome.includes(LAST_ADMIN) && users === 1 && admin, `rolled-back tx: ${outcome}; users after rollback=${users}, Owner is Admin=${admin}`);
    });

    test("G2b bulk delete (where id) of the only Admin: 0 deleted, 1 error", async () => {
      let errors = -1;
      let docs = -1;
      let message = "";
      await inRolledBackTransaction(async (req) => {
        const result = await p().delete({ collection: "users", where: { id: { equals: owner() } }, overrideAccess: true, req });
        errors = result.errors.length;
        docs = result.docs.length;
        message = result.errors.map((error) => error.message).join(" | ");
      });
      const users = await usersCount();
      assert.ok(
        errors === 1 && docs === 0 && message.includes(LAST_ADMIN) && users === 1,
        `rolled-back tx: deleted=${docs} errors=${errors} [${message}]; users after rollback=${users}`,
      );
    });

    test("G2c bulk update (where id) role=editor on the only Admin: 0 updated, 1 error", async () => {
      let errors = -1;
      let docs = -1;
      let message = "";
      await inRolledBackTransaction(async (req) => {
        const result = await p().update({
          collection: "users",
          where: { id: { equals: owner() } },
          data: { role: "editor" },
          depth: 0,
          overrideAccess: true,
          req,
        });
        errors = result.errors.length;
        docs = result.docs.length;
        message = result.errors.map((error) => error.message).join(" | ");
      });
      const admin = await ownerIsAdmin();
      assert.ok(errors === 1 && docs === 0 && admin, `rolled-back tx: updated=${docs} errors=${errors} [${message}]; Owner is Admin after rollback=${admin}`);
    });
  });

  // ------------------------------------------------------------ fixtures (two Admins, one Editor)
  describe("with fixture Admins and Editor", () => {
    type Fixtures = {
      admin1: User;
      admin2: User;
      editor: User;
      admin1Secret: string;
      adminToken: string | undefined;
      editorToken: string | undefined;
      pubData: (label: string, slug: string, group: number, overrides?: Partial<PubData>) => PubData;
    };
    let fx: Fixtures | undefined;
    let usedGroup = 0;
    let emptyGroup = 0;
    let member: Publication | undefined;
    let dated: Publication | undefined;
    let adminToken2: string | undefined;

    function f(): Fixtures {
      if (!fx) throw new Error("fixtures not created (before hook failed)");
      return fx;
    }

    function memberPub(): Publication {
      if (!member) throw new Error("T1 setup did not create the member publication");
      return member;
    }

    function datedPub(): Publication {
      if (!dated) throw new Error("P0 did not create its record");
      return dated;
    }

    before(async () => {
      const admin1Secret = randomPassword();
      const editorSecret = randomPassword();
      const admin1 = await p().create({ collection: "users", data: { email: ADMIN1_EMAIL, password: admin1Secret, role: "admin" }, overrideAccess: true });
      const admin2 = await p().create({ collection: "users", data: { email: ADMIN2_EMAIL, password: randomPassword(), role: "admin" }, overrideAccess: true });
      const editor = await p().create({ collection: "users", data: { email: EDITOR_EMAIL, password: editorSecret, role: "editor" }, overrideAccess: true });
      const publicationType = await firstId(p(), "publication-types");
      const topic = await firstId(p(), "topics");
      const author = await firstId(p(), "authors");
      fx = {
        admin1,
        admin2,
        editor,
        admin1Secret,
        adminToken: await login(ADMIN1_EMAIL, admin1Secret),
        editorToken: await login(EDITOR_EMAIL, editorSecret),
        pubData: (label, slug, group, overrides = {}) => ({
          title: `${LABEL}${label}`,
          slug: `${PREFIX}${slug}`,
          locale: "id",
          translationGroup: group,
          summary: SUMMARY_TEXT,
          publicationType,
          topics: [topic],
          authors: [author],
          accessLevel: "public",
          ...overrides,
        }),
      };
    });

    test("S1 fixture users: admin1 and admin2 Admin, editor Editor", () => {
      const { admin1, admin2, editor } = f();
      assert.ok(
        admin1.role === "admin" && admin2.role === "admin" && editor.role === "editor",
        `admin1=${admin1.role} admin2=${admin2.role} editor=${editor.role}`,
      );
    });

    test("S2 fixture logins return a token", () => {
      const { adminToken, editorToken } = f();
      assert.ok(Boolean(adminToken) && Boolean(editorToken), `admin1 token=${Boolean(adminToken)} editor token=${Boolean(editorToken)}`);
    });

    // ---------------------------------------------------------- finding 1, Translation Group delete
    test("T1 editor DELETE group with an ever-published member: 403, member still linked", async () => {
      const { editorToken, pubData } = f();
      usedGroup = await createGroup(p(), AREA, "used");
      member = await p().create({
        collection: "publications",
        data: { ...pubData("member published", "member", usedGroup), _status: "published" },
        depth: 0,
        overrideAccess: true,
      });
      emptyGroup = await createGroup(p(), AREA, "empty");
      const result = await rest("DELETE", `/api/translation-groups/${usedGroup}`, { token: editorToken });
      const linked = groupOf(await readPub(member.id, false)) === usedGroup;
      const present = await groupExists(usedGroup);
      assert.ok(result.status === 403 && present && linked, `${restFact(result)}; group exists=${present}; member still linked=${linked}`);
    });

    test("T2 editor DELETE empty group: 403", async () => {
      const result = await rest("DELETE", `/api/translation-groups/${emptyGroup}`, { token: f().editorToken });
      const present = await groupExists(emptyGroup);
      assert.ok(result.status === 403 && present, `${restFact(result)} (expected 403); group exists=${present}`);
    });

    test("T3 admin DELETE group in use: 400 'masih dipakai publikasi'", async () => {
      const result = await rest("DELETE", `/api/translation-groups/${usedGroup}`, { token: f().adminToken });
      const linked = groupOf(await readPub(memberPub().id, false)) === usedGroup;
      const present = await groupExists(usedGroup);
      assert.ok(
        result.status === 400 && restErrors(result.body).includes(GROUP_IN_USE) && present && linked,
        `${restFact(result)}; group exists=${present}; member still linked=${linked}`,
      );
    });

    test("T4 Local API delete group in use with overrideAccess: refused", async () => {
      const outcome = await attempt(() => p().delete({ collection: "translation-groups", id: usedGroup, overrideAccess: true }));
      const present = await groupExists(usedGroup);
      assert.ok(outcome.includes(GROUP_IN_USE) && present, `${outcome}; group exists=${present}`);
    });

    test("T5 admin DELETE group used only by the latest (draft) version: 400", async () => {
      // A pending draft moves the member to another group: the record still
      // points to usedGroup, the latest version to draftGroup.
      const draftGroup = await createGroup(p(), AREA, "draft target");
      await p().update({
        collection: "publications",
        id: memberPub().id,
        data: { translationGroup: draftGroup },
        draft: true,
        depth: 0,
        overrideAccess: true,
      });
      const recordGroup = groupOf(await readPub(memberPub().id, false));
      const draftViewGroup = groupOf(await readPub(memberPub().id, true));
      const result = await rest("DELETE", `/api/translation-groups/${draftGroup}`, { token: f().adminToken });
      const present = await groupExists(draftGroup);
      assert.ok(
        recordGroup === usedGroup && draftViewGroup === draftGroup && result.status === 400 && restErrors(result.body).includes(GROUP_IN_USE) && present,
        `record group=usedGroup ${recordGroup === usedGroup}, draft group=draftGroup ${draftViewGroup === draftGroup}; ${restFact(result)}; group exists=${present}`,
      );
    });

    test("T6 admin bulk DELETE (used + empty group): used kept, empty deleted", async () => {
      const bulkGroup = await createGroup(p(), AREA, "bulk empty");
      const result = await rest("DELETE", `/api/translation-groups?where[id][in]=${usedGroup},${bulkGroup}`, { token: f().adminToken });
      const usedPresent = await groupExists(usedGroup);
      const bulkGone = !(await groupExists(bulkGroup));
      assert.ok(usedPresent && bulkGone, `${restFact(result)}; used group exists=${usedPresent}; empty group deleted=${bulkGone}`);
    });

    test("T7 admin DELETE empty group: 200", async () => {
      const result = await rest("DELETE", `/api/translation-groups/${emptyGroup}`, { token: f().adminToken });
      const gone = !(await groupExists(emptyGroup));
      assert.ok(result.status === 200 && gone, `${restFact(result)}; deleted=${gone}`);
    });

    // ---------------------------------------------------------- finding 2, publishedAt
    const explicitDate = "2026-01-15T00:00:00.000Z";

    test("P0 published create with publishedAt keeps it", async () => {
      dated = await p().create({
        collection: "publications",
        data: { ...f().pubData("dated", "dated", await createGroup(p(), AREA, "dated"), { publishedAt: explicitDate }), _status: "published" },
        depth: 0,
        overrideAccess: true,
      });
      assert.equal(dated.publishedAt, explicitDate, `stored ${dated.publishedAt ?? "null"}`);
    });

    test("P1 published update without publishedAt keeps the stored date", async () => {
      const kept = await p().update({ collection: "publications", id: datedPub().id, data: { title: `${LABEL}dated (edited)` }, depth: 0, overrideAccess: true });
      assert.equal(kept.publishedAt, explicitDate, `stored ${kept.publishedAt ?? "null"}`);
    });

    test("P2 Local API published update with publishedAt: null refills now", async () => {
      const startedAt = Date.now();
      const cleared = await p().update({ collection: "publications", id: datedPub().id, data: { publishedAt: null }, depth: 0, overrideAccess: true });
      assert.ok(cleared._status === "published" && isRecent(cleared.publishedAt, startedAt), `status=${cleared._status}, stored ${cleared.publishedAt ?? "null"} (expected now)`);
    });

    test("P3 published update with a new publishedAt stores it", async () => {
      const changedDate = "2026-02-01T00:00:00.000Z";
      const changed = await p().update({ collection: "publications", id: datedPub().id, data: { publishedAt: changedDate }, depth: 0, overrideAccess: true });
      assert.equal(changed.publishedAt, changedDate, `stored ${changed.publishedAt ?? "null"}`);
    });

    test("P4 editor REST PATCH publish with publishedAt: null refills now", async () => {
      const startedAt = Date.now();
      const result = await rest("PATCH", `/api/publications/${datedPub().id}`, { token: f().editorToken, body: { publishedAt: null, _status: "published" } });
      const stored = await readPub(datedPub().id, false);
      assert.ok(
        result.status === 200 && stored._status === "published" && isRecent(stored.publishedAt, startedAt),
        `${restFact(result)}; stored ${stored.publishedAt ?? "null"} (expected now)`,
      );
    });

    test("P5 draft save with publishedAt: null on a never-published record: stays null", async () => {
      const draftOnly = await p().create({
        collection: "publications",
        data: { ...f().pubData("draft only", "draft-only", await createGroup(p(), AREA, "draft only"), { publishedAt: explicitDate }), _status: "draft" },
        draft: true,
        depth: 0,
        overrideAccess: true,
      });
      const cleared = await p().update({ collection: "publications", id: draftOnly.id, data: { publishedAt: null }, draft: true, depth: 0, overrideAccess: true });
      assert.ok(!cleared.publishedAt, `stored ${cleared.publishedAt ?? "null"} (expected null, not filled)`);
    });

    // ---------------------------------------------------------- finding 3, with fixture Admins
    test("G3 fixture admin1 REST PATCH own role=editor while other Admins exist: 200", async () => {
      const { admin1, admin1Secret, adminToken } = f();
      const result = await rest("PATCH", `/api/users/${admin1.id}`, { token: adminToken, body: { role: "editor" } });
      const stored = await p().findByID({ collection: "users", id: admin1.id, depth: 0, overrideAccess: true });
      await p().update({ collection: "users", id: admin1.id, data: { role: "admin" }, depth: 0, overrideAccess: true });
      adminToken2 = await login(ADMIN1_EMAIL, admin1Secret);
      assert.ok(result.status === 200 && stored.role === "editor", `${restFact(result)}; stored role=${stored.role} (guard does not block)`);
    });

    test("G4 rolled-back tx: Owner demoted, one bulk delete of both fixture Admins refuses the last", async () => {
      // Owner demoted inside the transaction (rolled back), so the two
      // fixture Admins are the last Admins; one bulk request then tries to
      // delete both.
      const ownerId = await ownerIdForRolledBackTransaction(p());
      let demote = "not run";
      let deleted = -1;
      let refused = -1;
      let message = "";
      let adminsLeft = -1;
      const open = await inRolledBackTransaction(async (req) => {
        demote = await attempt(() => p().update({ collection: "users", id: ownerId, data: { role: "editor" }, depth: 0, overrideAccess: true, req }));
        if (demote !== "ACCEPTED" || !req.transactionID) return;
        const result = await p().delete({
          collection: "users",
          where: { and: [{ email: { like: PREFIX } }, { role: { equals: "admin" } }] },
          overrideAccess: true,
          req,
        });
        deleted = result.docs.length;
        refused = result.errors.length;
        message = [...new Set(result.errors.map((error) => error.message))].join(" | ");
        adminsLeft = (await p().count({ collection: "users", where: { role: { equals: "admin" } }, overrideAccess: true, req })).totalDocs;
      });
      const admin = await ownerIsAdmin();
      const fixtureAdmins = (
        await p().count({ collection: "users", where: { and: [{ email: { like: PREFIX } }, { role: { equals: "admin" } }] }, overrideAccess: true })
      ).totalDocs;
      assert.ok(
        demote === "ACCEPTED" && open && refused >= 1 && message.includes(LAST_ADMIN) && adminsLeft >= 1 && admin && fixtureAdmins === 2,
        `demote Owner: ${demote}; bulk delete of both fixture Admins: deleted=${deleted} refused=${refused} [${message}]; ` +
          `Admins left in tx=${adminsLeft}; after rollback Owner is Admin=${admin}, fixture Admins=${fixtureAdmins}`,
      );
    });

    test("G5 fixture admin REST DELETE fixture editor: 200", async () => {
      const { adminToken, editor } = f();
      const result = await rest("DELETE", `/api/users/${editor.id}`, { token: adminToken2 ?? adminToken });
      const gone = (await p().count({ collection: "users", where: { id: { equals: editor.id } }, overrideAccess: true })).totalDocs === 0;
      assert.ok(result.status === 200 && gone, `${restFact(result)}; deleted=${gone}`);
    });

    test("G6 fixture admin REST DELETE another Admin while Admins remain: 200", async (t) => {
      const { adminToken, admin2 } = f();
      const result = await rest("DELETE", `/api/users/${admin2.id}`, { token: adminToken2 ?? adminToken });
      const gone = (await p().count({ collection: "users", where: { id: { equals: admin2.id } }, overrideAccess: true })).totalDocs === 0;
      t.diagnostic(
        "OBSERVED G7 REST refusal for the last Admin is not exercised: it needs the Owner to be non-Admin outside a transaction. " +
          "REST runs the same hooks as G1/G2 (code reading).",
      );
      assert.ok(result.status === 200 && gone, `${restFact(result)}; deleted=${gone}`);
    });
  });
});
