import assert from "node:assert/strict";

import { getPage, pageFact, type PageResult } from "./http";

/**
 * HTML readers of the public publication pages (M3-05). The index renders a
 * container with `data-index-state`, `data-index-total`, `data-index-page`,
 * `data-index-pages` and optional `data-index-unknown`, and one title link
 * per row: `<a … data-publication-slug="<slug>" …><title></a>`.
 */
export type IndexStateAttributes = {
  state: string | null;
  total: number | null;
  page: number | null;
  pages: number | null;
  unknown: string | null;
};

function attribute(html: string, name: string): string | null {
  const match = new RegExp(`\\s${name}="([^"]*)"`).exec(html);
  return match ? (match[1] as string) : null;
}

function numberAttribute(html: string, name: string): number | null {
  const value = attribute(html, name);
  return value === null ? null : Number(value);
}

export function indexState(html: string): IndexStateAttributes {
  return {
    state: attribute(html, "data-index-state"),
    total: numberAttribute(html, "data-index-total"),
    page: numberAttribute(html, "data-index-page"),
    pages: numberAttribute(html, "data-index-pages"),
    unknown: attribute(html, "data-index-unknown"),
  };
}

/** Row slugs in page order. */
export function rowSlugs(html: string): string[] {
  return [...html.matchAll(/data-publication-slug="([^"]+)"/g)].map((match) => match[1] as string);
}

/** Row titles by slug (the text of the title link; HTML entities left as they are). */
export function rowTitles(html: string): Map<string, string> {
  const titles = new Map<string, string>();
  for (const match of html.matchAll(/data-publication-slug="([^"]+)"[^>]*>([^<]*)</g)) {
    titles.set(match[1] as string, match[2] as string);
  }
  return titles;
}

/** `content` of the robots meta tag wherever it is in the HTML (streamed metadata included), or null. */
export function robotsContent(html: string): string | null {
  for (const match of html.matchAll(/<meta\s[^>]*>/g)) {
    const tag = match[0];
    if (/\sname="robots"/.test(tag)) return attribute(tag, "content");
  }
  return null;
}

export function decodeAmp(value: string): string {
  return value.replace(/&amp;/g, "&");
}

/**
 * The HTML with React's streamed segments put back in place, for structural
 * checks. While streaming, React can leave `<template id="P:n"></template>`
 * inside an element and send its content later as
 * `<div hidden id="S:n">…</div><script>…$RS("S:n","P:n")</script>`; the
 * browser moves it in. Here each such segment is cut out and replaces its
 * placeholder (repeated for nested placeholders). Suspense boundaries
 * (`$RC`) are left as they are.
 */
export function inlineSegments(html: string): string {
  const segments = new Map<string, string>();
  const ranges: [number, number][] = [];
  for (const match of html.matchAll(/<div hidden id="S:(\d+)">/g)) {
    const id = match[1] as string;
    const call = html.indexOf(`$RS("S:${id}","P:${id}")`, match.index);
    const end = call === -1 ? -1 : html.lastIndexOf("</div><script>", call);
    if (end === -1 || end < match.index) continue;
    segments.set(id, html.slice(match.index + match[0].length, end));
    ranges.push([match.index, end + "</div>".length]);
  }
  let result = "";
  let cursor = 0;
  for (const [start, end] of ranges) {
    result += html.slice(cursor, start);
    cursor = end;
  }
  result += html.slice(cursor);
  for (let pass = 0; pass < 10; pass++) {
    let replaced = false;
    result = result.replace(/<template id="P:(\d+)"><\/template>/g, (placeholder, id: string) => {
      const content = segments.get(id);
      if (content === undefined) return placeholder;
      replaced = true;
      return content;
    });
    if (!replaced) break;
  }
  return result;
}

/**
 * Digest of notFound() in the streamed RSC data (Next 16.4.4). The visible
 * text of the default not-found page is in the payload of every page, so it
 * proves nothing; this digest is only there when notFound() was thrown.
 */
export const NOT_FOUND_DIGEST = "NEXT_HTTP_ERROR_FALLBACK;404";

/**
 * A publication URL without a public page (M3-05, DECISIONS §2.11 P7 A as
 * amended 2026-11-13): notFound() with robots noindex and no detail. Next
 * 16.4.4 sends the static shell of the detail route first, so the status is
 * 200; 404 is accepted too. Returns the status for a diagnostic.
 */
export function assertNotFoundPage(result: PageResult, label: string): number {
  assert.ok(result.status === 200 || result.status === 404, `${label}: ${pageFact(result)}`);
  const robots = robotsContent(result.body);
  assert.ok(robots !== null && robots.includes("noindex"), `${label}: robots ${robots ?? "missing"}`);
  assert.ok(result.body.includes(NOT_FOUND_DIGEST), `${label}: no notFound() digest`);
  assert.equal(result.body.includes("data-publication-detail"), false, `${label}: data-publication-detail present`);
  return result.status;
}

export type IndexPages = { slugs: string[]; titles: Map<string, string>; bodies: string[]; pages: number };

/**
 * Every page of one index URL: page 1, then `page=2..data-index-pages`.
 * Asserts HTTP 200 and a list or empty state on each page.
 */
export async function fetchAllIndexPages(locale: "id" | "en", query = ""): Promise<IndexPages> {
  const url = (page: number) => {
    const params = [query, page > 1 ? `page=${page}` : ""].filter(Boolean).join("&");
    return `/${locale}/publications${params ? `?${params}` : ""}`;
  };
  const slugs: string[] = [];
  const titles = new Map<string, string>();
  const bodies: string[] = [];
  let pages = 1;
  for (let page = 1; page <= pages; page++) {
    const path = url(page);
    const result = await getPage(path);
    assert.equal(result.status, 200, `GET ${path} ${pageFact(result)}`);
    const state = indexState(result.body);
    assert.ok(state.state === "list" || state.state === "empty", `GET ${path}: data-index-state=${state.state}`);
    if (page === 1) pages = state.pages ?? 1;
    slugs.push(...rowSlugs(result.body));
    for (const [slug, title] of rowTitles(result.body)) titles.set(slug, title);
    bodies.push(result.body);
  }
  return { slugs, titles, bodies, pages };
}
