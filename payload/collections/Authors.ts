import type { CollectionConfig } from "payload";
import { slugField } from "../fields/slug";

export const Authors: CollectionConfig = {
  slug: "authors",
  admin: {
    useAsTitle: "displayName",
  },
  access: {
    read: () => true,
    create: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => Boolean(req.user),
  },
  fields: [
    {
      // A person's name is the same in every language (DEC-004).
      name: "displayName",
      type: "text",
      required: true,
    },
    slugField,
    {
      name: "biography",
      type: "textarea",
      localized: true,
    },
  ],
};
