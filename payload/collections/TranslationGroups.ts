import type { CollectionConfig } from "payload";
import { isAdmin, isStaff } from "../access/roles";
import { refuseDeletingUsedTranslationGroup } from "../hooks/refuse-delete-used-translation-group";

/**
 * Links the ID and EN records of one publication (DEC-004). Staff-only.
 * Deleting is Admin only (DEC-016) and refused while a publication still
 * uses the group.
 */
export const TranslationGroups: CollectionConfig = {
  slug: "translation-groups",
  admin: {
    useAsTitle: "label",
  },
  access: {
    read: isStaff,
    create: isStaff,
    update: isStaff,
    delete: isAdmin,
  },
  hooks: {
    beforeDelete: [refuseDeletingUsedTranslationGroup],
  },
  fields: [
    {
      name: "label",
      type: "text",
      required: true,
    },
  ],
};
