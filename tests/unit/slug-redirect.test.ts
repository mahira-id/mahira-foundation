import assert from "node:assert/strict";
import { describe, test } from "node:test";

import type { Access, Payload, PayloadRequest } from "payload";

import { findPublicTitle } from "../../lib/cms/publication-detail-query";
import { findSlugOwner } from "../../lib/cms/publication-slug-query";
import { findSitemapPublications } from "../../lib/cms/sitemap-query";
import { redirectPath } from "../../lib/publications/slug-redirect";
import { PUBLIC_PUBLICATION_READ } from "../../payload/access/public-read";
import { Publications } from "../../payload/collections/Publications";
import { PublicationSlugs } from "../../payload/collections/PublicationSlugs";
import { deletePublicationSlugs, recordPublicSlug } from "../../payload/hooks/publication-slugs";
import { fakeReq, fakeUser } from "../helpers/fake-req";

/**
 * M3-07 slug history and the 308 of old publication URLs (DECISIONS §2.11
 * P9 A), without a database: SLU1 redirectPath; SLU2 recordPublicSlug and
 * SLU3 deletePublicationSlugs with a fake `req.payload`; SLU4 the anonymous
 * findSlugOwner query; SLU5 access and schema of publication-slugs; SLU6 the
 * hooks on Publications; SLU7 the anonymous sitemap and title queries.
 */
type Call = Record<string, unknown>;

function recordingFind(docs: unknown[]): { payload: Pick<Payload, "find">; calls: Call[] } {
  const calls: Call[] = [];
  const find = async (args: Call) => {
    calls.push(args);
    return { docs };
  };
  return { payload: { find } as unknown as Pick<Payload, "find">, calls };
}

/** A request whose payload records every call: `live` is the main-table row db.findOne returns, `rows` the slug rows find returns. */
function hookReq(live: Call | null, rows: Call[] = []) {
  const calls: { method: string; args: Call }[] = [];
  const record = (method: string, result: unknown) => async (args: Call) => {
    calls.push({ method, args });
    return result;
  };
  const payload = {
    db: { findOne: record("db.findOne", live), deleteMany: record("db.deleteMany", undefined) },
    find: record("find", { docs: rows }),
    create: record("create", {}),
    update: record("update", {}),
  };
  const req = fakeReq({ payloadAPI: "local", payload });
  return { req, calls, methods: () => calls.map((call) => call.method) };
}

async function afterChange(doc: Call, req: PayloadRequest): Promise<unknown> {
  return (recordPublicSlug as unknown as (args: Call) => Promise<unknown>)({ doc, req, operation: "update", context: {} });
}

async function run(access: unknown, req: PayloadRequest): Promise<unknown> {
  assert.equal(typeof access, "function", "access function must be defined");
  return (access as Access)({ req } as Parameters<Access>[0]);
}

describe("lib/publications/slug-redirect.ts", () => {
  test("SLU1 redirectPath: the current path of a visible record of the same locale under another valid slug, else null", () => {
    assert.equal(redirectPath("id", "lama", { locale: "id", slug: "baru" }), "/id/publications/baru");
    assert.equal(redirectPath("en", "old", { locale: "en", slug: "new-2" }), "/en/publications/new-2");
    assert.equal(redirectPath("id", "lama", null), null, "no visible record");
    assert.equal(redirectPath("id", "lama", { locale: "en", slug: "baru" }), null, "other locale");
    assert.equal(redirectPath("id", "sama", { locale: "id", slug: "sama" }), null, "same slug (no loop)");
    for (const slug of ["Baru", "a_b", "", "a/b", "https://x.example", undefined, 5]) {
      assert.equal(redirectPath("id", "lama", { locale: "id", slug }), null, `invalid target slug ${String(slug)}`);
    }
  });
});

describe("payload/hooks/publication-slugs.ts", () => {
  test("SLU2a recordPublicSlug reads the main-table record with PUBLIC_PUBLICATION_READ in the save's transaction; nothing visible → no write", async () => {
    const { req, calls, methods } = hookReq(null);
    const doc = { id: 7, slug: "baru", locale: "id", _status: "published", accessLevel: "public" };
    assert.equal(await afterChange(doc, req), doc, "returns the doc unchanged");
    assert.deepEqual(methods(), ["db.findOne"], "draft save, unpublish or registered/subscriber: only the read");
    const read = calls[0]?.args ?? {};
    assert.equal(read.collection, "publications");
    assert.deepEqual(read.where, { and: [{ id: { equals: 7 } }, PUBLIC_PUBLICATION_READ] });
    assert.deepEqual(read.select, { slug: true, locale: true });
    assert.equal(read.req, req, "same request = same transaction");
  });

  test("SLU2b recordPublicSlug creates the row of a visible record's URL (overrideAccess, same req)", async () => {
    // The doc of a select-limited save may lack fields: the hook uses the main-table read.
    const { req, calls, methods } = hookReq({ id: 7, slug: "baru", locale: "id" });
    await afterChange({ id: 7 }, req);
    assert.deepEqual(methods(), ["db.findOne", "find", "create"]);
    const find = calls[1]?.args ?? {};
    assert.equal(find.collection, "publication-slugs");
    assert.deepEqual(find.where, { and: [{ locale: { equals: "id" } }, { slug: { equals: "baru" } }] });
    assert.equal(find.overrideAccess, true);
    assert.equal(find.req, req);
    const create = calls[2]?.args ?? {};
    assert.equal(create.collection, "publication-slugs");
    assert.deepEqual(create.data, { publication: 7, locale: "id", slug: "baru" });
    assert.equal(create.overrideAccess, true);
    assert.equal(create.req, req);
  });

  test("SLU2c recordPublicSlug leaves a row of the same record alone and moves a row of another record", async () => {
    for (const publication of [7, { id: 7 }, "7"]) {
      const same = hookReq({ id: 7, slug: "baru", locale: "en" }, [{ id: 40, publication, locale: "en", slug: "baru" }]);
      await afterChange({ id: 7 }, same.req);
      assert.deepEqual(same.methods(), ["db.findOne", "find"], `row already on record 7 (${JSON.stringify(publication)})`);
    }
    const moved = hookReq({ id: 7, slug: "baru", locale: "en" }, [{ id: 41, publication: 3, locale: "en", slug: "baru" }]);
    await afterChange({ id: 7 }, moved.req);
    assert.deepEqual(moved.methods(), ["db.findOne", "find", "update"]);
    const update = moved.calls[2]?.args ?? {};
    assert.equal(update.collection, "publication-slugs");
    assert.equal(update.id, 41);
    assert.deepEqual(update.data, { publication: 7 });
    assert.equal(update.overrideAccess, true);
    assert.equal(update.req, moved.req);
  });

  test("SLU2d recordPublicSlug records only URLs the detail route serves (locale id/en, SLUG_PATTERN)", async () => {
    for (const live of [
      { id: 7, slug: "Baru", locale: "id" },
      { id: 7, slug: "a_b", locale: "id" },
      { id: 7, slug: "", locale: "id" },
      { id: 7, slug: "baru", locale: "xx" },
      { id: 7, slug: null, locale: "id" },
    ]) {
      const { req, methods } = hookReq(live);
      await afterChange({ id: 7 }, req);
      assert.deepEqual(methods(), ["db.findOne"], JSON.stringify(live));
    }
  });

  test("SLU3 deletePublicationSlugs deletes the record's rows in the delete's transaction", async () => {
    const { req, calls, methods } = hookReq(null);
    await (deletePublicationSlugs as unknown as (args: Call) => Promise<unknown>)({ id: 9, req, context: {} });
    assert.deepEqual(methods(), ["db.deleteMany"]);
    const args = calls[0]?.args ?? {};
    assert.equal(args.collection, "publication-slugs");
    assert.deepEqual(args.where, { publication: { equals: 9 } });
    assert.equal(args.req, req);
  });
});

describe("lib/cms/publication-slug-query.ts", () => {
  test("SLU4 findSlugOwner: anonymous (no user, overrideAccess false), locale + slug, one row, the publication id only", async () => {
    const found = recordingFind([{ id: 1, publication: 5 }]);
    assert.equal(await findSlugOwner(found.payload, "en", "old-slug"), 5);
    const [args] = found.calls;
    assert.ok(args);
    assert.equal(args.collection, "publication-slugs");
    assert.deepEqual(args.where, { and: [{ locale: { equals: "en" } }, { slug: { equals: "old-slug" } }] });
    assert.equal("user" in args, false, "no user");
    assert.equal(args.overrideAccess, false);
    assert.equal(args.depth, 0);
    assert.equal(args.limit, 1);
    assert.equal(args.pagination, false);
    assert.deepEqual(args.select, { publication: true });
    assert.equal(await findSlugOwner(recordingFind([{ id: 1, publication: { id: 6 } }]).payload, "id", "x"), 6);
    assert.equal(await findSlugOwner(recordingFind([{ id: 1, publication: null }]).payload, "id", "x"), null);
    assert.equal(await findSlugOwner(recordingFind([]).payload, "id", "x"), null);
  });
});

describe("payload/collections/PublicationSlugs.ts", () => {
  test("SLU5 read: staff or anonymous Local API only (anonymous REST denied); create/update/delete: nobody; unique (locale, slug); no versions; hidden", async () => {
    const admin = fakeReq({ user: fakeUser("admin", 1) });
    const editor = fakeReq({ user: fakeUser("editor", 2) });
    const anonymousRest = fakeReq({ payloadAPI: "REST" });
    const anonymousLocal = fakeReq({ payloadAPI: "local" });
    const { access } = PublicationSlugs;
    assert.equal(PublicationSlugs.slug, "publication-slugs");
    assert.equal(await run(access?.read, anonymousRest), false);
    assert.equal(await run(access?.read, anonymousLocal), true);
    assert.equal(await run(access?.read, editor), true);
    assert.equal(await run(access?.read, admin), true);
    for (const operation of ["create", "update", "delete"] as const) {
      for (const req of [admin, editor, anonymousLocal, anonymousRest]) {
        assert.equal(await run(access?.[operation], req), false, `${operation} denied`);
      }
    }
    assert.deepEqual(PublicationSlugs.indexes, [{ fields: ["locale", "slug"], unique: true }]);
    assert.equal(Boolean(PublicationSlugs.versions), false, "no versions");
    assert.equal(PublicationSlugs.admin?.hidden, true);
    const fields = new Map(PublicationSlugs.fields.map((field) => [(field as { name: string }).name, field as Record<string, unknown>]));
    assert.deepEqual([...fields.keys()], ["publication", "locale", "slug"]);
    assert.equal(fields.get("publication")?.relationTo, "publications");
    for (const field of fields.values()) assert.equal(field.required, true, `${String(field.name)} required`);
  });

  test("SLU6 Publications runs recordPublicSlug after every change and deletePublicationSlugs before a delete", () => {
    assert.deepEqual(Publications.hooks?.afterChange, [recordPublicSlug]);
    assert.deepEqual(Publications.hooks?.beforeDelete, [deletePublicationSlugs]);
  });
});

describe("lib/cms/sitemap-query.ts and findPublicTitle", () => {
  test("SLU7 sitemap and Open Graph title reads are anonymous (no user, overrideAccess false, draft false, fallbackLocale false)", async () => {
    const sitemap = recordingFind([
      { id: 1, slug: "satu", locale: "id", updatedAt: "2090-01-05T03:00:00.000Z" },
      { id: 2, slug: "two", locale: "en", updatedAt: "2090-01-06T03:00:00.000Z" },
      { id: 3, slug: "Bad_Slug", locale: "id", updatedAt: "2090-01-07T03:00:00.000Z" },
      { id: 4, slug: "x", locale: "xx", updatedAt: "2090-01-08T03:00:00.000Z" },
    ]);
    assert.deepEqual(await findSitemapPublications(sitemap.payload), [
      { locale: "id", slug: "satu", updatedAt: "2090-01-05T03:00:00.000Z" },
      { locale: "en", slug: "two", updatedAt: "2090-01-06T03:00:00.000Z" },
    ]);
    const title = recordingFind([{ id: 1, title: "Judul" }]);
    assert.equal(await findPublicTitle(title.payload, "id", "satu"), "Judul");
    assert.equal(await findPublicTitle(recordingFind([]).payload, "id", "satu"), null);
    for (const [name, args] of [
      ["sitemap", sitemap.calls[0]],
      ["title", title.calls[0]],
    ] as const) {
      assert.ok(args, name);
      assert.equal(args.collection, "publications", name);
      assert.equal("user" in args, false, `${name}: no user`);
      assert.equal(args.overrideAccess, false, name);
      assert.equal(args.draft, false, name);
      assert.equal(args.fallbackLocale, false, name);
      assert.equal(args.depth, 0, name);
    }
    assert.deepEqual(sitemap.calls[0]?.select, { slug: true, locale: true, updatedAt: true });
    assert.equal(sitemap.calls[0]?.pagination, false);
    assert.equal("where" in (sitemap.calls[0] ?? {}), false, "no filter of its own: access gives published + public");
    assert.deepEqual(title.calls[0]?.where, { and: [{ locale: { equals: "id" } }, { slug: { equals: "satu" } }] });
    assert.deepEqual(title.calls[0]?.select, { title: true });
    assert.equal(title.calls[0]?.locale, "id");
  });
});
