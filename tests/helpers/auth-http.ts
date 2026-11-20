import { BASE_URL, getPage, postForm, type PageResult } from "./http";

/**
 * HTTP helpers of the account integration tests (M5-02). Session cookies
 * and tokens are bearer credentials: they are passed on as Cookie or
 * Authorization headers and read for their shape (names, attributes, JWT
 * header), never printed or put into an assertion message.
 */
export const SAME_ORIGIN = { Origin: BASE_URL } as const;

/** `sb-<ref>-auth-token` and its chunks (lib/auth/supabase.ts AUTH_COOKIE_PATTERN). */
export const SESSION_COOKIE = /^sb-[a-z0-9]+-auth-token(?:\.\d+)?$/;

type SetCookie = { name: string; value: string; attributes: string[] };

export function parseSetCookie(line: string): SetCookie {
  const [pair = "", ...attributes] = line.split(";").map((part) => part.trim());
  const eq = pair.indexOf("=");
  return { name: pair.slice(0, eq), value: pair.slice(eq + 1), attributes };
}

/** True when the Set-Cookie line deletes its cookie (empty value, Max-Age=0 or an Expires in the past). */
export function isRemoval(line: string): boolean {
  const { value, attributes } = parseSetCookie(line);
  if (value === "") return true;
  return attributes.some((attribute) => {
    const [key = "", raw = ""] = attribute.split("=");
    if (key.toLowerCase() === "max-age") return Number(raw) <= 0;
    if (key.toLowerCase() === "expires") return Date.parse(raw) <= Date.now();
    return false;
  });
}

/** Applies Set-Cookie lines to a Cookie header, as a browser would (path and domain ignored: everything is `/`, host-only). */
export function applySetCookies(cookie: string, setCookies: string[]): string {
  const jar = new Map<string, string>();
  for (const part of cookie.split(";").map((item) => item.trim()).filter(Boolean)) {
    const eq = part.indexOf("=");
    jar.set(part.slice(0, eq), part.slice(eq + 1));
  }
  for (const line of setCookies) {
    const { name, value } = parseSetCookie(line);
    if (isRemoval(line)) jar.delete(name);
    else jar.set(name, value);
  }
  return [...jar].map(([name, value]) => `${name}=${value}`).join("; ");
}

export function sessionCookieLines(page: PageResult): string[] {
  return page.setCookies.filter((line) => SESSION_COOKIE.test(parseSetCookie(line).name));
}

/** Pathname + search of a Location, relative to BASE_URL. */
export function target(location: string): string {
  if (!location) return "";
  const url = new URL(location, BASE_URL);
  return `${url.pathname}${url.search}`;
}

/** POST of an account form with the same-origin Origin header (and a Cookie when given). */
export function postAccountForm(path: string, fields: Record<string, string>, cookie = ""): Promise<PageResult> {
  return postForm(path, fields, cookie ? { ...SAME_ORIGIN, Cookie: cookie } : { ...SAME_ORIGIN });
}

export type Session = { page: PageResult; cookie: string };

/** Logs in through `POST /{locale}/auth/login`; `cookie` holds the session cookies it set ("" when none). */
export async function loginSession(email: string, password: string, locale: "id" | "en" = "id"): Promise<Session> {
  const page = await postAccountForm(`/${locale}/auth/login`, { email, password });
  return { page, cookie: applySetCookies("", sessionCookieLines(page)) };
}

/**
 * RSC request (`RSC: 1`), as the client router sends it. Next 16 answers an
 * RSC request whose `_rsc` does not match with a 307 to the same path with
 * the right `_rsc`; that one redirect is followed (tests/integration/admin.test.ts).
 */
export async function getRsc(path: string, headers: Record<string, string> = {}): Promise<PageResult> {
  const rscHeaders = { ...headers, RSC: "1" };
  const first = await getPage(path, rscHeaders);
  if (first.status !== 307 || !first.location) return first;
  const next = new URL(first.location, BASE_URL);
  if (next.pathname !== new URL(path, BASE_URL).pathname || !next.searchParams.has("_rsc")) return first;
  return getPage(`${next.pathname}${next.search}`, rscHeaders);
}

type StoredSession = { access_token: string; refresh_token: string; expires_at: number } & Record<string, unknown>;

const BASE64_PREFIX = "base64-";

function cookieMap(cookie: string): Map<string, string> {
  const map = new Map<string, string>();
  for (const part of cookie.split(";").map((item) => item.trim()).filter(Boolean)) {
    const eq = part.indexOf("=");
    map.set(part.slice(0, eq), part.slice(eq + 1));
  }
  return map;
}

/** The session cookie's base name and its stored session (chunks joined in order). */
function readSession(cookie: string): { name: string; session: StoredSession; others: Map<string, string> } {
  const map = cookieMap(cookie);
  const names = [...map.keys()].filter((name) => SESSION_COOKIE.test(name));
  const base = names.map((name) => name.replace(/\.\d+$/, ""))[0];
  if (!base) throw new Error("no session cookie");
  const raw = map.has(base)
    ? (map.get(base) as string)
    : names
        .filter((name) => name.startsWith(`${base}.`))
        .sort((a, b) => Number(a.slice(base.length + 1)) - Number(b.slice(base.length + 1)))
        .map((name) => map.get(name) as string)
        .join("");
  const decoded = raw.startsWith(BASE64_PREFIX) ? Buffer.from(raw.slice(BASE64_PREFIX.length), "base64url").toString("utf8") : raw;
  for (const name of names) map.delete(name);
  return { name: base, session: JSON.parse(decoded) as StoredSession, others: map };
}

/** The session's tokens (for Authorization headers and JWT header reads; never print them). */
export function sessionTokens(cookie: string): { accessToken: string; refreshToken: string } {
  const { session } = readSession(cookie);
  return { accessToken: session.access_token, refreshToken: session.refresh_token };
}

/** `alg` and the `role`/`session_id` presence of the access token, read without verification. */
export function accessTokenFacts(cookie: string): { alg: string; role: unknown; userMetadata: unknown } {
  const [header = "", payload = ""] = sessionTokens(cookie).accessToken.split(".");
  const json = (part: string) => JSON.parse(Buffer.from(part, "base64url").toString("utf8")) as Record<string, unknown>;
  const claims = json(payload);
  return { alg: String(json(header).alg ?? ""), role: claims.role, userMetadata: claims.user_metadata };
}

/**
 * A copy of the session cookie with tokens or the expiry replaced, in one
 * unchunked cookie (`@supabase/ssr` reads the base name first). Other
 * cookies of the header are kept.
 */
export function tamperSession(cookie: string, change: { accessToken?: string; refreshToken?: string; expiresAt?: number }): string {
  const { name, session, others } = readSession(cookie);
  const next: StoredSession = {
    ...session,
    access_token: change.accessToken ?? session.access_token,
    refresh_token: change.refreshToken ?? session.refresh_token,
    expires_at: change.expiresAt ?? session.expires_at,
  };
  const value = `${BASE64_PREFIX}${Buffer.from(JSON.stringify(next), "utf8").toString("base64url")}`;
  return [...[...others].map(([key, item]) => `${key}=${item}`), `${name}=${value}`].join("; ");
}
