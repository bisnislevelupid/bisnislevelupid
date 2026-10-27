export const KEY_NA_NOTE = "Butir ini dilewati karena kondisinya tidak berlaku untuk bisnis Anda.";

export const SIAP_NAIK_RISK_NOTE =
  "Anda sudah siap naik, tapi titik lemah ini perlu dibereskan sebelum fase berikutnya menekannya.";

export const OTHER_RISK_NOTE =
  "Seksi dengan skor di bawah 50% adalah area risiko. Titik lemah ini perlu dibereskan, apa pun status keseluruhan audit.";

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

export function scoreBasisLine(input: { ya: number; tidak: number; keyYa: number; keyTidak: number }) {
  const nonKeyYa = input.ya - input.keyYa;
  const nonKeyAssessed = nonKeyYa + (input.tidak - input.keyTidak);
  const keyAssessed = input.keyYa + input.keyTidak;
  const plain = nonKeyAssessed > 0 ? `${nonKeyYa} dari ${nonKeyAssessed} butir non-kunci` : "Tidak ada butir non-kunci yang dinilai";
  const keys = keyAssessed > 0 ? `${input.keyYa}/${keyAssessed} kunci terpenuhi` : "tidak ada kunci yang dinilai";
  return `${plain} · ${keys}`;
}

export function crisisGateLabel(input: { status: string; phaseNumber: number | null; crisisTitle: string | null }) {
  const title = input.crisisTitle?.trim();
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
