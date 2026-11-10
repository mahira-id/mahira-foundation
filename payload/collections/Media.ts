import type { CollectionConfig } from "payload";

/**
 * Public files (M2-03, DEC-012). Files are stored in Supabase Storage through
 * @payloadcms/storage-s3 on a public bucket; nothing is written to the
 * application filesystem (no staticDir). Gated/private assets are M5 and do
 * not belong in this collection.
 */
export const Media: CollectionConfig = {
  slug: "media",
  access: {
    read: () => true,
    create: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => Boolean(req.user),
  },
  upload: {
    mimeTypes: ["application/pdf", "image/png", "image/jpeg", "image/webp"],
  },
  fields: [
    {
      name: "alt",
      type: "text",
      required: true,
    },
  ],
};
