import type { CollectionConfig } from "payload";
import { PUBLIC_TOOLKIT_FILE_READ } from "../access/public-read";
import { isAnonymousLocalRead, isStaff, staffRoleOf } from "../access/roles";
import {
  refuseLiveToolkitFileDelete,
  refuseLiveToolkitFileReplacement,
  refuseOversizedFile,
  setFileStatus,
} from "../hooks/publication-files";

/**
 * Toolkit files (M3-13, DECISIONS §2.16 decision 9, §2.17 decisions 1A–5A;
 * DATA-MODEL §4.5 "Toolkit"): the PDF files of a Learning Hub toolkit, in
 * the same private Supabase bucket as publication files
 * (`publication-files`), under the prefix `toolkits/`
 * (payload/payload.config.ts). Same machinery as `publication-files`
 * (payload/collections/PublicationFiles.ts) without an access level: all
 * Learning Hub material is public (DEC-014).
 *
 * - A file belongs to exactly one toolkit; the toolkit lists its files in
 *   order (`LearningResources.files`, one list for ID and EN, hook
 *   refuseFileOfAnotherToolkit). The label is localized (ID/EN); `language`
 *   ("Bahasa dokumen") is the language of the PDF itself.
 * - No versions: label and language edits apply at once. The content of a
 *   file on a live toolkit cannot be replaced or deleted (decision 4A,
 *   payload/hooks/publication-files.ts).
 * - Visitors never get a storage URL: the toolkit page links to
 *   `/api/learning-hub/files/{id}/download?locale=…`, which checks the file
 *   and its toolkit on the server and answers 307 to a 60 s signed
 *   attachment URL (app/api/learning-hub/files/[fileId]/download). Staff
 *   open files in /admin through `/api/toolkit-files/file/<name>` (signed
 *   302 from the adapter, staff read access below).
 */
export const ToolkitFiles: CollectionConfig = {
  slug: "toolkit-files",
  labels: { singular: "File toolkit", plural: "File toolkit" },
  admin: {
    useAsTitle: "label",
    defaultColumns: ["label", "language", "status", "filename", "updatedAt"],
  },
  access: {
    // Staff see every file. Public pages read through the server-side Local
    // API and see ready files only; anonymous REST is denied (P1 A), which
    // also closes `/api/toolkit-files/file/<name>`. GraphQL is disabled.
    read: ({ req }) => {
      if (staffRoleOf(req) !== null) return true;
      if (isAnonymousLocalRead(req)) return PUBLIC_TOOLKIT_FILE_READ;
      return false;
    },
    create: isStaff,
    update: isStaff,
    delete: isStaff,
  },
  upload: {
    // PDF only (decision 9), with Payload's content check as for publication files.
    mimeTypes: ["application/pdf"],
  },
  hooks: {
    beforeChange: [setFileStatus, refuseOversizedFile, refuseLiveToolkitFileReplacement],
    beforeDelete: [refuseLiveToolkitFileDelete],
  },
  fields: [
    {
      // Decision 3A: one label per locale; a locale shows the file only with its label.
      name: "label",
      type: "text",
      required: true,
      localized: true,
      admin: { description: "Nama file yang tampil di halaman toolkit, mis. \"Panduan lengkap\". Isi untuk ID dan EN." },
    },
    {
      name: "language",
      type: "select",
      label: "Bahasa dokumen",
      required: true,
      options: [
        { label: "Bahasa Indonesia", value: "id" },
        { label: "English", value: "en" },
      ],
      admin: { description: "Bahasa isi PDF; tampil sebagai label di kedua versi bahasa." },
    },
    {
      // System-set (setFileStatus); clients cannot write it.
      name: "status",
      type: "select",
      required: true,
      defaultValue: "ready",
      options: [
        { label: "Pending", value: "pending" },
        { label: "Ready", value: "ready" },
        { label: "Failed", value: "failed" },
        { label: "Quarantined", value: "quarantined" },
        { label: "Archived", value: "archived" },
      ],
      access: {
        create: () => false,
        update: () => false,
      },
      admin: {
        readOnly: true,
        position: "sidebar",
        description: "Diisi sistem. Hanya file berstatus ready yang tampil dan dapat diunduh.",
      },
    },
  ],
};
