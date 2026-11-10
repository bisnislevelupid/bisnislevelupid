import { itemsToward80 } from "@/lib/pdf/spec-rules";

export const KEY_NA_NOTE = "Butir ini dilewati karena kondisinya tidak berlaku untuk bisnis Anda.";

export const SIAP_NAIK_RISK_NOTE =
  "Anda sudah siap naik, tapi titik lemah ini perlu dibereskan sebelum fase berikutnya menekannya.";

export const OTHER_RISK_NOTE =
  "Seksi dengan skor di bawah 50% adalah area risiko. Titik lemah ini perlu dibereskan, apa pun status keseluruhan audit.";

export function sapaanOrAnda(value: string | null | undefined) {
  const trimmed = value?.replace(/\s+/g, " ").trim() ?? "";
  return trimmed || "Anda";
}

export function formatPercent(score: number) {
  return `${new Intl.NumberFormat("id-ID", { maximumFractionDigits: 2 }).format(score)}%`;
}

export function formatAuditScore(score: number | string | null | undefined, status?: string | null) {
  if (status === "TIDAK_DAPAT_DINILAI") return "Tidak dapat dinilai";
  if (score === null || score === undefined || score === "") return "—";
  const numeric = Number(score);
  if (!Number.isFinite(numeric)) return "—";
  return formatPercent(numeric);
}

export function assessedPlain(counts: { ya: number; tidak: number; keyYa: number; keyTidak: number }) {
  return counts.ya - counts.keyYa + (counts.tidak - counts.keyTidak);
}

export function sectionScoreView(input: {
  score: number | string | null | undefined;
  ya: number;
  tidak: number;
  keyYa: number;
  keyTidak: number;
}) {
  if (assessedPlain(input) <= 0) {
    return { score: null as number | null, text: "—", color: "#94a3b8", assessed: false };
  }
  const numeric = Number(input.score);
  if (!Number.isFinite(numeric)) {
    return { score: null as number | null, text: "—", color: "#94a3b8", assessed: false };
  }
  const color = numeric >= 80 ? "#059669" : numeric >= 60 ? "#d97706" : "#dc2626";
  return { score: numeric, text: formatPercent(numeric), color, assessed: true };
}

export function keyBasis(input: { keyYa: number; keyTidak: number; keyTotal?: number }) {
  const assessed = input.keyYa + input.keyTidak;
  const total = input.keyTotal ?? assessed;
  const skipped = Math.max(0, total - assessed);
  if (total <= 0) return "tidak ada kunci yang dinilai";
  if (skipped > 0) return `${input.keyYa + skipped}/${total} kunci (${skipped} Tidak Berlaku)`;
  return `${input.keyYa}/${total} kunci terpenuhi`;
}

export function scoreBasisLine(input: { ya: number; tidak: number; keyYa: number; keyTidak: number; keyTotal?: number }) {
  const nonKeyYa = input.ya - input.keyYa;
  const nonKeyAssessed = nonKeyYa + (input.tidak - input.keyTidak);
  const plain = nonKeyAssessed > 0 ? `${nonKeyYa} dari ${nonKeyAssessed} butir non-kunci` : "Tidak ada butir non-kunci yang dinilai";
  return `${plain} · ${keyBasis(input)}`;
}

export function indicatorPasses(scorePct: number | null | undefined, passingScore = 80) {
  return typeof scorePct === "number" && Number.isFinite(scorePct) && scorePct >= passingScore;
}

export function indicatorPassLabel(scorePct: number | null | undefined, ready = true, passingScore = 80) {
  if (typeof scorePct !== "number" || !Number.isFinite(scorePct)) return "Tidak dinilai.";
  if (!indicatorPasses(scorePct, passingScore)) return "Belum.";
  if (!ready) return "Gerbang bintang belum.";
  return "Lulus.";
}

export function triadGroupNote(scorePct: number | null | undefined, ready = true, passingScore = 80) {
  const label = indicatorPassLabel(scorePct, ready, passingScore);
  if (label === "Tidak dinilai.") return "Gerbang kelompok belum dinilai.";
  if (label === "Lulus.") return "Gerbang kelompok lulus.";
  if (label === "Gerbang bintang belum.") return "Skor butir biasa lulus, gerbang bintang belum.";
  return "Gerbang kelompok belum.";
}

export function agTogetherNote(
  a: { scorePct: number | null; ready: boolean },
  g: { scorePct: number | null; ready: boolean },
  passingScore = 80,
) {
  const aScore = indicatorPasses(a.scorePct, passingScore);
  const gScore = indicatorPasses(g.scorePct, passingScore);
  if (!aScore && !gScore) return "Bagian A dan G belum sama-sama lulus.";
  if (aScore !== gScore) return "Salah satu lulus dan yang lain belum. Keduanya harus berjalan bersamaan sebelum ekspansi.";
  if (!a.ready || !g.ready) return "Skor butir biasa sama-sama di atas ambang, tetapi gerbang bintang belum berjalan bersama.";
  return `Bagian A dan G sama-sama lulus ambang ${passingScore}%.`;
}

export function hampirGapLine(
  input: { status: string; ya: number; tidak: number; keyYa: number; keyTidak: number },
  passingScore = 80,
) {
  if (input.status !== "HAMPIR") return null;
  const ya = input.ya - input.keyYa;
  const assessed = ya + (input.tidak - input.keyTidak);
  const need = itemsToward80(ya, assessed);
  if (need === null || need <= 0) return null;
  return `Butuh ${need} butir lagi menuju ${passingScore}%.`;
}

const META_SENTENCE =
  /butir tanpa panduan peserta|panduan instrumen|berstatus draf di basis data|owner dapat meninjau|sebagai pengganti|support_whatsapp|SUPPORT_WHATSAPP|narasi seksi [a-j] [^:]+:|urutan status/i;

export function plainGlyphs(value: string) {
  return value
    .replace(/\u2192/g, " ke ")
    .replace(/\u2605/g, "bintang ")
    .replace(/[ ]{2,}/g, " ")
    .trim();
}

export function sentenceCase(value: string) {
  const trimmed = value.trim();
  if (!trimmed || trimmed !== trimmed.toUpperCase()) return trimmed;
  const lower = trimmed.toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

function calmShouting(sentence: string) {
  const calmed = sentence.replace(/(?:\b\p{Lu}{3,}\b[\s,:;—\-–]*){3,}/gu, (chunk) => {
    const lower = chunk.toLocaleLowerCase("id-ID");
    return lower.charAt(0).toLocaleUpperCase("id-ID") + lower.slice(1);
  });
  const letters = calmed.replace(/[^\p{L}]/gu, "");
  if (letters.length < 8) return calmed;
  const upper = letters.replace(/[^\p{Lu}]/gu, "").length;
  if (upper / letters.length < 0.7) return calmed;
  const lower = calmed.toLocaleLowerCase("id-ID");
  return lower.charAt(0).toLocaleUpperCase("id-ID") + lower.slice(1);
}

export function publicCopy(text: string | null | undefined) {
  if (!text) return "";
  return plainGlyphs(text)
    .split(/(?<=[.!?])\s+/)
    .map((part) => calmShouting(part.trim()))
    .filter((part) => part && !META_SENTENCE.test(part))
    .join(" ")
    .trim();
}

export function statusActionLine(input: {
  status: string;
  ya: number;
  tidak: number;
  keyYa: number;
  keyTidak: number;
}) {
  const gap = hampirGapLine(input);
  if (input.status === "HAMPIR") {
    return `${gap ?? "Skor butir biasa belum sampai 80%."} Butir kunci yang dinilai sudah Ya, jadi yang ditutup adalah butir biasa.`;
  }
  if (input.status === "BELUM_SIAP") return "Ada butir kunci yang dijawab Tidak. Tutup butir bintang itu dulu. Skor butir biasa tidak membuka gerbang.";
  if (input.status === "DALAM_BAHAYA") return "Minggu ini dulu: tutup butir kunci yang masih Tidak sebelum menambah proyek baru.";
  if (input.status === "SIAP_NAIK") return "Anda sudah siap naik. Jaga butir yang sudah Ya dan bereskan titik lemah sebelum fase berikutnya menekannya.";
  if (input.status === "PERLU_FONDASI") return "Butir kunci sudah Ya, fondasi butir biasa belum.";
  return "Terlalu banyak jawaban Tidak Berlaku, jadi hasil ini belum dapat dinilai.";
}

export function crisisGateLabel(input: { status: string; phaseNumber: number | null; crisisTitle: string | null }) {
  const title = sentenceCase(input.crisisTitle?.trim() ?? "");
  if (!title || !input.phaseNumber) return null;
  const passed = input.status === "SIAP_NAIK" ? "sudah terlewati" : "belum terlewati";
  return `Gerbang Fase ${input.phaseNumber}: ${title} — ${passed}`;
}

export function isRiskSection(score: number | null | undefined) {
  return typeof score === "number" && Number.isFinite(score) && score < 50;
}

export function riskAreaNote(status: string) {
  return status === "SIAP_NAIK" ? SIAP_NAIK_RISK_NOTE : OTHER_RISK_NOTE;
}
