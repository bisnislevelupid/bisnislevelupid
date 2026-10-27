import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { TEST_RESULT_HTML } from "../lib/email/default-templates";
import { FOUNDATION_OFFERS } from "../lib/portal/foundations";
import { KEY_POINT, SECTION_POINT } from "./report-content/points";

type BankQuestion = {
  audit_code: string;
  section_code: string;
  question_number: number;
  question_text: string;
  is_key: boolean;
  guidance_text: string | null;
};

type BankSection = { code: string; db_name: string };
type BankAudit = { code: string; sections: BankSection[] };

const STATUSES = ["DALAM_BAHAYA", "BELUM_SIAP", "SIAP_NAIK", "HAMPIR", "PERLU_FONDASI", "TIDAK_DAPAT_DINILAI"] as const;

const PHASE: Record<string, { n: number; from: string; to: string; crisis: string }> = {
  audit_1_2: { n: 1, from: "Cari Makan", to: "Cari Duit", crisis: "Krisis Kepemimpinan" },
  audit_2_3: { n: 2, from: "Cari Duit", to: "Bangun Sistem", crisis: "Krisis Otonomi" },
  audit_3_4: { n: 3, from: "Bangun Sistem", to: "Cari Talent", crisis: "Krisis Kontrol" },
  audit_4_5: { n: 4, from: "Cari Talent", to: "Ekspansi", crisis: "Krisis Birokrasi" },
};

const SECTION_REC: Record<string, string> = {
  "audit_1_2|A": "rec-operasi-dasar",
  "audit_1_2|B": "rec-penjualan-dasar",
  "audit_1_2|C": "rec-laba-rugi",
  "audit_1_2|D": "rec-pajak-rezim",
  "audit_1_2|E": "rec-sdm-dasar",
  "audit_1_2|F": "rec-kepemimpinan-awal",
  "audit_1_2|G": "rec-budaya",
  "audit_1_2|H": "rec-amanah",
  "audit_2_3|A": "rec-operasi-dasar",
  "audit_2_3|B": "rec-unit-economics",
  "audit_2_3|C": "rec-kas-cadangan",
  "audit_2_3|D": "rec-hubungan-kerja",
  "audit_2_3|E": "rec-sdm-dasar",
  "audit_2_3|F": "rec-sop",
  "audit_2_3|G": "rec-integrasi-sistem",
  "audit_2_3|H": "rec-budaya",
  "audit_2_3|I": "rec-kader",
  "audit_3_4|A": "rec-sistem-matang",
  "audit_3_4|B": "rec-mesin-penjualan",
  "audit_3_4|C": "rec-dashboard-kas",
  "audit_3_4|D": "rec-coretax",
  "audit_3_4|E": "rec-kader",
  "audit_3_4|F": "rec-tata-kelola",
  "audit_3_4|G": "rec-integrasi-sistem",
  "audit_3_4|H": "rec-kader",
  "audit_3_4|I": "rec-budaya",
  "audit_3_4|J": "rec-amanah",
  "audit_4_5|A": "rec-lean-birokrasi",
  "audit_4_5|B": "rec-playbook-ekspansi",
  "audit_4_5|C": "rec-modal-ekspansi",
  "audit_4_5|D": "rec-uji-tuntas",
  "audit_4_5|E": "rec-kader",
  "audit_4_5|F": "rec-playbook-ekspansi",
  "audit_4_5|G": "rec-identitas",
  "audit_4_5|H": "rec-integrasi-sistem",
  "audit_4_5|I": "rec-amanah",
};

const KEY_REC: Record<string, string> = {
  "audit_1_2#3": "rec-pisah-uang",
  "audit_1_2#14": "rec-hpp",
  "audit_1_2#30": "rec-bep",
  "audit_1_2#42": "rec-pisah-uang",
  "audit_1_2#43": "rec-pisah-uang",
  "audit_1_2#44": "rec-laba-rugi",
  "audit_1_2#47": "rec-pajak-rezim",
  "audit_1_2#81": "rec-delegasi",
  "audit_2_3#18": "rec-unit-economics",
  "audit_2_3#55": "rec-kas-cadangan",
  "audit_2_3#90": "rec-sop",
  "audit_3_4#12": "rec-dashboard-kas",
  "audit_3_4#48": "rec-integrasi-sistem",
  "audit_4_5#1": "rec-lean-birokrasi",
  "audit_4_5#8": "rec-playbook-ekspansi",
  "audit_4_5#12": "rec-modal-ekspansi",
  "audit_4_5#35": "rec-identitas",
};

const EDITOR = new Set([
  "audit_1_2#43", "audit_1_2#52", "audit_1_2#77", "audit_1_2#82", "audit_1_2#83",
  "audit_2_3#8", "audit_2_3#76", "audit_2_3#77", "audit_2_3#79", "audit_2_3#80", "audit_2_3#87", "audit_2_3#90", "audit_2_3#150", "audit_2_3#153",
  "audit_3_4#26", "audit_3_4#28", "audit_3_4#46", "audit_3_4#55", "audit_3_4#60", "audit_3_4#63",
  "audit_4_5#9", "audit_4_5#23", "audit_4_5#26", "audit_4_5#28", "audit_4_5#35", "audit_4_5#39", "audit_4_5#43", "audit_4_5#46",
]);

const RECS: Array<{ code: string; type: "BUKU" | "TOOL"; title: string; description: string; review: "draft" | "published" }> = [
  { code: "rec-emyth", type: "BUKU", title: "The E-Myth Revisited", description: "Bekerja pada bisnis, bukan hanya di dalam bisnis. Bacaan ini menjelaskan mengapa owner yang mengerjakan semuanya sendiri tidak otomatis punya perusahaan.", review: "published" },
  { code: "rec-baca-ulang", type: "TOOL", title: "Cara menandai Tidak Berlaku", description: "Lembar kerja untuk memisahkan butir yang memang di luar model bisnis dari butir yang belum dikerjakan lalu dijawab Tidak Berlaku. Bukan produk berbayar.", review: "draft" },
  { code: "rec-operasi-dasar", type: "TOOL", title: "Peta operasi yang bisa diulang", description: "Urutkan pemasok, stok, jadwal, dan mutu sampai order kedua tidak bergantung pada ingatan owner.", review: "draft" },
  { code: "rec-penjualan-dasar", type: "TOOL", title: "Harga dan cara mencari pembeli", description: "Tulis satu penawaran yang sudah pernah laku dua kali, beserta cara mencari pembeli yang bisa diulang.", review: "draft" },
  { code: "rec-unit-economics", type: "TOOL", title: "Margin per produk", description: "Pisahkan produk yang ramai dari produk yang benar-benar menyisakan uang setelah HPP dan biaya tetap.", review: "draft" },
  { code: "rec-mesin-penjualan", type: "TOOL", title: "Mesin penjualan tanpa satu figur", description: "Tulis funnel, pemilik kanal, dan apa yang tetap jalan bila satu orang cuti.", review: "draft" },
  { code: "rec-laba-rugi", type: "TOOL", title: "Laba rugi satu halaman", description: "Satu halaman bulanan: penjualan, HPP, biaya, sisa. Diisi dari buku kas, bukan dari ingatan.", review: "draft" },
  { code: "rec-kas-cadangan", type: "TOOL", title: "Batas kas dan cadangan", description: "Tetapkan kas minimum operasional dan cadangan beberapa bulan sebelum uang pertumbuhan dipakai untuk belanja baru.", review: "draft" },
  { code: "rec-dashboard-kas", type: "TOOL", title: "Dasbor kas 13 minggu", description: "Lima angka mingguan ditambah prakiraan 13 minggu, dengan satu orang yang memperbaruinya pada hari yang sama.", review: "draft" },
  { code: "rec-modal-ekspansi", type: "TOOL", title: "Uji ketahanan sebelum melompat", description: "Ekspansi hanya dari kas yang terpisah dari kas harian. Kalau cadangan operasional tersentuh, lompatan ditunda.", review: "draft" },
  { code: "rec-pajak-rezim", type: "TOOL", title: "Pengingat rezim pajak", description: "Catat bentuk usaha dan ambang yang membuat satu rezim berlaku atau tidak. Angka di instrumen adalah pengingat, bukan nasihat pajak.", review: "draft" },
  { code: "rec-hubungan-kerja", type: "TOOL", title: "Perjanjian dan upah", description: "Daftar siapa yang bekerja, statusnya, dan upah yang dibayar dari rekening usaha. Konfirmasi ke penasihat sebelum menyalin angka.", review: "draft" },
  { code: "rec-uji-tuntas", type: "TOOL", title: "Daftar periksa uji tuntas", description: "Hukum, pajak, dan operasi dicek sebelum akuisisi, kemitraan, atau wilayah baru ditandatangani.", review: "draft" },
  { code: "rec-coretax", type: "TOOL", title: "Pajak badan yang tersistem", description: "Rekonsiliasi fiskal dan angsuran tidak lagi diurus dari ingatan. Selisih dianggarkan, bukan ditunda.", review: "draft" },
  { code: "rec-sdm-dasar", type: "TOOL", title: "Orang pertama yang nyata", description: "Pilih, tugaskan, dan bayar satu peran sampai pekerjaan itu lepas dari tangan owner.", review: "draft" },
  { code: "rec-kepemimpinan-awal", type: "TOOL", title: "Keputusan yang selesai", description: "Satu keputusan yang sudah menggantung ditulis, diberi tanggal, dan tidak diubah besoknya.", review: "draft" },
  { code: "rec-sop", type: "TOOL", title: "SOP satu proses inti", description: "Tulis satu proses yang masih menempel di owner, lalu biarkan orang lain menjalankannya dua minggu.", review: "draft" },
  { code: "rec-tata-kelola", type: "TOOL", title: "Matriks wewenang", description: "Keputusan, pemangku, dan batas nilainya tertulis sehingga eskalasi ke owner hanya untuk yang memang di luar batas.", review: "draft" },
  { code: "rec-lean-birokrasi", type: "TOOL", title: "Pangkas persetujuan yang tidak menambah nilai", description: "Hitung lapisan tanda tangan pada satu keputusan rutin, lalu hapus yang tidak mengubah risiko.", review: "draft" },
  { code: "rec-integrasi-sistem", type: "TOOL", title: "Satu angka yang dipercaya", description: "Penjualan, stok, dan kas punya satu sumber. Rekonsiliasi mingguan sampai selisihnya dijelaskan.", review: "draft" },
  { code: "rec-budaya", type: "TOOL", title: "Perbaikan tanpa menunggu owner", description: "Satu kebiasaan perbaikan yang jalan tanpa owner punya ide baru setiap Senin.", review: "draft" },
  { code: "rec-kader", type: "TOOL", title: "Calon untuk posisi kunci", description: "Setiap posisi kunci, termasuk peran owner, punya minimal satu calon dan tugas nyata kuartal ini.", review: "draft" },
  { code: "rec-amanah", type: "TOOL", title: "Janji yang ditutup", description: "Daftar janji yang belum ditepati, selesaikan atau beritahu ulang, dan jangan buka penawaran baru sebelum yang lama tertutup.", review: "draft" },
  { code: "rec-sistem-matang", type: "TOOL", title: "Proses inti tanpa owner sebulan", description: "Uji satu proses inti berjalan penuh tanpa owner, bukan hanya saat owner libur sehari.", review: "draft" },
  { code: "rec-playbook-ekspansi", type: "TOOL", title: "Playbook dari unit yang sehat", description: "Tulis cara unit yang paling sehat melayani pelanggan, uji di satu tempat lain, baru gandakan.", review: "draft" },
  { code: "rec-identitas", type: "TOOL", title: "Identitas yang tertulis", description: "Nilai yang tidak boleh ditukar dengan pertumbuhan ditulis, lalu satu keputusan ekspansi dicek terhadap teks itu.", review: "draft" },
  { code: "rec-pisah-uang", type: "TOOL", title: "Rekening dan buku yang terpisah", description: "Belanja usaha keluar dari rekening usaha, dan buku kas usaha tidak mencampur mutasi rumah.", review: "draft" },
  { code: "rec-hpp", type: "TOOL", title: "Harga dari HPP", description: "Bahan, tenaga, dan ongkos langsung dihitung sebelum harga jual dipertahankan karena kebiasaan.", review: "draft" },
  { code: "rec-bep", type: "TOOL", title: "Titik impas bulanan", description: "Biaya tetap dibagi selisih harga dan HPP. Itu jumlah minimal sebelum usaha berhenti menanggung biaya.", review: "draft" },
  { code: "rec-delegasi", type: "TOOL", title: "Satu peran yang lepas", description: "Satu pekerjaan berulang diajarkan, dikerjakan orang lain dua minggu, dan tidak diambil kembali.", review: "draft" },
];

const STATUS_REC: Record<string, Record<string, string[]>> = {
  audit_1_2: {
    DALAM_BAHAYA: ["rec-pisah-uang", "rec-laba-rugi"],
    BELUM_SIAP: ["rec-laba-rugi", "rec-delegasi"],
    SIAP_NAIK: ["rec-emyth", "rec-sop"],
    HAMPIR: ["rec-penjualan-dasar", "rec-laba-rugi"],
    PERLU_FONDASI: ["rec-laba-rugi", "rec-sdm-dasar"],
    TIDAK_DAPAT_DINILAI: ["rec-emyth", "rec-baca-ulang"],
  },
  audit_2_3: {
    DALAM_BAHAYA: ["rec-kas-cadangan", "rec-unit-economics"],
    BELUM_SIAP: ["rec-sop", "rec-delegasi"],
    SIAP_NAIK: ["rec-emyth", "rec-sop"],
    HAMPIR: ["rec-unit-economics", "rec-kas-cadangan"],
    PERLU_FONDASI: ["rec-kas-cadangan", "rec-sop"],
    TIDAK_DAPAT_DINILAI: ["rec-emyth", "rec-baca-ulang"],
  },
  audit_3_4: {
    DALAM_BAHAYA: ["rec-dashboard-kas", "rec-integrasi-sistem"],
    BELUM_SIAP: ["rec-tata-kelola", "rec-kader"],
    SIAP_NAIK: ["rec-emyth", "rec-kader"],
    HAMPIR: ["rec-mesin-penjualan", "rec-dashboard-kas"],
    PERLU_FONDASI: ["rec-dashboard-kas", "rec-kader"],
    TIDAK_DAPAT_DINILAI: ["rec-emyth", "rec-baca-ulang"],
  },
  audit_4_5: {
    DALAM_BAHAYA: ["rec-modal-ekspansi", "rec-lean-birokrasi"],
    BELUM_SIAP: ["rec-playbook-ekspansi", "rec-identitas"],
    SIAP_NAIK: ["rec-emyth", "rec-identitas"],
    HAMPIR: ["rec-playbook-ekspansi", "rec-lean-birokrasi"],
    PERLU_FONDASI: ["rec-playbook-ekspansi", "rec-modal-ekspansi"],
    TIDAK_DAPAT_DINILAI: ["rec-emyth", "rec-baca-ulang"],
  },
};

function q(value: string) {
  return `'${value.replace(/'/g, "''")}'`;
}

function narrative(audit: string, status: (typeof STATUSES)[number]) {
  const phase = PHASE[audit];
  const gate = status === "SIAP_NAIK" ? "sudah terlewati" : "belum terlewati";
  const headline: Record<(typeof STATUSES)[number], string> = {
    DALAM_BAHAYA: "Ini krisis, bukan sekadar gerbang yang belum terbuka",
    BELUM_SIAP: "Gerbang kunci masih tertutup",
    SIAP_NAIK: "Gerbang sudah terbuka",
    HAMPIR: "Kunci lulus, pondasi belum penuh",
    PERLU_FONDASI: "Gerbang utama sudah terbuka, tapi pondasi pendukungnya belum terbangun.",
    TIDAK_DAPAT_DINILAI: "Terlalu banyak jawaban Tidak Berlaku, jadi hasilnya tidak representatif.",
  };
  const summary: Record<(typeof STATUSES)[number], string> = {
    DALAM_BAHAYA: `Tiga atau lebih butir kunci di ${phase.from} dijawab Tidak, dan skor butir biasa berada di bawah 50%. ${phase.crisis} sedang terjadi di operasi, bukan hanya di judul fase.`,
    BELUM_SIAP: `Ada butir kunci yang dijawab Tidak pada transisi ${phase.from} ke ${phase.to}. Skor butir biasa, setinggi apa pun, tidak menggantikan gerbang itu.`,
    SIAP_NAIK: `Semua butir kunci yang dinilai dijawab Ya, dan skor butir biasa mencapai minimal 80% tanpa pembulatan. ${phase.crisis} pada gerbang fase ini sudah terlewati.`,
    HAMPIR: `Semua butir kunci yang dinilai dijawab Ya, dan skor butir biasa berada di 60% sampai di bawah 80%. Jarak ke ambang 80% adalah pekerjaan butir biasa, bukan butir bintang.`,
    PERLU_FONDASI: "Gerbang utama sudah terbuka, tapi pondasi pendukungnya belum terbangun. Semua butir kunci yang dinilai Ya, sementara skor butir biasa masih di bawah 60%.",
    TIDAK_DAPAT_DINILAI: "Terlalu banyak jawaban Tidak Berlaku, jadi hasilnya tidak representatif. Angka pada laporan ini bukan dasar untuk belanja, rekrut, atau ekspansi.",
  };
  return {
    headline: headline[status],
    summary: summary[status],
    implication: `Gerbang Fase ${phase.n}: ${phase.crisis} — ${gate}. Status ini dibaca dari butir bintang dan skor butir non-kunci. Tidak Berlaku keluar dari pembilang dan penyebut.`,
    focus: status === "TIDAK_DAPAT_DINILAI"
      ? "Tandai ulang butir Tidak Berlaku. Yang memang di luar model bisnis tetap Tidak Berlaku. Yang belum dikerjakan dijawab Tidak, lalu audit diulang."
      : status === "SIAP_NAIK"
        ? "Jaga bukti butir kunci yang sudah Ya, dan bereskan seksi di bawah 50% sebelum fase berikutnya menekannya."
        : status === "PERLU_FONDASI"
          ? "Mulai dari kurikulum fondasi fase ini. Jangan loncat ke kanal atau orang baru sebelum praktik dasar jalan."
          : `Tutup butir kunci yang Tidak lebih dulu, lalu angkat seksi ${phase.from} yang skor butir biasanya paling rendah.`,
  };
}

function main() {
  const bank = JSON.parse(readFileSync(path.join(process.cwd(), "scripts/report-content/question_bank_all.json"), "utf8")) as {
    audits: BankAudit[];
    questions: BankQuestion[];
  };
  const questions = bank.questions;
  if (questions.length !== 362) throw new Error(`Butir ${questions.length}, diharapkan 362`);
  const keys = questions.filter((item) => item.is_key);
  if (keys.length !== 56) throw new Error(`Butir kunci ${keys.length}, diharapkan 56`);
  if (EDITOR.size !== 28) throw new Error(`Daftar editor ${EDITOR.size}, diharapkan 28`);
  for (const item of keys) {
    const id = `${item.audit_code}#${item.question_number}`;
    if (!KEY_POINT[id]) throw new Error(`KEY_POINT hilang ${id}`);
  }
  const sections = bank.audits.flatMap((audit) => audit.sections.map((section) => ({ audit: audit.code, ...section })));
  if (sections.length !== 36) throw new Error(`Seksi ${sections.length}, diharapkan 36`);
  for (const section of sections) {
    if (!SECTION_POINT[`${section.audit}|${section.code}`]) throw new Error(`SECTION_POINT hilang ${section.audit}|${section.code}`);
    if (!SECTION_REC[`${section.audit}|${section.code}`]) throw new Error(`SECTION_REC hilang ${section.audit}|${section.code}`);
  }

  const lines: string[] = [];
  lines.push(`-- Narasi laporan, rekomendasi, dan audiens panduan.`);
  lines.push(`-- Idempoten: INSERT ... ON CONFLICT DO UPDATE, atau UPDATE kolom. File ini hanya menambah dan menimpa baris yang sama.`);
  lines.push(`-- Jalankan setelah migrasi 0004 dan seed bank soal: npm run db:seed:report`);
  lines.push(`-- Dihasilkan oleh npm run report:build-seed. Jangan sunting tangan.`);
  lines.push("");

  lines.push(`UPDATE recommendation_library SET code = 'rec-emyth' WHERE title = 'The E-Myth Revisited' AND code IS NULL;`);
  lines.push("");
  lines.push(`INSERT INTO recommendation_library (type, title, author_or_name, description, is_active, sort_order, code, review_status) VALUES`);
  lines.push(RECS.map((item, index) => `  (${q(item.type)}, ${q(item.title)}, ${item.code === "rec-emyth" ? q("Michael E. Gerber") : "NULL"}, ${q(item.description)}, true, ${index + 1}, ${q(item.code)}, ${q(item.review)})`).join(",\n"));
  lines.push(`ON CONFLICT (code) DO UPDATE SET type = EXCLUDED.type, title = EXCLUDED.title, author_or_name = EXCLUDED.author_or_name, description = EXCLUDED.description, is_active = true, sort_order = EXCLUDED.sort_order, review_status = EXCLUDED.review_status;`);
  lines.push("");

  const educationRows = sections.map((section) => {
    const point = SECTION_POINT[`${section.audit}|${section.code}`];
    const measures = point;
    const why = `Seksi ${section.code} ${section.db_name} ikut menentukan apakah transisi ini ditopang praktik harian, bukan hanya niat owner.`;
    const concepts = `${point} Butir bintang di seksi ini adalah gerbang. Skor butir biasa tidak menutup butir bintang yang dijawab Tidak.`;
    const framework = `Baca seksi ${section.db_name} dalam dua lapis. Butir yang dijawab Tidak Berlaku keluar dari pembilang dan penyebut. Butir tanpa panduan peserta memakai narasi seksi ini sebagai pengganti.`;
    const mistakes = `Kesalahan yang sering muncul di ${section.db_name}: menjawab Ya karena pernah dilakukan sekali, atau menandai Tidak Berlaku untuk kondisi yang sebenarnya masih berlaku.`;
    const strength = `Jawaban Ya di ${section.db_name} berarti praktik ini sudah terlihat pada kerja minggu ini, bukan hanya ada di rencana.`;
    const gap = `Jawaban Tidak di ${section.db_name} menjadi urutan kerja. Bila butirnya tidak punya panduan untuk peserta, gunakan narasi seksi ini.`;
    return `  (${q(section.audit)}, ${q(section.code)}, ${q(measures)}, ${q(why)}, ${q(concepts)}, ${q(framework)}, ${q(mistakes)}, ${q(strength)}, ${q(gap)}, 'draft')`;
  });
  lines.push(`INSERT INTO section_education (audit_code, section_code, measures, why_it_matters, concepts, framework, common_mistakes, strength_reading, gap_reading, review_status) VALUES`);
  lines.push(educationRows.join(",\n"));
  lines.push(`ON CONFLICT (audit_code, section_code) DO UPDATE SET measures = EXCLUDED.measures, why_it_matters = EXCLUDED.why_it_matters, concepts = EXCLUDED.concepts, framework = EXCLUDED.framework, common_mistakes = EXCLUDED.common_mistakes, strength_reading = EXCLUDED.strength_reading, gap_reading = EXCLUDED.gap_reading, review_status = EXCLUDED.review_status, updated_at = NOW();`);
  lines.push("");

  const coachingRows = questions.map((item) => {
    const key = KEY_POINT[`${item.audit_code}#${item.question_number}`];
    const point = SECTION_POINT[`${item.audit_code}|${item.section_code}`];
    const why = key?.why ?? `Butir ${item.question_number} mengukur bagian dari seksi ${item.section_code}. ${point}`;
    const risk = key?.risk ?? `Jawaban Tidak pada butir ini menahan skor seksi ${item.section_code}. Skor seksi yang lain tidak menggantikannya.`;
    const steps = key?.steps ?? [
      `Tulis bukti minggu ini untuk butir ${item.question_number}, bukan ingatan setahun lalu.`,
      `Pilih satu perubahan kecil yang membuat jawaban berikutnya bisa menjadi Ya.`,
    ];
    const edu = key?.edu ?? `Bila butir ini tidak punya panduan untuk peserta, pakai narasi seksi ${item.section_code} sebagai pengganti.`;
    const horizon = item.is_key ? "30" : "60";
    return `  (${q(item.audit_code)}, ${item.question_number}, ${q(why)}, ${q(risk)}, ${q(steps.join("\n"))}, ${q(edu)}, ${q(horizon)}, 'draft')`;
  });
  lines.push(`INSERT INTO question_coaching (audit_code, question_number, why_it_matters, risk_if_no, action_steps, education_note, horizon, review_status) VALUES`);
  lines.push(coachingRows.join(",\n"));
  lines.push(`ON CONFLICT (audit_code, question_number) DO UPDATE SET why_it_matters = EXCLUDED.why_it_matters, risk_if_no = EXCLUDED.risk_if_no, action_steps = EXCLUDED.action_steps, education_note = EXCLUDED.education_note, horizon = EXCLUDED.horizon, review_status = EXCLUDED.review_status, updated_at = NOW();`);
  lines.push("");

  const narrativeRows: string[] = [];
  for (const audit of Object.keys(PHASE)) {
    for (const status of STATUSES) {
      const row = narrative(audit, status);
      narrativeRows.push(`  (${q(audit)}, ${q(status)}, ${q(row.headline)}, ${q(row.summary)}, ${q(row.implication)}, ${q(row.focus)}, 'draft')`);
    }
  }
  lines.push(`INSERT INTO report_status_narratives (audit_code, status, headline, summary, implication, focus, review_status) VALUES`);
  lines.push(narrativeRows.join(",\n"));
  lines.push(`ON CONFLICT (audit_code, status) DO UPDATE SET headline = EXCLUDED.headline, summary = EXCLUDED.summary, implication = EXCLUDED.implication, focus = EXCLUDED.focus, review_status = EXCLUDED.review_status, updated_at = NOW();`);
  lines.push("");

  const closingRows = Object.entries(PHASE).map(([audit, phase]) => {
    const closing = `Transisi ${phase.from} ke ${phase.to} selesai dibaca dari gerbang bintang dan skor butir biasa. Simpan bukti butir yang sudah Ya, dan jangan naik hanya karena sibuk.`;
    const preview = phase.n === 4
      ? "Fase ekspansi menggandakan cara kerja yang sudah tertulis. Tanpa playbook dan identitas, cabang baru hanya menyalin kekacauan."
      : `Fase ${phase.to} menambah beban pada proses yang hari ini masih menempel di owner.`;
    const prepare = `Siapkan satu bukti untuk setiap butir kunci yang sudah Ya, dan satu urutan kerja untuk seksi yang skornya paling rendah.`;
    return `  (${q(audit)}, ${q(closing)}, ${q(`Menuju ${phase.to}`)}, ${q(preview)}, ${q(prepare)}, 'draft')`;
  });
  lines.push(`INSERT INTO phase_report_closings (audit_code, closing_text, next_phase_title, next_phase_preview, prepare_text, review_status) VALUES`);
  lines.push(closingRows.join(",\n"));
  lines.push(`ON CONFLICT (audit_code) DO UPDATE SET closing_text = EXCLUDED.closing_text, next_phase_title = EXCLUDED.next_phase_title, next_phase_preview = EXCLUDED.next_phase_preview, prepare_text = EXCLUDED.prepare_text, review_status = EXCLUDED.review_status, updated_at = NOW();`);
  lines.push("");

  const caseSql = Object.entries(SECTION_REC).map(([key, code]) => `WHEN ${q(key)} THEN ${q(code)}`).join("\n    ");
  lines.push(`INSERT INTO recommendation_triggers (question_id, recommendation_id, trigger_on_answer, priority, is_active)`);
  lines.push(`SELECT tq.id, rl.id, 'TIDAK', 6, true`);
  lines.push(`FROM test_questions tq`);
  lines.push(`JOIN audit_transitions a ON a.id = tq.audit_transition_id`);
  lines.push(`JOIN test_sections ts ON ts.id = tq.section_id`);
  lines.push(`JOIN recommendation_library rl ON rl.code = CASE a.code || '|' || ts.code`);
  lines.push(`    ${caseSql}`);
  lines.push(`    ELSE NULL END`);
  lines.push(`WHERE rl.id IS NOT NULL`);
  lines.push(`ON CONFLICT (question_id, recommendation_id, trigger_on_answer) DO UPDATE SET priority = EXCLUDED.priority, is_active = true;`);
  lines.push("");

  const keyPairs = Object.entries(KEY_REC).map(([id, code]) => {
    const [audit, number] = id.split("#");
    return `('${audit}', ${number}, '${code}')`;
  });
  lines.push(`INSERT INTO recommendation_triggers (question_id, recommendation_id, trigger_on_answer, priority, is_active)`);
  lines.push(`SELECT tq.id, rl.id, 'TIDAK', 1, true`);
  lines.push(`FROM (VALUES ${keyPairs.join(", ")}) AS map(audit_code, question_number, rec_code)`);
  lines.push(`JOIN audit_transitions a ON a.code = map.audit_code`);
  lines.push(`JOIN test_questions tq ON tq.audit_transition_id = a.id AND tq.question_number = map.question_number`);
  lines.push(`JOIN recommendation_library rl ON rl.code = map.rec_code`);
  lines.push(`ON CONFLICT (question_id, recommendation_id, trigger_on_answer) DO UPDATE SET priority = EXCLUDED.priority, is_active = true;`);
  lines.push("");

  const statusRows: string[] = [];
  for (const [audit, byStatus] of Object.entries(STATUS_REC)) {
    for (const [status, codes] of Object.entries(byStatus)) {
      codes.forEach((code, index) => statusRows.push(`('${audit}', '${status}', '${code}', ${index + 1})`));
    }
  }
  lines.push(`INSERT INTO report_status_recommendations (audit_code, status, recommendation_id, sort_order)`);
  lines.push(`SELECT v.audit_code, v.status, rl.id, v.sort_order`);
  lines.push(`FROM (VALUES ${statusRows.join(", ")}) AS v(audit_code, status, code, sort_order)`);
  lines.push(`JOIN recommendation_library rl ON rl.code = v.code`);
  lines.push(`ON CONFLICT (audit_code, status, recommendation_id) DO UPDATE SET sort_order = EXCLUDED.sort_order;`);
  lines.push("");

  const upsellRows = FOUNDATION_OFFERS.map((offer, index) => {
    const summary = offer.summary.slice(0, 480);
    return `  (NULL, ${q(offer.name)}, ${q(summary)}, 'CURRICULUM', 0, ${q("Lihat kurikulum")}, ${q(`/akun/layanan#${offer.code}`)}, ${q(`status:PERLU_FONDASI;audit:${offer.auditCode}`)}, true, ${index + 1}, ${q(offer.code)})`;
  });
  lines.push(`INSERT INTO upsell_items (product_id, name, short_desc, type, price, cta_label, cta_url, trigger_condition, is_active, sort_order, code) VALUES`);
  lines.push(upsellRows.join(",\n"));
  lines.push(`ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, short_desc = EXCLUDED.short_desc, type = EXCLUDED.type, price = EXCLUDED.price, cta_label = EXCLUDED.cta_label, cta_url = EXCLUDED.cta_url, trigger_condition = EXCLUDED.trigger_condition, is_active = true, sort_order = EXCLUDED.sort_order;`);
  lines.push("");
  lines.push(`INSERT INTO upsell_items (product_id, name, short_desc, type, price, cta_label, cta_url, trigger_condition, is_active, sort_order, code)`);
  lines.push(`SELECT p.id, 'Coaching 1:1', 'Sesi pendampingan pada produk audit-coaching yang sudah ada. Harga mengikuti produk, tidak dibuat di laporan.', 'COACHING', p.price, 'Checkout coaching', '/checkout?product=audit-coaching', 'status:PERLU_FONDASI,BELUM_SIAP,DALAM_BAHAYA', true, 20, 'upsell-coaching-1-1'`);
  lines.push(`FROM products p WHERE p.code = 'audit-coaching'`);
  lines.push(`ON CONFLICT (code) DO UPDATE SET product_id = EXCLUDED.product_id, name = EXCLUDED.name, short_desc = EXCLUDED.short_desc, price = EXCLUDED.price, cta_label = EXCLUDED.cta_label, cta_url = EXCLUDED.cta_url, trigger_condition = EXCLUDED.trigger_condition, is_active = true;`);
  lines.push("");

  const editorPairs = [...EDITOR].map((id) => {
    const [audit, number] = id.split("#");
    return `('${audit}', ${number})`;
  });
  lines.push(`UPDATE test_questions tq`);
  lines.push(`SET guidance_audience = CASE`);
  lines.push(`  WHEN btrim(COALESCE(tq.guidance_text, '')) IN ('', '-') THEN 'missing'`);
  lines.push(`  WHEN tq.guidance_text ~* 'slide anda|materi anda|materi \\(sirah\\)|sirah anda|catatan asli|versi lama berbunyi|ringkasan dari|koreksi:|konsolidasi dengan|relevan langsung|pt anda|restrukturisasi anda|rencana restrukturisasi' THEN 'editor'`);
  lines.push(`  ELSE 'customer' END`);
  lines.push(`FROM audit_transitions a`);
  lines.push(`WHERE tq.audit_transition_id = a.id AND a.code IN ('audit_1_2','audit_2_3','audit_3_4','audit_4_5');`);
  lines.push("");
  lines.push(`UPDATE test_questions tq SET guidance_audience = 'editor'`);
  lines.push(`FROM audit_transitions a, (VALUES ${editorPairs.join(", ")}) AS v(code, question_number)`);
  lines.push(`WHERE tq.audit_transition_id = a.id AND a.code = v.code AND tq.question_number = v.question_number;`);
  lines.push("");
  lines.push(`INSERT INTO site_settings (key, value) VALUES ('support_whatsapp', '') ON CONFLICT (key) DO NOTHING;`);
  lines.push("");

  const wa = `Halo {nama},

Audit *{audit_name}* sudah selesai pada {selesai}.

Status: {status}
{status_arti}
Skor: {skor}

{cta_text}

Unduh lewat akun: {pdf_url}

— BisnisLevelUp.id`;
  lines.push(`INSERT INTO notification_templates (event_trigger, channel, subject, message_content) VALUES`);
  lines.push(`('TEST_RESULT', 'EMAIL', 'Hasil audit {audit_name} siap diunduh', $report_email$${TEST_RESULT_HTML}$report_email$),`);
  lines.push(`('TEST_RESULT', 'WA', NULL, $report_wa$${wa}$report_wa$)`);
  lines.push(`ON CONFLICT (event_trigger, channel) DO UPDATE SET subject = EXCLUDED.subject, message_content = EXCLUDED.message_content, updated_at = NOW();`);
  lines.push("");

  const sql = `${lines.join("\n")}\n`;
  const statements = sql.replace(/--.*$/gm, "");
  if (/\b(DELETE|TRUNCATE|DROP)\b/i.test(statements)) throw new Error("Seed mengandung perintah terlarang");
  const out = path.join(process.cwd(), "drizzle/seed_report_content.sql");
  writeFileSync(out, sql);
  console.log(`wrote ${out} (${sql.length} bytes, coaching ${questions.length}, editor ${EDITOR.size})`);
}

main();
