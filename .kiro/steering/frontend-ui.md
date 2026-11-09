---
inclusion: fileMatch
fileMatchPattern: ["app/**/*.tsx", "app/**/*.css", "components/**/*.tsx", "components/**/*.css"]
---
# Mahira — Frontend and Editorial UI Rules

## Design direction

Follow PDD's editorial/institutional direction for public pages, product/service patterns for account areas, and editorial-operations patterns for internal tools. Keep publication content, report covers, titles, metadata, authors, topics, and summaries as the primary visual material.

## Current design implementation

- `app/globals.css` currently defines Tailwind v4 theme tokens, brand color ramp, font family, radii, focus styles, reduced-motion behavior, and editorial container styles.
- Hanken Grotesk is the current brand font direction.
- Primary brand blue is `#1E6FB7` (`--color-brand-500` in current CSS).
- Existing components under `components/` are the baseline; inspect and reuse before introducing alternatives.
- Do not create a second token source. `app/globals.css` is the current runtime source; any design-token documentation should reflect code and approved PDD decisions.

## Component rules

1. Use semantic HTML; links navigate, buttons perform actions.
2. Every interactive control needs keyboard access and visible focus.
3. Provide clear loading, empty, error, disabled, and locked states where applicable.
4. Do not make color the sole carrier of status or access meaning.
5. Keep body copy readable; constrain long-form reading width.
6. Use responsive layouts and account for Indonesian/English text-length differences.
7. Respect `prefers-reduced-motion` and do not add decorative motion without purpose.
8. Do not invent statistics, testimonials, publication cover art, author portraits, or institutional claims.
9. Preserve existing homepage identity and behavior unless a dedicated approved spec authorizes a change.
10. Do not introduce a component library or icon package without checking existing implementation and recording the dependency rationale.

## Rendering and data

- Prefer server components for public, content-oriented pages.
- Do not place secrets or privileged SDKs in client components.
- Keep content fetching and authorization outside presentational components.
- Use URL state for shareable search/filter state when required by the page spec.

## References

#[[file:docs/CORE/PDD.md]]
#[[file:app/globals.css]]
#[[file:components/site/header.tsx]]
#[[file:components/site/footer.tsx]]
