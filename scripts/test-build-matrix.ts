import { createHash } from "node:crypto";
import { existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { CMS_ENV_NAMES } from "../payload/env";
import { NEXT_BIN, REPO_ROOT, runCommand, startNextServer, type ChildEnv } from "./lib/processes";

/**
 * Build matrix of the CMS env gate (M3-00, ENVIRONMENTS §3.1; M3-10).
 *
 *   absent   five CMS variables "" in the child env  -> build 0, gate off
 *   prodsim  VERCEL_ENV=production                   -> build 0, gate prod
 *   partial  only PAYLOAD_SECRET (dummy) set          -> build fails, names only
 *   full     .env.local as is                         -> build 0, gate on
 *
 * `.env.local` is never renamed or written: `@next/env` does not apply a key
 * that is already in the environment, even as "", so empty values in the
 * child env switch the CMS off for that child only. Defaults: all four modes
 * when `.env.local` exists (full last, so `.next` ends as a full build),
 * otherwise the first three (CI). `--modes a,b` picks modes.
 *
 * Usage: bun run test:build-matrix [--modes absent,prodsim,partial,full]
 * Prints names and exit codes only, never a value.
 */
const MODES = ["absent", "prodsim", "partial", "full"] as const;
type Mode = (typeof MODES)[number];
const GATE: Record<Exclude<Mode, "partial">, "off" | "prod" | "on"> = { absent: "off", prodsim: "prod", full: "on" };
const PARTIAL_DUMMY = "m3-10-partial-dummy-value";
const PORT = Number(process.env.TEST_PORT ?? "3100");
const ENV_FILE = path.join(REPO_ROOT, ".env.local");
const SECRET_SCAN = path.join(REPO_ROOT, "scripts", "secret-scan.mjs");

function parseModes(argv: string[]): Mode[] {
  const hasEnvFile = existsSync(ENV_FILE);
  const index = argv.indexOf("--modes");
  if (index === -1) return hasEnvFile ? [...MODES] : ["absent", "prodsim", "partial"];
  const list = (argv[index + 1] ?? "").split(",").map((mode) => mode.trim()).filter(Boolean);
  if (list.length === 0) throw new Error(`--modes needs a list of: ${MODES.join(", ")}`);
  for (const mode of list) {
    if (!(MODES as readonly string[]).includes(mode)) throw new Error(`Unknown mode "${mode}"; allowed: ${MODES.join(", ")}`);
  }
  if (list.includes("full") && !hasEnvFile) throw new Error("Mode full needs .env.local in the repository root.");
  // Keep the documented order whatever the argument order is.
  return MODES.filter((mode) => list.includes(mode));
}

function childEnv(mode: Mode): ChildEnv {
  const env: ChildEnv = { ...process.env };
  delete env.VERCEL_ENV;
  if (mode === "absent") {
    for (const name of CMS_ENV_NAMES) env[name] = "";
  } else if (mode === "prodsim") {
    env.VERCEL_ENV = "production";
  } else if (mode === "partial") {
    for (const name of CMS_ENV_NAMES) env[name] = "";
    env.PAYLOAD_SECRET = PARTIAL_DUMMY;
  }
  return env;
}

function envFileHash(): string | null {
  return existsSync(ENV_FILE) ? createHash("sha256").update(readFileSync(ENV_FILE)).digest("hex") : null;
}

async function secretScan(paths: string[]): Promise<boolean> {
  const result = await runCommand(process.execPath, [SECRET_SCAN, ...paths]);
  return result.code === 0;
}

function routeLines(output: string): string[] {
  return output
    .split(/\r?\n/)
    .filter((line) => /^(Route \(app\)|[┌├└]|ƒ Proxy)/.test(line))
    .map((line) => `  ${line}`);
}

async function runMode(mode: Mode, scan: boolean): Promise<string> {
  const env = childEnv(mode);
  console.log(`\n## mode=${mode}: next build`);
  const build = await runCommand(process.execPath, [NEXT_BIN, "build"], { env, echo: false });
  const logFile = path.join(tmpdir(), `mahira-m3-10-build-${mode}-${Date.now()}.log`);
  writeFileSync(logFile, build.output);
  console.log(`build[${mode}] exit=${build.code} (log: ${logFile})`);
  const problems: string[] = [];

  if (mode === "partial") {
    const errorLine = build.output.split(/\r?\n/).find((line) => line.includes("Incomplete CMS environment; missing:"));
    if (errorLine) console.log(`  ${errorLine.trim()}`);
    if (build.code === 0) problems.push("partial build must fail");
    if (!errorLine) problems.push("missing 'Incomplete CMS environment; missing:'");
    for (const name of CMS_ENV_NAMES.filter((candidate) => candidate !== "PAYLOAD_SECRET")) {
      if (!errorLine?.includes(name)) problems.push(`error does not name ${name}`);
    }
    if (build.output.includes(PARTIAL_DUMMY)) problems.push("build output contains the dummy value");
    if (scan && !(await secretScan([logFile]))) problems.push("secret-scan of the build log found a value");
    rmSync(logFile, { force: true });
    return summarize(mode, `build=${build.code} (expected non-zero, names only)`, problems);
  }

  for (const line of routeLines(build.output)) console.log(line);
  if (build.code !== 0) {
    problems.push("build must succeed");
    return summarize(mode, `build=${build.code} (expected 0)`, problems);
  }
  if (scan) {
    if (!(await secretScan([logFile, ".next/static", ".next/server"]))) problems.push("secret-scan found a value");
  } else {
    console.log("secret-scan skipped (no .env.local, nothing to scan for)");
  }
  rmSync(logFile, { force: true });

  const gate = GATE[mode];
  const server = await startNextServer({ env, port: PORT, label: mode });
  let gateCode = -1;
  try {
    console.log(`server[${mode}] started on ${PORT} (log: ${server.logFile})`);
    const result = await runCommand(
      process.execPath,
      ["--import", "tsx", "--test", "--test-reporter=spec", "tests/build/env-gate-http.test.ts"],
      { env: { ...process.env, GATE_MODE: gate, TEST_BASE_URL: `http://localhost:${PORT}` } },
    );
    gateCode = result.code;
  } finally {
    await server.stop();
    console.log(`server[${mode}] stopped`);
  }
  if (gateCode !== 0) problems.push(`gate test (GATE_MODE=${gate}) exit=${gateCode}`);
  return summarize(mode, `build=0 scan=${scan ? "run" : "skipped"} gate=${gate} gate-exit=${gateCode}`, problems);
}

function summarize(mode: Mode, facts: string, problems: string[]): string {
  return `mode=${mode} ${facts} -> ${problems.length === 0 ? "PASS" : `FAIL (${problems.join("; ")})`}`;
}

async function main(): Promise<number> {
  const modes = parseModes(process.argv.slice(2));
  const before = envFileHash();
  console.log(`node ${process.version}; modes: ${modes.join(", ")}; .env.local present=${before !== null}; port ${PORT}`);
  const summary: string[] = [];
  for (const mode of modes) {
    summary.push(await runMode(mode, before !== null));
  }
  const after = envFileHash();
  const envUnchanged = before === after;
  console.log("\n## summary");
  for (const line of summary) console.log(line);
  console.log(`.env.local ${before === null ? "absent" : envUnchanged ? "unchanged" : "CHANGED"}`);
  const ok = envUnchanged && summary.every((line) => line.endsWith("-> PASS"));
  console.log(`build-matrix ${ok ? "PASS" : "FAIL"}`);
  return ok ? 0 : 1;
}

main().then(
  (code) => {
    process.exitCode = code;
  },
  (error: unknown) => {
    console.error(`build-matrix error: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  },
);
