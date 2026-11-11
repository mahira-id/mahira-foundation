import { tmpdir } from "node:os";
import path from "node:path";
import type { PostgresAdapter } from "@payloadcms/db-postgres";
import { getPayload, type Payload } from "payload";
import { loadEnv } from "payload/node";

import { assertSafeTestTarget } from "./target-guard";

type Pool = PostgresAdapter["pool"];
type PoolClient = { release?: (destroy?: boolean) => void };
type PoolInternals = { _clients?: PoolClient[]; _idle?: Array<{ client: PoolClient }> };

const POOL_END_TIMEOUT_MS = 15_000;

/**
 * Payload Local API instance for the DB integration tests (M3-10).
 *
 * Order matters: `.env.local` is loaded (an existing variable is never
 * overridden), the target guard runs, and only then is the config imported.
 * The config reads the CMS env at import time and the first query connects,
 * so a refused target never reaches the database.
 */
export async function getTestPayload(): Promise<Payload> {
  loadEnv();
  assertSafeTestTarget();
  // Outside production getPayload starts `payload generate:types`, which
  // rewrites payload/payload-types.ts whenever the bytes differ (a Windows
  // checkout with CRLF always differs). The tests write the generated types
  // to the temp folder instead, so a test run never touches a tracked file.
  process.env.PAYLOAD_TS_OUTPUT_PATH ??= path.join(tmpdir(), "mahira-m3-10-payload-types.ts");
  // getPayload also opens a WebSocket to the Next dev HMR server
  // (localhost:3000) outside production; a running `next dev` would keep the
  // test process alive. The tests never use HMR.
  process.env.DISABLE_PAYLOAD_HMR ??= "true";
  const { default: config } = await import("@payload-config");
  const payload = await getPayload({ config });
  await limitIdleTransactions((payload.db as unknown as PostgresAdapter).pool);
  return payload;
}

/**
 * Bounds how long a test transaction can stay open on the server after its
 * client connection is gone. Seen on mahira-cms (2026-11-11): the Supabase
 * session pooler dropped a test connection mid-transaction ("Connection
 * terminated unexpectedly") and the server kept that transaction "idle in
 * transaction" for about 15 minutes, holding row locks that blocked the next
 * writes and the fixture cleanup. Startup `options` do not pass through the
 * pooler, so every new pool client runs a session-level SET first: pg-pool
 * awaits `options.onConnect` before handing a new client out (pg-pool 3.14.0,
 * read per new client). Only this test process's connections are affected;
 * payload.config.ts is unchanged. Intended idle time inside a test
 * transaction is a few seconds (race R1).
 */
const IDLE_IN_TRANSACTION_TIMEOUT = "60s";

type QueryClient = { query: (text: string) => Promise<unknown> };

async function limitIdleTransactions(pool: Pool | undefined): Promise<void> {
  if (!pool) return;
  const statement = `SET idle_in_transaction_session_timeout = '${IDLE_IN_TRANSACTION_TIMEOUT}'`;
  const options = (pool as unknown as { options: { onConnect?: (client: QueryClient) => Promise<void> } }).options;
  options.onConnect = async (client) => {
    await client.query(statement);
  };
  // Clients opened during Payload init are older than the hook: check out
  // the idle ones together, set the value on each, hand them back.
  const idle = await Promise.all(Array.from({ length: pool.idleCount }, () => pool.connect()));
  try {
    for (const client of idle) await client.query(statement);
  } finally {
    for (const client of idle) client.release();
  }
}

/**
 * Ends the database pool so the test process can exit on its own.
 *
 * Payload 3.93.0 (`@payloadcms/db-postgres` connect()) checks out one pool
 * client at connect and never releases it, and `payload.destroy()` does not
 * end the pool, so that socket would keep the process alive. pg-pool keeps
 * clients in `_clients` and idle ones in `_idle` (pg-pool 3.14.0); a
 * checked-out client is destroyed through its own `release(true)`.
 */
async function endPool(pool: Pool): Promise<void> {
  const internals = pool as unknown as PoolInternals;
  const idle = new Set((internals._idle ?? []).map((item) => item.client));
  const ended = pool.end();
  for (const client of [...(internals._clients ?? [])]) {
    if (!idle.has(client) && typeof client.release === "function") client.release(true);
  }
  let timer: NodeJS.Timeout | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(
      () => reject(new Error(`database pool did not close within ${POOL_END_TIMEOUT_MS} ms (pg-pool internals changed?)`)),
      POOL_END_TIMEOUT_MS,
    );
  });
  try {
    await Promise.race([ended, timeout]);
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Closes Payload and its database pool. The short wait avoids a libuv exit
 * assertion on Windows seen with Node 26.4.0 (SPIKE-001 §8). No forced exit:
 * the process ends when nothing is left, including Payload's
 * `generate:types` child.
 */
export async function closeTestPayload(payload: Payload | undefined): Promise<void> {
  if (payload) {
    const pool = (payload.db as unknown as PostgresAdapter).pool as Pool | undefined;
    await payload.destroy();
    if (pool) await endPool(pool);
  }
  await new Promise((resolve) => setTimeout(resolve, 250));
}
