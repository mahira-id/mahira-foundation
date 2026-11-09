---
name: bilingual-routing
description: Design or implement Indonesian/English locale routing, translated content relationships, locale-aware slugs, language switching, canonical URLs, hreflang, search locale, and fallback behavior for Mahira.
---
# Bilingual Routing and Content

## Preconditions

The target locales are Indonesian (`id`) and English (`en`), but the translation-storage model and some fallback/slug details are not final. Read the accepted localization and routing ADRs plus `docs/specifications/IA-ROUTING-I18N.md` before changing route structure or content schema.

## Rules
- Keep UI locale, content locale, and translation completeness distinct.
- Never show content in another language as if it were the selected locale without explicit labeling and an approved fallback rule.
- Use stable translation relationships; do not infer a translation pair from similar titles.
- Define slug uniqueness within the approved locale/route scope and preserve redirects when slugs change.
- Emit canonical and hreflang only for valid published locale versions; do not generate a false alternate.
- Make date/number/formatting locale-aware.
- Search scope (active locale vs cross-language) must follow the approved spec.
- Add route and metadata tests for missing translations, invalid locale, slug collision, and switch-language destination.
