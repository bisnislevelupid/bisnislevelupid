export const WA_NOT_CONFIGURED = "WA belum dikonfigurasi";

export type FonnteResult = {
  ok: boolean;
  skipped: boolean;
  error: string | null;
  response: unknown;
};

export function skippedWhatsApp(): FonnteResult {
  return { ok: false, skipped: true, error: WA_NOT_CONFIGURED, response: null };
}

/** Status log WA. Token kosong selalu SKIPPED, bukan FAILED. */
export function whatsAppLog(result: FonnteResult): { status: "SENT" | "FAILED" | "SKIPPED"; error: string | null } {
  if (result.skipped) return { status: "SKIPPED", error: WA_NOT_CONFIGURED };
  if (result.ok) return { status: "SENT", error: null };
  return { status: "FAILED", error: result.error };
}

export async function sendFonnte(input: { target: string; message: string; fileUrl?: string | null }): Promise<FonnteResult> {
  const token = process.env.FONNTE_TOKEN?.trim();
  if (!token) return skippedWhatsApp();
  const body = new FormData();
  body.set("target", input.target);
  body.set("message", input.message.slice(0, 60000));
  body.set("countryCode", "62");
  const fileUrl = input.fileUrl ?? "";
  if (fileUrl.startsWith("https://")) {
    body.set("url", fileUrl);
    body.set("filename", "laporan.pdf");
  }
  try {
    const response = await fetch("https://api.fonnte.com/send", {
      method: "POST",
      headers: { Authorization: token },
      body,
    });
    const payload = (await response.json().catch(() => null)) as { status?: boolean; reason?: string; detail?: string } | null;
    const ok = response.ok && payload?.status === true;
    return {
      ok,
      skipped: false,
      error: ok ? null : payload?.reason || payload?.detail || `Fonnte HTTP ${response.status}`,
      response: payload,
    };
  } catch (error) {
    return {
      ok: false,
      skipped: false,
      error: error instanceof Error ? error.message : "Gagal menghubungi Fonnte",
      response: null,
    };
  }
}
