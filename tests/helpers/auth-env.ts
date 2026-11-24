import { AUTH_ENV_NAMES, AUTH_KEY_NAME, AUTH_URL_NAME } from "../../lib/auth/env";

/**
 * Runs `run` with public accounts on or off (lib/auth/env.ts), with dummy
 * values, and restores the variables afterwards (M5-03 unit tests: the
 * public read filters and the evaluator depend on the account gate). No
 * request goes anywhere: nothing here creates a Supabase client.
 */
const NAMES = [...AUTH_ENV_NAMES, "VERCEL_ENV"] as const;
const DUMMY_URL = "https://unit-test-dummy.supabase.co";
const DUMMY_KEY = "unit-test-dummy-publishable-key";

export async function withAccounts<T>(on: boolean, run: () => T | Promise<T>): Promise<T> {
  const saved: Record<string, string | undefined> = {};
  for (const name of NAMES) {
    saved[name] = process.env[name];
    delete process.env[name];
  }
  if (on) {
    process.env[AUTH_URL_NAME] = DUMMY_URL;
    process.env[AUTH_KEY_NAME] = DUMMY_KEY;
  }
  try {
    return await run();
  } finally {
    for (const name of NAMES) {
      if (saved[name] === undefined) delete process.env[name];
      else process.env[name] = saved[name];
    }
  }
}
