"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Instrument, SavedAnswer } from "@/lib/db/portal";
import type { AnswerCode } from "@/lib/scoring";
import { clampCursor, nextAfterAnswer, resumePosition, type ResumeCursor } from "@/lib/audit/runner-progress";
import { useAnswerSync } from "./use-answer-sync";

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
  const sync = useAnswerSync({
    sessionId,
    initialAnswers,
    sections: instrument.sections,
    questions: instrument.questions,
    locked,
  });
  const [lockedIds, setLockedIds] = useState(locked);
  const [sectionIndex, setSectionIndex] = useState(0);
  const [cursor, setCursor] = useState(0);
  const [summary, setSummary] = useState(false);
  const [appliedPlacement, setAppliedPlacement] = useState<ResumeCursor | null>(null);
  const [error, setError] = useState("");
  const [guide, setGuide] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (sync.placement && appliedPlacement !== sync.placement) {
    setAppliedPlacement(sync.placement);
    setSectionIndex(sync.placement.sectionIndex);
    setCursor(sync.placement.cursor);
    setSummary(sync.placement.summary);
  }

  const section = instrument.sections[sectionIndex];
  const questions = instrument.questions.filter((question) => question.sectionId === section?.id);
  const cursorSafe = clampCursor(cursor, questions.length);
  const current = questions[cursorSafe];
  const answeredTotal = instrument.questions.filter((question) => sync.answers[question.id]).length;
  const sectionDone = questions.length > 0 && questions.every((question) => sync.answers[question.id]);
  const allLocked = instrument.sections.every((item) => lockedIds.includes(item.id));
  const readOnly = section ? lockedIds.includes(section.id) : true;
  const pending = sync.sync.pending;
  const blocked = pending > 0 || finishing || submitting;
  const showBanner = pending > 0 && (sync.sync.offline || sync.sync.failed > 0);

  function choose(answer: AnswerCode) {
    if (!current || readOnly || summary) return;
    setError("");
    const index = questions.findIndex((question) => question.id === current.id);
    const advance = nextAfterAnswer(questions.length, index);
    setCursor(advance.cursor);
    setSummary(advance.summary);
    sync.enqueue(current.id, answer, sync.notes[current.id] ?? "");
  }

  function openSection(index: number) {
    const item = instrument.sections[index];
    if (!item) return;
    const blockedSection = instrument.sections.slice(0, index).some((prev) => !lockedIds.includes(prev.id));
    if (blockedSection) return;
    const inSection = instrument.questions.filter((question) => question.sectionId === item.id);
    const open = inSection.findIndex((question) => !sync.answers[question.id]);
    setSectionIndex(index);
    setGuide(false);
    if (open === -1) {
      setSummary(true);
      setCursor(Math.max(inSection.length - 1, 0));
    } else {
      setSummary(false);
      setCursor(open);
    }
  }

  async function finishSection() {
    if (!section || finishing || pending > 0) return;
    setFinishing(true);
    setError("");
    try {
      const saved = await sync.flush();
      if (!saved) {
        setError("Masih ada jawaban yang belum tersimpan. Periksa koneksi, lalu coba lagi.");
        return;
      }
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
      const nextLocked = lockedIds.includes(section.id) ? lockedIds : [...lockedIds, section.id];
      setLockedIds(nextLocked);
      const position = resumePosition(instrument.sections, instrument.questions, sync.getAnswers(), nextLocked);
      setSectionIndex(position.sectionIndex);
      setCursor(position.cursor);
      setSummary(position.summary);
      setGuide(false);
    } finally {
      setFinishing(false);
    }
  }

  async function submit() {
    if (submitting || pending > 0) return;
    setSubmitting(true);
    setError("");
    try {
      const saved = await sync.flush();
      if (!saved) {
        setError("Masih ada jawaban yang belum tersimpan. Periksa koneksi, lalu coba lagi.");
        return;
      }
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
    } finally {
      setSubmitting(false);
    }
  }

  if (!appliedPlacement || !section) {
    return (
      <p className="min-w-0">
        {sync.sync.pending > 0 ? "Mengirim jawaban yang tersimpan di perangkat…" : "Menyiapkan soal…"}
      </p>
    );
  }

  const statusText = pending > 0 ? (showBanner ? "Belum tersimpan" : "Menyimpan...") : "Tersimpan";
  const frontier = questions.findIndex((question) => !sync.answers[question.id]);
  const maxReach = readOnly || frontier < 0 ? questions.length - 1 : frontier;

  return (
    <div className="audit-runner min-w-0 max-w-full" style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr)", gap: 16 }}>
      {showBanner ? (
        <p role="alert" className="min-w-0 break-words" style={{ margin: 0, background: "#fef3c7", color: "#92400e", borderRadius: 12, padding: "10px 12px", fontWeight: 800 }}>
          {pending} jawaban belum tersimpan
        </p>
      ) : null}
      <div className="min-w-0" style={{ position: "sticky", top: 72, background: "#f8fafc", padding: "8px 0", zIndex: 5 }}>
        <div className="flex min-w-0 flex-wrap items-center justify-between gap-2" style={{ fontWeight: 800 }}>
          <span>
            {answeredTotal} dari {instrument.questions.length}
          </span>
          <span aria-live="polite" style={{ color: "#64748b", fontWeight: 600 }}>{statusText}</span>
        </div>
        <div style={{ height: 8, background: "#e2e8f0", borderRadius: 999, marginTop: 8 }}>
          <div style={{ width: `${Math.round((answeredTotal / Math.max(instrument.questions.length, 1)) * 100)}%`, height: "100%", background: "#059669", borderRadius: 999 }} />
        </div>
        <div className="audit-sections flex min-w-0 max-w-full gap-2 overflow-x-auto">
          {instrument.sections.map((item, index) => (
            <button
              key={item.id}
              type="button"
              onClick={() => openSection(index)}
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

      <div className="nav-dots min-w-0 max-w-full" aria-label="Navigasi butir">
        {questions.map((question, index) => {
          const reachable = index <= maxReach;
          const mark = sync.sync.byQuestion[question.id];
          return (
            <button
              key={question.id}
              type="button"
              disabled={!reachable}
              aria-label={`Butir ${question.number}${mark === "failed" ? ", gagal disimpan" : mark === "saving" ? ", menyimpan" : ""}`}
              onClick={() => {
                if (!reachable) return;
                setSummary(false);
                setCursor(index);
                setGuide(false);
              }}
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                flex: "0 0 auto",
                border:
                  mark === "failed"
                    ? "2px solid #dc2626"
                    : index === cursorSafe && !summary
                      ? "2px solid #059669"
                      : mark === "saving"
                        ? "2px solid #d97706"
                        : "1px solid #e2e8f0",
                background: mark === "failed" ? "#fef2f2" : sync.answers[question.id] ? "#ecfdf5" : "#fff",
                fontWeight: 800,
                opacity: reachable ? 1 : 0.4,
              }}
            >
              {question.number}
            </button>
          );
        })}
      </div>

      {summary ? (
        <article className="audit-card min-w-0 max-w-full break-words" style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 24, padding: 20 }}>
          <h2 className="min-w-0 break-words" style={{ fontSize: "1.2rem", lineHeight: 1.45, marginTop: 0 }}>
            {readOnly ? `Seksi ${section.code} terkunci` : `Seksi ${section.code} selesai diisi`}
          </h2>
          <p className="min-w-0 break-words" style={{ color: "#64748b" }}>
            {readOnly
              ? "Jawaban di seksi ini tidak bisa diubah. Lanjut ke seksi berikutnya atau kirim audit bila semua seksi sudah terkunci."
              : `Semua ${questions.length} butir di ${section.name} sudah dijawab. Kunci seksi ini untuk lanjut, atau tinjau kembali jawaban Anda.`}
          </p>
          {error || sync.sync.error ? <p style={{ color: "#dc2626" }}>{error || sync.sync.error}</p> : null}
          <div className="flex min-w-0 flex-wrap gap-2">
            <button type="button" onClick={() => { setSummary(false); setCursor(0); }} style={ghost}>
              Tinjau butir
            </button>
            {sectionDone && !readOnly ? (
              <button type="button" onClick={finishSection} disabled={blocked} aria-busy={finishing} style={busy(primary, blocked)}>
                {finishing ? "Menyelesaikan…" : "Selesaikan seksi"}
              </button>
            ) : null}
            {allLocked ? (
              <button type="button" onClick={() => setConfirming(true)} disabled={blocked} style={busy(primary, blocked)}>
                Submit audit
              </button>
            ) : null}
          </div>
          {pending > 0 ? <p style={{ color: "#92400e" }}>Menunggu semua jawaban terkonfirmasi tersimpan di server.</p> : null}
        </article>
      ) : current ? (
        <article className="audit-card min-w-0 max-w-full break-words" style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 24, padding: 20 }}>
          <div className="audit-card-head flex min-w-0 flex-wrap items-center gap-2">
            <span style={{ fontWeight: 800 }}>No. {current.number}</span>
            {current.isKey ? (
              <span className="shrink-0" style={{ background: "#fef3c7", color: "#92400e", borderRadius: 999, padding: "4px 10px", fontSize: 12, fontWeight: 800 }}>
                ★ Kunci Gerbang
              </span>
            ) : null}
            <SaveChip state={sync.sync.byQuestion[current.id]} answered={Boolean(sync.answers[current.id])} />
          </div>
          <h2 className="min-w-0 break-words" style={{ fontSize: "1.2rem", lineHeight: 1.45 }}>{current.text}</h2>
          {current.guidance ? (
            <button type="button" onClick={() => setGuide((value) => !value)} style={{ border: 0, background: "transparent", color: "#047857", fontWeight: 700, padding: 0 }}>
              {guide ? "Tutup panduan" : "Lihat panduan"}
            </button>
          ) : null}
          {guide && current.guidance ? <p className="min-w-0 break-words" style={{ background: "#f8fafc", borderRadius: 12, padding: 12 }}>{current.guidance}</p> : null}
          <div className="answer-row flex min-w-0 flex-wrap gap-2" style={{ marginTop: 16 }}>
            {(["YA", "TIDAK"] as const).map((code) => (
              <button key={code} type="button" disabled={readOnly} onClick={() => choose(code)} style={choiceStyle(sync.answers[current.id] === code, code)}>
                {code === "YA" ? "Ya, sudah dilakukan" : "Tidak, belum ada"}
              </button>
            ))}
            {current.allowNa ? (
              <button type="button" disabled={readOnly} onClick={() => choose("TIDAK_BERLAKU")} style={choiceStyle(sync.answers[current.id] === "TIDAK_BERLAKU", "NA")}>
                Tidak berlaku
              </button>
            ) : null}
          </div>
          <label className="min-w-0" style={{ display: "grid", gap: 6, marginTop: 16, fontWeight: 700 }}>
            Catatan (opsional)
            <textarea
              value={sync.notes[current.id] ?? ""}
              disabled={readOnly}
              onChange={(event) => sync.setNote(current.id, event.target.value)}
              onBlur={(event) => {
                const answer = sync.answers[current.id];
                if (!answer || readOnly) return;
                sync.enqueue(current.id, answer, event.target.value);
              }}
              rows={3}
              style={{ borderRadius: 12, border: "1px solid #e2e8f0", padding: 12, font: "inherit", minWidth: 0, maxWidth: "100%" }}
            />
          </label>
          {readOnly ? <p style={{ color: "#64748b" }}>Seksi ini sudah selesai dan terkunci.</p> : null}
          {error || sync.sync.error ? <p style={{ color: "#dc2626" }}>{error || sync.sync.error}</p> : null}
          <div className="flex min-w-0 flex-wrap gap-2" style={{ marginTop: 8 }}>
            <button
              type="button"
              disabled={cursorSafe === 0}
              onClick={() => {
                setSummary(false);
                setCursor(cursorSafe - 1);
              }}
              style={ghost}
            >
              Butir sebelumnya
            </button>
            {sectionDone && !readOnly ? (
              <button type="button" onClick={finishSection} disabled={blocked} aria-busy={finishing} style={busy(primary, blocked)}>
                {finishing ? "Menyelesaikan…" : "Selesaikan seksi"}
              </button>
            ) : null}
            {allLocked ? (
              <button type="button" onClick={() => setConfirming(true)} disabled={blocked} style={busy(primary, blocked)}>
                Submit audit
              </button>
            ) : null}
          </div>
          {pending > 0 && sectionDone ? <p style={{ color: "#92400e" }}>Menunggu semua jawaban terkonfirmasi tersimpan di server.</p> : null}
        </article>
      ) : (
        <p>Instrumen ini belum memiliki butir.</p>
      )}

      {confirming ? (
        <div className="min-w-0 break-words" style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 20, padding: 16 }}>
          <strong>Setelah submit, jawaban tidak bisa diubah.</strong>
          <div className="flex min-w-0 flex-wrap gap-2" style={{ marginTop: 12 }}>
            <button type="button" onClick={submit} disabled={blocked} aria-busy={submitting} style={busy(primary, blocked)}>
              {submitting ? "Mengirim…" : "Ya, kirim hasil"}
            </button>
            <button type="button" onClick={() => setConfirming(false)} disabled={submitting} style={ghost}>
              Kembali
            </button>
          </div>
          {pending > 0 ? <p style={{ color: "#92400e" }}>Menunggu semua jawaban terkonfirmasi tersimpan di server.</p> : null}
        </div>
      ) : null}
    </div>
  );
}

function SaveChip({ state, answered }: { state: "saving" | "failed" | undefined; answered: boolean }) {
  const label = state === "failed" ? "Gagal disimpan" : state === "saving" ? "Menyimpan" : answered ? "Tersimpan" : "";
  if (!label) return null;
  const color = state === "failed" ? "#dc2626" : state === "saving" ? "#b45309" : "#047857";
  return (
    <span style={{ color, fontSize: 12, fontWeight: 800 }} aria-live="polite">
      {label}
    </span>
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

function busy<T extends object>(base: T, disabled: boolean) {
  return disabled ? { ...base, opacity: 0.55 } : base;
}

const primary = { height: 48, border: 0, borderRadius: 999, background: "#059669", color: "#fff", fontWeight: 800, padding: "0 16px" } as const;
const ghost = { height: 48, borderRadius: 999, border: "1px solid #e2e8f0", background: "#fff", fontWeight: 700, padding: "0 16px" } as const;
