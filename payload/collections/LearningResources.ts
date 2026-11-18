import type { CollectionConfig, TextFieldSingleValidation } from "payload";
import { PUBLIC_LEARNING_RESOURCE_READ } from "../access/public-read";
import { isAdmin, isAnonymousLocalRead, isStaff, staffRoleOf } from "../access/roles";
import { SLUG_PATTERN } from "../fields/slug";
import { structuredSectionsField } from "../fields/structured-sections";
import { denyPublicFallback } from "../hooks/deny-public-fallback";
import { normalizeYouTubeSource, requireReadyToolkitFile, setResourcePublishedAt } from "../hooks/learning-resources";
import { refuseFileOfAnotherToolkit } from "../hooks/one-publication-per-file";
import { isYouTubeId } from "../../lib/learning-hub/youtube";
import { resourcePreviewUrl } from "../../lib/publications/preview";

/**
 * Learning Hub resource (M3-11, DECISIONS §2.16; DEC-014 launch scope).
 *
 * One record per resource for both languages, field-level localized with
 * fallback off (like About and Topic, decision 5A; unlike publications,
 * DEC-004 linked records): `title`, `summary`, `slug` and `sections` are
 * localized, everything else is shared. One publish status for ID and EN
 * (drafts, DEC-015); a locale shows the record only when that locale's
 * required fields are filled, and EN also needs "Versi EN siap tayang"
 * (lib/learning-hub/catalog-view.ts `isResourceVisible`).
 *
 * Types (decision 2A): `video` (one YouTube video) and `playlist` (a
 * YouTube playlist) play in the catalog and have no detail page; `guide`
 * (a structured text page, the About section model, decision 3A) and
 * `toolkit` (file + description) have detail pages
 * `/{locale}/learning-hub/{slug}` (decision 7A; slug unique per locale).
 * Since M3-13 (DECISIONS §2.17) a toolkit lists its PDF files in `files`
 * (one ordered list for ID and EN, each file in one toolkit only) and is
 * published only with a ready file. Theme = one primary Topic
 * ("Bidang kerja", decision 4A). Editor and Admin edit and publish
 * (DEC-016); only Admin deletes.
 */
const TYPES = [
  { label: "Video YouTube", value: "video" },
  { label: "Playlist YouTube", value: "playlist" },
  { label: "Panduan", value: "guide" },
  { label: "Toolkit", value: "toolkit" },
];

type Sibling = Record<string, unknown> | undefined;

function typeOf(data: unknown, siblingData: unknown): unknown {
  return (data as Sibling)?.type ?? (siblingData as Sibling)?.type;
}

const hasDetailPage = (type: unknown) => type === "guide" || type === "toolkit";
const isYouTube = (type: unknown) => type === "video" || type === "playlist";

/** Guides and toolkits need a URL slug in the locale being saved; videos and playlists ignore it. */
const validateResourceSlug: TextFieldSingleValidation = (value, { data, siblingData }) => {
  const filled = typeof value === "string" && value !== "";
  if (!filled) return hasDetailPage(typeOf(data, siblingData)) ? "Slug wajib untuk panduan dan toolkit." : true;
  return SLUG_PATTERN.test(value) || "Gunakan huruf kecil, angka, dan tanda hubung tunggal (mis. panduan-anggaran).";
};

/**
 * On publish, a video or playlist needs its ID. The save hook
 * (normalizeYouTubeSource) already turned the pasted URL into the ID and
 * refused anything else, also on draft saves; this repeats the ID check.
 */
const validateYouTubeId: TextFieldSingleValidation = (value, { data, siblingData }) => {
  const type = typeOf(data, siblingData);
  if (!isYouTube(type)) return true;
  if (typeof value !== "string" || value === "") return "Tempel URL YouTube untuk video atau playlist ini.";
  return isYouTubeId(type as "video" | "playlist", value) || "ID YouTube tidak valid.";
};

export const LearningResources: CollectionConfig = {
  slug: "learning-resources",
  // Table base name: with "learning_resources" the version table of the
  // section list items gets a 64-character index name, past Postgres's
  // 63-character limit (Payload warns and Postgres truncates it).
  dbName: "lh_resources",
  labels: { singular: "Materi Learning Hub", plural: "Materi Learning Hub" },
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "type", "topic", "_status", "enReady", "updatedAt"],
    description:
      "Materi /{locale}/learning-hub. Satu record untuk ID dan EN; versi EN hanya tayang bila \"Versi EN siap tayang\" dicentang dan judul serta ringkasan EN terisi. Toolkit belum tampil di situs sampai M3-13.",
    // Decision 12A: Preview button of a guide -> /api/preview?resource=<id>&locale=<l>,
    // which checks the staff session before Draft Mode (app/api/preview/route.ts).
    preview: (doc, { locale }) => resourcePreviewUrl(doc, locale),
  },
  versions: {
    drafts: true,
    maxPerDoc: 25,
  },
  access: {
    // Staff see everything, drafts included. Public pages read through the
    // server-side Local API: published records of a public type only; anonymous
    // REST is denied (Owner 2026-11-10, P1 A). GraphQL is disabled in the config.
    read: ({ req }) => {
      if (staffRoleOf(req) !== null) return true;
      if (isAnonymousLocalRead(req)) return PUBLIC_LEARNING_RESOURCE_READ;
      return false;
    },
    create: isStaff,
    update: isStaff,
    readVersions: isStaff,
    delete: isAdmin,
  },
  hooks: {
    beforeOperation: [denyPublicFallback],
    // M3-13 (DECISIONS §2.17 decisions 1A, 2A): publish needs a ready file; a file belongs to one toolkit.
    beforeChange: [normalizeYouTubeSource, setResourcePublishedAt, requireReadyToolkitFile, refuseFileOfAnotherToolkit],
  },
  fields: [
    {
      name: "type",
      type: "select",
      label: "Jenis materi",
      required: true,
      options: TYPES,
      admin: { description: "Video dan playlist diputar di katalog; panduan dan toolkit punya halaman sendiri." },
    },
    {
      name: "title",
      type: "text",
      label: "Judul",
      required: true,
      localized: true,
    },
    {
      name: "summary",
      type: "textarea",
      label: "Ringkasan",
      required: true,
      localized: true,
      admin: { description: "Tampil di kartu katalog dan sebagai meta description halaman panduan." },
    },
    {
      // Unique per locale: Payload indexes (slug, _locale) of the locales table.
      name: "slug",
      type: "text",
      localized: true,
      unique: true,
      index: true,
      validate: validateResourceSlug,
      admin: {
        condition: (data) => hasDetailPage(data?.type),
        description:
          "URL halaman: /id/learning-hub/<slug> atau /en/learning-hub/<slug>. Jangan diubah setelah terbit: belum ada pengalihan dari slug lama.",
      },
    },
    {
      name: "materialLanguage",
      type: "select",
      label: "Bahasa materi",
      required: true,
      options: [
        { label: "Bahasa Indonesia", value: "id" },
        { label: "English", value: "en" },
      ],
      admin: { description: "Bahasa materinya sendiri (video, panduan, file); tampil sebagai label di kedua versi bahasa." },
    },
    {
      // Decision 4A: one primary theme, an existing Topic ("Bidang kerja"); inactive Topic = resource hidden.
      name: "topic",
      type: "relationship",
      label: "Bidang kerja",
      relationTo: "topics",
      required: true,
      admin: { description: "Tema utama. Materi hanya tampil bila bidang kerjanya aktif." },
    },
    {
      // Decision 8A: the editor pastes a URL; normalizeYouTubeSource stores only the ID.
      name: "youtubeId",
      type: "text",
      label: "URL YouTube",
      validate: validateYouTubeId,
      admin: {
        condition: (data) => isYouTube(data?.type),
        description: "Tempel URL video atau playlist YouTube. Yang disimpan hanya ID-nya.",
      },
    },
    {
      // A playlist has no thumbnail without the YouTube API: an uploaded image, else the typographic cover.
      name: "coverImage",
      type: "upload",
      label: "Gambar sampul playlist",
      relationTo: "media",
      admin: {
        condition: (data) => data?.type === "playlist",
        description: "Opsional. Tanpa gambar, kartu memakai sampul tipografi.",
      },
    },
    {
      // M3-13 decisions 1A, 3A: the toolkit's PDFs in display order, one list
      // for ID and EN (not localized), versioned with drafts, so a file added
      // in a draft is not live until the toolkit is published. A file belongs
      // to one toolkit only (refuseFileOfAnotherToolkit).
      name: "files",
      type: "upload",
      label: "File toolkit",
      relationTo: "toolkit-files",
      hasMany: true,
      admin: {
        condition: (data) => data?.type === "toolkit",
        description:
          "File PDF toolkit sesuai urutan tampil, dipakai untuk ID dan EN. Satu file hanya untuk satu toolkit. Terbit butuh minimal satu file ready.",
      },
    },
    {
      ...structuredSectionsField(),
      admin: {
        condition: (data) => hasDetailPage(data?.type),
        description: "Isi halaman panduan atau toolkit, sesuai urutan tampil.",
      },
    },
    {
      name: "sortOrder",
      type: "number",
      label: "Urutan",
      admin: {
        position: "sidebar",
        description: "Opsional. Angka kecil tampil lebih dulu dalam bidang kerjanya; tanpa angka: setelahnya, terbaru dulu.",
      },
    },
    {
      name: "publishedAt",
      type: "date",
      label: "Tanggal terbit",
      admin: {
        position: "sidebar",
        description: "Diisi otomatis saat terbit bila kosong; boleh diubah. Mengurutkan materi terbaru.",
      },
    },
    {
      // Decision 5A (the About 4b(iii) pattern): the EN version needs this box.
      name: "enReady",
      type: "checkbox",
      label: "Versi EN siap tayang",
      defaultValue: false,
      admin: {
        position: "sidebar",
        description: "Centang bila judul dan ringkasan English sudah lengkap. Tanpa centang, materi ini tidak tampil di /en/learning-hub.",
      },
    },
  ],
};
