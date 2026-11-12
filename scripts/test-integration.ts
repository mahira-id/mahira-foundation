import { loadEnv } from "payload/node";

import { assertSafeTestTarget } from "../tests/helpers/target-guard";
import { NEXT_BIN, isPortOpen, runCommand, startNextServer, type ChildEnv } from "./lib/processes";

/**
 * DB integration tests against the shared `mahira-cms` (M3-10, Owner
 * 2026-11-11, P2 A): build with the full env, `next start` on TEST_PORT
 * (3100), the test files one at a time in a fixed order (one node:test
 * process each), stop the server. Exit 0 only when every file passed.
 *
 *   access        role access, closed anonymous REST, anonymous Local API, lifecycle
 *   guards        Translation Group delete, publishedAt refill, last-Admin guard
 *   locale        locale routes, <html lang>, 404/308, no public locale fallback
 *   race          DEC-004 shared fields under concurrent writers (rerun on every Payload upgrade)
 *   db-invariants users = 1 + Owner Admin, RLS, migrations ran, 0 fixtures left (always last)
 *
 * Usage: bun run test:integration [--skip-build] [--only access,guards,...]
 * Never run two at once: the files share one database and one port.
 */
const FILES = {
  access: "tests/integration/access.test.ts",
  guards: "tests/integration/guards.test.ts",
  locale: "tests/integration/locale.test.ts",
  race: "tests/integration/race.test.ts",
  "db-invariants": "tests/integration/db-invariants.test.ts",
} as const;
type Name = keyof typeof FILES;
const ORDER = Object.keys(FILES) as Name[];
const PORT = Number(process.env.TEST_PORT ?? "3100");

function parseArgs(argv: string[]): { skipBuild: boolean; names: Name[] } {
  const skipBuild = argv.includes("--skip-build");
  const index = argv.indexOf("--only");
  let names = ORDER;
  if (index !== -1) {
    const list = (argv[index + 1] ?? "").split(",").map((name) => name.trim()).filter(Boolean);
    if (list.length === 0) throw new Error(`--only needs a list of: ${ORDER.join(", ")}`);
    for (const name of list) {
      if (!(ORDER as string[]).includes(name)) throw new Error(`Unknown test file "${name}"; allowed: ${ORDER.join(", ")}`);
    }
    // Keep the documented order whatever the argument order is.
    names = ORDER.filter((name) => list.includes(name));
  }
  for (const arg of argv) {
    if (arg.startsWith("--") && arg !== "--skip-build" && arg !== "--only") throw new Error(`Unknown option ${arg}`);
  }
  return { skipBuild, names };
}

async function main(): Promise<number> {
  const { skipBuild, names } = parseArgs(process.argv.slice(2));
  const major = Number(process.version.slice(1).split(".")[0]);
  console.log(`[integration] node ${process.version}; files: ${names.join(", ")}; build: ${skipBuild ? "skipped" : "yes"}; port ${PORT}`);
  if (major !== 26) throw new Error(`Node ${process.version}: the integration tests run on Node 26.x only (DEC-018).`);

  loadEnv();
  assertSafeTestTarget();
  if (Number.isNaN(PORT)) throw new Error("TEST_PORT is not a number.");
  if (await isPortOpen(PORT)) throw new Error(`Port ${PORT} is already in use; stop that server first.`);

  const env: ChildEnv = { ...process.env };
  if (!skipBuild) {
    console.log("[integration] next build (full CMS env)");
    const build = await runCommand(process.execPath, [NEXT_BIN, "build"], { env });
    console.log(`[integration] build exit=${build.code}`);
    if (build.code !== 0) return 1;
  }

  const server = await startNextServer({ env, port: PORT, label: "integration" });
  const results: Array<[Name, number]> = [];
  try {
    console.log(`[integration] server started on ${PORT} (log: ${server.logFile})`);
    // One `node --test` process per file: node:test sorts the files of one
    // invocation by name, and db-invariants must run last. Every file runs,
    // even after a failure, so db-invariants always checks the final state.
    for (const name of names) {
      console.log(`\n[integration] ${name}: ${FILES[name]}`);
      const result = await runCommand(
        process.execPath,
        ["--import", "tsx", "--test", "--test-concurrency=1", "--test-timeout=300000", "--test-reporter=spec", FILES[name]],
        { env: { ...env, TEST_BASE_URL: `http://localhost:${PORT}` } },
      );
      results.push([name, result.code]);
      console.log(`[integration] ${name} exit=${result.code}`);
    }
  } finally {
    const keepLog = results.length < names.length || results.some(([, code]) => code !== 0);
    await server.stop({ keepLog });
    console.log(
      `[integration] server stopped; log ${keepLog ? `kept for debugging: ${server.logFile} (delete it after reading)` : "deleted"}`,
    );
  }
  const failed = results.filter(([, code]) => code !== 0);
  console.log(`[integration] summary: ${results.map(([name, code]) => `${name}=${code}`).join(" ")}`);
  console.log(`[integration] ${failed.length === 0 ? "PASS" : `FAIL (${failed.map(([name]) => name).join(", ")})`}`);
  return failed.length === 0 ? 0 : 1;
}

main().then(
  (code) => {
    process.exitCode = code;
  },
  (error: unknown) => {
    console.error(`[integration] error: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  },
);
