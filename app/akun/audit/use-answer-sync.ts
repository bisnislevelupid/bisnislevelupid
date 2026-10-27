"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { AnswerCode } from "@/lib/scoring";
import type { SavedAnswer } from "@/lib/db/portal";
import {
  combineAnswers,
  isStaleSave,
  readPending,
  resumePosition,
  retryDelayMs,
  writePending,
  type PendingAnswer,
  type ResumeCursor,
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

const memory = new Map<string, Snapshot>();
let activeToken = 0;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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
  const pumpingRef = useRef(new Map<string, Promise<void>>());
  const failedRef = useRef(new Set<string>());
  const permanentRef = useRef(new Set<string>());
  const seqRef = useRef(Date.now());
  const offlineRef = useRef(false);
  const errorRef = useRef("");
  const tokenRef = useRef(0);

  const publish = useCallback(() => {
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
    writePending(sessionId, [...queueRef.current.values()]);
    setSync({
      pending: queueRef.current.size,
      failed,
      offline: offlineRef.current,
      byQuestion,
      error: errorRef.current,
    });
  }, [sessionId]);

  const postAnswer = useCallback(
    async (item: PendingAnswer): Promise<"ok" | "permanent" | "retry"> => {
      let response: Response;
      try {
        response = await fetch("/api/akun/jawaban", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          cache: "no-store",
          body: JSON.stringify({
            sessionId,
            questionId: item.questionId,
            answer: item.answer,
            note: item.note,
            clientSeq: item.seq,
          }),
        });
      } catch {
        return "retry";
      }
      if (isStaleSave(item.seq, queueRef.current.get(item.questionId)?.seq)) return "ok";
      if (response.ok) return "ok";
      if (response.status === 400 || response.status === 401 || response.status === 403) {
        try {
          const payload = (await response.json()) as { error?: string };
          if (payload.error) errorRef.current = payload.error;
        } catch {
          errorRef.current = "Jawaban ditolak";
        }
        return "permanent";
      }
      return "retry";
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
            if (isStaleSave(item.seq, queueRef.current.get(questionId)?.seq)) {
              attempt = 0;
              continue;
            }
            if (outcome === "ok") {
              queueRef.current.delete(questionId);
              failedRef.current.delete(questionId);
              permanentRef.current.delete(questionId);
              publish();
              return;
            }
            if (outcome === "permanent") {
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
    [postAnswer, publish],
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
      const seq = Math.max(seqRef.current + 1, Date.now());
      seqRef.current = seq;
      const item: PendingAnswer = { questionId, answer, note: note.slice(0, 1000), seq };
      const nextAnswers = { ...answersRef.current, [questionId]: answer };
      const nextNotes = { ...notesRef.current };
      if (item.note) nextNotes[questionId] = item.note;
      else delete nextNotes[questionId];
      answersRef.current = nextAnswers;
      notesRef.current = nextNotes;
      setAnswers(nextAnswers);
      setNotes(nextNotes);
      permanentRef.current.delete(questionId);
      failedRef.current.delete(questionId);
      errorRef.current = "";
      queueRef.current.set(questionId, item);
      publish();
      void pump(questionId);
    },
    [publish, pump],
  );

  const setNote = useCallback((questionId: string, note: string) => {
    const next = { ...notesRef.current, [questionId]: note };
    notesRef.current = next;
    setNotes(next);
  }, []);

  useEffect(() => {
    const token = ++activeToken;
    tokenRef.current = token;
    const pending = readPending(sessionId);
    const merged = combineAnswers(initialRef.current, memory.get(sessionId) ?? null, pending);
    answersRef.current = merged.answers;
    notesRef.current = merged.notes;
    setAnswers(merged.answers);
    setNotes(merged.notes);
    queueRef.current = new Map(pending.map((item) => [item.questionId, item]));
    failedRef.current = new Set();
    permanentRef.current = new Set();
    pumpingRef.current = new Map();
    const maxSeq = pending.reduce((max, item) => Math.max(max, item.seq), 0);
    seqRef.current = Math.max(Date.now(), maxSeq);
    offlineRef.current = typeof navigator !== "undefined" ? navigator.onLine === false : false;
    errorRef.current = "";
    publish();

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
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);

    let cancel = false;
    void (async () => {
      if (queueRef.current.size > 0) await flush();
      if (cancel || token !== activeToken) return;
      setPlacement(
        resumePosition(sectionsRef.current, questionsRef.current, answersRef.current, lockedRef.current),
      );
    })();

    return () => {
      cancel = true;
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
    // Boot once per session. Later server payloads must not move the cursor.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  useEffect(() => {
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
