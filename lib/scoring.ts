export type AnswerCode = "YA" | "TIDAK" | "TIDAK_BERLAKU";

export type AuditCode = "audit_1_2" | "audit_2_3" | "audit_3_4" | "audit_4_5";

export type ResultStatus =
  | "DALAM_BAHAYA"
  | "BELUM_SIAP"
  | "SIAP_NAIK"
  | "HAMPIR"
  | "PERLU_FONDASI"
  | "TIDAK_DAPAT_DINILAI";

export type ScoringQuestion = {
  id: string;
  questionNumber: number;
  sectionCode: string;
  isKey: boolean;
  isActive?: boolean;
};

export type ScoringAnswer = {
  questionId: string;
  answer: AnswerCode;
};

export type SectionScore = {
  sectionCode: string;
  keyPass: boolean;
  scorePct: number | null;
  color: "hijau" | "kuning" | "merah" | null;
};

export type GroupIndicator = {
  id: string;
  label: string;
  ready: boolean;
  scorePct: number | null;
  color: "hijau" | "kuning" | "merah" | null;
};

export type ScoringResult = {
  status: ResultStatus;
  score: number | null;
  kunciTidak: number;
  biasaYa: number;
  penyebut: number;
  sections: SectionScore[];
  triad: GroupIndicator[] | null;
  agBlock: { ready: boolean; warning: boolean; a: GroupIndicator; g: GroupIndicator } | null;
};

export const AUDIT_3_4_TRIAD = [
  { id: "system", label: "System Ready", sections: ["A", "G"], keyNumbers: [1, 48] },
  { id: "cash", label: "Cash Ready", sections: ["C", "D"], keyNumbers: [12, 20, 21, 25, 26] },
  { id: "people", label: "People Ready", sections: ["E", "H"], keyNumbers: [33, 34, 52, 55] },
] as const;

export const AUDIT_4_5_AG = {
  a: { id: "a", label: "Lean Again", section: "A", keyNumbers: [1, 2] },
  g: { id: "g", label: "Identitas", section: "G", keyNumbers: [35] },
} as const;

function round2(value: number) {
  return Math.round(value * 100) / 100;
}

function meets(ya: number, denom: number, threshold: number) {
  return ya * 100 >= threshold * denom;
}

function colorFor(score: number | null): SectionScore["color"] {
  if (score === null) return null;
  if (score >= 80) return "hijau";
  if (score >= 60) return "kuning";
  return "merah";
}

function ratio(ya: number, denom: number) {
  if (denom <= 0) return null;
  return round2((ya / denom) * 100);
}

type Assessed = ScoringQuestion & { answer: AnswerCode };

function assess(questions: ScoringQuestion[], answers: ScoringAnswer[]): Assessed[] {
  const byId = new Map(answers.map((answer) => [answer.questionId, answer.answer]));
  return questions
    .filter((question) => question.isActive !== false)
    .map((question) => {
      const answer = byId.get(question.id);
      if (!answer) return null;
      return { ...question, answer };
    })
    .filter((question): question is Assessed => question !== null);
}

function countGroup(items: Assessed[], key: boolean) {
  const scoped = items.filter((item) => item.isKey === key && item.answer !== "TIDAK_BERLAKU");
  const ya = scoped.filter((item) => item.answer === "YA").length;
  return { ya, denom: scoped.length, tidak: scoped.filter((item) => item.answer === "TIDAK").length };
}

function statusFor(kunciTidak: number, ya: number, denom: number, passingScore: number): ResultStatus {
  if (denom === 0) return "TIDAK_DAPAT_DINILAI";
  if (kunciTidak >= 3 && !meets(ya, denom, 50)) return "DALAM_BAHAYA";
  if (kunciTidak >= 1) return "BELUM_SIAP";
  if (meets(ya, denom, passingScore)) return "SIAP_NAIK";
  if (meets(ya, denom, 60)) return "HAMPIR";
  return "PERLU_FONDASI";
}

function indicator(id: string, label: string, items: Assessed[], keyNumbers: readonly number[]): GroupIndicator {
  const keys = items.filter((item) => item.isKey && keyNumbers.includes(item.questionNumber));
  const scored = countGroup(keys, true);
  const support = countGroup(
    items.filter((item) => !item.isKey),
    false,
  );
  const scorePct = ratio(support.ya, support.denom);
  return { id, label, ready: scored.tidak === 0, scorePct, color: colorFor(scorePct) };
}

export function calculateResult(input: {
  auditCode: AuditCode;
  questions: ScoringQuestion[];
  answers: ScoringAnswer[];
  passingScore?: number;
}): ScoringResult {
  const passingScore = input.passingScore ?? 80;
  const items = assess(input.questions, input.answers);
  const keys = countGroup(items, true);
  const biasa = countGroup(items, false);
  const sectionCodes = [...new Set(items.map((item) => item.sectionCode))];
  const sections = sectionCodes.map((sectionCode) => {
    const inSection = items.filter((item) => item.sectionCode === sectionCode);
    const key = countGroup(inSection, true);
    const plain = countGroup(inSection, false);
    const scorePct = ratio(plain.ya, plain.denom);
    return {
      sectionCode,
      keyPass: key.tidak === 0,
      scorePct,
      color: colorFor(scorePct),
    };
  });

  const triad =
    input.auditCode === "audit_3_4"
      ? AUDIT_3_4_TRIAD.map((group) =>
          indicator(
            group.id,
            group.label,
            items.filter((item) => (group.sections as readonly string[]).includes(item.sectionCode)),
            group.keyNumbers,
          ),
        )
      : null;

  const agBlock =
    input.auditCode === "audit_4_5"
      ? (() => {
          const aItems = items.filter((item) => item.sectionCode === AUDIT_4_5_AG.a.section);
          const gItems = items.filter((item) => item.sectionCode === AUDIT_4_5_AG.g.section);
          const a = indicator(AUDIT_4_5_AG.a.id, AUDIT_4_5_AG.a.label, aItems, AUDIT_4_5_AG.a.keyNumbers);
          const g = indicator(AUDIT_4_5_AG.g.id, AUDIT_4_5_AG.g.label, gItems, AUDIT_4_5_AG.g.keyNumbers);
          return { ready: a.ready && g.ready, warning: a.ready !== g.ready, a, g };
        })()
      : null;

  return {
    status: statusFor(keys.tidak, biasa.ya, biasa.denom, passingScore),
    score: ratio(biasa.ya, biasa.denom),
    kunciTidak: keys.tidak,
    biasaYa: biasa.ya,
    penyebut: biasa.denom,
    sections,
    triad,
    agBlock,
  };
}
