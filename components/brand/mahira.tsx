type LogoProps = {
  tone?: "blue" | "silver" | "flat";
  className?: string;
  priority?: boolean;
};

const logoSources = {
  blue: "/logo/MAHIRA_L_BLUE.svg",
  silver: "/logo/MAHIRA_L_SILVER.svg",
  flat: "/logo/MAHIRA_L_FLAT.svg",
} as const;

export function Logo({ tone = "blue", className, priority = false }: LogoProps) {
  return (
    // The brand asset is a local SVG lockup; next/image would add no value here.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      alt="Mahira Indonesia Development"
      className={className}
      decoding="async"
      height={373}
      loading={priority ? "eager" : "lazy"}
      src={logoSources[tone]}
      width={2221}
    />
  );
}

export function MahiraMark({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      focusable="false"
      viewBox="380 0 860 380"
    >
      <path
        d="M683.63 103.35L747.66 26.88C751.04 22.84 757.37 23.22 760.25 27.63L912.57 260.89C914.41 263.7 914.25 267.37 912.18 270.02L848.25 351.66C844.92 355.92 838.37 355.61 835.46 351.05L683.03 112.62C681.18 109.73 681.43 105.98 683.63 103.36V103.35Z"
        fill="currentColor"
      />
      <path
        d="M929.97 3.25996C927.07 -0.770043 921.2 -1.12004 917.83 2.52996L855.42 70.32C843.26 82.86 843.69 89.13 851.57 101.07C855.48 107 951.78 252.37 959.02 263.01C979.26 292.79 986.79 305.92 1006.31 314.47C1085.94 349.37 1185.33 335.45 1216.65 299.49L1216.61 298.7C1148.99 295.25 1150.98 309.65 1078.75 209.61L929.97 3.25996Z"
        fill="currentColor"
      />
      <path
        d="M666.92 283.42C572.14 249.74 534.59 371.6 428.57 323.06C517 302.94 530.81 180.77 605.76 157.71C660.71 144.67 692.24 199.77 716.24 239.62C722.02 249.35 742.62 282.27 756.8 305.08C760.87 311.62 754.05 319.52 747 316.43C720.59 304.82 693.42 291.23 666.92 283.42Z"
        fill="currentColor"
      />
    </svg>
  );
}
