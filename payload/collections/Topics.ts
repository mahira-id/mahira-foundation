import type { CollectionConfig } from "payload";
import { slugField } from "../fields/slug";

export const Topics: CollectionConfig = {
  slug: "topics",
  admin: {
    useAsTitle: "name",
  },
  access: {
    read: () => true,
    create: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => Boolean(req.user),
  },
  fields: [
    {
      name: "name",
      type: "text",
      required: true,
      localized: true,
    },
    slugField,
    {
      name: "description",
      type: "textarea",
      localized: true,
    },
  ],
};
