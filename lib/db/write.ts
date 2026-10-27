export function requiredText(value: unknown, label: string) {
  const text = String(value ?? "").trim();
  if (!text) throw new Error(`${label} wajib diisi`);
  return text;
}

export function optionalText(value: unknown) {
  const text = String(value ?? "").trim();
  return text.length ? text : null;
}

export function requiredInt(value: unknown, label: string) {
  const text = String(value ?? "").trim();
  if (!text) throw new Error(`${label} wajib diisi`);
  const n = Number(text);
  if (!Number.isInteger(n)) throw new Error(`${label} harus bilangan bulat`);
  return n;
}

export function optionalInt(value: unknown, label: string) {
  const text = String(value ?? "").trim();
  if (!text) return null;
  const n = Number(text);
  if (!Number.isInteger(n)) throw new Error(`${label} harus bilangan bulat`);
  return n;
}

export function requiredNumber(value: unknown, label: string) {
  const text = String(value ?? "").trim();
  if (!text) throw new Error(`${label} wajib diisi`);
  const n = Number(text);
  if (!Number.isFinite(n)) throw new Error(`${label} harus angka`);
  return n;
}

export function optionalNumber(value: unknown, label: string) {
  const text = String(value ?? "").trim();
  if (!text) return null;
  const n = Number(text);
  if (!Number.isFinite(n)) throw new Error(`${label} harus angka`);
  return n;
}

export function asBool(value: unknown, fallback = false) {
  if (value == null || value === "") return fallback;
  return value === true || value === "true" || value === "on" || value === "t";
}

export function mapWriteError(error: unknown): never {
  const code = (error as { code?: string }).code;
  if (code === "23505") throw new Error("Data dengan kode yang sama sudah ada");
  if (code === "23503") throw new Error("Relasi yang dipilih tidak ditemukan");
  throw error;
}
