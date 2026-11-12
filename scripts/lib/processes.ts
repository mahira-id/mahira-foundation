import { spawn, spawnSync } from "node:child_process";
import { createWriteStream, rmSync } from "node:fs";
import { connect } from "node:net";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Process helpers for the test scripts (M3-10). Commands run under Node
 * (DEC-018): `process.execPath` + the Next CLI file, never a shell, so no
 * argument is re-parsed and nothing depends on `bun` or `npx` being on PATH.
 */
export const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
export const NEXT_BIN = path.join(REPO_ROOT, "node_modules", "next", "dist", "bin", "next");

// A plain record: Next's types make NODE_ENV required on NodeJS.ProcessEnv,
// so child envs are cast only where they are handed to spawn().
export type ChildEnv = Record<string, string | undefined>;

export type CommandResult = { code: number; output: string };

/**
 * Runs a command and resolves with its exit code and combined output.
 * `echo: false` keeps the output off the console (build logs are long; the
 * caller prints the lines it needs).
 */
export function runCommand(
  command: string,
  args: string[],
  options: { env?: ChildEnv; cwd?: string; echo?: boolean } = {},
): Promise<CommandResult> {
  const echo = options.echo ?? true;
  return new Promise((resolve) => {
    const child = spawn(command, args, {
      cwd: options.cwd ?? REPO_ROOT,
      env: (options.env ?? process.env) as NodeJS.ProcessEnv,
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true,
    });
    const chunks: string[] = [];
    const collect = (stream: NodeJS.WriteStream) => (data: Buffer) => {
      const text = data.toString("utf8");
      chunks.push(text);
      if (echo) stream.write(text);
    };
    child.stdout.on("data", collect(process.stdout));
    child.stderr.on("data", collect(process.stderr));
    child.on("error", (error) => {
      chunks.push(`spawn error: ${error.message}\n`);
      resolve({ code: -1, output: chunks.join("") });
    });
    child.on("close", (code, signal) => {
      resolve({ code: code ?? (signal ? 1 : -1), output: chunks.join("") });
    });
  });
}

function probe(host: string, port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = connect({ host, port });
    socket.setTimeout(1000);
    socket.once("connect", () => {
      socket.destroy();
      resolve(true);
    });
    socket.once("timeout", () => {
      socket.destroy();
      resolve(false);
    });
    socket.once("error", () => resolve(false));
  });
}

/** True when something listens on the port (IPv4 or IPv6 loopback). */
export async function isPortOpen(port: number): Promise<boolean> {
  const [v4, v6] = await Promise.all([probe("127.0.0.1", port), probe("::1", port)]);
  return v4 || v6;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export type NextServer = {
  logFile: string;
  /** Stops the server; deletes the log unless `keepLog` is true. */
  stop: (options?: { keepLog?: boolean }) => Promise<void>;
};

/**
 * Starts `next start` on the port with the given env and waits until `GET /`
 * answers 200 (120 s). Server output goes to a log file in the OS temp
 * folder, never into the repository. The log can hold output of a server
 * running with the full CMS env and is not secret-scanned, so `stop()`
 * deletes it; callers keep it only when a step failed. Refuses a port that
 * is already in use, so a test never talks to a server it did not start.
 *
 * `warmPath`: requested once (any status) before the first `GET /`, so that
 * path is the first request the server handles. HP9 passes `/admin` to check
 * an admin-first Payload init (TEST-PLAN §12.5).
 */
export async function startNextServer(options: {
  env: ChildEnv;
  port: number;
  label: string;
  warmPath?: string;
}): Promise<NextServer> {
  const { env, port, label, warmPath } = options;
  if (await isPortOpen(port)) {
    throw new Error(`Port ${port} is already in use; stop that server first.`);
  }
  const logFile = path.join(tmpdir(), `mahira-m3-10-${label}-${Date.now()}.log`);
  const log = createWriteStream(logFile);
  const child = spawn(process.execPath, [NEXT_BIN, "start", "-p", String(port)], {
    cwd: REPO_ROOT,
    env: env as NodeJS.ProcessEnv,
    stdio: ["ignore", "pipe", "pipe"],
    detached: process.platform !== "win32",
    windowsHide: true,
  });
  // `end: false`: two streams share one log; stop() ends it once, so a late
  // stderr chunk never hits a stream that stdout already ended.
  child.stdout.pipe(log, { end: false });
  child.stderr.pipe(log, { end: false });
  let exited = false;
  child.once("exit", () => {
    exited = true;
  });

  const stop = async ({ keepLog = false }: { keepLog?: boolean } = {}) => {
    if (!exited && child.pid !== undefined) {
      if (process.platform === "win32") {
        spawnSync("taskkill", ["/T", "/F", "/PID", String(child.pid)], { stdio: "ignore", windowsHide: true });
      } else {
        try {
          process.kill(-child.pid, "SIGKILL");
        } catch {
          // already gone
        }
      }
    }
    for (let i = 0; i < 60 && (await isPortOpen(port)); i++) await sleep(500);
    await sleep(1000);
    if (!log.closed) {
      await new Promise<void>((resolve) => {
        log.once("close", () => resolve());
        log.end();
      });
    }
    if (!keepLog) rmSync(logFile, { force: true });
  };

  const deadline = Date.now() + 120_000;
  let warmed = warmPath === undefined;
  while (Date.now() < deadline) {
    if (exited) break;
    try {
      if (!warmed) {
        const warm = await fetch(`http://localhost:${port}${warmPath}`, { redirect: "manual" });
        await warm.arrayBuffer();
        warmed = true;
      }
      const response = await fetch(`http://localhost:${port}/`, { redirect: "manual" });
      await response.arrayBuffer();
      if (response.status === 200) return { logFile, stop };
    } catch {
      // not listening yet
    }
    await sleep(1000);
  }
  await stop({ keepLog: true });
  throw new Error(`next start did not answer GET / with 200 within 120 s (log kept: ${logFile}; delete it after reading).`);
}
