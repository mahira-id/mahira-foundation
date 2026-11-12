import { randomBytes } from "node:crypto";
import type { Payload } from "payload";

/**
 * Fixture isolation on the shared `mahira-cms` database (M3-10, Owner
 * 2026-11-11, P2 A).
 *
 * Every record a test writes carries a prefix the existing data does not use
 * (`fixture-m2-*`, `fixture-topic-*`, `fixture-type-*`, `fixture-author-*`,
 * `[FIXTURE] ...`): slugs and email local parts start with
 * `fixture-test-<area>-`, emails end with `@example.invalid`, labels and
 * titles start with `[FIXTURE] test <area> `. Cleanup deletes only records
 * with the prefix of its own area, at the start and at the end of a file.
 *
 * The Owner's account is never returned: ownerState() gives counts and the
 * role only; ownerIdForRolledBackTransaction() is for writes inside a
 * transaction that is always rolled back.
 */
export const ROOT_PREFIX = "fixture-test-";
export const LABEL_ROOT = "[FIXTURE] test ";
export const EMAIL_DOMAIN = "@example.invalid";

export type Area = "access" | "guard" | "home" | "locale" | "race" | "workflow";

export function areaPrefix(area: Area): string {
  return `${ROOT_PREFIX}${area}-`;
}

export function areaLabel(area: Area): string {
  return `${LABEL_ROOT}${area} `;
}

export function areaEmail(area: Area, name: string): string {
  return `${areaPrefix(area)}${name}${EMAIL_DOMAIN}`;
}

/** Random, in memory only; never printed. */
export function randomPassword(): string {
  return randomBytes(24).toString("base64url");
}

export function isTestEmail(email: string, prefix: string = ROOT_PREFIX): boolean {
  return email.startsWith(prefix) && email.endsWith(EMAIL_DOMAIN);
}

type SlugCollection = "publications" | "topics" | "publication-types" | "authors";

async function slugIds(payload: Payload, collection: SlugCollection, prefix: string): Promise<number[]> {
  // `like` is a case-insensitive "contains" in the Postgres adapter, so the
  // prefix is checked again in code.
  const where = { slug: { like: prefix } };
  const ids = new Set<number>();
  const records = await payload.find({ collection, where, depth: 0, pagination: false, overrideAccess: true });
  for (const doc of records.docs) if (doc.slug.startsWith(prefix)) ids.add(doc.id);
  if (collection === "publications") {
    // The latest version can differ from the record (pending draft).
    const latest = await payload.find({ collection, where, depth: 0, draft: true, pagination: false, overrideAccess: true });
    for (const doc of latest.docs) if (doc.slug.startsWith(prefix)) ids.add(doc.id);
  }
  return [...ids];
}

async function groupIds(payload: Payload, label: string): Promise<number[]> {
  const groups = await payload.find({
    collection: "translation-groups",
    where: { label: { like: label } },
    depth: 0,
    pagination: false,
    overrideAccess: true,
  });
  return groups.docs.filter((doc) => doc.label.startsWith(label)).map((doc) => doc.id);
}

async function userIds(payload: Payload, prefix: string): Promise<number[]> {
  const users = await payload.find({
    collection: "users",
    where: { email: { like: prefix } },
    depth: 0,
    pagination: false,
    overrideAccess: true,
  });
  return users.docs.filter((doc) => isTestEmail(doc.email, prefix)).map((doc) => doc.id);
}

export type FixtureCounts = {
  publications: number;
  translationGroups: number;
  topics: number;
  publicationTypes: number;
  authors: number;
  users: number;
};

/**
 * t.diagnostic() from a before/after hook. Node 26 gives hooks a
 * SuiteContext with diagnostic(); the installed @types/node (20.x) does not
 * declare it there.
 */
export function hookNote(context: unknown, message: string): void {
  const diagnostic = (context as { diagnostic?: (text: string) => void }).diagnostic;
  if (typeof diagnostic === "function") diagnostic.call(context, message);
}

export function totalOf(counts: FixtureCounts): number {
  return Object.values(counts).reduce((sum, value) => sum + value, 0);
}

export function formatCounts(counts: FixtureCounts): string {
  return Object.entries(counts)
    .map(([name, value]) => `${name}=${value}`)
    .join(" ");
}

/**
 * Deletes this area's fixtures, publications first (a used Translation Group
 * cannot be deleted). Authors are never created by the tests, so they are
 * only counted (countLeftovers), not deleted.
 */
export async function cleanupArea(payload: Payload, area: Area): Promise<FixtureCounts> {
  const prefix = areaPrefix(area);
  const counts: FixtureCounts = { publications: 0, translationGroups: 0, topics: 0, publicationTypes: 0, authors: 0, users: 0 };
  for (const id of await slugIds(payload, "publications", prefix)) {
    await payload.delete({ collection: "publications", id, overrideAccess: true });
    counts.publications++;
  }
  for (const id of await groupIds(payload, areaLabel(area))) {
    await payload.delete({ collection: "translation-groups", id, overrideAccess: true });
    counts.translationGroups++;
  }
  for (const id of await slugIds(payload, "topics", prefix)) {
    await payload.delete({ collection: "topics", id, overrideAccess: true });
    counts.topics++;
  }
  for (const id of await slugIds(payload, "publication-types", prefix)) {
    await payload.delete({ collection: "publication-types", id, overrideAccess: true });
    counts.publicationTypes++;
  }
  for (const id of await userIds(payload, prefix)) {
    await payload.delete({ collection: "users", id, overrideAccess: true });
    counts.users++;
  }
  return counts;
}

/** Records with the test prefix (all areas by default). Read only. */
export async function countLeftovers(payload: Payload, area?: Area): Promise<FixtureCounts> {
  const prefix = area ? areaPrefix(area) : ROOT_PREFIX;
  const label = area ? areaLabel(area) : LABEL_ROOT;
  return {
    publications: (await slugIds(payload, "publications", prefix)).length,
    translationGroups: (await groupIds(payload, label)).length,
    topics: (await slugIds(payload, "topics", prefix)).length,
    publicationTypes: (await slugIds(payload, "publication-types", prefix)).length,
    authors: (await slugIds(payload, "authors", prefix)).length,
    users: (await userIds(payload, prefix)).length,
  };
}

export type OwnerState = { users: number; nonFixtureUsers: number; ownerRole: string | null };

async function nonFixtureUsers(payload: Payload) {
  const users = await payload.find({ collection: "users", depth: 0, pagination: false, overrideAccess: true });
  return { total: users.totalDocs, others: users.docs.filter((doc) => !isTestEmail(doc.email)) };
}

/** Counts and the Owner's role; never an email or an id. */
export async function ownerState(payload: Payload): Promise<OwnerState> {
  const { total, others } = await nonFixtureUsers(payload);
  return { users: total, nonFixtureUsers: others.length, ownerRole: others.length === 1 ? (others[0]?.role ?? null) : null };
}

export function ownerIntact(state: OwnerState): boolean {
  return state.users === 1 && state.nonFixtureUsers === 1 && state.ownerRole === "admin";
}

export function describeOwner(state: OwnerState): string {
  return `users=${state.users} nonFixtureUsers=${state.nonFixtureUsers} ownerIsAdmin=${state.ownerRole === "admin"}`;
}

/**
 * Throws unless the database holds exactly one user, a non-fixture Admin
 * (the Owner). Run before any fixture is written and after cleanup.
 */
export async function assertOwnerIntact(payload: Payload): Promise<OwnerState> {
  const state = await ownerState(payload);
  if (!ownerIntact(state)) {
    throw new Error(`Owner guard failed (expected users=1, the only user a non-fixture Admin): ${describeOwner(state)}`);
  }
  return state;
}

/**
 * The Owner's id, for Local API calls inside a transaction that is always
 * rolled back. Never print it or pass it to an assertion.
 */
export async function ownerIdForRolledBackTransaction(payload: Payload): Promise<number> {
  const { others } = await nonFixtureUsers(payload);
  const owner = others.length === 1 ? others[0] : undefined;
  if (!owner || owner.role !== "admin") throw new Error("Owner guard failed: no single non-fixture Admin");
  return owner.id;
}

/** First existing record (lowest id) that is not a test fixture, to reuse as a relation. */
export async function firstId(payload: Payload, collection: "authors" | "topics" | "publication-types"): Promise<number> {
  const found = await payload.find({ collection, limit: 50, depth: 0, sort: "id", overrideAccess: true });
  const doc = found.docs.find((candidate) => !candidate.slug.startsWith(ROOT_PREFIX));
  if (!doc) throw new Error(`No existing ${collection} record to reuse`);
  return doc.id;
}

export async function createGroup(payload: Payload, area: Area, name: string): Promise<number> {
  const group = await payload.create({
    collection: "translation-groups",
    data: { label: `${areaLabel(area)}${name}` },
    overrideAccess: true,
  });
  return group.id;
}
