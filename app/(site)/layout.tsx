import type { Metadata, Viewport } from "next";
import { Hanken_Grotesk } from "next/font/google";
import { DEFAULT_LOCALE } from "@/lib/i18n/locales";
import { HOME_DESCRIPTION, HOME_TITLE, SITE_URL } from "@/lib/seo/site";
import "./globals.css";

const hankenGrotesk = Hanken_Grotesk({
  variable: "--font-hanken-grotesk",
  subsets: ["latin"],
  display: "swap",
});

const description = HOME_DESCRIPTION;

export const metadata: Metadata = {
  // M3-07 (DEC-021): every relative metadata URL resolves on https://mahira.id, also on Preview.
  metadataBase: new URL(SITE_URL),
  title: {
    default: HOME_TITLE,
    template: "%s — Mahira Indonesia Development",
  },
  description,
  applicationName: "Mahira Indonesia Development",
  keywords: [
    "Mahira Indonesia Development",
    "riset Indonesia",
    "kebijakan publik",
    "publikasi riset",
    "learning hub",
    "pembangunan Indonesia",
  ],
  authors: [{ name: "Mahira Indonesia Development" }],
  creator: "Mahira Indonesia Development",
  openGraph: {
    type: "website",
    locale: "id_ID",
    siteName: "Mahira Indonesia Development",
    title: HOME_TITLE,
    description,
  },
  twitter: {
    card: "summary_large_image",
    title: HOME_TITLE,
    description,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: "#1E6FB7",
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang={DEFAULT_LOCALE} className={`${hankenGrotesk.variable} h-full antialiased`}>
      <body className="min-h-full bg-white font-sans text-ink">
        <a href="#main" className="skip-link">
          Lewati ke konten
        </a>
        {children}
      </body>
    </html>
  );
}
