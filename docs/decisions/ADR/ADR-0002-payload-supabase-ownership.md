# ADR-0002 — Payload and Supabase Database Ownership

- **Status:** Proposed — partly superseded. DEC-006 and DEC-007 were Accepted on 2026-11-10 (`DECISIONS.md` §2.1): two separate Supabase projects, not the single database proposed below. The rest of this ADR (DEC-010, DEC-012) stays Proposed.
- **Related decisions:** DEC-006, DEC-007, DEC-010, DEC-012
- **Decision owner / approver:** Engineering Lead — TBD

## Context

Payload CMS membutuhkan relational persistence untuk koleksi CMS dan autentikasi staf. Supabase menyediakan PostgreSQL, public-user Auth, RLS, dan Storage. SRS membagi data editorial/staf ke Payload dan data user/entitlement ke Supabase, tetapi ownership tabel dan migration workflow belum final.

## Drivers

- Menghindari dua migrator mengubah tabel yang sama.
- Menjaga akses tabel CMS lewat Payload access control.
- Menjaga data aplikasi user memakai RLS yang benar.
- Mendukung deployment serverless/managed dengan koneksi database yang sesuai.
- Memastikan backup dan restore mencakup satu sumber database tanpa mengaburkan ownership.

## Options

1. Payload dan aplikasi berbagi schema tanpa boundary: paling sederhana secara koneksi, tetapi berisiko konflik.
2. Satu database dengan schema atau namespace/table ownership terpisah: tetap satu Postgres, boundary migrasi jelas.
3. Database terpisah: boundary lebih kuat, namun menambah konsistensi, biaya, dan integrasi.

### Opsi terpilih: Nomor 3 (Aku sudah membuat 2 project terpisah di Supabase yang bisa anda akses menggunakan MCP yang terhubung dengan composio, integrasinya ke Supabase dengan nama profile mahira-id)

## Proposed decision

Gunakan satu Supabase Postgres sebagai kandidat awal, tetapi tetapkan ownership eksplisit per tabel/collection. Payload menjadi satu-satunya owner schema koleksi CMS yang dikelola Payload. Migration aplikasi Supabase hanya mengubah tabel aplikasi yang secara eksplisit dimiliki aplikasi. Tidak ada migration yang menyentuh tabel milik subsistem lain.

Schema separation (`payload` dan `app` misalnya) dapat dipertimbangkan jika kompatibilitas Payload adapter dan tooling migration telah dibuktikan. Jangan mengasumsikan seluruh tabel Payload otomatis diproteksi RLS hanya karena database berada di Supabase.

## Rules

- Setiap tabel dicantumkan di Data Model dengan `owner`, `migration authority`, `access path`, dan `RLS/access-control mode`.
- Payload migrations dijalankan melalui workflow Payload yang dipin versinya.
- Supabase application migrations disimpan di repository dan dijalankan melalui Supabase CLI atau tooling yang disetujui.
- Production schema tidak diubah manual sebagai workflow normal.
- Runtime connection dan migration connection dipisahkan sesuai rekomendasi provider dan dibuktikan pada spike.
- Restore test harus mencakup kedua kelompok data dan file storage.

## Consequences and risks

Satu database mengurangi jumlah layanan tetapi bukan berarti satu policy keamanan. Operasi Payload memakai kredensial server dan Payload access control; user-facing data harus memiliki RLS dan policy yang diuji. Integrasi adapter, connection pooling, migration ordering, dan schema separation harus dibuktikan.

## Validation gate

Spike harus membuat koleksi Publication di Payload, tabel profile/entitlement pada schema aplikasi, menjalankan migration fresh dan upgrade, menjalankan build/deploy, serta membuktikan tidak ada migration ownership collision. Jika tidak lolos, evaluasi database terpisah atau CMS alternatif.
