"use client";

import { useState, type CSSProperties, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export function TemplateForm({
  id,
  initial,
}: {
  id?: string;
  initial?: { event_trigger: string; channel: string; subject: string | null; message_content: string; is_active: boolean };
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const res = await fetch(id ? `/api/panel/managed/notification-templates/${id}` : "/api/panel/managed/notification-templates", {
      method: id ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventTrigger: form.get("eventTrigger"),
        channel: form.get("channel"),
        subject: form.get("subject"),
        messageContent: form.get("messageContent"),
        isActive: form.get("isActive") === "on",
      }),
    });
    const json = await res.json();
    setPending(false);
    if (!res.ok) {
      setError(json.error ?? "Gagal menyimpan");
      return;
    }
    router.push("/panel/template-notifikasi");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} style={{ display: "grid", gap: 12, maxWidth: 640 }}>
      <label>Event<input name="eventTrigger" required defaultValue={initial?.event_trigger} style={field} /></label>
      <label>Kanal<input name="channel" required defaultValue={initial?.channel ?? "EMAIL"} style={field} /></label>
      <label>Subjek<input name="subject" defaultValue={initial?.subject ?? ""} style={field} /></label>
      <label>Isi pesan<textarea name="messageContent" required defaultValue={initial?.message_content} style={{ ...field, minHeight: 160 }} /></label>
      <label style={{ display: "flex", gap: 8 }}><input name="isActive" type="checkbox" defaultChecked={initial?.is_active ?? true} /> Aktif</label>
      {error ? <p style={{ color: "#b91c1c" }}>{error}</p> : null}
      <button disabled={pending} style={button}>{pending ? "Menyimpan..." : "Simpan template"}</button>
    </form>
  );
}

const field: CSSProperties = { display: "block", width: "100%", marginTop: 6, border: "1px solid #e2e8f0", borderRadius: 10, padding: "10px 12px" };
const button: CSSProperties = { height: 42, border: "none", borderRadius: 999, background: "#059669", color: "#fff", fontWeight: 700, cursor: "pointer" };
