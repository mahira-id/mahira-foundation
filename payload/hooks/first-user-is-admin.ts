import type { CollectionBeforeChangeHook } from "payload";

/**
 * The first staff user of an empty database becomes Admin (Owner 2026-11-10,
 * P5 A); every later user keeps the submitted role (default Editor).
 * `registerFirstUser` creates with `overrideAccess: true`, so the Admin-only
 * field access on `role` does not strip this value.
 */
export const firstUserIsAdmin: CollectionBeforeChangeHook = async ({ data, operation, req }) => {
  if (operation !== "create") return data;
  const existing = await req.payload.count({ collection: "users", overrideAccess: true, req });
  if (existing.totalDocs === 0) return { ...data, role: "admin" };
  return data;
};
