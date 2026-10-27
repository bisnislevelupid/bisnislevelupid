import type { ResultStatus } from "@/lib/scoring";

export function statusLabel(status: ResultStatus | string) {
  switch (status) {
    case "SIAP_NAIK":
      return { title: "Siap naik fase", tone: "Siap naik", color: "#059669", bg: "#ecfdf5" };
    case "HAMPIR":
      return { title: "Hampir", tone: "Perlu penguatan", color: "#b45309", bg: "#fffbeb" };
    case "BELUM_SIAP":
      return { title: "Gerbang belum terbuka", tone: "Belum siap", color: "#dc2626", bg: "#fef2f2" };
    case "DALAM_BAHAYA":
      return { title: "Dalam bahaya", tone: "Krisis kritis", color: "#b91c1c", bg: "#fef2f2" };
    case "PERLU_FONDASI":
      return { title: "Perlu fondasi", tone: "Skor di bawah 60", color: "#c2410c", bg: "#fff7ed" };
    default:
      return { title: "Tidak dapat dinilai", tone: "Data kurang", color: "#64748b", bg: "#f8fafc" };
  }
}

export function rupiah(value: number | string) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(Number(value));
}

/** Timestamp Postgres/ISO. Tanpa zona dianggap UTC, supaya jam tidak ikut zona proses. */
function parseInstant(value: string) {
  const text = value.trim();
  const match = text.match(
    /^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?)(?:\s*(Z|[+-]\d{2}(?::?\d{2})?))?$/,
  );
  if (!match) return new Date(text);
  const [, day, time, zone] = match;
  if (!zone || zone === "Z") return new Date(`${day}T${time}Z`);
  const compact = zone.replace(":", "");
  const sign = compact[0] === "-" ? "-" : "+";
  const hours = compact.slice(1, 3).padStart(2, "0");
  const minutes = (compact.slice(3, 5) || "00").padEnd(2, "0");
  return new Date(`${day}T${time}${sign}${hours}:${minutes}`);
}

/** Absolute timestamp in Western Indonesia Time, with an explicit WIB label. */
export function formatWib(value: string | Date | null | undefined) {
  if (value == null || value === "") return "";
  const date = value instanceof Date ? value : parseInstant(String(value));
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
