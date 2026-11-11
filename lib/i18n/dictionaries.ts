import type { Locale } from "./locales";

/** UI strings of the locale-prefixed pages. Both locales are complete. */
export type Dictionary = {
  skipLink: string;
  homeLinkLabel: string;
  languageSwitcherLabel: string;
  languageNames: Record<Locale, string>;
  publications: {
    title: string;
    loading: string;
    empty: string;
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
      loading: "Memuat publikasi…",
      empty: "Belum ada publikasi yang terbit dalam Bahasa Indonesia.",
    },
  },
  en: {
    skipLink: "Skip to content",
    homeLinkLabel: "Mahira Indonesia Development home",
    languageSwitcherLabel: "Choose language",
    languageNames: { id: "Bahasa Indonesia", en: "English" },
    publications: {
      title: "Publications",
      loading: "Loading publications…",
      empty: "No publications have been published in English yet.",
    },
  },
};

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}
