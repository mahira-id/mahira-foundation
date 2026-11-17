/**
 * Colour values for code that cannot read CSS (DEC-024, DECISIONS §2.15
 * decision 9): the `viewport.themeColor` of the three root layouts and the
 * generated Open Graph image (`ImageResponse` has no CSS variables). The
 * single runtime token source is `app/globals.css` (`@theme`); these values
 * copy five of its tokens, and tests/unit/design-tokens.test.ts fails when a
 * value here differs from the CSS. This is the only TS/TSX file with a hex
 * colour.
 */
export const COLOR = {
  /** `--color-white` */
  white: "#ffffff",
  /** `--color-ink` */
  ink: "#101010",
  /** `--color-brand-500` */
  brand500: "#1e6fb7",
  /** `--color-brand-700` */
  brand700: "#144c7e",
  /** `--color-orange` */
  orange: "#ff6a00",
} as const;

/** The `theme-color` meta value; upper case as it has always been rendered. */
export const THEME_COLOR: string = COLOR.brand500.toUpperCase();

/** Token of `app/globals.css` behind each `COLOR` key (used by the unit test). */
export const COLOR_TOKENS = {
  white: "--color-white",
  ink: "--color-ink",
  brand500: "--color-brand-500",
  brand700: "--color-brand-700",
  orange: "--color-orange",
} as const satisfies Record<keyof typeof COLOR, string>;
