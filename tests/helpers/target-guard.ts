import { CMS_ENV_NAMES, readCmsEnv } from "../../payload/env";

/**
 * Target guard of the DB integration tests (M3-10, Owner 2026-11-11, P2 A).
 *
 * Only one CMS database exists, `mahira-cms`, shared with Vercel Preview and
 * holding the Owner's Admin account. The tests write fixtures, so they refuse
 * to run anywhere else:
 *   - `VERCEL_ENV` set (any value): a Vercel build or runtime, never a test host;
 *   - the CMS env set incomplete or absent;
 *   - `CMS_SUPABASE_DATABASE_URI` not pointing at the `mahira-cms` project.
 * Messages name variables only, never a value.
 */
export const MAHIRA_CMS_REF = "qnfzzymrceoubowfknvl";

const PREFIX = "Integration tests refused:";

/**
 * True when the URI belongs to the mahira-cms project: the Supabase pooler
 * user is `postgres.<ref>`, a direct connection uses host `db.<ref>.supabase.co`.
 */
function pointsAtMahiraCms(uri: string): boolean {
  let url: URL;
  try {
    url = new URL(uri);
  } catch {
    return false;
  }
  if (url.protocol !== "postgresql:" && url.protocol !== "postgres:") return false;
  let user = url.username;
  try {
    user = decodeURIComponent(url.username);
  } catch {
    // keep the raw user name
  }
  return user.split(".").includes(MAHIRA_CMS_REF) || url.hostname.split(".").includes(MAHIRA_CMS_REF);
}

export function assertSafeTestTarget(): void {
  if ((process.env.VERCEL_ENV ?? "") !== "") {
    throw new Error(`${PREFIX} VERCEL_ENV is set. Run them locally only, with VERCEL_ENV unset.`);
  }
  const missing = CMS_ENV_NAMES.filter((name) => (process.env[name] ?? "") === "");
  if (missing.length > 0) {
    throw new Error(
      `${PREFIX} CMS environment incomplete; missing: ${missing.join(", ")}. ` +
        `Set all of ${CMS_ENV_NAMES.join(", ")} (.env.local).`,
    );
  }
  let cms: ReturnType<typeof readCmsEnv>;
  try {
    cms = readCmsEnv();
  } catch {
    // readCmsEnv names variables only, but this guard does not rely on it.
    throw new Error(`${PREFIX} the CMS environment is rejected by payload/env.ts.`);
  }
  if (cms === null) {
    throw new Error(`${PREFIX} the CMS is off (payload/env.ts readCmsEnv returned null).`);
  }
  if (!pointsAtMahiraCms(cms.CMS_SUPABASE_DATABASE_URI)) {
    throw new Error(
      `${PREFIX} CMS_SUPABASE_DATABASE_URI does not point at the mahira-cms project (ref ${MAHIRA_CMS_REF}).`,
    );
  }
}
