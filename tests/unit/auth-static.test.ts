import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";

/**
 * Static boundary of the Supabase Auth adapter (M5-01, SPIKE-002 exit
 * criterion "no privileged key or cookie leaks to client code", DECISIONS
 * §2.18 decisions 3, 4 and 15a), read from the source tree:
 *   - `@supabase/*` is imported only by lib/auth/* and tests/helpers/*;
 *   - no "use client" module imports lib/auth or `@supabase/*`;
 *   - the APP secret key name, a service-role name and a NEXT_PUBLIC_ env
 *     read appear nowhere in app/, components/, lib/, payload/, proxy.ts;
 *   - both Supabase packages are pinned exactly.
 */
const ROOT = path.resolve(import.meta.dirname, "..", "..");
const APP_DIRS = ["app", "components", "lib", "payload"];
const SOURCE = /\.(ts|tsx|mts|js|mjs)$/;

function files(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(path.join(ROOT, dir), { withFileTypes: true })) {
    const relative = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...files(relative));
    else if (SOURCE.test(entry.name)) out.push(relative);
  }
  return out;
}

const read = (file: string) => readFileSync(path.join(ROOT, file), "utf8");
const posix = (file: string) => file.split(path.sep).join("/");
const IMPORT_SUPABASE = /(?:from\s+|import\s*\(\s*|require\s*\(\s*)["']@supabase\//;
const IMPORT_AUTH = /(?:from\s+|import\s*\(\s*)["'](?:@\/lib\/auth\/|(?:\.\.?\/)+(?:lib\/)?auth\/)/;
const USE_CLIENT = /^\s*["']use client["']/;

test("ASU1 Supabase stays on the server: imports, client modules, secret names, exact pins", () => {
  const app = [...APP_DIRS.flatMap(files), "proxy.ts"];
  const everything = [...app, ...files("tests"), ...files("scripts")];

  const supabaseImporters = everything.filter((file) => IMPORT_SUPABASE.test(read(file))).map(posix);
  assert.ok(supabaseImporters.length > 0, "the adapter imports @supabase/*");
  for (const file of supabaseImporters) {
    assert.equal(file.startsWith("lib/auth/") || file.startsWith("tests/helpers/"), true, `${file} imports @supabase/*`);
  }

  for (const file of app) {
    const text = read(file);
    if (!USE_CLIENT.test(text)) continue;
    assert.equal(IMPORT_SUPABASE.test(text), false, `client module ${posix(file)} imports @supabase/*`);
    assert.equal(IMPORT_AUTH.test(text), false, `client module ${posix(file)} imports lib/auth`);
  }

  for (const file of app) {
    const text = read(file);
    assert.equal(text.includes("APP_SUPABASE_SECRET_KEY"), false, `${posix(file)} names the APP secret key`);
    assert.equal(/SERVICE_ROLE/i.test(text), false, `${posix(file)} names a service-role key`);
    assert.equal(/process\.env(?:\.|\[\s*["'`])NEXT_PUBLIC_/.test(text), false, `${posix(file)} reads a NEXT_PUBLIC_ variable`);
  }

  const manifest = JSON.parse(read("package.json")) as { dependencies: Record<string, string> };
  for (const name of ["@supabase/ssr", "@supabase/supabase-js"]) {
    assert.match(manifest.dependencies[name] ?? "", /^\d+\.\d+\.\d+$/, `${name} pinned exactly`);
  }
});
