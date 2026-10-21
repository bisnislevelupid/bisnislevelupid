"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Instrument, SavedAnswer } from "@/lib/db/portal";
import type { AnswerCode } from "@/lib/scoring";

export function AuditRunner({
  instrument,
  sessionId,
  initialAnswers,
  locked,
}: {
  instrument: Instrument;
  sessionId: string;
  initialAnswers: SavedAnswer[];
  locked: string[];
}) {
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<string, AnswerCode>>(
    Object.fromEntries(initialAnswers.map((item) => [item.questionId, item.answer])),
  );
  const [notes, setNotes] = useState<Record<string, string>>(
    Object.fromEntries(initialAnswers.filter((item) => item.note).map((item) => [item.questionId, item.note ?? ""])),
  );
  const [lockedIds, setLockedIds] = useState(locked);
  const [sectionIndex, setSectionIndex] = useState(() => {
    const open = instrument.sections.findIndex((section) => !locked.includes(section.id));
    return open === -1 ? instrument.sections.length - 1 : open;
  });
  const [cursor, setCursor] = useState(0);
  const [status, setStatus] = useState("Jawaban tersimpan di akun Anda");
  const [error, setError] = useState("");
  const [guide, setGuide] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const section = instrument.sections[sectionIndex];
  const questions = useMemo(
    () => instrument.questions.filter((question) => question.sectionId === section?.id),
    [instrument.questions, section?.id],
  );
  const openAt = questions.findIndex((question) => !answers[question.id]);
  const limit = openAt === -1 ? questions.length - 1 : openAt;
  const safeCursor = Math.min(cursor, Math.max(limit, 0));
  const current = questions[safeCursor];
  const answeredTotal = instrument.questions.filter((question) => answers[question.id]).length;
  const sectionDone = questions.every((question) => answers[question.id]);
  const allLocked = instrument.sections.every((item) => lockedIds.includes(item.id));
  const readOnly = section ? lockedIds.includes(section.id) : true;

  async function choose(answer: AnswerCode) {
    if (!current || readOnly) return;
    setError("");
    setAnswers((prev) => ({ ...prev, [current.id]: answer }));
    setStatus("Menyimpan...");
    const response = await fetch("/api/akun/jawaban", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, questionId: current.id, answer, note: notes[current.id] ?? "" }),
    });
    const payload = await response.json();
    if (!response.ok) {
      setAnswers((prev) => {
        const next = { ...prev };
        delete next[current.id];
        return next;
      });
      setError(payload.error ?? "Gagal menyimpan");
      setStatus("Belum tersimpan");
      return;
    }
    setStatus("Tersimpan");
    if (safeCursor < questions.length - 1) setCursor(safeCursor + 1);
  }

  async function saveNote() {
    if (!current || !answers[current.id] || readOnly) return;
    await fetch("/api/akun/jawaban", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, questionId: current.id, answer: answers[current.id], note: notes[current.id] ?? "" }),
    });
    setStatus("Catatan tersimpan");
  }

  async function finishSection() {
    if (!section) return;
    const response = await fetch("/api/akun/seksi", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, sectionId: section.id }),
    });
    const payload = await response.json();
    if (!response.ok) {
      setError(payload.error ?? "Seksi belum lengkap");
      return;
    }
    setLockedIds((prev) => [...prev, section.id]);
    const next = instrument.sections.findIndex((item, index) => index > sectionIndex && !lockedIds.includes(item.id));
    setSectionIndex(next === -1 ? Math.min(sectionIndex + 1, instrument.sections.length - 1) : next);
    setCursor(0);
  }

  async function submit() {
    const response = await fetch("/api/akun/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, confirm: true }),
    });
    const payload = await response.json();
    if (!response.ok) {
      setError(payload.error ?? "Belum bisa submit");
      return;
    }
    router.push(`/akun/laporan?sesi=${sessionId}`);
    router.refresh();
  }

  if (!current || !section) return <p>Instrumen ini belum memiliki butir.</p>;

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div style={{ position: "sticky", top: 72, background: "#f8fafc", padding: "8px 0", zIndex: 5 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, fontWeight: 800 }}>
          <span>
            {answeredTotal} dari {instrument.questions.length}
          </span>
          <span style={{ color: "#64748b", fontWeight: 600 }}>{status}</span>
        </div>
        <div style={{ height: 8, background: "#e2e8f0", borderRadius: 999, marginTop: 8 }}>
          <div style={{ width: `${Math.round((answeredTotal / Math.max(instrument.questions.length, 1)) * 100)}%`, height: "100%", background: "#059669", borderRadius: 999 }} />
        </div>
        <div style={{ display: "flex", gap: 8, overflowX: "auto", marginTop: 12 }}>
          {instrument.sections.map((item, index) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                const blocked = instrument.sections.slice(0, index).some((prev) => !lockedIds.includes(prev.id));
                if (blocked) return;
                setSectionIndex(index);
                setCursor(0);
              }}
              style={{
                border: 0,
                borderRadius: 999,
                padding: "8px 12px",
                background: index === sectionIndex ? "#0f172a" : "#fff",
                color: index === sectionIndex ? "#fff" : "#334155",
                fontWeight: 700,
                whiteSpace: "nowrap",
              }}
            >
              {item.code}. {item.name}
            </button>
          ))}
        </div>
      </div>

      <div className="nav-dots" aria-label="Navigasi butir">
        {questions.map((question, index) => {
          const reachable = index <= limit || lockedIds.includes(section.id);
          return (
            <button
              key={question.id}
              type="button"
              disabled={!reachable}
              onClick={() => reachable && setCursor(index)}
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                border: index === safeCursor ? "2px solid #059669" : "1px solid #e2e8f0",
                background: answers[question.id] ? "#ecfdf5" : "#fff",
                fontWeight: 800,
                opacity: reachable ? 1 : 0.4,
              }}
            >
              {question.number}
            </button>
          );
        })}
      </div>

      <article style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 24, padding: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center" }}>
          <span style={{ fontWeight: 800 }}>No. {current.number}</span>
          {current.isKey ? (
            <span style={{ background: "#fef3c7", color: "#92400e", borderRadius: 999, padding: "4px 10px", fontSize: 12, fontWeight: 800 }}>
              Kunci Gerbang
            </span>
          ) : null}
        </div>
        <h2 style={{ fontSize: "1.2rem", lineHeight: 1.45 }}>{current.text}</h2>
        {current.guidance ? (
          <button type="button" onClick={() => setGuide((value) => !value)} style={{ border: 0, background: "transparent", color: "#047857", fontWeight: 700, padding: 0 }}>
            {guide ? "Tutup panduan" : "Lihat panduan"}
          </button>
        ) : null}
        {guide && current.guidance ? <p style={{ background: "#f8fafc", borderRadius: 12, padding: 12 }}>{current.guidance}</p> : null}
        <div className="answer-row" style={{ marginTop: 16 }}>
          {(["YA", "TIDAK"] as const).map((code) => (
            <button key={code} type="button" disabled={readOnly} onClick={() => choose(code)} style={choiceStyle(answers[current.id] === code, code)}>
              {code === "YA" ? "Ya, sudah dilakukan" : "Tidak, belum ada"}
            </button>
          ))}
          {current.allowNa ? (
            <button type="button" disabled={readOnly} onClick={() => choose("TIDAK_BERLAKU")} style={choiceStyle(answers[current.id] === "TIDAK_BERLAKU", "NA")}>
              Tidak berlaku
            </button>
          ) : null}
        </div>
        <label style={{ display: "grid", gap: 6, marginTop: 16, fontWeight: 700 }}>
          Catatan (opsional)
          <textarea
            value={notes[current.id] ?? ""}
            disabled={readOnly}
            onChange={(event) => setNotes((prev) => ({ ...prev, [current.id]: event.target.value }))}
            onBlur={saveNote}
            rows={3}
            style={{ borderRadius: 12, border: "1px solid #e2e8f0", padding: 12, font: "inherit" }}
          />
        </label>
        {readOnly ? <p style={{ color: "#64748b" }}>Seksi ini sudah selesai dan terkunci.</p> : null}
        {error ? <p style={{ color: "#dc2626" }}>{error}</p> : null}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
          <button type="button" disabled={safeCursor === 0} onClick={() => setCursor(safeCursor - 1)} style={ghost}>
            Butir sebelumnya
          </button>
          {sectionDone && !readOnly ? (
            <button type="button" onClick={finishSection} style={primary}>
              Selesaikan seksi
            </button>
          ) : null}
          {allLocked ? (
            <button type="button" onClick={() => setConfirming(true)} style={primary}>
              Submit audit
            </button>
          ) : null}
        </div>
      </article>

      {confirming ? (
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 20, padding: 16 }}>
          <strong>Setelah submit, jawaban tidak bisa diubah.</strong>
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <button type="button" onClick={submit} style={primary}>
              Ya, kirim hasil
            </button>
            <button type="button" onClick={() => setConfirming(false)} style={ghost}>
              Kembali
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function choiceStyle(on: boolean, code: string) {
  const color = code === "TIDAK" ? "#dc2626" : code === "NA" ? "#64748b" : "#059669";
  return {
    minHeight: 48,
    borderRadius: 12,
    border: on ? `2px solid ${color}` : "1px solid #e2e8f0",
    background: on ? "#f8fafc" : "#fff",
    fontWeight: 800,
    padding: "0 14px",
  } as const;
}

const primary = { height: 48, border: 0, borderRadius: 999, background: "#059669", color: "#fff", fontWeight: 800, padding: "0 16px" } as const;
const ghost = { height: 48, borderRadius: 999, border: "1px solid #e2e8f0", background: "#fff", fontWeight: 700, padding: "0 16px" } as const;
