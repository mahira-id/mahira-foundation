# ADR-0003 — Public User and Staff Identity Boundary

- **Status:** Proposed
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
