import { sql, type PostgresAdapter } from "@payloadcms/db-postgres";
import type { PayloadRequest } from "payload";

/**
 * Takes a row lock (`SELECT ... FOR UPDATE`) on one `translation_groups` row
 * inside the transaction of `req`. The lock is held until that transaction
 * commits or rolls back.
 *
 * Postgres runs under READ COMMITTED: without the lock, two writers in the same
 * Translation Group each read the siblings before the other commits and both
 * pass the DEC-004 shared-field check. With the lock, the second writer waits,
 * and its sibling read (a new statement) sees what the first one committed.
 *
 * Fails closed: throws when `req` has no transaction, because the check would
 * not be serialised. Payload operations (create, update, publish, restore)
 * always open one; `getTransaction` is not exported by the adapter, so the
 * session is read the same way (`@payloadcms/drizzle` beginTransaction.js).
 */
export async function lockTranslationGroup(req: PayloadRequest, groupId: number | string): Promise<void> {
  const id = typeof groupId === "number" ? groupId : Number(groupId);
  if (!Number.isSafeInteger(id) || id <= 0) {
    throw new Error(`lockTranslationGroup: invalid translation group id ${JSON.stringify(groupId)}`);
  }

  const transactionID = await req.transactionID;
  const adapter = req.payload.db as unknown as PostgresAdapter;
  const session = transactionID ? adapter.sessions[String(transactionID)] : undefined;
  if (!session) {
    throw new Error("lockTranslationGroup: no open database transaction on this request");
  }

  await session.db.execute(sql`SELECT "id" FROM "translation_groups" WHERE "id" = ${id} FOR UPDATE`);
}
