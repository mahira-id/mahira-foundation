import assert from "node:assert/strict";
import { after, before, describe, test } from "node:test";
import type { Payload, RequiredDataFromCollectionSlug } from "payload";

import { attachmentDisposition } from "../../lib/publications/file-download";
import type { Publication, PublicationFile } from "../../payload/payload-types";
import {
  applySetCookies,
  isRemoval,
  loginSession,
  parseSetCookie,
  postAccountForm,
  sessionCookieLines,
  sessionTokens,
  tamperSession,
  target,
} from "../helpers/auth-http";
import {
  areaEmail,
  areaLabel,
  areaPrefix,
  assertOwnerIntact,
  cleanupArea,
  countLeftovers,
  createGroup,
  firstId,
  formatCounts,
  hookNote,
  randomPassword,
  totalOf,
} from "../helpers/fixtures";
import { BASE_URL, assertServerUp, getPage, login, pageFact, rest } from "../helpers/http";
import { closeTestPayload, getTestPayload } from "../helpers/payload";
import { fixturePdf } from "../helpers/pdf";
import { fetchAllIndexPages, inlineSegments, robotsContent } from "../helpers/publication-pages";
import { assertSafeAuthTarget, countAuthUsers, createAuthUser, sweepAuthUsers, type TestUser } from "../helpers/supabase-admin";

/**
 * Registered files and visibility (M5-03 + M5-04, DECISIONS §2.18 decisions
 * 11, 12, 14b; SRS §12.1 columns Visitor, Registered, Editor, Admin), area
 * `registered`, over HTTP against `next start` with the CMS and accounts on.
 *
 *   RF1 public PDF: 307 for a visitor, a verified public user, an Editor and an Admin
 *   RF2 registered PDF: only a verified public session gets the 307 (60 s,
 *       attachment); a visitor, an Editor-only and an Admin-only request get
 *       303 to the publication's login page with an internal return path
 *   RF3 subscriber PDF (and any file of a subscriber publication): 404 for everyone
 *   RF4 garbage, tampered and expired cookies: no signed URL; a refreshable
 *       session is refreshed on the download's own answer
 *   RF5 an unconfirmed account gets no session, so no signed URL
 *   RF6 the login return path: internal detail paths only, end to end
 *   RF7 the detail HTML is the same for every visitor and leaks nothing private
 *   RF8 registered on detail, index, search, sitemap and `/`; subscriber nowhere;
 *       anonymous REST and GraphQL closed for both
 *   RF9 headers: no-store and noindex on 303, 307 and 404; private once the session was read
 *
 * Fixtures (slugs and file names `fixture-test-registered-*`, cleaned with the
 * Owner guard before and after): Payload Editor and Admin
 * `fixture-test-registered-{editor,admin}@example.invalid`; ID publications
 * `pub` (public: files `pubfile` public, `regfile` registered, `subfile`
 * subscriber), `regpub` (registered: `onreg` public), `subpub` (subscriber:
 * `onsub` public), EN `enpub` (public: `enreg` registered). Supabase users
 * `fixture-test-auth-files-*` (swept at start and end). Cookies, tokens and
 * signed URLs are never printed: assertions name statuses, paths and booleans.
 */
type PubData = RequiredDataFromCollectionSlug<"publications">;
type Level = PublicationFile["accessLevel"];

const AREA = "registered" as const;
const AUTH_AREA = "files" as const;
const PREFIX = areaPrefix(AREA);
const LABEL = areaLabel(AREA);
/** Newer than any real record, so `regpub` leads `/` while this file runs (and `subpub` would, if it leaked). */
const REGPUB_AT = "2098-01-05T03:00:00.000Z";
const SUBPUB_AT = "2098-02-05T03:00:00.000Z";
const OTHER_AT = "2005-03-05T03:00:00.000Z";
/** Search words no other record uses (synthetic). */
const REG_WORD = "qorvintal";
const SUB_WORD = "zambrelox";
const SITE = "https://mahira.id";
const PRIVATE_MARKERS = [".storage.supabase.co", "storage/v1", "publication-files/file", "_objectKey", "X-Amz-", "signedDownloads", '"prefix"'];

const slug = (name: string) => `${PREFIX}${name}`;
const fileName = (name: string) => `${PREFIX}${name}.pdf`;
const detailPath = (name: string, locale: "id" | "en" = "id") => `/${locale}/publications/${slug(name)}`;
const loginTarget = (name: string, locale: "id" | "en" = "id") => `/${locale}/login?next=${encodeURIComponent(detailPath(name, locale))}`;

type Raw = { status: number; headers: Headers; bytes: Buffer };

async function rawGet(url: string, headers: Record<string, string> = {}): Promise<Raw> {
  const response = await fetch(url, { headers, redirect: "manual" });
  return { status: response.status, headers: response.headers, bytes: Buffer.from(await response.arrayBuffer()) };
}

function download(id: number, headers: Record<string, string> = {}): Promise<Raw> {
  return rawGet(`${BASE_URL}/api/files/${id}/download`, headers);
}

function fact(result: Raw): string {
  const location = result.headers.get("location");
  if (!location) return `HTTP ${result.status}`;
  const url = new URL(location, BASE_URL);
  // A storage Location is a bearer credential: only its host kind is named.
  return url.host.endsWith(".storage.supabase.co") ? `HTTP ${result.status} -> storage` : `HTTP ${result.status} -> ${url.pathname}${url.search}`;
}

/** 307 to a 60 s signed GET of the private bucket that answers as an attachment. */
function assertSigned(result: Raw, label: string, cacheControl: string): void {
  assert.equal(result.status, 307, `${label}: ${fact(result)}`);
  const url = new URL(result.headers.get("location") ?? "");
  assert.equal(url.protocol === "https:" && url.host.endsWith(".storage.supabase.co"), true, `${label}: storage host`);
  assert.equal(url.pathname.startsWith("/storage/v1/s3/publication-files/"), true, `${label}: bucket path`);
  assert.equal(url.searchParams.get("X-Amz-Expires"), "60", `${label}: TTL 60 s`);
  assert.equal(url.searchParams.get("response-content-disposition")?.startsWith("attachment;"), true, `${label}: attachment`);
  assert.equal(result.bytes.length, 0, `${label}: no body`);
  assert.equal(result.headers.get("cache-control"), cacheControl, `${label}: Cache-Control`);
  assert.equal(result.headers.get("x-robots-tag"), "noindex", `${label}: X-Robots-Tag`);
}

/** 303 to the login page of the publication's locale with its detail path, on the server's own host. */
function assertToLogin(result: Raw, name: string, label: string, locale: "id" | "en" = "id"): void {
  assert.equal(result.status, 303, `${label}: ${fact(result)}`);
  const url = new URL(result.headers.get("location") ?? "", BASE_URL);
  assert.equal(url.host, new URL(BASE_URL).host, `${label}: Location on the own host`);
  assert.equal(`${url.pathname}${url.search}`, loginTarget(name, locale), `${label}: ${fact(result)}`);
  assert.equal(result.bytes.length, 0, `${label}: no body`);
  assert.equal(result.headers.get("cache-control"), "private, no-store", `${label}: Cache-Control`);
  assert.equal(result.headers.get("x-robots-tag"), "noindex", `${label}: X-Robots-Tag`);
}

/** The route's one 404: "Not Found", no Location, no-store + noindex (private when the session was read). */
function assertNotFound(result: Raw, label: string, cacheControl = "no-store"): void {
  assert.equal(result.status, 404, `${label}: ${fact(result)}`);
  assert.equal(result.headers.get("location"), null, `${label}: Location`);
  assert.equal(result.bytes.toString("utf8"), "Not Found", `${label}: body`);
  assert.equal(result.headers.get("cache-control"), cacheControl, `${label}: Cache-Control`);
  assert.equal(result.headers.get("x-robots-tag"), "noindex", `${label}: X-Robots-Tag`);
}

function setCookieNames(result: Raw): string[] {
  return result.headers.getSetCookie().map((line) => parseSetCookie(line).name);
}

/** The `<main>` element of a page, streamed segments put back. */
function mainOf(html: string): string {
  const inlined = inlineSegments(html);
  const start = inlined.indexOf("<main");
  const end = inlined.indexOf("</main>", start);
  assert.ok(start !== -1 && end !== -1, "a <main> element");
  return inlined.slice(start, end + "</main>".length);
}

describe("registered files and visibility (M5-03 + M5-04: SRS §12.1 Visitor/Registered/Editor/Admin)", () => {
  let payload: Payload | undefined;
  const files = new Map<string, PublicationFile>();
  const pubs = new Map<string, Publication>();
  const users = new Map<string, TestUser>();
  const staffTokens = new Map<"editor" | "admin", string>();
  let verifiedCookie = "";

  function p(): Payload {
    if (!payload) throw new Error("Payload not initialised (before hook failed)");
    return payload;
  }

  function file(name: string): PublicationFile {
    const record = files.get(name);
    if (!record) throw new Error(`file ${name} not created (before hook failed)`);
    return record;
  }

  function user(name: string): TestUser {
    const found = users.get(name);
    if (!found) throw new Error(`public user ${name} missing (before hook failed)`);
    return found;
  }

  function staffCookie(role: "editor" | "admin"): string {
    const token = staffTokens.get(role);
    if (!token) throw new Error(`${role} login failed (before hook)`);
    return `payload-token=${token}`;
  }

  function verified(): string {
    if (!verifiedCookie) throw new Error("verified public login failed (before hook)");
    return verifiedCookie;
  }

  /** Callers of the SRS §12.1 columns; staff send only their Payload session. */
  function callers(): [string, Record<string, string>][] {
    return [
      ["Visitor", {}],
      ["Registered (verified public session)", { Cookie: verified() }],
      ["Editor (Payload session only)", { Cookie: staffCookie("editor") }],
      ["Admin (Payload session only)", { Cookie: staffCookie("admin") }],
    ];
  }

  async function upload(name: string, accessLevel: Level): Promise<void> {
    const data = fixturePdf(`registered ${name}`);
    files.set(
      name,
      await p().create({
        collection: "publication-files",
        // `status` is system-set (setFileStatus gives `ready` on create).
        data: { label: `${LABEL}${name}`, kind: "full_document", language: "id", accessLevel, status: "ready" },
        file: { data, mimetype: "application/pdf", name: fileName(name), size: data.length },
        overrideAccess: true,
        depth: 0,
      }),
    );
  }

  async function createPub(name: string, title: string, accessLevel: Level, fileNames: string[], publishedAt: string, locale: "id" | "en" = "id"): Promise<void> {
    const data: PubData = {
      title: `${LABEL}${title}`,
      slug: slug(name),
      locale,
      translationGroup: await createGroup(p(), AREA, name),
      summary: `${LABEL}ringkasan ${name}`,
      publicationType: await firstId(p(), "publication-types"),
      topics: [await firstId(p(), "topics")],
      authors: [await firstId(p(), "authors")],
      accessLevel,
      publishedAt,
      files: fileNames.map((key) => file(key).id),
    };
    pubs.set(name, await p().create({ collection: "publications", data: { ...data, _status: "published" }, depth: 0, overrideAccess: true }));
  }

  before(async (t) => {
    assertSafeAuthTarget();
    payload = await getTestPayload();
    hookNote(t, `cleanup at start removed ${formatCounts(await cleanupArea(payload, AREA))}`);
    hookNote(t, `sweep at start removed ${await sweepAuthUsers(AUTH_AREA)} public users`);
    await assertOwnerIntact(payload);
    await assertServerUp();

    for (const role of ["editor", "admin"] as const) {
      const secret = randomPassword();
      await p().create({ collection: "users", data: { email: areaEmail(AREA, role), password: secret, role }, overrideAccess: true });
      const token = await login(areaEmail(AREA, role), secret);
      if (token) staffTokens.set(role, token);
    }
    users.set("verified", await createAuthUser(AUTH_AREA, "verified"));
    users.set("refresh", await createAuthUser(AUTH_AREA, "refresh"));
    users.set("unconfirmed", await createAuthUser(AUTH_AREA, "unconfirmed", { confirmed: false }));
    verifiedCookie = (await loginSession(user("verified").email, user("verified").password)).cookie;

    for (const [name, level] of [
      ["pubfile", "public"],
      ["regfile", "registered"],
      ["subfile", "subscriber"],
      ["onreg", "public"],
      ["onsub", "public"],
      ["enreg", "registered"],
    ] as const) {
      await upload(name, level);
    }
    await createPub("pub", "Publik", "public", ["pubfile", "regfile", "subfile"], OTHER_AT);
    await createPub("regpub", `Terdaftar ${REG_WORD}`, "registered", ["onreg"], REGPUB_AT);
    await createPub("subpub", `Langganan ${SUB_WORD}`, "subscriber", ["onsub"], SUBPUB_AT);
    await createPub("enpub", "Public EN", "public", ["enreg"], OTHER_AT, "en");
  });

  after(async (t) => {
    try {
      if (payload) {
        hookNote(t, `cleanup at end removed ${formatCounts(await cleanupArea(payload, AREA))}`);
        await assertOwnerIntact(payload);
        const left = await countLeftovers(payload, AREA);
        if (totalOf(left) !== 0) throw new Error(`fixtures left after cleanup: ${formatCounts(left)}`);
      }
    } finally {
      await closeTestPayload(payload);
    }
    hookNote(t, `sweep at end removed ${await sweepAuthUsers(AUTH_AREA)} public users`);
    const leftUsers = await countAuthUsers(AUTH_AREA);
    if (leftUsers !== 0) throw new Error(`public fixture users left after the sweep: ${leftUsers}`);
  });

  test("RF1 public PDF: 307 to a 60 s attachment URL for Visitor, Registered, Editor and Admin; the session is never read (no-store, no cookie)", async () => {
    for (const [label, headers] of callers()) {
      const result = await download(file("pubfile").id, headers);
      assertSigned(result, `public file, ${label}`, "no-store");
      assert.deepEqual(setCookieNames(result), [], `public file, ${label}: no Set-Cookie`);
    }
  });

  test("RF2 registered PDF: only a verified public session gets the 307 (attachment, same bytes); Visitor, Editor-only and Admin-only get 303 to the login page with an internal return path", async (t) => {
    const cases: [string, string][] = [
      ["regfile", "pub"],
      ["onreg", "regpub"],
    ];
    for (const [fileKey, pubKey] of cases) {
      const label = `${fileKey} (on ${pubKey})`;
      for (const [caller, headers] of [
        ["Visitor", {}],
        ["Editor cookie", { Cookie: staffCookie("editor") }],
        ["Admin cookie", { Cookie: staffCookie("admin") }],
        ["Editor JWT header", { Authorization: `JWT ${staffCookie("editor").slice("payload-token=".length)}` }],
      ] as const) {
        assertToLogin(await download(file(fileKey).id, headers), pubKey, `${label}, ${caller}`);
      }
      const allowed = await download(file(fileKey).id, { Cookie: verified() });
      assertSigned(allowed, `${label}, verified public session`, "private, no-store");
      const both = await download(file(fileKey).id, { Cookie: `${staffCookie("admin")}; ${verified()}` });
      assertSigned(both, `${label}, Admin + verified public session`, "private, no-store");

      const location = allowed.headers.get("location") ?? "";
      const object = await rawGet(location, { Range: "bytes=0-4" });
      assert.equal(object.status === 200 || object.status === 206, true, `${label}: storage HTTP ${object.status}`);
      assert.equal(object.bytes.subarray(0, 5).toString("latin1"), "%PDF-", `${label}: PDF bytes`);
      assert.equal(object.headers.get("content-disposition"), attachmentDisposition(fileName(fileKey)), `${label}: Content-Disposition attachment`);
      t.diagnostic(`${label}: storage HTTP ${object.status}`);
    }
    assertToLogin(await download(file("enreg").id), "enpub", "EN publication: the EN login page", "en");
  });

  test("RF3 subscriber: a subscriber file on a public publication and a public file on a subscriber publication are the same 404 for everyone", async () => {
    for (const fileKey of ["subfile", "onsub"]) {
      for (const [label, headers] of [...callers(), ["Admin + verified public session", { Cookie: `${staffCookie("admin")}; ${verified()}` }] as [string, Record<string, string>]]) {
        assertNotFound(await download(file(fileKey).id, headers), `${fileKey}, ${label}`);
      }
    }
  });

  test("RF4 garbage, tampered and expired cookies never get a signed URL; a refreshable session is refreshed on the download answer", async (t) => {
    const name = `sb-${new URL(process.env.APP_SUPABASE_URL ?? "").hostname.split(".")[0]}-auth-token`;
    const id = file("regfile").id;
    for (const [label, cookie] of [
      ["garbage", `${name}=garbage`],
      ["bad base64", `${name}=base64-%%%`],
      ["JSON without tokens", `${name}=base64-${Buffer.from('{"a":1}').toString("base64url")}`],
    ] as const) {
      const result = await download(id, { Cookie: cookie });
      assertToLogin(result, "pub", label);
      const lines = result.headers.getSetCookie().filter((line) => parseSetCookie(line).name.startsWith("sb-"));
      assert.equal(lines.every(isRemoval), true, `${label}: only removals`);
    }
    const { cookie } = await loginSession(user("refresh").email, user("refresh").password);
    assert.ok(cookie, "refresh user logged in");
    const past = Math.floor(Date.now() / 1000) - 60;
    const future = Math.floor(Date.now() / 1000) + 3000;
    assertToLogin(await download(id, { Cookie: tamperSession(cookie, { accessToken: "not.a.jwt", expiresAt: future }) }), "pub", "bad access token, not expired");
    const dead = await download(id, { Cookie: tamperSession(cookie, { accessToken: "not.a.jwt", refreshToken: "not-a-refresh-token", expiresAt: past }) });
    assertToLogin(dead, "pub", "bad access and refresh token, expired");
    const deadLines = dead.headers.getSetCookie().filter((line) => parseSetCookie(line).name.startsWith("sb-"));
    t.diagnostic(`dead session: ${deadLines.length} session Set-Cookie lines, all removals=${deadLines.every(isRemoval)}`);
    assert.equal(deadLines.every(isRemoval), true, "a dead session is only ever removed");

    const refreshable = tamperSession(cookie, { accessToken: "not.a.jwt", expiresAt: past });
    const refreshed = await download(id, { Cookie: refreshable });
    assertSigned(refreshed, "expired access token, valid refresh token", "private, no-store");
    const page = { setCookies: refreshed.headers.getSetCookie() } as Parameters<typeof sessionCookieLines>[0];
    const lines = sessionCookieLines(page);
    assert.equal(lines.length > 0 && lines.some((line) => !isRemoval(line)), true, "refreshed session cookie set on the 307");
    for (const line of lines.filter((item) => !isRemoval(item))) {
      const attributes = parseSetCookie(line).attributes.map((attribute) => attribute.toLowerCase());
      assert.equal(attributes.includes("httponly") && attributes.includes("path=/") && attributes.includes("samesite=lax"), true, "HttpOnly, Path=/, SameSite=Lax");
      assert.equal(attributes.some((attribute) => attribute.startsWith("domain=")), false, "host-only");
    }
    const renewed = applySetCookies(refreshable, refreshed.headers.getSetCookie());
    assert.notEqual(sessionTokens(renewed).refreshToken, sessionTokens(cookie).refreshToken, "the refresh token rotated");
    assertSigned(await download(id, { Cookie: renewed }), "the refreshed cookie", "private, no-store");
  });

  test("RF5 an unconfirmed account: login answers `invalid` without a session, and the download stays 303", async () => {
    const attempt = await loginSession(user("unconfirmed").email, user("unconfirmed").password);
    assert.equal(attempt.page.status, 303, pageFact(attempt.page));
    assert.equal(target(attempt.page.location), "/id/login?status=invalid", pageFact(attempt.page));
    assert.equal(attempt.cookie, "", "no session cookie");
    assertToLogin(await download(file("regfile").id, attempt.cookie ? { Cookie: attempt.cookie } : {}), "pub", "unconfirmed account");
  });

  test("RF6 login return path end to end: 303 → login page with a hidden `next` → POST → back on the detail page → 307; foreign or other paths end on /id/account", async () => {
    const first = await download(file("onreg").id);
    assertToLogin(first, "regpub", "anonymous");
    const loginPath = target(first.headers.get("location") ?? "");
    const loginPage = await getPage(loginPath);
    assert.equal(loginPage.status, 200, `GET ${loginPath}: ${pageFact(loginPage)}`);
    const html = inlineSegments(loginPage.body);
    const hidden = /<input[^>]*name="next"[^>]*>/.exec(html)?.[0] ?? "";
    assert.equal(hidden.includes(`value="${detailPath("regpub")}"`), true, `hidden next field: ${hidden || "none"}`);
    assert.equal(hidden.includes('type="hidden"') && hidden.includes('form="login-form"'), true, "hidden, tied to the login form");
    assert.equal(/<form[^>]*id="login-form"[^>]*action="\/id\/auth\/login"/.test(html) || /<form[^>]*action="\/id\/auth\/login"[^>]*id="login-form"/.test(html), true, "the login form");

    const posted = await postAccountForm("/id/auth/login", { email: user("verified").email, password: user("verified").password, next: detailPath("regpub") });
    assert.equal(posted.status, 303, pageFact(posted));
    assert.equal(target(posted.location), detailPath("regpub"), "back on the detail page");
    const session = applySetCookies("", sessionCookieLines(posted));
    assertSigned(await download(file("onreg").id, { Cookie: session }), "after the login", "private, no-store");

    for (const value of ["https://evil.example/id/publications/a", "//evil.example", "/\\evil.example", "/id/account?x=1", "/api/files/1/download", "/id/publications/Bad", "/xx/publications/a"]) {
      const page = await getPage(`/id/login?next=${encodeURIComponent(value)}`);
      assert.equal(/name="next"/.test(inlineSegments(page.body)), false, `login page with next ${JSON.stringify(value)}: no hidden field`);
      const result = await postAccountForm("/id/auth/login", { email: user("verified").email, password: user("verified").password, next: value });
      assert.equal(target(result.location), "/id/account", `next ${JSON.stringify(value)}: ${pageFact(result)}`);
    }
    const failed = await postAccountForm("/id/auth/login", { email: user("verified").email, password: "wrong-password-1", next: detailPath("regpub") });
    assert.equal(target(failed.location), `/id/login?status=invalid&next=${encodeURIComponent(detailPath("regpub"))}`, "a failed login keeps the return path");
  });

  test("RF7 detail HTML: the same <main> for a visitor, a verified public user, staff and both; no session data, no storage location or file name", async () => {
    for (const name of ["pub", "regpub"]) {
      const pages: [string, string][] = [];
      for (const [label, headers] of [...callers(), ["Admin + verified", { Cookie: `${staffCookie("admin")}; ${verified()}` }] as [string, Record<string, string>]]) {
        const result = await getPage(detailPath(name), headers);
        assert.equal(result.status, 200, `${name}, ${label}: ${pageFact(result)}`);
        assert.deepEqual(result.setCookies.map((line) => parseSetCookie(line).name).filter((cookie) => cookie.startsWith("sb-")), [], `${name}, ${label}: sets a Supabase cookie`);
        const cookieName = `sb-${new URL(process.env.APP_SUPABASE_URL ?? "").hostname.split(".")[0]}-auth-token`;
        for (const forbidden of [user("verified").email, cookieName, ...PRIVATE_MARKERS, ...[...files.keys()].map(fileName)]) {
          assert.equal(result.body.includes(forbidden), false, `${name}, ${label}: a private value in the HTML (${forbidden.includes("@") ? "the email" : forbidden})`);
        }
        pages.push([label, mainOf(result.body)]);
      }
      const [, reference] = pages[0] as [string, string];
      for (const [label, main] of pages.slice(1)) assert.equal(main === reference, true, `${name}: <main> for ${label} differs from the visitor's`);
    }
    const panel = mainOf((await getPage(detailPath("pub"))).body);
    for (const key of ["pubfile", "regfile"]) assert.equal(panel.includes(`href="/api/files/${file(key).id}/download"`), true, `link of ${key}`);
    assert.equal(panel.includes(`/api/files/${file("subfile").id}/`), false, "link of the subscriber file");
    assert.equal(panel.includes(`${LABEL}subfile`), false, "label of the subscriber file");
  });

  test("RF8 registered on detail, index, search, sitemap and /; subscriber nowhere; anonymous REST and GraphQL closed for both", async () => {
    const detail = await getPage(detailPath("regpub"));
    assert.equal(detail.status, 200, pageFact(detail));
    assert.equal(detail.body.includes(`data-publication-detail="${slug("regpub")}"`), true, "registered detail page");
    assert.equal(robotsContent(detail.body), null, "registered detail page is indexable");
    const subDetail = await getPage(detailPath("subpub"));
    assert.equal(subDetail.body.includes(`data-publication-detail="${slug("subpub")}"`), false, "subscriber detail page");
    assert.equal(robotsContent(subDetail.body)?.includes("noindex"), true, "subscriber: not-found + noindex");

    const index = await fetchAllIndexPages("id");
    assert.equal(index.slugs.includes(slug("regpub")), true, "registered on /id/publications");
    assert.equal(index.bodies.some((body) => body.includes(slug("subpub")) || body.includes(SUB_WORD)), false, "subscriber on /id/publications");

    const found = await getPage(`/id/publications?q=${REG_WORD}`);
    assert.equal(found.body.includes(`/id/publications/${slug("regpub")}`), true, `?q=${REG_WORD} finds the registered record`);
    const notFound = await getPage(`/id/publications?q=${SUB_WORD}`);
    assert.equal(notFound.body.includes(slug("subpub")), false, `?q=${SUB_WORD}: subscriber record`);
    assert.equal(notFound.body.includes('data-index-total="0"'), true, `?q=${SUB_WORD}: no results`);

    const sitemap = await getPage("/sitemap.xml");
    assert.equal(sitemap.body.includes(`<loc>${SITE}${detailPath("regpub")}</loc>`), true, "registered in the sitemap");
    assert.equal(sitemap.body.includes(slug("subpub")), false, "subscriber in the sitemap");

    const home = await getPage("/");
    assert.equal(home.body.includes(slug("regpub")), true, "registered on / (newest dated)");
    assert.equal(home.body.includes(slug("subpub")) || home.body.includes(SUB_WORD), false, "subscriber on /");

    const privateNames = [slug("regpub"), slug("subpub"), fileName("regfile"), fileName("subfile"), fileName("onreg"), fileName("onsub")];
    for (const path of [
      "/api/publications",
      `/api/publications/${pubs.get("regpub")?.id}`,
      `/api/publications/${pubs.get("subpub")?.id}`,
      "/api/publications?where[slug][like]=fixture-test-registered",
      "/api/publication-files",
      `/api/publication-files/${file("regfile").id}`,
      `/api/publication-files/${file("subfile").id}`,
      `/api/publication-files/file/${fileName("regfile")}`,
      `/api/publication-files/file/${fileName("onsub")}`,
    ]) {
      const result = await rawGet(`${BASE_URL}${path}`);
      assert.equal(result.status >= 200 && result.status < 400, false, `anonymous ${path}: HTTP ${result.status}`);
      assert.equal(result.headers.get("location"), null, `anonymous ${path}: Location`);
      const text = result.bytes.toString("utf8");
      assert.equal(text.includes("%PDF-"), false, `anonymous ${path}: PDF bytes`);
      for (const value of privateNames) assert.equal(text.includes(value), false, `anonymous ${path}: ${value} in the body`);
      for (const marker of ["_objectKey", "prefix", "filename"]) assert.equal(text.includes(marker), false, `anonymous ${path}: ${marker} in the body`);
    }
    for (const query of [
      "{ Publications { docs { id slug accessLevel } } }",
      "{ PublicationFiles { docs { id filename prefix _objectKey } } }",
    ]) {
      const graphql = await rest("POST", "/api/graphql", { body: { query } });
      const text = JSON.stringify(graphql.body);
      assert.notEqual(graphql.status, 200, `anonymous GraphQL: HTTP ${graphql.status}`);
      for (const value of privateNames) assert.equal(text.includes(value), false, `anonymous GraphQL: ${value}`);
    }
  });

  test("RF9 headers: 303, 307 and 404 are never cached and never indexed; private once the public session was read", async () => {
    assertToLogin(await download(file("regfile").id), "pub", "303");
    assertSigned(await download(file("regfile").id, { Cookie: verified() }), "307 registered", "private, no-store");
    assertSigned(await download(file("pubfile").id, { Cookie: verified() }), "307 public", "no-store");
    assertNotFound(await download(file("subfile").id, { Cookie: verified() }), "404 subscriber");
    assertNotFound(await download(2_147_483_647), "404 unknown id");
  });
});
