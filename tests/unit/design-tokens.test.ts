import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, test } from "node:test";

import { COLOR, COLOR_TOKENS, THEME_COLOR } from "../../lib/design/tokens";

/**
 * M3-09, DEC-024 (DECISIONS §2.15 decision 9): `app/globals.css` is the single
 * runtime token source. Rules use `var(--…)` only; colour literals appear in
 * the `@theme` block alone. Code that cannot read CSS (theme-color meta, the
 * Open Graph image) takes its few values from lib/design/tokens.ts, and these
 * tests fail when that module and the CSS drift apart.
 */
const ROOT = path.resolve(import.meta.dirname, "..", "..");
const CSS_PATH = path.join(ROOT, "app", "globals.css");

function read(...parts: string[]): string {
  return readFileSync(path.join(ROOT, ...parts), "utf8");
}

function stripComments(css: string): string {
  return css.replace(/\/\*[\s\S]*?\*\//g, "");
}

/** The body of the (single) `@theme { … }` block. */
function themeBlock(css: string): string {
  const start = css.indexOf("@theme");
  assert.notEqual(start, -1, "@theme block");
  const open = css.indexOf("{", start);
  let depth = 0;
  for (let i = open; i < css.length; i++) {
    if (css[i] === "{") depth++;
    else if (css[i] === "}" && --depth === 0) return css.slice(open + 1, i);
  }
  throw new Error("@theme block is not closed");
}

function files(directory: string, extensions: string[]): string[] {
  const found: string[] = [];
  for (const entry of readdirSync(path.join(ROOT, directory), { withFileTypes: true })) {
    const relative = path.join(directory, entry.name);
    if (entry.isDirectory()) found.push(...files(relative, extensions));
    else if (extensions.includes(path.extname(entry.name))) found.push(relative);
  }
  return found;
}

const HEX = /#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b/;
const COLOR_FUNCTION = /\b(?:rgba?|hsla?|oklch|oklab|lab|lch|hwb)\(/i;

describe("DEC-024 design tokens (M3-09)", () => {
  test("TKU1 lib/design/tokens.ts values equal the tokens of app/globals.css", () => {
    const theme = themeBlock(stripComments(readFileSync(CSS_PATH, "utf8")));
    const tokens = new Map<string, string>();
    for (const match of theme.matchAll(/(--[a-z0-9-]+)\s*:\s*([^;]+);/g)) tokens.set(match[1] as string, (match[2] as string).trim());
    for (const key of Object.keys(COLOR) as (keyof typeof COLOR)[]) {
      const token = COLOR_TOKENS[key];
      const value = tokens.get(token);
      assert.ok(value, `${token} is defined in @theme`);
      assert.equal(COLOR[key].toLowerCase(), value.toLowerCase(), `COLOR.${key} equals ${token}`);
    }
    assert.equal(THEME_COLOR.toLowerCase(), (tokens.get("--color-brand-500") as string).toLowerCase(), "THEME_COLOR equals --color-brand-500");
    assert.equal(THEME_COLOR, "#1E6FB7", "the rendered theme-color meta keeps its upper-case value");
  });

  test("TKU2 no colour literal outside @theme in CSS, none in TS/TSX except lib/design/tokens.ts, and every var(--color-*) / var(--radius-*) is defined", () => {
    const problems: string[] = [];
    for (const file of files("app", [".css"])) {
      const css = stripComments(read(file));
      const theme = css.indexOf("@theme") === -1 ? "" : themeBlock(css);
      const rules = theme ? css.replace(theme, "") : css;
      for (const pattern of [HEX, COLOR_FUNCTION]) {
        const match = pattern.exec(rules);
        if (match) problems.push(`${file}: ${match[0]} outside @theme`);
      }
    }
    const tokensFile = path.join("lib", "design", "tokens.ts");
    for (const directory of ["app", "components", "lib"]) {
      for (const file of files(directory, [".ts", ".tsx"])) {
        if (file === tokensFile) continue;
        const match = HEX.exec(read(file));
        if (match) problems.push(`${file}: ${match[0]}`);
      }
    }
    assert.deepEqual(problems, []);

    const css = stripComments(read("app", "globals.css"));
    const defined = new Set([...themeBlock(css).matchAll(/(--[a-z0-9-]+)\s*:/g)].map((match) => match[1] as string));
    const undefinedUses = new Set<string>();
    for (const match of css.matchAll(/var\((--(?:color|radius)-[a-z0-9-]+)\)/g)) {
      if (!defined.has(match[1] as string)) undefinedUses.add(match[1] as string);
    }
    assert.deepEqual([...undefinedUses], [], "tokens used but not defined in @theme");
  });

  test("TKU3 the stylesheet lives at app/globals.css, the old path is gone and the three root layouts import it", () => {
    assert.equal(existsSync(CSS_PATH), true, "app/globals.css exists");
    assert.equal(existsSync(path.join(ROOT, "app", "(site)", "globals.css")), false, "app/(site)/globals.css is gone");
    assert.match(read("app", "(site)", "layout.tsx"), /^import "\.\.\/globals\.css";$/m);
    assert.match(read("app", "[locale]", "layout.tsx"), /^import "\.\.\/globals\.css";$/m);
    assert.match(read("app", "global-not-found.tsx"), /^import "\.\/globals\.css";$/m);
    for (const file of ["app/(site)/layout.tsx", "app/[locale]/layout.tsx", "app/global-not-found.tsx"]) {
      assert.match(read(...file.split("/")), /themeColor: THEME_COLOR,/, `${file} uses THEME_COLOR`);
    }
    assert.match(read("lib", "seo", "og-image.tsx"), /const COLORS = COLOR;/, "the OG image takes its colours from lib/design/tokens.ts");
  });
});
