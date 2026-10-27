import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  clampCursor,
  isStaleSave,
  combineAnswers,
  mergeSaved,
  nextAfterAnswer,
  parsePending,
  resumePosition,
  retryDelayMs,
} from "./runner-progress";

const sections = [
  { id: "A" },
  { id: "F" },
  { id: "H" },
];

function questions() {
  const rows: Array<{ id: string; sectionId: string; number: number }> = [];
  for (let number = 1; number <= 12; number += 1) rows.push({ id: `q${number}`, sectionId: "A", number });
  for (let number = 64; number <= 75; number += 1) rows.push({ id: `q${number}`, sectionId: "F", number });
  for (let number = 81; number <= 92; number += 1) rows.push({ id: `q${number}`, sectionId: "H", number });
  return rows;
}

function answeredThrough(last: number) {
  const answers: Record<string, string> = {};
  for (const question of questions()) {
    if (question.number <= last) answers[question.id] = "YA";
  }
  return answers;
}

test("resume lands on the first unanswered question, not the first item of the last section", () => {
  const position = resumePosition(sections, questions(), answeredThrough(85), ["A", "F"]);
  assert.deepEqual(position, { sectionIndex: 2, cursor: 5, summary: false });
  assert.equal(questions()[questions().findIndex((item) => item.sectionId === "H") + position.cursor]?.number, 86);
});

test("resume after question 69 stays on the next Manajemen item, not question 64", () => {
  const position = resumePosition(sections, questions(), answeredThrough(69), ["A"]);
  assert.equal(position.sectionIndex, 1);
  assert.equal(position.summary, false);
  const inSection = questions().filter((item) => item.sectionId === "F");
  assert.equal(inSection[position.cursor]?.number, 70);
});

test("a fully answered unlocked section opens the summary", () => {
  const position = resumePosition(sections, questions(), answeredThrough(92), ["A", "F"]);
  assert.deepEqual(position, { sectionIndex: 2, cursor: 11, summary: true });
});

test("when earlier sections are still unlocked, summary stays on the first unfinished section", () => {
  const position = resumePosition(sections, questions(), answeredThrough(92), []);
  assert.equal(position.sectionIndex, 0);
  assert.equal(position.summary, true);
});

test("reload keeps a pending answer that the server payload does not have yet", () => {
  const saved = Object.entries(answeredThrough(68)).map(([questionId, answer]) => ({
    questionId,
    answer: answer as "YA",
    note: null,
  }));
  const merged = combineAnswers(saved, null, [{ questionId: "q69", answer: "YA", note: "", seq: 8 }]);
  const position = resumePosition(sections, questions(), merged.answers, ["A"]);
  const inSection = questions().filter((item) => item.sectionId === "F");
  assert.equal(inSection[position.cursor]?.number, 70);
  const edited = combineAnswers(saved, null, [{ questionId: "q68", answer: "TIDAK", note: "", seq: 9 }]);
  assert.equal(edited.answers.q68, "TIDAK");
});

test("pending local answers fill gaps before resume is chosen", () => {
  const saved = Object.entries(answeredThrough(68)).map(([questionId, answer]) => ({
    questionId,
    answer: answer as "YA",
    note: null,
  }));
  const merged = mergeSaved(saved, [
    { questionId: "q69", answer: "TIDAK", note: "", seq: 50 },
    { questionId: "q70", answer: "YA", note: "catatan", seq: 51 },
  ]);
  const position = resumePosition(sections, questions(), merged.answers, ["A"]);
  const inSection = questions().filter((item) => item.sectionId === "F");
  assert.equal(inSection[position.cursor]?.number, 71);
  assert.equal(merged.notes.q70, "catatan");
});

test("answering the current item advances locally and never rewinds to the section start", () => {
  const inSection = questions().filter((item) => item.sectionId === "F");
  const indexOf69 = inSection.findIndex((item) => item.number === 69);
  assert.deepEqual(nextAfterAnswer(inSection.length, indexOf69), { cursor: indexOf69 + 1, summary: false });
  assert.equal(clampCursor(indexOf69, inSection.length), indexOf69);
  assert.deepEqual(nextAfterAnswer(inSection.length, inSection.length - 1), {
    cursor: inSection.length - 1,
    summary: true,
  });
});

test("late responses are ignored once a newer seq is queued", () => {
  assert.equal(isStaleSave(10, 11), true);
  assert.equal(isStaleSave(10, undefined), true);
  assert.equal(isStaleSave(10, 10), false);
});

test("retry backoff grows and then caps", () => {
  assert.deepEqual([1, 2, 3, 4, 5, 6].map(retryDelayMs), [400, 800, 1600, 3200, 6400, 8000]);
});

test("pending storage keeps the newest seq per question and drops garbage", () => {
  const parsed = parsePending(
    JSON.stringify([
      { questionId: "q69", answer: "YA", note: "lama", seq: 4 },
      { questionId: "q69", answer: "TIDAK", note: "baru", seq: 9 },
      { questionId: "", answer: "YA", seq: 3 },
      { questionId: "q70", answer: "MAYBE", seq: 3 },
      "nope",
    ]),
  );
  assert.deepEqual(parsed, [{ questionId: "q69", answer: "TIDAK", note: "baru", seq: 9 }]);
  assert.deepEqual(parsePending("not-json"), []);
  assert.deepEqual(
    parsePending(JSON.stringify({ v: 1, items: [{ questionId: "q70", answer: "YA", note: "", seq: 2 }] })),
    [{ questionId: "q70", answer: "YA", note: "", seq: 2 }],
  );
  assert.deepEqual(parsePending(JSON.stringify({ v: 2, items: [] })), []);
});

test("answer-save migration is additive", () => {
  const sql = readFileSync(new URL("../../drizzle/0004_test_answer_save.sql", import.meta.url), "utf8");
  const stripped = sql.replace(/--.*$/gm, "");
  assert.doesNotMatch(stripped, /\b(DROP|TRUNCATE|DELETE)\b/i);
  assert.match(sql, /ADD COLUMN IF NOT EXISTS client_seq/);
  assert.match(sql, /CREATE INDEX IF NOT EXISTS idx_test_answers_question_session/);
  assert.match(sql, /CREATE INDEX IF NOT EXISTS idx_test_answers_session_covering/);
});
