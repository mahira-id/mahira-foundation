import type { CollectionConfig } from "payload";
import { publicFileRead } from "../access/public-read";
import { isAnonymousLocalRead, isStaff, staffRoleOf } from "../access/roles";
import {
  refuseLiveFileDelete,
  refuseLiveFileReplacement,
  refuseOversizedFile,
  setFileStatus,
} from "../hooks/publication-files";

/**
 * Publication files (M3-08, DECISIONS §2.14; DATA-MODEL §4.2 Publication
 * Asset): PDF documents of one publication record, stored in the private
 * Supabase bucket `publication-files` through @payloadcms/storage-s3
 * (payload/payload.config.ts). Separate from `media` (covers stay public).
 *
 * - A file belongs to exactly one publication record; the record lists its
 *   files in order (`Publications.files`, hook
 *   payload/hooks/one-publication-per-file.ts). Not a DEC-004 shared field.
 * - `accessLevel` is required, has no default and stores all three levels
 *   from the start (DEC-011). The effective level is the stricter of the
 *   publication and the file (lib/publications/file-access.ts). `public`
 *   files download for everyone (M3-08); `registered` files show locked and
 *   download only with a verified public session (M5-04, DECISIONS §2.18
 *   decisions 11 and 12, while accounts are on); `subscriber` files stay
 *   hidden on the public site until M7.
 * - No versions: label, kind, language and Access Level edits apply at once.
 *   The content of a file on a live publication cannot be replaced or
 *   deleted (item 8, payload/hooks/publication-files.ts).
 * - Visitors never get a storage URL: the detail page links to
 *   `/api/files/{id}/download`, which checks access on the server and
 *   answers 307 to a 60 s signed URL (app/api/files/[fileId]/download).
 *   Staff open files in /admin through `/api/publication-files/file/<name>`,
 *   under the read access below (signed 302 from the adapter).
 */
export const PublicationFiles: CollectionConfig = {
  slug: "publication-files",
  admin: {
    useAsTitle: "label",
    defaultColumns: ["label", "kind", "language", "accessLevel", "status", "filename", "updatedAt"],
  },
  access: {
    // Staff see every file. Public pages read through the server-side Local
    // API and see ready files of a public access level only (`public`, and
    // `registered` while accounts are on; never `subscriber`); anonymous
    // REST and GraphQL are denied (P1 A), which also closes
    // `/api/publication-files/file/<name>`.
    read: ({ req }) => {
      if (staffRoleOf(req) !== null) return true;
      if (isAnonymousLocalRead(req)) return publicFileRead();
      return false;
    },
    create: isStaff,
    update: isStaff,
    delete: isStaff,
  },
  upload: {
    // PDF only. Payload also checks the content (file-type detection plus
    // the `%PDF-` header and the `%%EOF`/`xref` trailer), also for client
    // uploads, whose bytes the server reads back from the bucket.
    mimeTypes: ["application/pdf"],
  },
  hooks: {
    beforeChange: [setFileStatus, refuseOversizedFile, refuseLiveFileReplacement],
    beforeDelete: [refuseLiveFileDelete],
  },
  fields: [
    {
      name: "label",
      type: "text",
      required: true,
      admin: { description: "Nama file yang tampil di halaman publikasi, mis. \"Laporan lengkap\"." },
    },
    {
      // DATA-MODEL §4.2 `kind` without `cover` (covers are Media).
      name: "kind",
      type: "select",
      required: true,
      options: [
        { label: "Preview", value: "preview" },
        { label: "Full document", value: "full_document" },
        { label: "Appendix", value: "appendix" },
        { label: "Dataset", value: "dataset" },
        { label: "Supplementary", value: "supplementary" },
        { label: "Other", value: "other" },
      ],
    },
    {
      // Language of the document itself; may differ from the publication record.
      name: "language",
      type: "select",
      required: true,
      options: [
        { label: "Bahasa Indonesia", value: "id" },
        { label: "English", value: "en" },
      ],
    },
    {
      // No default: every file needs an explicit access decision (DEC-011).
      name: "accessLevel",
      type: "select",
      required: true,
      options: [
        { label: "Public", value: "public" },
        { label: "Registered", value: "registered" },
        { label: "Subscriber", value: "subscriber" },
      ],
      admin: {
        description:
          "Akses efektif = level yang lebih ketat antara publikasi dan file. File registered tampil terkunci dan hanya dapat diunduh dengan akun publik terverifikasi (saat akun publik aktif). File subscriber belum tampil di situs sampai M7.",
      },
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
        description: "Diisi sistem. Hanya file berstatus ready yang dapat diunduh.",
      },
    },
  ],
};
