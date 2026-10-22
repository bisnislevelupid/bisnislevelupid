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

-- Seksi dan butir soal tidak di-seed di sini (placeholder lama bentrok dengan bank soal).
-- 36 seksi, 362 butir, dan 56 butir kunci ada di drizzle/seed_question_bank.sql.
-- Butuh unique index dari drizzle/0002_test_questions_natural_key.sql lebih dulu.
-- Angka total_key_questions di INSERT audit_transitions di atas (9/14/15/9) adalah
-- hitungan ERD lama. seed_question_bank.sql menimpanya menjadi 13/18/16/9.

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

DELETE FROM payment_instructions
WHERE payment_method_id IN (
  SELECT id FROM payment_methods WHERE code IN (
    'QR_CODE','GOPAY','SHOPEEPAY','DANA','LINKAJA','BCA','MANDIRI','BSI','BRI','BNI','BJB','BNC','CIMB','MUAMALAT','PERMATA','ALFAMART','INDOMARET','BCA_MANUAL','MANDIRI_MANUAL'
  )
);

INSERT INTO payment_instructions (payment_method_id, title, content, sort_order)
SELECT m.id, i.title, i.content, i.sort_order
FROM payment_methods m
JOIN (VALUES
  ('BCA', 'Pembayaran via m-BCA', '<ol><li>Buka aplikasi BCA Mobile.</li><li>Pilih m-BCA, lalu m-Transfer.</li><li>Pilih BCA Virtual Account dan masukkan nomor {va}.</li><li>Periksa nama penerima dan nominal {nominal}.</li><li>Masukkan PIN m-BCA untuk mengirim.</li></ol>', 1),
  ('BCA', 'Pembayaran via KlikBCA', '<ol><li>Login ke KlikBCA Individual.</li><li>Pilih Transfer, lalu Transfer ke BCA Virtual Account.</li><li>Masukkan nomor {va}.</li><li>Pastikan nominal {nominal} sudah benar, lalu lanjutkan.</li><li>Masukkan respon KeyBCA dan kode token.</li></ol>', 2),
  ('BCA', 'Pembayaran via ATM BCA', '<ol><li>Masukkan kartu ATM BCA dan PIN.</li><li>Pilih Transaksi Lainnya, Transfer, lalu Ke Rekening BCA Virtual Account.</li><li>Masukkan nomor {va}.</li><li>Layar menampilkan nominal {nominal}. Konfirmasi jika nama penerima sudah benar.</li></ol>', 3),
  ('MANDIRI', 'Pembayaran via Livin'' by Mandiri', '<ol><li>Login ke Livin'' by Mandiri.</li><li>Pilih Transfer Rupiah ke penerima baru.</li><li>Masukkan nomor virtual account {va}.</li><li>Konfirmasi nominal {nominal}, lalu lanjutkan.</li><li>Masukkan MPIN.</li></ol>', 1),
  ('MANDIRI', 'Pembayaran via ATM Mandiri', '<ol><li>Masukkan kartu ATM, pilih bahasa, lalu masukkan PIN.</li><li>Pilih Bayar, lalu Multi Payment.</li><li>Masukkan kode perusahaan 88608 (Xendit), lalu nomor {va}.</li><li>Masukkan atau konfirmasi nominal {nominal}.</li><li>Konfirmasi detail pembayaran.</li></ol>', 2),
  ('BRI', 'Pembayaran via BRImo', '<ol><li>Login ke BRImo.</li><li>Pilih Pembayaran, lalu BRIVA.</li><li>Masukkan nomor {va}.</li><li>Masukkan nominal {nominal} dan PIN, lalu kirim.</li></ol>', 1),
  ('BRI', 'Pembayaran via ATM BRI', '<ol><li>Masukkan kartu ATM, pilih bahasa, lalu masukkan PIN.</li><li>Pilih Lainnya, Pembayaran, Pembayaran Lainnya, lalu BRIVA.</li><li>Masukkan nomor {va} dan nominal {nominal}.</li><li>Konfirmasi detail pembayaran.</li></ol>', 2),
  ('BNI', 'Pembayaran via BNI Mobile', '<ol><li>Login ke BNI Mobile Banking.</li><li>Pilih Transfer, Virtual Account Billing, lalu rekening pendebetan.</li><li>Masukkan nomor {va}. Nominal {nominal} muncul di layar.</li><li>Konfirmasi dan masukkan password transaksi.</li></ol>', 1),
  ('BNI', 'Pembayaran via BNI Internet Banking', '<ol><li>Login ke ibank.bni.co.id.</li><li>Pilih Transfer, lalu Virtual Account Billing.</li><li>Masukkan nomor {va} dan pilih rekening.</li><li>Periksa nominal {nominal}, lalu masukkan token.</li></ol>', 2),
  ('BNI', 'Pembayaran via ATM BNI', '<ol><li>Masukkan kartu ATM, pilih bahasa, lalu masukkan PIN.</li><li>Pilih Menu Lain, Transfer, lalu pilih jenis rekening.</li><li>Masukkan nomor {va}. Nominal {nominal} tampil di layar.</li><li>Konfirmasi pembayaran.</li></ol>', 3),
  ('BJB', 'Pembayaran via BJB Mobile', '<ol><li>Buka BJB Digi dan masuk.</li><li>Pilih Virtual Account.</li><li>Pilih rekening sumber, lalu masukkan nomor {va}.</li><li>Konfirmasi nominal {nominal}.</li></ol>', 1),
  ('BJB', 'Pembayaran via BJB Net', '<ol><li>Buka ib.bankbjb.co.id dan masuk.</li><li>Pilih Virtual Account dan rekening sumber.</li><li>Masukkan nomor {va}.</li><li>Konfirmasi nominal {nominal}.</li></ol>', 2),
  ('BJB', 'Pembayaran via ATM BJB', '<ol><li>Masukkan kartu ATM BJB dan PIN.</li><li>Pilih Transaksi Lainnya, lalu Virtual Account.</li><li>Pilih rekening sumber dan masukkan nomor {va}.</li><li>Periksa nominal {nominal}, lalu konfirmasi.</li></ol>', 3),
  ('BNC', 'Pembayaran via neobank BNC', '<ol><li>Login ke aplikasi BNC atau neobank.</li><li>Pilih Hematpay VA.</li><li>Masukkan nomor {va} dan nominal {nominal}.</li><li>Konfirmasi lalu masukkan PIN.</li></ol>', 1),
  ('BNC', 'Pembayaran via ATM', '<ol><li>Masukkan kartu ATM dan PIN.</li><li>Pilih pembayaran virtual account.</li><li>Masukkan nomor {va} dan nominal {nominal}.</li><li>Konfirmasi lalu masukkan PIN.</li></ol>', 2),
  ('BSI', 'Pembayaran via BYOND BSI', '<ol><li>Login ke BYOND by BSI.</li><li>Pilih Bayar dan Beli, cari Xendit.</li><li>Pilih prefix 9347 atau 9655 sesuai nomor {va}.</li><li>Masukkan sisa nomor tanpa prefix, lalu PIN.</li><li>Konfirmasi nominal {nominal}.</li></ol>', 1),
  ('BSI', 'Pembayaran via BSI Net', '<ol><li>Login ke BSI Net.</li><li>Pilih Pembayaran, sumber dana, lalu institusi.</li><li>Cari Xendit (kode 9347) dan masukkan nomor {va}.</li><li>Konfirmasi nominal {nominal} dan masukkan token.</li></ol>', 2),
  ('BSI', 'Pembayaran via ATM BSI', '<ol><li>Masukkan kartu ATM dan PIN.</li><li>Pilih Pembayaran atau Pembelian, lalu Institusi.</li><li>Masukkan nomor {va}.</li><li>Konfirmasi nominal {nominal}.</li></ol>', 3),
  ('BSI', 'Pembayaran dari bank lain', '<ol><li>Login ke bank Anda.</li><li>Pilih transfer ke Bank Syariah Indonesia.</li><li>Masukkan kode bank 451 diikuti nomor {va} bila kanal meminta kode bank terpisah, atau tempel nomor VA utuh jika kanal sudah memilih BSI.</li><li>Masukkan nominal {nominal} dan konfirmasi transfer online.</li></ol>', 4),
  ('CIMB', 'Pembayaran via OCTO Mobile', '<ol><li>Buka OCTO Mobile dan masuk.</li><li>Pilih Transfer, lalu ke rekening CIMB Niaga lain.</li><li>Masukkan nomor {va} sebagai rekening tujuan baru.</li><li>Masukkan nominal {nominal}, konfirmasi, lalu masukkan password.</li></ol>', 1),
  ('CIMB', 'Pembayaran via ATM CIMB', '<ol><li>Masukkan kartu ATM dan PIN.</li><li>Pilih Transfer ke CIMB Niaga lain.</li><li>Masukkan nomor {va} dan nominal {nominal}.</li><li>Konfirmasi transaksi.</li></ol>', 2),
  ('CIMB', 'Pembayaran via OCTO Clicks', '<ol><li>Login ke OCTO Clicks.</li><li>Pilih Transfer ke CIMB Niaga lain.</li><li>Masukkan nomor {va} dan nominal {nominal}.</li><li>Konfirmasi dan masukkan password.</li></ol>', 3),
  ('MUAMALAT', 'Pembayaran via MDIN', '<ol><li>Login ke MDIN.</li><li>Pilih Beli atau Bayar, tagihan, lalu Virtual Account.</li><li>Masukkan nomor {va} dan nominal {nominal}.</li><li>Konfirmasi lalu masukkan PIN.</li></ol>', 1),
  ('MUAMALAT', 'Pembayaran via Muamalat DIN', '<ol><li>Login ke internet banking Muamalat.</li><li>Pilih Pembayaran, lalu Virtual Account.</li><li>Masukkan nomor {va} dan nominal {nominal}.</li><li>Konfirmasi lalu masukkan PIN.</li></ol>', 2),
  ('MUAMALAT', 'Pembayaran via ATM Muamalat', '<ol><li>Masukkan kartu ATM dan PIN.</li><li>Pilih Pembayaran, lalu Virtual Account.</li><li>Masukkan nomor {va} dan nominal {nominal}.</li><li>Konfirmasi lalu masukkan PIN.</li></ol>', 3),
  ('PERMATA', 'Pembayaran via PermataMobile X', '<ol><li>Login ke PermataMobile X.</li><li>Pilih Pembayaran Tagihan, lalu Virtual Account.</li><li>Masukkan nomor {va}.</li><li>Periksa nominal {nominal} dan masukkan token.</li></ol>', 1),
  ('PERMATA', 'Pembayaran via PermataNet', '<ol><li>Login ke PermataNet.</li><li>Pilih Pembayaran Tagihan, lalu Virtual Account.</li><li>Masukkan nomor {va}.</li><li>Konfirmasi nominal {nominal} dan masukkan token SMS.</li></ol>', 2),
  ('PERMATA', 'Pembayaran via ATM Permata', '<ol><li>Masukkan kartu ATM dan PIN.</li><li>Pilih Transaksi Lainnya, Pembayaran, Pembayaran Lainnya, lalu Virtual Account.</li><li>Masukkan nomor {va}.</li><li>Konfirmasi nominal {nominal} dan masukkan PIN.</li></ol>', 3),
  ('ALFAMART', 'Pembayaran di Alfamart Group', '<ol><li>Kode ini berlaku di Alfamart, Alfamidi, Dan+Dan, dan Lawson.</li><li>Pembayaran di bawah Rp2,5 juta bisa di keempat gerai. Di atas Rp2,5 juta tidak tersedia di Alfamidi.</li><li>Datang sebelum kode kedaluwarsa.</li><li>Minta kasir memproses pembayaran BisnisLevelUp.id via Xendit, atau minta mereka memindai barcode.</li><li>Tunjukkan kode {kode} dan pastikan nominal {nominal}.</li><li>Tunai paling banyak Rp2,5 juta. Sisanya harus memakai kartu debit, kartu prabayar, atau e-wallet.</li><li>Simpan struk.</li></ol>', 1),
  ('INDOMARET', 'Pembayaran di Indomaret', '<ol><li>Datang ke Indomaret sebelum kode kedaluwarsa.</li><li>Beritahu kasir Anda membayar BisnisLevelUp.id via Xendit.</li><li>Sebutkan kode {kode}.</li><li>Bayar nominal {nominal} yang tertera, lalu simpan struk.</li></ol>', 1),
  ('QR_CODE', 'Pembayaran via QRIS', '<ol><li>Buka GoPay, OVO, DANA, LinkAja, ShopeePay, atau mobile banking.</li><li>Pilih Scan atau Bayar.</li><li>Arahkan kamera ke QR di halaman pembayaran.</li><li>Pastikan nominal {nominal}, lalu masukkan PIN.</li></ol>', 1),
  ('GOPAY', 'Pembayaran via GoPay', '<ol><li>Popup GoPay terbuka setelah checkout.</li><li>Selesaikan pembayaran di aplikasi GoPay sebesar {nominal}.</li><li>Jika popup tertutup, buka lagi dari halaman pembayaran.</li></ol>', 1),
  ('SHOPEEPAY', 'Pembayaran via ShopeePay', '<ol><li>Di halaman pembayaran, pilih lanjut ke ShopeePay.</li><li>Aplikasi atau halaman ShopeePay terbuka.</li><li>Selesaikan pembayaran sebesar {nominal}.</li></ol>', 1),
  ('DANA', 'Pembayaran via DANA', '<ol><li>Di halaman pembayaran, pilih lanjut ke DANA.</li><li>Aplikasi atau halaman DANA terbuka.</li><li>Selesaikan pembayaran sebesar {nominal}.</li></ol>', 1),
  ('LINKAJA', 'Pembayaran via LinkAja', '<ol><li>Di halaman pembayaran, pilih lanjut ke LinkAja.</li><li>Aplikasi atau halaman LinkAja terbuka.</li><li>Selesaikan pembayaran sebesar {nominal}.</li></ol>', 1),
  ('BCA_MANUAL', 'Transfer manual BCA', '<ol><li>Transfer tepat {nominal}, termasuk digit unik di belakang, ke rekening BCA.</li><li>Nomor rekening {rekening}.</li><li>Atas nama {atas_nama}.</li><li>Simpan bukti transfer. Admin mencocokkan nominal unik ini.</li></ol>', 1),
  ('MANDIRI_MANUAL', 'Transfer manual Mandiri', '<ol><li>Transfer tepat {nominal}, termasuk digit unik di belakang, ke rekening Mandiri.</li><li>Nomor rekening {rekening}.</li><li>Atas nama {atas_nama}.</li><li>Simpan bukti transfer. Admin mencocokkan nominal unik ini.</li></ol>', 1)
) AS i(code, title, content, sort_order) ON m.code = i.code;

INSERT INTO coupon_codes (code, description, discount_type, discount_value, min_purchase, valid_from, valid_until, is_active)
SELECT 'LEVELUP10', 'Diskon 10 persen', 'PERCENTAGE', 10, 0, NOW() - INTERVAL '1 day', NOW() + INTERVAL '365 days', true
WHERE NOT EXISTS (SELECT 1 FROM coupon_codes WHERE code = 'LEVELUP10');

INSERT INTO notification_templates (event_trigger, channel, subject, message_content) VALUES
('ORDER_CREATED', 'EMAIL', 'Instruksi pembayaran {invoice}', $email$<div style="font-family:Arial,Helvetica,sans-serif;color:#0f172a;background:#ffffff;border-radius:18px;overflow:hidden;border:1px solid #e2e8f0;">
<div style="background:#064e3b;padding:26px 28px;">
<div style="color:#a7f3d0;font-size:12px;letter-spacing:0.16em;font-weight:700;">BISNISLEVELUP.ID</div>
<div style="color:#ecfdf5;font-size:13px;margin-top:8px;">Menunggu pembayaran</div>
<div style="color:#ffffff;font-size:24px;line-height:1.3;font-weight:700;margin-top:6px;">Selesaikan pembayaran Anda</div>
</div>
<div style="padding:28px;">
<p style="margin:0 0 14px;font-size:15px;line-height:1.6;">Halo {nama},</p>
<p style="margin:0 0 18px;font-size:15px;line-height:1.6;color:#334155;">Pesanan <strong>{produk}</strong> sudah kami catat. Bayar sebelum batas waktu agar akses audit langsung terbuka.</p>
<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;padding:16px 18px;margin:0 0 18px;">
<div style="font-size:12px;color:#64748b;font-weight:700;letter-spacing:0.04em;">RINGKASAN</div>
<div style="margin-top:10px;font-size:14px;line-height:1.7;">Invoice <strong>{invoice}</strong><br>Metode <strong>{metode}</strong><br>Batas bayar <strong>{batas}</strong></div>
<div style="margin-top:12px;font-size:22px;font-weight:700;color:#064e3b;">{nominal}</div>
</div>
<div style="margin:0 0 18px;font-size:14px;line-height:1.6;color:#334155;">{instruksi}</div>
<a href="{bayar_url}" style="display:inline-block;background:#059669;color:#ffffff;text-decoration:none;font-weight:700;padding:12px 20px;border-radius:999px;">Buka halaman pembayaran</a>
</div>
<div style="background:#f8fafc;padding:16px 28px;color:#64748b;font-size:12px;line-height:1.5;">Audit fase bisnis untuk pengusaha Indonesia. Email ini terkait pesanan atau hasil tes di akun Anda.</div>
</div>$email$),
('ORDER_PAID', 'EMAIL', 'Pembayaran {invoice} diterima', $email$<div style="font-family:Arial,Helvetica,sans-serif;color:#0f172a;background:#ffffff;border-radius:18px;overflow:hidden;border:1px solid #e2e8f0;">
<div style="background:#064e3b;padding:26px 28px;">
<div style="color:#a7f3d0;font-size:12px;letter-spacing:0.16em;font-weight:700;">BISNISLEVELUP.ID</div>
<div style="color:#ecfdf5;font-size:13px;margin-top:8px;">Pembayaran diterima</div>
<div style="color:#ffffff;font-size:24px;line-height:1.3;font-weight:700;margin-top:6px;">Audit Anda sudah terbuka</div>
</div>
<div style="padding:28px;">
<p style="margin:0 0 14px;font-size:15px;line-height:1.6;">Halo {nama},</p>
<p style="margin:0 0 18px;font-size:15px;line-height:1.6;color:#334155;">Pembayaran untuk <strong>{produk}</strong> sudah masuk. Anda bisa mulai checklist dari akun.</p>
<div style="background:#ecfdf5;border:1px solid #a7f3d0;border-radius:14px;padding:16px 18px;margin:0 0 18px;">
<div style="font-size:12px;color:#047857;font-weight:700;letter-spacing:0.04em;">LUNAS</div>
<div style="margin-top:10px;font-size:14px;line-height:1.7;">Invoice <strong>{invoice}</strong><br>Metode <strong>{metode}</strong></div>
<div style="margin-top:12px;font-size:22px;font-weight:700;color:#064e3b;">{nominal}</div>
</div>
<a href="{dashboard_url}" style="display:inline-block;background:#059669;color:#ffffff;text-decoration:none;font-weight:700;padding:12px 20px;border-radius:999px;">Masuk dan mulai audit</a>
</div>
<div style="background:#f8fafc;padding:16px 28px;color:#64748b;font-size:12px;line-height:1.5;">Audit fase bisnis untuk pengusaha Indonesia. Email ini terkait pesanan atau hasil tes di akun Anda.</div>
</div>$email$),
('ORDER_PAID', 'WA', NULL, 'Halo {nama}, pembayaran {invoice} sebesar {nominal} berhasil. Tim kami akan menghubungi Anda untuk mulai audit.'),
('TEST_RESULT', 'EMAIL', 'Hasil audit {audit_name} siap diunduh', $email$<div style="font-family:Arial,Helvetica,sans-serif;color:#0f172a;background:#ffffff;border-radius:18px;overflow:hidden;border:1px solid #e2e8f0;">
<div style="background:#064e3b;padding:26px 28px;">
<div style="color:#a7f3d0;font-size:12px;letter-spacing:0.16em;font-weight:700;">BISNISLEVELUP.ID</div>
<div style="color:#ecfdf5;font-size:13px;margin-top:8px;">Hasil diagnosis</div>
<div style="color:#ffffff;font-size:24px;line-height:1.3;font-weight:700;margin-top:6px;">{audit_name}</div>
</div>
<div style="padding:28px;">
<p style="margin:0 0 14px;font-size:15px;line-height:1.6;">Halo {nama},</p>
<p style="margin:0 0 18px;font-size:15px;line-height:1.6;color:#334155;">Audit sudah selesai. Laporan PDF terlampir di email ini dan bisa diunduh dari tombol di bawah.</p>
<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;padding:16px 18px;margin:0 0 12px;">
<div style="font-size:12px;color:#64748b;font-weight:700;">SKOR</div>
<div style="font-size:28px;font-weight:700;color:#064e3b;margin-top:6px;">{skor}%</div>
</div>
<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;padding:16px 18px;margin:0 0 18px;">
<div style="font-size:12px;color:#64748b;font-weight:700;">STATUS</div>
<div style="font-size:18px;font-weight:700;color:#0f172a;margin-top:8px;">{status}</div>
</div>
<a href="{pdf_url}" style="display:inline-block;background:#059669;color:#ffffff;text-decoration:none;font-weight:700;padding:12px 20px;border-radius:999px;">Unduh laporan PDF</a>
<a href="{dashboard_url}" style="display:inline-block;margin-left:8px;color:#047857;font-weight:700;text-decoration:none;padding:12px 8px;">Lihat di akun</a>
</div>
<div style="background:#f8fafc;padding:16px 28px;color:#64748b;font-size:12px;line-height:1.5;">Audit fase bisnis untuk pengusaha Indonesia. Email ini terkait pesanan atau hasil tes di akun Anda.</div>
</div>$email$)
ON CONFLICT (event_trigger, channel) DO UPDATE
SET subject = EXCLUDED.subject,
    message_content = EXCLUDED.message_content,
    updated_at = NOW()
WHERE notification_templates.channel = 'EMAIL'
  AND notification_templates.message_content NOT LIKE '%border-radius:18px%';

INSERT INTO notification_templates (event_trigger, channel, subject, message_content) VALUES
('ORDER_CREATED', 'WA', NULL, $wa$Halo {nama},

Pesanan *{produk}* menunggu pembayaran.

Invoice: {invoice}
Metode: {metode}
Nominal: {nominal}
Batas: {batas}

{instruksi}

Bayar di: {bayar_url}

— BisnisLevelUp.id$wa$),
('ORDER_PAID', 'WA', NULL, $wa$Halo {nama},

Pembayaran *{nominal}* untuk *{produk}* sudah kami terima.

Invoice: {invoice}
Metode: {metode}

Mulai audit: {dashboard_url}

— BisnisLevelUp.id$wa$),
('TEST_RESULT', 'WA', NULL, $wa$Halo {nama},

Audit *{audit_name}* sudah selesai.

Skor: {skor}%
Status: {status}

Unduh laporan: {pdf_url}

— BisnisLevelUp.id$wa$)
ON CONFLICT (event_trigger, channel) DO UPDATE
SET message_content = EXCLUDED.message_content,
    updated_at = NOW()
WHERE notification_templates.channel = 'WA'
  AND notification_templates.message_content NOT LIKE '%— BisnisLevelUp.id%';

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
