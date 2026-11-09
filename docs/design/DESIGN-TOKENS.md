# Design Tokens Specification

**ID:** DESIGN-TOKENS-001 · **Status:** Proposed token contract · **Version:** 0.1.0

## 1. Source of truth

PDD establishes visual intent. The recommended runtime canonical source is `app/globals.css` using CSS custom properties, because that file already exists in the repository and PDD explicitly requires one runtime source. This remains a recommendation until the actual stylesheet and Tailwind setup are inspected. This Markdown file documents semantics and usage; it must not become a second runtime source.

If the project later uses generated tokens, document the generator and generated-file policy. Do not manually maintain the same values in CSS, Tailwind config, component constants, and this document.

## 2. Confirmed brand inputs from PDD

| Token | Baseline | Intended use | Constraint |
|---|---|---|---|
| Primary Blue | `#1E6FB7` | Brand, primary actions, links | PDD reports indicative contrast 5.23:1 against white; verify actual states. |
| Orange | `#FF6A00` | Limited accent | PDD reports 2.87:1 against white; do not use for small text on white. |
| Green | `#1B684C` | Brand accent/positive semantic state | PDD reports 6.71:1 against white; semantic use still needs consistent meaning. |
| Silver | `#EDEDED` | Secondary surface | Not text color on white. |
| Dark Silver | `#848484` | Border/secondary icon/disabled | PDD reports 3.74:1; not important small text on white. |
| Black | `#101010` | Main text | Strong neutral text. |
| White | `#FFFFFF` | Main canvas/foreground on blue | Default light theme. |

The contrast figures above are PDD's indicative calculations, not final accessibility certification. Re-test with rendered colors, font sizes, component states, and WCAG 2.2 AA criteria.

## 3. Token namespaces

Recommended semantic namespaces:

```css
:root {
  /* Brand */
  --color-brand-primary: #1E6FB7;
  --color-brand-orange: #FF6A00;
  --color-brand-green: #1B684C;

  /* Neutral */
  --color-neutral-0: #FFFFFF;
  --color-neutral-950: #101010;

  /* Semantic: final values to be contrast-tested */
  --color-text-primary: var(--color-neutral-950);
  --color-surface-primary: var(--color-neutral-0);
  --color-border-default: /* TBD */;
  --color-text-muted: /* TBD */;
  --color-focus-ring: /* TBD */;
}
```

This is illustrative only. Do not copy invalid CSS comments into production custom properties. Define final values from the ramp and test matrix.

## 4. Color system still to be specified

Create a primary ramp from 50–900 with explicit hex values. PDD already identifies Primary 500 as `#1E6FB7`; other steps are not approved. Include:
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
