import type { Metadata, Viewport } from "next";
import { Hanken_Grotesk } from "next/font/google";
import "./globals.css";

const hankenGrotesk = Hanken_Grotesk({
  variable: "--font-hanken-grotesk",
  subsets: ["latin"],
  display: "swap",
});

const description =
  "Platform publikasi dan pembelajaran Mahira Indonesia Development. Temukan riset, analisis kebijakan, dan materi pembelajaran untuk pembangunan Indonesia yang lebih adil.";

export const metadata: Metadata = {
  title: {
    default:
      "Mahira Indonesia Development — Riset, Kebijakan, dan Pembelajaran",
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
    title:
      "Mahira Indonesia Development — Riset, Kebijakan, dan Pembelajaran",
    description,
  },
  twitter: {
    card: "summary_large_image",
    title:
      "Mahira Indonesia Development — Riset, Kebijakan, dan Pembelajaran",
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
    <html lang="id" className={`${hankenGrotesk.variable} h-full antialiased`}>
      <body className="min-h-full bg-white font-sans text-ink">
        <a href="#main" className="skip-link">
          Lewati ke konten
        </a>
        {children}
      </body>
    </html>
  );
}
