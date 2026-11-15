import { createLocalReq, type Payload } from "payload";

/**
 * Server-only. Signed download URL of a publication file (M3-08, DECISIONS
 * §2.14 item 2), through the storage adapter Payload already runs for the
 * collection; no AWS SDK import here, no new dependency.
 *
 * `@payloadcms/storage-s3` 3.93.0 (payload/payload.config.ts, bucket
 * `publication-files`, `signedDownloads: { expiresIn: 60 }`) adds its
 * `staticHandler` to `upload.handlers` of the collection, because Payload
 * access control stays on. Given the file document (`prefix`, `_objectKey`),
 * the handler runs no query and answers `Response.redirect(<signed GET>,
 * 302)` (dist/getFile.js). The caller has already checked access; this only
 * signs. The URL is a bearer credential: return it, never log it.
 *
 * Upgrade review item (DEC-006): the handler order, its arguments and the
 * 302 come from storage-s3 / plugin-cloud-storage 3.93.0 internals; re-check
 * them on every Payload upgrade (tests DL4, DL11).
 */
export type StoredFile = { id: number; filename?: string | null; prefix?: string | null; _objectKey?: string | null };

/**
 * Thrown when no signed URL could be made (no handler, no filename, or the
 * handler did not answer with a redirect). Fixed message and no cause, so
 * nothing of the storage error (keys, bucket, URL) reaches the logs.
 */
export class FileStorageError extends Error {
  constructor() {
    super("File URL could not be signed");
    this.name = "FileStorageError";
  }
}

export async function signedFileUrl(payload: Payload, file: StoredFile): Promise<string> {
  const upload = payload.collections["publication-files"]?.config.upload;
  const handler = upload ? upload.handlers?.[0] : undefined;
  if (typeof handler !== "function" || typeof file.filename !== "string" || file.filename === "") {
    throw new FileStorageError();
  }
  let response: Response | void;
  try {
    const req = await createLocalReq({}, payload);
    response = await handler(req, {
      doc: file,
      headers: new Headers(),
      params: { collection: "publication-files", filename: file.filename },
    });
  } catch {
    throw new FileStorageError();
  }
  const location = response instanceof Response && response.status === 302 ? response.headers.get("location") : null;
  if (!location || !location.startsWith("https://")) throw new FileStorageError();
  return location;
}
