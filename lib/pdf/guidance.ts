const EDITOR_GUIDANCE =
  /slide anda|materi anda|materi \(sirah\)|sirah anda|catatan asli|versi lama berbunyi|ringkasan dari|koreksi:|konsolidasi dengan|relevan langsung|pt anda|restrukturisasi anda|rencana restrukturisasi/i;

export function customerGuidance(text: string | null | undefined, audience?: string | null) {
  if (audience === "editor" || audience === "missing") return null;
  const trimmed = text?.replace(/\s+/g, " ").trim() ?? "";
  if (!trimmed || trimmed === "-") return null;
  if (EDITOR_GUIDANCE.test(trimmed)) return null;
  return trimmed;
}
