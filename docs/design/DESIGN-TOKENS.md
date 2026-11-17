# Design Tokens Specification

**ID:** DESIGN-TOKENS-001 · **Status:** Accepted token contract (DEC-024, 2026-11-17) · **Version:** 0.1.0

## 1. Source of truth

**Accepted 2026-11-17 (DEC-024, DECISIONS §2.15 decision 9).** The single runtime source is `app/globals.css`: the `@theme` block (Tailwind 4) defines every colour, radius and the font family as CSS custom properties, and rules use `var(--…)` only. A hex value may appear only in a token definition there. Code that cannot read CSS (`viewport.themeColor` in the three root layouts and the generated Open Graph image) takes five colours from `lib/design/tokens.ts`; `tests/unit/design-tokens.test.ts` (TKU1–TKU3) fails when those values differ from the CSS tokens, when a colour literal appears outside `@theme` or `tokens.ts`, or when `app/(site)/globals.css` comes back. This Markdown file documents names and meaning; it must not become a second runtime source and does not repeat token values.

If the project later uses generated tokens, document the generator and generated-file policy. Do not manually maintain the same values in CSS, Tailwind config, component constants, and this document.

## 2. Confirmed brand inputs from PDD

The approved brand values are in PDD §4. This table maps each input to its runtime token and keeps the usage constraint.

| Brand input | Runtime token | Intended use | Constraint |
|---|---|---|---|
| Primary Blue | `--color-brand-500` | Brand, primary actions, links | PDD reports indicative contrast 5.23:1 against white; verify actual states. |
| Orange | `--color-orange` | Limited accent | PDD reports 2.87:1 against white; do not use for small text on white. |
| Green | `--color-green` | Brand accent/positive semantic state | PDD reports 6.71:1 against white; semantic use still needs consistent meaning. |
| Silver | `--color-silver` | Secondary surface | Not text color on white. |
| Dark Silver | `--color-dark-silver` | Border/secondary icon/disabled | PDD reports 3.74:1; not important small text on white. |
| Black | `--color-ink` | Main text | Strong neutral text. |
| White | `--color-white` | Main canvas/foreground on blue | Default light theme. |

The contrast figures above are PDD's indicative calculations, not final accessibility certification. Re-test with rendered colors, font sizes, component states, and WCAG 2.2 AA criteria.

## 3. Token namespaces

Tokens in `app/globals.css` (`@theme`), grouped by meaning:

| Namespace | Tokens | Meaning |
|---|---|---|
| Brand ramp | `--color-brand-50` … `--color-brand-900` | Derived from the primary: 50–100 soft surfaces, 200–300 accent borders and hover, 500 the brand primary, 600–800 hover/active and link on light, 900 limited dark surface. |
| Brand accents | `--color-orange`, `--color-green` | Limited accent (orange) and positive accent (green). |
| Neutral | `--color-ink`, `--color-ink-soft`, `--color-muted`, `--color-silver`, `--color-line`, `--color-dark-silver`, `--color-white` | Text (ink, ink-soft, muted), surfaces (silver, white), lines (line, dark-silver). |
| Translucent | `--color-white-a07`, `-a08`, `-a10`, `-a25`, `-a45`; `--color-ink-a06`, `-a18` | White and ink at fixed opacity; the only place an `rgb()` literal may appear. |
| Shape | `--radius-xs`, `--radius-sm`, `--radius-md`, `--radius-lg` | Small, utilitarian radii (PDD §6.3). |
| Type | `--font-sans` | Hanken Grotesk with a neutral system fallback. |

Semantic roles (text, surface, border, focus, success, warning, danger, info) are not separate tokens yet; components use the tokens above. Define semantic aliases only when a real need appears, and test their contrast first. Add no token and no hex value outside `app/globals.css` (and the five values in `lib/design/tokens.ts`).

## 4. Color system still to be specified

The primary ramp 50–900 exists in `app/globals.css` as `--color-brand-50` … `--color-brand-900` (500 is the brand primary); its steps are in use but not yet contrast-reviewed per pair. Still to specify:
- light surfaces and selected states;
- subtle borders and hover surfaces;
- default primary action;
- active/pressed shades;
- link-on-light shade;
- dark brand surfaces.

For every semantic pair record foreground, background, computed contrast, applicable text size/weight, and pass/fail. Semantic roles should include text, surface, border, focus, success, warning, danger, and informational states. Do not infer that brand green automatically covers all success states without testing and defining meaning.

## 5. Typography

PDD specifies Hanken Grotesk across UI. Proposed scale needs final numeric values and responsive behavior:

| Role | Proposed token | Guidance |
|---|---|---|
| Display | `--font-size-display` | Hero only; responsive `clamp()`. |
| H1 | `--font-size-h1` | One primary heading per page. |
| H2/H3 | `--font-size-h2`, `--font-size-h3` | Section/subsection hierarchy. |
| Body | `--font-size-body` | Long-form readable line length. |
| Small | `--font-size-small` | Secondary copy; maintain minimum legibility. |
| Caption | `--font-size-caption` | Metadata only when still readable. |

Define line-height, font-weight, letter spacing, and maximum reading measure per role. Use 400–500 for long-form body, 600–700 for headings/controls, 700–800 for display as PDD recommends. Confirm font files/weights and glyph coverage before shipping.

## 6. Spacing, layout, shape

Use a consistent spacing scale rather than local arbitrary values. Proposed base unit: 4 px, subject to design review. Define tokens for 0, 1, 2, 3, 4, 6, 8, 12, 16, 24, 32 units only if these map to actual needs; avoid producing unused tokens.

Define:
- page gutters at mobile/tablet/desktop;
- max content width and reading width;
- section spacing;
- grid gaps;
- compact dashboard density;
- component padding.

PDD suggests radius 0–8 px as the default range. Use larger pill radius only for status/label patterns where semantically appropriate. Shadows are secondary; hierarchy should rely on spacing, typography, surface, and border first.

## 7. Breakpoints and responsive behavior

Exact breakpoints are TBD; derive from layout failure points, not device brand names. Document breakpoints used by CSS/Tailwind, container widths, grid transitions, navigation collapse, table overflow behavior, and typography changes. Test actual content length in ID and EN.

## 8. Motion

- Motion is functional feedback, not decoration.
- Define duration/easing tokens only for real interaction needs.
- Respect `prefers-reduced-motion`.
- Avoid scroll-triggered spectacle and large layout shifts.
- Include focus/pressed/disabled/busy transitions where useful.

## 9. Component state contract

Buttons, links, inputs, badges, cards/lists, tables, dialogs, and toasts must implement the state table in PDD §10. Focus-visible must be perceivable and not clipped. Disabled is not a substitute for explaining why an action is unavailable.

## 10. Token governance

A token change requires: reason, affected components, contrast review, light/dark decision (light is current baseline), screenshots or visual regression review, and update to this document. Avoid one-off hex values inside components; exceptions require documented justification.
