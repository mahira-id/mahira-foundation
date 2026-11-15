import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

import type { Locale } from "@/lib/i18n/locales";
import { OG_IMAGE_SIZE } from "@/lib/seo/site";

/**
 * Server-only. Generated typographic Open Graph image (M3-07, DEC-021, Owner
 * M3-07 decision 5): Mahira logo, a short label and a title in Hanken
 * Grotesk 700, 1200×630 PNG, built with Next's own `ImageResponse`
 * (`next/og`), no extra dependency. Used when a page has no cover.
 *
 * Fonts: Hanken Grotesk 700 latin + latin-ext TTF (SIL OFL 1.1) in
 * assets/fonts/ (source and checksums in assets/fonts/README.md); logo
 * public/logo/MAHIRA_L_BLUE.svg. Read once per server instance. Colours copy
 * the tokens of app/(site)/globals.css (`ImageResponse` cannot read CSS
 * variables; one token source is DEC-024, still open).
 */
const COLORS = { white: "#ffffff", ink: "#101010", brand500: "#1e6fb7", brand700: "#144c7e", orange: "#ff6a00" };

const FONT_FILES = ["HankenGrotesk-latin-700-normal.ttf", "HankenGrotesk-latin-ext-700-normal.ttf"] as const;
const FONT_FAMILY = '"Hanken Grotesk", "Hanken Grotesk Ext"';

/** Logo size at 56 px height (viewBox 2221 × 373). */
const LOGO = { width: 333, height: 56 };

type Assets = { fonts: [ArrayBuffer, ArrayBuffer]; logo: string };

let assets: Promise<Assets> | undefined;

function toArrayBuffer(buffer: Buffer): ArrayBuffer {
  return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer;
}

function loadAssets(): Promise<Assets> {
  assets ??= Promise.all([
    readFile(join(process.cwd(), "assets", "fonts", FONT_FILES[0])),
    readFile(join(process.cwd(), "assets", "fonts", FONT_FILES[1])),
    readFile(join(process.cwd(), "public", "logo", "MAHIRA_L_BLUE.svg")),
  ]).then(
    ([latin, latinExt, logo]): Assets => ({
      fonts: [toArrayBuffer(latin), toArrayBuffer(latinExt)],
      logo: `data:image/svg+xml;base64,${logo.toString("base64")}`,
    }),
    (error: unknown) => {
      // A failed read is retried on the next request.
      assets = undefined;
      throw error;
    },
  );
  return assets;
}

/** Title size by length (code points), so long titles still fit in four lines. */
export function titleFontSize(title: string): number {
  const length = Array.from(title).length;
  if (length <= 40) return 76;
  if (length <= 80) return 64;
  if (length <= 140) return 52;
  return 44;
}

export type OgImageContent = {
  /** Language of the texts (only the route locale's texts are ever passed). */
  lang: Locale;
  /** Short label above the title, e.g. "Publikasi". */
  label: string;
  title: string;
};

/** The PNG response. `headers` go on the HTTP response (e.g. Cache-Control). */
export async function ogImageResponse(content: OgImageContent, headers?: Record<string, string>): Promise<ImageResponse> {
  const { fonts, logo } = await loadAssets();
  return new ImageResponse(
    (
      <div
        lang={content.lang}
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: COLORS.white,
          fontFamily: FONT_FAMILY,
          color: COLORS.ink,
        }}
      >
        <div style={{ display: "flex", padding: "64px 80px 0" }}>
          {/* eslint-disable-next-line @next/next/no-img-element -- ImageResponse (Satori) renders plain <img> only. */}
          <img alt="" height={LOGO.height} src={logo} width={LOGO.width} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", padding: "0 80px" }}>
          <div
            style={{
              display: "flex",
              fontSize: 24,
              fontWeight: 700,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: COLORS.brand700,
            }}
          >
            {content.label}
          </div>
          <div
            style={{
              display: "block",
              marginTop: 24,
              fontSize: titleFontSize(content.title),
              fontWeight: 700,
              lineHeight: 1.08,
              letterSpacing: "-0.02em",
              lineClamp: 4,
            }}
          >
            {content.title}
          </div>
        </div>
        <div style={{ display: "flex", height: 16, backgroundColor: COLORS.brand500 }}>
          <div style={{ display: "flex", width: 192, height: 16, backgroundColor: COLORS.orange }} />
        </div>
      </div>
    ),
    {
      ...OG_IMAGE_SIZE,
      fonts: [
        { name: "Hanken Grotesk", data: fonts[0], weight: 700, style: "normal" },
        { name: "Hanken Grotesk Ext", data: fonts[1], weight: 700, style: "normal" },
      ],
      headers,
    },
  );
}

/** Plain 404 of an OG image URL without an image (CMS off, unknown or ineligible). */
export function ogNotFound(): Response {
  return new Response("Not Found", {
    status: 404,
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store", "X-Robots-Tag": "noindex" },
  });
}
