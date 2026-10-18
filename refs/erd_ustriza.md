# Entity Relationship Document — **NaikFase**
> *Skema Database PostgreSQL · Versi 1.0 · Oktober 2026*

**Database:** PostgreSQL (Neon Serverless)  
**Konvensi:**
- Primary key: `bigserial` (bukan UUID)
- Enum diganti: `varchar` dengan constraint `CHECK` atau tanpa constraint (untuk fleksibilitas migration)
- Semua FK terhubung dengan `ON DELETE` policy eksplisit
- Index dioptimasi untuk high-traffic read path
- `timestamptz` untuk semua timestamp (timezone-aware)
- Soft delete via `deleted_at timestamptz` untuk tabel sensitif

---

## Daftar Tabel

| # | Nama Tabel | Kategori | Tipe Konten |
|---|---|---|---|
| 1 | `admins` | Auth & CMS | Dinamis |
| 2 | `customers` | Auth | Dinamis |
| 3 | `customer_sessions` | Auth | Dinamis |
| 4 | `phases` | Konten | Statis |
| 5 | `audit_transitions` | Konten | Statis |
| 6 | `test_sections` | Konten | Statis |
| 7 | `test_questions` | Konten | Statis |
| 8 | `recommendation_library` | Konten | Statis |
| 9 | `recommendation_triggers` | Konten | Statis |
| 10 | `products` | Produk | Semi-statis |
| 11 | `product_categories` | Produk | Statis |
| 12 | `upsell_items` | Produk | Semi-statis |
| 13 | `payment_methods` | Pembayaran | Statis |
| 14 | `payment_instructions` | Pembayaran | Statis |
| 15 | `orders` | Transaksi | Dinamis |
| 16 | `order_items` | Transaksi | Dinamis |
| 17 | `payment_logs` | Log | Dinamis |
| 18 | `test_sessions` | Tes | Dinamis |
| 19 | `test_answers` | Tes | Dinamis |
| 20 | `test_results` | Tes | Dinamis |
| 21 | `result_section_scores` | Tes | Dinamis |
| 22 | `result_recommendations` | Tes | Dinamis |
| 23 | `coupon_codes` | Promosi | Semi-statis |
| 24 | `coupon_usage` | Promosi | Dinamis |
| 25 | `affiliates` | Promosi | Semi-statis |
| 26 | `affiliate_referrals` | Promosi | Dinamis |
| 27 | `notification_templates` | Notif | Statis |
| 28 | `notification_logs` | Notif | Dinamis |
| 29 | `testimonials` | CMS | Semi-statis |

---

## Skema DDL Lengkap

```sql
-- ============================================================
-- NaikFase — PostgreSQL Schema
-- Platform: Neon Serverless PostgreSQL
-- Generated: Oktober 2026
-- ============================================================

-- ============================================================
-- SECTION 1: AUTH & ADMIN
-- ============================================================

-- 1. admins
-- Pengguna backend (admin panel). Diadaptasi dari nebeng.sql.
-- ============================================================
CREATE SEQUENCE IF NOT EXISTS admins_id_seq;
CREATE TABLE IF NOT EXISTS admins (
    id              bigint NOT NULL DEFAULT nextval('admins_id_seq'),
    name            varchar(100) NOT NULL,
    email           varchar(150) NOT NULL,
    password_hash   varchar(255) NOT NULL,
    role            varchar(50)  NOT NULL DEFAULT 'STAFF',
                    -- Values: SUPERADMIN | ADMIN | FINANCE | CONTENT | SUPPORT
    status          varchar(20)  NOT NULL DEFAULT 'ACTIVE',
                    -- Values: ACTIVE | INACTIVE | SUSPENDED
    last_login_at   timestamptz,
    created_at      timestamptz  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      timestamptz  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);
CREATE UNIQUE INDEX idx_admins_email ON admins (email);
CREATE INDEX idx_admins_role_status ON admins (role, status);


-- 2. customers
-- Pembeli / peserta tes. Bisa register setelah bayar (post-checkout activation).
-- ============================================================
CREATE SEQUENCE IF NOT EXISTS customers_id_seq;
CREATE TABLE IF NOT EXISTS customers (
    id                  bigint NOT NULL DEFAULT nextval('customers_id_seq'),
    name                varchar(150) NOT NULL,
    email               varchar(150) NOT NULL,
    phone               varchar(30),
    password_hash       varchar(255),
                        -- NULL jika belum set password (magic link only)
    email_verified_at   timestamptz,
    phone_verified_at   timestamptz,
    business_name       varchar(200),
    business_field      varchar(100),
    business_city       varchar(100),
    referral_code       varchar(50),
                        -- Kode referral milik customer ini (untuk bagikan ke orang lain)
    affiliate_id        bigint,
                        -- FK ke affiliates (siapa yang mereferensikan customer ini)
    status              varchar(20) NOT NULL DEFAULT 'ACTIVE',
                        -- Values: ACTIVE | INACTIVE | BANNED
    created_at          timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at          timestamptz,
    PRIMARY KEY (id)
);
CREATE UNIQUE INDEX idx_customers_email ON customers (email);
CREATE UNIQUE INDEX idx_customers_referral_code ON customers (referral_code)
    WHERE referral_code IS NOT NULL;
CREATE INDEX idx_customers_affiliate_id ON customers (affiliate_id);
CREATE INDEX idx_customers_status ON customers (status);
CREATE INDEX idx_customers_created_at ON customers (created_at DESC);


-- 3. customer_sessions
-- JWT-based session tracking. Untuk invalidasi token sisi server.
-- ============================================================
CREATE SEQUENCE IF NOT EXISTS customer_sessions_id_seq;
CREATE TABLE IF NOT EXISTS customer_sessions (
    id              bigint NOT NULL DEFAULT nextval('customer_sessions_id_seq'),
    customer_id     bigint NOT NULL,
    token_hash      varchar(64) NOT NULL,
                    -- SHA-256 hash dari JWT jti
    ip_address      varchar(45),
    user_agent      text,
    expires_at      timestamptz NOT NULL,
    revoked_at      timestamptz,
    created_at      timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT fk_csess_customer FOREIGN KEY (customer_id)
        REFERENCES customers (id) ON DELETE CASCADE
);
CREATE UNIQUE INDEX idx_csess_token_hash ON customer_sessions (token_hash);
CREATE INDEX idx_csess_customer_id ON customer_sessions (customer_id);
CREATE INDEX idx_csess_expires_at ON customer_sessions (expires_at);


-- ============================================================
-- SECTION 2: FASE & KONTEN AUDIT (STATIS)
-- ============================================================

-- 4. phases
-- 5 fase bisnis. Seed sekali, tidak berubah.
-- ============================================================
CREATE SEQUENCE IF NOT EXISTS phases_id_seq;
CREATE TABLE IF NOT EXISTS phases (
    id              bigint NOT NULL DEFAULT nextval('phases_id_seq'),
    phase_number    smallint NOT NULL,
                    -- 1–5
    code            varchar(30) NOT NULL,
                    -- SURVIVAL | CASH_GROWTH | SYSTEMIZE | TALENT_BUILDING | EXPANSION
    name_short      varchar(80) NOT NULL,
                    -- "Survival"
    name_label      varchar(80) NOT NULL,
                    -- "Cari Makan"
    crisis_title    varchar(150),
                    -- "Krisis Kepemimpinan"
    crisis_desc     text,
    description     text,
    icon_key        varchar(50),
                    -- Key ikon untuk UI
    color_hex       varchar(7),
                    -- Warna representasi di UI (#3B82F6 dll.)
    sort_order      smallint NOT NULL DEFAULT 0,
    PRIMARY KEY (id)
);
CREATE UNIQUE INDEX idx_phases_number ON phases (phase_number);
CREATE UNIQUE INDEX idx_phases_code ON phases (code);


-- 5. audit_transitions
-- 4 instrumen audit (1→2, 2→3, 3→4, 4→5).
-- ============================================================
CREATE SEQUENCE IF NOT EXISTS audit_transitions_id_seq;
CREATE TABLE IF NOT EXISTS audit_transitions (
    id              bigint NOT NULL DEFAULT nextval('audit_transitions_id_seq'),
    code            varchar(20) NOT NULL,
                    -- audit_1_2 | audit_2_3 | audit_3_4 | audit_4_5
    from_phase_id   bigint NOT NULL,
    to_phase_id     bigint NOT NULL,
    name            varchar(150) NOT NULL,
                    -- "Audit Fase 1 ke 2 — Survival → Cash Growth"
    gate_desc       text,
                    -- Deskripsi gerbang krisis fase ini
    total_questions smallint NOT NULL DEFAULT 0,
                    -- Diupdate otomatis via trigger atau seed
    total_key_questions smallint NOT NULL DEFAULT 0,
    passing_score   numeric(5,2) NOT NULL DEFAULT 80.00,
                    -- Persentase minimum butir biasa
    is_active       boolean NOT NULL DEFAULT true,
    sort_order      smallint NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    CONSTRAINT fk_audit_from_phase FOREIGN KEY (from_phase_id)
        REFERENCES phases (id) ON DELETE RESTRICT,
    CONSTRAINT fk_audit_to_phase FOREIGN KEY (to_phase_id)
        REFERENCES phases (id) ON DELETE RESTRICT
);
CREATE UNIQUE INDEX idx_audit_transitions_code ON audit_transitions (code);
CREATE INDEX idx_audit_transitions_from ON audit_transitions (from_phase_id);


-- 6. test_sections
-- Seksi per audit (A–J). Statis.
-- ============================================================
CREATE SEQUENCE IF NOT EXISTS test_sections_id_seq;
CREATE TABLE IF NOT EXISTS test_sections (
    id                  bigint NOT NULL DEFAULT nextval('test_sections_id_seq'),
    audit_transition_id bigint NOT NULL,
    code                varchar(5) NOT NULL,
                        -- A, B, C, ... J
    name                varchar(100) NOT NULL,
                        -- "Produksi / Operasi"
    sub_name            varchar(100),
                        -- "Pembelanjaan" (sub-seksi, jika ada)
    description         text,
    sort_order          smallint NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    CONSTRAINT fk_sections_audit FOREIGN KEY (audit_transition_id)
        REFERENCES audit_transitions (id) ON DELETE CASCADE
);
CREATE INDEX idx_test_sections_audit ON test_sections (audit_transition_id);
CREATE UNIQUE INDEX idx_test_sections_audit_code
    ON test_sections (audit_transition_id, code);


-- 7. test_questions
-- Bank soal. ~362 pertanyaan total dari 4 instrumen.
-- ============================================================
CREATE SEQUENCE IF NOT EXISTS test_questions_id_seq;
CREATE TABLE IF NOT EXISTS test_questions (
    id                  bigint NOT NULL DEFAULT nextval('test_questions_id_seq'),
    audit_transition_id bigint NOT NULL,
    section_id          bigint NOT NULL,
    question_number     smallint NOT NULL,
                        -- Nomor urut dalam audit (1, 2, 3... sesuai lembar asli)
    question_text       text NOT NULL,
    guidance_text       text,
                        -- Teks "Catatan / Panduan" dari kolom spreadsheet
    is_key              boolean NOT NULL DEFAULT false,
                        -- true = butir ★ (wajib Ya untuk naik fase)
    is_conditional      boolean NOT NULL DEFAULT false,
                        -- true = ada kondisi "jika ada karyawan pertama", dll.
    condition_text      varchar(255),
                        -- Teks kondisi jika is_conditional = true
    has_not_applicable  boolean NOT NULL DEFAULT false,
                        -- Apakah boleh dijawab "Tidak Berlaku"
    is_added            boolean NOT NULL DEFAULT false,
                        -- true = butir yang ditambahkan (tanda ＋ di spreadsheet)
    weight              numeric(4,2) NOT NULL DEFAULT 1.00,
                        -- Bobot soal (default 1, bisa diubah untuk soal kritis)
    sort_order          smallint NOT NULL DEFAULT 0,
    is_active           boolean NOT NULL DEFAULT true,
    PRIMARY KEY (id),
    CONSTRAINT fk_questions_audit FOREIGN KEY (audit_transition_id)
        REFERENCES audit_transitions (id) ON DELETE CASCADE,
    CONSTRAINT fk_questions_section FOREIGN KEY (section_id)
        REFERENCES test_sections (id) ON DELETE CASCADE
);
CREATE INDEX idx_test_questions_audit ON test_questions (audit_transition_id);
CREATE INDEX idx_test_questions_section ON test_questions (section_id);
CREATE INDEX idx_test_questions_is_key ON test_questions (is_key)
    WHERE is_key = true;
-- Composite untuk fetch soal per audit berurutan (high-traffic saat tes)
CREATE INDEX idx_test_questions_audit_sort
    ON test_questions (audit_transition_id, sort_order);


-- 8. recommendation_library
-- Library rekomendasi: buku, mentor, kelas, ebook, coaching.
-- ============================================================
CREATE SEQUENCE IF NOT EXISTS recommendation_library_id_seq;
CREATE TABLE IF NOT EXISTS recommendation_library (
    id              bigint NOT NULL DEFAULT nextval('recommendation_library_id_seq'),
    type            varchar(30) NOT NULL,
                    -- BUKU | MENTOR | KELAS_INTERNAL | EBOOK | COACHING_ONLINE
                    -- | COACHING_OFFLINE | VIDEO | TOOL | ARTIKEL
    title           varchar(255) NOT NULL,
    author_or_name  varchar(150),
                    -- Penulis (buku) / Nama mentor / Provider kelas
    description     text,
    cover_url       varchar(500),
    external_url    varchar(500),
                    -- Link beli / profil / jadwal
    internal_product_id bigint,
                    -- FK ke upsell_items jika ini produk di dalam platform
    phase_relevance varchar(50),
                    -- Fase paling relevan: "1,2" atau "3" atau "all"
    tags            varchar(500),
                    -- Comma-separated tags untuk filtering
    is_premium      boolean NOT NULL DEFAULT false,
                    -- Apakah rekomendasi ini upsell berbayar
    is_active       boolean NOT NULL DEFAULT true,
    sort_order      smallint NOT NULL DEFAULT 0,
    created_at      timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);
CREATE INDEX idx_reclibrary_type ON recommendation_library (type);
CREATE INDEX idx_reclibrary_internal_product
    ON recommendation_library (internal_product_id)
    WHERE internal_product_id IS NOT NULL;


-- 9. recommendation_triggers
-- Mapping: pertanyaan tertentu → rekomendasi tertentu.
-- Ketika butir dijawab "Tidak", rekomendasi terpicu.
-- ============================================================
CREATE SEQUENCE IF NOT EXISTS recommendation_triggers_id_seq;
CREATE TABLE IF NOT EXISTS recommendation_triggers (
    id                      bigint NOT NULL DEFAULT nextval('recommendation_triggers_id_seq'),
    question_id             bigint NOT NULL,
    recommendation_id       bigint NOT NULL,
    trigger_on_answer       varchar(20) NOT NULL DEFAULT 'TIDAK',
                            -- TIDAK | YA | TIDAK_BERLAKU
    priority                smallint NOT NULL DEFAULT 5,
                            -- 1 (tertinggi) – 10 (terendah)
    is_active               boolean NOT NULL DEFAULT true,
    PRIMARY KEY (id),
    CONSTRAINT fk_rectrigger_question FOREIGN KEY (question_id)
        REFERENCES test_questions (id) ON DELETE CASCADE,
    CONSTRAINT fk_rectrigger_rec FOREIGN KEY (recommendation_id)
        REFERENCES recommendation_library (id) ON DELETE CASCADE
);
CREATE UNIQUE INDEX idx_rectrigger_unique
    ON recommendation_triggers (question_id, recommendation_id, trigger_on_answer);
CREATE INDEX idx_rectrigger_question ON recommendation_triggers (question_id);
CREATE INDEX idx_rectrigger_rec ON recommendation_triggers (recommendation_id);


-- ============================================================
-- SECTION 3: PRODUK & HARGA
-- ============================================================

-- 10. product_categories
-- ============================================================
CREATE SEQUENCE IF NOT EXISTS product_categories_id_seq;
CREATE TABLE IF NOT EXISTS product_categories (
    id          bigint NOT NULL DEFAULT nextval('product_categories_id_seq'),
    code        varchar(50) NOT NULL,
    name        varchar(100) NOT NULL,
    sort_order  smallint NOT NULL DEFAULT 0,
    PRIMARY KEY (id)
);
CREATE UNIQUE INDEX idx_product_categories_code ON product_categories (code);


-- 11. products
-- Produk utama yang dijual di checkout (bukan upsell).
-- Contoh: "Audit Satu Fase", "Audit Lengkap 4 Instrumen"
-- ============================================================
CREATE SEQUENCE IF NOT EXISTS products_id_seq;
CREATE TABLE IF NOT EXISTS products (
    id                  bigint NOT NULL DEFAULT nextval('products_id_seq'),
    category_id         bigint NOT NULL,
    code                varchar(50) NOT NULL,
    name                varchar(200) NOT NULL,
    short_desc          varchar(500),
    long_desc           text,
    type                varchar(30) NOT NULL,
                        -- SINGLE_AUDIT | BUNDLE_AUDIT | COACHING | EBOOK | COURSE
    price               bigint NOT NULL DEFAULT 0,
                        -- Dalam IDR (integer, tidak ada koma)
    price_strikethrough bigint,
                        -- Harga coret (untuk display promo)
    includes_audit_ids  varchar(100),
                        -- Comma-separated audit_transition IDs yang di-include
                        -- Contoh: "1,2,3,4" untuk paket lengkap
    is_featured         boolean NOT NULL DEFAULT false,
    is_active           boolean NOT NULL DEFAULT true,
    sort_order          smallint NOT NULL DEFAULT 0,
    created_at          timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT fk_products_category FOREIGN KEY (category_id)
        REFERENCES product_categories (id) ON DELETE RESTRICT
);
CREATE UNIQUE INDEX idx_products_code ON products (code);
CREATE INDEX idx_products_category ON products (category_id);
CREATE INDEX idx_products_active ON products (is_active)
    WHERE is_active = true;


-- 12. upsell_items
-- Produk yang ditawarkan SETELAH tes (contextual upsell di halaman hasil).
-- Bisa overlap dengan products (jika produk utama juga bisa di-upsell).
-- ============================================================
CREATE SEQUENCE IF NOT EXISTS upsell_items_id_seq;
CREATE TABLE IF NOT EXISTS upsell_items (
    id                  bigint NOT NULL DEFAULT nextval('upsell_items_id_seq'),
    product_id          bigint,
                        -- FK ke products jika ini produk platform
    name                varchar(200) NOT NULL,
    short_desc          varchar(500),
    type                varchar(30) NOT NULL,
                        -- KELAS | EBOOK | COACHING_ONLINE | COACHING_OFFLINE
                        -- | GROUP_MENTORING | BUKU_FISIK | UPGRADE_PAKET
    price               bigint NOT NULL DEFAULT 0,
    cta_label           varchar(100),
                        -- "Daftar Sekarang" / "Beli Ebook" / "Jadwalkan Sesi"
    cta_url             varchar(500),
                        -- External link atau /checkout?product_id=X
    trigger_phase_ids   varchar(50),
                        -- Tampil jika user di fase ini. "1,2" atau "all"
    trigger_condition   varchar(255),
                        -- Kondisi tambahan: "gap_section_B >= 3" dll (text rule)
    is_active           boolean NOT NULL DEFAULT true,
    sort_order          smallint NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    CONSTRAINT fk_upsell_product FOREIGN KEY (product_id)
        REFERENCES products (id) ON DELETE SET NULL
);
CREATE INDEX idx_upsell_product ON upsell_items (product_id)
    WHERE product_id IS NOT NULL;
CREATE INDEX idx_upsell_active ON upsell_items (is_active)
    WHERE is_active = true;


-- ============================================================
-- SECTION 4: PEMBAYARAN (Diadaptasi dari nebeng.sql)
-- ============================================================

-- 13. payment_methods
-- Diadaptasi langsung dari nebeng.sql — struktur dipertahankan.
-- ============================================================
CREATE SEQUENCE IF NOT EXISTS payment_methods_id_seq;
CREATE TABLE IF NOT EXISTS payment_methods (
    id              bigint NOT NULL DEFAULT nextval('payment_methods_id_seq'),
    code            varchar(50) NOT NULL,
                    -- GOPAY | BCA | MANDIRI | BSI | QR_CODE | dll.
    name            varchar(100) NOT NULL,
    logo_url        varchar(500),
    type            varchar(50) NOT NULL,
                    -- E_WALLET | VIRTUAL_ACCOUNT | QR_CODE | RETAIL_OUTLET
                    -- | BANK_TRANSFER | MANUAL
    provider        varchar(50) NOT NULL,
                    -- Xendit | Midtrans | Manual
    admin_fee_flat  bigint NOT NULL DEFAULT 0,
    admin_fee_pct   numeric(5,2) NOT NULL DEFAULT 0.00,
    is_active       boolean NOT NULL DEFAULT true,
    is_redirect     boolean NOT NULL DEFAULT false,
                    -- true = user diarahkan ke URL eksternal (e-wallet deeplink)
    sort_order      smallint NOT NULL DEFAULT 0,
    PRIMARY KEY (id)
);
CREATE UNIQUE INDEX idx_payment_methods_code ON payment_methods (code);
CREATE INDEX idx_payment_methods_active ON payment_methods (is_active)
    WHERE is_active = true;


-- 14. payment_instructions
-- Instruksi pembayaran per metode per channel (mBanking, ATM, iBanking, dll.)
-- Diadaptasi dari nebeng.sql — lengkap dengan HTML content.
-- ============================================================
CREATE SEQUENCE IF NOT EXISTS payment_instructions_id_seq;
CREATE TABLE IF NOT EXISTS payment_instructions (
    id                  bigint NOT NULL DEFAULT nextval('payment_instructions_id_seq'),
    payment_method_id   bigint NOT NULL,
    title               varchar(255) NOT NULL,
                        -- "Pembayaran via mBanking"
    content             text NOT NULL,
                        -- HTML instructions (ol/li steps)
    sort_order          smallint NOT NULL DEFAULT 0,
    created_at          timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT fk_payinstr_method FOREIGN KEY (payment_method_id)
        REFERENCES payment_methods (id) ON DELETE CASCADE
);
CREATE INDEX idx_payinstr_method ON payment_instructions (payment_method_id);


-- ============================================================
-- SECTION 5: TRANSAKSI & ORDER
-- ============================================================

-- 15. orders
-- Invoice / transaksi pembelian produk.
-- Menggantikan konsep "donations" dari nebeng.sql, disesuaikan ke platform tes.
-- ============================================================
CREATE SEQUENCE IF NOT EXISTS orders_id_seq;
CREATE TABLE IF NOT EXISTS orders (
    id                  bigint NOT NULL DEFAULT nextval('orders_id_seq'),
    invoice_code        varchar(50) NOT NULL,
                        -- Format: INV-{YYYYMMDD}-{6RANDOM} e.g. INV-20261005-A3F9B2
    customer_id         bigint NOT NULL,
    payment_method_id   bigint,
    affiliate_id        bigint,
    coupon_code_id      bigint,

    -- Nominal
    subtotal            bigint NOT NULL DEFAULT 0,
    discount_amount     bigint NOT NULL DEFAULT 0,
    admin_fee           bigint NOT NULL DEFAULT 0,
    total_amount        bigint NOT NULL DEFAULT 0,
    currency            varchar(5) NOT NULL DEFAULT 'IDR',

    -- Status
    status              varchar(30) NOT NULL DEFAULT 'PENDING',
                        -- PENDING | PAID | EXPIRED | FAILED | REFUNDED | CANCELLED

    -- Payment gateway data
    payment_type        varchar(50),
                        -- GOPAY | BCA | QR_CODE | dll.
    payment_url         varchar(1000),
                        -- Redirect URL untuk e-wallet
    va_number           varchar(50),
                        -- Nomor VA untuk metode virtual account
    payment_ref         varchar(100),
                        -- Reference ID dari payment gateway (Xendit payment_request_id)
    paid_at             timestamptz,
    expired_at          timestamptz,

    -- Marketing attribution
    utm_source          varchar(100),
    utm_medium          varchar(100),
    utm_campaign        varchar(100),
    fb_click_id         varchar(200),
    fb_browser_id       varchar(200),
    tiktok_click_id     varchar(200),
    google_click_id     varchar(200),

    -- Customer snapshot (untuk laporan historis)
    customer_name       varchar(150),
    customer_email      varchar(150),
    customer_phone      varchar(30),

    created_at          timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    CONSTRAINT fk_orders_customer FOREIGN KEY (customer_id)
        REFERENCES customers (id) ON DELETE RESTRICT,
    CONSTRAINT fk_orders_payment_method FOREIGN KEY (payment_method_id)
        REFERENCES payment_methods (id) ON DELETE SET NULL,
    CONSTRAINT fk_orders_affiliate FOREIGN KEY (affiliate_id)
        REFERENCES affiliates (id) ON DELETE SET NULL,
    CONSTRAINT fk_orders_coupon FOREIGN KEY (coupon_code_id)
        REFERENCES coupon_codes (id) ON DELETE SET NULL
);
CREATE UNIQUE INDEX idx_orders_invoice_code ON orders (invoice_code);
CREATE INDEX idx_orders_customer ON orders (customer_id);
CREATE INDEX idx_orders_status ON orders (status);
CREATE INDEX idx_orders_paid_at ON orders (paid_at DESC)
    WHERE paid_at IS NOT NULL;
-- Untuk query revenue dashboard (sering diakses admin)
CREATE INDEX idx_orders_status_created ON orders (status, created_at DESC);
CREATE INDEX idx_orders_affiliate ON orders (affiliate_id)
    WHERE affiliate_id IS NOT NULL;


-- 16. order_items
-- Detail produk apa yang dibeli dalam satu order.
-- (Satu order bisa multi-produk jika ada paket bundle)
-- ============================================================
CREATE SEQUENCE IF NOT EXISTS order_items_id_seq;
CREATE TABLE IF NOT EXISTS order_items (
    id              bigint NOT NULL DEFAULT nextval('order_items_id_seq'),
    order_id        bigint NOT NULL,
    product_id      bigint NOT NULL,
    product_name    varchar(200) NOT NULL,
                    -- Snapshot nama produk saat beli
    product_type    varchar(30) NOT NULL,
                    -- Snapshot tipe produk saat beli
    quantity        smallint NOT NULL DEFAULT 1,
    unit_price      bigint NOT NULL,
    total_price     bigint NOT NULL,
    -- Metadata: audit transition yang di-unlock oleh item ini
    audit_ids_unlocked varchar(100),
                    -- Comma-separated IDs dari audit_transitions
    PRIMARY KEY (id),
    CONSTRAINT fk_orderitems_order FOREIGN KEY (order_id)
        REFERENCES orders (id) ON DELETE CASCADE,
    CONSTRAINT fk_orderitems_product FOREIGN KEY (product_id)
        REFERENCES products (id) ON DELETE RESTRICT
);
CREATE INDEX idx_order_items_order ON order_items (order_id);
CREATE INDEX idx_order_items_product ON order_items (product_id);


-- 17. payment_logs
-- Log semua komunikasi dengan payment gateway.
-- Diadaptasi langsung dari nebeng.sql.
-- ============================================================
CREATE SEQUENCE IF NOT EXISTS payment_logs_id_seq;
CREATE TABLE IF NOT EXISTS payment_logs (
    id                  bigint NOT NULL DEFAULT nextval('payment_logs_id_seq'),
    invoice_code        varchar(50) NOT NULL,
    order_id            bigint,
    endpoint            varchar(500),
    type                varchar(50),
                        -- PAYMENT_REQUEST | CALLBACK | WEBHOOK | MANUAL_CONFIRM
    request_payload     text,
    response_payload    text,
    http_status         smallint,
    created_at          timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT fk_payment_logs_order FOREIGN KEY (order_id)
        REFERENCES orders (id) ON DELETE SET NULL
);
CREATE INDEX idx_payment_logs_invoice ON payment_logs (invoice_code);
CREATE INDEX idx_payment_logs_order ON payment_logs (order_id)
    WHERE order_id IS NOT NULL;
CREATE INDEX idx_payment_logs_created ON payment_logs (created_at DESC);


-- ============================================================
-- SECTION 6: SESI TES & JAWABAN
-- ============================================================

-- 18. test_sessions
-- Satu sesi = satu customer mengerjakan satu audit_transition.
-- ============================================================
CREATE SEQUENCE IF NOT EXISTS test_sessions_id_seq;
CREATE TABLE IF NOT EXISTS test_sessions (
    id                      bigint NOT NULL DEFAULT nextval('test_sessions_id_seq'),
    customer_id             bigint NOT NULL,
    order_id                bigint NOT NULL,
    audit_transition_id     bigint NOT NULL,

    -- Data pengisian awal (diisi customer sebelum mulai)
    respondent_name         varchar(150),
    company_name            varchar(200),
    business_field          varchar(100),
    business_start_year     smallint,
    external_auditor_name   varchar(150),

    -- Status sesi
    status                  varchar(30) NOT NULL DEFAULT 'NOT_STARTED',
                            -- NOT_STARTED | IN_PROGRESS | COMPLETED | EXPIRED
    current_section_id      bigint,
                            -- Section terakhir yang sedang dikerjakan (untuk resume)
    answered_count          smallint NOT NULL DEFAULT 0,
    total_questions         smallint NOT NULL DEFAULT 0,

    -- Timestamps
    started_at              timestamptz,
    completed_at            timestamptz,
    expired_at              timestamptz,
                            -- Sesi expired jika tidak selesai dalam X hari
    created_at              timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at              timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    CONSTRAINT fk_tsess_customer FOREIGN KEY (customer_id)
        REFERENCES customers (id) ON DELETE RESTRICT,
    CONSTRAINT fk_tsess_order FOREIGN KEY (order_id)
        REFERENCES orders (id) ON DELETE RESTRICT,
    CONSTRAINT fk_tsess_audit FOREIGN KEY (audit_transition_id)
        REFERENCES audit_transitions (id) ON DELETE RESTRICT,
    CONSTRAINT fk_tsess_section FOREIGN KEY (current_section_id)
        REFERENCES test_sections (id) ON DELETE SET NULL
);
-- Satu customer + satu audit = satu sesi aktif (UNIQUE hanya pada status aktif)
CREATE UNIQUE INDEX idx_tsess_customer_audit_active
    ON test_sessions (customer_id, audit_transition_id)
    WHERE status IN ('NOT_STARTED', 'IN_PROGRESS');
CREATE INDEX idx_tsess_customer ON test_sessions (customer_id);
CREATE INDEX idx_tsess_order ON test_sessions (order_id);
CREATE INDEX idx_tsess_audit ON test_sessions (audit_transition_id);
CREATE INDEX idx_tsess_status ON test_sessions (status);
CREATE INDEX idx_tsess_completed ON test_sessions (completed_at DESC)
    WHERE completed_at IS NOT NULL;


-- 19. test_answers
-- Jawaban individual per butir per sesi.
-- Tabel paling besar dan paling sering di-write (auto-save).
-- ============================================================
CREATE SEQUENCE IF NOT EXISTS test_answers_id_seq;
CREATE TABLE IF NOT EXISTS test_answers (
    id              bigint NOT NULL DEFAULT nextval('test_answers_id_seq'),
    session_id      bigint NOT NULL,
    question_id     bigint NOT NULL,
    answer          varchar(20) NOT NULL,
                    -- YA | TIDAK | TIDAK_BERLAKU
    note            text,
                    -- Catatan opsional dari customer
    answered_at     timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT fk_tanswers_session FOREIGN KEY (session_id)
        REFERENCES test_sessions (id) ON DELETE CASCADE,
    CONSTRAINT fk_tanswers_question FOREIGN KEY (question_id)
        REFERENCES test_questions (id) ON DELETE RESTRICT
);
-- Satu jawaban per pertanyaan per sesi (UNIQUE + fast read untuk auto-save check)
CREATE UNIQUE INDEX idx_tanswers_session_question
    ON test_answers (session_id, question_id);
CREATE INDEX idx_tanswers_session ON test_answers (session_id);
-- Untuk scoring engine: fetch semua jawaban TIDAK dalam satu sesi
CREATE INDEX idx_tanswers_session_answer
    ON test_answers (session_id, answer);


-- 20. test_results
-- Hasil akhir keseluruhan per sesi. Dibuat saat sesi completed.
-- ============================================================
CREATE SEQUENCE IF NOT EXISTS test_results_id_seq;
CREATE TABLE IF NOT EXISTS test_results (
    id                      bigint NOT NULL DEFAULT nextval('test_results_id_seq'),
    session_id              bigint NOT NULL,
    customer_id             bigint NOT NULL,
    audit_transition_id     bigint NOT NULL,

    -- Overall scores
    total_questions         smallint NOT NULL,
    total_key_questions     smallint NOT NULL,
    answered_ya             smallint NOT NULL DEFAULT 0,
    answered_tidak          smallint NOT NULL DEFAULT 0,
    answered_na             smallint NOT NULL DEFAULT 0,
    key_ya                  smallint NOT NULL DEFAULT 0,
    key_tidak               smallint NOT NULL DEFAULT 0,

    overall_score           numeric(5,2) NOT NULL,
                            -- Persentase keseluruhan (0–100)
    key_pass                boolean NOT NULL DEFAULT false,
                            -- true = semua butir ★ = Ya
    status                  varchar(30) NOT NULL,
                            -- SIAP_NAIK | HAMPIR | BELUM_SIAP | DALAM_BAHAYA
    from_phase_id           bigint NOT NULL,
    to_phase_id             bigint NOT NULL,

    -- PDF
    pdf_url                 varchar(500),
    pdf_generated_at        timestamptz,

    created_at              timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    CONSTRAINT fk_tresult_session FOREIGN KEY (session_id)
        REFERENCES test_sessions (id) ON DELETE CASCADE,
    CONSTRAINT fk_tresult_customer FOREIGN KEY (customer_id)
        REFERENCES customers (id) ON DELETE RESTRICT,
    CONSTRAINT fk_tresult_audit FOREIGN KEY (audit_transition_id)
        REFERENCES audit_transitions (id) ON DELETE RESTRICT,
    CONSTRAINT fk_tresult_from_phase FOREIGN KEY (from_phase_id)
        REFERENCES phases (id) ON DELETE RESTRICT,
    CONSTRAINT fk_tresult_to_phase FOREIGN KEY (to_phase_id)
        REFERENCES phases (id) ON DELETE RESTRICT
);
CREATE UNIQUE INDEX idx_tresult_session ON test_results (session_id);
CREATE INDEX idx_tresult_customer ON test_results (customer_id);
CREATE INDEX idx_tresult_status ON test_results (status);
-- Untuk analytics: distribusi fase & skor
CREATE INDEX idx_tresult_audit_status
    ON test_results (audit_transition_id, status);
CREATE INDEX idx_tresult_created ON test_results (created_at DESC);


-- 21. result_section_scores
-- Skor per seksi per hasil (untuk chart radar di PDF & UI).
-- ============================================================
CREATE SEQUENCE IF NOT EXISTS result_section_scores_id_seq;
CREATE TABLE IF NOT EXISTS result_section_scores (
    id              bigint NOT NULL DEFAULT nextval('result_section_scores_id_seq'),
    result_id       bigint NOT NULL,
    section_id      bigint NOT NULL,
    total_questions smallint NOT NULL,
    total_key       smallint NOT NULL DEFAULT 0,
    ya_count        smallint NOT NULL DEFAULT 0,
    tidak_count     smallint NOT NULL DEFAULT 0,
    na_count        smallint NOT NULL DEFAULT 0,
    key_ya_count    smallint NOT NULL DEFAULT 0,
    key_tidak_count smallint NOT NULL DEFAULT 0,
    score_pct       numeric(5,2) NOT NULL,
    key_pass        boolean NOT NULL DEFAULT true,
    PRIMARY KEY (id),
    CONSTRAINT fk_rscore_result FOREIGN KEY (result_id)
        REFERENCES test_results (id) ON DELETE CASCADE,
    CONSTRAINT fk_rscore_section FOREIGN KEY (section_id)
        REFERENCES test_sections (id) ON DELETE RESTRICT
);
CREATE UNIQUE INDEX idx_rscore_result_section
    ON result_section_scores (result_id, section_id);
CREATE INDEX idx_rscore_result ON result_section_scores (result_id);


-- 22. result_recommendations
-- Rekomendasi yang ditampilkan untuk setiap hasil tes.
-- Dibuat saat scoring selesai.
-- ============================================================
CREATE SEQUENCE IF NOT EXISTS result_recommendations_id_seq;
CREATE TABLE IF NOT EXISTS result_recommendations (
    id                  bigint NOT NULL DEFAULT nextval('result_recommendations_id_seq'),
    result_id           bigint NOT NULL,
    recommendation_id   bigint NOT NULL,
    triggered_by_q_id   bigint NOT NULL,
                        -- Question yang men-trigger rekomendasi ini
    priority            smallint NOT NULL DEFAULT 5,
    is_key_trigger      boolean NOT NULL DEFAULT false,
                        -- true jika di-trigger oleh butir ★
    is_shown_in_pdf     boolean NOT NULL DEFAULT true,
    PRIMARY KEY (id),
    CONSTRAINT fk_rrec_result FOREIGN KEY (result_id)
        REFERENCES test_results (id) ON DELETE CASCADE,
    CONSTRAINT fk_rrec_library FOREIGN KEY (recommendation_id)
        REFERENCES recommendation_library (id) ON DELETE RESTRICT,
    CONSTRAINT fk_rrec_question FOREIGN KEY (triggered_by_q_id)
        REFERENCES test_questions (id) ON DELETE RESTRICT
);
-- Deduplikasi: satu rekomendasi tidak muncul dobel di satu hasil
CREATE UNIQUE INDEX idx_rrec_result_rec
    ON result_recommendations (result_id, recommendation_id);
CREATE INDEX idx_rrec_result ON result_recommendations (result_id);
CREATE INDEX idx_rrec_priority ON result_recommendations (result_id, priority);


-- ============================================================
-- SECTION 7: PROMOSI — KUPON & AFILIASI
-- ============================================================

-- 23. affiliates
-- Afiliasi / referrer yang mendapat komisi dari setiap penjualan.
-- ============================================================
CREATE SEQUENCE IF NOT EXISTS affiliates_id_seq;
CREATE TABLE IF NOT EXISTS affiliates (
    id              bigint NOT NULL DEFAULT nextval('affiliates_id_seq'),
    customer_id     bigint,
                    -- Jika afiliasi adalah juga customer platform
    name            varchar(150) NOT NULL,
    email           varchar(150) NOT NULL,
    phone           varchar(30),
    code            varchar(30) NOT NULL,
                    -- Kode unik afiliasi (dipakai di URL: ?ref=RIZARZ)
    commission_type varchar(20) NOT NULL DEFAULT 'PERCENTAGE',
                    -- PERCENTAGE | FLAT
    commission_value numeric(10,2) NOT NULL DEFAULT 10.00,
                    -- Persentase (10 = 10%) atau flat IDR
    total_referrals bigint NOT NULL DEFAULT 0,
    total_revenue   bigint NOT NULL DEFAULT 0,
    total_commission bigint NOT NULL DEFAULT 0,
    status          varchar(20) NOT NULL DEFAULT 'ACTIVE',
                    -- ACTIVE | INACTIVE | SUSPENDED
    created_at      timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT fk_affiliate_customer FOREIGN KEY (customer_id)
        REFERENCES customers (id) ON DELETE SET NULL
);
CREATE UNIQUE INDEX idx_affiliates_code ON affiliates (code);
CREATE UNIQUE INDEX idx_affiliates_email ON affiliates (email);
CREATE INDEX idx_affiliates_customer ON affiliates (customer_id)
    WHERE customer_id IS NOT NULL;


-- 24. affiliate_referrals
-- Tracking order mana yang datang dari afiliasi mana.
-- ============================================================
CREATE SEQUENCE IF NOT EXISTS affiliate_referrals_id_seq;
CREATE TABLE IF NOT EXISTS affiliate_referrals (
    id              bigint NOT NULL DEFAULT nextval('affiliate_referrals_id_seq'),
    affiliate_id    bigint NOT NULL,
    order_id        bigint NOT NULL,
    commission_amount bigint NOT NULL DEFAULT 0,
    commission_status varchar(20) NOT NULL DEFAULT 'PENDING',
                    -- PENDING | PAID | CANCELLED
    paid_at         timestamptz,
    created_at      timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT fk_aff_ref_affiliate FOREIGN KEY (affiliate_id)
        REFERENCES affiliates (id) ON DELETE RESTRICT,
    CONSTRAINT fk_aff_ref_order FOREIGN KEY (order_id)
        REFERENCES orders (id) ON DELETE RESTRICT
);
CREATE UNIQUE INDEX idx_aff_ref_order ON affiliate_referrals (order_id);
CREATE INDEX idx_aff_ref_affiliate ON affiliate_referrals (affiliate_id);
CREATE INDEX idx_aff_ref_status ON affiliate_referrals (commission_status);


-- 25. coupon_codes
-- Kode promo/diskon untuk checkout.
-- ============================================================
CREATE SEQUENCE IF NOT EXISTS coupon_codes_id_seq;
CREATE TABLE IF NOT EXISTS coupon_codes (
    id                  bigint NOT NULL DEFAULT nextval('coupon_codes_id_seq'),
    code                varchar(50) NOT NULL,
    description         varchar(255),
    discount_type       varchar(20) NOT NULL,
                        -- PERCENTAGE | FLAT
    discount_value      numeric(10,2) NOT NULL,
    min_purchase        bigint NOT NULL DEFAULT 0,
    max_discount        bigint,
                        -- Maksimum potongan (untuk pct type)
    usage_limit         integer,
                        -- NULL = unlimited
    usage_count         integer NOT NULL DEFAULT 0,
    usage_limit_per_user smallint NOT NULL DEFAULT 1,
    applicable_product_ids varchar(200),
                        -- NULL = all products; atau "1,2,3"
    valid_from          timestamptz NOT NULL,
    valid_until         timestamptz NOT NULL,
    is_active           boolean NOT NULL DEFAULT true,
    created_by          bigint,
                        -- FK ke admins
    created_at          timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT fk_coupon_admin FOREIGN KEY (created_by)
        REFERENCES admins (id) ON DELETE SET NULL
);
CREATE UNIQUE INDEX idx_coupon_code ON coupon_codes (code);
CREATE INDEX idx_coupon_active_dates
    ON coupon_codes (is_active, valid_from, valid_until)
    WHERE is_active = true;


-- 26. coupon_usage
-- Riwayat penggunaan kupon per customer.
-- ============================================================
CREATE SEQUENCE IF NOT EXISTS coupon_usage_id_seq;
CREATE TABLE IF NOT EXISTS coupon_usage (
    id              bigint NOT NULL DEFAULT nextval('coupon_usage_id_seq'),
    coupon_id       bigint NOT NULL,
    customer_id     bigint NOT NULL,
    order_id        bigint NOT NULL,
    discount_applied bigint NOT NULL,
    used_at         timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT fk_coupon_usage_coupon FOREIGN KEY (coupon_id)
        REFERENCES coupon_codes (id) ON DELETE RESTRICT,
    CONSTRAINT fk_coupon_usage_customer FOREIGN KEY (customer_id)
        REFERENCES customers (id) ON DELETE RESTRICT,
    CONSTRAINT fk_coupon_usage_order FOREIGN KEY (order_id)
        REFERENCES orders (id) ON DELETE RESTRICT
);
CREATE UNIQUE INDEX idx_coupon_usage_order ON coupon_usage (order_id);
CREATE INDEX idx_coupon_usage_coupon ON coupon_usage (coupon_id);
CREATE INDEX idx_coupon_usage_customer ON coupon_usage (customer_id);


-- ============================================================
-- SECTION 8: NOTIFIKASI (Diadaptasi dari nebeng.sql)
-- ============================================================

-- 27. notification_templates
-- Template WA & email per event trigger.
-- ============================================================
CREATE SEQUENCE IF NOT EXISTS notification_templates_id_seq;
CREATE TABLE IF NOT EXISTS notification_templates (
    id              bigint NOT NULL DEFAULT nextval('notification_templates_id_seq'),
    event_trigger   varchar(80) NOT NULL,
                    -- ORDER_CREATED | PAYMENT_SUCCESS | PAYMENT_EXPIRED
                    -- | TEST_COMPLETED | PDF_READY | COUPON_REMINDER
    channel         varchar(20) NOT NULL,
                    -- WHATSAPP | EMAIL | BOTH
    subject         varchar(255),
                    -- Subject email (null untuk WA)
    message_content text NOT NULL,
                    -- Template dengan placeholder: {nama}, {invoice}, {nominal}, dll.
    is_active       boolean NOT NULL DEFAULT true,
    created_at      timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);
CREATE UNIQUE INDEX idx_notif_template_trigger_channel
    ON notification_templates (event_trigger, channel);


-- 28. notification_logs
-- Log pengiriman notifikasi.
-- ============================================================
CREATE SEQUENCE IF NOT EXISTS notification_logs_id_seq;
CREATE TABLE IF NOT EXISTS notification_logs (
    id              bigint NOT NULL DEFAULT nextval('notification_logs_id_seq'),
    template_id     bigint,
    invoice_code    varchar(50),
    order_id        bigint,
    session_id      bigint,
    recipient       varchar(150) NOT NULL,
    channel         varchar(20) NOT NULL,
    request_payload text,
    response_payload text,
    status          varchar(20) NOT NULL DEFAULT 'PENDING',
                    -- PENDING | SENT | FAILED | BOUNCED
    error_message   text,
    sent_at         timestamptz,
    created_at      timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT fk_notif_log_template FOREIGN KEY (template_id)
        REFERENCES notification_templates (id) ON DELETE SET NULL,
    CONSTRAINT fk_notif_log_order FOREIGN KEY (order_id)
        REFERENCES orders (id) ON DELETE SET NULL,
    CONSTRAINT fk_notif_log_session FOREIGN KEY (session_id)
        REFERENCES test_sessions (id) ON DELETE SET NULL
);
CREATE INDEX idx_notif_logs_invoice ON notification_logs (invoice_code)
    WHERE invoice_code IS NOT NULL;
CREATE INDEX idx_notif_logs_status ON notification_logs (status);
CREATE INDEX idx_notif_logs_created ON notification_logs (created_at DESC);


-- ============================================================
-- SECTION 9: CMS
-- ============================================================

-- 29. testimonials
-- ============================================================
CREATE SEQUENCE IF NOT EXISTS testimonials_id_seq;
CREATE TABLE IF NOT EXISTS testimonials (
    id              bigint NOT NULL DEFAULT nextval('testimonials_id_seq'),
    customer_id     bigint,
                    -- NULL jika testimonial eksternal (manual)
    name            varchar(100) NOT NULL,
    role            varchar(100),
                    -- "Owner Warung Pak Budi, Bandung"
    photo_url       varchar(500),
    content         text NOT NULL,
    rating          smallint NOT NULL DEFAULT 5,
    video_url       varchar(500),
    business_type   varchar(100),
    is_featured     boolean NOT NULL DEFAULT false,
    is_active       boolean NOT NULL DEFAULT true,
    sort_order      smallint NOT NULL DEFAULT 0,
    created_at      timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT fk_testimonial_customer FOREIGN KEY (customer_id)
        REFERENCES customers (id) ON DELETE SET NULL
);
CREATE INDEX idx_testimonials_featured
    ON testimonials (is_featured, sort_order)
    WHERE is_active = true;
```

---

## Diagram Relasi (Entity Relationship)

```
admins
  └── coupon_codes.created_by

customers
  ├── customer_sessions.customer_id
  ├── orders.customer_id
  ├── test_sessions.customer_id
  ├── test_results.customer_id
  ├── coupon_usage.customer_id
  ├── affiliates.customer_id
  └── testimonials.customer_id

phases
  ├── audit_transitions.from_phase_id
  ├── audit_transitions.to_phase_id
  ├── test_results.from_phase_id
  └── test_results.to_phase_id

audit_transitions
  ├── test_sections.audit_transition_id
  ├── test_questions.audit_transition_id
  ├── test_sessions.audit_transition_id
  └── test_results.audit_transition_id

test_sections
  ├── test_questions.section_id
  └── result_section_scores.section_id

test_questions
  ├── test_answers.question_id
  ├── recommendation_triggers.question_id
  └── result_recommendations.triggered_by_q_id

recommendation_library
  ├── recommendation_triggers.recommendation_id
  ├── result_recommendations.recommendation_id
  └── upsell_items.product_id → products

products
  ├── order_items.product_id
  └── product_categories.id → product_categories

orders
  ├── order_items.order_id
  ├── payment_logs.order_id
  ├── test_sessions.order_id
  ├── coupon_usage.order_id
  ├── affiliate_referrals.order_id
  └── notification_logs.order_id

test_sessions
  ├── test_answers.session_id
  ├── test_results.session_id
  └── notification_logs.session_id

test_results
  ├── result_section_scores.result_id
  └── result_recommendations.result_id

affiliates
  └── affiliate_referrals.affiliate_id

coupon_codes
  └── coupon_usage.coupon_id

payment_methods
  ├── payment_instructions.payment_method_id
  └── orders.payment_method_id
```

---

## Seed Data Realistis

```sql
-- ============================================================
-- SEED DATA — NaikFase Platform
-- ============================================================

-- ============================================================
-- 1. ADMINS
-- ============================================================
INSERT INTO admins (name, email, password_hash, role, status) VALUES
('Riza Zacharias',     'riza@naikfase.id',  '$2b$12$SeedHash001', 'SUPERADMIN', 'ACTIVE'),
('Irvan Admin',        'irvan@naikfase.id', '$2b$12$SeedHash002', 'ADMIN',      'ACTIVE'),
('Rina Keuangan',      'rina@naikfase.id',  '$2b$12$SeedHash003', 'FINANCE',    'ACTIVE'),
('Dinda Konten',       'dinda@naikfase.id', '$2b$12$SeedHash004', 'CONTENT',    'ACTIVE'),
('Bagas Support',      'bagas@naikfase.id', '$2b$12$SeedHash005', 'SUPPORT',    'ACTIVE');


-- ============================================================
-- 2. PHASES
-- ============================================================
INSERT INTO phases (phase_number, code, name_short, name_label, crisis_title, crisis_desc, description, icon_key, color_hex, sort_order) VALUES
(1, 'SURVIVAL',        'Survival',        'Cari Makan',  'Krisis Kepemimpinan',
 'Di fase Survival, owner mengerjakan hampir semuanya sendiri. Itu wajar di awal, tapi menjadi krisis begitu bisnis tumbuh — owner kehabisan tangan & waktu.',
 'Fase paling awal dalam perjalanan bisnis. Fokus utama: membuktikan model bisnis bisa menghasilkan uang secara berulang dan memisahkan keuangan pribadi dari bisnis.',
 'seedling', '#EF4444', 1),

(2, 'CASH_GROWTH',     'Cash Growth',     'Cari Duit',   'Krisis Otonomi',
 'Di fase Cari Duit, kendali yang dulu memenangkan Anda (owner pegang semua) kini MENCEKIK orang-orang yang sudah lebih ahli di bidangnya.',
 'Bisnis sudah menghasilkan uang secara berulang. Saatnya tumbuhkan omset dan profit, mulai delegasikan tugas, dan bangun tim kecil yang produktif.',
 'trending-up', '#F97316', 2),

(3, 'SYSTEMIZE',       'Systemize',       'Bangun Sistem', 'Krisis Kontrol',
 'Delegasi yang sukses di fase lalu kini melahirkan SILO — tiap unit jalan sendiri & owner kehilangan visibilitas.',
 'Bisnis tidak lagi bergantung pada owner untuk operasional harian. SOP, dashboard, dan koordinasi lintas departemen menjadi prioritas utama.',
 'cog', '#EAB308', 3),

(4, 'TALENT_BUILDING', 'Talent Building', 'Cari Talent',  'Krisis Birokrasi',
 'Sistem & kontrol yang memenangkan fase Talent kini berubah jadi birokrasi yang mencekik inisiatif & talent.',
 'Sistem sudah berjalan mandiri. Saatnya fokus membangun pipeline talent dan kaderisasi untuk mempersiapkan ekspansi.',
 'users', '#3B82F6', 4),

(5, 'EXPANSION',       'Expansion',       'Ekspansi',     'Krisis Identitas',
 'Ekspansi membawa risiko terbesar: nilai inti dan identitas bisnis bisa tergerus saat skala bertambah besar.',
 'Bisnis siap untuk digandakan — via cabang, franchise, akuisisi, atau kemitraan. Tantangan: menjaga identitas dan nilai di setiap unit baru.',
 'globe', '#8B5CF6', 5);


-- ============================================================
-- 3. AUDIT TRANSITIONS
-- ============================================================
INSERT INTO audit_transitions (code, from_phase_id, to_phase_id, name, gate_desc, total_questions, total_key_questions, passing_score, sort_order) VALUES
('audit_1_2', 1, 2,
 'Audit Fase 1 → 2: Survival ke Cash Growth',
 'Yang menyeberangkan Anda ke fase Cari Duit: punya MODEL MENGHASILKAN UANG yang BERULANG, memisahkan uang pribadi-bisnis, tahu untung-rugi, dan mulai punya orang yang membantu.',
 92, 9, 80.00, 1),

('audit_2_3', 2, 3,
 'Audit Fase 2 → 3: Cash Growth ke Systemize',
 'Yang menyeberangkan Anda ke fase Sistem adalah MENDELEGASIKAN WEWENANG (bukan sekadar tugas) lalu mulai membangun SOP/struktur.',
 161, 14, 80.00, 2),

('audit_3_4', 3, 4,
 'Audit Fase 3 → 4: Systemize ke Talent Building',
 'Yang menyeberangkan Anda BUKAN menarik semua kembali ke owner, melainkan membangun KOORDINASI (data terintegrasi, audit internal, matriks wewenang) lalu menyiapkan pilar TALENT.',
 63, 15, 80.00, 3),

('audit_4_5', 4, 5,
 'Audit Fase 4 → 5: Talent Building ke Expansion',
 '"Lean Again" — pangkas BEBAN birokrasi sambil MEMPERTAHANKAN kecerdasan sistem. Dua sisi wajib jalan bersama: PANGKAS BIROKRASI + JAGA IDENTITAS.',
 46, 9, 80.00, 4);


-- ============================================================
-- 4. TEST SECTIONS (Audit 1→2 sebagai contoh lengkap)
-- ============================================================
INSERT INTO test_sections (audit_transition_id, code, name, sub_name, sort_order) VALUES
-- Audit 1→2
(1, 'A', 'Produksi / Operasi',        NULL,                    1),
(1, 'B', 'Sales & Marketing',         NULL,                    2),
(1, 'C', 'Keuangan & Akuntansi',      NULL,                    3),
(1, 'D', 'Kepatuhan Dasar',           'Pajak, Legal, BPJS',   4),
(1, 'E', 'Sumber Daya Manusia',       NULL,                    5),
(1, 'F', 'Manajemen',                 NULL,                    6),
(1, 'G', 'R&D & Budaya Kerja',        NULL,                    7),
(1, 'H', 'Kepemimpinan & Syariah',    NULL,                    8),

-- Audit 2→3
(2, 'A', 'Produksi / Operasi',        NULL,                    1),
(2, 'B', 'Marketing & Penjualan',     NULL,                    2),
(2, 'C', 'Keuangan & Akuntansi',      NULL,                    3),
(2, 'D', 'Kepatuhan 2026',            'Pajak & Ketenagakerjaan', 4),
(2, 'E', 'Sumber Daya Manusia',       NULL,                    5),
(2, 'F', 'Manajemen & Sistem',        NULL,                    6),
(2, 'G', 'Sistem Informasi & IT',     NULL,                    7),
(2, 'H', 'R&D / Inovasi',            NULL,                    8),
(2, 'I', 'Kepemimpinan & Talent',     NULL,                    9),

-- Audit 3→4
(3, 'A', 'Produksi / Operasi',        'Sistem Matang',         1),
(3, 'B', 'Marketing & Penjualan',     'Mesin Pertumbuhan',     2),
(3, 'C', 'Keuangan & Akuntansi',      'Cash Ready',            3),
(3, 'D', 'Kepatuhan 2026',            'Korporat',              4),
(3, 'E', 'Human Capital',             'People Ready',          5),
(3, 'F', 'Manajemen & Tata Kelola',   NULL,                    6),
(3, 'G', 'Sistem Informasi & IT',     'System Ready',          7),
(3, 'H', 'Kepemimpinan',              'Transisi Peran Owner',  8),
(3, 'I', 'R&D / Inovasi',            NULL,                    9),
(3, 'J', 'Syariah',                   NULL,                   10),

-- Audit 4→5
(4, 'A', 'Lean Again',                'De-Birokratisasi',      1),
(4, 'B', 'Operasi & Mutu',           'Siap Digandakan',       2),
(4, 'C', 'Keuangan',                  'Ketahanan & Modal',     3),
(4, 'D', 'Kepatuhan 2026',            'Ekspansi',              4),
(4, 'E', 'Kepemimpinan Terdistribusi', NULL,                   5),
(4, 'F', 'Ekspansi & Aliansi',        NULL,                    6),
(4, 'G', 'Identitas & Nilai',         'Jaga Jati Diri',        7),
(4, 'H', 'Sistem Informasi',          'Mendukung Desentralisasi', 8),
(4, 'I', 'Syariah',                   'Puncak yang Tetap Lurus', 9);


-- ============================================================
-- 5. TEST QUESTIONS (Sample — Audit 1→2, Seksi A & B)
-- Dalam implementasi nyata: import dari spreadsheet via script
-- ============================================================
INSERT INTO test_questions
    (audit_transition_id, section_id, question_number, question_text, guidance_text, is_key, sort_order) VALUES
-- Seksi A: Produksi (section_id=1, audit 1)
(1, 1,  1, 'Apakah perusahaan memiliki pemasok/mitra kerja tetap?',                          NULL, false, 1),
(1, 1,  2, 'Apakah produk yang dijual milik sendiri? (jika disuplai/kerjasama: produk aman?)', NULL, false, 2),
(1, 1,  3, 'Apakah belanja bisnis sudah dipisahkan dari belanja pribadi?',
           'Disiplin survival nomor satu.',                                                    true,  3),
(1, 1,  4, 'Apakah pemilik melakukan pengawasan persediaan rutin (stock opname)?',
           'Bulanan/tahunan.',                                                                 false, 4),
(1, 1,  5, 'Apakah persediaan dikategorikan fast moving / slow moving?',                      NULL, false, 5),
(1, 1,  6, 'Apakah ada pemasok/mitra kedua atau ketiga dalam kategori yang sama?',
           'Menghindari risiko ketergantungan.',                                               false, 6),
(1, 1,  7, 'Apakah pemilik mengetahui berapa lama setiap pekerjaan diselesaikan?',            NULL, false, 7),
(1, 1,  8, 'Apakah pemilik bisa membedakan kualitas yang baik dan yang tidak?',
           'Gunakan standar umum kompetisi.',                                                  false, 8),
(1, 1,  9, 'Apakah bahan bermutu rendah bisa dikembalikan ke pemasok?',                       NULL, false, 9),
(1, 1, 10, 'Apakah proses produksi/jasa berjalan lancar & sedikit hambatan?',                 NULL, false, 10),
(1, 1, 11, 'Apakah fasilitas kerja minimal yang diperlukan sudah sesuai?',                    NULL, false, 11),
(1, 1, 12, 'Apakah pemilik mulai mampu menabung untuk membeli peralatan/aset?',               NULL, false, 12),

-- Seksi B: Sales & Marketing (section_id=2, audit 1)
(1, 2, 13, 'Apakah harga produk/jasa sudah ditetapkan dengan tepat?',                         NULL, false, 13),
(1, 2, 14, 'Apakah penetapan harga berbasis struktur biaya standar (COGS/HPP)?',
           'Jual di bawah modal = pembunuh survival paling umum.',                            true,  14),
(1, 2, 15, 'Sudahkah perusahaan mengidentifikasi target pasarnya?',
           'Bisa dibantu Business Model Canvas.',                                              false, 15),
(1, 2, 16, 'Apakah posisi perusahaan mampu mengimbangi pesaing terdekat?',                    NULL, false, 16),
(1, 2, 17, 'Apakah keluhan konsumen sudah minimal/rendah?',                                   NULL, false, 17),
(1, 2, 18, 'Apakah keluhan konsumen ditanggapi cepat & memuaskan?',                           NULL, false, 18),
(1, 2, 19, 'Apakah perusahaan sudah mampu melakukan promosi/iklan?',                          NULL, false, 19),
(1, 2, 20, 'Apakah penjualan via online sudah dikenali & dilakukan?',
           'Pelajari internet marketing & optimasi socmed.',                                   false, 20),
(1, 2, 21, 'Apakah promosi yang dilakukan efektif & berdampak ke omset?',                     NULL, false, 21),
(1, 2, 22, 'Apakah perusahaan memiliki tim penjualan yang produktif?',                        NULL, false, 22),
(1, 2, 23, 'Apakah ada evaluasi capaian omset rutin (minimal pekanan)?',                      NULL, false, 23),
(1, 2, 24, 'Apakah ada target penjualan perorangan?',                                         NULL, false, 24),
(1, 2, 25, 'Apakah perusahaan memiliki rencana pemasaran?',                                   NULL, false, 25),
(1, 2, 26, 'Apakah medsos dipakai sebagai sarana meningkatkan sales?',                        NULL, false, 26),
(1, 2, 27, 'Apakah ada lebih dari 1 kanal penjualan?',                                        NULL, false, 27);

-- Keuangan Fase 1→2 (butir kunci)
INSERT INTO test_questions
    (audit_transition_id, section_id, question_number, question_text, guidance_text, is_key, is_added, sort_order) VALUES
(1, 3, 29, 'Apakah model menghasilkan uang sudah BERULANG (produk + cara yang bisa diulang) — bukan untung sekali lalu seret?',
           'Inilah definisi lulus fase Survival.',                                             true,  true, 29),
(1, 3, 30, 'Apakah owner tahu titik impas (BEP) bulanan — berapa harus terjual untuk menutup semua biaya?',
           'Matematika bertahan hidup.',                                                       true,  true, 30),
(1, 3, 42, 'Apakah ada rekening khusus atas nama usaha?',                                     NULL,  false, true, 42),
(1, 3, 43, 'Apakah pembukuan & rekening bisnis-pribadi dipisahkan?',
           'Konsolidasi dengan butir pemisahan belanja.',                                      true,  false, 43),
(1, 3, 44, 'Apakah perusahaan tahu cara mengukur Laba/Rugi bulanan?',
           'Tak mungkin bertahan kalau tak tahu untung atau rugi.',                            true,  false, 44);

-- SDM Fase 1→2 (butir kunci)
INSERT INTO test_questions
    (audit_transition_id, section_id, question_number, question_text, guidance_text, is_key, sort_order) VALUES
(1, 8, 81, 'Apakah sudah ada team/staf yang membantu pekerjaan-pekerjaan tertentu?',
           'Keluar dari krisis kepemimpinan = berhenti mengerjakan semua sendiri.',            true, 81),
(1, 8, 83, 'Apakah owner memiliki kemauan belajar yang tinggi?',                              NULL, true, 83),
(1, 8, 89, 'Apakah owner jujur, amanah & tidak lari dari masalah/tanggung jawab?',
           'Amanah = reputasi yang dijaga sekuatnya; aset bisnis paling mahal.',               true, 89);


-- ============================================================
-- 6. PRODUCT CATEGORIES
-- ============================================================
INSERT INTO product_categories (code, name, sort_order) VALUES
('AUDIT_TEST',   'Paket Tes Audit Bisnis',   1),
('COACHING',     'Coaching & Mentoring',      2),
('DIGITAL',      'Produk Digital (Ebook/Kelas)', 3),
('BUNDLE',       'Paket Bundel',              4);


-- ============================================================
-- 7. PRODUCTS
-- ============================================================
INSERT INTO products (category_id, code, name, short_desc, type, price, price_strikethrough, includes_audit_ids, is_featured, sort_order) VALUES
(1, 'SINGLE_AUDIT',
 'Audit Satu Fase',
 'Pilih satu instrumen audit (1→2, 2→3, 3→4, atau 4→5) + laporan PDF lengkap.',
 'SINGLE_AUDIT', 197000, 297000, NULL, false, 1),

(4, 'FULL_AUDIT',
 'Audit Lengkap — 4 Instrumen',
 'Akses semua 4 instrumen audit sekaligus. Ketahui posisi eksak bisnismu di seluruh spektrum fase + laporan komprehensif.',
 'BUNDLE_AUDIT', 597000, 988000, '1,2,3,4', true, 2),

(2, 'AUDIT_COACHING',
 'Audit Lengkap + 1 Sesi Coaching',
 'Paket lengkap: 4 instrumen audit + 1 sesi coaching 1:1 bersama mentor Syaamil Group (90 menit via Zoom).',
 'BUNDLE_AUDIT', 1997000, 2994000, '1,2,3,4', false, 3),

(3, 'EBOOK_FASE12',
 'Ebook: Melewati Fase Survival',
 'Panduan praktis membangun fondasi bisnis yang kuat di fase survival. 80+ halaman.',
 'EBOOK', 97000, 197000, NULL, false, 10),

(2, 'COACHING_ONLINE',
 'Sesi Coaching 1:1 Online',
 '90 menit bersama mentor berpengalaman. Khusus membahas gap dari hasil audit kamu.',
 'COACHING', 1500000, NULL, NULL, false, 11),

(2, 'COACHING_OFFLINE',
 'Sesi Coaching Offline — Bandung',
 'Sesi tatap muka 2 jam bersama Riza Zacharias atau mentor Syaamil Group. Lokasi: Bandung.',
 'COACHING', 3000000, NULL, NULL, false, 12);


-- ============================================================
-- 8. PAYMENT METHODS (Lengkap — dari nebeng.sql)
-- ============================================================
INSERT INTO payment_methods (code, name, logo_url, type, provider, admin_fee_flat, admin_fee_pct, is_active, is_redirect, sort_order) VALUES
('QR_CODE',        'QRIS Dynamic',                    'https://upload.wikimedia.org/wikipedia/commons/a/a2/Logo_QRIS.svg',           'QR_CODE',         'Xendit',    0, 0.00, true,  false, 1),
('BSI',            'BSI Virtual Account',             'https://upload.wikimedia.org/wikipedia/commons/a/a0/Bank_Syariah_Indonesia.svg','VIRTUAL_ACCOUNT', 'Xendit',    0, 0.00, true,  false, 2),
('GOPAY',          'GoPay',                           'https://upload.wikimedia.org/wikipedia/commons/8/86/Gopay_logo.svg',           'E_WALLET',        'Xendit',    0, 0.00, true,  true,  3),
('BCA',            'BCA Virtual Account',             'https://assets.naikfase.id/pm/bca.jpg',                                       'VIRTUAL_ACCOUNT', 'Xendit',    0, 0.00, true,  false, 4),
('MANDIRI',        'Mandiri Virtual Account',         'https://assets.naikfase.id/pm/mandiri.png',                                   'VIRTUAL_ACCOUNT', 'Xendit',    0, 0.00, true,  false, 5),
('SHOPEEPAY',      'ShopeePay',                       'https://upload.wikimedia.org/wikipedia/commons/f/fe/Shopee.svg',               'E_WALLET',        'Xendit',    0, 0.00, true,  true,  6),
('DANA',           'DANA',                            'https://upload.wikimedia.org/wikipedia/commons/7/72/Logo_dana_blue.svg',       'E_WALLET',        'Xendit',    0, 0.00, true,  true,  7),
('LINKAJA',        'LinkAja',                         'https://assets.naikfase.id/pm/linkaja.png',                                   'E_WALLET',        'Xendit',    0, 0.00, true,  true,  8),
('BRI',            'BRI Virtual Account',             'https://assets.naikfase.id/pm/bri.png',                                       'VIRTUAL_ACCOUNT', 'Xendit',    0, 0.00, true,  false, 9),
('BNI',            'BNI Virtual Account',             'https://assets.naikfase.id/pm/bni.png',                                       'VIRTUAL_ACCOUNT', 'Xendit',    0, 0.00, true,  false, 10),
('BJB',            'BJB Virtual Account',             'https://assets.naikfase.id/pm/bjb.png',                                       'VIRTUAL_ACCOUNT', 'Xendit',    0, 0.00, true,  false, 11),
('CIMB',           'CIMB Niaga Virtual Account',      'https://assets.naikfase.id/pm/cimb.png',                                      'VIRTUAL_ACCOUNT', 'Xendit',    0, 0.00, true,  false, 12),
('MUAMALAT',       'Muamalat Virtual Account',        'https://assets.naikfase.id/pm/muamalat.png',                                  'VIRTUAL_ACCOUNT', 'Xendit',    0, 0.00, true,  false, 13),
('PERMATA',        'Permata Virtual Account',         'https://assets.naikfase.id/pm/permata.jpg',                                   'VIRTUAL_ACCOUNT', 'Xendit',    0, 0.00, true,  false, 14),
('BNC',            'BNC Virtual Account',             'https://assets.naikfase.id/pm/bnc.webp',                                      'VIRTUAL_ACCOUNT', 'Xendit',    0, 0.00, true,  false, 15),
('ALFAMART',       'Alfamart',                        'https://assets.naikfase.id/pm/alfamart.png',                                  'RETAIL_OUTLET',   'Xendit',    0, 0.00, true,  false, 16),
('INDOMARET',      'Indomaret',                       'https://assets.naikfase.id/pm/indomaret.png',                                 'RETAIL_OUTLET',   'Xendit',    0, 0.00, true,  false, 17),
('BCA_MANUAL',     'BCA (Transfer Manual)',           'https://assets.naikfase.id/pm/bca.jpg',                                       'BANK_TRANSFER',   'Manual',    0, 0.00, true,  false, 18),
('MANDIRI_MANUAL', 'Mandiri (Transfer Manual)',       'https://assets.naikfase.id/pm/mandiri.png',                                   'BANK_TRANSFER',   'Manual',    0, 0.00, true,  false, 19);


-- ============================================================
-- 9. PAYMENT INSTRUCTIONS (BCA sebagai contoh)
-- ============================================================
INSERT INTO payment_instructions (payment_method_id, title, content, sort_order) VALUES
-- BCA VA (id=4)
(4, 'Pembayaran via mBanking BCA',
'<ol><li>Buka aplikasi BCA Mobile</li><li>Pilih m-BCA, lalu pilih m-Transfer</li><li>Masukkan nomor Virtual Account Anda, lalu tekan OK</li><li>Klik tombol Kirim di pojok kanan atas</li><li>Masukkan PIN m-BCA Anda untuk otorisasi transaksi</li></ol>',
1),
(4, 'Pembayaran via ATM BCA',
'<ol><li>Masukkan kartu ATM BCA dan PIN Anda</li><li>Pilih menu Transaksi Lainnya</li><li>Pilih Transfer</li><li>Pilih Ke Rekening BCA Virtual Account</li><li>Masukkan nomor Virtual Account Anda. Tekan Benar</li><li>Konfirmasi detail dan masukkan nominal transfer</li></ol>',
2),

-- BSI VA (id=1, sesuai insert PM di atas)
(2, 'Pembayaran via BYOND BSI',
'<ol><li>Login ke BYOND BSI</li><li>Pilih menu Bayar & Beli</li><li>Cari Xendit, Pilih Prefix VA: 9347 atau 9655</li><li>Masukkan kode (tanpa prefix)</li><li>Masukkan PIN</li><li>Konfirmasi detail pembayaran</li></ol>',
1),

-- QRIS
(1, 'Pembayaran via QRIS',
'<ol><li>Buka aplikasi pembayaran pilihan Anda (GoPay, OVO, DANA, LinkAja, BCA Mobile, dll.)</li><li>Pilih menu Scan / Bayar</li><li>Scan QR Code yang tampil di layar</li><li>Konfirmasi pembayaran dan masukkan PIN Anda</li></ol>',
1),

-- Transfer Manual BCA
(18, 'Instruksi Transfer Manual BCA',
'<ol><li>Transfer sesuai nominal TEPAT (termasuk 3 digit unik terakhir) ke rekening berikut:</li><li><strong>Bank BCA: 0123456789</strong></li><li><strong>Atas Nama: PT Syaamil NaikFase</strong></li><li>Simpan bukti transfer Anda</li><li>Konfirmasi pembayaran via WhatsApp ke 0811-xxxxxx atau upload bukti di halaman status</li></ol>',
1);


-- ============================================================
-- 10. NOTIFICATION TEMPLATES
-- ============================================================
INSERT INTO notification_templates (event_trigger, channel, subject, message_content) VALUES
('ORDER_CREATED',    'WHATSAPP', NULL,
 'Halo {nama}! 👋 Order kamu berhasil dibuat.\n\nDetail Order:\n📌 Invoice: {invoice}\n📦 Produk: {produk}\n💰 Total: Rp {nominal}\n⏰ Batas Bayar: {expired_at}\n\n{instruksi_bayar}\n\nAda pertanyaan? Balas pesan ini. 🙏'),

('PAYMENT_SUCCESS',  'WHATSAPP', NULL,
 '✅ Pembayaran Berhasil!\n\nHalo {nama}, pembayaran kamu sebesar Rp {nominal} via {metode} telah kami terima.\n\n🎯 Invoice: {invoice}\n\nSilakan login ke dashboard kamu untuk mulai mengerjakan audit:\n👉 {dashboard_url}\n\nSemangat, perjalanan naik fase dimulai! 🚀'),

('PAYMENT_SUCCESS',  'EMAIL',    '[NaikFase] Pembayaran Berhasil — Mulai Auditmu Sekarang',
 '<h2>Pembayaran Berhasil! ✅</h2><p>Halo {nama},</p><p>Pembayaran sebesar <strong>Rp {nominal}</strong> untuk <strong>{produk}</strong> telah berhasil kami terima.</p><p><strong>Invoice:</strong> {invoice}</p><p>Klik tombol di bawah untuk masuk ke dashboard dan mulai audit bisnismu:</p><a href="{dashboard_url}" style="background:#3B82F6;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;">Mulai Audit Sekarang →</a><br><br><p>Salam,<br>Tim NaikFase</p>'),

('PAYMENT_EXPIRED',  'WHATSAPP', NULL,
 '⏰ Batas waktu pembayaran untuk order {invoice} telah habis.\n\nIngin melanjutkan pembelian? Kunjungi naikfase.id dan lakukan order baru. Kami tunggu! 🙏'),

('TEST_COMPLETED',   'WHATSAPP', NULL,
 '🎉 Audit Selesai!\n\nHalo {nama}, audit bisnis kamu untuk *{audit_name}* telah selesai.\n\n📊 Skor Kamu: {skor}%\n🏷️ Status: {status}\n\nLaporan PDF kamu sedang disiapkan dan akan dikirim dalam beberapa menit. Pantau di dashboard-mu:\n👉 {dashboard_url}'),

('PDF_READY',        'WHATSAPP', NULL,
 '📄 Laporan PDF Siap!\n\nHalo {nama}, laporan audit bisnismu sudah bisa didownload:\n👉 {pdf_url}\n\nLink aktif selama 7 hari. Semangat naik fase! 🚀\n\n_NaikFase.id — Audit Bisnis · Temukan Fasemu · Naik Level_'),

('PDF_READY',        'EMAIL',    '[NaikFase] Laporan Audit Bisnismu Sudah Siap 📄',
 '<h2>Laporan Auditmu Sudah Siap! 📄</h2><p>Halo {nama},</p><p>Laporan audit bisnis kamu untuk <strong>{audit_name}</strong> sudah selesai digenerate.</p><p><strong>Skor Keseluruhan:</strong> {skor}%<br><strong>Status:</strong> {status}</p><a href="{pdf_url}" style="background:#10B981;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;">Download Laporan PDF →</a><br><br><p>Link aktif selama 7 hari dari tanggal email ini.</p><p>Salam,<br>Tim NaikFase</p>');


-- ============================================================
-- 11. RECOMMENDATION LIBRARY (Sample)
-- ============================================================
INSERT INTO recommendation_library (type, title, author_or_name, description, external_url, phase_relevance, tags, is_premium) VALUES
-- Buku
('BUKU', 'The E-Myth Revisited', 'Michael E. Gerber',
 'Mengapa bisnis kebanyakan gagal dan apa yang harus dilakukan. Wajib baca bagi owner yang masih mengerjakan segalanya sendiri.',
 'https://tokopedia.com/search?q=e-myth+revisited', '1,2', 'sistem,delegasi,franchise', false),

('BUKU', 'Scaling Up', 'Verne Harnish',
 'Framework praktis untuk scaleup bisnis: People, Strategy, Execution, Cash. Relevan untuk fase 3–4.',
 'https://tokopedia.com/search?q=scaling+up+verne', '3,4', 'sistem,scaleup,strategi', false),

('BUKU', 'Good to Great', 'Jim Collins',
 'Apa yang membedakan perusahaan baik dengan perusahaan luar biasa. Klasik wajib fase 3 ke atas.',
 'https://tokopedia.com/search?q=good+to+great+collins', '3,4,5', 'kepemimpinan,strategi,talent', false),

('BUKU', 'Buku Bisnis Syariah Praktis', 'Riza Zacharias',
 'Panduan membangun bisnis berbasis nilai Islam dari founder Syaamil Group. Mencakup muamalah, kepemimpinan, dan keberkahan.',
 'https://naikfase.id/buku', 'all', 'syariah,kepemimpinan,muamalah', false),

('BUKU', 'Traction', 'Gino Wickman',
 'Entrepreneurial Operating System (EOS) untuk mengoperasikan bisnis dengan sistem yang terukur.',
 'https://tokopedia.com/search?q=traction+wickman', '2,3', 'sistem,operasional,EOS', false),

-- Mentor/Coaching
('MENTOR', 'Riza Zacharias', 'Syaamil Group',
 'Owner Syaamil Group | 30+ tahun pengalaman membangun bisnis dari fase survival hingga ekspansi. Ahli bisnis berbasis nilai dan kepemimpinan Islam.',
 'https://naikfase.id/coaching', 'all', 'coaching,kepemimpinan,syariah', true),

-- Kelas Internal (Upsell)
('KELAS_INTERNAL', 'Kelas Membangun Tim Pertamamu', 'NaikFase',
 'Belajar cara merekrut, onboard, dan memotivasi karyawan pertama bisnismu. Untuk owner yang baru melewati fase survival.',
 'https://naikfase.id/kelas/tim-pertama', '1,2', 'SDM,rekrutmen,delegasi', true),

('KELAS_INTERNAL', 'Kelas Keuangan Bisnis untuk Pengusaha', 'NaikFase',
 'Dari laporan L/R sederhana hingga analisis arus kas dan BEP. Tidak perlu background akuntansi.',
 'https://naikfase.id/kelas/keuangan-bisnis', '1,2', 'keuangan,akuntansi,BEP', true),

-- Ebook
('EBOOK', 'Ebook: Panduan BEP & Harga Jual', 'Tim NaikFase',
 'Template Excel + panduan menghitung harga jual yang tepat dan titik impas (BEP) bulanan bisnismu.',
 'https://naikfase.id/ebook/bep-harga', '1,2', 'keuangan,BEP,harga,template', true),

-- Video
('VIDEO', 'Seri YouTube: 5 Fase Bisnis Riza Zacharias', 'Riza Zacharias',
 'Playlist YouTube gratis — penjelasan mendalam 5 fase bisnis dari pengalaman langsung Pak Riza.',
 'https://youtube.com/@rizazacharias', 'all', 'fase,bisnis,gratis', false);


-- ============================================================
-- 12. RECOMMENDATION TRIGGERS (Sample untuk butir kunci)
-- ============================================================
-- Butir #3 (pisah belanja): Tidak → Ebook BEP
INSERT INTO recommendation_triggers (question_id, recommendation_id, trigger_on_answer, priority) VALUES
(3,  8, 'TIDAK', 1),   -- Pisah uang → Ebook BEP & Harga
(3,  7, 'TIDAK', 2),   -- Pisah uang → Kelas Keuangan Bisnis

-- Butir #14 (penetapan harga berbasis HPP)
(14, 8, 'TIDAK', 1),   -- Harga tidak berbasis HPP → Ebook BEP
(14, 7, 'TIDAK', 2),   -- → Kelas Keuangan Bisnis

-- Butir #29 (model uang berulang)
-- question_id disesuaikan dengan urutan actual insert
(17, 9, 'TIDAK', 1),   -- → Ebook BEP & Harga
(17, 1, 'TIDAK', 2),   -- → Buku E-Myth Revisited

-- Butir #81 (ada tim/staf pertama)
(20, 6, 'TIDAK', 1),   -- → Mentor Riza Zacharias
(20, 7, 'TIDAK', 2);   -- → Kelas Tim Pertama


-- ============================================================
-- 13. AFFILIATES (Sample)
-- ============================================================
INSERT INTO affiliates (name, email, phone, code, commission_type, commission_value, status) VALUES
('Riza Zacharias',         'riza.personal@gmail.com',    '08111111001', 'RIZARZA',  'PERCENTAGE', 20.00, 'ACTIVE'),
('Ahmad Mentor Bandung',   'ahmad.mentor@gmail.com',     '08122222001', 'AHMAD20',  'PERCENTAGE', 15.00, 'ACTIVE'),
('Komunitas BisnisBerkah', 'admin@bisnisberkah.com',     '08133333001', 'BBERKAH',  'PERCENTAGE', 10.00, 'ACTIVE');


-- ============================================================
-- 14. COUPON CODES (Sample)
-- ============================================================
INSERT INTO coupon_codes (code, description, discount_type, discount_value, min_purchase, max_discount, usage_limit, valid_from, valid_until, created_by) VALUES
('SYAAMIL30',   'Diskon 30% untuk peserta kelas Syaamil Group',   'PERCENTAGE', 30.00, 100000, 200000, 200, '2026-10-01 00:00:00+07', '2026-12-31 23:59:59+07', 1),
('BUNDEL50K',   'Potongan Rp 50.000 untuk paket Full Audit',      'FLAT',       50000, 500000, NULL,    50, '2026-10-01 00:00:00+07', '2026-11-30 23:59:59+07', 1),
('EARLYBIRD',   'Early Bird — diskon 20% untuk 100 pembeli pertama', 'PERCENTAGE', 20.00, 0, 150000,  100, '2026-10-01 00:00:00+07', '2026-10-31 23:59:59+07', 1);


-- ============================================================
-- 15. CUSTOMERS (Sample realistis)
-- ============================================================
INSERT INTO customers (name, email, phone, business_name, business_field, business_city, status) VALUES
('Budi Santoso',       'budi.santoso@gmail.com',    '081234567001', 'Toko Berkah Mandiri',       'Ritel Sembako',     'Bandung',   'ACTIVE'),
('Siti Rahayu',        'siti.rahayu@yahoo.com',     '081234567002', 'CV Siti Kuliner',            'F&B',               'Surabaya',  'ACTIVE'),
('Hendra Wijaya',      'hendra.w@outlook.com',      '081234567003', 'PT Hendra Kontraktor',       'Konstruksi',        'Jakarta',   'ACTIVE'),
('Nurul Hidayati',     'nurul.h@gmail.com',         '081234567004', 'Butik Nurul Fashion',        'Fashion Muslim',    'Yogyakarta','ACTIVE'),
('Agus Prayitno',      'agus.p@noemail.com',        '081234567005', 'UD Agus Percetakan',         'Percetakan',        'Semarang',  'ACTIVE'),
('Dewi Anggraeni',     'dewi.a@gmail.com',          '081234567006', 'Klinik Kecantikan Dewi',     'Kesehatan/Beauty',  'Bandung',   'ACTIVE'),
('Fajar Nugroho',      'fajar.n@gmail.com',         '081234567007', 'Fajar Digital Agency',       'Jasa Digital',      'Jakarta',   'ACTIVE'),
('Lestari Wahyuni',    'lestari.w@gmail.com',       '081234567008', 'Warung Lestari Catering',    'Katering',          'Medan',     'ACTIVE');


-- ============================================================
-- 16. SAMPLE ORDERS & TEST SESSIONS
-- ============================================================
INSERT INTO orders (invoice_code, customer_id, payment_method_id, subtotal, discount_amount, admin_fee, total_amount, status, payment_type, paid_at, customer_name, customer_email, customer_phone) VALUES
('INV-20261005-A1B2C3', 1, 5, 597000, 0,      0, 597000, 'PAID',    'BSI',     '2026-10-05 09:15:00+07', 'Budi Santoso',    'budi.santoso@gmail.com', '081234567001'),
('INV-20261005-D4E5F6', 2, 3, 197000, 59100,  0, 137900, 'PAID',    'GOPAY',   '2026-10-05 10:30:00+07', 'Siti Rahayu',     'siti.rahayu@yahoo.com',  '081234567002'),
('INV-20261005-G7H8I9', 3, 4, 197000, 0,      0, 197000, 'PENDING', 'BCA',     NULL,                     'Hendra Wijaya',   'hendra.w@outlook.com',   '081234567003'),
('INV-20261005-J0K1L2', 4, 1, 597000, 119400, 0, 477600, 'PAID',    'QR_CODE', '2026-10-05 14:00:00+07', 'Nurul Hidayati',  'nurul.h@gmail.com',      '081234567004');

INSERT INTO order_items (order_id, product_id, product_name, product_type, quantity, unit_price, total_price, audit_ids_unlocked) VALUES
(1, 2, 'Audit Lengkap — 4 Instrumen', 'BUNDLE_AUDIT', 1, 597000, 597000, '1,2,3,4'),
(2, 1, 'Audit Satu Fase',             'SINGLE_AUDIT', 1, 197000, 197000, '1'),
(3, 1, 'Audit Satu Fase',             'SINGLE_AUDIT', 1, 197000, 197000, '1'),
(4, 2, 'Audit Lengkap — 4 Instrumen', 'BUNDLE_AUDIT', 1, 597000, 597000, '1,2,3,4');

INSERT INTO test_sessions (customer_id, order_id, audit_transition_id, respondent_name, company_name, business_field, business_start_year, status, answered_count, total_questions, started_at, completed_at) VALUES
(1, 1, 1, 'Budi Santoso',   'Toko Berkah Mandiri', 'Ritel Sembako',  2019, 'COMPLETED', 92, 92, '2026-10-05 09:30:00+07', '2026-10-05 10:45:00+07'),
(2, 2, 1, 'Siti Rahayu',    'CV Siti Kuliner',      'F&B',            2021, 'IN_PROGRESS', 27, 92, '2026-10-05 11:00:00+07', NULL),
(4, 4, 2, 'Nurul Hidayati', 'Butik Nurul Fashion',  'Fashion Muslim', 2018, 'NOT_STARTED', 0, 161, NULL, NULL);


-- ============================================================
-- 17. TESTIMONIALS
-- ============================================================
INSERT INTO testimonials (name, role, content, rating, business_type, is_featured, sort_order) VALUES
('Budi Santoso',     'Owner Toko Berkah Mandiri, Bandung',
 'Saya pikir sudah cukup maju karena omset sudah stabil. Ternyata setelah tes NaikFase, saya baru sadar kalau masih di Fase 1 karena belum ada tim dan keuangan masih tercampur. Laporan ini membuka mata saya.',
 5, 'Ritel', true, 1),
('Dewi Anggraeni',   'Owner Klinik Kecantikan, Bandung',
 'Yang paling berkesan adalah bagian rekomendasi — langsung spesifik, buku apa yang harus dibaca, mentor siapa yang harus ditemui. Bukan saran generik.',
 5, 'Kesehatan/Beauty', true, 2),
('Fajar Nugroho',    'Founder Digital Agency, Jakarta',
 'Audit ini jauh lebih tajam dari konsultasi biasa. Bisa mengidentifikasi persis di bagian mana saja yang bolong. Worth every rupiah.',
 5, 'Jasa Digital', true, 3),
('Siti Rahayu',      'Owner CV Kuliner, Surabaya',
 'Awalnya saya kira bisnis sudah bagus karena sales naik terus. Tapi ternyata ada 3 butir kunci yang belum terpenuhi. Kini saya punya prioritas yang jelas.',
 4, 'F&B', false, 4);
```

---

## Catatan Implementasi

### 1. Sequence Reset setelah Seed
```sql
-- Reset sequence ke nilai setelah seed agar auto-increment tidak konflik
SELECT setval('admins_id_seq',                   (SELECT MAX(id) FROM admins));
SELECT setval('phases_id_seq',                   (SELECT MAX(id) FROM phases));
SELECT setval('audit_transitions_id_seq',         (SELECT MAX(id) FROM audit_transitions));
SELECT setval('test_sections_id_seq',             (SELECT MAX(id) FROM test_sections));
SELECT setval('test_questions_id_seq',            (SELECT MAX(id) FROM test_questions));
SELECT setval('recommendation_library_id_seq',    (SELECT MAX(id) FROM recommendation_library));
SELECT setval('recommendation_triggers_id_seq',   (SELECT MAX(id) FROM recommendation_triggers));
SELECT setval('products_id_seq',                  (SELECT MAX(id) FROM products));
SELECT setval('product_categories_id_seq',        (SELECT MAX(id) FROM product_categories));
SELECT setval('payment_methods_id_seq',           (SELECT MAX(id) FROM payment_methods));
SELECT setval('payment_instructions_id_seq',      (SELECT MAX(id) FROM payment_instructions));
SELECT setval('customers_id_seq',                 (SELECT MAX(id) FROM customers));
SELECT setval('orders_id_seq',                    (SELECT MAX(id) FROM orders));
SELECT setval('order_items_id_seq',               (SELECT MAX(id) FROM order_items));
SELECT setval('affiliates_id_seq',                (SELECT MAX(id) FROM affiliates));
SELECT setval('coupon_codes_id_seq',              (SELECT MAX(id) FROM coupon_codes));
SELECT setval('notification_templates_id_seq',    (SELECT MAX(id) FROM notification_templates));
SELECT setval('testimonials_id_seq',              (SELECT MAX(id) FROM testimonials));
```

### 2. Foreign Key yang Perlu Dibuat Setelah Tabel Tersedia
```sql
-- customers.affiliate_id → affiliates (circular dependency)
-- Dibuat setelah affiliates exist:
ALTER TABLE customers
    ADD CONSTRAINT fk_customers_affiliate
    FOREIGN KEY (affiliate_id) REFERENCES affiliates (id) ON DELETE SET NULL;

-- recommendation_library.internal_product_id → upsell_items
ALTER TABLE recommendation_library
    ADD CONSTRAINT fk_reclibrary_upsell
    FOREIGN KEY (internal_product_id) REFERENCES upsell_items (id) ON DELETE SET NULL;
```

### 3. High-Traffic Read Query Patterns (Justifikasi Index)

| Query Pattern | Index yang Digunakan |
|---|---|
| Fetch soal per audit saat pengisian tes | `idx_test_questions_audit_sort` |
| Auto-save jawaban (upsert per sesi+soal) | `idx_tanswers_session_question` (UNIQUE) |
| Cek satu sesi aktif per customer+audit | `idx_tsess_customer_audit_active` (partial UNIQUE) |
| Webhook: lookup order by invoice_code | `idx_orders_invoice_code` (UNIQUE) |
| Dashboard admin: order by status | `idx_orders_status_created` |
| Scoring engine: fetch jawaban TIDAK per sesi | `idx_tanswers_session_answer` |
| Rekomendasi: fetch trigger per soal | `idx_rectrigger_question` |
| Analytics: distribusi fase & skor | `idx_tresult_audit_status` |
| Landing page: load testimonial featured | `idx_testimonials_featured` (partial) |

### 4. Import Pertanyaan Lengkap
Dari 4 file spreadsheet, total ~362 pertanyaan perlu diimport via script Node.js/Python menggunakan `xlsx` atau `openpyxl`. Script harus:
- Parse kolom: No, Item Audit, ★Kunci (ada bintang = `is_key = true`), Catatan/Panduan
- Assign ke `section_id` yang tepat berdasarkan heading seksi
- Set `is_added = true` untuk butir yang diberi tanda ＋

### 5. Drizzle ORM Schema File Reference
```
src/
  db/
    schema/
      auth.ts        → admins, customers, customer_sessions
      content.ts     → phases, audit_transitions, test_sections, test_questions
      recs.ts        → recommendation_library, recommendation_triggers
      products.ts    → product_categories, products, upsell_items
      payment.ts     → payment_methods, payment_instructions
      orders.ts      → orders, order_items, payment_logs
      tests.ts       → test_sessions, test_answers, test_results, result_*
      promo.ts       → coupon_codes, coupon_usage, affiliates, affiliate_referrals
      notif.ts       → notification_templates, notification_logs
      cms.ts         → testimonials
    index.ts         → export semua schema
    migrate.ts       → drizzle-kit migrate
    seed.ts          → import seed data
```

---

*ERD ini adalah living document. Update terakhir: Oktober 2026.*
