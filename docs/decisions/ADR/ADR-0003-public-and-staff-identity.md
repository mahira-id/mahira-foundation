# ADR-0003 — Public User and Staff Identity Boundary

- **Status:** Proposed. **Diajukan Accepted (2026-11-20, akhir M5 PR-1; DECISIONS §2.18 keputusan 16), menunggu persetujuan Owner.** Status belum diubah; Owner menyetujui sebagai PO karena Security owner belum ada (B-03).
- **Related decisions:** DEC-008, DEC-009, DEC-016
- **Decision owner / approver:** Product Owner + Security owner — TBD

## Context

SRS menetapkan Supabase Auth untuk pengguna umum dan Payload Auth untuk staf. Public registration tidak boleh menghasilkan Admin/Editor. Belum diputuskan apakah staf perlu akun publik terpisah untuk mengakses konten eksklusif.

## Proposed decision

- Public user identity: Supabase Auth.
- Staff identity: Payload Auth collection, role dan access control staf.
- Tidak ada implicit federation, shared session, atau role mapping hanya berdasarkan email.
- Public signup tidak pernah menulis/menaikkan role staff.
- Semua staff account dibuat oleh admin melalui proses terkontrol; MFA diwajibkan jika provider/configuration memungkinkan dan kebijakan organisasi menyetujuinya.
- Staff access ke file eksklusif ditolak secara default. Jika staff perlu menguji pengalaman publik atau mengambil dokumen, gunakan public account terpisah atau entitlement/grant yang eksplisit dan diaudit. Pilih salah satu melalui DEC-009.

## Alternatives

| Option | Evaluation |
|---|---|
| Satu auth system untuk semua | Bisa menyederhanakan identitas, tetapi memerlukan custom staff authorization dan memengaruhi integrasi Payload. Belum dibuktikan. |
| Supabase Auth public + Payload staff | Selaras dengan baseline SRS; menjaga pemisahan domain; konsekuensinya dua login/session boundary. |
| Identity provider terpusat | Dapat dipertimbangkan saat organisasi memiliki kebutuhan SSO/central identity; tambahan biaya dan setup. |

## Consequences

- UI dan server helper harus memakai jenis session yang benar.
- Jangan menerima `role`, `is_admin`, `access_level`, `entitlement`, atau `user_id` otoritatif dari client.
- Audit event harus dapat mengidentifikasi principal type (`public_user` atau `staff_user`).
- Perlu pengujian account confusion, IDOR, privilege escalation, dan session mix-up.

## Validation

Spike auth membuktikan public user tidak bisa mengakses Payload admin, public account tidak dapat mengubah role, staff session tidak otomatis dianggap public subscriber, dan logout/session invalidation berfungsi pada tiap surface.

## Validasi M5-01 (2026-11-20)
SPIKE-002 membuktikan di lokal (bukti per kriteria: SPIKE-002 "Hasil M5-01"): pengguna publik tidak dapat masuk ke Payload admin (AB1), metadata `user_metadata` tidak mengubah role (AB2), sesi staf tidak dianggap sesi publik (AB3, AP4), setiap operasi memeriksa penyedia identitasnya sendiri (AB4, AUU5, AUU7), logout dan cookie rusak aman (AU5, AU6). Bukti di domain Preview menunggu cek Owner (ENVIRONMENTS §3.1 butir F dan I). Implementasi: `lib/auth/`, `proxy.ts`. Staf yang perlu file `registered` memakai akun publik biasa tanpa tautan ke akun staf (DECISIONS §2.18 keputusan 14b). MFA staf dialihkan ke M4.
