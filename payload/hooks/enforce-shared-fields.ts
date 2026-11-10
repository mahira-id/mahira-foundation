import { ValidationError } from "payload";
import type { CollectionBeforeChangeHook, Where } from "payload";

/**
 * DEC-004 shared fields: every language version in one Translation Group must
 * carry the same values. Arrays keep their order (the first Topic is primary).
 */
export const SHARED_FIELDS = ["accessLevel", "publicationType", "topics", "authors"] as const;

export type SharedField = (typeof SHARED_FIELDS)[number];

type RelationValue = number | string | { id: number | string } | null | undefined;

function toId(value: RelationValue): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "object") return String(value.id);
  return String(value);
}

/** Relationship objects become ids; ids become strings so 1 and "1" compare equal. */
function normalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map((item) => toId(item as RelationValue));
  if (value !== null && typeof value === "object" && "id" in value) return toId(value as RelationValue);
  if (typeof value === "number") return String(value);
  return value;
}

/** Drafts may be saved before a value is chosen; such a value is not compared. */
function isMissing(value: unknown): boolean {
  return value === null || value === undefined || value === "" || (Array.isArray(value) && value.length === 0);
}

/**
 * Rejects a save (create, update, draft save, publish, version restore) whose
 * shared fields differ from any sibling in the same Translation Group.
 * `updateSharedFields()` in lib/publications sets `context.sharedFieldSync`
 * to change all siblings together; REST and admin clients cannot set context.
 */
export const enforceSharedFields: CollectionBeforeChangeHook = async ({ context, data, originalDoc, req }) => {
  if (context?.sharedFieldSync === true) return data;

  const groupId = toId((data.translationGroup ?? originalDoc?.translationGroup) as RelationValue);
  if (groupId === null) return data;

  const conditions: Where[] = [{ translationGroup: { equals: groupId } }];
  if (originalDoc?.id !== undefined) conditions.push({ id: { not_equals: originalDoc.id } });

  const siblings = await req.payload.find({
    collection: "publications",
    where: { and: conditions },
    depth: 0,
    draft: true,
    overrideAccess: true,
    pagination: false,
    req,
  });

  const errors: { path: string; message: string }[] = [];
  for (const field of SHARED_FIELDS) {
    const incoming = normalize(field in data ? data[field] : originalDoc?.[field]);
    if (isMissing(incoming)) continue;
    for (const sibling of siblings.docs) {
      const siblingValue = normalize(sibling[field]);
      if (isMissing(siblingValue)) continue;
      if (JSON.stringify(incoming) !== JSON.stringify(siblingValue)) {
        errors.push({
          path: field,
          message: `Field bersama harus sama dengan versi bahasa ${sibling.locale} dalam Translation Group yang sama`,
        });
        break;
      }
    }
  }

  if (errors.length > 0) {
    throw new ValidationError({ collection: "publications", errors, req });
  }
  return data;
};
