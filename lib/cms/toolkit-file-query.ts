import type { Payload } from "payload";

/**
 * Server-only. Local API query of the toolkit download route (M3-13,
 * DECISIONS §2.16 decision 9, §2.17 decision 5A). An anonymous read, like
 * lib/cms/public-content.ts: no `user`, `overrideAccess: false`, so Payload
 * access control limits `toolkit-files` to ready files
 * (PUBLIC_TOOLKIT_FILE_READ). `payload` is only the `find` method, so unit
 * tests pass a fake.
 */
type FindPort = Pick<Payload, "find">;

/**
 * The toolkit file by id, with the storage location the signer needs, or
 * null. The location fields stay on the server: the route only answers
 * with the signed URL in `Location`.
 */
export async function findPublicToolkitFile(payload: FindPort, id: number) {
  const result = await payload.find({
    collection: "toolkit-files",
    where: { id: { equals: id } },
    limit: 1,
    pagination: false,
    depth: 0,
    select: { filename: true, prefix: true, _objectKey: true, mimeType: true, status: true },
    fallbackLocale: false,
    overrideAccess: false,
  });
  return result.docs[0] ?? null;
}
