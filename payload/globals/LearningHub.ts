import type { GlobalConfig } from "payload";
import { PUBLIC_LEARNING_HUB_READ } from "../access/public-read";
import { isAnonymousLocalRead, isStaff, staffRoleOf } from "../access/roles";
import { PARAGRAPHS } from "../fields/structured-sections";
import { denyPublicFallbackForGlobal } from "../hooks/deny-public-fallback";

/**
 * Texts of the Learning Hub catalog `/{locale}/learning-hub` (M3-12,
 * DECISIONS §2.16 decision 10A): the H1, the intro and the SEO fields,
 * localized (field-level, fallback off). The Owner writes them; agents write
 * no intro text. Read published-only, like About. The global does not
 * decide whether a catalog exists: a locale's catalog exists only with at
 * least one visible resource (decision 11A). Without a published H1 in a
 * locale the page shows "Learning Hub". Editor and Admin edit and publish
 * (DEC-016). No preview: the catalog is checked after publishing.
 */
export const LearningHub: GlobalConfig = {
  slug: "learning-hub",
  label: "Learning Hub",
  admin: {
    description:
      "Judul (H1), pengantar, dan SEO halaman /{locale}/learning-hub. Katalog suatu bahasa hanya tayang bila ada minimal satu materi yang tampil dalam bahasa itu. Periksa Locale di pojok kanan atas sebelum mengetik.",
  },
  versions: {
    drafts: true,
    max: 25,
  },
  access: {
    read: ({ req }) => {
      if (staffRoleOf(req) !== null) return true;
      if (isAnonymousLocalRead(req)) return PUBLIC_LEARNING_HUB_READ;
      return false;
    },
    update: isStaff,
    readVersions: isStaff,
  },
  hooks: {
    beforeOperation: [denyPublicFallbackForGlobal],
  },
  fields: [
    {
      name: "hero",
      type: "group",
      localized: true,
      fields: [
        { name: "title", type: "text", required: true, admin: { description: "Judul halaman (H1). Kosong atau belum terbit: \"Learning Hub\"." } },
        { name: "intro", type: "textarea", admin: { description: `Pengantar di bawah judul. ${PARAGRAPHS}` } },
      ],
    },
    {
      name: "seo",
      type: "group",
      localized: true,
      fields: [
        { name: "title", type: "text", admin: { description: "Isi <title> halaman. Kosong: judul halaman." } },
        { name: "description", type: "textarea", admin: { description: "Meta description. Kosong: paragraf pertama pengantar." } },
      ],
    },
  ],
};
