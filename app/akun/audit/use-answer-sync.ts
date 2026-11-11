"use client";

import { useCallback, useLayoutEffect, useRef, useState } from "react";
import type { AnswerCode } from "@/lib/scoring";
import type { SavedAnswer } from "@/lib/db/portal";
import {
  absorbQueues,
  bootAuditState,
  isStaleSave,
  journalStorageKey,
  pendingStorageKey,
  readJournal,
  readPending,
  resolveUnapplied,
  responseCountsAsSaved,
  resumePosition,
  retryDelayMs,
  writeJournal,
  writePending,
  type AckedEntry,
  type PendingAnswer,
  type ResumeCursor,
  type ServerAnswer,
} from "@/lib/audit/runner-progress";

export type QuestionSync = "saving" | "failed";

export type SyncView = {
  pending: number;
  failed: number;
  offline: boolean;
  byQuestion: Record<string, QuestionSync>;
  error: string;
};

type Snapshot = { answers: Record<string, AnswerCode>; notes: Record<string, string> };

type PostResult =
  | { kind: "applied" }
  | { kind: "unapplied"; answer: AnswerCode; note: string; clientSeq: number }
  | { kind: "permanent" }
  | { kind: "retry" }
  | { kind: "stale" };

const memory = new Map<string, Snapshot>();
let activeToken = 0;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isAnswer(value: unknown): value is AnswerCode {
  return value === "YA" || value === "TIDAK" || value === "TIDAK_BERLAKU";
}

function toServer(items: SavedAnswer[]): ServerAnswer[] {
  return items.map((item) => ({
    questionId: item.questionId,
    answer: item.answer,
    note: item.note,
    clientSeq: Number.isFinite(item.clientSeq) ? item.clientSeq : 0,
  }));
}

function queueSignature(queue: Map<string, PendingAnswer>, journal: Map<string, AckedEntry>) {
  const pending = [...queue.values()]
    .map((item) => `${item.questionId}:${item.seq}:${item.answer}:${item.note}`)
    .sort()
    .join("|");
  const acked = [...journal.values()]
    .map((item) => `${item.questionId}:${item.seq}:${item.answer}:${item.note}`)
    .sort()
    .join("|");
  return `${pending}#${acked}`;
}

const emptySync: SyncView = { pending: 0, failed: 0, offline: false, byQuestion: {}, error: "" };

export function useAnswerSync({
  sessionId,
  initialAnswers,
  sections,
  questions,
  locked,
}: {
  sessionId: string;
  initialAnswers: SavedAnswer[];
  sections: Array<{ id: string }>;
  questions: Array<{ id: string; sectionId: string }>;
  locked: string[];
}) {
  const [answers, setAnswers] = useState<Record<string, AnswerCode>>(() =>
    Object.fromEntries(initialAnswers.map((item) => [item.questionId, item.answer])),
  );
  const [notes, setNotes] = useState<Record<string, string>>(() =>
    Object.fromEntries(initialAnswers.filter((item) => item.note).map((item) => [item.questionId, item.note ?? ""])),
  );
  const [sync, setSync] = useState<SyncView>(emptySync);
  const [placement, setPlacement] = useState<ResumeCursor | null>(null);

  const answersRef = useRef(answers);
  const notesRef = useRef(notes);
  const sectionsRef = useRef(sections);
  const questionsRef = useRef(questions);
  const lockedRef = useRef(locked);
  const initialRef = useRef(initialAnswers);
  answersRef.current = answers;
  notesRef.current = notes;
  sectionsRef.current = sections;
  questionsRef.current = questions;
  lockedRef.current = locked;
  initialRef.current = initialAnswers;

  const queueRef = useRef(new Map<string, PendingAnswer>());
  const journalRef = useRef(new Map<string, AckedEntry>());
  const serverRef = useRef<ServerAnswer[]>([]);
  const pumpingRef = useRef(new Map<string, Promise<void>>());
  const failedRef = useRef(new Set<string>());
  const permanentRef = useRef(new Set<string>());
  const seqRef = useRef(0);
  const offlineRef = useRef(false);
  const errorRef = useRef("");
  const tokenRef = useRef(0);
  const channelRef = useRef<BroadcastChannel | null>(null);
  const lastSigRef = useRef("");

  const applyLocal = useCallback((questionId: string, answer: AnswerCode, note: string) => {
    const nextAnswers = { ...answersRef.current, [questionId]: answer };
    const nextNotes = { ...notesRef.current };
    if (note) nextNotes[questionId] = note;
    else delete nextNotes[questionId];
    answersRef.current = nextAnswers;
    notesRef.current = nextNotes;
    setAnswers(nextAnswers);
    setNotes(nextNotes);
  }, []);

  const publish = useCallback(
    (broadcast = true) => {
      if (tokenRef.current !== activeToken) return;
      const byQuestion: Record<string, QuestionSync> = {};
      let failed = 0;
      for (const id of queueRef.current.keys()) {
        const bad = failedRef.current.has(id) || permanentRef.current.has(id);
        byQuestion[id] = bad ? "failed" : "saving";
        if (bad) failed += 1;
      }
      const snapshot = { answers: answersRef.current, notes: notesRef.current };
      memory.set(sessionId, snapshot);
      const now = Date.now();
      writePending(sessionId, [...queueRef.current.values()], [...journalRef.current.values()]);
      writeJournal(sessionId, [...journalRef.current.values()], serverRef.current, now);
      setSync({
        pending: queueRef.current.size,
        failed,
        offline: offlineRef.current,
        byQuestion,
        error: errorRef.current,
      });
      const signature = queueSignature(queueRef.current, journalRef.current);
      if (!broadcast || signature === lastSigRef.current) return;
      lastSigRef.current = signature;
      channelRef.current?.postMessage({ type: "sync" });
    },
    [sessionId],
  );

  const postAnswer = useCallback(
    async (item: PendingAnswer): Promise<PostResult> => {
      let response: Response;
      try {
        response = await fetch("/api/akun/jawaban", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          cache: "no-store",
          keepalive: true,
          body: JSON.stringify({
            sessionId,
            questionId: item.questionId,
            answer: item.answer,
            note: item.note,
            clientSeq: item.seq,
          }),
        });
      } catch {
        return { kind: "retry" };
      }
      if (isStaleSave(item.seq, queueRef.current.get(item.questionId)?.seq)) return { kind: "stale" };
      if (response.ok) {
        let payload: {
          data?: { applied?: boolean; answer?: unknown; note?: unknown; clientSeq?: unknown };
        } = {};
        try {
          payload = (await response.json()) as typeof payload;
        } catch {
          payload = {};
        }
        if (responseCountsAsSaved(payload.data)) return { kind: "applied" };
        const storedAnswer = isAnswer(payload.data?.answer) ? payload.data.answer : null;
        const clientSeq = typeof payload.data?.clientSeq === "number" ? payload.data.clientSeq : 0;
        return {
          kind: "unapplied",
          answer: storedAnswer ?? item.answer,
          note: typeof payload.data?.note === "string" ? payload.data.note : "",
          clientSeq: storedAnswer ? clientSeq : 0,
        };
      }
      if (response.status === 400 || response.status === 401 || response.status === 403) {
        try {
          const payload = (await response.json()) as { error?: string };
          if (payload.error) errorRef.current = payload.error;
        } catch {
          errorRef.current = "Jawaban ditolak";
        }
        return { kind: "permanent" };
      }
      return { kind: "retry" };
    },
    [sessionId],
  );

  const pump = useCallback(
    (questionId: string) => {
      const existing = pumpingRef.current.get(questionId);
      if (existing) return existing;
      const token = tokenRef.current;
      let job: Promise<void> = Promise.resolve();
      job = (async () => {
        await Promise.resolve();
        let attempt = 0;
        try {
          while (token === activeToken && queueRef.current.has(questionId)) {
            if (permanentRef.current.has(questionId)) return;
            if (typeof navigator !== "undefined" && navigator.onLine === false) {
              offlineRef.current = true;
              failedRef.current.add(questionId);
              publish();
              return;
            }
            const item = queueRef.current.get(questionId);
            if (!item) return;
            const outcome = await postAnswer(item);
            if (token !== activeToken) return;
            if (outcome.kind === "stale" || isStaleSave(item.seq, queueRef.current.get(questionId)?.seq)) {
              attempt = 0;
              continue;
            }
            if (outcome.kind === "applied") {
              if (queueRef.current.get(questionId)?.seq === item.seq) {
                queueRef.current.delete(questionId);
                journalRef.current.set(questionId, {
                  questionId,
                  answer: item.answer,
                  note: item.note,
                  seq: item.seq,
                  ackedAt: Date.now(),
                });
                failedRef.current.delete(questionId);
                permanentRef.current.delete(questionId);
                seqRef.current = Math.max(seqRef.current, item.seq + 1);
                publish();
              }
              return;
            }
            if (outcome.kind === "unapplied") {
              if (queueRef.current.get(questionId)?.seq !== item.seq) {
                attempt = 0;
                continue;
              }
              const decision = resolveUnapplied(item, {
                clientSeq: outcome.clientSeq,
                answer: outcome.answer,
                note: outcome.note,
              });
              if (decision.action === "adopt") {
                applyLocal(questionId, decision.answer, decision.note);
                journalRef.current.set(questionId, {
                  questionId,
                  answer: decision.answer,
                  note: decision.note,
                  seq: decision.seq,
                  ackedAt: Date.now(),
                });
                queueRef.current.delete(questionId);
                failedRef.current.delete(questionId);
                permanentRef.current.delete(questionId);
                seqRef.current = Math.max(seqRef.current, decision.seq + 1);
                publish();
                return;
              }
              queueRef.current.set(questionId, { ...item, seq: decision.seq });
              seqRef.current = Math.max(seqRef.current, decision.seq + 1);
              publish();
              attempt += 1;
              if (attempt > 1) await sleep(retryDelayMs(attempt));
              continue;
            }
            if (outcome.kind === "permanent") {
              permanentRef.current.add(questionId);
              failedRef.current.add(questionId);
              publish();
              return;
            }
            attempt += 1;
            failedRef.current.add(questionId);
            publish();
            await sleep(retryDelayMs(attempt));
          }
        } finally {
          if (pumpingRef.current.get(questionId) === job) pumpingRef.current.delete(questionId);
        }
      })();
      pumpingRef.current.set(questionId, job);
      return job;
    },
    [applyLocal, postAnswer, publish],
  );

  const flush = useCallback(async () => {
    const deadline = Date.now() + 20000;
    while (queueRef.current.size > 0 && tokenRef.current === activeToken) {
      if (typeof navigator !== "undefined" && navigator.onLine === false) {
        offlineRef.current = true;
        for (const id of queueRef.current.keys()) failedRef.current.add(id);
        publish();
        return false;
      }
      if ([...queueRef.current.keys()].every((id) => permanentRef.current.has(id))) {
        publish();
        return false;
      }
      if (Date.now() > deadline) return false;
      const ids = [...queueRef.current.keys()];
      await Promise.race([Promise.all(ids.map((id) => pump(id))), sleep(Math.max(250, deadline - Date.now()))]);
    }
    return queueRef.current.size === 0;
  }, [publish, pump]);

  const enqueue = useCallback(
    (questionId: string, answer: AnswerCode, note: string) => {
      const seq = Math.max(seqRef.current, Date.now());
      seqRef.current = seq + 1;
      const item: PendingAnswer = { questionId, answer, note: note.slice(0, 1000), seq };
      applyLocal(questionId, answer, item.note);
      permanentRef.current.delete(questionId);
      failedRef.current.delete(questionId);
      errorRef.current = "";
      queueRef.current.set(questionId, item);
      publish();
      void pump(questionId);
    },
    [applyLocal, publish, pump],
  );

  const setNote = useCallback((questionId: string, note: string) => {
    const next = { ...notesRef.current, [questionId]: note };
    notesRef.current = next;
    setNotes(next);
  }, []);

  useLayoutEffect(() => {
    const token = ++activeToken;
    tokenRef.current = token;
    const server = toServer(initialRef.current);
    serverRef.current = server;
    const now = Date.now();
    const booted = bootAuditState({
      server,
      pending: readPending(sessionId),
      journal: readJournal(sessionId),
      recalled: memory.get(sessionId) ?? null,
      now,
    });
    answersRef.current = booted.answers;
    notesRef.current = booted.notes;
    setAnswers(booted.answers);
    setNotes(booted.notes);
    queueRef.current = new Map(booted.pending.map((item) => [item.questionId, item]));
    journalRef.current = new Map(booted.journal.map((item) => [item.questionId, item]));
    failedRef.current = new Set();
    permanentRef.current = new Set();
    pumpingRef.current = new Map();
    seqRef.current = booted.nextSeq;
    offlineRef.current = typeof navigator !== "undefined" ? navigator.onLine === false : false;
    errorRef.current = "";
    lastSigRef.current = "";

    const absorb = () => {
      if (token !== activeToken) return;
      const storedPending = readPending(sessionId);
      const storedJournal = readJournal(sessionId);
      const absorbed = absorbQueues(
        storedPending,
        [...queueRef.current.values()],
        storedJournal,
        [...journalRef.current.values()],
        serverRef.current,
        Date.now(),
      );
      const mergedJournal = absorbed.journal;
      const mergedPending = absorbed.pending;
      const samePending =
        mergedPending.length === queueRef.current.size &&
        mergedPending.every((item) => {
          const current = queueRef.current.get(item.questionId);
          return current?.seq === item.seq && current.answer === item.answer && current.note === item.note;
        });
      const sameJournal =
        mergedJournal.length === journalRef.current.size &&
        mergedJournal.every((item) => {
          const current = journalRef.current.get(item.questionId);
          return current?.seq === item.seq && current.answer === item.answer && current.note === item.note;
        });
      if (samePending && sameJournal) return;

      const pendingById = new Map(mergedPending.map((item) => [item.questionId, item]));
      for (const entry of mergedJournal) {
        const pendingItem = pendingById.get(entry.questionId);
        if (pendingItem && pendingItem.seq >= entry.seq) continue;
        const known = Math.max(
          journalRef.current.get(entry.questionId)?.seq ?? 0,
          queueRef.current.get(entry.questionId)?.seq ?? 0,
        );
        if (entry.seq >= known) applyLocal(entry.questionId, entry.answer, entry.note);
      }
      for (const item of mergedPending) {
        const current = queueRef.current.get(item.questionId);
        if (!current || item.seq >= current.seq) applyLocal(item.questionId, item.answer, item.note);
        if (!current || item.seq !== current.seq) {
          failedRef.current.delete(item.questionId);
          permanentRef.current.delete(item.questionId);
        }
      }
      for (const [questionId, current] of queueRef.current) {
        if (pendingById.has(questionId)) continue;
        failedRef.current.delete(questionId);
        permanentRef.current.delete(questionId);
        const acked = mergedJournal.find((entry) => entry.questionId === questionId);
        if (acked && acked.seq >= current.seq) applyLocal(questionId, acked.answer, acked.note);
      }
      queueRef.current = pendingById;
      journalRef.current = new Map(mergedJournal.map((item) => [item.questionId, item]));
      for (const item of mergedPending) seqRef.current = Math.max(seqRef.current, item.seq + 1);
      for (const item of mergedJournal) seqRef.current = Math.max(seqRef.current, item.seq + 1);
      publish();
      for (const item of mergedPending) void pump(item.questionId);
    };

    const onPageHide = () => {
      if (token !== activeToken) return;
      for (const item of queueRef.current.values()) {
        try {
          void fetch("/api/akun/jawaban", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            cache: "no-store",
            keepalive: true,
            body: JSON.stringify({
              sessionId,
              questionId: item.questionId,
              answer: item.answer,
              note: item.note,
              clientSeq: item.seq,
            }),
          });
        } catch {
          /* the journal still replays this answer on the next open */
        }
      }
    };

    const onOnline = () => {
      if (token !== activeToken) return;
      offlineRef.current = false;
      for (const id of queueRef.current.keys()) {
        if (!permanentRef.current.has(id)) failedRef.current.delete(id);
        void pump(id);
      }
      publish();
    };
    const onOffline = () => {
      if (token !== activeToken) return;
      offlineRef.current = true;
      for (const id of queueRef.current.keys()) failedRef.current.add(id);
      publish();
    };
    const onStorage = (event: StorageEvent) => {
      if (event.key !== pendingStorageKey(sessionId) && event.key !== journalStorageKey(sessionId)) return;
      absorb();
    };

    const channel = typeof BroadcastChannel === "undefined" ? null : new BroadcastChannel(`naikfase:audit:${sessionId}`);
    channelRef.current = channel;
    channel?.addEventListener("message", absorb);
    window.addEventListener("storage", onStorage);
    window.addEventListener("pagehide", onPageHide);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    publish();
    for (const id of queueRef.current.keys()) void pump(id);

    let cancel = false;
    void (async () => {
      if (queueRef.current.size > 0) await flush();
      if (cancel || token !== activeToken) return;
      setPlacement(resumePosition(sectionsRef.current, questionsRef.current, answersRef.current, lockedRef.current));
    })();

    return () => {
      cancel = true;
      channel?.removeEventListener("message", absorb);
      channel?.close();
      if (channelRef.current === channel) channelRef.current = null;
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("pagehide", onPageHide);
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
    // Boot once per session. Later server payloads must not move the cursor.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  useLayoutEffect(() => {
    if (sync.pending === 0) return;
    const onLeave = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", onLeave);
    return () => window.removeEventListener("beforeunload", onLeave);
  }, [sync.pending]);

  return {
    answers,
    notes,
    setNote,
    sync,
    placement,
    enqueue,
    flush,
    getAnswers: () => answersRef.current,
  };
}
