---
name: editorial-ui-system
description: Build or review Mahira public editorial pages, publication cards, content listings, page layouts, account UI, dashboard UI, design tokens, accessibility, and responsive interface components.
---
# Editorial UI System

## Direction

Public pages should feel like an editorial research institution: typography, publication covers, metadata, summaries, and structured navigation lead. Account surfaces are task-oriented. Internal operational surfaces may be denser but remain accessible and consistent with the brand.

## Rules
- Inspect current `app/globals.css` and `components/` before creating a replacement.
- Keep `globals.css` as the runtime token source unless a decision changes it; do not duplicate token values in multiple CSS/theme systems.
- Use brand blue as documented. Orange is an accent, not small text on white. Use accessible semantic colors with explicit labels.
- Do not turn every section into the same three-card grid.
- Avoid generic gradients, glassmorphism, blobs, unnecessary stock imagery, and ornamental icons.
- Build components with semantic elements, keyboard support, focus-visible states, accessible names, and reduced-motion support.
- Design empty, loading, error, no-results, locked, and success states.
- Avoid unsupported statistics and content placeholders that look like factual organizational claims.
- Verify mobile layout and both Indonesian/English copy lengths.
