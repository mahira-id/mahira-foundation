import type { Payload } from "payload";

/**
 * Server-only. Local API queries of the public download route (M3-08,
 * DECISIONS §2.14 items 2 and 6). Anonymous reads, like
 * lib/cms/public-content.ts: no `user`, `overrideAccess: false`, so Payload
 * access control limits files to ready + public (PUBLIC_FILE_READ) and
 * publications to published + public (PUBLIC_PUBLICATION_READ). `payload`
 * is only the `find` method, so unit tests pass a fake.
 */
type FindPort = Pick<Payload, "find">;

/**
 * The file by id, with the storage location the signer needs, or null.
 * The location fields stay on the server: the route only answers with the
 * signed URL in `Location`.
 */
export async function findPublicFile(payload: FindPort, id: number) {
  const result = await payload.find({
    collection: "publication-files",
    where: { id: { equals: id } },
    limit: 1,
    pagination: false,
    depth: 0,
    select: { filename: true, prefix: true, _objectKey: true, mimeType: true, status: true, accessLevel: true },
    fallbackLocale: false,
    overrideAccess: false,
  });
  return result.docs[0] ?? null;
}

/**
 * The publication record whose live version lists the file, when visitors
 * can see it (published + public), or null. `draft: false` reads the main
 * table, so a file listed only in a draft (a never-published record or a
 * pending revision) finds nothing. A file belongs to one record only
 * (payload/hooks/one-publication-per-file.ts).
 */
export async function findLivePublicationOfFile(payload: FindPort, id: number) {
  const result = await payload.find({
    collection: "publications",
    where: { files: { equals: id } },
    limit: 1,
    pagination: false,
    depth: 0,
    select: { accessLevel: true },
    fallbackLocale: false,
    draft: false,
    overrideAccess: false,
  });
  return result.docs[0] ?? null;
}
