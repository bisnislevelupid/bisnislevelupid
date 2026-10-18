import type { Phase, AuditTransition, TestSection, TestQuestion, RecommendationItem, Product, PaymentMethod, Customer, Order } from './types';

export const phasesData: Phase[] = [
  {
    id: 1,
    phase_number: 1,
    code: 'SURVIVAL',
    name_short: 'Survival',
    name_label: 'Cari Makan',
    crisis_title: 'Krisis Kepemimpinan',
    crisis_desc: 'Owner mengerjakan hampir semuanya sendiri. Menjadi krisis saat bisnis tumbuh namun kehabisan nafas & tangan.',
    description: 'Fase paling awal. Fokus: membuktikan model menghasilkan uang secara berulang & memisahkan uang pribadi.',
    icon_key: 'seedling',
    color_hex: '#EF4444'
  },
  {
    id: 2,
    phase_number: 2,
    code: 'CASH_GROWTH',
    name_short: 'Cash Growth',
    name_label: 'Cari Duit',
    crisis_title: 'Krisis Otonomi',
    crisis_desc: 'Kendali yang dulu memenangkan owner kini mencekik orang-orang ahli yang direkrut karena owner enggan melepas kendali.',
    description: 'Bisnis stabil menghasilkan cash flow. Saatnya tumbuhkan omset, mulai delegasi wewenang, dan bentuk tim kunci.',
    icon_key: 'trending-up',
    color_hex: '#F97316'
  },
  {
    id: 3,
    phase_number: 3,
    code: 'SYSTEMIZE',
    name_short: 'Systemize',
    name_label: 'Bangun Sistem',
    crisis_title: 'Krisis Kontrol',
    crisis_desc: 'Delegasi melahirkan silo antar-unit. Tiap departemen jalan sendiri dan owner kehilangan visibilitas riil.',
    description: 'Bisnis mandiri dari kehadiran fisik harian owner. SOP, dashboard live metric, dan integrasi lintas divisi mutlak.',
    icon_key: 'cog',
    color_hex: '#EAB308'
  },
  {
    id: 4,
    phase_number: 4,
    code: 'TALENT_BUILDING',
    name_short: 'Talent Building',
    name_label: 'Cari Talent',
    crisis_title: 'Krisis Birokrasi',
    crisis_desc: 'Sistem dan kontrol yang ketat kini berubah menjadi birokrasi kaku yang mematikan inisiatif inovasi para talenta hebat.',
    description: 'Kaderisasi kepemimpinan masa depan, pipeline talent executive, dan budaya inovasi otonom.',
    icon_key: 'users',
    color_hex: '#3B82F6'
  },
  {
    id: 5,
    phase_number: 5,
    code: 'EXPANSION',
    name_short: 'Expansion',
    name_label: 'Ekspansi',
    crisis_title: 'Krisis Identitas',
    crisis_desc: 'Ekspansi agresif (cabang, franchise, M&A) mengikis jati diri dan nilai-nilai fundamental perusahaan.',
    description: 'Duplikasi skala bisnis ke berbagai wilayah sambil menjaga kelurusan nilai, syariah, dan fondasi kepemimpinan.',
    icon_key: 'globe',
    color_hex: '#8B5CF6'
  }
];

export const auditTransitionsData: AuditTransition[] = [
  {
    id: 1,
    code: 'audit_1_2',
    from_phase_id: 1,
    to_phase_id: 2,
    name: 'Audit Fase 1 ke 2: Survival → Cash Growth',
    gate_desc: 'Model uang berulang, pemisahan uang pribadi-bisnis, kepastian BEP bulanan, dan tim pembantu pertama.',
    total_questions: 92,
    total_key_questions: 9,
    passing_score: 80.0
  },
  {
    id: 2,
    code: 'audit_2_3',
    from_phase_id: 2,
    to_phase_id: 3,
    name: 'Audit Fase 2 ke 3: Cash Growth → Systemize',
    gate_desc: 'Delegasi wewenang (bukan sekadar lempar tugas), pembentukan SOP tertulis, dan manajemen kas cadangan.',
    total_questions: 161,
    total_key_questions: 14,
    passing_score: 80.0
  },
  {
    id: 3,
    code: 'audit_3_4',
    from_phase_id: 3,
    to_phase_id: 4,
    name: 'Audit Fase 3 ke 4: Systemize → Talent Building',
    gate_desc: 'Membangun koordinasi integrasi data, audit internal, matriks wewenang, dan talent pool kepemimpinan.',
    total_questions: 63,
    total_key_questions: 15,
    passing_score: 80.0
  },
  {
    id: 4,
    code: 'audit_4_5',
    from_phase_id: 4,
    to_phase_id: 5,
    name: 'Audit Fase 4 ke 5: Talent Building → Expansion',
    gate_desc: 'Pangkas beban birokrasi berlebih (Lean Again) tanpa merusak kepatuhan, serta penjagaan identitas & nilai luhur.',
    total_questions: 46,
    total_key_questions: 9,
    passing_score: 80.0
  }
];

export const sampleSections: TestSection[] = [
  { id: 1, audit_transition_id: 1, code: 'A', name: 'Produksi / Operasi', sub_name: 'Stabilitas & Standar' },
  { id: 2, audit_transition_id: 1, code: 'B', name: 'Sales & Marketing', sub_name: 'Penjualan Berulang' },
  { id: 3, audit_transition_id: 1, code: 'C', name: 'Keuangan & Akuntansi', sub_name: 'Pemisahan Kas & BEP' },
  { id: 4, audit_transition_id: 1, code: 'D', name: 'Kepatuhan Dasar', sub_name: 'Legalitas & Pajak' },
  { id: 5, audit_transition_id: 1, code: 'E', name: 'Sumber Daya Manusia', sub_name: 'Tim Pertama' },
  { id: 6, audit_transition_id: 1, code: 'F', name: 'Manajemen & Tata Kerja', sub_name: 'Disiplin Harian' },
  { id: 7, audit_transition_id: 1, code: 'G', name: 'R&D / Budaya Usaha', sub_name: 'Perbaikan Produk' },
  { id: 8, audit_transition_id: 1, code: 'H', name: 'Kepemimpinan & Syariah', sub_name: 'Amanah & Visi' }
];

export const sampleQuestions: TestQuestion[] = [
  {
    id: 1,
    audit_transition_id: 1,
    section_id: 1,
    question_number: 1,
    question_text: 'Apakah perusahaan memiliki pemasok atau mitra kerja utama yang tetap?',
    guidance_text: 'Memastikan rantai pasok tidak berpindah-pindah setiap order baru datang.',
    is_key: false
  },
  {
    id: 2,
    audit_transition_id: 1,
    section_id: 1,
    question_number: 2,
    question_text: 'Apakah produk/jasa yang dijual memiliki kepastian pasokan dan kualitas aman?',
    guidance_text: 'Tidak terjadi komplain berulang karena cacat produk dari suplier.',
    is_key: false
  },
  {
    id: 3,
    audit_transition_id: 1,
    section_id: 1,
    question_number: 3,
    question_text: 'Apakah belanja operasional bisnis sudah dipisahkan 100% dari belanja kebutuhan pribadi?',
    guidance_text: '★ SYARAT MUTLAK SURVIVAL: Pencampuran uang dapur dan uang toko adalah pembunuh bisnis #1.',
    is_key: true
  },
  {
    id: 4,
    audit_transition_id: 1,
    section_id: 1,
    question_number: 4,
    question_text: 'Apakah pemilik melakukan pengawasan persediaan/stok opname secara terjadwal?',
    guidance_text: 'Minimal dilakukan tiap akhir pekan atau bulanan secara konsisten.',
    is_key: false
  },
  {
    id: 5,
    audit_transition_id: 1,
    section_id: 2,
    question_number: 5,
    question_text: 'Apakah penetapan harga jual sudah berbasis hitungan struktur biaya standar (COGS/HPP)?',
    guidance_text: '★ SYARAT MUTLAK: Bukan asal ikut harga pasar tanpa menghitung margin bersih riil.',
    is_key: true
  },
  {
    id: 6,
    audit_transition_id: 1,
    section_id: 2,
    question_number: 6,
    question_text: 'Apakah profil target konsumen ideal (buyer persona) sudah didefinisikan dengan jelas?',
    guidance_text: 'Tahu siapa yang membeli, mengapa membeli, dan di mana mereka berada.',
    is_key: false
  },
  {
    id: 7,
    audit_transition_id: 1,
    section_id: 2,
    question_number: 7,
    question_text: 'Apakah ada minimal 2 kanal penjualan (channel) yang aktif mengalirkan pelanggan?',
    guidance_text: 'Contoh: Toko fisik + WhatsApp, atau Shopee + Instagram.',
    is_key: false
  },
  {
    id: 8,
    audit_transition_id: 1,
    section_id: 3,
    question_number: 8,
    question_text: 'Apakah model menghasilkan uang sudah BERULANG (Repeatable Cash Model)?',
    guidance_text: '★ SYARAT MUTLAK: Bukan penjualan kebetulan satu kali, melainkan siklus penjualan yang dapat diulang tiap bulan.',
    is_key: true
  },
  {
    id: 9,
    audit_transition_id: 1,
    section_id: 3,
    question_number: 9,
    question_text: 'Apakah pemilik bisnis mengetahui angka Break Even Point (BEP) bulanan secara presisi?',
    guidance_text: '★ SYARAT MUTLAK: Tahu persis berapa unit atau rupiah minimum yang wajib terjual untuk menutup seluruh biaya tetap.',
    is_key: true
  },
  {
    id: 10,
    audit_transition_id: 1,
    section_id: 3,
    question_number: 10,
    question_text: 'Apakah ada rekening bank terpisah atas nama usaha (bukan campur rekening tabungan keluarga)?',
    guidance_text: 'Uang masuk dan keluar bisnis tidak bercampur dengan pengeluaran rumah tangga.',
    is_key: false
  },
  {
    id: 11,
    audit_transition_id: 1,
    section_id: 5,
    question_number: 11,
    question_text: 'Apakah sudah ada minimal 1-2 staf/tim pembantu yang didelegasikan tugas operasional teknis?',
    guidance_text: '★ SYARAT MUTLAK: Keluar dari jebakan krisis kepemimpinan fase 1 dengan tidak mengerjakan semua hal sendirian.',
    is_key: true
  },
  {
    id: 12,
    audit_transition_id: 1,
    section_id: 8,
    question_number: 12,
    question_text: 'Apakah pemilik menjunjung tinggi komitmen amanah, kejujuran hutang piutang, dan etika syariah?',
    guidance_text: '★ SYARAT MUTLAK: Reputasi dan integritas adalah modal terbesar kelangsungan usaha jangka panjang.',
    is_key: true
  }
];

export const productsData: Product[] = [
  {
    id: 1,
    code: 'SINGLE_AUDIT',
    name: 'Audit Satu Fase',
    short_desc: 'Pilih 1 instrumen audit spesifik sesuai estimasi fasemu saat ini, termasuk evaluasi komprehensif & PDF.',
    type: 'SINGLE_AUDIT',
    price: 197000,
    price_strikethrough: 297000,
    badge: 'Mulai Cepat',
    features: [
      'Akses 1 instrumen audit pilihan (misal: Fase 1 ke 2)',
      'Checklist lengkap butir kunci gerbang (★)',
      'Diagnosis otomatis krisis & gap bisnis',
      'Download Laporan PDF Eksekutif 12+ Halaman',
      'Rekomendasi kurikulum buku & langkah 30 hari'
    ]
  },
  {
    id: 2,
    code: 'FULL_AUDIT',
    name: 'Audit Lengkap — 4 Instrumen',
    short_desc: 'Akses penuh seluruh 4 instrumen audit (362 butir) untuk memetakan kesehatan bisnis dari Survival hingga Ekspansi.',
    type: 'BUNDLE_AUDIT',
    price: 597000,
    price_strikethrough: 988000,
    badge: 'Paling Direkomendasikan',
    features: [
      'Akses SEMUA 4 Instrumen Audit (Fase 1→2, 2→3, 3→4, 4→5)',
      'Radar evaluasi menyeluruh 8 dimensi bisnis',
      'Diagnosis titik rawan krisis di setiap jenjang',
      'Roadmap mitigasi 30 - 60 - 90 hari',
      'Download Laporan PDF Komprehensif Berwarna',
      'Akses prioritas rilis fitur modul & benchmark industri'
    ]
  },
  {
    id: 3,
    code: 'AUDIT_COACHING',
    name: 'Audit Lengkap + 1 Sesi Coaching',
    short_desc: 'Audit 4 instrumen lengkap ditambah 1 sesi 1:1 Coaching intensif (90 menit via Zoom) bersama mentor bisnis Syaamil Group.',
    type: 'COACHING',
    price: 1997000,
    price_strikethrough: 2994000,
    badge: 'Executive VIP',
    features: [
      'Semua benefit Paket Audit Lengkap 4 Instrumen',
      '1 Sesi Private Mentoring 1:1 (90 Menit via Zoom)',
      'Bedah langsung butir merah & krisis bersama mentor',
      'Penyusunan action plan customized untuk bisnismu',
      'Konsultasi via WhatsApp pasca-coaching selama 14 hari'
    ]
  },
  // UPSELL CATALOG ITEMS (According to Section 5.8 PRD)
  {
    id: 4,
    code: 'UPSELL_TIM_PERTAMA',
    name: 'Kelas: Membangun Tim Pertamamu',
    short_desc: 'Solusi gap SDM Fase 1-2: Panduan merekrut, delegasi tugas tanpa rasa khawatir, dan sistem KPI sederhana.',
    type: 'SINGLE_AUDIT',
    price: 349000,
    price_strikethrough: 599000,
    badge: 'Solusi Gap SDM',
    features: [
      'Template SOP & Job Description karyawan pertama',
      'Form wawancara & tes integritas karakter',
      'Video rekaman materi 4 jam akses selamanya',
      'Kalkulator kompensasi & insentif performa'
    ]
  },
  {
    id: 5,
    code: 'UPSELL_BEP_KEUANGAN',
    name: 'Ebook & Template: Keuangan & BEP Pemula',
    short_desc: 'Solusi butir ★ BEP & Pemisahan Kas: Spreadsheet otomatis menghitung HPP, COGS, dan titik impas.',
    type: 'EBOOK',
    price: 97000,
    price_strikethrough: 197000,
    badge: 'Finansial Praktis',
    features: [
      'File Excel terotomasi perhitungan BEP',
      'Template laporan Laba Rugi bulanan UKM',
      'Panduan 80 halaman anti pencampuran kas pribadi',
      'Studi kasus nyata bisnis ritel & kuliner'
    ]
  },
  {
    id: 6,
    code: 'UPSELL_COACHING_OFFLINE',
    name: 'Private Coaching Offline (Bandung / Jakarta)',
    short_desc: 'Sesi tatap muka eksklusif 3 jam bersama Riza Zacharias atau Senior Advisor Syaamil Group.',
    type: 'COACHING',
    price: 3000000,
    price_strikethrough: 4500000,
    badge: 'Tatap Muka Eksklusif',
    features: [
      'Sesi tatap muka privat 3 jam di Headquarter Syaamil',
      'Review mendalam seluruh dokumen finansial & SOP',
      'Formulasi roadmap skala besar 12 bulan ke depan',
      'Makan siang eksekutif bersama mentor'
    ]
  }
];

export const paymentMethodsData: PaymentMethod[] = [
  {
    id: 1,
    code: 'QRIS',
    name: 'QRIS (Semua E-Wallet & Mobile Banking)',
    type: 'QR_CODE',
    provider: 'Xendit',
    instructions: [
      {
        title: 'Instruksi Scan QRIS',
        steps: [
          'Buka aplikasi BCA Mobile, GoPay, OVO, DANA, Livin Mandiri, atau m-Banking pilihan Anda.',
          'Pilih menu "Scan" atau "Bayar" lalu arahkan kamera ke QR Code yang ditampilkan.',
          'Pastikan nama merchant tertera "ScaleUpBisnis / Syaamil Group".',
          'Masukkan PIN pembayaran Anda. Konfirmasi otomatis realtime.'
        ]
      }
    ]
  },
  {
    id: 2,
    code: 'BCA_VA',
    name: 'BCA Virtual Account',
    type: 'VIRTUAL_ACCOUNT',
    provider: 'Xendit',
    instructions: [
      {
        title: 'Pembayaran via m-BCA (BCA Mobile)',
        steps: [
          'Login ke BCA mobile, pilih menu m-Transfer.',
          'Pilih menu BCA Virtual Account.',
          'Masukkan nomor Virtual Account yang tertera di invoice.',
          'Periksa jumlah nominal dan konfirmasi nama perusahaan, masukkan PIN m-BCA.'
        ]
      }
    ]
  },
  {
    id: 3,
    code: 'BSI_VA',
    name: 'BSI Virtual Account (Syariah)',
    type: 'VIRTUAL_ACCOUNT',
    provider: 'Xendit',
    instructions: [
      {
        title: 'Pembayaran via BYOND BSI / BSI Mobile',
        steps: [
          'Buka aplikasi BYOND BSI atau BSI Mobile.',
          'Pilih menu Bayar & Beli > E-Commerce / Institusi.',
          'Masukkan nomor Virtual Account BSI.',
          'Konfirmasi data dan nominal tagihan, lalu masukkan PIN transaksi Anda.'
        ]
      }
    ]
  },
  {
    id: 4,
    code: 'MANDIRI_VA',
    name: 'Mandiri Virtual Account',
    type: 'VIRTUAL_ACCOUNT',
    provider: 'Xendit',
    instructions: [
      {
        title: 'Pembayaran via Livin by Mandiri',
        steps: [
          'Login ke aplikasi Livin by Mandiri.',
          'Pilih menu Bayar > Buat Pembayaran Baru > Multi Payment.',
          'Pilih penyedia jasa Xendit / ScaleUpBisnis dan input nomor VA.',
          'Konfirmasi rincian pembayaran dan masukkan MPIN.'
        ]
      }
    ]
  },
  {
    id: 5,
    code: 'GOPAY',
    name: 'GoPay / GoPay Later',
    type: 'E_WALLET',
    provider: 'Xendit',
    instructions: [
      {
        title: 'Pembayaran GoPay Direct',
        steps: [
          'Klik tombol "Bayar dengan GoPay".',
          'Aplikasi Gojek akan terbuka secara otomatis pada smartphone Anda.',
          'Periksa detail pembayaran dan konfirmasi dengan sidik jari/PIN.'
        ]
      }
    ]
  }
];

export const sampleCustomers: any[] = [
  {
    id: 1,
    name: 'Budi Santoso',
    email: 'budi.santoso@berkahmandiri.id',
    phone: '081234567001',
    business_name: 'Toko Berkah Mandiri',
    business_field: 'Ritel Sembako & Distribusi',
    business_city: 'Bandung',
    business_address: 'Jl. Soekarno Hatta No. 423, Bandung, Jawa Barat',
    established_year: 2019,
    employee_count: '6 Orang',
    monthly_turnover: 'Rp 150.000.000 / Bulan',
    current_phase: 'Fase 1 (Survival)',
    last_audit_score: '72.5%',
    audit_status: 'Belum Lolos (2 Kunci Gagal)',
    total_orders: 2,
    total_spent: 794000,
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
    notes: 'Prioritas pembenahan: Pemisahan rekening pribadi-toko dan penetapan BEP bulanan.'
  },
  {
    id: 2,
    name: 'Siti Rahayu',
    email: 'siti.rahayu@sitikuliner.com',
    phone: '081234567002',
    business_name: 'CV Siti Kuliner Nusantara',
    business_field: 'Food & Beverage',
    business_city: 'Surabaya',
    business_address: 'Ruko Darmo Park II Blok B-12, Surabaya, Jawa Timur',
    established_year: 2021,
    employee_count: '14 Orang',
    monthly_turnover: 'Rp 280.000.000 / Bulan',
    current_phase: 'Fase 2 (Cash Growth)',
    last_audit_score: '84.0%',
    audit_status: 'Siap Naik Fase',
    total_orders: 1,
    total_spent: 197000,
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80',
    notes: 'Kandidat potensial untuk upsell: Kelas Membangun Tim & SOP Cabang.'
  },
  {
    id: 3,
    name: 'Hendra Wijaya',
    email: 'hendra@hendrakontraktor.com',
    phone: '081234567003',
    business_name: 'PT Hendra Wijaya Konstruksi',
    business_field: 'Konstruksi & Interior',
    business_city: 'Jakarta',
    business_address: 'Gedung Wisma Mulia Lt. 8, Gatot Subroto, Jakarta Selatan',
    established_year: 2017,
    employee_count: '32 Orang',
    monthly_turnover: 'Rp 1.200.000.000 / Bulan',
    current_phase: 'Fase 3 (Systemize)',
    last_audit_score: '78.0%',
    audit_status: 'Hampir Siap',
    total_orders: 1,
    total_spent: 1997000,
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
    notes: 'Telah mengambil paket Coaching 1:1. Mengalami silo antar tim arsitek dan finance.'
  },
  {
    id: 4,
    name: 'Nurul Hidayati',
    email: 'nurul.h@gmail.com',
    phone: '081234567004',
    business_name: 'Butik Nurul Fashion Hijab',
    business_field: 'Fashion Muslim & Tekstil',
    business_city: 'Yogyakarta',
    business_address: 'Jl. Kaliurang KM 6, Sleman, D.I. Yogyakarta',
    established_year: 2020,
    employee_count: '9 Orang',
    monthly_turnover: 'Rp 95.000.000 / Bulan',
    current_phase: 'Fase 2 (Cash Growth)',
    last_audit_score: '68.0%',
    audit_status: 'Belum Lolos (1 Kunci Gagal)',
    total_orders: 1,
    total_spent: 597000,
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&q=80',
    notes: 'Pemasaran online kuat via TikTok, namun laporan COGS belum tertib.'
  }
];

export const sampleOrders: Order[] = [
  {
    id: 1,
    invoice_code: 'INV-20261005-A1B2C3',
    customer_id: 1,
    customer_name: 'Budi Santoso',
    customer_email: 'budi.santoso@berkahmandiri.id',
    customer_phone: '081234567001',
    product_name: 'Audit Lengkap — 4 Instrumen',
    subtotal: 597000,
    discount_amount: 0,
    total_amount: 597000,
    status: 'PAID',
    payment_method_name: 'BSI Virtual Account',
    va_number: '9347891234567890',
    created_at: '05 Okt 2026, 09:15',
    paid_at: '05 Okt 2026, 09:18'
  },
  {
    id: 2,
    invoice_code: 'INV-20261005-D4E5F6',
    customer_id: 2,
    customer_name: 'Siti Rahayu',
    customer_email: 'siti.rahayu@sitikuliner.com',
    customer_phone: '081234567002',
    product_name: 'Audit Satu Fase',
    subtotal: 197000,
    discount_amount: 50000,
    total_amount: 147000,
    status: 'PAID',
    payment_method_name: 'QRIS Dynamic',
    created_at: '05 Okt 2026, 11:30',
    paid_at: '05 Okt 2026, 11:32'
  },
  {
    id: 3,
    invoice_code: 'INV-20261006-G7H8I9',
    customer_id: 3,
    customer_name: 'Hendra Wijaya',
    customer_email: 'hendra@hendrakontraktor.com',
    customer_phone: '081234567003',
    product_name: 'Audit Lengkap + 1 Sesi Coaching',
    subtotal: 1997000,
    discount_amount: 0,
    total_amount: 1997000,
    status: 'PENDING',
    payment_method_name: 'BCA Virtual Account',
    va_number: '12890987654321',
    created_at: '06 Okt 2026, 14:00'
  }
];

export const sampleCompletedResult: any = {
  session_id: 101,
  respondent_name: 'Budi Santoso',
  company_name: 'Toko Berkah Mandiri',
  business_field: 'Ritel Sembako & Distribusi',
  audit_name: 'Audit Fase 1 ke 2: Survival → Cash Growth',
  overall_score: 72.5,
  key_pass: false,
  status: 'BELUM_SIAP',
  status_label: 'Gerbang Belum Terbuka (Perlu Pembenahan Kunci)',
  total_questions: 92,
  total_key_questions: 9,
  answered_ya: 67,
  answered_tidak: 25,
  key_ya: 7,
  key_tidak: 2,
  from_phase: phasesData[0],
  to_phase: phasesData[1],
  crisis_warning: 'Krisis Kepemimpinan Terdeteksi: Anda masih menjadi bottleneck utama bisnis. 2 Butir Kunci Gerbang masih TIDAK.',
  section_scores: [
    { section_code: 'A', section_name: 'Produksi / Operasi', score_pct: 85, key_pass: true, ya_count: 10, total: 12 },
    { section_code: 'B', section_name: 'Sales & Marketing', score_pct: 78, key_pass: true, ya_count: 11, total: 15 },
    { section_code: 'C', section_name: 'Keuangan & Akuntansi', score_pct: 58, key_pass: false, ya_count: 7, total: 12 },
    { section_code: 'D', section_name: 'Kepatuhan Dasar', score_pct: 70, key_pass: true, ya_count: 7, total: 10 },
    { section_code: 'E', section_name: 'Sumber Daya Manusia', score_pct: 50, key_pass: false, ya_count: 5, total: 10 },
    { section_code: 'F', section_name: 'Manajemen Tata Kerja', score_pct: 80, key_pass: true, ya_count: 8, total: 10 },
    { section_code: 'G', section_name: 'R&D / Inovasi', score_pct: 75, key_pass: true, ya_count: 6, total: 8 },
    { section_code: 'H', section_name: 'Kepemimpinan & Syariah', score_pct: 90, key_pass: true, ya_count: 13, total: 15 }
  ],
  critical_gaps: [
    {
      question_number: 9,
      question_text: 'Apakah pemilik bisnis mengetahui angka Break Even Point (BEP) bulanan secara presisi?',
      section_name: 'Keuangan & Akuntansi',
      is_key: true,
      recommendation_title: 'Workshop: Menghitung COGS, HPP & Titik Impas (BEP)',
      recommendation_author: 'Tim Finansial ScaleUpBisnis',
      recommendation_type: 'KELAS_INTERNAL'
    },
    {
      question_number: 11,
      question_text: 'Apakah sudah ada minimal 1-2 staf/tim pembantu yang didelegasikan tugas operasional teknis?',
      section_name: 'Sumber Daya Manusia',
      is_key: true,
      recommendation_title: 'Buku: The E-Myth Revisited',
      recommendation_author: 'Michael E. Gerber',
      recommendation_type: 'BUKU'
    }
  ],
  recommendations: [
    {
      id: 1,
      type: 'BUKU',
      title: 'The E-Myth Revisited',
      author_or_name: 'Michael E. Gerber',
      description: 'Mengapa mayoritas bisnis kecil gagal dan apa solusinya. Wajib dibaca oleh founder yang terjebak mengerjakan semua hal teknis sendiri.',
      external_url: 'https://tokopedia.com',
      phase_relevance: '1,2',
      badge: 'Buku Wajib Owner'
    },
    {
      id: 4,
      type: 'KELAS_INTERNAL',
      title: 'Kelas: Membangun Tim Pertamamu Tanpa Tekor',
      author_or_name: 'Akademi ScaleUpBisnis',
      description: 'Panduan step-by-step merekrut, menetapkan KPI sederhana, dan mendelegasikan pekerjaan teknis.',
      external_url: '#',
      phase_relevance: '1,2',
      is_premium: true,
      price: 349000,
      badge: 'Upsell Unggulan'
    }
  ]
};
