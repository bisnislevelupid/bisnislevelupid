import type { ResultStatus } from "@/lib/scoring";

export type StatusCopy = {
  title: string;
  tone: string;
  meaning: string;
  color: string;
  bg: string;
};

const COPY: Record<ResultStatus, StatusCopy> = {
  DALAM_BAHAYA: {
    title: "Dalam bahaya",
    tone: "Krisis kritis",
    meaning: "Tiga atau lebih butir kunci dijawab Tidak, dan skor butir biasa berada di bawah 50%. Ini krisis kritis, bukan sekadar gerbang yang belum terbuka.",
    color: "#b91c1c",
    bg: "#fef2f2",
  },
  BELUM_SIAP: {
    title: "Gerbang belum terbuka",
    tone: "Belum siap",
    meaning: "Ada butir kunci yang dijawab Tidak. Skor butir biasa, setinggi apa pun, tidak menggantikan gerbang itu.",
    color: "#dc2626",
    bg: "#fef2f2",
  },
  SIAP_NAIK: {
    title: "Siap naik fase",
    tone: "Level up ready",
    meaning: "Semua butir kunci yang dinilai dijawab Ya, dan skor butir biasa mencapai minimal 80% tanpa pembulatan.",
    color: "#059669",
    bg: "#ecfdf5",
  },
  HAMPIR: {
    title: "Hampir",
    tone: "Perlu penguatan",
    meaning: "Semua butir kunci yang dinilai dijawab Ya, dan skor butir biasa berada di 60% sampai di bawah 80%.",
    color: "#b45309",
    bg: "#fffbeb",
  },
  PERLU_FONDASI: {
    title: "🟠 Perlu Fondasi",
    tone: "Pondasi pendukung",
    meaning: "Gerbang utama sudah terbuka, tapi pondasi pendukungnya belum terbangun.",
    color: "#c2410c",
    bg: "#fff7ed",
  },
  TIDAK_DAPAT_DINILAI: {
    title: "⚪ Belum Dapat Dinilai",
    tone: "Jawaban tidak representatif",
    meaning: "Terlalu banyak jawaban Tidak Berlaku, jadi hasilnya tidak representatif.",
    color: "#475569",
    bg: "#f8fafc",
  },
};

export function statusLabel(status: ResultStatus | string): StatusCopy {
  if (status in COPY) return COPY[status as ResultStatus];
  return COPY.TIDAK_DAPAT_DINILAI;
}

export function rupiah(value: number | string) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(Number(value));
}

/** Absolute timestamp in Western Indonesia Time, with an explicit WIB label. */
export function formatWib(value: string | Date | null | undefined) {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const formatted = new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(date);
  return `${formatted} WIB`;
}

export const AUDIT_BY_PHASE: Record<string, string> = {
  "1": "audit_1_2",
  "2": "audit_2_3",
  "3": "audit_3_4",
  "4": "audit_4_5",
};

const AUDIT_CODES = new Set(Object.values(AUDIT_BY_PHASE));

/** Phase keys (`1`) and instrument codes (`audit_1_2`) both unlock the same audit. */
export function codesFromUnlocked(raw: string | null | undefined) {
  const codes: string[] = [];
  const seen = new Set<string>();
  for (const part of (raw ?? "").split(",")) {
    const token = part.trim();
    if (!token) continue;
    const code = AUDIT_BY_PHASE[token] ?? (AUDIT_CODES.has(token) ? token : "");
    if (!code || seen.has(code)) continue;
    seen.add(code);
    codes.push(code);
  }
  return codes;
}
