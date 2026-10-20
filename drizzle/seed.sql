INSERT INTO admins (name, email, password_hash, role, status) VALUES
('Riza Zacharias', 'riza@bisnislevelup.id', '$2b$12$SeedHash001', 'SUPERADMIN', 'ACTIVE'),
('Irvan Admin', 'irvan@bisnislevelup.id', '$2b$12$SeedHash002', 'ADMIN', 'ACTIVE')
ON CONFLICT (email) DO NOTHING;

INSERT INTO phases (phase_number, code, name_short, name_label, crisis_title, crisis_desc, description, icon_key, color_hex, sort_order) VALUES
(1, 'SURVIVAL', 'Survival', 'Cari Makan', 'Krisis Kepemimpinan', 'Owner mengerjakan hampir semuanya sendiri.', 'Fase paling awal. Buktikan model bisnis berulang dan pisahkan keuangan pribadi.', 'seedling', '#EF4444', 1),
(2, 'CASH_GROWTH', 'Cash Growth', 'Cari Duit', 'Krisis Otonomi', 'Kendali owner mulai mencekik orang yang lebih ahli.', 'Omset berulang. Delegasikan dan tumbuhkan profit.', 'trending-up', '#F97316', 2),
(3, 'SYSTEMIZE', 'Systemize', 'Bangun Sistem', 'Krisis Kontrol', 'Delegasi melahirkan silo.', 'SOP dan dashboard menjadi prioritas.', 'cog', '#EAB308', 3),
(4, 'TALENT_BUILDING', 'Talent Building', 'Cari Talent', 'Krisis Birokrasi', 'Sistem berubah jadi birokrasi.', 'Bangun pipeline talent.', 'users', '#3B82F6', 4),
(5, 'EXPANSION', 'Expansion', 'Ekspansi', 'Krisis Identitas', 'Nilai inti bisa tergerus saat skala bertambah.', 'Gandakan bisnis tanpa kehilangan identitas.', 'globe', '#8B5CF6', 5)
ON CONFLICT (code) DO NOTHING;

INSERT INTO audit_transitions (code, from_phase_id, to_phase_id, name, gate_desc, total_questions, total_key_questions, passing_score, sort_order)
SELECT v.code, fp.id, tp.id, v.name, v.gate_desc, v.total_questions, v.total_key_questions, 80.00, v.sort_order
FROM (VALUES
  ('audit_1_2', 1, 2, 'Audit Fase 1 ke 2: Survival ke Cash Growth', 'Model menghasilkan uang yang berulang, pisah uang pribadi, dan mulai punya orang yang membantu.', 92, 9, 1),
  ('audit_2_3', 2, 3, 'Audit Fase 2 ke 3: Cash Growth ke Systemize', 'Mendelegasikan wewenang lalu membangun SOP.', 161, 14, 2),
  ('audit_3_4', 3, 4, 'Audit Fase 3 ke 4: Systemize ke Talent Building', 'Koordinasi data dan pilar talent.', 63, 15, 3),
  ('audit_4_5', 4, 5, 'Audit Fase 4 ke 5: Talent Building ke Expansion', 'Pangkas birokrasi sambil jaga identitas.', 46, 9, 4)
) AS v(code, from_n, to_n, name, gate_desc, total_questions, total_key_questions, sort_order)
JOIN phases fp ON fp.phase_number = v.from_n
JOIN phases tp ON tp.phase_number = v.to_n
ON CONFLICT (code) DO NOTHING;

INSERT INTO test_sections (audit_transition_id, code, name, sort_order)
SELECT a.id, s.code, s.name, s.sort_order
FROM audit_transitions a
JOIN (VALUES
  ('A','Produksi / Operasi',1),
  ('B','Sales & Marketing',2),
  ('C','Keuangan',3),
  ('D','SDM',4),
  ('E','Kepemimpinan',5),
  ('F','Pelanggan',6),
  ('G','Legal & Administrasi',7),
  ('H','Visi & Strategi',8)
) AS s(code, name, sort_order) ON true
WHERE a.code = 'audit_1_2'
ON CONFLICT (audit_transition_id, code) DO NOTHING;

INSERT INTO test_questions (audit_transition_id, section_id, question_number, question_text, is_key, sort_order)
SELECT a.id, sec.id, q.num, q.text, q.is_key, q.num
FROM audit_transitions a
JOIN test_sections sec ON sec.audit_transition_id = a.id AND sec.code = 'C'
JOIN (VALUES
  (9, 'Apakah Anda sudah menghitung titik impas (BEP) bisnis ini?', true),
  (11, 'Apakah kas usaha sudah dipisah dari kas pribadi?', true),
  (12, 'Apakah Anda tahu laba bersih bulan lalu?', false)
) AS q(num, text, is_key) ON true
WHERE a.code = 'audit_1_2'
AND NOT EXISTS (
  SELECT 1 FROM test_questions tq
  WHERE tq.audit_transition_id = a.id AND tq.question_number = q.num
);

INSERT INTO recommendation_library (type, title, author_or_name, description, is_active, sort_order)
SELECT 'BUKU', 'The E-Myth Revisited', 'Michael E. Gerber', 'Bekerja pada bisnis, bukan hanya di dalam bisnis.', true, 1
WHERE NOT EXISTS (SELECT 1 FROM recommendation_library WHERE title = 'The E-Myth Revisited');

INSERT INTO product_categories (code, name, sort_order) VALUES
('AUDIT', 'Audit Fase', 1),
('COACHING', 'Coaching', 2)
ON CONFLICT (code) DO NOTHING;

INSERT INTO products (category_id, code, name, short_desc, type, price, price_strikethrough, includes_audit_ids, is_featured, sort_order)
SELECT c.id, p.code, p.name, p.short_desc, p.type, p.price, p.strike, p.audits, p.featured, p.sort_order
FROM product_categories c
JOIN (VALUES
  ('AUDIT', 'audit-satu-fase', 'Audit Satu Fase', 'Satu instrumen audit plus laporan PDF.', 'SINGLE_AUDIT', 197000::bigint, 350000::bigint, '1', false, 1),
  ('AUDIT', 'audit-lengkap', 'Audit Lengkap (4 Instrumen)', 'Semua 4 instrumen plus laporan komprehensif.', 'BUNDLE_AUDIT', 597000::bigint, 997000::bigint, '1,2,3,4', true, 2),
  ('COACHING', 'audit-coaching', 'Audit + Coaching', 'Audit lengkap plus 1 sesi coaching 1:1.', 'COACHING', 1997000::bigint, NULL::bigint, '1,2,3,4', false, 3)
) AS p(cat, code, name, short_desc, type, price, strike, audits, featured, sort_order)
ON c.code = p.cat
ON CONFLICT (code) DO NOTHING;

INSERT INTO payment_methods (code, name, logo_url, type, provider, is_active, is_redirect, sort_order, account_number, account_holder) VALUES
('QR_CODE', 'QRIS', 'https://upload.wikimedia.org/wikipedia/commons/a/a2/Logo_QRIS.svg', 'qr_code', 'Xendit', true, false, 1, NULL, NULL),
('BSI', 'BSI Virtual Account', 'https://upload.wikimedia.org/wikipedia/commons/a/a0/Bank_Syariah_Indonesia.svg', 'va', 'Xendit', true, false, 2, NULL, NULL),
('GOPAY', 'GoPay', 'https://upload.wikimedia.org/wikipedia/commons/8/86/Gopay_logo.svg', 'E-Wallet', 'Midtrans', true, false, 3, NULL, NULL),
('BCA', 'BCA Virtual Account', 'https://upload.wikimedia.org/wikipedia/commons/5/5c/Bank_Central_Asia.svg', 'va', 'Xendit', true, false, 4, NULL, NULL),
('MANDIRI', 'Mandiri Virtual Account', 'https://upload.wikimedia.org/wikipedia/commons/a/ad/Bank_Mandiri_logo_2016.svg', 'va', 'Xendit', true, false, 5, NULL, NULL),
('SHOPEEPAY', 'ShopeePay', 'https://upload.wikimedia.org/wikipedia/commons/f/fe/Shopee.svg', 'E-Wallet', 'Xendit', true, true, 6, NULL, NULL),
('DANA', 'DANA', 'https://upload.wikimedia.org/wikipedia/commons/7/72/Logo_dana_blue.svg', 'E-Wallet', 'Xendit', true, true, 7, NULL, NULL),
('LINKAJA', 'LinkAja', 'https://upload.wikimedia.org/wikipedia/commons/8/85/LinkAja.svg', 'E-Wallet', 'Xendit', true, true, 8, NULL, NULL),
('BRI', 'BRI Virtual Account', 'https://upload.wikimedia.org/wikipedia/commons/6/68/BANK_BRI_logo.svg', 'va', 'Xendit', true, false, 9, NULL, NULL),
('BNI', 'BNI Virtual Account', 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/72/Logo_BNI_46.svg/320px-Logo_BNI_46.svg.png', 'va', 'Xendit', true, false, 10, NULL, NULL),
('BJB', 'BJB Virtual Account', 'https://upload.wikimedia.org/wikipedia/commons/2/2b/Bank_BJB_logo.svg', 'va', 'Xendit', true, false, 11, NULL, NULL),
('BNC', 'BNC Virtual Account', 'https://upload.wikimedia.org/wikipedia/commons/4/4e/Bank_Neo_Commerce.png', 'va', 'Xendit', true, false, 12, NULL, NULL),
('CIMB', 'CIMB Niaga Virtual Account', 'https://upload.wikimedia.org/wikipedia/commons/3/3a/CIMB_Niaga_logo.svg', 'va', 'Xendit', true, false, 13, NULL, NULL),
('MUAMALAT', 'Muamalat Virtual Account', 'https://upload.wikimedia.org/wikipedia/commons/8/8e/Bank_Muamalat_logo.svg', 'va', 'Xendit', true, false, 14, NULL, NULL),
('PERMATA', 'Permata Virtual Account', 'https://upload.wikimedia.org/wikipedia/commons/d/d1/PermataBank_logo.svg', 'va', 'Xendit', true, false, 15, NULL, NULL),
('ALFAMART', 'Alfamart', 'https://upload.wikimedia.org/wikipedia/commons/9/9e/Alfamart_logo.svg', 'retail_outlet', 'Xendit', true, false, 16, NULL, NULL),
('INDOMARET', 'Indomaret', 'https://upload.wikimedia.org/wikipedia/commons/9/9d/Indomaret_logo.svg', 'retail_outlet', 'Xendit', true, false, 17, NULL, NULL),
('BCA_MANUAL', 'BCA (Transfer Manual)', 'https://upload.wikimedia.org/wikipedia/commons/5/5c/Bank_Central_Asia.svg', 'bank_transfer', 'Manual', true, false, 18, '1234567890', 'PT Bisnis Level Up'),
('MANDIRI_MANUAL', 'Mandiri (Transfer Manual)', 'https://upload.wikimedia.org/wikipedia/commons/a/ad/Bank_Mandiri_logo_2016.svg', 'bank_transfer', 'Manual', true, false, 19, '9876543210', 'PT Bisnis Level Up')
ON CONFLICT (code) DO NOTHING;

INSERT INTO payment_instructions (payment_method_id, title, content, sort_order)
SELECT m.id, i.title, i.content, i.sort_order
FROM payment_methods m
JOIN (VALUES
  ('QR_CODE', 'Bayar dengan QRIS', 'Scan kode QR di halaman ini memakai aplikasi e-wallet atau mobile banking.', 1),
  ('BCA_MANUAL', 'Transfer ke rekening BCA', 'Transfer tepat sesuai nominal unik ke rekening yang tercantum. Tiga digit terakhir membedakan pembayaran Anda.', 1),
  ('MANDIRI_MANUAL', 'Transfer ke rekening Mandiri', 'Transfer tepat sesuai nominal unik ke rekening yang tercantum. Tiga digit terakhir membedakan pembayaran Anda.', 1),
  ('BCA', 'Bayar Virtual Account BCA', 'Salin nomor VA dan nominal, lalu bayar lewat m-BCA, KlikBCA, atau ATM.', 1),
  ('ALFAMART', 'Bayar di Alfamart', 'Tunjukkan kode pembayaran ke kasir sebelum kode kedaluwarsa.', 1),
  ('INDOMARET', 'Bayar di Indomaret', 'Tunjukkan kode pembayaran ke kasir sebelum kode kedaluwarsa.', 1)
) AS i(code, title, content, sort_order) ON m.code = i.code
WHERE NOT EXISTS (
  SELECT 1 FROM payment_instructions pi WHERE pi.payment_method_id = m.id AND pi.title = i.title
);

INSERT INTO coupon_codes (code, description, discount_type, discount_value, min_purchase, valid_from, valid_until, is_active)
SELECT 'LEVELUP10', 'Diskon 10 persen', 'PERCENTAGE', 10, 0, NOW() - INTERVAL '1 day', NOW() + INTERVAL '365 days', true
WHERE NOT EXISTS (SELECT 1 FROM coupon_codes WHERE code = 'LEVELUP10');

INSERT INTO notification_templates (event_trigger, channel, subject, message_content) VALUES
('ORDER_PAID', 'EMAIL', 'Pembayaran BisnisLevelUp.id diterima', 'Halo {nama}, pembayaran invoice {invoice} sebesar {nominal} sudah kami terima.'),
('ORDER_PAID', 'WA', NULL, 'Halo {nama}, pembayaran {invoice} sebesar {nominal} berhasil. Tim kami akan menghubungi Anda untuk mulai audit.')
ON CONFLICT (event_trigger, channel) DO NOTHING;

INSERT INTO testimonials (name, role, content, rating, business_type, is_featured, is_active, sort_order)
SELECT 'Sari Wulandari', 'Owner katering, Bandung', 'Saya baru sadar kelas yang saya beli selama ini untuk fase yang salah.', 5, 'F&B', true, true, 1
WHERE NOT EXISTS (SELECT 1 FROM testimonials WHERE name = 'Sari Wulandari');

INSERT INTO site_settings (key, value) VALUES
('site_title', 'BisnisLevelUp.id'),
('site_description', 'Audit fase bisnis untuk pengusaha Indonesia. Temukan fase bisnismu dan rekomendasi yang relevan.'),
('og_title', 'BisnisLevelUp.id — Temukan Fase Bisnismu'),
('og_description', 'Checklist YA/TIDAK yang mendiagnosis fase bisnis dan memberi rekomendasi personal.'),
('favicon_url', ''),
('og_image_url', '')
ON CONFLICT (key) DO NOTHING;
