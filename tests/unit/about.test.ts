import assert from "node:assert/strict";
import { describe, test } from "node:test";
import type { Access, Field, Payload, PayloadRequest } from "payload";

import { aboutPath, isAboutVisible, paragraphs, toAboutPage, type AboutDoc, type AboutPage } from "../../lib/about/about-view";
import { findPublicAbout } from "../../lib/cms/about-query";
import { fallbackExitTarget, findDraftAbout, previewExitTarget, type StaffUser } from "../../lib/cms/staff-preview";
import { ABOUT_ADMIN_PATH, aboutPreviewUrl, parsePreviewRequest } from "../../lib/publications/preview";
import { aboutMetadata, sitemapEntries } from "../../lib/seo/metadata";
import { PUBLIC_ABOUT_READ } from "../../payload/access/public-read";
import { About } from "../../payload/globals/About";
import { denyPublicFallbackForGlobal } from "../../payload/hooks/deny-public-fallback";
import { diffAbout, normalizeAboutView, type AboutSnapshot } from "../helpers/about-state";
import { fakeReq, fakeUser } from "../helpers/fake-req";

/**
 * About page (M3-09, DECISIONS §2.15): the `about` global config and access,
 * the view model, the read contracts, the staff preview helpers, SEO and
 * the snapshot diff of the integration tests. No database, no env: Payload
 * methods are fakes. Fixture text only ("[FIXTURE] …").
 */
const admin = () => fakeReq({ user: fakeUser("admin", 1) });
const editor = () => fakeReq({ user: fakeUser("editor", 2) });
const anonymousRest = () => fakeReq({ payloadAPI: "REST" });
const anonymousLocal = () => fakeReq({ payloadAPI: "local" });

async function run(access: Access | undefined, req: PayloadRequest): Promise<unknown> {
  assert.equal(typeof access, "function", "access function must be defined");
  return (access as Access)({ req } as Parameters<Access>[0]);
}

type NamedField = Field & { name?: string; fields?: Field[]; localized?: boolean; maxRows?: number; type: string };

function field(fields: Field[], name: string): NamedField {
  const found = (fields as NamedField[]).find((candidate) => candidate.name === name);
  assert.ok(found, `field ${name}`);
  return found;
}

function allTypes(fields: Field[]): string[] {
  return (fields as NamedField[]).flatMap((candidate) => [candidate.type, ...allTypes(candidate.fields ?? [])]);
}

const F = "[FIXTURE] test about";

function doc(overrides: Partial<AboutDoc> = {}): AboutDoc {
  return {
    _status: "published",
    enReady: false,
    contactEmail: "fixture-test-about-contact@example.invalid",
    hero: {
      eyebrow: `${F} eyebrow`,
      title: `${F} title`,
      lead: `${F} lead 1\n\n${F} lead 2`,
      ctas: [
        { label: `${F} cta anchor`, kind: "anchor", anchor: "section-two" },
        { label: `${F} cta publications`, kind: "publications" },
      ],
    },
    sections: [
      { label: `${F} s1 label`, heading: `${F} s1 heading`, body: `${F} s1 p1\n\n${F} s1 p2`, quote: `${F} s1 quote` },
      {
        anchor: "section-two",
        label: `${F} s2 label`,
        body: `${F} s2 intro`,
        lists: [
          {
            style: "numbered",
            items: [
              { title: `${F} n1 title`, text: `${F} n1 text` },
              { title: `${F} n2 title`, subtitle: `${F} n2 subtitle`, text: `${F} n2 text` },
            ],
          },
          { heading: `${F} l2 heading`, intro: `${F} l2 intro`, style: "bulleted", items: [{ text: `${F} b1 text` }] },
        ],
        outro: `${F} s2 outro`,
        ctas: [{ label: `${F} cta email`, kind: "email" }],
      },
    ],
    seo: { title: `${F} seo title`, description: `${F} seo description` },
    ...overrides,
  };
}

describe("payload/globals/About.ts", () => {
  test("ABU1 config: slug, drafts + 25 versions, localized hero/sections/seo, shared email + EN checkbox, no rich text, max 2 CTAs, access matrix, fallback hook", async () => {
    assert.equal(About.slug, "about");
    assert.deepEqual(About.versions, { drafts: true, max: 25 });
    const fields = About.fields;
    for (const name of ["hero", "sections", "seo"]) assert.equal(field(fields, name).localized, true, `${name} localized`);
    for (const name of ["contactEmail", "enReady"]) assert.notEqual(field(fields, name).localized, true, `${name} shared`);
    const enReady = field(fields, "enReady") as NamedField & { defaultValue?: unknown; label?: unknown };
    assert.equal(enReady.type, "checkbox");
    assert.equal(enReady.defaultValue, false);
    assert.equal(enReady.label, "Versi EN siap tayang");
    assert.equal(field(fields, "contactEmail").type, "email");
    assert.equal(allTypes(fields).includes("richText"), false, "no rich text field (decision 2 as revised by 13A)");
    assert.equal(field(field(fields, "hero").fields ?? [], "ctas").maxRows, 2);
    assert.equal(field(field(fields, "sections").fields ?? [], "ctas").maxRows, 2);
    const kinds = (field(field(field(fields, "hero").fields ?? [], "ctas").fields ?? [], "kind") as NamedField & { options?: { value: string }[] }).options;
    assert.deepEqual(kinds?.map((option) => option.value), ["anchor", "publications", "email"], "CTA targets from code, never a URL field");

    // Access: staff read all; anonymous Local API = published only; anonymous REST and others denied.
    const read = About.access?.read;
    assert.equal(await run(read, admin()), true);
    assert.equal(await run(read, editor()), true);
    assert.deepEqual(await run(read, anonymousLocal()), PUBLIC_ABOUT_READ);
    assert.deepEqual(PUBLIC_ABOUT_READ, { _status: { equals: "published" } });
    assert.equal(await run(read, anonymousRest()), false);
    assert.equal(await run(read, fakeReq({ payloadAPI: "GraphQL" })), false);
    assert.equal(await run(read, fakeReq({ user: fakeUser("superuser", 3), payloadAPI: "local" })), false, "unknown role, even via Local API");
    assert.equal(await run(read, fakeReq({ user: fakeUser("editor", 4, "members"), payloadAPI: "local" })), false, "other auth collection");
    for (const operation of ["update", "readVersions"] as const) {
      const access = About.access?.[operation];
      assert.equal(await run(access, admin()), true, `${operation} admin`);
      assert.equal(await run(access, editor()), true, `${operation} editor (DEC-016)`);
      for (const req of [anonymousLocal(), anonymousRest(), fakeReq({ user: fakeUser("superuser", 3) })]) {
        assert.equal(await run(access, req), false, `${operation} denied`);
      }
    }
    assert.deepEqual(About.hooks?.beforeOperation, [denyPublicFallbackForGlobal]);
  });

  test("ABU1b denyPublicFallbackForGlobal: an anonymous read asking for a fallback locale is refused; none asked or staff: args unchanged", async () => {
    const call = (req: PayloadRequest, args: Record<string, unknown>) =>
      denyPublicFallbackForGlobal({ args, req, operation: "read", context: {}, global: {} } as unknown as Parameters<typeof denyPublicFallbackForGlobal>[0]);
    for (const fallbackLocale of ["en", "id", ["en"]]) {
      for (const payloadAPI of ["local", "REST"] as const) {
        assert.throws(() => call(fakeReq({ payloadAPI, fallbackLocale }), {}), { name: "Forbidden" }, `${payloadAPI} ${JSON.stringify(fallbackLocale)}`);
      }
    }
    for (const fallbackLocale of [false, undefined, null, "", []]) {
      const args = { slug: "about" };
      assert.equal(call(fakeReq({ payloadAPI: "local", fallbackLocale }), args), args, `anonymous ${JSON.stringify(fallbackLocale)}`);
    }
    const args = { slug: "about" };
    const req = fakeReq({ user: fakeUser("editor", 2), payloadAPI: "REST", fallbackLocale: "en" });
    assert.equal(call(req, args), args, "staff keep the requested fallback");
    assert.equal(req.fallbackLocale, "en");
  });

  test("ABU5 admin.preview and the preview URL: /api/preview?about=<locale>; exactly one of id/about", async () => {
    const preview = About.admin?.preview as (doc: unknown, options: unknown) => unknown;
    assert.equal(typeof preview, "function");
    assert.equal(await preview({}, { locale: "id", req: {}, token: null }), "/api/preview?about=id");
    assert.equal(await preview({}, { locale: "en", req: {}, token: null }), "/api/preview?about=en");
    assert.equal(await preview({}, { locale: "all", req: {}, token: null }), null);
    assert.equal(aboutPreviewUrl("ID"), null);
    assert.equal(aboutPath("id"), "/id/about");
    assert.equal(ABOUT_ADMIN_PATH, "/admin/globals/about");

    const parse = (query: string) => parsePreviewRequest(new URLSearchParams(query));
    assert.deepEqual(parse("id=5"), { kind: "publication", id: 5 });
    assert.deepEqual(parse("about=id"), { kind: "about", locale: "id" });
    assert.deepEqual(parse("about=en&next=https://evil.example"), { kind: "about", locale: "en" });
    for (const query of ["", "about=", "about=ID", "about=xx", "about=id/x", "id=5&about=id", "about=id&id=", "id=abc", "id=0", "slug=x", "next=/id/about"]) {
      assert.equal(parse(query), null, `?${query}`);
    }
  });
});

describe("lib/about/about-view.ts", () => {
  test("ABU2 isAboutVisible: published + H1 + SEO title + description; EN also needs enReady", () => {
    assert.equal(isAboutVisible(doc(), "id"), true);
    assert.equal(isAboutVisible(doc(), "en"), false, "EN without the checkbox");
    assert.equal(isAboutVisible(doc({ enReady: true }), "en"), true);
    assert.equal(isAboutVisible(doc({ enReady: null }), "en"), false);
    for (const status of ["draft", null, undefined, "Published"]) {
      assert.equal(isAboutVisible(doc({ _status: status, enReady: true }), "id"), false, `_status ${String(status)}`);
    }
    const missing: Partial<AboutDoc>[] = [
      { hero: { title: "" } },
      { hero: { title: "   " } },
      { hero: null },
      { seo: { title: `${F} t`, description: "" } },
      { seo: { title: null, description: `${F} d` } },
      { seo: null },
    ];
    for (const overrides of missing) {
      for (const locale of ["id", "en"] as const) {
        assert.equal(isAboutVisible(doc({ ...overrides, enReady: true }), locale), false, `${locale} ${JSON.stringify(overrides)}`);
      }
    }
    assert.equal(isAboutVisible(null, "id"), false);
    assert.equal(isAboutVisible({}, "id"), false);
  });

  test("ABU3 toAboutPage: paragraphs, null for empty, CTA hrefs from code, dropped targets, sections, lists, items", () => {
    const page = toAboutPage(doc(), "id") as AboutPage;
    assert.ok(page);
    assert.equal(page.locale, "id");
    assert.equal(page.title, `${F} title`);
    assert.equal(page.eyebrow, `${F} eyebrow`);
    assert.deepEqual(page.lead, [`${F} lead 1`, `${F} lead 2`]);
    assert.deepEqual(page.ctas, [
      { label: `${F} cta anchor`, href: "#section-two" },
      { label: `${F} cta publications`, href: "/id/publications" },
    ]);
    assert.equal(page.seoTitle, `${F} seo title`);
    assert.equal(page.seoDescription, `${F} seo description`);
    assert.equal(page.sections.length, 2);
    const [first, second] = page.sections;
    assert.deepEqual(first, {
      anchor: null,
      label: `${F} s1 label`,
      heading: `${F} s1 heading`,
      body: [`${F} s1 p1`, `${F} s1 p2`],
      quote: `${F} s1 quote`,
      lists: [],
      outro: [],
      ctas: [],
    });
    assert.equal(second?.anchor, "section-two");
    assert.equal(second?.heading, null);
    assert.deepEqual(second?.lists, [
      {
        heading: null,
        intro: [],
        style: "numbered",
        items: [
          { title: `${F} n1 title`, subtitle: null, text: `${F} n1 text` },
          { title: `${F} n2 title`, subtitle: `${F} n2 subtitle`, text: `${F} n2 text` },
        ],
      },
      { heading: `${F} l2 heading`, intro: [`${F} l2 intro`], style: "bulleted", items: [{ title: null, subtitle: null, text: `${F} b1 text` }] },
    ]);
    assert.deepEqual(second?.outro, [`${F} s2 outro`]);
    assert.deepEqual(second?.ctas, [{ label: `${F} cta email`, href: "mailto:fixture-test-about-contact@example.invalid" }]);
    assert.deepEqual(toAboutPage(doc(), "en")?.ctas[1], { label: `${F} cta publications`, href: "/en/publications" });

    // Dropped: CTA without label or target, invalid email, unknown kind; section without label and heading;
    // list without items; item without title and text; repeated, reserved or invalid anchor (section kept).
    const messy = toAboutPage(
      doc({
        contactEmail: "not an email",
        hero: {
          title: `  ${F} title  `,
          eyebrow: "  ",
          lead: "",
          ctas: [
            { label: "", kind: "publications" },
            { label: `${F} x`, kind: "anchor", anchor: "no-such-section" },
            { label: `${F} y`, kind: "email" },
            { label: `${F} z`, kind: "url" },
          ],
        },
        sections: [
          { label: null, heading: "  ", body: `${F} orphan` },
          { anchor: "main", label: `${F} a` },
          { anchor: "dup", label: `${F} b`, lists: [{ style: "bulleted", items: [] }, { style: "other", items: [{ title: " ", text: "" }, { text: `${F} t` }] }] },
          { anchor: "dup", label: `${F} c` },
          { anchor: "Bad Anchor", label: `${F} d` },
        ],
      }),
      "id",
    ) as AboutPage;
    assert.equal(messy.title, `${F} title`);
    assert.equal(messy.eyebrow, null);
    assert.deepEqual(messy.lead, []);
    assert.deepEqual(messy.ctas, []);
    assert.deepEqual(messy.sections.map((section) => [section.label, section.anchor]), [
      [`${F} a`, null],
      [`${F} b`, "dup"],
      [`${F} c`, null],
      [`${F} d`, null],
    ]);
    assert.deepEqual(messy.sections[1]?.lists, [{ heading: null, intro: [], style: "bulleted", items: [{ title: null, subtitle: null, text: `${F} t` }] }]);
    assert.equal(toAboutPage(doc({ hero: { title: " " } }), "id"), null, "no H1, no page");
    assert.equal(toAboutPage({}, "id"), null);
  });

  test("ABU3b paragraphs: blank lines split, CRLF, inner line breaks become spaces, empty dropped", () => {
    assert.deepEqual(paragraphs("a\n\nb"), ["a", "b"]);
    assert.deepEqual(paragraphs("a\r\n\r\nb\r\nc"), ["a", "b c"]);
    assert.deepEqual(paragraphs("  a  \n \n\n\n b \n"), ["a", "b"]);
    assert.deepEqual(paragraphs(""), []);
    assert.deepEqual(paragraphs(null), []);
    assert.deepEqual(paragraphs(5), []);
  });
});

type FindGlobalArgs = Record<string, unknown>;

function recordingFindGlobal(result: unknown) {
  const calls: FindGlobalArgs[] = [];
  const findGlobal = async (args: FindGlobalArgs) => {
    calls.push(args);
    return result;
  };
  return { payload: { findGlobal } as unknown as Pick<Payload, "findGlobal">, calls };
}

describe("About reads (lib/cms/about-query.ts, lib/cms/staff-preview.ts)", () => {
  test("ABU4 findPublicAbout: anonymous, published only, this locale, no fallback; {} = none. findDraftAbout: latest version as the staff user", async () => {
    const pub = recordingFindGlobal({ hero: { title: `${F} t` } });
    assert.deepEqual(await findPublicAbout(pub.payload, "en"), { hero: { title: `${F} t` } });
    const [args] = pub.calls;
    assert.ok(args);
    assert.deepEqual(args, { slug: "about", locale: "en", fallbackLocale: false, draft: false, overrideAccess: false, depth: 0 });
    assert.equal("user" in args, false, "no user: Payload access gives the published version only");
    assert.equal(await findPublicAbout(recordingFindGlobal({}).payload, "id"), null, "{} (no published row) is no document");
    assert.equal(await findPublicAbout(recordingFindGlobal(null).payload, "id"), null);

    const staff = fakeUser("editor", 3) as unknown as StaffUser;
    const draft = recordingFindGlobal({ hero: { title: `${F} d` } });
    assert.deepEqual(await findDraftAbout(draft.payload, "id", staff), { hero: { title: `${F} d` } });
    assert.deepEqual(draft.calls[0], { slug: "about", locale: "id", fallbackLocale: false, draft: true, user: staff, overrideAccess: false, depth: 0 });
    assert.equal(await findDraftAbout(recordingFindGlobal({}).payload, "id", staff), null);
  });

  test("ABU6 previewExitTarget (About): staff + public About -> /{l}/about, staff without -> /admin/globals/about, no staff -> /{l}/about without a read", async () => {
    const headers = new Headers({ Cookie: "payload-token=fake" });
    const exitPayload = (user: unknown, published: unknown) => {
      const calls: { auth: number; find: number; findGlobal: FindGlobalArgs[] } = { auth: 0, find: 0, findGlobal: [] };
      const payload = {
        auth: async () => {
          calls.auth++;
          return { permissions: {}, user };
        },
        find: async () => {
          calls.find++;
          return { docs: [] };
        },
        findGlobal: async (args: FindGlobalArgs) => {
          calls.findGlobal.push(args);
          return published;
        },
      } as unknown as Pick<Payload, "auth" | "find" | "findGlobal">;
      return { payload, calls };
    };
    const form = (about: "id" | "en") => ({ id: 9, locale: "id", slug: "posted", about });

    for (const role of ["editor", "admin"]) {
      const staff = fakeUser(role, 3);
      const live = exitPayload(staff, doc());
      assert.equal(await previewExitTarget(live.payload, headers, form("id")), "/id/about", `${role}: ID public`);
      assert.equal(live.calls.findGlobal.length, 1);
      assert.equal("user" in (live.calls.findGlobal[0] ?? {}), false, "the public check reads anonymously");
      assert.equal(live.calls.find, 0, "an About exit never reads publications (the posted id is ignored)");
      assert.equal(await previewExitTarget(live.payload, headers, form("en")), ABOUT_ADMIN_PATH, `${role}: EN without the checkbox`);
      assert.equal(await previewExitTarget(exitPayload(staff, doc({ enReady: true })).payload, headers, form("en")), "/en/about");
      assert.equal(await previewExitTarget(exitPayload(staff, {}).payload, headers, form("id")), ABOUT_ADMIN_PATH, `${role}: never published`);
    }
    for (const user of [null, fakeUser("superuser", 3), fakeUser("editor", 3, "members")]) {
      const visitor = exitPayload(user, doc());
      assert.equal(await previewExitTarget(visitor.payload, headers, form("en")), "/en/about", `user ${JSON.stringify(user)}`);
      assert.equal(visitor.calls.findGlobal.length + visitor.calls.find, 0, "no read without a staff session");
    }
    assert.equal(fallbackExitTarget({ id: null, locale: "", slug: "", about: "en" }), "/en/about");
    assert.equal(fallbackExitTarget({ id: null, locale: "id", slug: "pub", about: null }), "/id/publications/pub");
    assert.equal(fallbackExitTarget({ id: null, locale: "", slug: "" }), "/");
  });
});

describe("About SEO (lib/seo/metadata.ts)", () => {
  test("ABU7 aboutMetadata: absolute SEO title, description, self canonical, hreflang only with both locales, OG website /og/site; sitemap entries", () => {
    const page = toAboutPage(doc(), "id") as AboutPage;
    const alone = aboutMetadata(page, {});
    assert.deepEqual(alone.title, { absolute: `${F} seo title` });
    assert.equal(alone.description, `${F} seo description`);
    assert.deepEqual(alone.alternates, { canonical: "/id/about" });
    const og = alone.openGraph as Record<string, unknown>;
    assert.equal(og.type, "website");
    assert.equal(og.locale, "id_ID");
    assert.equal(og.url, "/id/about");
    assert.equal(og.title, `${F} seo title`);
    assert.deepEqual(og.images, [{ url: "/og/site", width: 1200, height: 630, alt: "Mahira Indonesia Development" }]);
    assert.equal((alone.twitter as Record<string, unknown>).card, "summary_large_image");
    assert.deepEqual(aboutMetadata(page, { id: "/id/about" }).alternates, { canonical: "/id/about" }, "own path only: no hreflang");

    const en = toAboutPage(doc({ enReady: true }), "en") as AboutPage;
    assert.deepEqual(aboutMetadata(en, { id: "/id/about", en: "/en/about" }).alternates, {
      canonical: "/en/about",
      languages: { en: "/en/about", id: "/id/about" },
    });
    assert.equal((aboutMetadata(en, {}).openGraph as Record<string, unknown>).locale, "en_GB");

    assert.deepEqual(sitemapEntries(null, [{ locale: "id", updatedAt: "2026-11-17T00:00:00.000Z" }]), [{ url: "https://mahira.id/" }], "CMS off: only /");
    assert.deepEqual(sitemapEntries([], [{ locale: "id", updatedAt: "2026-11-17T00:00:00.000Z" }, { locale: "en", updatedAt: null }]), [
      { url: "https://mahira.id/" },
      { url: "https://mahira.id/id/publications" },
      { url: "https://mahira.id/en/publications" },
      { url: "https://mahira.id/id/about", lastModified: "2026-11-17T00:00:00.000Z" },
      { url: "https://mahira.id/en/about" },
    ]);
  });
});

describe("tests/helpers/about-state.ts diffAbout", () => {
  test("ABU8 diffAbout: [] for equal snapshots; the paths of every difference (rows, missing table, views)", () => {
    const snapshot = (): AboutSnapshot => ({
      tables: { about: ['{"id":1,"_status":"draft"}'], about_locales: ['{"id":1,"_locale":"id"}', '{"id":2,"_locale":"en"}'] },
      views: { published: { _status: "draft", enReady: false, hero: { id: { title: "a" } } }, latest: { _status: "draft" } },
    });
    assert.deepEqual(diffAbout(snapshot(), snapshot()), []);
    const changed = snapshot();
    changed.tables.about = ['{"id":1,"_status":"published"}'];
    changed.tables.about_locales = ['{"id":1,"_locale":"id"}'];
    delete (changed.tables as Record<string, string[]>).about_locales;
    changed.tables._about_v = [];
    (changed.views.published as Record<string, unknown>).enReady = true;
    ((changed.views.published as { hero: { id: { title: string } } }).hero.id).title = "b";
    changed.views.latest = { _status: "draft", extra: 1 };
    assert.deepEqual(diffAbout(snapshot(), changed), [
      "tables._about_v",
      "tables.about[0]",
      "tables.about_locales",
      "views.latest.extra",
      "views.published.enReady",
      "views.published.hero.id.title",
    ]);
    const fewer = snapshot();
    fewer.tables.about_locales = ['{"id":1,"_locale":"id"}'];
    assert.deepEqual(diffAbout(snapshot(), fewer), ["tables.about_locales.length"]);
  });

  test("ABU8b normalizeAboutView: drops record ids and timestamps, keeps the Indonesian locale key of localized values", () => {
    const view = {
      id: 1,
      updatedAt: "2026-11-17T00:00:00.000Z",
      createdAt: "2026-11-17T00:00:00.000Z",
      _status: "draft",
      enReady: false,
      hero: { id: { title: `${F} id`, ctas: [{ id: "row1", label: `${F} c`, kind: "publications" }] }, en: { title: `${F} en`, ctas: [] } },
      sections: { id: [{ id: "row2", label: `${F} s` }] },
      seo: { title: { id: `${F} t` } },
    };
    assert.deepEqual(normalizeAboutView(view), {
      _status: "draft",
      enReady: false,
      hero: { id: { title: `${F} id`, ctas: [{ label: `${F} c`, kind: "publications" }] }, en: { title: `${F} en`, ctas: [] } },
      sections: { id: [{ label: `${F} s` }] },
      seo: { title: { id: `${F} t` } },
    });
  });
});
