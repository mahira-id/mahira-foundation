import { commitTransaction, createLocalReq, initTransaction, killTransaction } from "payload";
import type { Payload } from "payload";
import { lockTranslationGroup } from "@/payload/db/lock-translation-group";
import type { SharedField } from "@/payload/hooks/enforce-shared-fields";
import type { Publication } from "@/payload/payload-types";

/**
 * Server-only. Changes DEC-004 shared fields on every language version of a
 * Translation Group in one database transaction. A plain update of one
 * sibling would be rejected by `enforceSharedFields`, so this sets
 * `context.sharedFieldSync`. REST and admin clients cannot set `req.context`;
 * only server code that imports this function can.
 *
 * Each sibling is saved with a regular (non-draft) update, in id order.
 *
 * The Translation Group row is locked first (same lock as
 * `enforceSharedFields`), so a concurrent save in the group waits for this
 * transaction and then sees the new values.
 */
export async function updateSharedFields(
  payload: Payload,
  groupId: number | string,
  values: Partial<Pick<Publication, SharedField>>,
): Promise<Publication[]> {
  const req = await createLocalReq({ context: { sharedFieldSync: true } }, payload);
  await initTransaction(req);
  try {
    await lockTranslationGroup(req, groupId);
    const siblings = await payload.find({
      collection: "publications",
      where: { translationGroup: { equals: groupId } },
      depth: 0,
      overrideAccess: true,
      pagination: false,
      sort: "id",
      req,
    });
    const updated: Publication[] = [];
    for (const sibling of siblings.docs) {
      updated.push(
        await payload.update({
          collection: "publications",
          id: sibling.id,
          data: values,
          context: { sharedFieldSync: true },
          depth: 0,
          overrideAccess: true,
          req,
        }),
      );
    }
    await commitTransaction(req);
    return updated;
  } catch (error) {
    await killTransaction(req);
    throw error;
  }
}
