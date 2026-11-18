import type { ArrayField, Field, TextFieldSingleValidation } from "payload";
import { SLUG_PATTERN } from "./slug";

/**
 * The structured text section model of the About page (M3-09, DECISIONS
 * §2.15 decision 2 as revised by 13A; DATA-MODEL §4.6.1), shared since
 * M3-11 with the Learning Hub guides (DECISIONS §2.16 decision 3A): a
 * localized array of sections with a label/heading, paragraphs, an optional
 * quote, numbered or bulleted lists and an outro. Plain text only (no rich
 * text, no images); paragraphs are separated by a blank line; layout is code.
 *
 * `structuredSectionsField()` returns exactly the field About had before
 * M3-11 (same names, types, order, descriptions and validations), so the
 * About schema and its stored data do not change; About passes its CTA
 * array as `ctas` (kept last), guides pass none.
 */

/** Section anchors: the slug pattern (lowercase letters, digits, single hyphens). */
export const validateAnchor: TextFieldSingleValidation = (value) => {
  if (value === undefined || value === null || value === "") return true;
  return SLUG_PATTERN.test(value) || "Gunakan huruf kecil, angka, dan tanda hubung tunggal (mis. bagian-dua).";
};

/** A section needs a label or a heading (its H2 is the heading, else the label). */
export const validateHeading: TextFieldSingleValidation = (value, { siblingData }) => {
  const label: unknown = (siblingData as Record<string, unknown> | undefined)?.label;
  if ((typeof value === "string" && value.trim() !== "") || (typeof label === "string" && label.trim() !== "")) return true;
  return "Isi Label atau Heading bagian ini.";
};

export const PARAGRAPHS = "Pisahkan paragraf dengan satu baris kosong.";

export function structuredSectionsField(options: { ctas?: Field } = {}): ArrayField {
  return {
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
      ...(options.ctas ? [options.ctas] : []),
    ],
  };
}
