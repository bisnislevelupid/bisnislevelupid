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

export const AUDIT_BY_PHASE: Record<string, string> = {
  "1": "audit_1_2",
  "2": "audit_2_3",
  "3": "audit_3_4",
  "4": "audit_4_5",
};
