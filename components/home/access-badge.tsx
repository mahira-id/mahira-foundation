import type { AccessLevel } from "@/lib/landing-content";

const accessConfig = {
  public: {
    label: "Akses publik",
    className: "border-green/30 bg-green/5 text-green",
    dot: "bg-green",
  },
  registered: {
    label: "Perlu akun",
    className: "border-brand-500/30 bg-brand-50 text-brand-700",
    dot: "bg-brand-500",
  },
  subscriber: {
    label: "Langganan",
    className: "border-orange bg-orange text-ink",
    dot: "bg-ink",
  },
} as const;

export function AccessBadge({ level }: { level: AccessLevel }) {
  const config = accessConfig[level];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-xs border px-2 py-1 text-[0.6875rem] font-bold uppercase leading-none tracking-[0.12em] ${config.className}`}
    >
      <span aria-hidden="true" className={`h-1 w-1 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
}
