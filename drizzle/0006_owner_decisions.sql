-- Keputusan owner untuk laporan berikutnya.
-- Tambahan saja: ADD COLUMN / CREATE TABLE / CREATE INDEX / upsert.
-- Tidak ada DROP, TRUNCATE, atau DELETE.
-- Hasil yang sudah tersimpan tetap pdf_version 1 dan tidak dikirimi ulang.
-- Jalankan: npm run db:migrate:0006

ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS nama_sapaan varchar(80);

ALTER TABLE test_results
  ADD COLUMN IF NOT EXISTS pdf_version smallint NOT NULL DEFAULT 1;

ALTER TABLE section_education
  ADD COLUMN IF NOT EXISTS reviewed_by varchar(100),
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz;

ALTER TABLE question_coaching
  ADD COLUMN IF NOT EXISTS reviewed_by varchar(100),
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz;

-- Narasi yang belum disentuh panel tetap DRAFT. PDF tetap membaca draf.
UPDATE report_status_narratives
SET content_status = 'DRAFT'
WHERE edited_in_panel = false AND content_status IS DISTINCT FROM 'DRAFT';

UPDATE section_education
SET content_status = 'DRAFT'
WHERE edited_in_panel = false AND content_status IS DISTINCT FROM 'DRAFT';

UPDATE question_coaching
SET content_status = 'DRAFT'
WHERE edited_in_panel = false AND content_status IS DISTINCT FROM 'DRAFT';

UPDATE phase_report_closings
SET content_status = 'DRAFT'
WHERE edited_in_panel = false AND content_status IS DISTINCT FROM 'DRAFT';

UPDATE section_band_narratives
SET content_status = 'DRAFT'
WHERE edited_in_panel = false AND content_status IS DISTINCT FROM 'DRAFT';

UPDATE question_insights
SET content_status = 'DRAFT'
WHERE edited_in_panel = false AND content_status IS DISTINCT FROM 'DRAFT';

UPDATE action_plan_items
SET content_status = 'DRAFT'
WHERE edited_in_panel = false AND content_status IS DISTINCT FROM 'DRAFT';

UPDATE report_text_blocks
SET content_status = 'DRAFT'
WHERE edited_in_panel = false AND content_status IS DISTINCT FROM 'DRAFT';

-- Sapaan email hasil. Template pesanan tetap memakai {nama}.
UPDATE notification_templates
SET message_content = replace(message_content, 'Halo {nama}', 'Halo {sapaan}'),
    updated_at = NOW()
WHERE event_trigger = 'TEST_RESULT'
  AND edited_in_panel = false
  AND message_content LIKE '%Halo {nama}%';

CREATE TABLE IF NOT EXISTS report_coaches (
  id bigserial PRIMARY KEY,
  code varchar(80) NOT NULL UNIQUE,
  name varchar(200) NOT NULL,
  role_line varchar(200) NOT NULL,
  bio text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  content_status varchar(20) NOT NULL DEFAULT 'DRAFT',
  seed_version integer NOT NULL DEFAULT 1,
  edited_in_panel boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO report_coaches (code, name, role_line, bio, is_active, content_status, seed_version)
VALUES (
  'sim-coach-riza',
  'SIMULASI Riza Zacharias',
  'Owner Syaamil Group',
  '30+ tahun di dunia bisnis. 5 Fase Bisnis, 4 instrumen audit. Audit Bisnis. Temukan Fasemu. Naik Level.',
  true,
  'DRAFT',
  1
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  role_line = EXCLUDED.role_line,
  bio = EXCLUDED.bio,
  seed_version = EXCLUDED.seed_version,
  updated_at = NOW()
WHERE report_coaches.edited_in_panel = false;

-- Produk katalog live tidak diubah. Baris ini simulasi dan dimatikan lewat is_active, bukan DELETE.
INSERT INTO upsell_items (
  product_id, name, short_desc, type, price, cta_label, cta_url, trigger_condition,
  is_active, sort_order, code, content_status, seed_version
)
SELECT p.id, v.name, v.short_desc, v.type, v.price, v.cta_label, v.cta_url, 'always:1',
       true, v.sort_order, v.code, 'DRAFT', 1
FROM (VALUES
  (
    'audit-satu-fase'::varchar,
    'SIMULASI Audit Satu Fase'::varchar,
    'Satu instrumen audit plus laporan PDF. Harga ini simulasi dan mengikuti katalog yang sudah ada.'::varchar,
    'AUDIT'::varchar,
    197000::bigint,
    'Buka halaman'::varchar,
    '/checkout?product=audit-satu-fase'::varchar,
    30::smallint,
    'sim-upsell-audit-satu-fase'::varchar
  ),
  (
    'audit-lengkap'::varchar,
    'SIMULASI Audit Lengkap (4 Instrumen)'::varchar,
    'Semua 4 instrumen plus laporan komprehensif. Harga ini simulasi dan mengikuti katalog yang sudah ada.'::varchar,
    'BUNDLE'::varchar,
    597000::bigint,
    'Buka halaman'::varchar,
    '/checkout?product=audit-lengkap'::varchar,
    31::smallint,
    'sim-upsell-audit-lengkap'::varchar
  ),
  (
    'audit-coaching'::varchar,
    'SIMULASI Audit + Coaching'::varchar,
    'Audit lengkap plus 1 sesi coaching. Harga ini simulasi dan mengikuti katalog yang sudah ada.'::varchar,
    'COACHING'::varchar,
    1997000::bigint,
    'Buka halaman'::varchar,
    '/checkout?product=audit-coaching'::varchar,
    32::smallint,
    'sim-upsell-audit-coaching'::varchar
  )
) AS v(product_code, name, short_desc, type, price, cta_label, cta_url, sort_order, code)
JOIN products p ON p.code = v.product_code
ON CONFLICT (code) DO UPDATE SET
  product_id = EXCLUDED.product_id,
  name = EXCLUDED.name,
  short_desc = EXCLUDED.short_desc,
  type = EXCLUDED.type,
  price = EXCLUDED.price,
  cta_label = EXCLUDED.cta_label,
  cta_url = EXCLUDED.cta_url,
  trigger_condition = EXCLUDED.trigger_condition,
  sort_order = EXCLUDED.sort_order,
  seed_version = EXCLUDED.seed_version,
  updated_at = NOW()
WHERE upsell_items.edited_in_panel = false;

CREATE TABLE IF NOT EXISTS section_videos (
  id bigserial PRIMARY KEY,
  audit_code varchar(20) NOT NULL REFERENCES audit_transitions (code) ON DELETE RESTRICT,
  section_code varchar(5) NOT NULL,
  youtube_url text NOT NULL,
  title text NOT NULL,
  channel_handle varchar(80) NOT NULL DEFAULT '@JalanLangitRiza',
  is_active boolean NOT NULL DEFAULT true,
  content_status varchar(20) NOT NULL DEFAULT 'DRAFT',
  seed_version integer NOT NULL DEFAULT 1,
  edited_in_panel boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_section_videos UNIQUE (audit_code, section_code)
);

-- URL di bawah dicek lewat oEmbed YouTube.
-- author_name = Riza Zacharias, author_url = https://www.youtube.com/@JalanLangitRiza
-- Seksi yang tidak punya video dengan tema yang sama tidak diisi.
INSERT INTO section_videos (audit_code, section_code, youtube_url, title, channel_handle, is_active, content_status, seed_version)
VALUES
  ('audit_1_2', 'B', 'https://www.youtube.com/watch?v=aR1sN06FXmg', $yt$5 KUNCI SUKSES BISNIS: Kunci IV: Deal Maker (Always Find Away to Make Sales) - JL the Series #57$yt$, '@JalanLangitRiza', true, 'DRAFT', 1),
  ('audit_2_3', 'B', 'https://www.youtube.com/watch?v=aR1sN06FXmg', $yt$5 KUNCI SUKSES BISNIS: Kunci IV: Deal Maker (Always Find Away to Make Sales) - JL the Series #57$yt$, '@JalanLangitRiza', true, 'DRAFT', 1),
  ('audit_3_4', 'B', 'https://www.youtube.com/watch?v=aR1sN06FXmg', $yt$5 KUNCI SUKSES BISNIS: Kunci IV: Deal Maker (Always Find Away to Make Sales) - JL the Series #57$yt$, '@JalanLangitRiza', true, 'DRAFT', 1),
  ('audit_1_2', 'E', 'https://www.youtube.com/watch?v=_I-wePzanCA', $yt$5 KUNCI SUKSES BISNIS: Kunci III: Best Talent & Best Team - Jalan Langit The Series #56$yt$, '@JalanLangitRiza', true, 'DRAFT', 1),
  ('audit_2_3', 'E', 'https://www.youtube.com/watch?v=_I-wePzanCA', $yt$5 KUNCI SUKSES BISNIS: Kunci III: Best Talent & Best Team - Jalan Langit The Series #56$yt$, '@JalanLangitRiza', true, 'DRAFT', 1),
  ('audit_2_3', 'I', 'https://www.youtube.com/watch?v=_I-wePzanCA', $yt$5 KUNCI SUKSES BISNIS: Kunci III: Best Talent & Best Team - Jalan Langit The Series #56$yt$, '@JalanLangitRiza', true, 'DRAFT', 1),
  ('audit_3_4', 'E', 'https://www.youtube.com/watch?v=_I-wePzanCA', $yt$5 KUNCI SUKSES BISNIS: Kunci III: Best Talent & Best Team - Jalan Langit The Series #56$yt$, '@JalanLangitRiza', true, 'DRAFT', 1),
  ('audit_3_4', 'H', 'https://www.youtube.com/watch?v=_I-wePzanCA', $yt$5 KUNCI SUKSES BISNIS: Kunci III: Best Talent & Best Team - Jalan Langit The Series #56$yt$, '@JalanLangitRiza', true, 'DRAFT', 1),
  ('audit_4_5', 'E', 'https://www.youtube.com/watch?v=_I-wePzanCA', $yt$5 KUNCI SUKSES BISNIS: Kunci III: Best Talent & Best Team - Jalan Langit The Series #56$yt$, '@JalanLangitRiza', true, 'DRAFT', 1),
  ('audit_1_2', 'G', 'https://www.youtube.com/watch?v=9Wgmp0TWJVQ', $yt$5 KUNCI SUKSES BISNIS: Kunci II: Best Research & Best Planning - Jalan Langit The Series #55$yt$, '@JalanLangitRiza', true, 'DRAFT', 1),
  ('audit_2_3', 'H', 'https://www.youtube.com/watch?v=9Wgmp0TWJVQ', $yt$5 KUNCI SUKSES BISNIS: Kunci II: Best Research & Best Planning - Jalan Langit The Series #55$yt$, '@JalanLangitRiza', true, 'DRAFT', 1),
  ('audit_3_4', 'I', 'https://www.youtube.com/watch?v=9Wgmp0TWJVQ', $yt$5 KUNCI SUKSES BISNIS: Kunci II: Best Research & Best Planning - Jalan Langit The Series #55$yt$, '@JalanLangitRiza', true, 'DRAFT', 1),
  ('audit_4_5', 'C', 'https://www.youtube.com/watch?v=hEppybwxHMY', $yt$Membangun Ketahanan Bisnis di Masa Sulit - PART #1$yt$, '@JalanLangitRiza', true, 'DRAFT', 1)
ON CONFLICT (audit_code, section_code) DO UPDATE SET
  youtube_url = EXCLUDED.youtube_url,
  title = EXCLUDED.title,
  channel_handle = EXCLUDED.channel_handle,
  seed_version = EXCLUDED.seed_version,
  updated_at = NOW()
WHERE section_videos.edited_in_panel = false;
