import assert from "node:assert/strict";
import { after, before, describe, test } from "node:test";
import type { Payload, RequiredDataFromCollectionSlug } from "payload";

import type { PublicationFile, User } from "../../payload/payload-types";
import { accessTokenFacts, getRsc, loginSession, parseSetCookie, postAccountForm, sessionTokens, target } from "../helpers/auth-http";
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
  ownerState,
  randomPassword,
  totalOf,
} from "../helpers/fixtures";
import { BASE_URL, assertServerUp, getPage, login, pageFact, postForm, rest, restFact, type PageResult } from "../helpers/http";
import { closeTestPayload, getTestPayload } from "../helpers/payload";
import { fixturePdf } from "../helpers/pdf";
import { assertSafeAuthTarget, countAuthUsers, createAuthUser, sweepAuthUsers, type TestUser } from "../helpers/supabase-admin";

/**
 * Public and staff identity stay apart (M5-01, SPIKE-002 exit criteria,
 * DEC-008, DEC-009, ADR-0003; SRS §12.1 rows reachable in PR-1), area
 * `auth-boundary`, over HTTP against `next start` with accounts on.
 *
 *   AB1 a public account cannot reach Payload: no Payload login with its
 *       credentials, its session cookie or access token is no Payload
 *       session (`/admin` 307, `/api/users/me` null, REST 403)
 *   AB2 forged role metadata on a public user changes nothing in Payload
 *       (no role, no staff user, PATCH of a staff role refused)
 *   AB3 a staff session is not a public session (`/id/account` 307,
 *       change-password `session-ended`)
 *   AB4 both sessions side by side: each provider keeps its own; the
 *       public pages never refresh the public session
 *   AB5 a public PDF downloads the same anonymously and with a public session
 *
 * Fixtures: Payload Editor `fixture-test-auth-boundary-editor@example.invalid`
 * and one published public publication with one public PDF (area
 * `auth-boundary`, cleaned up with the Owner guard before and after);
 * Supabase users `fixture-test-auth-boundary-*` (swept at start and end).
 * Tokens, cookies and signed URLs are never printed.
 */
const AREA = "auth-boundary" as const;
const AUTH_AREA = "boundary" as const;
const PUBLISHED_AT = "2003-02-05T03:00:00.000Z";

function describePage(page: PageResult): string {
  return `${pageFact(page)}${page.location ? ` (${target(page.location)})` : ""}`;
}

async function download(id: number, headers: Record<string, string> = {}): Promise<{ status: number; storageHost: boolean }> {
  const response = await fetch(`${BASE_URL}/api/files/${id}/download`, { headers, redirect: "manual" });
  await response.arrayBuffer();
  const location = response.headers.get("location");
  return { status: response.status, storageHost: location ? new URL(location).host.endsWith(".storage.supabase.co") : false };
}

describe("public and staff identity boundary (M5-01: SPIKE-002, DEC-008, DEC-009)", () => {
  let payload: Payload | undefined;
  let editor: User | undefined;
  let editorToken: string | undefined;
  let file: PublicationFile | undefined;
  const sessions = new Map<string, { user: TestUser; cookie: string }>();
  let usersBefore = 0;

  function p(): Payload {
    if (!payload) throw new Error("Payload not initialised (before hook failed)");
    return payload;
  }

  function session(name: string): { user: TestUser; cookie: string } {
    const found = sessions.get(name);
    if (!found) throw new Error(`public session ${name} missing (before hook failed)`);
    return found;
  }

  function staffCookie(): string {
    if (!editorToken) throw new Error("editor login failed (before hook)");
    return `payload-token=${editorToken}`;
  }

  before(async (t) => {
    assertSafeAuthTarget();
    payload = await getTestPayload();
    hookNote(t, `cleanup at start removed ${formatCounts(await cleanupArea(payload, AREA))}`);
    hookNote(t, `sweep at start removed ${await sweepAuthUsers(AUTH_AREA)} public users`);
    await assertOwnerIntact(payload);
    await assertServerUp();

    const secret = randomPassword();
    editor = await p().create({ collection: "users", data: { email: areaEmail(AREA, "editor"), password: secret, role: "editor" }, overrideAccess: true });
    editorToken = await login(areaEmail(AREA, "editor"), secret);
    usersBefore = (await ownerState(p())).users;

    for (const [name, userMetadata] of [
      ["public", undefined],
      ["forged", { role: "admin", roles: ["admin"], is_staff: true }],
    ] as const) {
      const user = await createAuthUser(AUTH_AREA, name, { userMetadata });
      const { cookie } = await loginSession(user.email, user.password);
      if (!cookie) throw new Error(`public login ${name} failed`);
      sessions.set(name, { user, cookie });
    }

    const data = fixturePdf("auth-boundary public");
    file = await p().create({
      collection: "publication-files",
      data: { label: `${areaLabel(AREA)}file`, kind: "full_document", language: "id", accessLevel: "public", status: "failed" },
      file: { data, mimetype: "application/pdf", name: `${areaPrefix(AREA)}public.pdf`, size: data.length },
      user: editor,
      overrideAccess: false,
      depth: 0,
    });
    const publication: RequiredDataFromCollectionSlug<"publications"> = {
      title: `${areaLabel(AREA)}public`,
      slug: `${areaPrefix(AREA)}public`,
      locale: "id",
      translationGroup: await createGroup(p(), AREA, "public"),
      summary: `${areaLabel(AREA)}ringkasan`,
      publicationType: await firstId(p(), "publication-types"),
      topics: [await firstId(p(), "topics")],
      authors: [await firstId(p(), "authors")],
      accessLevel: "public",
      publishedAt: PUBLISHED_AT,
      files: [file.id],
    };
    await p().create({ collection: "publications", data: { ...publication, _status: "published" }, depth: 0, overrideAccess: true });
  });

  after(async (t) => {
    // Payload cleanup first: it must run even when the Supabase sweep fails.
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

  /** AB1/AB2 checks for one public session. */
  async function assertNoStaffAccess(name: string): Promise<void> {
    const { user, cookie } = session(name);
    const { accessToken } = sessionTokens(cookie);

    const payloadLogin = await rest("POST", "/api/users/login", { body: { email: user.email, password: user.password } });
    assert.equal(typeof payloadLogin.body.token, "undefined", `${name}: Payload login with public credentials (${restFact(payloadLogin)})`);
    assert.equal(payloadLogin.status >= 400, true, `${name}: Payload login refused (${restFact(payloadLogin)})`);

    const admin = await getPage("/admin", { Cookie: cookie });
    assert.equal(admin.status, 307, `${name}: /admin with the public cookie: ${describePage(admin)}`);
    assert.equal(target(admin.location), "/admin/login", `${name}: /admin with the public cookie: ${describePage(admin)}`);
    const adminRsc = await getRsc("/admin/collections/users", { Cookie: cookie });
    assert.equal(target(adminRsc.location).startsWith("/admin/login"), true, `${name}: RSC deep link: ${describePage(adminRsc)}`);

    for (const [label, headers] of [
      ["cookie", { Cookie: cookie }],
      ["Bearer", { Authorization: `Bearer ${accessToken}` }],
      ["JWT", { Authorization: `JWT ${accessToken}` }],
      ["payload-token = access token", { Cookie: `payload-token=${accessToken}` }],
    ] as const) {
      const response = await fetch(`${BASE_URL}/api/users/me`, { headers });
      const body = (await response.json()) as { user?: unknown };
      assert.equal(body.user ?? null, null, `${name}: /api/users/me with the public ${label} (HTTP ${response.status})`);
      const publications = await fetch(`${BASE_URL}/api/publications`, { headers });
      await publications.arrayBuffer();
      assert.equal(publications.status, 403, `${name}: /api/publications with the public ${label}`);
    }
  }

  test("AB1 a public account is no Payload identity: no Payload login, /admin 307 to /admin/login, /api/users/me null, REST 403", async () => {
    await assertNoStaffAccess("public");
  });

  test("AB2 forged role metadata: still no Payload access; JWT role stays `authenticated`; PATCH of a staff role refused; no staff user created", async (t) => {
    const { user, cookie } = session("forged");
    const facts = accessTokenFacts(cookie);
    t.diagnostic(`forged user's JWT: role=${String(facts.role)}, user_metadata.role present=${(facts.userMetadata as { role?: unknown })?.role !== undefined}`);
    assert.equal(facts.role, "authenticated", "the JWT role claim is set by Supabase, not by metadata");
    await assertNoStaffAccess("forged");

    const editorId = editor?.id;
    assert.ok(editorId, "editor created");
    const { accessToken } = sessionTokens(cookie);
    for (const scheme of ["Bearer", "JWT"]) {
      const patch: Response = await fetch(`${BASE_URL}/api/users/${editorId}`, {
        method: "PATCH",
        headers: { Authorization: `${scheme} ${accessToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({ role: "admin" }),
      });
      await patch.arrayBuffer();
      assert.equal(patch.status, 403, `PATCH /api/users/<editor> with ${scheme}`);
    }
    const stored = await p().findByID({ collection: "users", id: editorId, depth: 0, overrideAccess: true });
    assert.equal(stored.role, "editor", "the editor's role is unchanged");
    assert.equal((await ownerState(p())).users, usersBefore, "no Payload user was added");
    const sameEmail = await p().find({ collection: "users", where: { email: { equals: user.email } }, depth: 0, overrideAccess: true, pagination: false });
    assert.equal(sameEmail.totalDocs, 0, "no Payload user with the public email");
  });

  test("AB3 a staff session is not a public session: /id/account (document and RSC) 307 to login; change-password `session-ended`", async () => {
    for (const locale of ["id", "en"] as const) {
      const page = await getPage(`/${locale}/account`, { Cookie: staffCookie() });
      assert.equal(page.status, 307, `${locale}: ${describePage(page)}`);
      assert.equal(target(page.location), `/${locale}/login`, `${locale}: ${describePage(page)}`);
      const rsc = await getRsc(`/${locale}/account`, { Cookie: staffCookie() });
      assert.equal(target(rsc.location), `/${locale}/login`, `RSC ${locale}: ${describePage(rsc)}`);
    }
    const change = await postAccountForm(
      "/id/auth/change-password",
      { current_password: "fixture-pass-1", password: "fixture-pass-2", password_confirm: "fixture-pass-2" },
      staffCookie(),
    );
    assert.equal(change.status, 303, describePage(change));
    assert.equal(target(change.location), "/id/login?status=session-ended", describePage(change));
    const noOrigin = await postForm("/id/auth/change-password", {}, { Cookie: staffCookie() });
    assert.equal(noOrigin.status, 403, `without Origin: ${describePage(noOrigin)}`);
  });

  test("AB4 both sessions: /admin renders for the staff cookie, /id/account passes for the public one; public pages set no public cookie", async () => {
    const both = `${staffCookie()}; ${session("public").cookie}`;
    const admin = await getPage("/admin", { Cookie: both });
    assert.equal(admin.status, 200, `/admin: ${describePage(admin)}`);
    assert.equal(admin.body.includes("dashboard"), true, "dashboard markup");
    const account = await getPage("/id/account", { Cookie: both });
    assert.notEqual(account.status, 307, `/id/account: ${describePage(account)}`);
    for (const path of ["/", "/id/publications"]) {
      const page = await getPage(path, { Cookie: both });
      assert.equal(page.status, 200, `${path}: ${describePage(page)}`);
      const names = page.setCookies.map((line) => parseSetCookie(line).name);
      assert.equal(names.some((name) => name.startsWith("sb-")), false, `${path} sets a Supabase cookie`);
    }
  });

  test("AB5 a public PDF downloads the same for an anonymous visitor, a public session and both sessions (307 to storage)", async () => {
    const id = file?.id;
    assert.ok(id, "file created");
    for (const [label, headers] of [
      ["anonymous", {}],
      ["public session", { Cookie: session("public").cookie }],
      ["public and staff session", { Cookie: `${staffCookie()}; ${session("public").cookie}` }],
    ] as const) {
      const result = await download(id, headers);
      assert.equal(result.status, 307, `${label}: HTTP ${result.status}`);
      assert.equal(result.storageHost, true, `${label}: Location on the storage host`);
    }
  });
});
