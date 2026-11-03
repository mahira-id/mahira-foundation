export type AccessLevel = "public" | "registered" | "subscriber";
export type CoverTone = "blue" | "ink" | "green" | "silver";

export type Publication = {
  slug: string;
  title: string;
  coverTitle: string;
  type: string;
  topic: string;
  date: string;
  dateISO: string;
  authors: string;
  summary: string;
  access: AccessLevel;
  tone: CoverTone;
  issue: string;
};

export type Topic = {
  index: string;
  name: string;
  description: string;
};

export type LearningResource = {
  title: string;
  type: string;
  format: string;
};

export const navigation = [
  { label: "Beranda", href: "#beranda" },
  { label: "Publikasi", href: "#publikasi" },
  { label: "Learning Hub", href: "#learning" },
  { label: "Tentang", href: "#tentang" },
] as const;

/*
 * SAMPLE CONTENT — replace with Payload CMS records during Slice 1.
 * No counts, impact claims, or real people are represented here.
 */
export const leadPublication: Publication = {
  slug: "transisi-energi-yang-adil",
  title:
    "Transisi Energi yang Adil: Menakar Dampak Sosial Kebijakan Rendah Karbon",
  coverTitle: "Transisi Energi yang Adil",
  type: "Policy Brief",
  topic: "Energi & Iklim",
  date: "28 Okt 2026",
  dateISO: "2026-10-28",
  authors: "Tim Riset Energi & Iklim",
  summary:
    "Kebijakan rendah karbon sering dinilai dari target emisi, bukan dari siapa yang menanggung biayanya. Kajian ini memetakan dampak sosial transisi energi pada rumah tangga dan pekerja di sektor rentan, lalu mengusulkan empat jaminan kebijakan yang perlu hadir sejak tahap perencanaan.",
  access: "public",
  tone: "blue",
  issue: "PB 04/2026",
};

export const publications: Publication[] = [
  {
    slug: "tata-kelola-air-perkotaan",
    title: "Tata Kelola Air Perkotaan: Pelajaran dari Tiga Kota",
    coverTitle: "Tata Kelola Air Perkotaan",
    type: "Riset",
    topic: "Kota & Infrastruktur",
    date: "14 Okt 2026",
    dateISO: "2026-10-14",
    authors: "Tim Riset Kota & Infrastruktur",
    summary:
      "Studi ini membandingkan cara tiga kota mengelola pasokan, limbah, dan akses air. Temuan utamanya bukan pada teknologi, melainkan pada koordinasi antarlembaga dan kejelasan tanggung jawab di tingkat layanan.",
    access: "registered",
    tone: "silver",
    issue: "RS 07/2026",
  },
  {
    slug: "ekonomi-sirkular-pekerja-informal",
    title:
      "Ekonomi Sirkular dan Pekerja Informal: Celah dalam Rantai Nilai",
    coverTitle: "Ekonomi Sirkular & Pekerja Informal",
    type: "Working Paper",
    topic: "Ekonomi & Kesejahteraan",
    date: "30 Sep 2026",
    dateISO: "2026-09-30",
    authors: "Tim Riset Ekonomi & Kesejahteraan",
    summary:
      "Rantai nilai sirkular bergantung pada pekerja informal, tetapi kebijakan yang mendorong daur ulang jarang memasukkan kondisi kerja mereka. Paper ini memetakan celah perlindungan dan opsi kebijakan yang lebih inklusif.",
    access: "subscriber",
    tone: "ink",
    issue: "WP 03/2026",
  },
  {
    slug: "kesehatan-mental-remaja-ruang-digital",
    title: "Kesehatan Mental Remaja di Ruang Digital",
    coverTitle: "Kesehatan Mental Remaja",
    type: "Riset",
    topic: "Kesehatan & Sosial",
    date: "18 Sep 2026",
    dateISO: "2026-09-18",
    authors: "Tim Riset Kesehatan & Sosial",
    summary:
      "Ruang digital memberi remaja akses pada dukungan dan informasi, sekaligus menciptakan tekanan baru. Riset ini menelaah pengalaman remaja, peran sekolah, dan batas tanggung jawab platform.",
    access: "public",
    tone: "green",
    issue: "RS 06/2026",
  },
  {
    slug: "digitalisasi-layanan-publik",
    title: "Digitalisasi Layanan Publik: Siapa yang Tertinggal?",
    coverTitle: "Digitalisasi Layanan Publik",
    type: "Policy Brief",
    topic: "Digital & Teknologi",
    date: "02 Sep 2026",
    dateISO: "2026-09-02",
    authors: "Tim Riset Digital & Teknologi",
    summary:
      "Layanan publik yang berpindah ke kanal digital mempercepat proses bagi sebagian warga, tetapi dapat memperlebar jarak bagi kelompok yang kurang terhubung. Brief ini merangkum risiko tersebut dan prinsip desain layanan yang inklusif.",
    access: "registered",
    tone: "silver",
    issue: "PB 03/2026",
  },
];

export const topics: Topic[] = [
  {
    index: "01",
    name: "Energi & Iklim",
    description:
      "Transisi rendah karbon, keadilan energi, dan ketahanan masyarakat terhadap perubahan iklim.",
  },
  {
    index: "02",
    name: "Tata Kelola & Demokrasi",
    description:
      "Kualitas institusi, partisipasi publik, dan cara kebijakan dibentuk serta dipertanggungjawabkan.",
  },
  {
    index: "03",
    name: "Kota & Infrastruktur",
    description:
      "Layanan dasar, mobilitas, air, dan ruang kota yang mampu menampung kehidupan bersama.",
  },
  {
    index: "04",
    name: "Ekonomi & Kesejahteraan",
    description:
      "Pekerjaan layak, perlindungan sosial, dan distribusi manfaat pertumbuhan ekonomi.",
  },
  {
    index: "05",
    name: "Kesehatan & Sosial",
    description:
      "Akses layanan, kesehatan mental, dan faktor sosial yang membentuk kualitas hidup.",
  },
  {
    index: "06",
    name: "Digital & Teknologi",
    description:
      "Tata kelola data, layanan digital, dan dampak teknologi terhadap hak serta partisipasi warga.",
  },
];

export const learningFeature = {
  title: "Membaca Data Energi: Dasar Analisis untuk Kebijakan",
  coverTitle: "Membaca Data Energi",
  type: "Video",
  format: "Seri Literasi Data",
  issue: "LH 01/2026",
  description:
    "Pengantar membaca data energi, memahami satuan, dan menghubungkan temuan kuantitatif dengan pertanyaan kebijakan.",
};

export const learningResources: LearningResource[] = [
  {
    title: "Menulis Policy Brief yang Efektif",
    type: "Panduan",
    format: "6 modul",
  },
  {
    title: "Metode Riset Kualitatif untuk Isu Publik",
    type: "Kelas",
    format: "8 sesi",
  },
  {
    title: "Membaca Anggaran Publik tanpa Latar Belakang Akuntansi",
    type: "Video",
    format: "Seri Literasi Anggaran",
  },
];

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
      "Metadata dan ringkasan publikasi tetap dapat diakses publik, termasuk saat file penuh dibatasi.",
  },
  {
    index: "03",
    title: "Dibangun bersama",
    description:
      "Riset dan pembelajaran tumbuh melalui percakapan dengan praktisi, akademisi, dan komunitas.",
  },
];
