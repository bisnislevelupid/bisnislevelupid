import { formatPercent } from "@/lib/pdf/format";
import type { ReportDocument, ReportGap } from "@/lib/pdf/types";

const GENERIC_STEP = /^(tulis bukti minggu ini untuk butir \d+|pilih satu perubahan kecil)/i;
const GENERIC_WHY = /butir \d+ mengukur bagian/i;

function compactLines(lines: string[]) {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of lines) {
    const text = raw.replace(/\s+/g, " ").trim();
    if (!text) continue;
    const key = text.toLowerCase().replace(/#\d+/g, "#").replace(/butir \d+/gi, "butir");
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(text);
  }
  return out;
}

function groupedGaps(gaps: ReportGap[]) {
  const bySection = new Map<string, number[]>();
  const unique: string[] = [];
  for (const gap of gaps) {
    const step = gap.steps.find((item) => item && !GENERIC_STEP.test(item.trim()));
    const why = gap.why?.trim() ?? "";
    if (step && !GENERIC_WHY.test(why)) unique.push(`#${gap.number} ${gap.sectionName}: ${step}`);
    else {
      const list = bySection.get(gap.sectionCode) ?? [];
      list.push(gap.number);
      bySection.set(gap.sectionCode, list);
    }
  }
  const grouped = [...bySection.entries()].map(([code, numbers]) => `Seksi ${code}: #${numbers.join(", #")}.`);
  return compactLines([...unique, ...grouped]);
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
        ...groupedGaps(keys).slice(0, 2).map((item) => `Catatan, belum masuk skor resmi: ${item}`),
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
        ...groupedGaps(rest.filter((gap) => gap.horizon === "30")).slice(0, 3),
        ...weak.slice(0, 2).map((section) => `Seksi ${section.code} ${section.name} adalah pondasi yang paling tertinggal (${formatPercent(section.score ?? 0)}).`),
      ].slice(0, 6),
      d60: [
        "Coaching 1:1 dipakai untuk mengunci urutan, bukan untuk menambah teori baru.",
        ...groupedGaps(rest.filter((gap) => gap.horizon !== "90")).slice(0, 4),
      ].slice(0, 6),
      d90: [
        "Ulangi audit yang sama. Naik fase hanya bila butir biasa yang dinilai mencapai minimal 80% tanpa pembulatan.",
        report.closing?.prepareText ?? "Siapkan bukti, bukan cerita, untuk tiap butir yang hari ini Tidak.",
      ],
    };
  }

  const d30 = groupedGaps(keys.length ? keys : rest.filter((gap) => gap.horizon === "30")).slice(0, 4);
  const d60 = groupedGaps(rest.filter((gap) => gap.horizon === "60").length ? rest.filter((gap) => gap.horizon === "60") : rest).slice(0, 4);
  const kept = report.sections.flatMap((section) => section.strengths.filter((item) => item.isKey).map((item) => `${section.code} #${item.number} tetap Ya: ${item.text}`));

  if (!gaps.length) {
    return {
      d30: kept.slice(0, 4).length ? kept.slice(0, 4).map((item) => `Jaga ${item}`) : ["Tulis bukti untuk tiga butir kunci, supaya Ya bulan ini tidak kembali menjadi kebiasaan lisan."],
      d60: weak.slice(0, 3).map((section) => `Angkat seksi ${section.code} ${section.name} yang masih ${formatPercent(section.score ?? 0)}`).concat(["Pilih satu proses yang masih dikerjakan owner dan tuliskan caranya untuk orang lain."]),
      d90: [report.closing?.prepareText ?? "Siapkan audit fase berikutnya setelah ritme 60 hari stabil.", "Ulangi audit ini bila ada perubahan model, orang kunci, atau kanal penjualan."],
    };
  }

  return {
    d30: compactLines(d30.length ? d30 : keys.length ? ["Tutup butir kunci yang masih Tidak sebelum menambah proyek baru."] : []),
    d60: compactLines(d60.length ? d60 : weak.slice(0, 4).map((section) => `Naikkan seksi ${section.code} ${section.name} ke minimal 80%.`)),
    d90: compactLines([
      "Ulangi audit yang sama setelah bukti 30 dan 60 hari terkumpul.",
      report.closing?.nextPhasePreview ?? "Baca pratinjau fase berikutnya sebagai arah, bukan sebagai izin melompat.",
    ]),
  };
}
