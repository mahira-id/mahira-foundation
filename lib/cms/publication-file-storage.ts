import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { sanitizeFilename } from "payload/shared";

import { attachmentDisposition } from "@/lib/publications/file-download";
import { readCmsEnv } from "@/payload/env";
import { FILES_BUCKET, SIGNED_DOWNLOAD_TTL_SECONDS, storageClientConfig } from "@/payload/storage";

/**
 * Server-only. Signed download URL of a publication file (M3-08, DECISIONS
 * §2.14 items 2 and 6; Owner 2026-11-16: force the download).
 *
 * Signs a GET of the private bucket `publication-files` with the AWS SDK
 * presigner, against the S3 endpoint of the APP project's Supabase Storage,
 * with the client config the storage adapter uses (payload/storage.ts; same
 * five CMS env vars). The URL is valid for SIGNED_DOWNLOAD_TTL_SECONDS and
 * carries `response-content-disposition` = attachmentDisposition(stored
 * name), so storage answers `Content-Disposition: attachment` and the
 * browser saves the PDF instead of opening it inline (SPIKE-003 §11). The
 * caller has already checked access; this only signs. The URL is a bearer
 * credential: return it, never log it. Staff downloads in /admin still go
 * through the adapter's own handler (inline, Bucket + Key only).
 *
 * Upgrade review item (DEC-006): the object key repeats how
 * plugin-cloud-storage 3.93.0 reads a stored file (getFilePrefix +
 * buildStoragePathData: `<prefix>/<_objectKey>/<filename>`, each part
 * cleaned as there); re-check it on every Payload upgrade (tests FU11, DL4,
 * DL12).
 */
export type StoredFile = { id: number; filename?: string | null; prefix?: string | null; _objectKey?: string | null };

/**
 * Thrown when no signed URL could be made (CMS env missing, no or invalid
 * filename, or the presigner failed). Fixed message and no cause, so
 * nothing of the storage error (keys, bucket, URL) reaches the logs.
 */
export class FileStorageError extends Error {
  constructor() {
    super("File URL could not be signed");
    this.name = "FileStorageError";
  }
}

/** `sanitizePrefix` of plugin-cloud-storage 3.93.0 (dist/utilities/sanitizePrefix.js). */
function sanitizePrefix(prefix: string): string {
  let decoded: string;
  try {
    decoded = decodeURIComponent(prefix);
  } catch {
    return "";
  }
  if (/%[0-9a-f]{2}/i.test(decoded)) return "";
  return decoded
    .replace(/[\x00-\x1f\x80-\x9f]/g, "")
    .replace(/\\/g, "/")
    .split("/")
    .filter((segment) => segment && segment !== ".." && segment !== ".")
    .join("/")
    .replace(/^\/+/, "");
}

/** Folder of a stored object: `buildPrefixWithObjectKey` of plugin-cloud-storage 3.93.0. */
function objectFolder(file: StoredFile): string {
  const prefix = sanitizePrefix(file.prefix ?? "");
  const objectKey = sanitizePrefix(file._objectKey ?? "");
  return prefix && objectKey ? `${prefix}/${objectKey}` : prefix || objectKey;
}

let client: S3Client | undefined;

/** One S3 client per process, built from the CMS env on first use. */
function storageClient(): S3Client {
  if (!client) {
    const cms = readCmsEnv();
    if (!cms) throw new FileStorageError();
    client = new S3Client(storageClientConfig(cms));
  }
  return client;
}

/**
 * The signed GET URL of a stored publication file. `s3` is for unit tests
 * (offline signing with fake keys); the app uses the process client.
 */
export async function signedFileUrl(file: StoredFile, s3?: S3Client): Promise<string> {
  let url: string;
  try {
    if (typeof file.filename !== "string" || file.filename === "") throw new FileStorageError();
    // Same cleaning as the adapter's read path; throws on a name with nothing left.
    const name = sanitizeFilename(file.filename);
    const folder = sanitizePrefix(objectFolder(file));
    const command = new GetObjectCommand({
      Bucket: FILES_BUCKET,
      Key: folder ? `${folder}/${name}` : name,
      ResponseContentDisposition: attachmentDisposition(name),
    });
    url = await getSignedUrl(s3 ?? storageClient(), command, { expiresIn: SIGNED_DOWNLOAD_TTL_SECONDS });
  } catch {
    throw new FileStorageError();
  }
  if (!url.startsWith("https://")) throw new FileStorageError();
  return url;
}
