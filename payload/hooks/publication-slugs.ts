import type { CollectionAfterChangeHook, CollectionBeforeDeleteHook } from "payload";
import { isLocale } from "../../lib/i18n/locales";
import { PUBLIC_PUBLICATION_READ } from "../access/public-read";
import { SLUG_PATTERN } from "../fields/slug";

type RelationValue = number | string | { id: number | string } | null | undefined;

function idOf(value: RelationValue): string | null {
  if (value === null || value === undefined) return null;
  return String(typeof value === "object" ? value.id : value);
}

/**
 * afterChange of Publication (M3-07, DECISIONS §2.11 P9 A): records the URL
 * of a record that visitors can now see in `publication-slugs`.
 *
 * The record is read back from the main table (the version visitors get)
 * with PUBLIC_PUBLICATION_READ, the filter of the anonymous read and of
 * "Tayang di situs". So a draft save, a published record with Access Level
 * `registered`/`subscriber`, and an unpublish record nothing, and the
 * result does not depend on the `select` of the caller. `db.findOne` runs in
 * the save's transaction (`req`) without hooks or access, like
 * readLiveOnSite.
 *
 * The row of (locale, slug) is created, or moved to this record when an
 * older record had published the same slug; a row already on this record is
 * left alone. Only URLs the detail route can serve are recorded (a locale
 * and a slug of SLUG_PATTERN). Saves of one record run one after another
 * (Translation Group lock in enforceSharedFields), and two records cannot
 * hold the same live slug (unique locale + slug on publications).
 */
export const recordPublicSlug: CollectionAfterChangeHook = async ({ doc, req }) => {
  const live = (await req.payload.db.findOne({
    collection: "publications",
    where: { and: [{ id: { equals: doc.id } }, PUBLIC_PUBLICATION_READ] },
    select: { slug: true, locale: true },
    req,
  })) as { locale?: unknown; slug?: unknown } | null;
  const locale = live?.locale;
  const slug = live?.slug;
  if (typeof locale !== "string" || !isLocale(locale) || typeof slug !== "string" || !SLUG_PATTERN.test(slug)) return doc;

  const existing = await req.payload.find({
    collection: "publication-slugs",
    where: { and: [{ locale: { equals: locale } }, { slug: { equals: slug } }] },
    depth: 0,
    limit: 1,
    pagination: false,
    overrideAccess: true,
    req,
  });
  const row = existing.docs[0];
  if (!row) {
    await req.payload.create({
      collection: "publication-slugs",
      data: { publication: doc.id, locale, slug },
      depth: 0,
      overrideAccess: true,
      req,
    });
  } else if (idOf(row.publication as RelationValue) !== String(doc.id)) {
    await req.payload.update({
      collection: "publication-slugs",
      id: row.id,
      data: { publication: doc.id },
      depth: 0,
      overrideAccess: true,
      req,
    });
  }
  return doc;
};

/**
 * beforeDelete of Publication: removes the record's slug rows in the delete's
 * transaction, so an old URL of a deleted record is a plain not-found and the
 * required `publication` relation never points to a missing record. Runs for
 * every caller that may delete (Admin, Editor for a never-published record,
 * Local API with `overrideAccess`); `db.deleteMany` throws on failure, which
 * stops the delete.
 */
export const deletePublicationSlugs: CollectionBeforeDeleteHook = async ({ id, req }) => {
  await req.payload.db.deleteMany({
    collection: "publication-slugs",
    where: { publication: { equals: id } },
    req,
  });
};
