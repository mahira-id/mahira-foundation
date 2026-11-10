/**
 * CMS environment, read as one set (M3-00, Owner 2026-11-10, Opsi A).
 *
 * - All variables in CMS_ENV_NAMES set: the CMS (Payload `/admin`, `/api/*`)
 *   is on.
 * - None set: the CMS is off. This is the Vercel Production build today.
 * - Only some set: readCmsEnv() throws, so build and start fail.
 * - VERCEL_ENV=production: the CMS is off, whatever is set. Turning it on in
 *   Production needs a reviewed PR (M4).
 *
 * Error messages name variables only; they never include a value.
 * This module imports nothing because proxy.ts imports it.
 */

export const CMS_ENV_NAMES = [
  "PAYLOAD_SECRET",
  "CMS_SUPABASE_DATABASE_URI",
  "APP_SUPABASE_URL",
  "APP_SUPABASE_S3_ACCESS_KEY_ID",
  "APP_SUPABASE_S3_SECRET_ACCESS_KEY",
] as const;

export type CmsEnv = Record<(typeof CMS_ENV_NAMES)[number], string>;

function isPresent(name: string): boolean {
  const value = process.env[name];
  return value !== undefined && value !== "";
}

function isVercelProduction(): boolean {
  return process.env.VERCEL_ENV === "production";
}

/**
 * Returns the CMS environment, or null when the CMS is off.
 * Throws when the set is incomplete.
 */
export function readCmsEnv(): CmsEnv | null {
  if (isVercelProduction()) return null;

  const missing = CMS_ENV_NAMES.filter((name) => !isPresent(name));
  if (missing.length === CMS_ENV_NAMES.length) return null;
  if (missing.length > 0) {
    throw new Error(
      `Incomplete CMS environment; missing: ${missing.join(", ")}. ` +
        `Set all of ${CMS_ENV_NAMES.join(", ")} or none.`,
    );
  }

  const env = {} as CmsEnv;
  for (const name of CMS_ENV_NAMES) {
    env[name] = process.env[name] as string;
  }
  return env;
}

/** True when the CMS is on. Never throws. */
export function isCmsEnabled(): boolean {
  return !isVercelProduction() && CMS_ENV_NAMES.every(isPresent);
}
