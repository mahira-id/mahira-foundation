import type { Payload } from "payload";
import type { Publication } from "@/payload/payload-types";

type PublicationRef = Pick<Publication, "id" | "translationGroup" | "locale" | "slug">;

/**
 * Server-only. Hreflang alternates for a publication (ADR-0004, ADR-0005):
 * only published records of the same Translation Group, read as an anonymous
 * visitor. Returns `{}` unless the publication itself is published and at
 * least one other locale is published too. Values are paths; the canonical
 * host (metadataBase) is M3-07.
 */
export async function getPublicationAlternates(
  payload: Payload,
  publication: PublicationRef,
): Promise<Partial<Record<Publication["locale"], string>>> {
  const groupId =
    typeof publication.translationGroup === "object" ? publication.translationGroup.id : publication.translationGroup;

  const result = await payload.find({
    collection: "publications",
    where: {
      and: [{ translationGroup: { equals: groupId } }, { _status: { equals: "published" } }],
    },
    depth: 0,
    limit: 10,
    overrideAccess: false,
  });

  const docs = result.docs;
  const includesSelf = docs.some((doc) => doc.id === publication.id);
  const hasOtherLocale = docs.some((doc) => doc.locale !== publication.locale);
  if (!includesSelf || !hasOtherLocale) return {};

  const alternates: Partial<Record<Publication["locale"], string>> = {};
  for (const doc of docs) {
    alternates[doc.locale] = `/${doc.locale}/publications/${doc.slug}`;
  }
  return alternates;
}
