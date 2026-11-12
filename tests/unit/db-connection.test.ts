import assert from "node:assert/strict";
import { createServer, type AddressInfo, type Server } from "node:net";
import { after, before, describe, test } from "node:test";

import type { PostgresAdapter } from "@payloadcms/db-postgres";
import type { Payload, SanitizedConfig } from "payload";

/**
 * Database pool limits and init failure in payload/payload.config.ts (item 1b,
 * Owner 2026-11-12, DECISIONS §2.9). No database: the CMS env is fake and the
 * DB URI points at a local TCP server that closes every connection, so every
 * Payload connect fails.
 *
 * NODE_ENV=production keeps getPayload from starting `payload generate:types`
 * (rewrites payload/payload-types.ts) and the dev HMR WebSocket. node:test
 * runs each file in its own process, so these env changes stay in this file.
 */
const FAKE_CMS_ENV = {
  PAYLOAD_SECRET: "unit-test-dummy-secret-1234",
  APP_SUPABASE_URL: "https://example.invalid",
  APP_SUPABASE_S3_ACCESS_KEY_ID: "unit-test-dummy",
  APP_SUPABASE_S3_SECRET_ACCESS_KEY: "unit-test-dummy",
};

let server: Server;
let connections = 0;
let config: SanitizedConfig;
let getPayload: (options: { config: SanitizedConfig }) => Promise<Payload>;

before(async () => {
  server = createServer((socket) => {
    connections += 1;
    socket.destroy();
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address() as AddressInfo;

  delete process.env.VERCEL_ENV;
  Object.assign(process.env, FAKE_CMS_ENV, {
    CMS_SUPABASE_DATABASE_URI: `postgresql://unit:unit@127.0.0.1:${port}/postgres`,
    NODE_ENV: "production",
    DISABLE_PAYLOAD_HMR: "true",
  });
  // The config reads the CMS env at import time.
  ({ getPayload } = await import("payload"));
  config = await (await import("@payload-config")).default;
});

after(async () => {
  await new Promise<void>((resolve) => server.close(() => resolve()));
});

describe("payload.config.ts — database pool and init failure (item 1b)", () => {
  test("DB1 pool per process: max 5 clients, idle 5 s, wait for a client at most 10 s", () => {
    const adapter = config.db.init({ payload: {} as Payload }) as unknown as PostgresAdapter;
    assert.equal(adapter.poolOptions.max, 5);
    assert.equal(adapter.poolOptions.idleTimeoutMillis, 5_000);
    assert.equal(adapter.poolOptions.connectionTimeoutMillis, 10_000);
  });

  test("DB2 connect fails: getPayload throws a catchable init error, no unhandled rejection, next call retries", async () => {
    const unhandled: unknown[] = [];
    const onUnhandled = (reason: unknown) => {
      unhandled.push(reason);
    };
    process.on("unhandledRejection", onUnhandled);
    try {
      for (const attempt of [1, 2]) {
        const seen = connections;
        await assert.rejects(getPayload({ config }), (error: Error & { payloadInitError?: boolean }) => {
          assert.match(error.message, /cannot connect to Postgres/, `attempt ${attempt}`);
          assert.equal(error.payloadInitError, true, `attempt ${attempt}`);
          return true;
        });
        assert.ok(connections > seen, `attempt ${attempt} must reach the database server (init is retried)`);
      }
      // Node reports an unhandled rejection after the microtask queue drains.
      await new Promise((resolve) => setTimeout(resolve, 200));
      assert.equal(unhandled.length, 0, "a failed connect must not leave an unhandled rejection (Vercel exits the instance)");
    } finally {
      process.off("unhandledRejection", onUnhandled);
    }
  });
});
