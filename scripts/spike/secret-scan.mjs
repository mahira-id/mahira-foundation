#!/usr/bin/env node
// Spike secret scan (M2): fails if any value from .env.local appears in the
// given files or directories. Prints key names and file paths only, never
// values.
//
// Usage: node scripts/spike/secret-scan.mjs <path> [<path> ...]

import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const MIN_LENGTH = 12;
const SKIP_DIRS = new Set(["node_modules", ".git"]);

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const envFile = path.join(repoRoot, ".env.local");

function loadNeedles() {
  const needles = [];
  const text = readFileSync(envFile, "utf8").replace(/^\uFEFF/, "");
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (line === "" || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq <= 0) continue;
    const key = line.slice(0, eq).trim().replace(/^export\s+/, "");
    let value = line.slice(eq + 1).trim();
    if (
      value.length >= 2 &&
      (value[0] === '"' || value[0] === "'") &&
      value.at(-1) === value[0]
    ) {
      value = value.slice(1, -1);
    }
    if (value.length >= MIN_LENGTH) {
      needles.push({ key, value: Buffer.from(value, "utf8") });
    }
    // A connection string's password can leak on its own.
    try {
      const url = new URL(value);
      const password = decodeURIComponent(url.password);
      if (password.length >= MIN_LENGTH) {
        needles.push({ key: `${key}(password)`, value: Buffer.from(password, "utf8") });
      }
    } catch {
      // not a URL
    }
  }
  return needles;
}

function* walk(target) {
  const stats = statSync(target);
  if (stats.isFile()) {
    yield target;
    return;
  }
  if (!stats.isDirectory()) return;
  for (const entry of readdirSync(target, { withFileTypes: true })) {
    if (entry.isDirectory() && SKIP_DIRS.has(entry.name)) continue;
    yield* walk(path.join(target, entry.name));
  }
}

const targets = process.argv.slice(2);
if (targets.length === 0) {
  console.error("usage: node scripts/spike/secret-scan.mjs <path> [<path> ...]");
  process.exit(2);
}

const needles = loadNeedles();
let files = 0;
let found = 0;

for (const target of targets) {
  const absolute = path.resolve(process.cwd(), target);
  for (const file of walk(absolute)) {
    files += 1;
    const content = readFileSync(file);
    for (const { key, value } of needles) {
      if (content.includes(value)) {
        found += 1;
        console.log(`FOUND ${key} in ${path.relative(repoRoot, file)}`);
      }
    }
  }
}

if (found > 0) {
  process.exitCode = 1;
} else {
  console.log(`secret-scan: clean (${files} files)`);
}
