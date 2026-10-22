"use client";

import { useMemo, useState, type CSSProperties, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
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
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [html, setHtml] = useState(initial?.message_content ?? "<p>Halo {nama},</p>");
  const editor = useEditor({
    extensions: [StarterKit, Link.configure({ openOnClick: false })],
    content: initial?.message_content ?? "<p>Halo {nama},</p>",
    immediatelyRender: false,
    onUpdate: ({ editor: current }) => setHtml(current.getHTML()),
  });
  const preview = useMemo(() => wrapEmailHtml(html), [html]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editor) return;
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
        messageContent: editor.getHTML(),
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

  function mark(action: () => void) {
    action();
  }

  return (
    <form onSubmit={onSubmit} style={{ display: "grid", gap: 12, maxWidth: 720 }}>
      <label>Event<input name="eventTrigger" required defaultValue={initial?.event_trigger} style={field} /></label>
      <label>Kanal<input name="channel" required defaultValue={initial?.channel ?? "EMAIL"} style={field} /></label>
      <label>Subjek<input name="subject" defaultValue={initial?.subject ?? ""} style={field} /></label>
      <div>
        <p style={{ fontWeight: 700, marginBottom: 6 }}>Isi pesan</p>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
          <Tool label="Tebal" onClick={() => mark(() => editor?.chain().focus().toggleBold().run())} />
          <Tool label="Miring" onClick={() => mark(() => editor?.chain().focus().toggleItalic().run())} />
          <Tool label="Judul" onClick={() => mark(() => editor?.chain().focus().toggleHeading({ level: 2 }).run())} />
          <Tool label="Daftar" onClick={() => mark(() => editor?.chain().focus().toggleBulletList().run())} />
          <Tool label="Nomor" onClick={() => mark(() => editor?.chain().focus().toggleOrderedList().run())} />
          <Tool
            label="Tautan"
            onClick={() => {
              const href = window.prompt("URL tautan", "https://");
              if (!href) return;
              editor?.chain().focus().extendMarkRange("link").setLink({ href }).run();
            }}
          />
        </div>
        <div style={{ border: "1px solid #e2e8f0", borderRadius: 12, padding: 12, minHeight: 160, background: "#fff" }}>
          <style>{`.ProseMirror{outline:none;min-height:140px}.ProseMirror p{margin:0 0 8px}.ProseMirror ul,.ProseMirror ol{padding-left:1.25rem;margin:0 0 8px}`}</style>
          <EditorContent editor={editor} />
        </div>
        <p style={{ fontSize: "0.78rem", color: "#64748b", marginTop: 6 }}>Placeholder: {PLACEHOLDERS}</p>
      </div>
      <div>
        <p style={{ fontWeight: 700, marginBottom: 6 }}>Pratinjau inbox</p>
        <iframe title="Pratinjau email" srcDoc={preview} style={{ width: "100%", height: 420, border: "1px solid #e2e8f0", borderRadius: 12, background: "#f8fafc" }} />
      </div>
      <label style={{ display: "flex", gap: 8 }}><input name="isActive" type="checkbox" defaultChecked={initial?.is_active ?? true} /> Aktif</label>
      {error ? <p style={{ color: "#b91c1c" }}>{error}</p> : null}
      <button disabled={pending} style={button}>{pending ? "Menyimpan..." : "Simpan template"}</button>
    </form>
  );
}

function Tool({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} style={{ border: "1px solid #e2e8f0", background: "#fff", borderRadius: 999, padding: "6px 12px", fontWeight: 700, cursor: "pointer" }}>
      {label}
    </button>
  );
}

const field: CSSProperties = { display: "block", width: "100%", marginTop: 6, border: "1px solid #e2e8f0", borderRadius: 10, padding: "10px 12px" };
const button: CSSProperties = { height: 42, border: "none", borderRadius: 999, background: "#059669", color: "#fff", fontWeight: 700, cursor: "pointer" };
