import type { AnswerCode } from "@/lib/scoring";

export const JOURNAL_TTL_MS = 24 * 60 * 60 * 1000;
export const ANSWER_GUARD_MS = 300;

export type PendingAnswer = {
  questionId: string;
  answer: AnswerCode;
  note: string;
  seq: number;
};

export type AckedEntry = {
  questionId: string;
  answer: AnswerCode;
  note: string;
  seq: number;
  ackedAt: number;
};

export type ServerAnswer = {
  questionId: string;
  answer: AnswerCode;
  note: string | null;
  clientSeq: number;
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

export function journalStorageKey(sessionId: string) {
  return `naikfase:audit-journal:${sessionId}`;
}

/** Ignore answer clicks briefly after auto-advance. Navigation and saves stay open. */
export function answerInputBlocked(advancedAt: number, now: number) {
  return now - advancedAt < ANSWER_GUARD_MS;
}

/** HTTP 200 with applied:false is not a confirmed save. A missing flag keeps the previous contract. */
export function responseCountsAsSaved(data: { applied?: boolean } | null | undefined) {
  return !data || data.applied !== false;
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

export function writePending(sessionId: string, local: PendingAnswer[], journal: AckedEntry[] = []) {
  if (typeof window === "undefined") return;
  try {
    const key = pendingStorageKey(sessionId);
    const stored = parsePending(window.localStorage.getItem(key));
    const items = reconcilePending(stored, local, journal);
    if (items.length === 0) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, JSON.stringify({ v: 1, items }));
  } catch {
    /* private mode or a full disk — the in-memory queue still retries */
  }
}

export function parseJournal(raw: string | null): AckedEntry[] {
  if (!raw) return [];
  try {
    const data = JSON.parse(raw) as unknown;
    const rows =
      data && typeof data === "object" && (data as { v?: unknown }).v === 1 && Array.isArray((data as { items?: unknown }).items)
        ? (data as { items: unknown[] }).items
        : null;
    if (!rows) return [];
    const byId = new Map<string, AckedEntry>();
    for (const row of rows) {
      if (!row || typeof row !== "object") continue;
      const item = row as Partial<AckedEntry>;
      if (typeof item.questionId !== "string" || !item.questionId) continue;
      if (typeof item.answer !== "string" || !ANSWERS.has(item.answer as AnswerCode)) continue;
      if (typeof item.seq !== "number" || !Number.isInteger(item.seq) || item.seq <= 0) continue;
      if (typeof item.ackedAt !== "number" || !Number.isFinite(item.ackedAt) || item.ackedAt <= 0) continue;
      const next: AckedEntry = {
        questionId: item.questionId,
        answer: item.answer as AnswerCode,
        note: typeof item.note === "string" ? item.note.slice(0, 1000) : "",
        seq: item.seq,
        ackedAt: item.ackedAt,
      };
      const prev = byId.get(next.questionId);
      if (!prev || next.seq >= prev.seq) byId.set(next.questionId, next);
    }
    return [...byId.values()];
  } catch {
    return [];
  }
}

export function readJournal(sessionId: string): AckedEntry[] {
  if (typeof window === "undefined") return [];
  try {
    return parseJournal(window.localStorage.getItem(journalStorageKey(sessionId)));
  } catch {
    return [];
  }
}

export function writeJournal(sessionId: string, local: AckedEntry[], server: ServerAnswer[], now: number) {
  if (typeof window === "undefined") return;
  try {
    const key = journalStorageKey(sessionId);
    const stored = parseJournal(window.localStorage.getItem(key));
    const items = syncJournal(stored, local, server, now);
    if (items.length === 0) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, JSON.stringify({ v: 1, items }));
  } catch {
    /* the in-memory journal still covers this tab */
  }
}

export function mergeByHigherSeq<T extends { questionId: string; seq: number }>(...lists: T[][]): T[] {
  const byId = new Map<string, T>();
  for (const list of lists) {
    for (const item of list) {
      const prev = byId.get(item.questionId);
      if (!prev || item.seq >= prev.seq) byId.set(item.questionId, item);
    }
  }
  return [...byId.values()];
}

export function pruneJournal(entries: AckedEntry[], server: ServerAnswer[], now: number) {
  const serverSeq = new Map(server.map((item) => [item.questionId, item.clientSeq]));
  return entries.filter((entry) => {
    if (now - entry.ackedAt >= JOURNAL_TTL_MS) return false;
    return (serverSeq.get(entry.questionId) ?? 0) < entry.seq;
  });
}

export function mergeJournal(stored: AckedEntry[], local: AckedEntry[]) {
  return mergeByHigherSeq(stored, local);
}

export function syncJournal(stored: AckedEntry[], local: AckedEntry[], server: ServerAnswer[], now: number) {
  return pruneJournal(mergeJournal(stored, local), server, now);
}

/** Keep every tab's newest unacked answer. An acked seq does not erase another question. */
export function reconcilePending(stored: PendingAnswer[], local: PendingAnswer[], journal: AckedEntry[]) {
  const journalSeq = new Map(journal.map((entry) => [entry.questionId, entry.seq]));
  return mergeByHigherSeq(stored, local).filter((item) => item.seq > (journalSeq.get(item.questionId) ?? 0));
}

/**
 * Merge another tab's queue without dropping an in-flight resend of our own journal entry.
 * A newer ack (higher seq) still replaces that resend.
 */
export function absorbQueues(
  storedPending: PendingAnswer[],
  localPending: PendingAnswer[],
  storedJournal: AckedEntry[],
  localJournal: AckedEntry[],
  server: ServerAnswer[],
  now: number,
) {
  const journal = syncJournal(storedJournal, localJournal, server, now);
  const pending = reconcilePending(storedPending, localPending, journal);
  const seen = new Set(pending.map((item) => item.questionId));
  for (const item of localPending) {
    if (seen.has(item.questionId)) continue;
    const acked = journal.find((entry) => entry.questionId === item.questionId);
    if (!acked || acked.seq !== item.seq || acked.answer !== item.answer || acked.note !== item.note) continue;
    pending.push(item);
    seen.add(item.questionId);
  }
  return { pending, journal };
}

/** Pending items plus journal entries the server snapshot has not caught up with. */
export function resendQueue(stored: PendingAnswer[], local: PendingAnswer[], journal: AckedEntry[]) {
  const fromJournal: PendingAnswer[] = journal.map((entry) => ({
    questionId: entry.questionId,
    answer: entry.answer,
    note: entry.note,
    seq: entry.seq,
  }));
  return mergeByHigherSeq(reconcilePending(stored, local, journal), fromJournal);
}

export function resolveUnapplied(
  sent: PendingAnswer,
  stored: { clientSeq: number; answer: AnswerCode; note: string | null },
): { action: "adopt"; answer: AnswerCode; note: string; seq: number } | { action: "requeue"; seq: number } {
  if (stored.clientSeq > sent.seq) {
    return {
      action: "adopt",
      answer: stored.answer,
      note: stored.note ?? "",
      seq: stored.clientSeq,
    };
  }
  return { action: "requeue", seq: Math.max(stored.clientSeq + 1, sent.seq + 1) };
}

export function bootAuditState(input: {
  server: ServerAnswer[];
  pending: PendingAnswer[];
  journal: AckedEntry[];
  recalled: { answers: Record<string, AnswerCode>; notes: Record<string, string> } | null;
  now: number;
}) {
  const journal = pruneJournal(input.journal, input.server, input.now);
  const pending = resendQueue(input.pending, [], journal);
  const answers: Record<string, AnswerCode> = {};
  const notes: Record<string, string> = {};
  for (const item of input.server) {
    answers[item.questionId] = item.answer;
    if (item.note) notes[item.questionId] = item.note;
  }
  if (input.recalled) {
    for (const [questionId, answer] of Object.entries(input.recalled.answers)) {
      if (!answers[questionId]) answers[questionId] = answer;
    }
    for (const [questionId, note] of Object.entries(input.recalled.notes)) {
      if (note && !notes[questionId]) notes[questionId] = note;
    }
  }
  for (const entry of journal) {
    const pendingItem = pending.find((item) => item.questionId === entry.questionId);
    if (pendingItem && pendingItem.seq > entry.seq) continue;
    answers[entry.questionId] = entry.answer;
    if (entry.note) notes[entry.questionId] = entry.note;
    else delete notes[entry.questionId];
  }
  for (const item of pending) {
    answers[item.questionId] = item.answer;
    if (item.note) notes[item.questionId] = item.note;
    else delete notes[item.questionId];
  }
  const seqFloor = Math.max(
    input.now,
    0,
    ...pending.map((item) => item.seq),
    ...input.server.map((item) => item.clientSeq),
    ...journal.map((item) => item.seq),
  );
  return {
    answers,
    notes,
    pending,
    journal,
    seqFloor,
    nextSeq: seqFloor + 1,
  };
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
