import type { Access, FieldAccess, PayloadRequest } from "payload";

/**
 * Staff roles (DEC-009, DEC-016): one role per staff user, Admin or Editor.
 * "Staff" means Admin + Editor. Anything else (no user, unknown role) gets
 * nothing: deny by default.
 */
export type StaffRole = "admin" | "editor";

export function staffRoleOf(req: PayloadRequest): StaffRole | null {
  const user = req.user;
  if (!user || user.collection !== "users") return null;
  return user.role === "admin" || user.role === "editor" ? user.role : null;
}

export const isAdmin: Access = ({ req }) => staffRoleOf(req) === "admin";

export const isStaff: Access = ({ req }) => staffRoleOf(req) !== null;

export const isAdminField: FieldAccess = ({ req }) => staffRoleOf(req) === "admin";

export const isStaffField: FieldAccess = ({ req }) => staffRoleOf(req) !== null;

/** Staff, or a public page reading through the server-side Local API. */
export const isStaffOrAnonymousLocalRead: Access = ({ req }) =>
  staffRoleOf(req) !== null || isAnonymousLocalRead(req);

/**
 * True for a server-side Local API call without a user (public pages).
 * REST requests carry `payloadAPI: "REST"` and never match, so anonymous REST
 * is denied (Owner 2026-11-10, P1 A). Public code must not pass
 * `overrideAccess: true`.
 */
export function isAnonymousLocalRead(req: PayloadRequest): boolean {
  return !req.user && req.payloadAPI === "local";
}

/** Admin: every staff user. Editor: only their own user. Others: nothing. */
export const isAdminOrSelf: Access = ({ req }) => {
  const role = staffRoleOf(req);
  if (role === "admin") return true;
  if (role === "editor" && req.user) return { id: { equals: req.user.id } };
  return false;
};
