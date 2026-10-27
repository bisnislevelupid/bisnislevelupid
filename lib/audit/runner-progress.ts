import type { AnswerCode } from "@/lib/scoring";

export type PendingAnswer = {
  questionId: string;
  answer: AnswerCode;
  note: string;
  seq: number;
};

export type ResumeCursor = {
  sectionIndex: number;
  cursor: number;
  summary: boolean;
};

const ANSWERS = new Set<AnswerCode>(["YA", "TIDAK", "TIDAK_BERLAKU"]);

export function pendingStorageKey(sessionId: string) {
  return `naikfase:audit-pending:${sessionId}`;
}

export function retryDelayMs(attempt: number) {
  const step = Math.max(1, attempt);
  return Math.min(8000, 400 * 2 ** (step - 1));
}

/** A response belongs to an older save when the queued seq has already moved on. */
export function isStaleSave(sentSeq: number, latestSeq: number | undefined) {
  return latestSeq === undefined || latestSeq !== sentSeq;
}

export function nextAfterAnswer(length: number, index: number): { cursor: number; summary: boolean } {
  if (length <= 0) return { cursor: 0, summary: true };
  if (index < length - 1) return { cursor: index + 1, summary: false };
  return { cursor: length - 1, summary: true };
}

/** Keep the cursor inside the section. Do not pull it back to an earlier gap. */
export function clampCursor(cursor: number, length: number) {
  if (length <= 0) return 0;
  return Math.min(Math.max(cursor, 0), length - 1);
}

export function parsePending(raw: string | null): PendingAnswer[] {
  if (!raw) return [];
  try {
    const data = JSON.parse(raw) as unknown;
    const rows = Array.isArray(data)
      ? data
      : data && typeof data === "object" && (data as { v?: unknown }).v === 1 && Array.isArray((data as { items?: unknown }).items)
        ? (data as { items: unknown[] }).items
        : null;
    if (!rows) return [];
    const byId = new Map<string, PendingAnswer>();
    for (const row of rows) {
      if (!row || typeof row !== "object") continue;
      const item = row as Partial<PendingAnswer>;
      if (typeof item.questionId !== "string" || !item.questionId) continue;
      if (typeof item.answer !== "string" || !ANSWERS.has(item.answer as AnswerCode)) continue;
      if (typeof item.seq !== "number" || !Number.isInteger(item.seq) || item.seq <= 0) continue;
      const next: PendingAnswer = {
        questionId: item.questionId,
        answer: item.answer as AnswerCode,
        note: typeof item.note === "string" ? item.note.slice(0, 1000) : "",
        seq: item.seq,
      };
      const prev = byId.get(next.questionId);
      if (!prev || next.seq >= prev.seq) byId.set(next.questionId, next);
    }
    return [...byId.values()];
  } catch {
    return [];
  }
}

export function readPending(sessionId: string): PendingAnswer[] {
  if (typeof window === "undefined") return [];
  try {
    return parsePending(window.localStorage.getItem(pendingStorageKey(sessionId)));
  } catch {
    return [];
  }
}

export function writePending(sessionId: string, items: PendingAnswer[]) {
  if (typeof window === "undefined") return;
  try {
    const key = pendingStorageKey(sessionId);
    if (items.length === 0) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, JSON.stringify({ v: 1, items }));
  } catch {
    /* private mode or a full disk — the in-memory queue still retries */
  }
}

export function mergeSaved(
  saved: Array<{ questionId: string; answer: AnswerCode; note: string | null }>,
  pending: PendingAnswer[],
): { answers: Record<string, AnswerCode>; notes: Record<string, string> } {
  const answers: Record<string, AnswerCode> = {};
  const notes: Record<string, string> = {};
  for (const item of saved) {
    answers[item.questionId] = item.answer;
    if (item.note) notes[item.questionId] = item.note;
  }
  for (const item of pending) {
    answers[item.questionId] = item.answer;
    if (item.note) notes[item.questionId] = item.note;
  }
  return { answers, notes };
}

export function combineAnswers(
  saved: Array<{ questionId: string; answer: AnswerCode; note: string | null }>,
  recalled: { answers: Record<string, AnswerCode>; notes: Record<string, string> } | null,
  pending: PendingAnswer[],
) {
  const base = mergeSaved(saved, []);
  if (recalled) {
    for (const [questionId, answer] of Object.entries(recalled.answers)) {
      if (!base.answers[questionId]) base.answers[questionId] = answer;
    }
    for (const [questionId, note] of Object.entries(recalled.notes)) {
      if (note && !base.notes[questionId]) base.notes[questionId] = note;
    }
  }
  return overlayPending(base, pending);
}

export function overlayPending(
  base: { answers: Record<string, AnswerCode>; notes: Record<string, string> },
  pending: PendingAnswer[],
) {
  return mergeSaved(
    Object.entries(base.answers).map(([questionId, answer]) => ({
      questionId,
      answer,
      note: base.notes[questionId] ?? null,
    })),
    pending,
  );
}

/**
 * First unanswered item in section order, then question order.
 * A fully answered unlocked section opens its summary so the participant can lock it.
 * When every section is locked, the last section's summary is the submit point.
 */
export function resumePosition<S extends { id: string }, Q extends { id: string; sectionId: string }>(
  sections: S[],
  questions: Q[],
  answers: Record<string, string | undefined>,
  locked: string[],
): ResumeCursor {
  const lockedSet = new Set(locked);
  for (let sectionIndex = 0; sectionIndex < sections.length; sectionIndex += 1) {
    const section = sections[sectionIndex];
    if (!section || lockedSet.has(section.id)) continue;
    const inSection = questions.filter((question) => question.sectionId === section.id);
    const open = inSection.findIndex((question) => !answers[question.id]);
    if (open === -1) {
      return { sectionIndex, cursor: Math.max(inSection.length - 1, 0), summary: true };
    }
    return { sectionIndex, cursor: open, summary: false };
  }
  const sectionIndex = Math.max(sections.length - 1, 0);
  const lastId = sections[sectionIndex]?.id;
  const inLast = questions.filter((question) => question.sectionId === lastId);
  return { sectionIndex, cursor: Math.max(inLast.length - 1, 0), summary: true };
}
