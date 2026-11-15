import type { Payload } from "payload";

import type { Locale } from "@/lib/i18n/locales";

/**
 * Server-only. Local API query of the slug history `publication-slugs`
 * (M3-07, DECISIONS §2.11 P9 A). Anonymous read, like
 * lib/cms/public-content.ts: no `user`, `overrideAccess: false`. `payload`
 * is only the `find` method, so unit tests pass a fake.
 */
type FindPort = Pick<Payload, "find">;

/**
 * Id of the record that owns the URL `/{locale}/publications/{slug}` in the
 * slug history (the last record that published it as public), or null. Says
 * nothing about the record's current state: the caller reads it as an
 * anonymous visitor (findPublicRef).
 */
export async function findSlugOwner(payload: FindPort, locale: Locale, slug: string): Promise<number | null> {
  const result = await payload.find({
    collection: "publication-slugs",
    where: { and: [{ locale: { equals: locale } }, { slug: { equals: slug } }] },
    select: { publication: true },
    depth: 0,
    limit: 1,
    pagination: false,
    overrideAccess: false,
  });
  const owner = result.docs[0]?.publication;
  if (typeof owner === "number") return owner;
  return owner && typeof owner === "object" && typeof owner.id === "number" ? owner.id : null;
}
