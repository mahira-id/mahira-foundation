import assert from "node:assert/strict";
import { describe, test } from "node:test";
import type { Access, CollectionBeforeChangeHook, Field, Payload, PayloadRequest } from "payload";

import { findPublicGuide, findPublicLearningHub, findPublicResource, findPublicResources } from "../../lib/cms/learning-hub-query";
import { fallbackExitTarget, findDraftGuide, findDraftResourceRef, previewExitTarget, type StaffUser } from "../../lib/cms/staff-preview";
import {
  catalogTexts,
  compareResources,
  isResourceVisible,
  LEARNING_HUB_NAME,
  newestCards,
  planCatalog,
  toGuidePage,
  type CatalogPlan,
  type GuidePage,
  type LearningHubDoc,
  type ResourceDoc,
} from "../../lib/learning-hub/catalog-view";
import { embedUrl, parseYouTubeSource, videoThumbnailUrl, watchUrl, YOUTUBE_HOSTS } from "../../lib/learning-hub/youtube";
import { learningHubPath, parsePreviewRequest, resourceAdminPath, resourcePath, resourcePreviewUrl } from "../../lib/publications/preview";
import { guideMetadata, learningHubMetadata, sitemapEntries } from "../../lib/seo/metadata";
import { PUBLIC_LEARNING_HUB_READ, PUBLIC_LEARNING_RESOURCE_READ, PUBLIC_LEARNING_RESOURCE_TYPES } from "../../payload/access/public-read";
import { LearningResources } from "../../payload/collections/LearningResources";
import { structuredSectionsField } from "../../payload/fields/structured-sections";
import { About } from "../../payload/globals/About";
import { LearningHub } from "../../payload/globals/LearningHub";
import { denyPublicFallback, denyPublicFallbackForGlobal } from "../../payload/hooks/deny-public-fallback";
import { normalizeYouTubeSource, setResourcePublishedAt } from "../../payload/hooks/learning-resources";
import { fakeReq, fakeUser } from "../helpers/fake-req";
import { diffGlobal, isGlobalTable, type GlobalSnapshot } from "../helpers/global-state";

/**
 * Learning Hub (M3-11/12, DECISIONS §2.16): the `learning-resources`
 * collection and `learning-hub` global configs and access, the YouTube
 * source parser and save hook, the view model (visibility, order, cards,
 * guide page), the read contracts, the guide preview helpers, SEO and the
 * singleton snapshot diff. No database, no env: Payload methods are fakes.
 * Fixture text only ("[FIXTURE] …").
 */
const admin = () => fakeReq({ user: fakeUser("admin", 1) });
const editor = () => fakeReq({ user: fakeUser("editor", 2) });
const anonymousRest = () => fakeReq({ payloadAPI: "REST" });
const anonymousLocal = () => fakeReq({ payloadAPI: "local" });

async function run(access: Access | undefined, req: PayloadRequest): Promise<unknown> {
  assert.equal(typeof access, "function", "access function must be defined");
  return (access as Access)({ req } as Parameters<Access>[0]);
}

type NamedField = Field & { name?: string; fields?: Field[]; localized?: boolean; type: string; options?: { value: string }[]; relationTo?: string };

function field(fields: Field[], name: string): NamedField {
  const found = (fields as NamedField[]).find((candidate) => candidate.name === name);
  assert.ok(found, `field ${name}`);
  return found;
}

function allTypes(fields: Field[]): string[] {
  return (fields as NamedField[]).flatMap((candidate) => [candidate.type, ...allTypes(candidate.fields ?? [])]);
}

const names = (fields: Field[] | undefined) => (fields as NamedField[] | undefined)?.map((candidate) => candidate.name);

const F = "[FIXTURE] test learning-hub";
const VIDEO = "dQw4w9WgXcQ";
const PLAYLIST = "PLx0sYbCqOb8TBPRdmBHs5Iftvv9TPboYG";

function topic(overrides: Record<string, unknown> = {}) {
  return { id: 7, name: `${F} topic`, description: `${F} topic description`, isActive: true, ...overrides };
}

function doc(overrides: Partial<ResourceDoc> = {}): ResourceDoc {
  return {
    id: 1,
    type: "video",
    title: `${F} title`,
    summary: `${F} summary one\n\n${F} summary two`,
    slug: null,
    materialLanguage: "id",
    topic: topic(),
    youtubeId: VIDEO,
    coverImage: null,
    sortOrder: null,
    publishedAt: "2090-01-05T03:00:00.000Z",
    createdAt: "2090-01-01T00:00:00.000Z",
    updatedAt: "2090-01-06T00:00:00.000Z",
    enReady: false,
    _status: "published",
    ...overrides,
  };
}

const guide = (overrides: Partial<ResourceDoc> = {}) => doc({ type: "guide", slug: "fixture-guide", youtubeId: null, ...overrides });

describe("payload/collections/LearningResources.ts and payload/globals/LearningHub.ts", () => {
  test("LHU1 collection config: slug, drafts + 25 versions, localized vs shared fields, types, no rich text, access matrix (toolkits never public), hooks", async () => {
    assert.equal(LearningResources.slug, "learning-resources");
    assert.equal(LearningResources.dbName, "lh_resources");
    assert.deepEqual(LearningResources.versions, { drafts: true, maxPerDoc: 25 });
    const fields = LearningResources.fields;
    assert.deepEqual(names(fields), [
      "type",
      "title",
      "summary",
      "slug",
      "materialLanguage",
      "topic",
      "youtubeId",
      "coverImage",
      "sections",
      "sortOrder",
      "publishedAt",
      "enReady",
    ]);
    for (const name of ["title", "summary", "slug", "sections"]) assert.equal(field(fields, name).localized, true, `${name} localized`);
    for (const name of ["type", "materialLanguage", "topic", "youtubeId", "coverImage", "sortOrder", "publishedAt", "enReady"]) {
      assert.notEqual(field(fields, name).localized, true, `${name} shared`);
    }
    assert.deepEqual(field(fields, "type").options?.map((option) => option.value), ["video", "playlist", "guide", "toolkit"]);
    assert.deepEqual(field(fields, "materialLanguage").options?.map((option) => option.value), ["id", "en"]);
    for (const name of ["type", "title", "summary", "materialLanguage", "topic"]) {
      assert.equal((field(fields, name) as NamedField & { required?: boolean }).required, true, `${name} required`);
    }
    const slug = field(fields, "slug") as NamedField & { unique?: boolean };
    assert.equal(slug.unique, true, "slug unique (per locale: (slug, _locale))");
    assert.equal(field(fields, "topic").relationTo, "topics");
    assert.equal((field(fields, "topic") as NamedField & { hasMany?: boolean }).hasMany, undefined, "one primary theme");
    assert.equal(field(fields, "coverImage").relationTo, "media");
    const enReady = field(fields, "enReady") as NamedField & { defaultValue?: unknown; label?: unknown };
    assert.equal(enReady.type, "checkbox");
    assert.equal(enReady.defaultValue, false);
    assert.equal(enReady.label, "Versi EN siap tayang");
    assert.equal(allTypes(fields).includes("richText"), false, "no rich text (decision 3A)");
    assert.deepEqual(
      allTypes(fields).filter((type) => type === "upload"),
      ["upload"],
      "the only upload is the playlist cover (no toolkit file before M3-13)",
    );
    // Guides use the About section model without CTAs (decision 3A).
    assert.deepEqual(names(field(fields, "sections").fields), ["anchor", "label", "heading", "body", "quote", "lists", "outro"]);

    // Access: staff read all; anonymous Local API = published + public types; REST, GraphQL, others denied.
    const read = LearningResources.access?.read;
    assert.equal(await run(read, admin()), true);
    assert.equal(await run(read, editor()), true);
    assert.deepEqual(await run(read, anonymousLocal()), PUBLIC_LEARNING_RESOURCE_READ);
    assert.deepEqual(PUBLIC_LEARNING_RESOURCE_READ, {
      and: [{ _status: { equals: "published" } }, { type: { in: ["video", "playlist", "guide"] } }],
    });
    assert.deepEqual([...PUBLIC_LEARNING_RESOURCE_TYPES], ["video", "playlist", "guide"], "toolkits stay off the public site until M3-13");
    assert.equal(await run(read, anonymousRest()), false);
    assert.equal(await run(read, fakeReq({ payloadAPI: "GraphQL" })), false);
    assert.equal(await run(read, fakeReq({ user: fakeUser("superuser", 3), payloadAPI: "local" })), false, "unknown role, even via Local API");
    assert.equal(await run(read, fakeReq({ user: fakeUser("editor", 4, "members"), payloadAPI: "local" })), false, "other auth collection");
    for (const operation of ["create", "update", "readVersions"] as const) {
      const access = LearningResources.access?.[operation];
      assert.equal(await run(access, admin()), true, `${operation} admin`);
      assert.equal(await run(access, editor()), true, `${operation} editor (DEC-016)`);
      for (const req of [anonymousLocal(), anonymousRest(), fakeReq({ user: fakeUser("superuser", 3) })]) {
        assert.equal(await run(access, req), false, `${operation} denied`);
      }
    }
    const remove = LearningResources.access?.delete;
    assert.equal(await run(remove, admin()), true, "delete admin");
    for (const req of [editor(), anonymousLocal(), anonymousRest()]) assert.equal(await run(remove, req), false, "delete: Admin only");
    assert.deepEqual(LearningResources.hooks?.beforeOperation, [denyPublicFallback]);
    assert.deepEqual(LearningResources.hooks?.beforeChange, [normalizeYouTubeSource, setResourcePublishedAt]);
  });

  test("LHU1b global learning-hub: slug, drafts, localized hero/seo, published-only anonymous read, staff update, fallback hook; About's sections field unchanged", async () => {
    assert.equal(LearningHub.slug, "learning-hub");
    assert.deepEqual(LearningHub.versions, { drafts: true, max: 25 });
    assert.deepEqual(names(LearningHub.fields), ["hero", "seo"]);
    for (const name of ["hero", "seo"]) assert.equal(field(LearningHub.fields, name).localized, true, `${name} localized`);
    assert.deepEqual(names(field(LearningHub.fields, "hero").fields), ["title", "intro"]);
    assert.deepEqual(names(field(LearningHub.fields, "seo").fields), ["title", "description"]);
    const read = LearningHub.access?.read;
    assert.equal(await run(read, editor()), true);
    assert.deepEqual(await run(read, anonymousLocal()), PUBLIC_LEARNING_HUB_READ);
    assert.deepEqual(PUBLIC_LEARNING_HUB_READ, { _status: { equals: "published" } });
    assert.equal(await run(read, anonymousRest()), false);
    for (const operation of ["update", "readVersions"] as const) {
      assert.equal(await run(LearningHub.access?.[operation], editor()), true);
      assert.equal(await run(LearningHub.access?.[operation], anonymousLocal()), false);
    }
    assert.deepEqual(LearningHub.hooks?.beforeOperation, [denyPublicFallbackForGlobal]);

    // About keeps the same section field: names in order, CTAs last (migration has no About statement).
    const aboutSections = field(About.fields, "sections");
    assert.deepEqual(names(aboutSections.fields), ["anchor", "label", "heading", "body", "quote", "lists", "outro", "ctas"]);
    assert.equal(aboutSections.localized, true);
    assert.deepEqual(names(structuredSectionsField().fields), ["anchor", "label", "heading", "body", "quote", "lists", "outro"]);
  });
});

describe("lib/learning-hub/youtube.ts and the save hook", () => {
  test("LHU2 parseYouTubeSource: allowed hosts and forms only; look-alike hosts, other schemes, userinfo, ports and bad IDs refused; URLs built from the ID", () => {
    const accepted: Array<["video" | "playlist", string, string]> = [
      ["video", VIDEO, VIDEO],
      ["video", `  https://www.youtube.com/watch?v=${VIDEO}  `, VIDEO],
      ["video", `https://youtube.com/watch?v=${VIDEO}&t=42s&list=${PLAYLIST}`, VIDEO],
      ["video", `http://m.youtube.com/watch?v=${VIDEO}`, VIDEO],
      ["video", `https://youtu.be/${VIDEO}?si=abc`, VIDEO],
      ["video", `https://www.youtube.com/embed/${VIDEO}`, VIDEO],
      ["video", `https://www.youtube.com/shorts/${VIDEO}`, VIDEO],
      ["video", `https://www.youtube.com/live/${VIDEO}`, VIDEO],
      ["video", `https://www.youtube-nocookie.com/embed/${VIDEO}`, VIDEO],
      ["video", `https://WWW.YOUTUBE.COM/watch?v=${VIDEO}`, VIDEO],
      ["playlist", PLAYLIST, PLAYLIST],
      ["playlist", `https://www.youtube.com/playlist?list=${PLAYLIST}`, PLAYLIST],
      ["playlist", `https://www.youtube.com/watch?v=${VIDEO}&list=${PLAYLIST}`, PLAYLIST],
      ["playlist", `https://www.youtube-nocookie.com/embed/videoseries?list=${PLAYLIST}`, PLAYLIST],
    ];
    for (const [kind, input, id] of accepted) assert.equal(parseYouTubeSource(kind, input), id, `${kind} ${input}`);
    const refused: Array<["video" | "playlist", unknown]> = [
      ["video", `https://youtube.com.evil.example/watch?v=${VIDEO}`],
      ["video", `https://evilyoutube.com/watch?v=${VIDEO}`],
      ["video", `https://youtube.co/watch?v=${VIDEO}`],
      ["video", `https://www.youtube.com.evil.example/embed/${VIDEO}`],
      ["video", `https://youtu.be.evil.example/${VIDEO}`],
      ["video", `https://youtube.com./watch?v=${VIDEO}`],
      ["video", `https://xn--youtube-7ya.com/watch?v=${VIDEO}`],
      ["video", `https://music.youtube.com/watch?v=${VIDEO}`],
      ["video", `https://www.youtube.com@evil.example/watch?v=${VIDEO}`],
      ["video", `https://user:pass@www.youtube.com/watch?v=${VIDEO}`],
      ["video", `https://www.youtube.com:8443/watch?v=${VIDEO}`],
      ["video", `javascript:alert(1)//https://www.youtube.com/watch?v=${VIDEO}`],
      ["video", "javascript:alert(1)"],
      ["video", `data:text/html,https://youtu.be/${VIDEO}`],
      ["video", `ftp://www.youtube.com/watch?v=${VIDEO}`],
      ["video", `//www.youtube.com/watch?v=${VIDEO}`],
      ["video", `www.youtube.com/watch?v=${VIDEO}`],
      ["video", `https://www.youtube.com/watch?v=${VIDEO.slice(0, 10)}`],
      ["video", `https://www.youtube.com/watch?v=${VIDEO}x`],
      ["video", `https://www.youtube.com/watch?v=dQw4w9WgXc%22`],
      ["video", `https://www.youtube.com/watch?v=<script>x`],
      ["video", `https://www.youtube.com/watch?v=${VIDEO}&v=${VIDEO}`],
      ["video", `https://www.youtube.com/watch/${VIDEO}`],
      ["video", `https://www.youtube.com/embed/${VIDEO}/extra`],
      ["video", `https://youtu.be/a/${VIDEO}`],
      ["video", `https://www.youtube.com/playlist?list=${PLAYLIST}`],
      ["video", `https://www.youtube.com/embed/videoseries?list=${PLAYLIST}`],
      ["video", `https://www.youtube-nocookie.com/embed/videoseries?list=${PLAYLIST}`],
      ["video", "videoseries"],
      ["video", `https://www.youtube.com/watch?v=${VIDEO}${"a".repeat(2048)}`],
      ["video", "dQw4w9WgXc"],
      ["video", "dQw4w9WgXc!"],
      ["video", ""],
      ["video", "   "],
      ["video", null],
      ["video", 42],
      ["playlist", `https://www.youtube.com/watch?v=${VIDEO}`],
      ["playlist", `https://www.youtube.com/playlist?list=short`],
      ["playlist", `https://www.youtube.com/playlist?list=${PLAYLIST}&list=${PLAYLIST}`],
      ["playlist", `https://evil.example/playlist?list=${PLAYLIST}`],
      ["playlist", `https://www.youtube.com/playlist?list=PL<script>alert(1)</script>`],
      ["playlist", "PL" + "a".repeat(63)],
    ];
    for (const [kind, input] of refused) assert.equal(parseYouTubeSource(kind, input), null, `${kind} ${String(input).slice(0, 80)}`);
    assert.deepEqual([...YOUTUBE_HOSTS].sort(), ["m.youtube.com", "www.youtube-nocookie.com", "www.youtube.com", "youtu.be", "youtube-nocookie.com", "youtube.com"]);

    assert.equal(embedUrl("video", VIDEO), `https://www.youtube-nocookie.com/embed/${VIDEO}?autoplay=1`);
    assert.equal(embedUrl("playlist", PLAYLIST), `https://www.youtube-nocookie.com/embed/videoseries?list=${PLAYLIST}&autoplay=1`);
    assert.equal(watchUrl("video", VIDEO), `https://www.youtube.com/watch?v=${VIDEO}`);
    assert.equal(watchUrl("playlist", PLAYLIST), `https://www.youtube.com/playlist?list=${PLAYLIST}`);
    assert.equal(videoThumbnailUrl(VIDEO), `https://i.ytimg.com/vi/${VIDEO}/hqdefault.jpg`);
    for (const bad of [`https://youtu.be/${VIDEO}`, "x\"><script>", null, PLAYLIST, "videoseries"]) {
      assert.equal(embedUrl("video", bad), null, `embed ${String(bad)}`);
      assert.equal(watchUrl("video", bad), null, `watch ${String(bad)}`);
      assert.equal(videoThumbnailUrl(bad), null, `thumbnail ${String(bad)}`);
    }
    assert.equal(embedUrl("playlist", "javascript:x"), null);
  });

  test("LHU2b normalizeYouTubeSource (drafts too): URL -> ID; a refused source throws on youtubeId; other types store null; setResourcePublishedAt", async () => {
    const req = fakeReq({ user: fakeUser("editor", 2), payloadAPI: "local" });
    const call = (data: Record<string, unknown>, originalDoc?: Record<string, unknown>) =>
      (normalizeYouTubeSource as CollectionBeforeChangeHook)({ data, originalDoc, req, operation: originalDoc ? "update" : "create", context: {} } as never) as Record<
        string,
        unknown
      >;
    for (const _status of ["draft", "published"]) {
      assert.equal(call({ _status, type: "video", youtubeId: `https://youtu.be/${VIDEO}` }).youtubeId, VIDEO, `${_status}: only the ID is stored`);
      assert.equal(call({ _status, type: "playlist", youtubeId: `https://www.youtube.com/playlist?list=${PLAYLIST}` }).youtubeId, PLAYLIST);
      for (const bad of [`https://evil.example/watch?v=${VIDEO}`, "javascript:alert(1)", `https://youtu.be/${VIDEO}x`]) {
        assert.throws(
          () => call({ _status, type: "video", youtubeId: bad }),
          (error: unknown) => {
            const value = error as { name?: string; data?: { errors?: { path?: string }[] } };
            return value.name === "ValidationError" && value.data?.errors?.[0]?.path === "youtubeId";
          },
          `${_status}: ${bad}`,
        );
      }
    }
    assert.equal(call({ type: "guide", youtubeId: `https://youtu.be/${VIDEO}` }).youtubeId, null, "a guide never keeps a YouTube value");
    assert.equal(call({ type: "toolkit", youtubeId: "anything" }).youtubeId, null);
    assert.equal(call({ youtubeId: `https://youtu.be/${VIDEO}` }).youtubeId, null, "no type chosen: nothing stored");
    assert.equal(call({ type: "video", youtubeId: "  " }).youtubeId, null, "empty: null (publish then needs one)");
    assert.equal(call({ type: "video", youtubeId: null }).youtubeId, null);
    assert.equal("youtubeId" in call({ title: "x" }, { type: "video", youtubeId: VIDEO }), false, "not sent: stored ID untouched");
    assert.equal(call({ type: "playlist" }, { type: "video", youtubeId: VIDEO }).youtubeId, null, "type changed: stored ID cleared");
    for (const _status of ["draft", "published"]) {
      assert.equal(
        call({ _status, type: "playlist", youtubeId: VIDEO }, { type: "video", youtubeId: VIDEO }).youtubeId,
        null,
        `${_status}: video -> playlist with the stored video ID re-sent (admin form): cleared, never kept as a playlist ID`,
      );
      assert.equal(
        call({ _status, type: "video", youtubeId: PLAYLIST }, { type: "playlist", youtubeId: PLAYLIST }).youtubeId,
        null,
        `${_status}: playlist -> video with the stored playlist ID re-sent: cleared`,
      );
    }
    assert.equal(
      call({ type: "playlist", youtubeId: `https://www.youtube.com/playlist?list=${PLAYLIST}` }, { type: "video", youtubeId: VIDEO }).youtubeId,
      PLAYLIST,
      "type changed with a new source: parsed for the new type",
    );
    assert.equal(call({ type: "video", youtubeId: VIDEO }, { type: "video", youtubeId: VIDEO }).youtubeId, VIDEO, "same type, ID re-sent: kept");
    assert.equal("youtubeId" in call({ type: "video" }, { type: "video", youtubeId: VIDEO }), false, "same type: untouched");
    assert.equal(call({ youtubeId: `https://youtu.be/${VIDEO}` }, { type: "video" }).youtubeId, VIDEO, "stored type used");

    const publish = (data: Record<string, unknown>, originalDoc?: Record<string, unknown>) =>
      (setResourcePublishedAt as CollectionBeforeChangeHook)({ data, originalDoc, req, operation: "update", context: {} } as never) as Record<string, unknown>;
    const filled = publish({ _status: "published" });
    assert.equal(typeof filled.publishedAt, "string", "filled on publish");
    assert.equal(publish({ _status: "published", publishedAt: null }).publishedAt === null, false, "a cleared date is refilled on publish");
    assert.equal(publish({ _status: "published" }, { publishedAt: "2090-01-01T00:00:00.000Z" }).publishedAt, undefined, "stored date kept");
    assert.equal(publish({ _status: "draft" }).publishedAt, undefined, "draft: not filled");
  });
});

describe("lib/learning-hub/catalog-view.ts", () => {
  test("LHU3 isResourceVisible: published, public type, title + summary, ID or slug, active named Topic; EN also enReady", () => {
    assert.equal(isResourceVisible(doc(), "id"), true);
    assert.equal(isResourceVisible(doc({ type: "playlist", youtubeId: PLAYLIST }), "id"), true);
    assert.equal(isResourceVisible(guide(), "id"), true);
    assert.equal(isResourceVisible(doc(), "en"), false, "EN without the checkbox");
    assert.equal(isResourceVisible(doc({ enReady: true }), "en"), true);
    assert.equal(isResourceVisible(doc({ enReady: null }), "en"), false);
    const hidden: Array<[string, Partial<ResourceDoc>]> = [
      ["draft", { _status: "draft" }],
      ["no status", { _status: null }],
      ["toolkit", { type: "toolkit", slug: "fixture-toolkit" }],
      ["unknown type", { type: "course" }],
      ["no title", { title: "  " }],
      ["no summary", { summary: "" }],
      ["inactive topic", { topic: topic({ isActive: false }) }],
      ["unnamed topic", { topic: topic({ name: " " }) }],
      ["topic not populated", { topic: 7 }],
      ["no topic", { topic: null }],
      ["video without ID", { youtubeId: null }],
      ["video with a URL", { youtubeId: `https://youtu.be/${VIDEO}` }],
      ["video with a playlist ID", { youtubeId: PLAYLIST }],
      ["video with the playlist embed segment", { youtubeId: "videoseries" }],
      ["playlist with a bad ID", { type: "playlist", youtubeId: "short" }],
      ["guide without slug", { type: "guide", slug: null, youtubeId: null }],
      ["guide with a bad slug", { type: "guide", slug: "Bad Slug", youtubeId: null }],
    ];
    for (const [label, overrides] of hidden) {
      for (const locale of ["id", "en"] as const) {
        assert.equal(isResourceVisible(doc({ ...overrides, enReady: true }), locale), false, `${label} (${locale})`);
      }
    }
    assert.equal(isResourceVisible(null, "id"), false);
  });

  test("LHU4 planCatalog: null without a visible resource; themes by Topic name; cards by sortOrder then newest; toolkits empty; newestCards; texts; guide page", () => {
    assert.equal(planCatalog([], "id", null), null, "no resource: no catalog (404)");
    assert.equal(planCatalog([doc({ _status: "draft" }), doc({ type: "toolkit" })], "id", null), null);
    assert.equal(planCatalog([doc()], "en", null), null, "EN without enReady: no EN catalog");

    const zeta = topic({ id: 2, name: "Zeta" });
    const alpha = topic({ id: 3, name: "Ąlpha" });
    const docs = [
      doc({ id: 10, topic: zeta, publishedAt: "2090-01-01T00:00:00.000Z" }),
      doc({ id: 11, topic: alpha, sortOrder: 2 }),
      doc({ id: 12, topic: alpha, publishedAt: "2090-03-01T00:00:00.000Z" }),
      doc({ id: 13, topic: alpha, sortOrder: 1, publishedAt: "2080-01-01T00:00:00.000Z" }),
      doc({ id: 14, topic: alpha, publishedAt: "2090-02-01T00:00:00.000Z" }),
      doc({ id: 15, topic: alpha, publishedAt: "2090-02-01T00:00:00.000Z", createdAt: "2090-02-02T00:00:00.000Z" }),
      doc({ id: 16, topic: alpha, type: "toolkit", slug: "fixture-toolkit" }),
      doc({ id: 17, topic: alpha, _status: "draft" }),
    ];
    const plan = planCatalog(docs, "id", null) as CatalogPlan;
    assert.ok(plan);
    assert.equal(plan.locale, "id");
    assert.deepEqual(plan.toolkits, [], "toolkit section empty until M3-13");
    assert.equal(plan.cardCount, 6);
    assert.deepEqual(plan.themes.map((theme) => theme.name), ["Ąlpha", "Zeta"], "Intl.Collator order");
    assert.deepEqual(plan.themes[0]?.cards.map((card) => card.id), [13, 11, 12, 15, 14], "sortOrder 1, 2, then newest (publishedAt, createdAt)");
    assert.equal(plan.themes[0]?.description, `${F} topic description`);
    assert.equal(plan.title, LEARNING_HUB_NAME, "no published global: the product name");
    assert.deepEqual(plan.intro, []);
    assert.equal(plan.seoTitle, null);
    const card = plan.themes[1]?.cards[0];
    assert.deepEqual(card, {
      id: 10,
      type: "video",
      title: `${F} title`,
      summary: `${F} summary one ${F} summary two`,
      materialLanguage: "id",
      href: null,
      youtube: {
        kind: "video",
        id: VIDEO,
        embedUrl: `https://www.youtube-nocookie.com/embed/${VIDEO}?autoplay=1`,
        watchUrl: `https://www.youtube.com/watch?v=${VIDEO}`,
        thumbnailUrl: `https://i.ytimg.com/vi/${VIDEO}/hqdefault.jpg`,
      },
      cover: null,
      publishedAt: "2090-01-01T00:00:00.000Z",
    });
    const playlist = planCatalog(
      [
        doc({
          type: "playlist",
          youtubeId: PLAYLIST,
          coverImage: { url: "https://example.invalid/cover.png", alt: `${F} alt`, mimeType: "image/png", width: 1600, height: 900 },
        }),
      ],
      "id",
      null,
    )?.themes[0]?.cards[0];
    assert.equal(playlist?.youtube?.thumbnailUrl, null, "a playlist has no keyless thumbnail");
    assert.deepEqual(playlist?.cover, { url: "https://example.invalid/cover.png", alt: `${F} alt`, width: 1600, height: 900 });
    const guideCard = planCatalog([guide({ enReady: true })], "en", null)?.themes[0]?.cards[0];
    assert.equal(guideCard?.href, "/en/learning-hub/fixture-guide");
    assert.equal(guideCard?.youtube, null);
    assert.equal(guideCard?.materialLanguage, "id", "an Indonesian guide in the EN catalog keeps its material language");

    assert.deepEqual(newestCards(docs, "id").map((item) => item.id), [12, 15, 14], "3 newest visible, newest first");
    assert.deepEqual(newestCards(docs, "en"), []);
    assert.equal(compareResources(doc({ id: 1 }), doc({ id: 2 })) > 0, true, "same dates: higher id first");

    const global: LearningHubDoc = { _status: "published", hero: { title: `${F} H1`, intro: `${F} intro 1\n\n${F} intro 2` }, seo: {} };
    assert.deepEqual(catalogTexts(global), { title: `${F} H1`, intro: [`${F} intro 1`, `${F} intro 2`], seoTitle: null, seoDescription: `${F} intro 1` });
    assert.deepEqual(catalogTexts({ ...global, seo: { title: `${F} seo`, description: `${F} desc` } }).seoTitle, `${F} seo`);
    assert.equal(catalogTexts({ ...global, _status: "draft" }).title, LEARNING_HUB_NAME, "a draft global is not used");
    assert.equal(catalogTexts({ _status: "published", hero: { title: " " } }).title, LEARNING_HUB_NAME);

    const page = toGuidePage(
      guide({ sections: [{ label: `${F} s1`, body: `${F} p1\n\n${F} p2`, ctas: [{ label: "x", kind: "publications" }] }, { body: `${F} orphan` }] }),
      "id",
    ) as GuidePage;
    assert.equal(page.title, `${F} title`);
    assert.equal(page.slug, "fixture-guide");
    assert.deepEqual(page.summary, [`${F} summary one`, `${F} summary two`]);
    assert.equal(page.themeName, `${F} topic`);
    assert.deepEqual(page.sections, [
      { anchor: null, label: `${F} s1`, heading: null, body: [`${F} p1`, `${F} p2`], quote: null, lists: [], outro: [], ctas: [] },
    ]);
    assert.equal(toGuidePage(doc(), "id"), null, "a video has no page");
    assert.equal(toGuidePage(guide({ title: "" }), "id"), null);
    assert.equal(toGuidePage(guide({ type: "toolkit" }), "id"), null, "no toolkit page before M3-13");
  });
});

type FindArgs = Record<string, unknown>;

function recordingFind(docs: unknown[]) {
  const calls: FindArgs[] = [];
  const find = async (args: FindArgs) => {
    calls.push(args);
    return { docs };
  };
  return { payload: { find } as unknown as Pick<Payload, "find">, calls };
}

describe("Learning Hub reads (lib/cms/learning-hub-query.ts, lib/cms/staff-preview.ts)", () => {
  test("LHU5 public reads: anonymous, published, public types, this locale, no fallback; staff reads: latest version as the user", async () => {
    const anonymous = { fallbackLocale: false, draft: false, overrideAccess: false };
    const publicTypes = { type: { in: ["video", "playlist", "guide"] } };
    const list = recordingFind([{ id: 1 }]);
    assert.deepEqual(await findPublicResources(list.payload, "en"), [{ id: 1 }]);
    const [listArgs] = list.calls;
    assert.ok(listArgs);
    assert.deepEqual({ ...listArgs, select: undefined, populate: undefined }, {
      collection: "learning-resources",
      where: publicTypes,
      select: undefined,
      populate: undefined,
      sort: "id",
      depth: 1,
      pagination: false,
      locale: "en",
      ...anonymous,
    });
    assert.equal("user" in listArgs, false, "no user: Payload access applies");
    assert.equal("sections" in (listArgs.select as object), false, "the catalog does not read guide sections");
    assert.deepEqual(listArgs.populate, {
      topics: { name: true, description: true, isActive: true },
      media: { url: true, alt: true, mimeType: true, width: true, height: true },
    });

    const one = recordingFind([]);
    assert.equal(await findPublicGuide(one.payload, "id", "fixture-guide"), null);
    assert.deepEqual(one.calls[0]?.where, { and: [{ type: { equals: "guide" } }, { slug: { equals: "fixture-guide" } }] });
    assert.equal((one.calls[0]?.select as Record<string, unknown>).sections, true);
    assert.equal(one.calls[0]?.locale, "id");
    for (const [key, value] of Object.entries(anonymous)) assert.equal(one.calls[0]?.[key], value, key);

    const byId = recordingFind([{ id: 5 }]);
    assert.deepEqual(await findPublicResource(byId.payload, 5, "en"), { id: 5 });
    assert.deepEqual(byId.calls[0]?.where, { and: [{ id: { equals: 5 } }, publicTypes] });
    assert.equal("user" in (byId.calls[0] ?? {}), false);

    const globalCalls: FindArgs[] = [];
    const findGlobal = async (args: FindArgs) => {
      globalCalls.push(args);
      return {};
    };
    assert.equal(await findPublicLearningHub({ findGlobal } as unknown as Pick<Payload, "findGlobal">, "en"), null, "{} = no published global");
    assert.deepEqual(globalCalls[0], { slug: "learning-hub", locale: "en", fallbackLocale: false, draft: false, overrideAccess: false, depth: 0 });

    const staff = fakeUser("editor", 3) as unknown as StaffUser;
    const draft = recordingFind([{ id: 9, type: "guide", slug: "fixture-guide" }]);
    assert.deepEqual(await findDraftResourceRef(draft.payload, 9, "en", staff), { id: 9, type: "guide", slug: "fixture-guide" });
    assert.deepEqual(draft.calls[0], {
      collection: "learning-resources",
      where: { id: { equals: 9 } },
      limit: 1,
      depth: 0,
      select: { type: true, slug: true },
      locale: "en",
      fallbackLocale: false,
      draft: true,
      user: staff,
      overrideAccess: false,
    });
    const draftGuide = recordingFind([]);
    assert.equal(await findDraftGuide(draftGuide.payload, "id", "fixture-guide", staff), null);
    assert.equal(draftGuide.calls[0]?.draft, true);
    assert.equal(draftGuide.calls[0]?.user, staff);
    assert.equal(draftGuide.calls[0]?.overrideAccess, false);
    assert.deepEqual(draftGuide.calls[0]?.where, { and: [{ type: { equals: "guide" } }, { slug: { equals: "fixture-guide" } }] });
  });

  test("LHU6 guide preview: Preview URL for guides only; ?resource= needs a locale and excludes id/about; exit targets", async () => {
    const preview = LearningResources.admin?.preview as (doc: unknown, options: unknown) => unknown;
    assert.equal(typeof preview, "function");
    assert.equal(await preview({ id: 4, type: "guide" }, { locale: "en", req: {}, token: null }), "/api/preview?resource=4&locale=en");
    for (const type of ["video", "playlist", "toolkit", undefined]) {
      assert.equal(await preview({ id: 4, type }, { locale: "id", req: {}, token: null }), null, `no Preview button for ${String(type)}`);
    }
    assert.equal(resourcePreviewUrl({ id: 0, type: "guide" }, "id"), null);
    assert.equal(resourcePreviewUrl({ id: 4, type: "guide" }, "all"), null);
    assert.equal(learningHubPath("en"), "/en/learning-hub");
    assert.equal(resourcePath("id", "fixture-guide"), "/id/learning-hub/fixture-guide");
    for (const [locale, slug] of [["xx", "a"], ["id", "Bad"], ["id", "a/b"], ["id", ""], ["ID", "a"]]) assert.equal(resourcePath(locale, slug), null);
    assert.equal(resourceAdminPath(4), "/admin/collections/learning-resources/4");

    const parse = (query: string) => parsePreviewRequest(new URLSearchParams(query));
    assert.deepEqual(parse("resource=4&locale=en"), { kind: "resource", id: 4, locale: "en" });
    assert.deepEqual(parse("resource=4&locale=id&next=https://evil.example"), { kind: "resource", id: 4, locale: "id" });
    assert.deepEqual(parse("id=5&locale=en"), { kind: "publication", id: 5 }, "M3-05 reading unchanged");
    assert.deepEqual(parse("about=en"), { kind: "about", locale: "en" }, "M3-09 reading unchanged");
    for (const query of ["resource=4", "resource=4&locale=xx", "resource=4&locale=EN", "resource=0&locale=id", "resource=abc&locale=id", "resource=4&id=4&locale=id", "resource=4&about=id&locale=id", "id=1&about=id", ""]) {
      assert.equal(parse(query), null, `?${query}`);
    }

    const headers = new Headers({ Cookie: "payload-token=fake" });
    const exitPayload = (user: unknown, live: unknown[]) => {
      const calls: { auth: number; find: FindArgs[] } = { auth: 0, find: [] };
      const payload = {
        auth: async () => {
          calls.auth++;
          return { permissions: {}, user };
        },
        find: async (args: FindArgs) => {
          calls.find.push(args);
          return { docs: live };
        },
        findGlobal: async () => {
          throw new Error("findGlobal in a guide exit");
        },
      } as unknown as Pick<Payload, "auth" | "find" | "findGlobal">;
      return { payload, calls };
    };
    const form = (locale: string, slug = "posted-slug") => ({ id: null, locale, slug, about: null, resource: 4 });
    for (const role of ["editor", "admin"]) {
      const staff = fakeUser(role, 3);
      const live = exitPayload(staff, [guide({ id: 4, slug: "live-slug" })]);
      assert.equal(await previewExitTarget(live.payload, headers, form("id")), "/id/learning-hub/live-slug", `${role}: visible guide, its live slug`);
      assert.equal("user" in (live.calls.find[0] ?? {}), false, "the public check reads anonymously");
      assert.equal(live.calls.find[0]?.locale, "id");
      assert.equal(await previewExitTarget(exitPayload(staff, [guide({ id: 4 })]).payload, headers, form("en")), "/admin/collections/learning-resources/4", `${role}: EN not ready`);
      assert.equal(await previewExitTarget(exitPayload(staff, []).payload, headers, form("id")), "/admin/collections/learning-resources/4", `${role}: never published`);
      assert.equal(await previewExitTarget(exitPayload(staff, [doc({ id: 4 })]).payload, headers, form("id")), "/admin/collections/learning-resources/4", `${role}: not a guide`);
      assert.equal(await previewExitTarget(exitPayload(staff, []).payload, headers, form("xx")), "/admin/collections/learning-resources/4", `${role}: bad locale`);
    }
    for (const user of [null, fakeUser("superuser", 3), fakeUser("editor", 3, "members")]) {
      const visitor = exitPayload(user, [guide({ id: 4 })]);
      assert.equal(await previewExitTarget(visitor.payload, headers, form("en")), "/en/learning-hub/posted-slug", `user ${JSON.stringify(user)}`);
      assert.equal(visitor.calls.find.length, 0, "no read without a staff session");
      assert.equal(await previewExitTarget(visitor.payload, headers, form("en", "Bad Slug")), "/", "invalid posted slug: /");
    }
    assert.equal(fallbackExitTarget({ id: null, locale: "id", slug: "a-b", resource: 4 }), "/id/learning-hub/a-b");
    assert.equal(fallbackExitTarget({ id: null, locale: "id", slug: "a-b", resource: null }), "/id/publications/a-b", "publication exit unchanged");
  });
});

describe("Learning Hub SEO (lib/seo/metadata.ts)", () => {
  test("LHU7 catalog and guide metadata: canonical, hreflang only with both locales, OG /og/site, no JSON-LD; sitemap entries", () => {
    const plan = planCatalog([doc()], "id", null) as CatalogPlan;
    const alone = learningHubMetadata(plan, {});
    assert.equal(alone.title, LEARNING_HUB_NAME, "no SEO title: the H1 with the site-name template");
    assert.equal(alone.description, undefined);
    assert.deepEqual(alone.alternates, { canonical: "/id/learning-hub" });
    const og = alone.openGraph as Record<string, unknown>;
    assert.equal(og.type, "website");
    assert.equal(og.url, "/id/learning-hub");
    assert.equal(og.locale, "id_ID");
    assert.deepEqual(og.images, [{ url: "/og/site", width: 1200, height: 630, alt: "Mahira Indonesia Development" }]);
    assert.equal("other" in alone, false, "no JSON-LD or extra tags");
    assert.deepEqual(learningHubMetadata(plan, { id: "/id/learning-hub" }).alternates, { canonical: "/id/learning-hub" }, "own path only: no hreflang");
    const both = learningHubMetadata(
      planCatalog([doc()], "id", { _status: "published", hero: { title: `${F} H1` }, seo: { title: `${F} seo`, description: `${F} desc` } }) as CatalogPlan,
      { id: "/id/learning-hub", en: "/en/learning-hub" },
    );
    assert.deepEqual(both.title, { absolute: `${F} seo` });
    assert.equal(both.description, `${F} desc`);
    assert.deepEqual(both.alternates, { canonical: "/id/learning-hub", languages: { id: "/id/learning-hub", en: "/en/learning-hub" } });

    const page = toGuidePage(guide({ enReady: true }), "en") as GuidePage;
    const guideMeta = guideMetadata(page, {});
    assert.equal(guideMeta.title, `${F} title`);
    assert.equal(guideMeta.description, `${F} summary one ${F} summary two`);
    assert.deepEqual(guideMeta.alternates, { canonical: "/en/learning-hub/fixture-guide" });
    assert.equal((guideMeta.openGraph as Record<string, unknown>).type, "article");
    assert.equal((guideMeta.openGraph as Record<string, unknown>).locale, "en_GB");
    assert.deepEqual(guideMetadata(page, { en: "/en/learning-hub/fixture-guide", id: "/id/learning-hub/panduan" }).alternates, {
      canonical: "/en/learning-hub/fixture-guide",
      languages: { en: "/en/learning-hub/fixture-guide", id: "/id/learning-hub/panduan" },
    });

    assert.deepEqual(sitemapEntries(null, [], { catalogs: [{ locale: "id", lastModified: null }], guides: [] }), [{ url: "https://mahira.id/" }], "CMS off: only /");
    assert.deepEqual(
      sitemapEntries([], [], {
        catalogs: [{ locale: "id", lastModified: "2090-01-06T00:00:00.000Z" }],
        guides: [
          { locale: "id", slug: "fixture-guide", lastModified: "2090-01-06T00:00:00.000Z" },
          { locale: "en", slug: "Bad Slug", lastModified: null },
        ],
      }),
      [
        { url: "https://mahira.id/" },
        { url: "https://mahira.id/id/publications" },
        { url: "https://mahira.id/en/publications" },
        { url: "https://mahira.id/id/learning-hub", lastModified: "2090-01-06T00:00:00.000Z" },
        { url: "https://mahira.id/id/learning-hub/fixture-guide", lastModified: "2090-01-06T00:00:00.000Z" },
      ],
    );
  });
});

describe("tests/helpers/global-state.ts", () => {
  test("LHU8 diffGlobal: [] for equal snapshots, every changed path otherwise; table naming per global", () => {
    const snapshot = (): GlobalSnapshot => ({
      tables: { learning_hub: ['{"id":1,"_status":"draft"}'], learning_hub_locales: ['{"id":1,"_locale":"id"}'] },
      views: { published: {}, latest: { _status: "draft", hero: { id: { title: "a" } } } },
    });
    assert.deepEqual(diffGlobal(snapshot(), snapshot()), []);
    const changed = snapshot();
    changed.tables.learning_hub = ['{"id":1,"_status":"published"}'];
    changed.tables._learning_hub_v = [];
    (changed.views.latest as { hero: { id: { title: string } } }).hero.id.title = "b";
    assert.deepEqual(diffGlobal(snapshot(), changed), ["tables._learning_hub_v", "tables.learning_hub[0]", "views.latest.hero.id.title"]);
    for (const name of ["learning_hub", "learning_hub_locales", "_learning_hub_v", "_learning_hub_v_locales"]) assert.equal(isGlobalTable("learning-hub", name), true, name);
    for (const name of ["lh_resources", "about", "learning_hubs", "_learning_hub"]) assert.equal(isGlobalTable("learning-hub", name), false, name);
    assert.equal(isGlobalTable("about", "about_sections"), true);
  });
});
