import type { Payload } from "payload";

import {
  diffGlobal,
  globalTableNames,
  isGlobalTable,
  normalizeGlobalView,
  restoreGlobal,
  snapshotGlobal,
  summarizeGlobal,
  type GlobalSnapshot,
} from "./global-state";

/**
 * Snapshot and restore of the `about` global (M3-09) on the shared
 * `mahira-cms`: `tests/integration/about.test.ts` snapshots it before its
 * first write and restores it afterwards, then proves equality with a
 * second snapshot. Since M3-11 a wrapper of tests/helpers/global-state.ts
 * (the same snapshot, restore and diff for any global); the About names
 * stay for the existing tests.
 */
export type AboutSnapshot = GlobalSnapshot;

export function isAboutTable(name: string): boolean {
  return isGlobalTable("about", name);
}

/** Names of the About tables in the Payload schema (the migration of M3-09 creates 14). */
export function aboutTableNames(payload: Payload): string[] {
  return globalTableNames(payload, "about");
}

export const normalizeAboutView = normalizeGlobalView;

export function snapshotAbout(payload: Payload): Promise<AboutSnapshot> {
  return snapshotGlobal(payload, "about");
}

export function restoreAbout(payload: Payload, snapshot: AboutSnapshot): Promise<void> {
  return restoreGlobal(payload, "about", snapshot);
}

export const diffAbout = diffGlobal;

export const summarizeAbout = summarizeGlobal;
