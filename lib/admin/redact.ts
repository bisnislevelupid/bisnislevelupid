const SECRET_KEY = /(email|e-mail|phone|telp|telepon|mobile|token|redirect|payment_url|snap)/i;
const EMAIL = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const PHONE = /(?:\+62|62|0)8\d{8,12}/g;
const URL_WITH_SECRET = /https?:\/\/[^\s"'<>]*(?:snap|midtrans|token)[^\s"'<>]*/gi;

export function maskEmail(value: string) {
  const [user, domain] = value.split("@");
  if (!domain) return "***";
  return `${(user || "").slice(0, 1)}***@${domain}`;
}

export function maskPhone(value: string) {
  const digits = value.replace(/\D/g, "");
  if (digits.length < 6) return "***";
  return `${value.slice(0, 3)}***${value.slice(-3)}`;
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
