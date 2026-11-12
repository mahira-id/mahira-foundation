import { connection } from "next/server";
import { Suspense } from "react";

import { MahiraMark } from "@/components/brand/mahira";
import { HeroCover } from "@/components/home/hero-cover";
import { LatestPublications } from "@/components/home/latest-publications";
import { PublicationLead } from "@/components/home/publication-lead";
import { SectionHeader } from "@/components/home/section-header";
import { TopicIndex } from "@/components/home/topic-index";
import { Footer } from "@/components/site/footer";
import { Header } from "@/components/site/header";
import { ArrowIcon } from "@/components/ui/icons";
import { getHomepageData } from "@/lib/cms/public-content";
import { planHomepage, type HomepagePlan } from "@/lib/home/homepage-view";
import { principles } from "@/lib/landing-content";
import { isCmsEnabled } from "@/payload/env";

/**
 * Homepage `/` (M3-04, DECISIONS §2.7). Hero, Tentang, principles and the
 * closing CTA are static approved copy; the lead, the index and "Bidang
 * kerja" come from the CMS at request time when it is on (P1 A, P3 A). With
 * the CMS off the page is fully static and shows the empty notice.
 */
export default function Home() {
  const cmsOn = isCmsEnabled();

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
                <span>Riset · Kebijakan · Pembelajaran</span>
              </div>
            </div>

            <div className="lg:col-span-5">
              {cmsOn ? (
                <Suspense fallback={<HeroCover lead={null} />}>
                  <HomeHeroCover />
                </Suspense>
              ) : (
                <HeroCover lead={null} />
              )}
            </div>
          </div>

          <div className="relative h-1 bg-brand-700">
            <span className="absolute inset-y-0 left-0 w-24 bg-orange" />
          </div>
        </section>

        {cmsOn ? (
          <Suspense fallback={<PublicationsLoading />}>
            <HomeCmsSections />
          </Suspense>
        ) : (
          <HomeSections plan={planHomepage({ status: "off" })} />
        )}

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
                <p className="eyebrow text-silver">Tentang</p>
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
                  Temukan publikasi terbaru atau kenali cara kami bekerja.
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

async function HomeHeroCover() {
  // Request-time data (DECISIONS §2.6 P3 A): keeps the CMS query out of the build prerender.
  await connection();
  return <HeroCover lead={planHomepage(await getHomepageData()).lead} />;
}

async function HomeCmsSections() {
  await connection();
  return <HomeSections plan={planHomepage(await getHomepageData())} />;
}

const NOTICE_TEXT = {
  empty: "Belum ada publikasi yang terbit. Publikasi akan tampil di sini setelah diterbitkan.",
  error: "Publikasi belum dapat dimuat. Coba muat ulang halaman beberapa saat lagi.",
} as const;

function PublicationsHeader({ withIndexLink }: { withIndexLink: boolean }) {
  return (
    <SectionHeader
      action={
        withIndexLink ? (
          <a
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-brand-700 transition-colors hover:text-brand-900"
            href="#indeks-publikasi"
          >
            Lihat indeks
            <ArrowIcon className="h-3.5 w-3.5" />
          </a>
        ) : undefined
      }
      description="Publikasi yang menghubungkan temuan riset dengan pilihan kebijakan yang dapat diuji dan didiskusikan."
      id="publikasi-heading"
      label="Publikasi"
      title="Riset yang sedang menjadi perhatian."
    />
  );
}

function PublicationsLoading() {
  return (
    <section
      aria-labelledby="publikasi-heading"
      className="bg-white pt-20 pb-16 md:pt-28 md:pb-20"
      id="publikasi"
    >
      <div className="container-editorial">
        <PublicationsHeader withIndexLink={false} />
        <div className="mt-10 grid lg:grid-cols-12 lg:gap-8">
          <p className="text-base text-muted lg:col-span-9 lg:col-start-4" role="status">
            Memuat publikasi…
          </p>
        </div>
      </div>
    </section>
  );
}

function HomeSections({ plan }: { plan: HomepagePlan }) {
  return (
    <>
      <section
        aria-labelledby="publikasi-heading"
        className="bg-white pt-20 pb-16 md:pt-28 md:pb-20"
        id="publikasi"
      >
        <div className="container-editorial">
          <PublicationsHeader withIndexLink={plan.latest.length > 0} />
          {plan.notice ? (
            <div className="mt-10 grid lg:grid-cols-12 lg:gap-8">
              <p
                className="max-w-2xl text-base leading-relaxed text-muted lg:col-span-9 lg:col-start-4"
                data-home-notice={plan.notice}
              >
                {NOTICE_TEXT[plan.notice]}
              </p>
            </div>
          ) : plan.lead ? (
            <PublicationLead publication={plan.lead} />
          ) : null}
        </div>
      </section>

      {plan.latest.length > 0 ? (
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
              description="Publikasi terbaru dalam Bahasa Indonesia. Buka baris untuk membaca ringkasannya."
              id="indeks-publikasi-heading"
              label="Indeks"
              title="Publikasi terbaru."
            />
            <LatestPublications items={plan.latest} />
          </div>
        </section>
      ) : null}

      {plan.topics.length > 0 ? (
        <section
          aria-labelledby="topik-heading"
          className="section-space bg-silver"
          id="topik"
        >
          <div className="container-editorial">
            <SectionHeader
              description="Bidang kerja yang menjadi pintu masuk untuk membaca publikasi."
              id="topik-heading"
              label="Bidang kerja"
              title="Persoalan yang kami kerjakan."
            />
            <TopicIndex topics={plan.topics} />
          </div>
        </section>
      ) : null}
    </>
  );
}
