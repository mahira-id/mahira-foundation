import { createHash } from "node:crypto";
import { existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { AUTH_KEY_NAME, AUTH_URL_NAME } from "../lib/auth/env";
import { CMS_ENV_NAMES } from "../payload/env";
import { NEXT_BIN, REPO_ROOT, runCommand, startNextServer, type ChildEnv } from "./lib/processes";

/**
 * Build matrix of the CMS env gate (M3-00, ENVIRONMENTS §3.1; M3-10) and
 * the account env gate (M5-02, DECISIONS §2.18 decisions 4 and 5).
 *
 *   absent       five CMS variables and the publishable key "" -> build 0, CMS off, accounts off
 *   prodsim      VERCEL_ENV=production                         -> build 0, CMS prod, accounts off
 *   partial      only PAYLOAD_SECRET (dummy) set, key ""        -> build fails, names only
 *   authpartial  CMS "", publishable key (dummy) set            -> build fails, names only APP_SUPABASE_URL
 *   authoff      .env.local with the publishable key ""         -> build 0, CMS on, accounts off
 *   full         .env.local as is                               -> build 0, CMS on, accounts on
 *
 * `.env.local` is never renamed or written: `@next/env` does not apply a key
 * that is already in the environment, even as "", so empty values in the
 * child env switch the CMS or the accounts off for that child only.
 * Defaults: all six modes when `.env.local` exists (full last, so `.next`
 * ends as a full build), otherwise the first four (CI). `--modes a,b`
 * picks modes.
 *
 * Usage: bun run test:build-matrix [--modes absent,prodsim,partial,authpartial,authoff,full]
 * Prints names and exit codes only, never a value.
 */
const MODES = ["absent", "prodsim", "partial", "authpartial", "authoff", "full"] as const;
type Mode = (typeof MODES)[number];
type FailingMode = "partial" | "authpartial";
type BuildingMode = Exclude<Mode, FailingMode>;
const NEEDS_ENV_FILE: Mode[] = ["authoff", "full"];
const GATE: Record<BuildingMode, "off" | "prod" | "on"> = { absent: "off", prodsim: "prod", authoff: "on", full: "on" };
const AUTH_GATE: Record<BuildingMode, "off" | "on"> = { absent: "off", prodsim: "off", authoff: "off", full: "on" };
const PARTIAL_DUMMY = "m3-10-partial-dummy-value";
const AUTH_PARTIAL_DUMMY = "m5-02-authpartial-dummy-key";
/** What a failing build must print: the error marker, the variables it names, and those it must not name. */
const FAILING: Record<FailingMode, { marker: string; named: string[]; notNamed: string[]; dummy: string }> = {
  partial: {
    marker: "Incomplete CMS environment; missing:",
    named: CMS_ENV_NAMES.filter((name) => name !== "PAYLOAD_SECRET"),
    notNamed: [],
    dummy: PARTIAL_DUMMY,
  },
  authpartial: {
    marker: "Incomplete auth environment; missing:",
    named: [AUTH_URL_NAME],
    notNamed: [AUTH_KEY_NAME],
    dummy: AUTH_PARTIAL_DUMMY,
  },
};
const PORT = Number(process.env.TEST_PORT ?? "3100");
const ENV_FILE = path.join(REPO_ROOT, ".env.local");
const SECRET_SCAN = path.join(REPO_ROOT, "scripts", "secret-scan.mjs");

function isFailing(mode: Mode): mode is FailingMode {
  return mode === "partial" || mode === "authpartial";
}

function parseModes(argv: string[]): Mode[] {
  const hasEnvFile = existsSync(ENV_FILE);
  const index = argv.indexOf("--modes");
  if (index === -1) return hasEnvFile ? [...MODES] : MODES.filter((mode) => !NEEDS_ENV_FILE.includes(mode));
  const list = (argv[index + 1] ?? "").split(",").map((mode) => mode.trim()).filter(Boolean);
  if (list.length === 0) throw new Error(`--modes needs a list of: ${MODES.join(", ")}`);
  for (const mode of list) {
    if (!(MODES as readonly string[]).includes(mode)) throw new Error(`Unknown mode "${mode}"; allowed: ${MODES.join(", ")}`);
    if ((NEEDS_ENV_FILE as string[]).includes(mode) && !hasEnvFile) throw new Error(`Mode ${mode} needs .env.local in the repository root.`);
  }
  // Keep the documented order whatever the argument order is.
  return MODES.filter((mode) => list.includes(mode));
}

function childEnv(mode: Mode): ChildEnv {
  const env: ChildEnv = { ...process.env };
  delete env.VERCEL_ENV;
  if (mode === "absent") {
    for (const name of CMS_ENV_NAMES) env[name] = "";
    env[AUTH_KEY_NAME] = "";
  } else if (mode === "prodsim") {
    env.VERCEL_ENV = "production";
  } else if (mode === "partial") {
    for (const name of CMS_ENV_NAMES) env[name] = "";
    env.PAYLOAD_SECRET = PARTIAL_DUMMY;
    env[AUTH_KEY_NAME] = "";
  } else if (mode === "authpartial") {
    for (const name of CMS_ENV_NAMES) env[name] = "";
    env[AUTH_KEY_NAME] = AUTH_PARTIAL_DUMMY;
  } else if (mode === "authoff") {
    env[AUTH_KEY_NAME] = "";
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

async function runFailingMode(mode: FailingMode, build: { code: number; output: string }, logFile: string, scan: boolean): Promise<string> {
  const { marker, named, notNamed, dummy } = FAILING[mode];
  const problems: string[] = [];
  const errorLine = build.output.split(/\r?\n/).find((line) => line.includes(marker));
  if (errorLine) console.log(`  ${errorLine.trim()}`);
  if (build.code === 0) problems.push(`${mode} build must fail`);
  if (!errorLine) problems.push(`missing '${marker}'`);
  for (const name of named) {
    if (!errorLine?.includes(name)) problems.push(`error does not name ${name}`);
  }
  for (const name of notNamed) {
    if (errorLine?.includes(name)) problems.push(`error names ${name}, which is set`);
  }
  if (build.output.includes(dummy)) problems.push("build output contains the dummy value");
  if (scan && !(await secretScan([logFile]))) problems.push("secret-scan of the build log found a value");
  rmSync(logFile, { force: true });
  return summarize(mode, `build=${build.code} (expected non-zero, names only)`, problems);
}

async function runMode(mode: Mode, scan: boolean): Promise<string> {
  const env = childEnv(mode);
  console.log(`\n## mode=${mode}: next build`);
  const build = await runCommand(process.execPath, [NEXT_BIN, "build"], { env, echo: false });
  const logFile = path.join(tmpdir(), `mahira-m3-10-build-${mode}-${Date.now()}.log`);
  writeFileSync(logFile, build.output);
  console.log(`build[${mode}] exit=${build.code} (log: ${logFile})`);
  if (isFailing(mode)) return runFailingMode(mode, build, logFile, scan);
  const problems: string[] = [];

  for (const line of routeLines(build.output)) console.log(line);
  if (build.code !== 0) {
    problems.push("build must succeed");
    console.log(`build[${mode}] log kept for debugging: ${logFile} (not secret-scanned; delete it after reading)`);
    return summarize(mode, `build=${build.code} (expected 0)`, problems);
  }
  if (scan) {
    if (!(await secretScan([logFile, ".next/static", ".next/server"]))) problems.push("secret-scan found a value");
  } else {
    console.log("secret-scan skipped (no .env.local, nothing to scan for)");
  }
  rmSync(logFile, { force: true });

  const gate = GATE[mode];
  const authGate = AUTH_GATE[mode];
  const server = await startNextServer({ env, port: PORT, label: mode });
  let gateCode = -1;
  try {
    console.log(`server[${mode}] started on ${PORT} (log: ${server.logFile})`);
    const result = await runCommand(
      process.execPath,
      ["--import", "tsx", "--test", "--test-reporter=spec", "tests/build/env-gate-http.test.ts"],
      { env: { ...process.env, GATE_MODE: gate, AUTH_GATE_MODE: authGate, TEST_BASE_URL: `http://localhost:${PORT}` } },
    );
    gateCode = result.code;
  } finally {
    const keepLog = gateCode !== 0;
    await server.stop({ keepLog });
    console.log(`server[${mode}] stopped; log ${keepLog ? `kept for debugging: ${server.logFile} (delete it after reading)` : "deleted"}`);
  }
  if (gateCode !== 0) problems.push(`gate test (GATE_MODE=${gate} AUTH_GATE_MODE=${authGate}) exit=${gateCode}`);
  return summarize(mode, `build=0 scan=${scan ? "run" : "skipped"} gate=${gate} auth=${authGate} gate-exit=${gateCode}`, problems);
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
