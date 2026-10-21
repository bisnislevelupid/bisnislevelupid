import assert from "node:assert/strict";
import test from "node:test";
import { calculateResult, type AnswerCode, type AuditCode, type ScoringQuestion } from "./scoring";

function item(number: number, key: boolean, section = "A"): ScoringQuestion {
  return { id: `${section}-${number}`, questionNumber: number, sectionCode: section, isKey: key };
}

function answerAll(questions: ScoringQuestion[], answer: AnswerCode, overrides: Record<string, AnswerCode> = {}) {
  return questions.map((question) => ({
    questionId: question.id,
    answer: overrides[question.id] ?? answer,
  }));
}

function run(auditCode: AuditCode, questions: ScoringQuestion[], overrides: Record<string, AnswerCode> = {}) {
  return calculateResult({
    auditCode,
    questions,
    answers: answerAll(questions, "YA", overrides),
  });
}

test("contoh 1 semua ya audit 1_2 siap 100", () => {
  const keys = Array.from({ length: 13 }, (_, i) => item(i + 1, true));
  const plain = Array.from({ length: 79 }, (_, i) => item(100 + i, false));
  const result = run("audit_1_2", [...keys, ...plain]);
  assert.equal(result.status, "SIAP_NAIK");
  assert.equal(result.score, 100);
});

test("contoh 2 batas 64/79 siap", () => {
  const keys = Array.from({ length: 13 }, (_, i) => item(i + 1, true));
  const plain = Array.from({ length: 79 }, (_, i) => item(100 + i, false));
  const overrides: Record<string, AnswerCode> = {};
  plain.slice(64).forEach((question) => {
    overrides[question.id] = "TIDAK";
  });
  const result = run("audit_1_2", [...keys, ...plain], overrides);
  assert.equal(result.score, 81.01);
  assert.equal(result.status, "SIAP_NAIK");
});

test("contoh 3 62/79 hampir", () => {
  const keys = Array.from({ length: 13 }, (_, i) => item(i + 1, true));
  const plain = Array.from({ length: 79 }, (_, i) => item(100 + i, false));
  const overrides: Record<string, AnswerCode> = {};
  plain.slice(62).forEach((question) => {
    overrides[question.id] = "TIDAK";
  });
  const result = run("audit_1_2", [...keys, ...plain], overrides);
  assert.equal(result.score, 78.48);
  assert.equal(result.status, "HAMPIR");
});

test("contoh 4 63/79 tidak dibulatkan ke 80", () => {
  const keys = Array.from({ length: 13 }, (_, i) => item(i + 1, true));
  const plain = Array.from({ length: 79 }, (_, i) => item(100 + i, false));
  const overrides: Record<string, AnswerCode> = {};
  plain.slice(63).forEach((question) => {
    overrides[question.id] = "TIDAK";
  });
  const result = run("audit_1_2", [...keys, ...plain], overrides);
  assert.equal(result.score, 79.75);
  assert.equal(result.status, "HAMPIR");
});

test("contoh 5 N/A non-kunci keluar dari penyebut", () => {
  const keys = Array.from({ length: 13 }, (_, i) => item(i + 1, true));
  const plain = Array.from({ length: 78 }, (_, i) => item(100 + i, false));
  const na = item(52, false, "B");
  const overrides: Record<string, AnswerCode> = { [na.id]: "TIDAK_BERLAKU" };
  plain.slice(63).forEach((question) => {
    overrides[question.id] = "TIDAK";
  });
  const result = run("audit_1_2", [...keys, ...plain, na], overrides);
  assert.equal(result.penyebut, 78);
  assert.equal(result.score, 80.77);
  assert.equal(result.status, "SIAP_NAIK");
});

test("contoh 6 kunci N/A tidak menggagalkan", () => {
  const keys = [...Array.from({ length: 12 }, (_, i) => item(i + 1, true)), item(47, true)];
  const plain = Array.from({ length: 79 }, (_, i) => item(100 + i, false));
  const result = run("audit_1_2", [...keys, ...plain], { [item(47, true).id]: "TIDAK_BERLAKU" });
  assert.equal(result.kunciTidak, 0);
  assert.equal(result.status, "SIAP_NAIK");
  assert.equal(result.score, 100);
});

test("contoh 7 satu kunci tidak tetap belum siap", () => {
  const keys = [...Array.from({ length: 12 }, (_, i) => item(i + 1, true)), item(30, true)];
  const plain = Array.from({ length: 79 }, (_, i) => item(100 + i, false));
  const result = run("audit_1_2", [...keys, ...plain], { [item(30, true).id]: "TIDAK" });
  assert.equal(result.score, 100);
  assert.equal(result.status, "BELUM_SIAP");
});

test("contoh 8 dua kunci tidak dan satu N/A bukan bahaya", () => {
  const keys = [...Array.from({ length: 12 }, (_, i) => item(i + 1, true)), item(47, true)];
  const plain = Array.from({ length: 79 }, (_, i) => item(100 + i, false));
  const overrides: Record<string, AnswerCode> = {
    [item(1, true).id]: "TIDAK",
    [item(2, true).id]: "TIDAK",
    [item(47, true).id]: "TIDAK_BERLAKU",
  };
  plain.slice(30).forEach((question) => {
    overrides[question.id] = "TIDAK";
  });
  const result = run("audit_1_2", [...keys, ...plain], overrides);
  assert.equal(result.kunciTidak, 2);
  assert.equal(result.score, 37.97);
  assert.equal(result.status, "BELUM_SIAP");
});

test("contoh 9 tiga kunci tidak dan skor di bawah 50 bahaya", () => {
  const keys = Array.from({ length: 18 }, (_, i) => item(i + 1, true));
  const plain = Array.from({ length: 143 }, (_, i) => item(100 + i, false));
  const overrides: Record<string, AnswerCode> = {};
  keys.slice(0, 3).forEach((question) => {
    overrides[question.id] = "TIDAK";
  });
  plain.slice(60).forEach((question) => {
    overrides[question.id] = "TIDAK";
  });
  const result = run("audit_2_3", [...keys, ...plain], overrides);
  assert.equal(result.score, 41.96);
  assert.equal(result.status, "DALAM_BAHAYA");
});

test("contoh 10 batas bahaya 71/143", () => {
  const keys = Array.from({ length: 18 }, (_, i) => item(i + 1, true));
  const plain = Array.from({ length: 143 }, (_, i) => item(100 + i, false));
  const overrides: Record<string, AnswerCode> = {};
  keys.slice(0, 3).forEach((question) => {
    overrides[question.id] = "TIDAK";
  });
  plain.slice(71).forEach((question) => {
    overrides[question.id] = "TIDAK";
  });
  const result = run("audit_2_3", [...keys, ...plain], overrides);
  assert.equal(result.score, 49.65);
  assert.equal(result.status, "DALAM_BAHAYA");
});

test("contoh 11 72/143 dengan 3 kunci tidak masih belum siap", () => {
  const keys = Array.from({ length: 18 }, (_, i) => item(i + 1, true));
  const plain = Array.from({ length: 143 }, (_, i) => item(100 + i, false));
  const overrides: Record<string, AnswerCode> = {};
  keys.slice(0, 3).forEach((question) => {
    overrides[question.id] = "TIDAK";
  });
  plain.slice(72).forEach((question) => {
    overrides[question.id] = "TIDAK";
  });
  const result = run("audit_2_3", [...keys, ...plain], overrides);
  assert.equal(result.score, 50.35);
  assert.equal(result.status, "BELUM_SIAP");
});

test("contoh 12 dua kunci tidak bukan bahaya", () => {
  const keys = Array.from({ length: 18 }, (_, i) => item(i + 1, true));
  const plain = Array.from({ length: 143 }, (_, i) => item(100 + i, false));
  const overrides: Record<string, AnswerCode> = {};
  keys.slice(0, 2).forEach((question) => {
    overrides[question.id] = "TIDAK";
  });
  plain.slice(30).forEach((question) => {
    overrides[question.id] = "TIDAK";
  });
  const result = run("audit_2_3", [...keys, ...plain], overrides);
  assert.equal(result.score, 20.98);
  assert.equal(result.status, "BELUM_SIAP");
});

test("contoh 13 skor di bawah 60 perlu fondasi", () => {
  const keys = Array.from({ length: 16 }, (_, i) => item(i + 1, true));
  const plain = Array.from({ length: 47 }, (_, i) => item(100 + i, false));
  const overrides: Record<string, AnswerCode> = {};
  plain.slice(26).forEach((question) => {
    overrides[question.id] = "TIDAK";
  });
  const result = run("audit_3_4", [...keys, ...plain], overrides);
  assert.equal(result.score, 55.32);
  assert.equal(result.status, "PERLU_FONDASI");
});

test("contoh 14 triad system ready gagal", () => {
  const triadKeys = [
    item(1, true, "A"),
    item(48, true, "G"),
    item(12, true, "C"),
    item(20, true, "D"),
    item(21, true, "D"),
    item(25, true, "D"),
    item(26, true, "D"),
    item(33, true, "E"),
    item(34, true, "E"),
    item(52, true, "H"),
    item(55, true, "H"),
  ];
  const extra = Array.from({ length: 5 }, (_, i) => item(70 + i, true, "B"));
  const plain = Array.from({ length: 47 }, (_, i) => item(100 + i, false, "B"));
  const result = run("audit_3_4", [...triadKeys, ...extra, ...plain], { [item(48, true, "G").id]: "TIDAK" });
  assert.equal(result.status, "BELUM_SIAP");
  assert.equal(result.triad?.find((group) => group.id === "system")?.ready, false);
  assert.equal(result.triad?.find((group) => group.id === "cash")?.ready, true);
  assert.equal(result.triad?.find((group) => group.id === "people")?.ready, true);
});

test("contoh 15 audit 4_5 perlu fondasi", () => {
  const keys = Array.from({ length: 9 }, (_, i) => item(i + 1, true));
  const plain = Array.from({ length: 37 }, (_, i) => item(100 + i, false));
  const overrides: Record<string, AnswerCode> = {};
  plain.slice(15).forEach((question) => {
    overrides[question.id] = "TIDAK";
  });
  const result = run("audit_4_5", [...keys, ...plain], overrides);
  assert.equal(result.score, 40.54);
  assert.equal(result.status, "PERLU_FONDASI");
});

test("contoh 16 29/37 hampir", () => {
  const keys = Array.from({ length: 9 }, (_, i) => item(i + 1, true));
  const plain = Array.from({ length: 37 }, (_, i) => item(100 + i, false));
  const overrides: Record<string, AnswerCode> = {};
  plain.slice(29).forEach((question) => {
    overrides[question.id] = "TIDAK";
  });
  const result = run("audit_4_5", [...keys, ...plain], overrides);
  assert.equal(result.score, 78.38);
  assert.equal(result.status, "HAMPIR");
});

test("contoh 17 30/37 siap dan blok A+G lulus", () => {
  const keys = [item(1, true, "A"), item(2, true, "A"), item(35, true, "G"), ...Array.from({ length: 6 }, (_, i) => item(10 + i, true, "B"))];
  const plain = Array.from({ length: 37 }, (_, i) => item(100 + i, false, "B"));
  const overrides: Record<string, AnswerCode> = {};
  plain.slice(30).forEach((question) => {
    overrides[question.id] = "TIDAK";
  });
  const result = run("audit_4_5", [...keys, ...plain], overrides);
  assert.equal(result.score, 81.08);
  assert.equal(result.status, "SIAP_NAIK");
  assert.equal(result.agBlock?.ready, true);
  assert.equal(result.agBlock?.warning, false);
});

test("contoh 18 peringatan A dan G harus bersamaan", () => {
  const keys = [item(1, true, "A"), item(2, true, "A"), item(35, true, "G"), ...Array.from({ length: 6 }, (_, i) => item(10 + i, true, "B"))];
  const plain = Array.from({ length: 37 }, (_, i) => item(100 + i, false));
  const result = run("audit_4_5", [...keys, ...plain], { [item(35, true, "G").id]: "TIDAK" });
  assert.equal(result.score, 100);
  assert.equal(result.status, "BELUM_SIAP");
  assert.equal(result.agBlock?.a.ready, true);
  assert.equal(result.agBlock?.g.ready, false);
  assert.equal(result.agBlock?.warning, true);
});

test("penyebut nol tidak dibagi", () => {
  const questions = [item(1, false)];
  const result = run("audit_1_2", questions, { [questions[0].id]: "TIDAK_BERLAKU" });
  assert.equal(result.score, null);
  assert.equal(result.status, "TIDAK_DAPAT_DINILAI");
});
