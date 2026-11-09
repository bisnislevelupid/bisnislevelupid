import type { ReportDocument, ReportGap } from "@/lib/pdf/types";

function line(gap: ReportGap) {
  const step = gap.steps[0] ?? gap.why ?? gap.text;
  return `#${gap.number} ${gap.sectionName}: ${step}`;
}

export function buildActionPlan(report: ReportDocument) {
  const gaps = report.sections.flatMap((section) => section.gaps);
  const keys = gaps.filter((gap) => gap.isKey);
  const rest = gaps.filter((gap) => !gap.isKey);
  const weak = [...report.sections].filter((section) => section.score !== null && section.score < 80).sort((a, b) => (a.score ?? 0) - (b.score ?? 0));

  if (report.status === "TIDAK_DAPAT_DINILAI") {
    return {
      d30: [
        "Daftar butir yang dijawab Tidak Berlaku. Tandai mana yang benar-benar di luar model bisnis, dan mana yang sebenarnya belum dikerjakan lalu dijawab Tidak Berlaku.",
        "Bicara dengan tim BisnisLevelUp.id sebelum memakai angka di laporan ini sebagai dasar belanja atau rekrut.",
        ...keys.slice(0, 3).map((gap) => `Catatan, belum masuk skor resmi: ${line(gap)}`),
      ],
      d60: [
        "Isi ulang butir yang semestinya Ya atau Tidak. Sisakan Tidak Berlaku hanya untuk syarat yang memang tidak berlaku.",
        "Ulangi audit yang sama setelah jawaban representatif.",
      ],
      d90: ["Baru susun proyek 90 hari dari skor yang baru. Rencana dari hasil yang tidak representatif akan menghabiskan tenaga di tempat yang salah."],
    };
  }

  if (report.status === "PERLU_FONDASI") {
    const offer = report.upsells.find((item) => item.code.startsWith("fondasi-"));
    return {
      d30: [
        offer ? `Mulai ${offer.name}. Jangan loncat ke kanal baru sebelum modul dasarnya jalan.` : "Kerjakan modul fondasi fase ini sebelum menambah kanal atau orang.",
        ...rest.filter((gap) => gap.horizon === "30").slice(0, 3).map(line),
        ...weak.slice(0, 2).map((section) => `Seksi ${section.code} ${section.name} adalah pondasi yang paling tertinggal (${section.score}%).`),
      ].slice(0, 6),
      d60: [
        "Coaching 1:1 dipakai untuk mengunci urutan, bukan untuk menambah teori baru.",
        ...rest.filter((gap) => gap.horizon !== "90").slice(0, 4).map(line),
      ].slice(0, 6),
      d90: [
        "Ulangi audit yang sama. Naik fase hanya bila butir biasa yang dinilai mencapai minimal 80% tanpa pembulatan.",
        report.closing?.prepareText ?? "Siapkan bukti, bukan cerita, untuk tiap butir yang hari ini Tidak.",
      ],
    };
  }

  const d30 = (keys.length ? keys : rest.filter((gap) => gap.horizon === "30")).slice(0, 5).map(line);
  const d60 = (rest.filter((gap) => gap.horizon === "60").length ? rest.filter((gap) => gap.horizon === "60") : rest).slice(0, 5).map(line);
  const kept = report.sections.flatMap((section) => section.strengths.filter((item) => item.isKey).map((item) => `${section.code} #${item.number} tetap Ya: ${item.text}`));

  if (!gaps.length) {
    return {
      d30: kept.slice(0, 4).length ? kept.slice(0, 4).map((item) => `Jaga ${item}`) : ["Tulis bukti untuk tiga butir kunci, supaya Ya bulan ini tidak kembali menjadi kebiasaan lisan."],
      d60: weak.slice(0, 3).map((section) => `Angkat seksi ${section.code} ${section.name} yang masih ${section.score}%`) .concat(["Pilih satu proses yang masih dikerjakan owner dan tuliskan caranya untuk orang lain."]),
      d90: [report.closing?.prepareText ?? "Siapkan audit fase berikutnya setelah ritme 60 hari stabil.", "Ulangi audit ini bila ada perubahan model, orang kunci, atau kanal penjualan."],
    };
  }

  return {
    d30: d30.length ? d30 : ["Tutup butir kunci yang masih Tidak sebelum menambah proyek baru."],
    d60: d60.length ? d60 : weak.slice(0, 4).map((section) => `Naikkan seksi ${section.code} ${section.name} ke minimal 80%.`),
    d90: [
      "Ulangi audit yang sama setelah bukti 30 dan 60 hari terkumpul.",
      report.closing?.nextPhasePreview ?? "Baca pratinjau fase berikutnya sebagai arah, bukan sebagai izin melompat.",
    ],
  };
}
