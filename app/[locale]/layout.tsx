import type { Metadata, Viewport } from "next";
import { Hanken_Grotesk } from "next/font/google";
import { notFound } from "next/navigation";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { isLocale, LOCALES } from "@/lib/i18n/locales";
import "../(site)/globals.css";

/**
 * Root layout of the locale-prefixed pages (DEC-005, ADR-0005; Owner
 * 2026-11-10, P4a B). Only `id` and `en` are valid; anything else is 404.
 * There is no page directly under [locale], so `/id` and `/en` are 404 too.
 */

const hankenGrotesk = Hanken_Grotesk({
  variable: "--font-hanken-grotesk",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Mahira Indonesia Development",
    template: "%s — Mahira Indonesia Development",
  },
  applicationName: "Mahira Indonesia Development",
};

export const viewport: Viewport = {
  themeColor: "#1E6FB7",
  colorScheme: "light",
};

// Required with Cache Components so the root param is known at build time.
export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: Readonly<{ children: React.ReactNode; params: Promise<{ locale: string }> }>) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dictionary = getDictionary(locale);

  return (
    <html lang={locale} className={`${hankenGrotesk.variable} h-full antialiased`}>
      <body className="min-h-full bg-white font-sans text-ink">
        <a href="#main" className="skip-link">
          {dictionary.skipLink}
        </a>
        {children}
      </body>
    </html>
  );
}
