import { formatWib } from "@/lib/portal/labels";

const MONEY_COLUMNS = new Set([
  "price",
  "price_strikethrough",
  "subtotal",
  "discount_amount",
  "admin_fee",
  "admin_fee_flat",
  "total_amount",
  "unique_amount",
  "unit_price",
  "total_price",
  "min_purchase",
  "max_discount",
  "commission_amount",
  "total_revenue",
  "total_commission",
  "discount_applied",
]);

const STATUS_TEXT: Record<string, string> = {
  PAID: "Lunas",
  PENDING: "Menunggu bayar",
  EXPIRED: "Kedaluwarsa",
  CANCELLED: "Dibatalkan",
  ACTIVE: "Aktif",
  INACTIVE: "Nonaktif",
  SENT: "Terkirim",
  FAILED: "Gagal",
  SKIPPED: "Dilewati",
  NOT_STARTED: "Belum mulai",
  IN_PROGRESS: "Sedang dikerjakan",
  COMPLETED: "Selesai",
  SIAP_NAIK: "Siap naik fase",
  HAMPIR: "Hampir",
  BELUM_SIAP: "Belum siap",
  DALAM_BAHAYA: "Dalam bahaya",
  PERLU_FONDASI: "Perlu fondasi",
  TIDAK_DAPAT_DINILAI: "Tidak dapat dinilai",
  PERCENTAGE: "Persen",
  FLAT: "Nominal",
  MANUAL_CANCEL: "Pembatalan manual",
  WEBHOOK: "Webhook",
};

/** Tiga digit terakhir nominal unik. 0 berarti tidak ada kode. */
export function uniqueTransferCode(uniqueAmount: unknown) {
  if (uniqueAmount == null || uniqueAmount === "") return null;
  const amount = Number(uniqueAmount);
  if (!Number.isFinite(amount)) return null;
  const code = Math.abs(Math.round(amount)) % 1000;
  return code === 0 ? null : code;
}

/** Tiga digit unik di belakang nominal, bukan total transfer. */
export function uniqueTransferLabel(total: unknown, uniqueAmount: unknown) {
  const grand = formatRupiah(total as number | string | null | undefined);
  const code = uniqueTransferCode(uniqueAmount);
  if (code == null) return grand;
  return `${grand} (unik ${formatRupiah(code)})`;
}

export function formatRupiah(value: number | string | null | undefined) {
  if (value == null || value === "") return "—";
  const n = Number(value);
  if (!Number.isFinite(n)) return "—";
  const sign = n < 0 ? "-" : "";
  const grouped = Math.abs(Math.round(n)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${sign}Rp ${grouped}`;
}

const PAYMENT_TYPE_LABEL: Record<string, string> = {
  va: "Virtual Account",
  qr_code: "QRIS",
  qris: "QRIS",
  bank_transfer: "Transfer Bank",
  "E-Wallet": "E-Wallet",
  ewallet: "E-Wallet",
  retail_outlet: "Gerai Ritel",
};

export function paymentTypeLabel(type: string) {
  return PAYMENT_TYPE_LABEL[type] ?? type;
}

export function statusText(value: string) {
  if (!value) return "—";
  return STATUS_TEXT[value] ?? value;
}

export function statusColor(value: string) {
  if (value === "SKIPPED") return "#64748b";
  if (value === "PAID" || value === "ACTIVE" || value === "SENT" || value === "COMPLETED") return "#059669";
  if (value === "PENDING" || value === "HAMPIR" || value === "IN_PROGRESS") return "#d97706";
  if (value === "FAILED" || value === "EXPIRED" || value === "INACTIVE" || value === "CANCELLED" || value === "DALAM_BAHAYA" || value === "BELUM_SIAP") {
    return "#dc2626";
  }
  return "#0369a1";
}

function booleanText(name: string, value: unknown) {
  const yes = value === true || value === "true" || value === "t" || value === "Ya";
  if (name === "is_key" || name === "is_key_trigger") return yes ? "Ya ★" : "Tidak";
  return yes ? "Ya" : "Tidak";
}

export function formatCell(
  column: { name: string; type: string },
  value: unknown,
  label?: unknown,
  row?: Record<string, unknown>,
) {
  if (label != null && String(label).trim() !== "") return String(label);
  if (value == null || value === "") {
    if (column.name === "email_verified_at" || column.name === "phone_verified_at") return "Belum";
    return "—";
  }
  if (column.type === "boolean" || typeof value === "boolean") return booleanText(column.name, value);
  if (column.name === "discount_value") {
    return row?.discount_type === "PERCENTAGE" ? `${value}%` : formatRupiah(String(value));
  }
  if (column.name === "commission_value") {
    return row?.commission_type === "PERCENTAGE" || row?.commission_type == null
      ? `${value}%`
      : formatRupiah(String(value));
  }
  if (MONEY_COLUMNS.has(column.name)) return formatRupiah(String(value));
  if (column.type.includes("timestamp") || column.name.endsWith("_at")) {
    return formatWib(value instanceof Date ? value : String(value)) || "—";
  }
  if (column.name === "status" || column.name === "commission_status") return statusText(String(value));
  if (STATUS_TEXT[String(value)] && (column.name === "type" || column.name === "discount_type" || column.name === "commission_type")) {
    return statusText(String(value));
  }
  return String(value);
}
