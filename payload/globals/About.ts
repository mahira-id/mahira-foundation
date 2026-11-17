import type { Field, GlobalConfig, TextFieldSingleValidation } from "payload";
import { PUBLIC_ABOUT_READ } from "../access/public-read";
import { isAnonymousLocalRead, isStaff, staffRoleOf } from "../access/roles";
import { SLUG_PATTERN } from "../fields/slug";
import { denyPublicFallbackForGlobal } from "../hooks/deny-public-fallback";
import { aboutPreviewUrl } from "../../lib/publications/preview";

/**
 * About page `/{locale}/about` (M3-09, DECISIONS §2.15 decisions 1, 2 as
 * revised by 13A, 4 + 4b(iii), 6, 7B). One document for both languages:
 * `hero`, `sections` and `seo` are localized (field-level, fallback off);
 * `contactEmail` and `enReady` are shared. One publish status for ID and EN
 * (drafts, draft → publish); the EN page exists only when `enReady` is
 * checked and the required EN fields are filled (lib/about/about-view.ts
 * `isAboutVisible`). Structured plain-text fields, no rich text: paragraphs
 * are separated by a blank line; layout is code. Editor and Admin edit and
 * publish (DEC-016).
 */

/** Section anchors: the slug pattern (lowercase letters, digits, single hyphens). */
const validateAnchor: TextFieldSingleValidation = (value) => {
  if (value === undefined || value === null || value === "") return true;
  return SLUG_PATTERN.test(value) || "Gunakan huruf kecil, angka, dan tanda hubung tunggal (mis. bagian-dua).";
};

/** A section needs a label or a heading (its H2 is the heading, else the label). */
const validateHeading: TextFieldSingleValidation = (value, { siblingData }) => {
  const label: unknown = (siblingData as Record<string, unknown> | undefined)?.label;
  if ((typeof value === "string" && value.trim() !== "") || (typeof label === "string" && label.trim() !== "")) return true;
  return "Isi Label atau Heading bagian ini.";
};

const PARAGRAPHS = "Pisahkan paragraf dengan satu baris kosong.";

/** A call-to-action link; the target is resolved by code from `kind`, never a free URL. */
function ctaField(description: string): Field {
  return {
    name: "ctas",
    type: "array",
    maxRows: 2,
    admin: { description },
    fields: [
      { name: "label", type: "text", required: true },
      {
        name: "kind",
        type: "select",
        required: true,
        options: [
          { label: "Ke bagian halaman ini (anchor)", value: "anchor" },
          { label: "Ke indeks publikasi", value: "publications" },
          { label: "Email kontak (mailto)", value: "email" },
        ],
      },
      {
        name: "anchor",
        type: "text",
        validate: validateAnchor,
        admin: {
          condition: (_data, siblingData) => siblingData?.kind === "anchor",
          description: "Anchor bagian tujuan, sama dengan field Anchor bagian itu.",
        },
      },
    ],
  };
}

export const About: GlobalConfig = {
  slug: "about",
  label: "About",
  admin: {
    description:
      "Halaman /{locale}/about. Satu status terbit untuk ID dan EN; halaman EN hanya tayang bila \"Versi EN siap tayang\" dicentang dan field wajib EN terisi.",
    // DECISIONS §2.15 decision 7B: Preview button -> /api/preview?about=<locale>,
    // which checks the staff session before Draft Mode (app/api/preview/route.ts).
    preview: (_doc, { locale }) => aboutPreviewUrl(locale),
  },
  versions: {
    drafts: true,
    max: 25,
  },
  access: {
    // Staff see everything, drafts included. Public pages read through the
    // server-side Local API and see the published version only; anonymous
    // REST is denied, as for the collections (Owner 2026-11-10, P1 A).
    read: ({ req }) => {
      if (staffRoleOf(req) !== null) return true;
      if (isAnonymousLocalRead(req)) return PUBLIC_ABOUT_READ;
      return false;
    },
    // DEC-016 / decision 6: Editor and Admin edit and publish.
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
        { name: "eyebrow", type: "text" },
        { name: "title", type: "text", required: true, admin: { description: "Judul halaman (H1)." } },
        { name: "lead", type: "textarea", admin: { description: PARAGRAPHS } },
        ctaField("Paling banyak 2 tautan aksi di bawah judul."),
      ],
    },
    {
      name: "sections",
      type: "array",
      localized: true,
      admin: { description: "Bagian halaman sesuai urutan tampil." },
      fields: [
        {
          name: "anchor",
          type: "text",
          validate: validateAnchor,
          admin: { description: "Opsional: id bagian untuk tautan #anchor (huruf kecil, angka, tanda hubung)." },
        },
        { name: "label", type: "text", admin: { description: "Judul bagian." } },
        {
          name: "heading",
          type: "text",
          admin: { description: "Subjudul bagian. Wajib diisi bila Label kosong." },
          validate: validateHeading,
        },
        { name: "body", type: "textarea", admin: { description: PARAGRAPHS } },
        { name: "quote", type: "textarea", admin: { description: "Kutipan sorotan (opsional)." } },
        {
          name: "lists",
          type: "array",
          fields: [
            { name: "heading", type: "text" },
            { name: "intro", type: "textarea", admin: { description: PARAGRAPHS } },
            {
              name: "style",
              type: "select",
              required: true,
              defaultValue: "bulleted",
              options: [
                { label: "Bernomor", value: "numbered" },
                { label: "Butir", value: "bulleted" },
              ],
            },
            {
              name: "items",
              type: "array",
              fields: [
                { name: "title", type: "text", admin: { description: "Judul butir atau kata pembuka tebal." } },
                { name: "subtitle", type: "text", admin: { description: "Sub-label tebal (opsional)." } },
                { name: "text", type: "textarea" },
              ],
            },
          ],
        },
        { name: "outro", type: "textarea", admin: { description: `Paragraf penutup setelah daftar. ${PARAGRAPHS}` } },
        ctaField("Paling banyak 2 tautan aksi di akhir bagian."),
      ],
    },
    {
      name: "seo",
      type: "group",
      localized: true,
      fields: [
        { name: "title", type: "text", required: true, admin: { description: "Isi <title> halaman." } },
        { name: "description", type: "textarea", required: true, admin: { description: "Meta description." } },
      ],
    },
    {
      // Shared by both locales; the "email" CTAs link here (mailto).
      name: "contactEmail",
      type: "email",
    },
    {
      // DECISIONS §2.15 decision 4b(iii): the EN page needs this box.
      name: "enReady",
      type: "checkbox",
      label: "Versi EN siap tayang",
      defaultValue: false,
      admin: {
        position: "sidebar",
        description: "Centang bila teks English sudah lengkap. Tanpa centang, /en/about tidak tayang walau dokumen terbit.",
      },
    },
  ],
};
