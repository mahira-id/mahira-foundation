import type { ReactNode } from "react";

type SectionHeaderProps = {
  index: string;
  label: string;
  title: string;
  description?: string;
  id: string;
  action?: ReactNode;
};

export function SectionHeader({
  index,
  label,
  title,
  description,
  id,
  action,
}: SectionHeaderProps) {
  return (
    <div className="grid gap-6 border-b border-line pb-8 lg:grid-cols-12 lg:gap-8">
      <div className="lg:col-span-3">
        <p className="eyebrow text-brand-700">
          {index} / {label}
        </p>
      </div>
      <div className="lg:col-span-9">
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div className="max-w-3xl">
            <h2
              className="text-[clamp(2rem,4vw,3.5rem)] font-bold leading-[1.02] tracking-[-0.035em] text-ink"
              id={id}
            >
              {title}
            </h2>
            {description ? (
              <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted">
                {description}
              </p>
            ) : null}
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </div>
      </div>
    </div>
  );
}
