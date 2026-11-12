import { PublicationCover } from "@/components/home/publication-cover";
import type { HomePublication } from "@/lib/home/homepage-view";

const coverClassName = "relative mx-auto w-[88%] rotate-2 ring-1 ring-white/25 sm:mr-0 sm:ml-auto";

/**
 * Hero cover (DECISIONS §2.7 P2b (i), P8.4, P8.5): the lead publication's
 * typographic cover, or a brand cover without a publication title. The year
 * caption shows only for a lead with a publication date.
 */
export function HeroCover({ lead }: { lead: HomePublication | null }) {
  return (
    <div className="relative mx-auto max-w-[17rem] sm:max-w-[21rem] lg:mr-0 lg:ml-auto lg:max-w-none">
      <div
        aria-hidden="true"
        className="publication-cover absolute top-5 left-0 hidden w-[84%] -rotate-3 opacity-90 sm:flex"
        data-tone="silver"
      >
        <span className="absolute inset-x-0 top-0 h-1 bg-orange" />
        <span className="absolute top-6 left-3 text-[0.625rem] font-bold uppercase tracking-[0.16em] text-ink/40 [writing-mode:vertical-rl]">
          Mahira · Publikasi
        </span>
      </div>
      {lead ? (
        <PublicationCover
          className={coverClassName}
          title={lead.title}
          tone="ink"
          topic={lead.topicName}
          type={lead.typeName}
          year={lead.year}
        />
      ) : (
        <PublicationCover
          className={coverClassName}
          title="Mahira Indonesia Development"
          tone="ink"
          topic="Riset · Kebijakan · Pembelajaran"
          type="Publikasi"
        />
      )}
      {lead?.year ? (
        <p className="mt-6 text-center text-[0.6875rem] font-bold uppercase tracking-[0.16em] text-white sm:text-right">
          {`Publikasi terbaru · ${lead.year}`}
        </p>
      ) : null}
    </div>
  );
}
