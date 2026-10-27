export type FoundationOffer = {
  code: string;
  auditCode: string;
  name: string;
  summary: string;
  modules: string;
};

export const FOUNDATION_OFFERS: FoundationOffer[] = [
  {
    code: "fondasi-audit-1-2",
    auditCode: "audit_1_2",
    name: "Kelas & ebook fondasi Survival ke Cari Duit",
    summary:
      "Kurikulum pondasi untuk owner yang gerbang kuncinya sudah Ya, tetapi praktik sehari-hari masih di bawah 60%: memisahkan uang, menghitung HPP dan titik impas, membaca laba rugi bulanan, dan menunjuk orang pertama yang benar-benar membantu.",
    modules:
      "Modul 1 memisahkan rekening dan belanja. Modul 2 menyusun harga dari HPP, bukan dari rasa. Modul 3 menghitung BEP dan laba rugi satu halaman. Modul 4 menulis model yang bisa diulang dan memindahkan satu pekerjaan ke orang lain.",
  },
  {
    code: "fondasi-audit-2-3",
    auditCode: "audit_2_3",
    name: "Kelas & ebook fondasi Cari Duit ke Bangun Sistem",
    summary:
      "Kurikulum pondasi saat delegasi belum menjadi sistem: margin per produk, kas minimal plus cadangan tiga bulan, SOP satu proses inti, dan perjanjian kerja yang membuat orang bisa bekerja tanpa owner menunggui.",
    modules:
      "Modul 1 peta produk paling untung, bukan paling ramai. Modul 2 batas kas dan dana darurat. Modul 3 SOP plus instruksi kerja untuk satu proses yang masih menempel di owner. Modul 4 perjanjian kerja, upah, dan siapa wakil saat owner tidak di tempat.",
  },
  {
    code: "fondasi-audit-3-4",
    auditCode: "audit_3_4",
    name: "Kelas & ebook fondasi Bangun Sistem ke Cari Talent",
    summary:
      "Kurikulum pondasi sebelum mencari talent: dashboard kas yang melihat ke depan, mesin penjualan yang tidak bergantung pada satu figur, KPI yang dipakai untuk keputusan, dan satu calon untuk setiap posisi kunci.",
    modules:
      "Modul 1 prakiraan arus kas 13 minggu. Modul 2 funnel dan pemilik kanal, bukan owner sebagai satu-satunya penjual. Modul 3 KPI bulanan yang mengubah keputusan gaji dan prioritas. Modul 4 peta suksesi posisi kunci, termasuk peran owner.",
  },
  {
    code: "fondasi-audit-4-5",
    auditCode: "audit_4_5",
    name: "Kelas & ebook fondasi Cari Talent ke Ekspansi",
    summary:
      "Kurikulum pondasi sebelum melompat: memangkas lapisan persetujuan, menulis playbook yang bisa ditiru unit lain, menguji ketahanan kas, dan menuliskan identitas yang tidak boleh luntur saat bisnis digandakan.",
    modules:
      "Modul 1 hitung dan potong approval yang tidak menambah nilai. Modul 2 playbook operasi dari unit yang paling sehat. Modul 3 uji ketahanan: ekspansi hanya dari posisi yang tahan banting. Modul 4 identitas dan nilai inti yang tertulis, plus suksesi yang sudah diuji.",
  },
];

export function foundationFor(auditCode: string) {
  return FOUNDATION_OFFERS.find((item) => item.auditCode === auditCode) ?? null;
}
