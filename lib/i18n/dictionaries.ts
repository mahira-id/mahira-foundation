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
    searchLabel: string;
    clearSearch: string;
    type: string;
    topic: string;
    year: string;
    all: string;
    apply: string;
    clear: string;
    count: (total: number) => string;
    noResults: string;
    /** Search (q) set: never quotes the search term. */
    noResultsSearch: string;
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
  detail: {
    breadcrumbLabel: string;
    type: string;
    topics: string;
    published: string;
    language: string;
    authors: string;
    access: string;
    /** Note of the language switcher when the publication has no counterpart in the other language. */
    unavailable: string;
    errorTitle: string;
    errorBody: string;
    reload: string;
  };
  /** File panel of the detail page (M3-08, DECISIONS §2.14 item 7). */
  files: {
    heading: string;
    kinds: Record<"preview" | "full_document" | "appendix" | "dataset" | "supplementary" | "other", string>;
    /** Prefix of the document language ("Bahasa dokumen", read by screen readers). */
    documentLanguage: string;
    download: string;
    /** Note of the staff draft preview, where files have no link. */
    previewNote: string;
  };
  /** Staff draft preview banner (DECISIONS §2.11 P11 A). */
  preview: {
    notice: string;
    exit: string;
  };
  /**
   * Not-found page of the locale-prefixed pages (app/[locale]/not-found.tsx,
   * M3-05b); both locales also on the global 404 page (app/global-not-found.tsx, M3-07).
   */
  notFound: {
    title: string;
    body: string;
    indexLink: string;
    /** Link to `/` on the global 404 page. */
    homeLink: string;
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
      filtersLabel: "Cari dan saring publikasi",
      searchLabel: "Cari publikasi",
      clearSearch: "Hapus pencarian dan filter",
      type: "Jenis",
      topic: "Bidang kerja",
      year: "Tahun",
      all: "Semua",
      apply: "Terapkan",
      clear: "Hapus filter",
      count: (total) => `${total} publikasi`,
      noResults: "Tidak ada publikasi yang cocok dengan filter ini.",
      noResultsSearch: "Tidak ada publikasi yang cocok dengan pencarian ini.",
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
    detail: {
      breadcrumbLabel: "Navigasi lokasi",
      type: "Jenis",
      topics: "Bidang kerja",
      published: "Terbit",
      language: "Bahasa",
      authors: "Penulis",
      access: "Akses",
      unavailable: "Belum tersedia dalam English",
      errorTitle: "Publikasi belum dapat dimuat.",
      errorBody: "Coba muat ulang halaman beberapa saat lagi.",
      reload: "Muat ulang",
    },
    files: {
      heading: "Dokumen",
      kinds: {
        preview: "Pratinjau",
        full_document: "Dokumen lengkap",
        appendix: "Lampiran",
        dataset: "Dataset",
        supplementary: "Materi tambahan",
        other: "Lainnya",
      },
      documentLanguage: "Bahasa dokumen",
      download: "Unduh PDF",
      previewNote: "Unduhan aktif setelah publikasi diterbitkan.",
    },
    preview: {
      notice: "Pratinjau draf: belum tentu terlihat pengunjung.",
      exit: "Keluar dari pratinjau",
    },
    notFound: {
      title: "Halaman tidak ditemukan",
      body: "Halaman yang Anda cari tidak ada atau tidak lagi tersedia.",
      indexLink: "Lihat seluruh publikasi",
      homeLink: "Ke beranda",
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
      filtersLabel: "Search and filter publications",
      searchLabel: "Search publications",
      clearSearch: "Clear search and filters",
      type: "Type",
      topic: "Topic",
      year: "Year",
      all: "All",
      apply: "Apply",
      clear: "Clear filters",
      count: (total) => (total === 1 ? "1 publication" : `${total} publications`),
      noResults: "No publications match these filters.",
      noResultsSearch: "No publications match this search.",
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
    detail: {
      breadcrumbLabel: "Breadcrumb",
      type: "Type",
      topics: "Topics",
      published: "Published",
      language: "Language",
      authors: "Authors",
      access: "Access",
      unavailable: "Not available in Bahasa Indonesia",
      errorTitle: "This publication could not be loaded.",
      errorBody: "Please reload the page in a moment.",
      reload: "Reload",
    },
    files: {
      heading: "Documents",
      kinds: {
        preview: "Preview",
        full_document: "Full document",
        appendix: "Appendix",
        dataset: "Dataset",
        supplementary: "Supplementary material",
        other: "Other",
      },
      documentLanguage: "Document language",
      download: "Download PDF",
      previewNote: "Downloads become active once the publication is published.",
    },
    preview: {
      notice: "Draft preview: visitors may not see this version.",
      exit: "Exit preview",
    },
    notFound: {
      title: "Page not found",
      body: "The page you are looking for does not exist or is no longer available.",
      indexLink: "View all publications",
      homeLink: "Go to the homepage",
    },
  },
};

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}
