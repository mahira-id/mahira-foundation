import type { CollectionConfig } from "payload";
import { isStaff } from "../access/roles";

/** Links the ID and EN records of one publication (DEC-004). Staff-only. */
export const TranslationGroups: CollectionConfig = {
  slug: "translation-groups",
  admin: {
    useAsTitle: "label",
  },
  access: {
    read: isStaff,
    create: isStaff,
    update: isStaff,
    delete: isStaff,
  },
  fields: [
    {
      name: "label",
      type: "text",
      required: true,
    },
  ],
};
