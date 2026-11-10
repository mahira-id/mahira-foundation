import { requireEnv } from "../env";

export type DatabaseUriKind =
  | "direct"
  | "session-pooler"
  | "transaction-pooler"
  | "other";

export type DatabaseUriDescription = {
  kind: DatabaseUriKind;
  hostSuffix: string;
  port: string;
  hasSslmode: boolean;
};

/**
 * Returns the CMS Postgres connection string (server-only).
 *
 * SPIKE_DB_PORT is a spike-only knob (M2-01): when set, the port of the
 * configured URI is replaced so the same Supabase pooler host can be tested in
 * session (5432) and transaction (6543) mode without a second secret.
 * It is not part of the target configuration.
 */
export function resolveDatabaseUri(): string {
  const uri = requireEnv("CMS_SUPABASE_DATABASE_URI");
  const portOverride = process.env.SPIKE_DB_PORT;
  if (!portOverride) {
    return uri;
  }
  const url = new URL(uri);
  url.port = portOverride;
  return url.toString();
}

/**
 * Describes a connection string without exposing credentials, the project
 * reference, or the full host. Safe to print in spike evidence.
 */
export function describeDatabaseUri(uri: string): DatabaseUriDescription {
  const url = new URL(uri);
  const host = url.hostname;
  const port = url.port || "5432";

  let kind: DatabaseUriKind = "other";
  if (host.startsWith("db.") && host.endsWith(".supabase.co")) {
    kind = "direct";
  } else if (host.includes("pooler.supabase.com")) {
    if (port === "6543") {
      kind = "transaction-pooler";
    } else if (port === "5432") {
      kind = "session-pooler";
    }
  }

  const hostSuffix = host.split(".").slice(-2).join(".");

  return {
    kind,
    hostSuffix,
    port,
    hasSslmode: url.searchParams.has("sslmode"),
  };
}
