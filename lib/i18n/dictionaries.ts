import type { Locale } from "./locales";

/** UI strings of the locale-prefixed pages. Both locales are complete. */
export type Dictionary = {
  skipLink: string;
  homeLinkLabel: string;
  languageSwitcherLabel: string;
  languageNames: Record<Locale, string>;
  publications: {
    title: string;
    intro: string;
    loading: string;
    empty: string;
    filtersLabel: string;
    type: string;
    topic: string;
    year: string;
    all: string;
    apply: string;
    clear: string;
    count: (total: number) => string;
    noResults: string;
    /** `labels`: the names of the unknown filters, joined (never the values). */
    unknownFilter: (labels: string) => string;
    pageNotFound: string;
    firstPage: string;
    error: string;
    pagination: {
      label: string;
      previous: string;
      next: string;
      pageOf: (page: number, pages: number) => string;
      page: (page: number) => string;
    };
  };
};

export const dictionaries: Record<Locale, Dictionary> = {
  id: {
    skipLink: "Lewati ke konten",
    homeLinkLabel: "Beranda Mahira Indonesia Development",
    languageSwitcherLabel: "Pilih bahasa",
    languageNames: { id: "Bahasa Indonesia", en: "English" },
    publications: {
      title: "Publikasi",
      intro: "Publikasi yang terbit dalam Bahasa Indonesia.",
      loading: "Memuat publikasi…",
      empty: "Belum ada publikasi yang terbit dalam Bahasa Indonesia.",
      filtersLabel: "Saring publikasi",
      type: "Jenis",
      topic: "Bidang kerja",
      year: "Tahun",
      all: "Semua",
      apply: "Terapkan",
      clear: "Hapus filter",
      count: (total) => `${total} publikasi`,
      noResults: "Tidak ada publikasi yang cocok dengan filter ini.",
      unknownFilter: (labels) => `Filter tidak dikenal: ${labels}.`,
      pageNotFound: "Halaman ini tidak ada.",
      firstPage: "Kembali ke halaman 1",
      error: "Publikasi belum dapat dimuat. Coba muat ulang halaman beberapa saat lagi.",
      pagination: {
        label: "Paginasi",
        previous: "Sebelumnya",
        next: "Berikutnya",
        pageOf: (page, pages) => `Halaman ${page} dari ${pages}`,
        page: (page) => `Halaman ${page}`,
      },
    },
  },
  en: {
    skipLink: "Skip to content",
    homeLinkLabel: "Mahira Indonesia Development home",
    languageSwitcherLabel: "Choose language",
    languageNames: { id: "Bahasa Indonesia", en: "English" },
    publications: {
      title: "Publications",
      intro: "Publications published in English.",
      loading: "Loading publications…",
      empty: "No publications have been published in English yet.",
      filtersLabel: "Filter publications",
      type: "Type",
      topic: "Topic",
      year: "Year",
      all: "All",
      apply: "Apply",
      clear: "Clear filters",
      count: (total) => (total === 1 ? "1 publication" : `${total} publications`),
      noResults: "No publications match these filters.",
      unknownFilter: (labels) => `Unknown filter: ${labels}.`,
      pageNotFound: "This page does not exist.",
      firstPage: "Back to page 1",
      error: "Publications could not be loaded. Please reload the page in a moment.",
      pagination: {
        label: "Pagination",
        previous: "Previous",
        next: "Next",
        pageOf: (page, pages) => `Page ${page} of ${pages}`,
        page: (page) => `Page ${page}`,
      },
    },
  },
};

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}
