import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, test } from "node:test";
import { NextRequest } from "next/server";

import { ANONYMOUS, type Principal } from "../../lib/access/evaluator";
import { decideFileDownload, loginLocation, type FileDownloadPorts, type LivePublicationFacts } from "../../lib/access/file-download";
import { readDownloadPrincipal, withSessionWrites } from "../../lib/auth/download-session";
import type { AuthClient, CookieJar } from "../../lib/auth/supabase";
import { downloadResponse } from "../../lib/publications/file-download";
import { withAccounts } from "../helpers/auth-env";

/**
 * Registered file downloads (M5-04, DECISIONS §2.18 decisions 11, 12 and
 * 14b) without a server: the decision with fake ports (RDU1–RDU4), the
 * public principal with a fake Supabase client (RDU5–RDU6) and the answer
 * with the session cookies (RDU7). The HTTP behaviour against the real
 * Supabase Auth and bucket is tests/integration/registered-files.test.ts.
 */
type FakeFile = { id: number; status: string; mimeType: string; accessLevel: string };

const SIGNED = "https://ref.storage.supabase.co/storage/v1/s3/publication-files/k/a.pdf?X-Amz-Expires=60";
const VERIFIED: Principal = { kind: "public_user", emailVerified: true };
const UNVERIFIED: Principal = { kind: "public_user", emailVerified: false };

function ports(
  options: {
    file?: Partial<FakeFile> | null;
    publication?: LivePublicationFacts | null;
    principal?: Principal | (() => Promise<Principal>);
    accountsEnabled?: boolean;
  } = {},
) {
  const calls: string[] = [];
  const file = options.file === null ? null : { id: 4, status: "ready", mimeType: "application/pdf", accessLevel: "public", ...options.file };
  const publication = options.publication === null ? null : { accessLevel: "public", locale: "id", slug: "laporan", ...options.publication };
  const value: FileDownloadPorts<FakeFile> = {
    accountsEnabled: options.accountsEnabled ?? true,
    async findFile() {
      calls.push("findFile");
      return file;
    },
    async findPublication() {
      calls.push("findPublication");
      return publication;
    },
    async principal() {
      calls.push("principal");
      const principal = options.principal ?? ANONYMOUS;
      return typeof principal === "function" ? principal() : principal;
    },
    async sign() {
      calls.push("sign");
      return SIGNED;
    },
  };
  return { ports: value, calls };
}

const LOGIN_ID = { kind: "login", location: "/id/login?next=%2Fid%2Fpublications%2Flaporan" };

describe("lib/access/file-download.ts decideFileDownload", () => {
  test("RDU1 public file: 307 for everyone, the session is never read", async () => {
    const run = ports();
    assert.deepEqual(await decideFileDownload(4, run.ports), { kind: "redirect", url: SIGNED });
    assert.deepEqual(run.calls, ["findFile", "findPublication", "sign"], "no principal call for a public file");
    const off = ports({ accountsEnabled: false });
    assert.deepEqual(await decideFileDownload(4, off.ports), { kind: "redirect", url: SIGNED }, "accounts off: public unchanged");
  });

  test("RDU2 registered file: verified → 307; anonymous (also a staff-only request) → 303 login with the detail path; unverified → 404; sign only after the allow", async () => {
    for (const [label, options] of [
      ["registered file on a public publication", { file: { accessLevel: "registered" } }],
      ["public file on a registered publication", { publication: { accessLevel: "registered" } }],
    ] as const) {
      const verified = ports({ ...options, principal: VERIFIED });
      assert.deepEqual(await decideFileDownload(4, verified.ports), { kind: "redirect", url: SIGNED }, `${label}: verified`);
      assert.deepEqual(verified.calls, ["findFile", "findPublication", "principal", "sign"], `${label}: principal before sign`);

      const anonymous = ports({ ...options, principal: ANONYMOUS });
      assert.deepEqual(await decideFileDownload(4, anonymous.ports), LOGIN_ID, `${label}: anonymous`);
      assert.equal(anonymous.calls.includes("sign"), false, `${label}: anonymous never signs`);

      const unverified = ports({ ...options, principal: UNVERIFIED });
      assert.deepEqual(await decideFileDownload(4, unverified.ports), { kind: "not-found" }, `${label}: unverified`);
      assert.equal(unverified.calls.includes("sign"), false, `${label}: unverified never signs`);

      const throwing = ports({ ...options, principal: async () => Promise.reject(new Error("network")) });
      assert.deepEqual(await decideFileDownload(4, throwing.ports), LOGIN_ID, `${label}: a failing session read counts as anonymous`);
      assert.equal(throwing.calls.includes("sign"), false);

      const off = ports({ ...options, principal: VERIFIED, accountsEnabled: false });
      assert.deepEqual(await decideFileDownload(4, off.ports), { kind: "not-found" }, `${label}: accounts off`);
      assert.deepEqual(off.calls, ["findFile", "findPublication"], `${label}: accounts off reads no session`);
    }
    const en = ports({ file: { accessLevel: "registered" }, publication: { locale: "en", slug: "energy-report" } });
    assert.deepEqual(await decideFileDownload(4, en.ports), { kind: "login", location: "/en/login?next=%2Fen%2Fpublications%2Fenergy-report" }, "the publication's locale");
  });

  test("RDU3 subscriber, unknown, not ready, missing file or publication: the same 404, no session read, no signing", async () => {
    const cases: [string, Parameters<typeof ports>[0]][] = [
      ["subscriber file", { file: { accessLevel: "subscriber" } }],
      ["public file on a subscriber publication", { publication: { accessLevel: "subscriber" } }],
      ["unknown file level", { file: { accessLevel: "vip" } }],
      ["unknown publication level", { publication: { accessLevel: undefined } }],
      ["not ready", { file: { accessLevel: "registered", status: "pending" } }],
      ["not a PDF", { file: { mimeType: "image/png" } }],
      ["no file", { file: null }],
      ["no live publication", { publication: null }],
    ];
    for (const [label, options] of cases) {
      const run = ports({ ...options, principal: VERIFIED });
      assert.deepEqual(await decideFileDownload(4, run.ports), { kind: "not-found" }, label);
      assert.equal(run.calls.includes("principal"), false, `${label}: no session read`);
      assert.equal(run.calls.includes("sign"), false, `${label}: no signing`);
    }
    const none = ports({ file: null });
    await decideFileDownload(4, none.ports);
    assert.deepEqual(none.calls, ["findFile"], "no publication read without a file");
  });

  test("RDU4 login Location: only an internal detail path; a bad slug or locale gives the plain login page", () => {
    assert.equal(loginLocation({ locale: "id", slug: "a-b" }), "/id/login?next=%2Fid%2Fpublications%2Fa-b");
    assert.equal(loginLocation({ locale: "en", slug: "Bad" }), "/en/login", "slug outside SLUG_PATTERN");
    assert.equal(loginLocation({ locale: "en", slug: "//evil.example" }), "/en/login");
    assert.equal(loginLocation({ locale: "en", slug: undefined }), "/en/login");
    assert.equal(loginLocation({ locale: "xx", slug: "a" }), "/id/login", "unknown locale: the default locale");
    assert.equal(loginLocation({}), "/id/login");
  });
});

/** A fake createAuthClient: getUser answers `reply` and may set cookies through the jar. */
function fakeFactory(reply: () => Promise<unknown>, setCookies = false) {
  const calls: { cookies: string[] }[] = [];
  const factory = (jar: CookieJar) => {
    calls.push({ cookies: jar.getAll().map(({ name }) => name) });
    const client = {
      getUser: async () => {
        if (setCookies) {
          jar.setAll([{ name: "sb-abc-auth-token", value: "refreshed", options: { httpOnly: true, sameSite: "lax", path: "/" } }], {
            "Cache-Control": "private, no-cache, no-store, must-revalidate, max-age=0",
            Expires: "0",
            Pragma: "no-cache",
          });
        }
        return reply();
      },
    };
    return client as unknown as AuthClient;
  };
  return { factory, calls };
}

function request(cookie?: string): NextRequest {
  return new NextRequest("http://localhost:3100/api/files/4/download", { headers: cookie ? { cookie } : {} });
}

let logs: string[] = [];
const originalError = console.error;
beforeEach(() => {
  logs = [];
  console.error = (...args: unknown[]) => {
    logs.push(args.map(String).join(" "));
  };
});
afterEach(() => {
  console.error = originalError;
});

describe("lib/auth/download-session.ts", () => {
  const user = (email_confirmed_at: string | null, email: string | null = "reader@example.invalid") =>
    async () => ({ data: { user: email === null ? { email_confirmed_at } : { email, email_confirmed_at } }, error: null });

  test("RDU5 no Supabase call without accounts or without a non-empty session cookie; a Payload staff cookie alone is anonymous", async () => {
    for (const [on, cookie, label] of [
      [false, "sb-abc-auth-token=x", "accounts off"],
      [true, undefined, "no cookie"],
      [true, "sb-abc-auth-token=", "empty session cookie"],
      [true, "payload-token=staff-jwt", "Payload staff cookie only (DEC-009)"],
      [true, "sb-abc-auth-token-code-verifier=x", "PKCE verifier only"],
    ] as const) {
      await withAccounts(on, async () => {
        const fake = fakeFactory(user("2026-11-20T00:00:00Z"));
        const session = await readDownloadPrincipal(request(cookie), fake.factory);
        assert.deepEqual(session, { principal: ANONYMOUS, cookies: [], headers: {} }, label);
        assert.equal(fake.calls.length, 0, `${label}: no Supabase client`);
      });
    }
  });

  test("RDU6 getUser decides: confirmed → verified; unconfirmed → not verified; error, no user, no email, throw → anonymous; Payload cookie never handed to Supabase; logs name the error only", async () => {
    await withAccounts(true, async () => {
      const both = "payload-token=staff-jwt; sb-abc-auth-token=x";
      const verified = fakeFactory(user("2026-11-20T00:00:00Z"));
      assert.deepEqual((await readDownloadPrincipal(request(both), verified.factory)).principal, { kind: "public_user", emailVerified: true });
      assert.deepEqual(verified.calls, [{ cookies: ["payload-token", "sb-abc-auth-token"] }], "the jar reads the request cookies");

      const unverified = fakeFactory(user(null));
      assert.deepEqual((await readDownloadPrincipal(request("sb-abc-auth-token=x"), unverified.factory)).principal, { kind: "public_user", emailVerified: false });

      const cases: [string, () => Promise<unknown>, string | null][] = [
        ["session missing", async () => ({ data: { user: null }, error: { name: "AuthSessionMissingError", message: "secret reader@example.invalid" } }), null],
        ["bad JWT", async () => ({ data: { user: null }, error: { name: "AuthApiError", code: "bad_jwt", status: 403, message: "secret" } }), "[auth] download: bad_jwt"],
        ["no user", async () => ({ data: { user: null }, error: null }), null],
        ["no email", user("2026-11-20T00:00:00Z", null), null],
        ["empty email", user("2026-11-20T00:00:00Z", ""), null],
        ["throws", async () => Promise.reject(Object.assign(new Error("secret reader@example.invalid"), { name: "AuthRetryableFetchError" })), "[auth] download: AuthRetryableFetchError"],
      ];
      for (const [label, reply, log] of cases) {
        logs = [];
        const fake = fakeFactory(reply);
        assert.deepEqual((await readDownloadPrincipal(request("sb-abc-auth-token=x"), fake.factory)).principal, ANONYMOUS, label);
        assert.deepEqual(logs, log ? [log] : [], `${label}: log`);
      }
      assert.equal(logs.join(" ").includes("secret"), false);
      assert.equal(logs.join(" ").includes("@"), false);

      const refreshed = fakeFactory(user("2026-11-20T00:00:00Z"), true);
      const session = await readDownloadPrincipal(request("sb-abc-auth-token=x"), refreshed.factory);
      assert.deepEqual(session.cookies.map(({ name, value }) => [name, value]), [["sb-abc-auth-token", "refreshed"]], "refreshed cookie collected");
      assert.equal(session.headers.Pragma, "no-cache", "Supabase cache headers collected");
      const removed = fakeFactory(async () => ({ data: { user: null }, error: { name: "AuthApiError", code: "refresh_token_not_found" } }), true);
      assert.equal((await readDownloadPrincipal(request("sb-abc-auth-token=x"), removed.factory)).cookies.length, 1, "cookies are kept on a failed read too");
    });
  });

  test("RDU7 withSessionWrites: status, Location and noindex kept; Supabase cookies and cache headers added; Cache-Control private, no-store", async () => {
    const session = {
      principal: ANONYMOUS,
      cookies: [{ name: "sb-abc-auth-token", value: "", options: { httpOnly: true, sameSite: "lax" as const, path: "/", maxAge: 0 } }],
      headers: { "Cache-Control": "private, no-cache, no-store, must-revalidate, max-age=0", Expires: "0", Pragma: "no-cache" },
    };
    for (const [outcome, status] of [
      [{ kind: "login", location: "/id/login?next=%2Fid%2Fpublications%2Fa" }, 303],
      [{ kind: "redirect", url: SIGNED }, 307],
      [{ kind: "not-found" }, 404],
      [{ kind: "unavailable" }, 503],
    ] as const) {
      const response = withSessionWrites(downloadResponse(outcome, "http://localhost:3100/api/files/4/download"), session);
      assert.equal(response.status, status);
      assert.equal(response.headers.get("cache-control"), "private, no-store", `${status}: never cached`);
      assert.equal(response.headers.get("x-robots-tag"), "noindex");
      assert.equal(response.headers.get("pragma"), "no-cache");
      const cookies = response.headers.getSetCookie();
      assert.equal(cookies.length, 1, `${status}: the removal is written`);
      const line = cookies[0] ?? "";
      assert.match(line, /^sb-abc-auth-token=;/);
      for (const attribute of [/; Path=\/(;|$)/, /; Max-Age=0(;|$)/, /; HttpOnly(;|$)/, /; SameSite=lax(;|$)/i]) assert.match(line, attribute);
    }
    const login = withSessionWrites(downloadResponse(LOGIN_ID as { kind: "login"; location: string }, "http://localhost:3100/api/files/4/download"), session);
    assert.equal(login.headers.get("location"), "http://localhost:3100/id/login?next=%2Fid%2Fpublications%2Flaporan", "absolute on the request origin");
    assert.equal(await login.text(), "");
  });
});
