import { MahiraMark } from "@/components/brand/mahira";
import { AccessBadge } from "@/components/home/access-badge";
import { PublicationCover } from "@/components/home/publication-cover";
import { SectionHeader } from "@/components/home/section-header";
import { Footer } from "@/components/site/footer";
import { Header } from "@/components/site/header";
import { ArrowIcon, PlusIcon } from "@/components/ui/icons";
import {
  learningFeature,
  learningResources,
  leadPublication,
  principles,
  publications,
  topics,
} from "@/lib/landing-content";

export default function Home() {
  return (
    <>
      <Header />
      <main id="main">
        <section
          aria-labelledby="beranda-heading"
          className="on-dark relative overflow-hidden bg-brand-500 text-white"
          id="beranda"
        >
          <div
            aria-hidden="true"
            className="hero-grid pointer-events-none absolute inset-0 opacity-80"
          />
          <MahiraMark
            aria-hidden="true"
            className="pointer-events-none absolute -right-48 top-1/2 hidden h-[42rem] w-auto -translate-y-1/2 text-white/[0.045] lg:block"
          />

          <div className="container-editorial relative grid gap-12 pt-14 pb-16 sm:pt-16 sm:pb-20 lg:grid-cols-12 lg:gap-8 lg:pt-24 lg:pb-28">
            <div className="lg:col-span-7">
              <p className="eyebrow text-white">Mahira Indonesia Development</p>
              <h1
                className="mt-6 max-w-[13ch] text-[clamp(3.25rem,7.2vw,6.75rem)] font-extrabold leading-[0.92] tracking-[-0.045em] text-balance"
                id="beranda-heading"
              >
                Riset untuk <span className="text-silver">Indonesia</span> yang
                lebih adil.
              </h1>
              <p className="mt-8 max-w-xl text-base leading-relaxed text-white sm:text-lg">
                Kami menghubungkan riset, analisis kebijakan, dan pembelajaran
                untuk memahami persoalan pembangunan — dan mendorong perubahan
                yang berbasis bukti.
              </p>
              <div className="mt-10 flex flex-wrap gap-3">
                <a className="btn btn-light" href="#publikasi">
                  Jelajahi publikasi
                  <ArrowIcon className="h-3.5 w-3.5" />
                </a>
                <a className="btn btn-ghost-light" href="#tentang">
                  Tentang Mahira
                  <ArrowIcon className="h-3.5 w-3.5" />
                </a>
              </div>
              <div className="mt-12 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-white/25 pt-4 text-[0.6875rem] font-bold uppercase tracking-[0.16em] text-white">
                <span>Katalog 2026</span>
                <span
                  aria-hidden="true"
                  className="hidden h-1 w-1 rounded-full bg-white/50 sm:inline-block"
                />
                <span>Riset · Kebijakan · Pembelajaran</span>
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="relative mx-auto max-w-[17rem] sm:max-w-[21rem] lg:mr-0 lg:ml-auto lg:max-w-none">
                <div
                  aria-hidden="true"
                  className="publication-cover absolute top-5 left-0 hidden w-[84%] -rotate-3 opacity-90 sm:flex"
                  data-tone="silver"
                >
                  <span className="absolute inset-x-0 top-0 h-1 bg-orange" />
                  <span className="absolute top-6 left-3 text-[0.625rem] font-bold uppercase tracking-[0.16em] text-ink/40 [writing-mode:vertical-rl]">
                    Mahira · Publikasi 2026
                  </span>
                </div>
                <PublicationCover
                  className="relative mx-auto w-[88%] rotate-2 ring-1 ring-white/25 sm:mr-0 sm:ml-auto"
                  issue={leadPublication.issue}
                  title={leadPublication.coverTitle}
                  tone="ink"
                  topic={leadPublication.topic}
                  type={leadPublication.type}
                />
                <p className="mt-6 text-center text-[0.6875rem] font-bold uppercase tracking-[0.16em] text-white sm:text-right">
                  Publikasi terbaru · 2026
                </p>
              </div>
            </div>
          </div>

          <div className="relative h-1 bg-brand-700">
            <span className="absolute inset-y-0 left-0 w-24 bg-orange" />
          </div>
        </section>

        <section
          aria-labelledby="publikasi-heading"
          className="bg-white pt-20 pb-16 md:pt-28 md:pb-20"
          id="publikasi"
        >
          <div className="container-editorial">
            <SectionHeader
              action={
                <a
                  className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-brand-700 transition-colors hover:text-brand-900"
                  href="#indeks-publikasi"
                >
                  Lihat indeks
                  <ArrowIcon className="h-3.5 w-3.5" />
                </a>
              }
              description="Publikasi yang menghubungkan temuan riset dengan pilihan kebijakan yang dapat diuji dan didiskusikan."
              id="publikasi-heading"
              index="01"
              label="Publikasi"
              title="Riset yang sedang menjadi perhatian."
            />

            <div className="mt-10 grid gap-10 lg:mt-12 lg:grid-cols-12 lg:items-start lg:gap-12">
              <div className="lg:col-span-5">
                <PublicationCover
                  className="mx-auto w-full max-w-[24rem] lg:mx-0 lg:max-w-none"
                  issue={leadPublication.issue}
                  title={leadPublication.coverTitle}
                  tone={leadPublication.tone}
                  topic={leadPublication.topic}
                  type={leadPublication.type}
                />
              </div>

              <div className="lg:col-span-7">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="eyebrow text-brand-700">
                    {leadPublication.type}
                  </span>
                  <span aria-hidden="true" className="h-1 w-1 rounded-full bg-dark-silver" />
                  <span className="text-sm font-medium text-muted">
                    {leadPublication.topic}
                  </span>
                  <span aria-hidden="true" className="h-1 w-1 rounded-full bg-dark-silver" />
                  <time className="text-sm text-muted" dateTime={leadPublication.dateISO}>
                    {leadPublication.date}
                  </time>
                </div>

                <h3 className="mt-6 text-[clamp(1.75rem,3vw,2.75rem)] font-bold leading-[1.08] tracking-[-0.03em] text-ink">
                  {leadPublication.title}
                </h3>
                <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted">
                  {leadPublication.summary}
                </p>

                <dl className="mt-8 grid grid-cols-2 gap-x-6 gap-y-5 border-y border-line py-5">
                  <div>
                    <dt className="eyebrow text-muted">Penulis</dt>
                    <dd className="mt-2 text-sm font-semibold text-ink">
                      {leadPublication.authors}
                    </dd>
                  </div>
                  <div>
                    <dt className="eyebrow text-muted">Terbit</dt>
                    <dd className="mt-2 text-sm font-semibold text-ink">
                      <time dateTime={leadPublication.dateISO}>
                        {leadPublication.date}
                      </time>
                    </dd>
                  </div>
                  <div>
                    <dt className="eyebrow text-muted">Topik</dt>
                    <dd className="mt-2 text-sm font-semibold text-ink">
                      {leadPublication.topic}
                    </dd>
                  </div>
                  <div>
                    <dt className="eyebrow text-muted">Akses</dt>
                    <dd className="mt-2">
                      <AccessBadge level={leadPublication.access} />
                    </dd>
                  </div>
                </dl>

                <div className="mt-8">
                  <a className="btn btn-primary" href="#indeks-publikasi">
                    Lihat indeks publikasi
                    <ArrowIcon className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section
          aria-labelledby="indeks-publikasi-heading"
          className="bg-white pb-20 md:pb-28"
          id="indeks-publikasi"
        >
          <div className="container-editorial">
            <SectionHeader
              action={
                <span className="text-[0.6875rem] font-bold uppercase tracking-[0.14em] text-muted">
                  Klik baris untuk ringkasan
                </span>
              }
              description="Indeks publikasi terbaru. Ringkasan tetap terbuka; akses ke file penuh mengikuti status akun dan langganan."
              id="indeks-publikasi-heading"
              index="02"
              label="Indeks"
              title="Publikasi terbaru."
            />

            <div className="mt-2">
              {publications.map((publication, index) => (
                <details className="publication-row border-b border-line" key={publication.slug}>
                  <summary className="group grid cursor-pointer gap-3 rounded-sm px-1 py-5 transition-colors hover:bg-silver/60 md:grid-cols-12 md:items-center md:gap-6 md:px-3 md:py-6">
                    <span className="text-xs font-bold tabular-nums text-muted md:col-span-1">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="flex flex-wrap items-center gap-2 text-[0.6875rem] font-bold uppercase tracking-[0.14em] text-muted md:col-span-2">
                      <time dateTime={publication.dateISO}>{publication.date}</time>
                      <span aria-hidden="true" className="h-1 w-1 rounded-full bg-dark-silver" />
                      <span>{publication.type}</span>
                    </span>
                    <div className="md:col-span-6">
                      <h3 className="text-lg font-bold leading-tight tracking-[-0.02em] text-ink transition-colors group-hover:text-brand-700 md:text-xl">
                        {publication.title}
                      </h3>
                      <span className="mt-1 block text-sm text-muted">
                        {publication.authors}
                      </span>
                    </div>
                    <span className="flex items-center justify-between gap-4 md:col-span-3 md:justify-end">
                      <AccessBadge level={publication.access} />
                      <span className="row-icon inline-flex h-8 w-8 items-center justify-center rounded-sm border border-line text-ink">
                        <PlusIcon className="h-4 w-4" />
                      </span>
                    </span>
                  </summary>
                  <div className="px-1 pb-6 md:grid md:grid-cols-12 md:px-3">
                    <p className="max-w-2xl text-sm leading-relaxed text-muted md:col-span-9 md:col-start-4">
                      {publication.summary}
                    </p>
                  </div>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section
          aria-labelledby="topik-heading"
          className="section-space bg-silver"
          id="topik"
        >
          <div className="container-editorial">
            <SectionHeader
              description="Enam bidang kerja yang menjadi pintu masuk untuk membaca publikasi dan materi pembelajaran."
              id="topik-heading"
              index="03"
              label="Bidang kerja"
              title="Persoalan yang kami kerjakan."
            />

            <div className="mt-10 grid gap-x-10 md:grid-cols-2">
              {topics.map((topic) => (
                <a
                  className="group flex items-start justify-between gap-6 border-t border-line py-5 transition-colors hover:border-orange"
                  href="#indeks-publikasi"
                  key={topic.index}
                >
                  <span className="flex gap-5">
                    <span className="pt-1 text-xs font-bold tabular-nums text-brand-700">
                      {topic.index}
                    </span>
                    <span>
                      <span className="block text-lg font-bold tracking-[-0.02em] text-ink transition-colors group-hover:text-brand-700">
                        {topic.name}
                      </span>
                      <span className="mt-1 block max-w-sm text-sm leading-relaxed text-muted">
                        {topic.description}
                      </span>
                    </span>
                  </span>
                  <ArrowIcon className="mt-1 h-4 w-4 shrink-0 text-muted transition-transform group-hover:translate-x-1 group-hover:text-brand-700" />
                </a>
              ))}
            </div>
          </div>
        </section>

        <section
          aria-labelledby="learning-heading"
          className="section-space bg-white"
          id="learning"
        >
          <div className="container-editorial">
            <SectionHeader
              action={
                <span className="text-[0.6875rem] font-bold uppercase tracking-[0.14em] text-muted">
                  Video · Panduan · Kelas
                </span>
              }
              description="Materi pembelajaran yang menghubungkan konsep, data, dan praktik kebijakan publik."
              id="learning-heading"
              index="04"
              label="Learning Hub"
              title="Belajar dari riset."
            />

            <div className="mt-10 grid gap-10 lg:grid-cols-12 lg:gap-12">
              <div className="lg:col-span-7">
                <PublicationCover
                  className="aspect-[16/10] w-full max-w-[34rem]"
                  issue={learningFeature.issue}
                  title={learningFeature.coverTitle}
                  tone="green"
                  topic={learningFeature.format}
                  type={learningFeature.type}
                />
                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <span className="eyebrow text-green">{learningFeature.type}</span>
                  <span aria-hidden="true" className="h-1 w-1 rounded-full bg-dark-silver" />
                  <span className="text-sm text-muted">{learningFeature.format}</span>
                </div>
                <h3 className="mt-3 text-2xl font-bold tracking-[-0.025em] text-ink">
                  {learningFeature.title}
                </h3>
                <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">
                  {learningFeature.description}
                </p>
              </div>

              <div className="lg:col-span-5">
                <p className="eyebrow text-green">Materi lain</p>
                <ul className="mt-4 border-t border-line">
                  {learningResources.map((resource, index) => (
                    <li className="border-b border-line py-5" key={resource.title}>
                      <div className="flex items-start gap-4">
                        <span className="pt-1 text-xs font-bold tabular-nums text-green">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <div>
                          <div className="flex flex-wrap items-center gap-2 text-[0.6875rem] font-bold uppercase tracking-[0.14em] text-muted">
                            <span>{resource.type}</span>
                            <span aria-hidden="true" className="h-1 w-1 rounded-full bg-dark-silver" />
                            <span>{resource.format}</span>
                          </div>
                          <h3 className="mt-2 text-lg font-bold leading-snug tracking-[-0.02em] text-ink">
                            {resource.title}
                          </h3>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section
          aria-labelledby="tentang-heading"
          className="on-dark relative overflow-hidden bg-ink text-white"
          id="tentang"
        >
          <MahiraMark
            aria-hidden="true"
            className="pointer-events-none absolute -right-32 -bottom-24 h-[30rem] w-auto text-white/[0.04]"
          />
          <div className="container-editorial section-space relative">
            <div className="grid gap-8 lg:grid-cols-12">
              <div className="lg:col-span-3">
                <p className="eyebrow text-silver">05 / Tentang</p>
              </div>
              <div className="lg:col-span-9">
                <span aria-hidden="true" className="block h-0.5 w-16 bg-orange" />
                <h2
                  className="mt-6 max-w-4xl text-[clamp(2rem,4.4vw,4rem)] font-bold leading-[1.02] tracking-[-0.04em] text-white"
                  id="tentang-heading"
                >
                  Pengetahuan yang baik lahir dari pertanyaan yang tepat.
                </h2>

                <div className="mt-10 grid gap-10 md:grid-cols-2 md:gap-14">
                  <div>
                    <div className="space-y-5 text-base leading-relaxed text-silver">
                      <p>
                        Mahira Indonesia Development adalah ruang bagi riset,
                        analisis kebijakan, dan pembelajaran yang menghubungkan
                        bukti dengan praktik. Kami bekerja bersama peneliti,
                        praktisi, dan komunitas untuk menghasilkan pengetahuan
                        yang dapat digunakan publik.
                      </p>
                      <p>
                        Fokus kami adalah memperluas akses pada pengetahuan yang
                        jernih, terstruktur, dan relevan dengan persoalan
                        pembangunan Indonesia.
                      </p>
                    </div>
                    <a className="btn btn-light mt-8" href="#publikasi">
                      Jelajahi publikasi
                      <ArrowIcon className="h-3.5 w-3.5" />
                    </a>
                  </div>

                  <div>
                    <h3 className="eyebrow text-silver">Prinsip kerja</h3>
                    <ol className="mt-4 border-y border-white/15">
                      {principles.map((principle) => (
                        <li
                          className="grid grid-cols-[2rem_1fr] gap-4 border-b border-white/15 py-4 last:border-b-0"
                          key={principle.index}
                        >
                          <span className="pt-1 text-xs font-bold tabular-nums text-orange">
                            {principle.index}
                          </span>
                          <span>
                            <span className="block text-base font-bold text-white">
                              {principle.title}
                            </span>
                            <span className="mt-1 block text-sm leading-relaxed text-silver">
                              {principle.description}
                            </span>
                          </span>
                        </li>
                      ))}
                    </ol>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section
          aria-labelledby="bergabung-heading"
          className="bg-silver"
          id="bergabung"
        >
          <div className="container-editorial py-16 md:py-20">
            <div className="grid gap-8 lg:grid-cols-12 lg:items-end">
              <div className="lg:col-span-8">
                <p className="eyebrow text-brand-700">Mulai dari sini</p>
                <h2
                  className="mt-4 max-w-4xl text-[clamp(2rem,4vw,3.5rem)] font-bold leading-[1.02] tracking-[-0.035em] text-ink"
                  id="bergabung-heading"
                >
                  Dari riset ke perubahan.
                </h2>
                <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted">
                  Temukan publikasi terbaru, ikuti materi pembelajaran, atau
                  kenali cara kami bekerja.
                </p>
              </div>
              <div className="flex flex-wrap gap-3 lg:col-span-4 lg:justify-end">
                <a className="btn btn-primary" href="#publikasi">
                  Jelajahi publikasi
                  <ArrowIcon className="h-3.5 w-3.5" />
                </a>
                <a className="btn btn-outline-dark" href="#tentang">
                  Tentang Mahira
                  <ArrowIcon className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
