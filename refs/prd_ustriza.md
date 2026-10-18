# Product Requirements Document — **NaikFase**
> *Audit Bisnis · Temukan Fasemu · Naik Level*

**Versi:** 1.0  
**Tanggal:** Oktober 2026  
**Status:** Draft for Development  
**Author:** Product Team  
**Platform:** Web App (Next.js · App Router · PostgreSQL · Neon · Xendit · Vercel)

---

## 1. Ringkasan Eksekutif

**NaikFase** adalah platform alat tes bisnis berbayar berbasis web yang membantu para pengusaha Indonesia mengidentifikasi secara ilmiah di **fase mana** bisnis mereka berada saat ini, apa **krisis yang sedang menghadang**, dan langkah konkret apa yang harus dilakukan untuk **naik ke fase berikutnya**.

Alat audit ini adalah distilasi dari **pengalaman 30+ tahun Riza Zacharias**, pendiri dan owner Syaamil Group Bandung, yang telah membangun dan mengamati ratusan bisnis dari fase survival hingga ekspansi. Bukan teori di kelas — ini adalah checklist lapangan yang telah dipakai untuk mendiagnosis bisnis nyata.

**Nama Platform:** NaikFase  
**Tagline:** *"Audit Bisnis. Temukan Fasemu. Naik Level."*  
**Domain target:** naikfase.id  
**Model bisnis:** B2C — one-time purchase per sesi tes, dengan upsell ke produk lanjutan.

---

## 2. Latar Belakang & Problem Statement

### 2.1 Masalah yang Dilihat

Jutaan pengusaha Indonesia setiap tahun menghabiskan jutaan rupiah untuk:
- Mengikuti kelas bisnis online & offline
- Membeli buku-buku manajemen
- Menghadiri seminar & bootcamp
- Mendapatkan mentoring

Hasilnya? Banyak yang stagnan. Bukan karena ilmunya salah — tapi karena **ilmu yang dipelajari tidak sesuai fase bisnis mereka saat ini**.

Pengusaha di Fase 1 (Survival) yang belajar materi Fase 4 (Talent Building) tidak akan kemana-mana. Seperti siswa SD yang diajarkan kalkulus — ilmunya benar, tapi salah sasaran.

**The core problem:** Tidak ada alat diagnosis cepat, sahih, dan terjangkau yang bisa memberi tahu seorang pengusaha: *"Kamu sekarang ada di Fase ini, dengan gap di sini, dan kamu perlu melakukan ini."*

### 2.2 Solusi: NaikFase

NaikFase adalah **alat audit manajemen terstruktur** yang terdiri dari serangkaian checklist YA/TIDAK berbasis 8 dimensi bisnis — dari Produksi hingga Kepemimpinan Syariah — yang:

1. Mendeteksi fase bisnis user saat ini (Fase 1–5)
2. Mendiagnosis **krisis** yang mungkin sedang terjadi
3. Mengidentifikasi **gap** spesifik per dimensi
4. Memberikan **rekomendasi personal**: buku, mentor, kelas, coaching
5. Menghasilkan **laporan PDF** yang bisa disimpan & dibagikan

---

## 3. Target Pengguna

### 3.1 Persona Primer — "Pengusaha yang Tersesat"

| Atribut | Detail |
|---|---|
| Usia | 28–50 tahun |
| Profil | Owner/founder bisnis aktif, omset Rp 50jt – Rp 10M/bulan |
| Pain | Sudah banyak belajar tapi bisnis stagnan; tidak tahu harus mulai dari mana |
| Motivasi | Ingin tumbuh tapi lelah coba-coba tanpa arah jelas |
| Perilaku | Aktif di media sosial bisnis, sering ikut webinar, aware personal branding |
| Platform | Mobile-first, tapi nyaman di desktop untuk mengisi form panjang |

### 3.2 Persona Sekunder — "Pengusaha yang Ingin Konfirmasi"

Pengusaha yang sudah merasa di fase tertentu dan ingin **konfirmasi objektif** sebelum mengambil keputusan besar (ekspansi, fundraising, rekrut manajemen).

### 3.3 Persona Tersier — "Konsultan / Mentor Bisnis"

Konsultan yang ingin memberikan alat diagnostik kepada kliennya, atau fasilitator kelas bisnis yang ingin memberikan tes sebagai pre-assessment.

---

## 4. Framework Fase Bisnis (Konten Inti)

Platform ini dibangun di atas framework **5 Fase Bisnis** hasil kurikulum Riza Zacharias:

| Fase | Nama | Label | Krisis Fase |
|---|---|---|---|
| **1** | Survival | "Cari Makan" | Krisis Kepemimpinan — owner kerjakan semua sendiri |
| **2** | Cash Growth | "Cari Duit" | Krisis Otonomi — owner tidak bisa melepaskan kendali |
| **3** | Systemize | "Bangun Sistem" | Krisis Kontrol — silo antar unit, owner kehilangan visibilitas |
| **4** | Talent Building | "Cari Talent" | Krisis Birokrasi — sistem yg bagus malah mencekik inisiatif |
| **5** | Expansion | "Ekspansi" | Krisis Identitas — nilai inti tergerus saat tumbuh besar |

### 4.1 Audit Transitions

Ada **4 instrumen audit** (transition):

| Kode | Dari → Ke | Dimensi Utama |
|---|---|---|
| `audit_1_2` | Fase 1 → 2 | 92 butir, 8 seksi (A–H) |
| `audit_2_3` | Fase 2 → 3 | 161 butir, 9 seksi (A–I) |
| `audit_3_4` | Fase 3 → 4 | 63 butir, 10 seksi (A–J) |
| `audit_4_5` | Fase 4 → 5 | 46 butir, 9 seksi (A–I) |

### 4.2 Aturan Kelulusan Fase

- **Butir ★ (Kunci):** WAJIB 100% "Ya". Satu saja "Tidak" = belum bisa naik fase.
- **Butir biasa:** Target ≥ 80% "Ya" dari total butir non-kunci.
- Skor tinggi pada butir biasa **tidak bisa mengkompensasi** butir ★ yang masih "Tidak".

### 4.3 Seksi per Audit (8 Dimensi)

Setiap audit mencakup seksi-seksi berikut (variatif per fase):

| Kode | Nama Seksi |
|---|---|
| A | Produksi / Operasi |
| B | Sales & Marketing / Penjualan |
| C | Keuangan & Akuntansi |
| D | Kepatuhan — Pajak, Legal, BPJS |
| E | Sumber Daya Manusia |
| F | Manajemen & Sistem |
| G | Sistem Informasi & IT |
| H | R&D / Inovasi & Budaya Kerja |
| I | Kepemimpinan & Talent |
| J | Syariah & Kepemimpinan Muslim |

---

## 5. Fitur & Modul Platform

### 5.1 Landing Page

Landing page adalah **aset penjualan utama**. Harus berfungsi sebagai salesman 24 jam yang mengonversi visitor menjadi pembeli.

#### Struktur Sections (Scroll-down Storytelling):

---

**Section 1 — HERO (Above the Fold)**

> **Headline:** *"Sudah Ikut Puluhan Kelas Bisnis, Tapi Bisnis Masih Jalan di Tempat?"*
> 
> **Subheadline:** *Mungkin bukan karena kamu kurang ilmu — tapi karena kamu belum tahu kamu ada di FASE mana. Dan kelas yang kamu ikuti... bukan untuk fase kamu.*
> 
> **CTA Button:** "Temukan Fase Bisnisku Sekarang →"
> 
> **Trust indicator:** "Digunakan oleh 500+ pengusaha Indonesia | Dikembangkan bersama Riza Zacharias — Owner Syaamil Group"

---

**Section 2 — PAIN (Story Opening)**

> **Judul:** *"Kenalkan, Ini Cerita Hampir Semua Pengusaha yang Kami Temui..."*
>
> Narasi storytelling: Seorang pengusaha yang rajin ikut seminar, beli kelas mahal, dapat mentor top — tapi bisnisnya tetap berputar di masalah yang sama. Berganti guru, berganti metode, hasilnya sama. Sampai satu hari ia duduk bersama Pak Riza dan mendapat satu pertanyaan yang mengubah segalanya:
>
> *"Sebelum kita bicara strategi — kamu tahu nggak, bisnismu sekarang ada di fase berapa?"*
>
> *Dia tidak bisa menjawab.*

---

**Section 3 — REVELATION (The 5 Phases)**

> **Judul:** *"Ternyata, Setiap Bisnis Punya 5 Fase — Dan Tiap Fase Punya Penyakit, Obat, dan Solusi yang BERBEDA"*
>
> Visual interaktif 5 fase dengan nama, deskripsi singkat, dan krisis per fase. Dipresentasikan seperti peta jalan (roadmap horizontal).
>
> **Punchline:** *"Belajar solusi fase 4 saat kamu masih di fase 1 = buang uang, buang waktu, tambah frustrasi."*

---

**Section 4 — AUTHORITY (The Expert Behind the Audit)**

> **Judul:** *"Audit Ini Bukan Dari Buku Teks. Ini Dari 30+ Tahun di Lapangan."*
>
> Profil Riza Zacharias — perjalanan membangun Syaamil Group dari nol hingga menjadi salah satu perusahaan media Islam terbesar di Indonesia. Foto. Quote personal. Jumlah pengusaha yang telah dibimbing.
>
> **Quote kunci:** *"Saya tidak membuat checklist ini dari teori. Saya membuatnya dari melihat bisnis-bisnis yang sukses naik fase — dan dari bisnis-bisnis yang gagal karena salah langkah di waktu yang salah."*
>
> *— Riza Zacharias, Owner Syaamil Group*

---

**Section 5 — THE COST OF NOT KNOWING (Urgency)**

> **Judul:** *"Berapa Harga yang Sudah Kamu Bayar Karena Tidak Tahu Fase Bisnismu?"*
>
> Kalkulasi visual (interaktif): biaya kelas yang salah fase × waktu terbuang × opportunity cost.
>
> **Punchline:** *"Satu audit NaikFase yang tepat bisa menghemat ratusan juta rupiah kelas yang tidak relevan."*

---

**Section 6 — HOW IT WORKS (3 Langkah)**

> **Judul:** *"Cara Kerjanya Sederhana — Hasilnya Mengubah Cara Pandangmu tentang Bisnismu"*
>
> **Langkah 1:** Pilih paket & bayar (5 menit)  
> **Langkah 2:** Login dan isi audit YA/TIDAK dengan jujur (30–60 menit)  
> **Langkah 3:** Dapatkan laporan PDF lengkap dengan diagnosis & rekomendasi personal

---

**Section 7 — WHAT YOU'LL DISCOVER (Product Benefits)**

> **Judul:** *"Yang Akan Kamu Temukan di Dalam Laporan NaikFase-mu"*
>
> - ✅ Di fase mana bisnismu SEKARANG (berdasarkan skor aktual)
> - ✅ Krisis apa yang sedang menghadang (bahkan kalau kamu belum sadar)
> - ✅ Aspek-aspek mana yang sudah kuat dan mana yang masih bolong
> - ✅ Rekomendasi buku spesifik untuk setiap gap yang ditemukan
> - ✅ Nama mentor / coach yang relevan untuk fase kamu
> - ✅ Produk & kelas lanjutan yang benar-benar relevan untuk kondisimu saat ini
> - ✅ Laporan PDF siap cetak, bisa dibagikan ke partner / investor

---

**Section 8 — SAMPLE QUESTIONS (Credibility)**

> **Judul:** *"Sekilas Seperti Apa Pertanyaan Auditnya?"*
>
> Preview 5–8 contoh pertanyaan nyata dari instrumen (tanpa jawaban). Ini membangun kredibilitas dan memperlihatkan kedalaman audit.
>
> *"Pertanyaan-pertanyaan ini terasa sederhana. Tapi jawaban jujurmu akan membuka sesuatu yang sudah lama kamu hindari."*

---

**Section 9 — TESTIMONIALS (Social Proof)**

> Grid testimonial 2–3 kolom. Foto + nama + kota + jenis bisnis + kutipan spesifik tentang insight yang mereka dapatkan. Video testimonial jika ada.

---

**Section 10 — PRICING (Offer)**

> **Judul:** *"Investasi Terkecil dengan Dampak Terbesar pada Bisnismu"*
>
> | Paket | Harga | Isi |
> |---|---|---|
> | **Audit Satu Fase** | Rp 197.000 | Satu instrumen audit (pilih transition mana) + laporan PDF |
> | **Audit Lengkap (4 Instrumen)** | Rp 597.000 | Semua 4 instrumen + laporan komprehensif + priority support |
> | **Audit + Coaching** | Rp 1.997.000 | Audit lengkap + 1 sesi coaching 1:1 bersama mentor |
>
> Perbandingan biaya dengan "kelas yang salah fase" sebagai anchor.
>
> **Garansi:** *"Jika auditnya tidak memberi kamu insight baru tentang bisnismu, kami kembalikan 100% pembayaranmu."*

---

**Section 11 — FAQ**

Pertanyaan-pertanyaan umum: Berapa lama mengisi?, Apakah hasil bisa salah?, Bedanya dengan konsultasi biasa?, Apakah bisa diisi bersama tim?, Bahasa apa yang digunakan?, dsb.

---

**Section 12 — FINAL CTA (Last Push)**

> **Headline:** *"Satu Jam yang Bisa Mengubah Arah Bisnismu Selama Bertahun-Tahun ke Depan"*
>
> Dua CTA: "Mulai Audit Sekarang" + "Bicara dengan Tim Kami" (WhatsApp link).
>
> Trust badges: logo payment methods, badge "Aman & Terenkripsi", jumlah pengguna.

---

### 5.2 Checkout & Pembayaran

#### Flow Checkout:

```
[Pilih Paket di Landing] → [Form Checkout] → [Pilih Metode Bayar]
→ [Redirect/VA/QR] → [Konfirmasi Pembayaran] → [Email + WA Notifikasi]
→ [Redirect ke Login/Register Customer]
```

#### Form Checkout Fields:
- Nama lengkap
- Email
- Nomor WA
- Nama bisnis
- Bidang bisnis (dropdown)
- Kode promo / referral (opsional)
- Persetujuan syarat & ketentuan

#### Metode Pembayaran (via Xendit):
- **QRIS** (semua e-wallet & mobile banking)
- **Virtual Account:** BCA, Mandiri, BNI, BRI, BSI, BJB, BNC, CIMB, Muamalat, Permata
- **E-Wallet:** GoPay, ShopeePay, DANA, OVO, LinkAja
- **Retail Outlet:** Alfamart, Indomaret
- **Transfer Manual:** BCA Manual, Mandiri Manual (konfirmasi via WA)

#### Invoice:
- Format: `INV-{YYYYMMDD}-{6CHAR_RANDOM}`
- Expired: 24 jam untuk VA/retail, 5 menit untuk e-wallet
- Auto-notifikasi WA & email setelah paid

#### Post-Payment:
- Customer mendapat email dengan:
  - Konfirmasi pembayaran
  - Link aktivasi akun (jika belum punya akun)
  - Panduan cara memulai tes
- Redirect otomatis ke halaman aktivasi / login

---

### 5.3 Customer Portal (Area Login)

#### Auth System:
- Email + password (bcrypt)
- Optional: Magic link via email
- Session: JWT + secure cookie (30 hari)
- Route protection: middleware Next.js

#### Dashboard Customer:
- **Daftar tes yang dibeli** (status: belum mulai / sedang berjalan / selesai)
- **Riwayat pembayaran**
- **Laporan yang sudah selesai** (download PDF)
- **Produk yang direkomendasikan** (upsell contextual)

#### Data Pengisian Awal Tes:
Sebelum memulai sesi audit, customer mengisi:
- Nama pengisi
- Nama perusahaan
- Bidang bisnis
- Tahun mulai bisnis
- Penilai eksternal (jika ada)
- Pilihan audit mana yang ingin dikerjakan (jika beli paket multi)

---

### 5.4 Modul Pengisian Tes (Assessment Engine)

#### UX Prinsip:
- **One question / section at a time** — tidak tampil semua sekaligus
- Progress indicator per seksi dan overall
- Auto-save setiap jawaban (tidak perlu klik "simpan")
- Bisa pause dan lanjutkan (session persists)
- **Tidak bisa kembali** ke seksi yang sudah selesai (mencegah manipulasi)
- Butir ★ diberi label visual berbeda ("Kunci Gerbang")
- Panduan/guidance text tampil sebagai tooltip/expander

#### Answer Format:
- Setiap butir: **Ya / Tidak / Tidak Berlaku** (khusus butir kondisional)
- Catatan opsional per butir (untuk dokumentasi internal customer)

#### Completion Rules:
- Semua butir wajib dijawab sebelum bisa submit
- Konfirmasi akhir sebelum submit (tidak bisa diedit setelah submit)
- Timestamp mulai & selesai dicatat

---

### 5.5 Engine Perhitungan & Hasil

#### Kalkulasi Skor:

```
Per seksi:
- total_kunci = jumlah butir ★ di seksi tersebut
- kunci_ya   = jumlah butir ★ yang dijawab "Ya"
- total_biasa = jumlah butir non-★
- biasa_ya   = jumlah butir non-★ yang dijawab "Ya"

- kunci_pass   = (kunci_ya == total_kunci) → true/false
- skor_biasa   = (biasa_ya / total_biasa) * 100

Overall audit:
- semua_kunci_pass = semua seksi kunci_pass == true
- skor_overall    = (total_ya / total_butir) * 100
- status_naik     = semua_kunci_pass AND skor_overall >= 80
```

#### Result States:

| Status | Kondisi | Label |
|---|---|---|
| **SIAP NAIK FASE** | Semua ★ = Ya + skor ≥ 80% | 🟢 Level Up Ready |
| **HAMPIR** | Semua ★ = Ya + skor 60–79% | 🟡 Perlu Penguatan |
| **BELUM SIAP** | Ada ★ yang Tidak + skor apapun | 🔴 Gerbang Belum Terbuka |
| **DALAM BAHAYA** | ≥3 ★ = Tidak + skor < 50% | 🚨 Krisis Kritis |

---

### 5.6 Rekomendasi Engine

Setiap butir yang dijawab "Tidak" (terutama butir ★) memicu **rekomendasi personal** dari library:

#### Tipe Rekomendasi:

| Tipe | Contoh |
|---|---|
| **BUKU** | Judul, penulis, deskripsi singkat, link beli |
| **MENTOR** | Nama, spesialisasi, link profil/WA |
| **KELAS_INTERNAL** | Link ke kelas di NaikFase (upsell) |
| **EBOOK** | Judul, deskripsi, harga, link beli |
| **COACHING_ONLINE** | Link jadwal 1:1 online |
| **COACHING_OFFLINE** | Lokasi & jadwal coaching tatap muka |
| **VIDEO** | Link YouTube / course platform |
| **TOOL** | Software / template yang direkomendasikan |

#### Prioritas Tampil:
1. Butir ★ yang "Tidak" → ditampilkan pertama, diberi label "PRIORITAS KRITIS"
2. Seksi dengan gap terbesar
3. Butir biasa yang "Tidak"

#### Deduplication:
- Satu rekomendasi bisa di-trigger oleh banyak butir, tapi hanya ditampilkan sekali di laporan
- Dikelompokkan per tipe & per seksi

---

### 5.7 PDF Report Generator

#### Isi Laporan:

1. **Cover Page**
   - Logo NaikFase
   - Nama customer & perusahaan
   - Tanggal audit
   - Badge fase & status

2. **Executive Summary (1 halaman)**
   - Fase saat ini
   - Status kelulusan (siap naik / belum)
   - Skor keseluruhan
   - Krisis yang terdeteksi
   - Top 3 prioritas aksi

3. **Skor per Seksi (visual)**
   - Bar chart / radar chart per seksi
   - Warna: Hijau (≥80%), Kuning (60-79%), Merah (<60%)
   - Tanda ★ pass/fail

4. **Detail Gap per Seksi**
   - List butir yang dijawab "Tidak"
   - Butir ★ yang gagal diberi highlight khusus

5. **Rekomendasi Personal**
   - Per seksi yang memiliki gap
   - Dikelompokkan per tipe (buku, mentor, kelas, dll.)

6. **Roadmap Langkah Berikutnya**
   - 30 hari pertama
   - 60 hari
   - 90 hari

7. **Penjelasan Fase Berikutnya**
   - Apa yang menanti di fase berikutnya
   - Apa yang harus disiapkan

8. **Footer**
   - Disclaimer (bukan nasihat hukum/pajak)
   - Info kontak NaikFase
   - Tanggal laporan & nomor sesi

#### Tech Stack PDF:
- Library: `puppeteer` (server-side HTML to PDF) atau `react-pdf`
- Template: HTML/CSS dirender server-side
- Storage: Vercel Blob / S3-compatible
- Access: signed URL dengan expiry 7 hari per download

---

### 5.8 Upsell & Monetization Engine

#### Upsell Triggers (Contextual):

| Kondisi | Upsell yang Ditampilkan |
|---|---|
| Skor gap seksi Marketing ≥ 3 butir | "Kelas Digital Marketing untuk UKM" |
| Butir ★ BEP = Tidak | "Ebook Keuangan Bisnis Pemula" |
| Status BELUM SIAP overall | "Paket Coaching 1:1 bersama Mentor" |
| Selesai audit 1, belum beli audit lain | "Upgrade ke Paket Lengkap" |
| Sedang di Fase 2, gap SDM | "Kelas Membangun Tim Pertamamu" |

#### Produk Upsell yang Tersedia:
- **Kelas Online** (akses lifetime / time-limited)
- **Ebook** (PDF download after purchase)
- **Sesi Coaching 1:1 Online** (Zoom/Meet, 60–90 menit)
- **Sesi Coaching Offline** (Bandung / Jakarta)
- **Paket Group Mentoring** (bulanan)
- **Buku Fisik** (dikirim ke alamat)

---

### 5.9 Admin Panel

#### Modul Admin:

**Dashboard:**
- Revenue hari ini / bulan ini / total
- Jumlah tes aktif / selesai
- Konversi rate (checkout → paid)
- Top produk & upsell

**Manajemen Customer:**
- List, search, filter by status
- Detail customer: order history + test history
- Reset password, resend email

**Manajemen Order:**
- List semua order dengan status
- Manual confirmation (untuk transfer manual)
- Refund flag

**Manajemen Konten (Questions & Recommendations):**
- CRUD untuk semua pertanyaan per audit
- Tandai/lepas butir ★
- CRUD library rekomendasi
- Assign rekomendasi ke pertanyaan

**Manajemen Produk Upsell:**
- CRUD produk dengan harga, deskripsi, link

**Laporan & Analytics:**
- Distribusi fase customer
- Gap paling umum per seksi
- Conversion funnel

**Notifikasi:**
- CRUD template WA & email
- Log notifikasi

---

## 6. Alur Lengkap (End-to-End Flow)

```
[Visitor] → [Landing Page]
    → [Section Scroll] → [CTA Beli]
    → [Checkout Form] → [Pilih Payment Method]
    → [Proses Pembayaran via Xendit]
        → [Webhook Xendit → Backend]
        → [Order status: PAID]
        → [Kirim email + WA konfirmasi]
        → [Buat akun customer jika belum ada]
    → [Customer Login]
    → [Dashboard: lihat paket yang dibeli]
    → [Mulai Sesi Tes]
        → [Isi data awal perusahaan]
        → [Pengisian per seksi (auto-save)]
        → [Submit & Konfirmasi]
    → [Engine Hitung Skor]
    → [Generate PDF Report]
        → [Upload ke storage]
        → [Kirim link download via email + WA]
    → [Halaman Hasil: tampil skor, rekomendasi, upsell]
    → [Upsell Journey]
        → [Customer membeli coaching/kelas]
        → [Flow checkout ulang]
```

---

## 7. Konten: Statis vs Dinamis

### 7.1 Konten Statis (Seed sekali, jarang berubah)
- Deskripsi 5 fase bisnis
- 4 instrumen audit (question bank: ~362 pertanyaan total)
- Metadata per pertanyaan (★ flag, guidance text, section)
- Library rekomendasi (buku, mentor, video)
- Trigger mapping (pertanyaan → rekomendasi)
- Template notifikasi
- Payment methods & instructions
- FAQ content
- Testimonial (seeded, update manual)

### 7.2 Konten Dinamis (User-generated, real-time)
- Akun customer
- Order & invoice
- Sesi tes & jawaban
- Hasil & skor
- Rekomendasi yang ditampilkan per user
- PDF yang digenerate
- Payment logs
- Notification logs
- Coupon usage

---

## 8. Non-Functional Requirements

### 8.1 Performance
- Landing page: Lighthouse score ≥ 90 (mobile & desktop)
- LCP ≤ 2.5 detik
- Time to first byte ≤ 200ms (Edge function / CDN)
- PDF generation ≤ 15 detik
- Test session auto-save ≤ 500ms

### 8.2 Security
- HTTPS everywhere (Vercel managed)
- Password hashing: bcrypt, min cost 12
- JWT secret rotation
- Webhook verification: Xendit signature header
- Input sanitization & SQL injection protection (via Drizzle ORM / parameterized queries)
- Rate limiting: checkout endpoint (10 req/min per IP)
- PDF signed URL (expiry 7 hari, single-use or multi-use per setting)

### 8.3 Availability
- Uptime target: 99.5% (Vercel / Neon SLA)
- Graceful degradation: jika PDF gagal generate, email link tetap terkirim dengan retry

### 8.4 Accessibility
- WCAG 2.1 Level AA
- Mobile responsive (320px–1920px)
- Form accessible (label, aria, keyboard nav)

### 8.5 Data Privacy
- Sesuai UU PDP No. 27/2022
- Data customer tidak dijual ke pihak ketiga
- Opt-in untuk marketing email/WA
- Data retention policy: 3 tahun sejak last activity

---

## 9. Tech Stack

| Layer | Teknologi |
|---|---|
| Frontend | Next.js 15 (App Router), TypeScript, Tailwind CSS |
| Backend | Next.js API Routes / Server Actions |
| Database | PostgreSQL (Neon Serverless) |
| ORM | Drizzle ORM |
| Auth | NextAuth.js v5 / Jose JWT |
| Payment | Xendit (primary), Midtrans (fallback GoPay) |
| Email | Resend |
| WA Notif | Fonnte / WA Business API |
| PDF | Puppeteer (serverless) / React PDF |
| Storage | Vercel Blob (PDF output) |
| Deployment | Vercel |
| Analytics | Vercel Analytics + PostHog |

---

## 10. Out of Scope (Untuk Fase Ini)

Sesuai permintaan, hal berikut **tidak termasuk** dalam PRD ini dan akan dikerjakan terpisah:

- TRD (Technical Requirements Document) — akan dibuat terpisah
- Mobile native app (iOS / Android)
- Multi-bahasa (Inggris, dll.)
- Integrasi LMS eksternal
- Community / forum fitur
- Gamifikasi (badges, leaderboard)
- White-label untuk konsultan
- API publik untuk integrasi pihak ketiga

---

## 11. Milestones & Prioritas Pengembangan

### Phase 0 — Foundation (Minggu 1–2)
- [ ] Setup repo, Neon DB, Vercel project
- [ ] Schema migration & seeding (phases, questions, payment methods)
- [ ] Auth system (customer login/register)

### Phase 1 — Core Commerce (Minggu 3–4)
- [ ] Landing page (semua sections)
- [ ] Checkout form + Xendit integration
- [ ] Webhook handler & order management
- [ ] Email & WA notifikasi

### Phase 2 — Assessment Engine (Minggu 5–7)
- [ ] Test session UI (per-section flow)
- [ ] Auto-save answers
- [ ] Score calculator
- [ ] Result page (skor + basic rekomendasi)

### Phase 3 — PDF & Recommendations (Minggu 8–9)
- [ ] PDF template & generator
- [ ] Recommendation engine (trigger mapping)
- [ ] Download & email PDF

### Phase 4 — Upsell & Admin (Minggu 10–11)
- [ ] Upsell product catalog
- [ ] Contextual upsell di result page
- [ ] Admin dashboard (order, user, analytics)

### Phase 5 — Polish & Launch (Minggu 12)
- [ ] Landing page copy review & A/B test setup
- [ ] Performance optimization
- [ ] Security audit
- [ ] Staging → Production launch

---

## 12. Pertanyaan Terbuka (Open Questions)

1. Apakah customer boleh mengulang tes yang sama (dengan biaya baru)?
2. Apakah ada masa aktif sesi tes (misal: harus selesai dalam 30 hari)?
3. Siapa yang berhak menjadi "penilai eksternal" dan bagaimana mekanismenya di platform?
4. Apakah diperlukan fitur "co-filling" (isi bersama tim)?
5. Harga final setiap paket & produk upsell?
6. Mentor siapa saja yang akan masuk dalam recommendation library?
7. Apakah PDF bisa di-share langsung dari platform (generate share link)?
8. Apakah ada voucher/kupon khusus untuk peserta kelas Riza Zacharias?

---

*Dokumen ini adalah living document. Update terakhir: Oktober 2026.*
