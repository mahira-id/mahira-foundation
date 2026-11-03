import { Logo } from "@/components/brand/mahira";
import { ArrowIcon } from "@/components/ui/icons";
import { navigation, topics } from "@/lib/landing-content";

export function Footer() {
  return (
    <footer className="on-dark border-t-2 border-orange bg-ink text-silver">
      <div className="container-editorial py-14 md:py-16">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <a className="inline-block" href="#beranda">
              <Logo className="h-8 w-auto" tone="silver" />
            </a>
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-silver">
              Riset, analisis kebijakan, dan pembelajaran untuk memahami
              persoalan pembangunan Indonesia dan mendorong perubahan yang
              berbasis bukti.
            </p>
            <p className="mt-6 text-[0.6875rem] font-bold uppercase tracking-[0.16em] text-silver">
              Situs dalam tahap pengembangan
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:col-span-7">
            <nav aria-label="Jelajahi">
              <h2 className="eyebrow text-silver">Jelajahi</h2>
              <ul className="mt-4 space-y-3">
                {navigation.map((item) => (
                  <li key={item.href}>
                    <a
                      className="text-sm text-silver transition-colors hover:text-white"
                      href={item.href}
                    >
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>

            <nav aria-label="Topik">
              <h2 className="eyebrow text-silver">Topik</h2>
              <ul className="mt-4 space-y-3">
                {topics.slice(0, 4).map((topic) => (
                  <li key={topic.index}>
                    <a
                      className="text-sm text-silver transition-colors hover:text-white"
                      href="#topik"
                    >
                      {topic.name}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>

            <div className="col-span-2 sm:col-span-1">
              <h2 className="eyebrow text-silver">Bahasa</h2>
              <p className="mt-4 flex flex-wrap items-center gap-2 text-sm">
                <span aria-current="true" className="text-white">
                  Indonesia
                </span>
                <span aria-hidden="true" className="text-white/35">
                  /
                </span>
                <span className="inline-flex items-baseline gap-1.5 text-silver/80" lang="en">
                  English
                  <span className="text-[0.625rem] uppercase tracking-[0.12em] text-silver/70">
                    segera
                  </span>
                </span>
              </p>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-white/15 pt-6 text-xs text-silver sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 Mahira Indonesia Development. Seluruh hak cipta.</p>
          <div className="flex items-center gap-5">
            <p>Riset · Kebijakan · Pembelajaran</p>
            <a
              className="inline-flex items-center gap-2 font-semibold text-white transition-colors hover:text-silver"
              href="#beranda"
            >
              Kembali ke atas
              <ArrowIcon className="h-3.5 w-3.5 -rotate-90" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
