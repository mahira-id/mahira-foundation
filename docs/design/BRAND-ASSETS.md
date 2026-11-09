# Brand Assets Guide

**ID:** DESIGN-BRAND-001 · **Status:** Proposed inventory guide · **Version:** 0.1.0

## 1. Purpose

Menentukan cara memilih dan menggunakan file identitas visual yang sudah berada di `public/logo/`. Nama file di tree menunjukkan beberapa varian, tetapi tidak cukup untuk menyimpulkan secara pasti bentuk, clear space, minimum size, atau versi resmi. Panduan ini menetapkan proses pemilihan; final mapping harus diverifikasi dengan membuka aset SVG dan meminta konfirmasi pemilik brand.

## 2. Known asset inventory (from repository tree)

- `MAHIRA_L_BLACK.svg`
- `MAHIRA_L_BLUE.svg`
- `MAHIRA_L_DARK_SILVER.svg`
- `MAHIRA_L_FLAT.svg`
- `MAHIRA_L_GREEN.svg`
- `MAHIRA_L_ORANGE.svg`
- `MAHIRA_L_SILVER.svg`
- `MAHIRA_P_BLACK.svg`
- `MAHIRA_P_BLUE.svg`
- `MAHIRA_P_DARK_SILVER.svg`
- `MAHIRA_P_FLAT.svg`
- `MAHIRA_P_GREEN.svg`
- `MAHIRA_P_ORANGE.svg`
- `MAHIRA_P_SILVER.svg`
- `M_MAHIRA.svg`

`L`, `P`, and `M` meaning are inferred from naming only and require confirmation. Do not treat suffix as official variant definition without asset inspection.

## 3. Asset selection rules (proposed)

- Use the full horizontal/landscape mark in desktop masthead only if its aspect ratio and legibility are suitable.
- Use the compact/portrait or symbol mark in constrained spaces only after verifying the asset's intended composition.
- Use dark marks on light surfaces and light/white marks on dark or primary-blue surfaces, subject to checking actual SVG paths and contrast.
- Do not apply CSS filters to recolor a logo that already has an approved color variant.
- Do not stretch, crop, distort, add effects, or recreate the mark as text.
- Preserve aspect ratio and provide intrinsic width/height to avoid layout shift.
- Use meaningful accessible name for an informative logo; decorative duplicate logo may use empty alt where a nearby text label already conveys the name.

## 4. Required brand decisions

- Official brand name and capitalization.
- Legal organization name vs public brand.
- Meaning of asset prefixes and suffixes.
- Primary logo, inverse logo, symbol, and mono variants.
- Minimum size, clear space, and prohibited backgrounds.
- Approved favicon/app icon derivation.
- Whether organization name may be set in text separately from logo.

## 5. Implementation checklist

- Inspect each SVG on light, white, silver, blue, and dark backgrounds.
- Confirm viewBox and intrinsic dimensions.
- Test raster output at favicon and social sizes.
- Ensure SVG has no external resource references or scripts.
- Centralize brand asset references in a small brand module or design token mapping.
- Do not introduce duplicate optimized exports unless the build process requires it.
