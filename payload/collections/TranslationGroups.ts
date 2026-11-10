import type { CollectionConfig } from "payload";

/** Links the ID and EN records of one publication (DEC-004). Staff-only. */
export const TranslationGroups: CollectionConfig = {
  slug: "translation-groups",
  admin: {
    useAsTitle: "label",
  },
  access: {
    read: ({ req }) => Boolean(req.user),
    create: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => Boolean(req.user),
  },
  fields: [
    {
      name: "label",
      type: "text",
      required: true,
    },
  ],
};
