# ADR-0001 — Single Next.js Application with Explicit Domain Boundaries

- **Status:** Proposed
- **Related decisions:** DEC-002, DEC-006, DEC-016, DEC-017
- **Decision owner / approver:** Engineering Lead / Product Owner — TBD

## Context

Mahira membutuhkan permukaan publik yang SEO-oriented, area akun terautentikasi, dan dashboard editorial/internal. PRD menyatakan bahwa pemisahan menjadi dua aplikasi bukan default. SRS mengusulkan Next.js App Router untuk website publik, akun, server operations, dan Payload CMS 3 untuk staff admin.

## Drivers

1. HTML publik dan metadata per publikasi harus dapat dirender server-side/static sesuai kebutuhan.
2. Area akun dan admin membutuhkan server-side authorization.
3. Tim awal perlu meminimalkan deployment pipeline, session boundary, dan duplikasi tipe/kebijakan.
4. Pemisahan domain harus tetap memungkinkan ekstraksi aplikasi di masa depan.

## Options

| Option | Kelebihan | Trade-off |
|---|---|---|
| A. One Next.js app + Payload admin | Satu runtime aplikasi, satu release flow, shared types, SSR/ISR dan server operations. | Perlu disiplin pemisahan domain dan pengujian boundary; CMS/plugin dapat memengaruhi build. |
| B. Next.js public + Vite account/admin | Dashboard SPA dapat dirancang terpisah. | Session/CORS/API/deploy/configuration ganda; backend tetap diperlukan untuk operasi sensitif. |
| C. Separate services from day one | Boundary deployment lebih kuat. | Kompleksitas operasional dan integrasi terlalu dini untuk tim/scope yang diketahui. |

## Proposed decision

Gunakan satu repository dan satu aplikasi Next.js App Router sebagai baseline. Pisahkan route dan domain secara eksplisit:

- Public website: locale-prefixed routes, SEO-aware.
- Public account: server-authenticated, `noindex`.
- Payload admin: staff-only CMS surface.
- Internal operational views: hanya jika kebutuhan terdefinisi; dapat menjadi custom Payload view atau route server-protected.

Jangan gunakan Vite sebagai aplikasi kedua pada tahap awal. Jangan menyatukan identitas public user dan staff hanya demi kemudahan implementasi.

## Consequences

- Domain layer (`publications`, `access`, `accounts`, `editorial`, `learning`) tidak boleh bergantung pada komponen UI.
- Semua privileged operation berada di server.
- Komponen client tidak diberi secret atau otoritas.
- Jika dashboard kelak membutuhkan lifecycle, scaling, atau security boundary terpisah, ekstraksi aplikasi dievaluasi melalui ADR baru.

## Validation

Technical spike harus membuktikan Next.js + Payload dapat dibangun dan dijalankan pada target hosting, serta route publik/account/admin tidak berbagi authorization secara implisit.
