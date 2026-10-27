"use client";

import { useEffect, useRef, useState, type CSSProperties, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { wrapEmailHtml } from "@/lib/email/html";

const PLACEHOLDERS = "{nama} {invoice} {produk} {nominal} {metode} {batas} {instruksi} {bayar_url} {dashboard_url} {audit_name} {skor} {status} {pdf_url}";

export function TemplateForm({
  id,
  initial,
}: {
  id?: string;
  initial?: { event_trigger: string; channel: string; subject: string | null; message_content: string; is_active: boolean };
}) {
  const router = useRouter();
  const frameRef = useRef<HTMLIFrameElement>(null);
  const bubbleRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [channel, setChannel] = useState(initial?.channel ?? "EMAIL");
  const knownEvent = initial?.event_trigger === "ORDER_PAID" || initial?.event_trigger === "TEST_RESULT" || initial?.event_trigger === "ORDER_CREATED";
  const [eventTrigger, setEventTrigger] = useState(knownEvent ? initial?.event_trigger ?? "ORDER_CREATED" : "ORDER_CREATED");
  const [html, setHtml] = useState(initial?.message_content ?? "<p>Halo {nama},</p>");
  const [previewDoc, setPreviewDoc] = useState(() => wrapEmailHtml(initial?.message_content ?? "<p>Halo {nama},</p>"));
  const whatsapp = channel === "WA" || channel === "WHATSAPP";

  useEffect(() => {
    if (!whatsapp || !bubbleRef.current) return;
    if (document.activeElement === bubbleRef.current) return;
    if (bubbleRef.current.innerText !== html) bubbleRef.current.innerText = html;
  }, [whatsapp, html]);

  function writePreview(next: string) {
    setHtml(next);
    setPreviewDoc(wrapEmailHtml(next));
    if (bubbleRef.current && document.activeElement !== bubbleRef.current) bubbleRef.current.innerText = next;
  }

  function bindPreview() {
    const slot = frameRef.current?.contentDocument?.getElementById("email-body");
    if (!slot) return;
    slot.contentEditable = "true";
    slot.oninput = () => setHtml(slot.innerHTML);
  }

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
        channel,
        subject: form.get("subject"),
        messageContent: html,
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
    <form onSubmit={onSubmit} style={{ display: "grid", gap: 12 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
        <label>Event<span style={{ color: "#dc2626" }}> *</span>
          <select name="eventTrigger" required value={eventTrigger} onChange={(event) => setEventTrigger(event.target.value)} style={field}>
            <option value="ORDER_CREATED">ORDER_CREATED — pesanan dibuat</option>
            <option value="ORDER_PAID">ORDER_PAID — pesanan lunas</option>
            <option value="TEST_RESULT">TEST_RESULT — hasil tes</option>
          </select>
        </label>
        <label>Kanal
          <select value={channel} onChange={(event) => setChannel(event.target.value)} style={field}>
            <option value="EMAIL">EMAIL</option>
            <option value="WA">WA</option>
          </select>
        </label>
        {whatsapp ? null : <label>Subjek<input name="subject" defaultValue={initial?.subject ?? ""} style={field} /></label>}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "minmax(280px, 1fr) minmax(320px, 1fr)", gap: 16, alignItems: "start" }}>
        <div>
          <p style={{ fontWeight: 700, marginBottom: 6 }}>{whatsapp ? "Pesan WhatsApp" : "HTML"}</p>
          <textarea
            value={html}
            onChange={(event) => writePreview(event.target.value)}
            spellCheck={false}
            style={{ ...field, minHeight: 520, fontFamily: "ui-monospace, monospace", fontSize: 12, lineHeight: 1.5 }}
          />
          <p style={{ fontSize: "0.78rem", color: "#64748b", marginTop: 6 }}>Placeholder: {PLACEHOLDERS}</p>
        </div>
        <div>
          <p style={{ fontWeight: 700, marginBottom: 6 }}>{whatsapp ? "Pratinjau chat — ketik langsung" : "Pratinjau email — ketik langsung"}</p>
          {whatsapp ? (
            <div style={{ background: "#e7f7ef", borderRadius: 16, minHeight: 280, padding: 16 }}>
              <div
                ref={bubbleRef}
                contentEditable
                suppressContentEditableWarning
                onInput={(event) => setHtml(event.currentTarget.innerText)}
                style={{ background: "#fff", borderRadius: 12, padding: "12px 14px", whiteSpace: "pre-wrap", lineHeight: 1.5, maxWidth: 420, minHeight: 120, outline: "none" }}
              />
            </div>
          ) : (
            <iframe
              ref={frameRef}
              title="Pratinjau email"
              srcDoc={previewDoc}
              onLoad={bindPreview}
              style={{ width: "100%", height: 560, border: "1px solid #e2e8f0", borderRadius: 12, background: "#eef2f6" }}
            />
          )}
          <p style={{ fontSize: "0.78rem", color: "#64748b", marginTop: 6 }}>
            {whatsapp
              ? "Teks ini yang dikirim ke WhatsApp. Tanda *tebal* mengikuti format WhatsApp."
              : "Tampilan ini sama dengan isi yang masuk ke inbox. Gaya di atribut style ikut tersimpan."}
          </p>
        </div>
      </div>
      <label style={{ display: "flex", gap: 8 }}><input name="isActive" type="checkbox" defaultChecked={initial?.is_active ?? true} /> Aktif</label>
      {error ? <p style={{ color: "#b91c1c" }}>{error}</p> : null}
      <button disabled={pending} style={button}>{pending ? "Menyimpan..." : "Simpan template"}</button>
    </form>
  );
}

const field: CSSProperties = { display: "block", width: "100%", marginTop: 6, border: "1px solid #e2e8f0", borderRadius: 10, padding: "10px 12px", boxSizing: "border-box" };
const button: CSSProperties = { height: 42, border: "none", borderRadius: 999, background: "#059669", color: "#fff", fontWeight: 700, cursor: "pointer", justifySelf: "start", padding: "0 18px" };
