import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { loadEnv } from "payload/node";

import { EMAIL_DOMAIN, randomPassword } from "./fixtures";

/**
 * Supabase Auth Admin API for the account integration tests (M5-02,
 * DECISIONS §2.18 decision 15a). The only user of the APP project's secret
 * key, read from `.env.local` on a local machine; never on Vercel, in CI or
 * in app code (tests/unit/auth-static.test.ts). Test users are created
 * already confirmed (`email_confirm: true`), and the email links come from
 * generateLink, so no test makes Supabase send an email.
 *
 * Target guard: VERCEL_ENV unset, APP_SUPABASE_URL on the APP project
 * `mahira.id` (ref below), the secret and publishable keys present.
 * Messages name variables only, never a value.
 *
 * Fixture users: `fixture-test-auth-<area>-<name>@example.invalid`;
 * sweepAuthUsers deletes only the users of one area.
 */
export const APP_AUTH_REF = "dmtbieetvgkvncadbkmd";
const SECRET_NAME = "APP_SUPABASE_SECRET_KEY";
const PREFIX = "Auth integration tests refused:";

export type AuthArea = "core" | "boundary" | "pages" | "files";

export function assertSafeAuthTarget(): { url: string; secret: string } {
  loadEnv();
  if ((process.env.VERCEL_ENV ?? "") !== "") throw new Error(`${PREFIX} VERCEL_ENV is set. Run them locally only.`);
  const url = process.env.APP_SUPABASE_URL ?? "";
  let host = "";
  try {
    host = new URL(url).hostname;
  } catch {
    // reported below
  }
  if (host !== `${APP_AUTH_REF}.supabase.co`) {
    throw new Error(`${PREFIX} APP_SUPABASE_URL does not point at the APP project (ref ${APP_AUTH_REF}).`);
  }
  const secret = process.env[SECRET_NAME] ?? "";
  const publishable = process.env.APP_SUPABASE_PUBLISHABLE_KEY ?? "";
  if (secret === "") throw new Error(`${PREFIX} ${SECRET_NAME} is not set (.env.local).`);
  if (publishable === "") throw new Error(`${PREFIX} APP_SUPABASE_PUBLISHABLE_KEY is not set, so the server runs with accounts off.`);
  if (secret === publishable || secret.startsWith("sb_publishable_")) {
    throw new Error(`${PREFIX} ${SECRET_NAME} holds a publishable key; the Admin API needs the project's secret key (sb_secret_...).`);
  }
  return { url, secret };
}

let client: SupabaseClient | undefined;

function admin(): SupabaseClient["auth"]["admin"] {
  if (!client) {
    const { url, secret } = assertSafeAuthTarget();
    client = createClient(url, secret, { auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false } });
  }
  return client.auth.admin;
}

export function authAreaPrefix(area: AuthArea): string {
  return `fixture-test-auth-${area}-`;
}

export function authEmail(area: AuthArea, name: string): string {
  return `${authAreaPrefix(area)}${name}${EMAIL_DOMAIN}`;
}

export type TestUser = { id: string; email: string; password: string };

/** A user with a random password (never printed); confirmed unless `confirmed: false`. */
export async function createAuthUser(
  area: AuthArea,
  name: string,
  options: { confirmed?: boolean; userMetadata?: Record<string, unknown> } = {},
): Promise<TestUser> {
  const email = authEmail(area, name);
  const password = randomPassword();
  const { data, error } = await admin().createUser({
    email,
    password,
    email_confirm: options.confirmed ?? true,
    user_metadata: options.userMetadata,
  });
  if (error || !data.user) throw new Error(`createUser ${name} failed: ${error?.code ?? error?.name ?? "no user"}`);
  return { id: data.user.id, email, password };
}

/**
 * Token hash of an email link, as the email templates put it into the
 * `/{locale}/auth/confirm` URL. `signup` creates the user (unconfirmed);
 * `recovery` needs an existing one. No email is sent.
 */
export async function emailLinkHash(type: "signup" | "recovery", email: string, password?: string): Promise<{ hash: string; userId: string }> {
  const result =
    type === "signup"
      ? await admin().generateLink({ type: "signup", email, password: password ?? randomPassword() })
      : await admin().generateLink({ type: "recovery", email });
  const hash = result.data?.properties?.hashed_token;
  const userId = result.data?.user?.id;
  if (result.error || !hash || !userId) throw new Error(`generateLink ${type} failed: ${result.error?.code ?? result.error?.name ?? "no hash"}`);
  return { hash, userId };
}

export async function getAuthUser(id: string): Promise<{ emailConfirmed: boolean; userMetadata: Record<string, unknown> } | null> {
  const { data, error } = await admin().getUserById(id);
  if (error || !data.user) return null;
  return { emailConfirmed: Boolean(data.user.email_confirmed_at), userMetadata: data.user.user_metadata ?? {} };
}

async function areaUsers(area: AuthArea): Promise<string[]> {
  const prefix = authAreaPrefix(area);
  const ids: string[] = [];
  const perPage = 1000;
  for (let page = 1; ; page++) {
    const { data, error } = await admin().listUsers({ page, perPage });
    if (error) throw new Error(`listUsers failed: ${error.code ?? error.name}`);
    for (const user of data.users) {
      if (user.email?.startsWith(prefix) && user.email.endsWith(EMAIL_DOMAIN)) ids.push(user.id);
    }
    if (data.users.length < perPage) break;
  }
  return ids;
}

/** Deletes this area's fixture users; returns how many. */
export async function sweepAuthUsers(area: AuthArea): Promise<number> {
  const ids = await areaUsers(area);
  for (const id of ids) {
    const { error } = await admin().deleteUser(id);
    if (error) throw new Error(`deleteUser failed: ${error.code ?? error.name}`);
  }
  return ids.length;
}

export async function countAuthUsers(area: AuthArea): Promise<number> {
  return (await areaUsers(area)).length;
}
