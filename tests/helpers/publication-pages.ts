import assert from "node:assert/strict";

import { getPage, pageFact } from "./http";

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
