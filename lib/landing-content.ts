/*
 * Static homepage copy (DECISIONS §2.7 P2 A): approved configuration, not CMS
 * data. Publications and topics come from lib/cms/public-content.ts.
 */
export type AccessLevel = "public" | "registered" | "subscriber";
export type CoverTone = "blue" | "ink" | "green" | "silver";

export const navigation = [
  { label: "Beranda", href: "#beranda" },
  { label: "Publikasi", href: "#publikasi" },
  { label: "Tentang", href: "#tentang" },
] as const;

export const principles = [
  {
    index: "01",
    title: "Berbasis bukti",
    description:
      "Setiap publikasi berangkat dari pertanyaan dan data yang dapat diperiksa.",
  },
  {
    index: "02",
    title: "Terbuka untuk dibaca",
    description:
      "Judul, ringkasan, dan metadata publikasi yang terbit dapat dibaca siapa saja.",
  },
  {
    index: "03",
    title: "Dibangun bersama",
    description:
      "Riset dan pembelajaran tumbuh melalui percakapan dengan praktisi, akademisi, dan komunitas.",
  },
];
