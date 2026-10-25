"use client";

import type { ReactNode } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Bold, Italic, List, ListOrdered, Redo2, Undo2 } from "lucide-react";

export function InstructionEditor({ value, onChange }: { value: string; onChange: (html: string) => void }) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: value || "<p></p>",
    immediatelyRender: false,
    editorProps: { attributes: { class: "instruction-prose" } },
    onUpdate: ({ editor: current }) => onChange(current.getHTML()),
  });

  if (!editor) return null;

  return (
    <div className="instruction-editor" style={{ border: "1px solid #e2e8f0", borderRadius: 10, overflow: "hidden", background: "#fff" }}>
      <div style={{ display: "flex", gap: 2, padding: 6, background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
        <Tool label="Tebal" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}><Bold size={16} /></Tool>
        <Tool label="Miring" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}><Italic size={16} /></Tool>
        <Tool label="Daftar poin" active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}><List size={16} /></Tool>
        <Tool label="Daftar nomor" active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}><ListOrdered size={16} /></Tool>
        <span style={{ width: 1, background: "#e2e8f0", margin: "2px 4px" }} />
        <Tool label="Urungkan" onClick={() => editor.chain().focus().undo().run()}><Undo2 size={16} /></Tool>
        <Tool label="Ulangi" onClick={() => editor.chain().focus().redo().run()}><Redo2 size={16} /></Tool>
      </div>
      <div style={{ padding: "8px 12px" }}>
        <EditorContent editor={editor} />
      </div>
      <p style={{ color: "#64748b", fontSize: "12px", margin: 0, padding: "0 12px 8px" }}>
        Token {"{nominal}"}, {"{rekening}"}, {"{atas_nama}"}, {"{va}"}, {"{kode}"}, dan {"{metode}"} biarkan apa adanya.
      </p>
      <style>{`
        .instruction-editor .instruction-prose { min-height: 140px; outline: none; }
        .instruction-editor .instruction-prose p { margin: 0.35em 0; }
        .instruction-editor .instruction-prose ol { list-style: decimal outside !important; margin: 0.4em 0 !important; padding-left: 1.4rem !important; }
        .instruction-editor .instruction-prose ul { list-style: disc outside !important; margin: 0.4em 0 !important; padding-left: 1.4rem !important; }
        .instruction-editor .instruction-prose li { display: list-item !important; margin: 0.2em 0; }
        .instruction-editor .instruction-prose li p { margin: 0; }
      `}</style>
    </div>
  );
}

function Tool({ children, onClick, active, label }: { children: ReactNode; onClick: () => void; active?: boolean; label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      style={{
        width: 32,
        height: 32,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        border: "none",
        borderRadius: 6,
        background: active ? "#059669" : "transparent",
        color: active ? "#fff" : "#0f172a",
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
}
