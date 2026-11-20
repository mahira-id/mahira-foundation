/**
 * Public-account (Supabase Auth) environment gate (M5-01/M5-02, DECISIONS
 * §2.18 decisions 4 and 5), modelled on payload/env.ts.
 *
 * - APP_SUPABASE_PUBLISHABLE_KEY decides. Without it the account routes
 *   are off and proxy.ts answers 404. APP_SUPABASE_URL alone does not turn
 *   accounts on: it also belongs to the CMS set (storage), so a Preview with
 *   only the CMS variables keeps building with accounts off.
 * - Key set, URL missing: readAuthEnv() throws, so build and start fail.
 * - VERCEL_ENV=production: off, whatever is set (accounts open in M4).
 *
 * Both values are server-only: no NEXT_PUBLIC_ name, never sent to the
 * browser. Error messages name variables only, never a value.
 * This module imports nothing because proxy.ts imports it.
 */

export const AUTH_URL_NAME = "APP_SUPABASE_URL";
export const AUTH_KEY_NAME = "APP_SUPABASE_PUBLISHABLE_KEY";
export const AUTH_ENV_NAMES = [AUTH_URL_NAME, AUTH_KEY_NAME] as const;

export type AuthEnv = { url: string; publishableKey: string };

function value(name: string): string {
  return process.env[name] ?? "";
}

function isVercelProduction(): boolean {
  return process.env.VERCEL_ENV === "production";
}

/**
 * The account environment, or null when accounts are off.
 * Throws when the key is set without the URL.
 */
export function readAuthEnv(): AuthEnv | null {
  if (isVercelProduction()) return null;
  const publishableKey = value(AUTH_KEY_NAME);
  if (publishableKey === "") return null;
  const url = value(AUTH_URL_NAME);
  if (url === "") {
    throw new Error(`Incomplete auth environment; missing: ${AUTH_URL_NAME}. Set it, or unset the publishable key.`);
  }
  return { url: url.replace(/\/+$/, ""), publishableKey };
}

/** True when the account routes are on. Never throws. */
export function isAuthEnabled(): boolean {
  return !isVercelProduction() && value(AUTH_KEY_NAME) !== "" && value(AUTH_URL_NAME) !== "";
}
