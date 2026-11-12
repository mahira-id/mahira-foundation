import { MahiraMark } from "@/components/brand/mahira";
import type { CoverTone } from "@/lib/landing-content";

type PublicationCoverProps = {
  title: string;
  type?: string | null;
  topic?: string | null;
  issue?: string;
  tone?: CoverTone;
  year?: string | null;
  className?: string;
};

/**
 * Typographic cover built from data (DECISIONS §2.7 P9 A): type, primary
 * topic, title and year; parts without a value are not rendered.
 */
export function PublicationCover({
  title,
  type,
  topic,
  issue,
  tone = "blue",
  year,
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
        {type ? <span className="cover__meta text-right">{type}</span> : null}
      </div>
      <div>
        {topic ? (
          <span className="cover__kicker inline-flex items-center gap-2">
            <span className="h-px w-5 bg-orange" />
            {topic}
          </span>
        ) : null}
        <p className="cover__title mt-4">{title}</p>
      </div>
      {issue || year ? (
        <div className="cover__bottom flex items-end justify-between gap-4 pt-3">
          <span className="cover__meta">{issue}</span>
          <span className="cover__meta">{year}</span>
        </div>
      ) : null}
    </div>
  );
}
