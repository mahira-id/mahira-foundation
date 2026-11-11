# Mahira Indonesia Development — `mahira-foundation`

Platform publikasi riset dan pembelajaran Mahira (`https://mahira.id`). Saat ini repositori berisi homepage statis; platform publikasi dibangun bertahap.

## Mulai dari sini

| Dokumen | Isi |
|---|---|
| [`docs/MILESTONES.md`](docs/MILESTONES.md) | Fase, task berikutnya, blocker |
| [`docs/CHANGELOG.md`](docs/CHANGELOG.md) | Pekerjaan selesai beserta bukti |
| [`docs/README.md`](docs/README.md) | Indeks dokumen rujukan turunan |

## Stack

Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4. **Bun** sebagai package manager, **Node.js** sebagai runtime (DEC-018).

## Perintah

```bash
bun install      # pasang dependency (jangan pakai npm/yarn/pnpm)
bun run dev      # server pengembangan di http://localhost:3000
bun run lint     # ESLint
bun run build    # build produksi
bun run test               # unit test (node:test + tsx), tanpa DB
bun run test:integration   # tes DB mahira-cms + server lokal; butuh .env.local
bun run test:build-matrix  # 4 mode build env + cek gerbang HTTP
```

Rincian tes dan aturan keamanan DB: `docs/engineering/TEST-PLAN.md` §12.

## Alur kerja

1. Ambil task dari `docs/MILESTONES.md` (ID `M#-##`).
2. Buat branch `<tipe>/<m-id>-<topik>` dari `master` (`feat`, `fix`, `docs`, `chore`, `spike`).
3. Pastikan `bun run lint`, `bun run test`, dan `bun run build` lulus; perubahan CMS/akses juga `bun run test:integration`.
4. Di PR yang sama: centang task di `MILESTONES.md` dan tambah entri di `CHANGELOG.md`.
5. PR ke `master`. `master` ter-deploy ke produksi (Vercel); jangan push langsung.

`AGENTS.md` dikelola Next.js; aturan agent proyek ada di `.kiro/steering/`.
