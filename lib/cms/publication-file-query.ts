import type { Payload } from "payload";

/**
 * Server-only. Local API queries of the public download route (M3-08,
 * DECISIONS §2.14 items 2 and 6; M5-04). Anonymous reads, like
 * lib/cms/public-content.ts: no `user`, `overrideAccess: false`, so Payload
 * access control limits files to ready ones of a public access level
 * (publicFileRead) and publications to published ones of a public access
 * level (publicPublicationRead): `public`, and `registered` while accounts
 * are on; never `subscriber`. `payload` is only the `find` method, so unit
 * tests pass a fake.
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
 * can see it, or null: its Access Level, and its locale and slug for the
 * login return path of a `registered` file (M5-04). `draft: false` reads
 * the main table, so a file listed only in a draft (a never-published
 * record or a pending revision) finds nothing. A file belongs to one record
 * only (payload/hooks/one-publication-per-file.ts).
 */
export async function findLivePublicationOfFile(payload: FindPort, id: number) {
  const result = await payload.find({
    collection: "publications",
    where: { files: { equals: id } },
    limit: 1,
    pagination: false,
    depth: 0,
    select: { accessLevel: true, locale: true, slug: true },
    fallbackLocale: false,
    draft: false,
    overrideAccess: false,
  });
  return result.docs[0] ?? null;
}
