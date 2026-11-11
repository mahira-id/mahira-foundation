import { APIError, ValidationError } from "payload";
import type { CollectionBeforeChangeHook, CollectionBeforeDeleteHook, PayloadRequest } from "payload";

/**
 * At least one Admin must remain (DEC-016). Without one, nobody can manage
 * staff users or taxonomy; with an empty `users` table Payload reopens
 * `/admin/create-first-user`, where the first registrant becomes Admin
 * (`firstUserIsAdmin`). Applies to every caller, `overrideAccess` included.
 *
 * Bulk operations (`DELETE`/`PATCH /api/users?where=...`, list "delete
 * selected") run the per-document hooks concurrently in one transaction, so
 * the deletes of one request are not visible to each other's checks. Each
 * check therefore excludes every user this request has already started to
 * delete or demote (`req.context`). When a request targets all Admins, the
 * Admins whose check runs after the others are refused.
 *
 * Not covered: two separate requests that remove the last two Admins at the
 * same moment.
 */
const PENDING_KEY = "keepOneAdminPendingRemovals";
const MESSAGE = "Harus ada minimal satu Admin";

type UserId = number | string;

function registerRemoval(req: PayloadRequest, id: UserId): Map<string, UserId> {
  const context = req.context as Record<string, unknown>;
  let pending = context[PENDING_KEY];
  if (!(pending instanceof Map)) {
    pending = new Map<string, UserId>();
    context[PENDING_KEY] = pending;
  }
  const removals = pending as Map<string, UserId>;
  removals.set(String(id), id);
  return removals;
}

async function anotherAdminRemains(req: PayloadRequest, pending: Map<string, UserId>): Promise<boolean> {
  const others = await req.payload.count({
    collection: "users",
    where: { and: [{ role: { equals: "admin" } }, { id: { not_in: [...pending.values()] } }] },
    overrideAccess: true,
    req,
  });
  return others.totalDocs > 0;
}

/** Refuses changing the role of the last Admin. */
export const keepOneAdminOnRoleChange: CollectionBeforeChangeHook = async ({ data, operation, originalDoc, req }) => {
  if (operation !== "update" || originalDoc?.role !== "admin") return data;
  if (!("role" in data) || data.role === "admin") return data;

  const pending = registerRemoval(req, originalDoc.id);
  if (!(await anotherAdminRemains(req, pending))) {
    throw new ValidationError({
      collection: "users",
      errors: [{ path: "role", message: `${MESSAGE}: role Admin terakhir tidak bisa diubah.` }],
      req,
    });
  }
  return data;
};

/** Refuses deleting the last Admin. */
export const keepOneAdminOnDelete: CollectionBeforeDeleteHook = async ({ id, req }) => {
  const pending = registerRemoval(req, id);
  const target = await req.payload.findByID({
    collection: "users",
    id,
    depth: 0,
    disableErrors: true,
    overrideAccess: true,
    req,
  });
  if (target?.role !== "admin") return;

  if (!(await anotherAdminRemains(req, pending))) {
    throw new APIError(`${MESSAGE}: Admin terakhir tidak bisa dihapus.`, 400, null, true);
  }
};
