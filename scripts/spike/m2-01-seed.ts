/**
 * M2-01 fixture seed (spike only). Idempotent: find-or-create by unique keys,
 * then sets the expected values again.
 *
 * Usage:
 *   bun run payload run scripts/spike/m2-01-seed.ts            seed + counts
 *   SPIKE_MODE=count bun run payload run scripts/spike/m2-01-seed.ts
 *                                                              counts only, no writes
 *
 * All labels are prefixed "[FIXTURE]" and slugs "fixture-"; none of them is a
 * real taxonomy value. The staff user comes from SPIKE_ADMIN_EMAIL /
 * SPIKE_ADMIN_PASSWORD and is never printed.
 */
import { getPayload } from "payload";
import config from "@payload-config";
import { requireEnv } from "../../payload/env";

type LocalizedText = { id: string; en?: string };

type TaxonomyFixture = {
  slug: string;
  name: LocalizedText;
};

const AUTHORS = [
  { slug: "fixture-author-a", displayName: "[FIXTURE] Penulis A", biographyId: "[FIXTURE] Biografi penulis A (hanya ID)." },
  { slug: "fixture-author-b", displayName: "[FIXTURE] Penulis B", biographyId: "[FIXTURE] Biografi penulis B (hanya ID)." },
] as const;

const TOPICS: TaxonomyFixture[] = [
  { slug: "fixture-topic-energi", name: { id: "[FIXTURE] Topik Energi", en: "[FIXTURE] Energy Topic" } },
  { slug: "fixture-topic-id-only", name: { id: "[FIXTURE] Topik Hanya ID" } },
];

const PUBLICATION_TYPES: TaxonomyFixture[] = [
  { slug: "fixture-type-policy-brief", name: { id: "[FIXTURE] Jenis Policy Brief", en: "[FIXTURE] Policy Brief Type" } },
  { slug: "fixture-type-riset", name: { id: "[FIXTURE] Jenis Riset", en: "[FIXTURE] Research Type" } },
];

const TRANSLATION_GROUPS = ["[FIXTURE] Group Alpha"] as const;

const payload = await getPayload({ config });
const countOnly = process.env.SPIKE_MODE === "count";

async function seed(): Promise<void> {
  const email = requireEnv("SPIKE_ADMIN_EMAIL");
  const password = requireEnv("SPIKE_ADMIN_PASSWORD");
  const existingUser = await payload.find({
    collection: "users",
    where: { email: { equals: email } },
    limit: 1,
    overrideAccess: true,
  });
  if (existingUser.docs.length === 0) {
    await payload.create({ collection: "users", data: { email, password }, overrideAccess: true });
    console.log("INFO seed users created=1 (spike admin)");
  } else {
    console.log("INFO seed users created=0 (spike admin exists)");
  }

  for (const author of AUTHORS) {
    const found = await payload.find({
      collection: "authors",
      where: { slug: { equals: author.slug } },
      limit: 1,
      locale: "id",
      overrideAccess: true,
    });
    const data = { slug: author.slug, displayName: author.displayName, biography: author.biographyId };
    if (found.docs.length === 0) {
      await payload.create({ collection: "authors", data, locale: "id", overrideAccess: true });
    } else {
      await payload.update({ collection: "authors", id: found.docs[0].id, data, locale: "id", overrideAccess: true });
    }
  }

  for (const [collection, fixtures] of [
    ["topics", TOPICS],
    ["publication-types", PUBLICATION_TYPES],
  ] as const) {
    for (const fixture of fixtures) {
      const found = await payload.find({
        collection,
        where: { slug: { equals: fixture.slug } },
        limit: 1,
        locale: "id",
        overrideAccess: true,
      });
      const idData = { slug: fixture.slug, name: fixture.name.id };
      const id =
        found.docs.length === 0
          ? (await payload.create({ collection, data: idData, locale: "id", overrideAccess: true })).id
          : (await payload.update({ collection, id: found.docs[0].id, data: idData, locale: "id", overrideAccess: true })).id;
      if (fixture.name.en) {
        await payload.update({ collection, id, data: { name: fixture.name.en }, locale: "en", overrideAccess: true });
      }
    }
  }

  for (const label of TRANSLATION_GROUPS) {
    const found = await payload.find({
      collection: "translation-groups",
      where: { label: { equals: label } },
      limit: 1,
      overrideAccess: true,
    });
    if (found.docs.length === 0) {
      await payload.create({ collection: "translation-groups", data: { label }, overrideAccess: true });
    }
  }
}

async function printCounts(): Promise<void> {
  const email = requireEnv("SPIKE_ADMIN_EMAIL");
  const counts = {
    users: (await payload.count({ collection: "users", where: { email: { equals: email } }, overrideAccess: true })).totalDocs,
    authors: (await payload.count({ collection: "authors", where: { slug: { like: "fixture-" } }, overrideAccess: true })).totalDocs,
    topics: (await payload.count({ collection: "topics", where: { slug: { like: "fixture-" } }, overrideAccess: true })).totalDocs,
    publicationTypes: (await payload.count({ collection: "publication-types", where: { slug: { like: "fixture-" } }, overrideAccess: true })).totalDocs,
    translationGroups: (await payload.count({ collection: "translation-groups", where: { label: { like: "[FIXTURE]" } }, overrideAccess: true })).totalDocs,
  };
  const expected = { users: 1, authors: 2, topics: 2, publicationTypes: 2, translationGroups: 1 };
  let ok = true;
  for (const [key, value] of Object.entries(counts)) {
    const want = expected[key as keyof typeof expected];
    const pass = value === want;
    if (!pass) ok = false;
    console.log(`${pass ? "PASS" : "FAIL"} seed-count ${key}=${value} expected=${want}`);
  }

  const idOnly = await payload.find({
    collection: "topics",
    where: { slug: { equals: "fixture-topic-id-only" } },
    locale: "en",
    limit: 1,
    overrideAccess: true,
  });
  const enName = idOnly.docs[0]?.name;
  console.log(`INFO seed fixture-topic-id-only en name=${enName === undefined || enName === null ? "absent" : "present"}`);
  if (!ok) process.exitCode = 1;
}

try {
  if (!countOnly) {
    await seed();
  }
  await printCounts();
} catch (error) {
  console.log(`FAIL seed ${error instanceof Error ? error.name + ": " + error.message : "unknown error"}`);
  process.exitCode = 1;
} finally {
  await payload.destroy();
}
// See m2-01-db-smoke.ts: short wait avoids a libuv exit assertion on Windows;
// the payload bin would otherwise exit 0 and drop process.exitCode.
await new Promise((resolve) => setTimeout(resolve, 250));
process.exit(process.exitCode ?? 0);
