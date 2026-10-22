type FonnteResult = {
  ok: boolean;
  error: string | null;
  response: unknown;
};

export async function sendFonnte(input: { target: string; message: string; fileUrl?: string | null }): Promise<FonnteResult> {
  const token = process.env.FONNTE_TOKEN;
  if (!token) {
    return { ok: false, error: "FONNTE_TOKEN belum diset", response: null };
  }
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
      error: ok ? null : payload?.reason || payload?.detail || `Fonnte HTTP ${response.status}`,
      response: payload,
    };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Gagal menghubungi Fonnte", response: null };
  }
}
