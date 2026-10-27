const SECRET_KEY = /(email|e-mail|phone|telp|telepon|mobile|token|redirect|payment_url|snap)/i;
const EMAIL = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const PHONE = /(?:\+62|62|0)8\d{8,12}/g;
const URL_WITH_SECRET = /https?:\/\/[^\s"'<>]*(?:snap|midtrans|token)[^\s"'<>]*/gi;

export function maskEmail(value: string) {
  const [user, domain] = value.split("@");
  if (!domain) return "***";
  const local = user || "";
  const keep = local.slice(0, local.length >= 2 ? 2 : 1);
  return `${keep}***@${domain}`;
}

export function maskPhone(value: string) {
  const digits = value.replace(/\D/g, "");
  if (digits.length < 8) {
    if (digits.length < 6) return "***";
    return `${digits.slice(0, 2)}***${digits.slice(-2)}`;
  }
  return `${digits.slice(0, 4)}****${digits.slice(-3)}`;
}

/** Email atau nomor pada daftar. Teks lain dibiarkan. */
export function maskRecipient(value: string) {
  const text = value.trim();
  if (!text || text === "-") return text || "—";
  if (text.includes("@")) return maskEmail(text);
  if (text.replace(/\D/g, "").length >= 8) return maskPhone(text);
  return text;
}

function maskLoose(value: string) {
  return value
    .replace(URL_WITH_SECRET, "[tautan disamarkan]")
    .replace(EMAIL, (email) => maskEmail(email))
    .replace(PHONE, (phone) => maskPhone(phone));
}

function maskByKey(key: string, value: string) {
  if (/email/i.test(key) || value.includes("@")) return maskEmail(value);
  if (/phone|telp|telepon|mobile/i.test(key)) return maskPhone(value);
  if (/token|redirect|payment_url|snap|url/i.test(key)) return "[rahasia disamarkan]";
  return maskLoose(value);
}

function maskNode(value: unknown, key = ""): unknown {
  if (Array.isArray(value)) return value.map((item) => maskNode(item));
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([name, item]) => [name, maskNode(item, name)]));
  }
  if (typeof value !== "string") return value;
  if (SECRET_KEY.test(key)) return maskByKey(key, value);
  return maskLoose(value);
}

export function maskPaymentPayload(raw: unknown) {
  if (raw == null || raw === "") return "—";
  const text = String(raw);
  try {
    return JSON.stringify(maskNode(JSON.parse(text)), null, 2);
  } catch {
    return maskLoose(text);
  }
}
