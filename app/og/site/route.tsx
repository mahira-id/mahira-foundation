import { ogImageResponse } from "@/lib/seo/og-image";

/**
 * Open Graph image of the homepage `/` (M3-07, DEC-021): static approved copy
 * only (the hero eyebrow line and headline), so it is prerendered at build
 * time, with the CMS on or off.
 */
export async function GET() {
  return ogImageResponse({ lang: "id", label: "Riset · Kebijakan · Pembelajaran", title: "Riset untuk Indonesia yang lebih adil." });
}
