# Bank soal audit

Seed idempoten untuk 362 butir assessment BisnisLevelUp.id (92 / 161 / 63 / 46), 36 seksi, dan 56 butir kunci (13 / 18 / 16 / 9). Excel adalah acuan jumlah. Angka 47 butir kunci di ERD lama sengaja tidak dipakai.

File ini tidak menyentuh database production. `DATABASE_URL` harus mengarah ke Postgres lokal atau branch Neon yang boleh ditulis.

## File

| File | Peran |
|---|---|
| `drizzle/0002_test_questions_natural_key.sql` | Unique index `(audit_transition_id, question_number)` plus indeks baca. Wajib sebelum seed. |
| `drizzle/seed_question_bank.sql` | Seed satu transaksi. Generated. Jangan diedit tangan. |
| `tools/build_seed.py` | Generator dari JSON hasil parse Excel. |
| `tools/verify_question_bank.sql` | Pemeriksaan `SELECT` saja. |

`npm run db:seed` (`drizzle/seed.sql`) tidak lagi mengisi seksi atau butir placeholder. Phases, produk, pembayaran, kupon, dan seed lain di file itu tidak berubah. Hitungan `total_key_questions` 9/14/15/9 di seed dasar adalah sisa ERD; seed bank soal menimpanya menjadi 13/18/16/9.

## Menjalankan

Dari root repo, setelah `drizzle/0000_init.sql` dan `drizzle/seed.sql` sudah diterapkan:

```bash
npm run db:migrate:0002
npm run db:seed:questions
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f tools/verify_question_bank.sql
```

Kedua perintah npm memakai runner yang sudah ada, `scripts/db.ts` (`@neondatabase/serverless` `Pool`, satu query multi-statement, tanpa ORM). Setara dengan:

```bash
npx tsx scripts/db.ts drizzle/0002_test_questions_natural_key.sql
npx tsx scripts/db.ts drizzle/seed_question_bank.sql
```

`DATABASE_URL` dibaca dari environment. Kalau belum ada, runner mengisi dari `.env.local` tanpa menimpa variabel yang sudah diset.

Urutan dari database kosong:

```bash
npm run db:migrate
npx tsx scripts/db.ts drizzle/0001_profile_logos.sql
npm run db:seed
npm run db:migrate:0002
npm run db:seed:questions
```

Seed boleh dijalankan ulang. Butir yang sudah ada di-update lewat `ON CONFLICT`, bukan di-insert lagi. Butir di empat audit yang tidak ada di Excel di-set `is_active = false` (tidak di-`DELETE`, karena `test_answers` memakai `ON DELETE RESTRICT`). `recommendation_library` dan `recommendation_triggers` tidak disentuh.

Tanpa migrasi `0002`, seed dibatalkan oleh guard dan transaksi di-rollback.

## Yang diharapkan dari verify

| Audit | Butir aktif | Butir kunci | Seksi |
|---|---|---|---|
| `audit_1_2` | 92 | 13 | 8 |
| `audit_2_3` | 161 | 18 | 9 |
| `audit_3_4` | 63 | 16 | 10 |
| `audit_4_5` | 46 | 9 | 9 |

Query celah nomor, duplikat, dan link seksi lintas audit harus kosong. Butir kondisional yang ditandai: `audit_1_2` #47 dan #52, `audit_2_3` #88 dan #143, `audit_3_4` #19, #24, #32, `audit_4_5` #20.

## Regenerate

Input generator (tidak di-commit) ada di `bank-soal/parsed/`:

- `audit_1_2.json`
- `audit_2_3.json`
- `audit_3_4.json`
- `audit_4_5.json`

```bash
python3 tools/build_seed.py
```

Perintah itu menulis ulang `drizzle/seed_question_bank.sql` dan memperbarui JSON/CSV di `bank-soal/parsed/`. Parser Excel tidak ada di repo ini; JSON parsed adalah masukannya. Setelah generate, jalankan lagi migrasi `0002` (aman diulang) lalu `npm run db:seed:questions` dan query verify.
