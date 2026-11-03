import { MahiraMark } from "@/components/brand/mahira";
import type { CoverTone } from "@/lib/landing-content";

type PublicationCoverProps = {
  title: string;
  type: string;
  topic: string;
  issue: string;
  tone?: CoverTone;
  year?: string;
  className?: string;
};

export function PublicationCover({
  title,
  type,
  topic,
  issue,
  tone = "blue",
  year = "2026",
  className = "",
}: PublicationCoverProps) {
  return (
    <div
      aria-hidden="true"
      className={`publication-cover ${className}`}
      data-tone={tone}
    >
      <span className="absolute inset-x-0 top-0 h-1 bg-orange" />
      <div className="flex items-start justify-between gap-4">
        <MahiraMark className="h-5 w-auto" />
        <span className="cover__meta text-right">{type}</span>
      </div>
      <div>
        <span className="cover__kicker inline-flex items-center gap-2">
          <span className="h-px w-5 bg-orange" />
          {topic}
        </span>
        <p className="cover__title mt-4">{title}</p>
      </div>
      <div className="cover__bottom flex items-end justify-between gap-4 pt-3">
        <span className="cover__meta">{issue}</span>
        <span className="cover__meta">{year}</span>
      </div>
    </div>
  );
}
