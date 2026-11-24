import type { AuthPage, AuthStatus } from "@/lib/auth/routes";
import type { Locale } from "./locales";

/** Status messages of one account page: one text for every status of lib/auth/routes.ts. */
type AccountStatusTexts<P extends AuthPage> = Record<AuthStatus<P>, string>;

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
    /** Link text of a `registered` file row (M5-04, DECISIONS §2.19 decision 4); the same for every visitor. */
    downloadRegistered: string;
    /** Note of the staff draft preview, where files have no link. */
    previewNote: string;
  };
  /** Staff draft preview banner (DECISIONS §2.11 P11 A). */
  preview: {
    notice: string;
    exit: string;
  };
  /** About page `/{locale}/about` (M3-09, DECISIONS §2.15); its content comes from the CMS. */
  about: {
    /** Header link label (decision 5). */
    navLabel: string;
    /** Error state of a failed read (with detail.errorBody and detail.reload). */
    errorTitle: string;
  };
  /**
   * Learning Hub `/{locale}/learning-hub` (M3-11/12, DECISIONS §2.16): UI
   * labels only; the H1, intro and every resource text come from the CMS.
   */
  learningHub: {
    /** Header, footer and homepage link label (decision 11A). */
    navLabel: string;
    /** Error state of a failed read (with detail.errorBody and detail.reload). */
    errorTitle: string;
    /** Heading of the toolkit section (decision 10A; hidden while empty, until M3-13). */
    toolkitHeading: string;
    /** Type label of a card. */
    types: Record<"video" | "playlist" | "guide" | "toolkit", string>;
    /** "Bahasa materi" label of a card or guide, by the material's language (decision 5A). */
    materialLanguage: Record<Locale, string>;
    /** Link to the video or playlist on youtube.com (decision 8A). */
    watch: string;
    /** Accessible name of the play button of the click-to-load facade, with the resource title. */
    play: (title: string) => string;
    /** Link of a guide card to its page. */
    read: string;
    /** Link of a toolkit card (catalog, homepage) to its page (M3-13). */
    readToolkit: string;
    /** PDF · N file on a toolkit card (M3-13, DECISIONS §2.17 decision 6A). */
    fileCount: (count: number) => string;
    /** Note of a toolkit's staff draft preview, where its files have no link. */
    filesPreviewNote: string;
    /** The catalog link in a guide page's breadcrumb. */
    backToCatalog: string;
    /** Link to the catalog under the homepage block (decision 11A). */
    viewAll: string;
  };
  /**
   * Public accounts (M5-02, DECISIONS §2.18 decisions 9, 13, 14): the pages
   * `/{locale}/{login,register,forgot-password,reset-password,account}`.
   * Messages are generic: none says whether an email has an account.
   */
  account: {
    /** Header link label (decision 13: one neutral link, no login state). */
    navLabel: string;
    titles: Record<AuthPage, string>;
    intros: Record<AuthPage, string>;
    fields: {
      email: string;
      password: string;
      passwordConfirm: string;
      currentPassword: string;
      newPassword: string;
      newPasswordConfirm: string;
      /** Hint under every new-password field. */
      passwordHint: string;
    };
    buttons: {
      login: string;
      register: string;
      forgotPassword: string;
      resetPassword: string;
      changePassword: string;
      logout: string;
    };
    links: {
      toRegister: string;
      toLogin: string;
      toForgotPassword: string;
    };
    /** Privacy note of the registration form (decision 9); a draft, not yet reviewed by legal. */
    privacy: { heading: string; body: string; draft: string };
    /** Account page: facts and sections. */
    details: {
      heading: string;
      email: string;
      verification: string;
      verified: string;
      notVerified: string;
      access: string;
      accessRegistered: string;
      changePasswordHeading: string;
      logoutHeading: string;
    };
    /** Account page without a valid session. */
    sessionEnded: { title: string; body: string; login: string };
    /** Fallback of the account page while the session is read. */
    loading: string;
    statuses: {
      login: AccountStatusTexts<"login">;
      register: AccountStatusTexts<"register">;
      "forgot-password": AccountStatusTexts<"forgot-password">;
      "reset-password": AccountStatusTexts<"reset-password">;
      account: AccountStatusTexts<"account">;
    };
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
      downloadRegistered: "Unduh PDF (perlu akun)",
      previewNote: "Unduhan aktif setelah publikasi diterbitkan.",
    },
    preview: {
      notice: "Pratinjau draf: belum tentu terlihat pengunjung.",
      exit: "Keluar dari pratinjau",
    },
    about: {
      navLabel: "Tentang",
      errorTitle: "Halaman ini belum dapat dimuat.",
    },
    learningHub: {
      navLabel: "Learning Hub",
      errorTitle: "Learning Hub belum dapat dimuat.",
      toolkitHeading: "Toolkit",
      types: { video: "Video", playlist: "Playlist", guide: "Panduan", toolkit: "Toolkit" },
      materialLanguage: { id: "Berbahasa Indonesia", en: "Berbahasa Inggris" },
      watch: "Tonton di YouTube",
      play: (title) => `Putar: ${title}`,
      read: "Baca panduan",
      readToolkit: "Lihat toolkit",
      fileCount: (count) => `PDF · ${count} file`,
      filesPreviewNote: "Unduhan aktif setelah diterbitkan.",
      backToCatalog: "Learning Hub",
      viewAll: "Lihat semua materi",
    },
    account: {
      navLabel: "Akun",
      titles: {
        login: "Masuk",
        register: "Daftar akun",
        "forgot-password": "Lupa password",
        "reset-password": "Atur password baru",
        account: "Akun Anda",
      },
      intros: {
        login: "Masuk dengan email dan password akun Anda.",
        register: "Buat akun dengan email dan password. Kami mengirim tautan verifikasi ke email itu.",
        "forgot-password": "Masukkan email akun Anda. Kami mengirim tautan untuk mengatur ulang password.",
        "reset-password": "Pilih password baru untuk akun Anda.",
        account: "Data akun dan pengaturan dasar.",
      },
      fields: {
        email: "Email",
        password: "Password",
        passwordConfirm: "Ulangi password",
        currentPassword: "Password saat ini",
        newPassword: "Password baru",
        newPasswordConfirm: "Ulangi password baru",
        passwordHint: "8 sampai 72 karakter.",
      },
      buttons: {
        login: "Masuk",
        register: "Daftar akun",
        forgotPassword: "Kirim tautan atur ulang",
        resetPassword: "Simpan password baru",
        changePassword: "Ganti password",
        logout: "Keluar",
      },
      links: {
        toRegister: "Belum punya akun? Daftar akun",
        toLogin: "Sudah punya akun? Masuk",
        toForgotPassword: "Lupa password?",
      },
      privacy: {
        heading: "Data yang kami kumpulkan",
        body: "Kami mengumpulkan alamat email Anda. Data ini dipakai untuk akun dan untuk mengunduh dokumen yang memerlukan akun.",
        draft: "Teks ini draf dan belum ditinjau hukum.",
      },
      details: {
        heading: "Data akun",
        email: "Email",
        verification: "Verifikasi email",
        verified: "Terverifikasi",
        notVerified: "Belum terverifikasi",
        access: "Tingkat akses",
        accessRegistered: "Terdaftar",
        changePasswordHeading: "Ganti password",
        logoutHeading: "Keluar dari akun",
      },
      sessionEnded: {
        title: "Sesi Anda berakhir",
        body: "Masuk kembali untuk melihat akun Anda.",
        login: "Masuk",
      },
      loading: "Memuat akun…",
      statuses: {
        login: {
          invalid: "Email atau password tidak cocok, atau email belum diverifikasi. Periksa kembali lalu coba lagi.",
          "rate-limited": "Terlalu banyak percobaan. Tunggu beberapa menit lalu coba lagi.",
          error: "Layanan akun belum dapat dihubungi. Coba lagi beberapa saat lagi.",
          "signed-out": "Anda sudah keluar.",
          "session-ended": "Sesi Anda berakhir. Masuk kembali untuk melanjutkan.",
          "link-invalid": "Tautan tidak valid atau sudah kedaluwarsa. Masuk, atau minta tautan baru lewat \"Lupa password\".",
          "invalid-input": "Isi email yang valid dan password 8 sampai 72 karakter.",
        },
        register: {
          "check-email":
            "Periksa kotak masuk email Anda. Bila email itu dapat didaftarkan, kami mengirim tautan verifikasi; klik tautan itu untuk mengaktifkan akun.",
          "invalid-input": "Isi email yang valid dan password 8 sampai 72 karakter.",
          "password-mismatch": "Password dan ulangan password tidak sama.",
          "weak-password": "Password terlalu lemah. Pilih password lain yang lebih sulit ditebak.",
          "rate-limited": "Terlalu banyak percobaan. Tunggu beberapa menit lalu coba lagi.",
          error: "Layanan akun belum dapat dihubungi. Coba lagi beberapa saat lagi.",
        },
        "forgot-password": {
          "check-email": "Periksa kotak masuk email Anda. Bila email itu terdaftar, kami mengirim tautan untuk mengatur ulang password.",
          "invalid-input": "Isi alamat email yang valid.",
          "rate-limited": "Terlalu banyak percobaan. Tunggu beberapa menit lalu coba lagi.",
          error: "Layanan akun belum dapat dihubungi. Coba lagi beberapa saat lagi.",
          "link-invalid": "Tautan atur ulang password tidak valid atau sudah kedaluwarsa. Minta tautan baru di bawah ini.",
        },
        "reset-password": {
          "invalid-input": "Password baru harus 8 sampai 72 karakter.",
          "password-mismatch": "Password dan ulangan password tidak sama.",
          "weak-password": "Password terlalu lemah. Pilih password lain yang lebih sulit ditebak.",
          "same-password": "Password baru harus berbeda dari password lama.",
          error: "Password belum dapat disimpan. Coba lagi, atau minta tautan baru lewat \"Lupa password\".",
        },
        account: {
          "email-confirmed": "Email Anda terverifikasi. Akun Anda aktif.",
          "password-changed": "Password sudah diganti.",
          "invalid-current": "Password saat ini tidak cocok.",
          "invalid-input": "Isi password saat ini dan password baru 8 sampai 72 karakter.",
          "password-mismatch": "Password baru dan ulangannya tidak sama.",
          "weak-password": "Password baru terlalu lemah. Pilih password lain yang lebih sulit ditebak.",
          "same-password": "Password baru harus berbeda dari password lama.",
          error: "Password belum dapat diganti. Coba lagi beberapa saat lagi.",
        },
      },
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
      downloadRegistered: "Download PDF (account required)",
      previewNote: "Downloads become active once the publication is published.",
    },
    preview: {
      notice: "Draft preview: visitors may not see this version.",
      exit: "Exit preview",
    },
    about: {
      navLabel: "About",
      errorTitle: "This page could not be loaded.",
    },
    learningHub: {
      navLabel: "Learning Hub",
      errorTitle: "The Learning Hub could not be loaded.",
      toolkitHeading: "Toolkit",
      types: { video: "Video", playlist: "Playlist", guide: "Guide", toolkit: "Toolkit" },
      materialLanguage: { id: "In Indonesian", en: "In English" },
      watch: "Watch on YouTube",
      play: (title) => `Play: ${title}`,
      read: "Read the guide",
      readToolkit: "View the toolkit",
      fileCount: (count) => (count === 1 ? `PDF · 1 file` : `PDF · ${count} files`),
      filesPreviewNote: "Downloads become active once published.",
      backToCatalog: "Learning Hub",
      viewAll: "View all resources",
    },
    account: {
      navLabel: "Account",
      titles: {
        login: "Sign in",
        register: "Create an account",
        "forgot-password": "Forgot password",
        "reset-password": "Set a new password",
        account: "Your account",
      },
      intros: {
        login: "Sign in with the email and password of your account.",
        register: "Create an account with an email and a password. We send a verification link to that email.",
        "forgot-password": "Enter the email of your account. We send a link to reset your password.",
        "reset-password": "Choose a new password for your account.",
        account: "Your account details and basic settings.",
      },
      fields: {
        email: "Email",
        password: "Password",
        passwordConfirm: "Repeat password",
        currentPassword: "Current password",
        newPassword: "New password",
        newPasswordConfirm: "Repeat new password",
        passwordHint: "8 to 72 characters.",
      },
      buttons: {
        login: "Sign in",
        register: "Create account",
        forgotPassword: "Send reset link",
        resetPassword: "Save new password",
        changePassword: "Change password",
        logout: "Sign out",
      },
      links: {
        toRegister: "No account yet? Create an account",
        toLogin: "Already have an account? Sign in",
        toForgotPassword: "Forgot password?",
      },
      privacy: {
        heading: "Data we collect",
        body: "We collect your email address. We use it for your account and for downloading documents that need an account.",
        draft: "This text is a draft and has not been reviewed by legal.",
      },
      details: {
        heading: "Account details",
        email: "Email",
        verification: "Email verification",
        verified: "Verified",
        notVerified: "Not verified",
        access: "Access level",
        accessRegistered: "Registered",
        changePasswordHeading: "Change password",
        logoutHeading: "Sign out",
      },
      sessionEnded: {
        title: "Your session has ended",
        body: "Sign in again to see your account.",
        login: "Sign in",
      },
      loading: "Loading your account…",
      statuses: {
        login: {
          invalid: "The email and password do not match, or the email is not verified. Check them and try again.",
          "rate-limited": "Too many attempts. Wait a few minutes and try again.",
          error: "The account service cannot be reached. Please try again in a moment.",
          "signed-out": "You have signed out.",
          "session-ended": "Your session has ended. Sign in again to continue.",
          "link-invalid": "The link is invalid or has expired. Sign in, or ask for a new link with \"Forgot password\".",
          "invalid-input": "Enter a valid email and a password of 8 to 72 characters.",
        },
        register: {
          "check-email":
            "Check your inbox. If that email can be registered, we have sent a verification link; click it to activate the account.",
          "invalid-input": "Enter a valid email and a password of 8 to 72 characters.",
          "password-mismatch": "The password and its repeat do not match.",
          "weak-password": "That password is too weak. Choose one that is harder to guess.",
          "rate-limited": "Too many attempts. Wait a few minutes and try again.",
          error: "The account service cannot be reached. Please try again in a moment.",
        },
        "forgot-password": {
          "check-email": "Check your inbox. If that email has an account, we have sent a link to reset the password.",
          "invalid-input": "Enter a valid email address.",
          "rate-limited": "Too many attempts. Wait a few minutes and try again.",
          error: "The account service cannot be reached. Please try again in a moment.",
          "link-invalid": "The reset link is invalid or has expired. Ask for a new link below.",
        },
        "reset-password": {
          "invalid-input": "The new password must be 8 to 72 characters.",
          "password-mismatch": "The password and its repeat do not match.",
          "weak-password": "That password is too weak. Choose one that is harder to guess.",
          "same-password": "The new password must differ from the old one.",
          error: "The password could not be saved. Try again, or ask for a new link with \"Forgot password\".",
        },
        account: {
          "email-confirmed": "Your email is verified. Your account is active.",
          "password-changed": "Your password has been changed.",
          "invalid-current": "The current password does not match.",
          "invalid-input": "Enter your current password and a new password of 8 to 72 characters.",
          "password-mismatch": "The new password and its repeat do not match.",
          "weak-password": "The new password is too weak. Choose one that is harder to guess.",
          "same-password": "The new password must differ from the old one.",
          error: "The password could not be changed. Please try again in a moment.",
        },
      },
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
