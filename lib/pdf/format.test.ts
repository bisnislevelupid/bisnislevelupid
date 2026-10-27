import assert from "node:assert/strict";
import test from "node:test";
import {
  KEY_NA_NOTE,
  SIAP_NAIK_RISK_NOTE,
  crisisGateLabel,
  formatAuditScore,
  isRiskSection,
  riskAreaNote,
  sapaanOrAnda,
  scoreBasisLine,
  sectionScoreView,
} from "./format";

test("sapaan kosong menjadi Anda", () => {
  assert.equal(sapaanOrAnda(null), "Anda");
  assert.equal(sapaanOrAnda("  "), "Anda");
  assert.equal(sapaanOrAnda("Pak Irvan"), "Pak Irvan");
});

test("dasar skor hanya butir non-kunci, Tidak Berlaku di luar penyebut", () => {
  assert.equal(KEY_NA_NOTE, "Butir ini dilewati karena kondisinya tidak berlaku untuk bisnis Anda.");
  assert.equal(
    scoreBasisLine({ ya: 77, tidak: 15, keyYa: 13, keyTidak: 0 }),
    "64 dari 79 butir non-kunci · 13/13 kunci terpenuhi",
  );
  assert.equal(
    scoreBasisLine({ ya: 76, tidak: 15, keyYa: 12, keyTidak: 0 }),
    "64 dari 79 butir non-kunci · 12/12 kunci terpenuhi",
  );
  assert.equal(
    scoreBasisLine({ ya: 10, tidak: 20, keyYa: 10, keyTidak: 3 }),
    "0 dari 17 butir non-kunci · 10/13 kunci terpenuhi",
  );
});

test("skor nol yang benar tetap persen, seksi tanpa butir dinilai bukan nol", () => {
  assert.equal(formatAuditScore(0, "PERLU_FONDASI"), "0%");
  assert.equal(formatAuditScore(0, "TIDAK_DAPAT_DINILAI"), "Tidak dapat dinilai");
  assert.equal(formatAuditScore(null, "SIAP_NAIK"), "—");
  const empty = sectionScoreView({ score: 0, ya: 2, tidak: 0, keyYa: 2, keyTidak: 0 });
  assert.equal(empty.score, null);
  assert.equal(empty.text, "—");
  const zero = sectionScoreView({ score: 0, ya: 1, tidak: 4, keyYa: 1, keyTidak: 0 });
  assert.equal(zero.score, 0);
  assert.equal(zero.text, "0%");
});

test("label gerbang krisis mengikuti status, bukan judul krisis telanjang", () => {
  assert.equal(
    crisisGateLabel({ status: "SIAP_NAIK", phaseNumber: 1, crisisTitle: "Krisis Kepemimpinan" }),
    "Gerbang Fase 1: Krisis Kepemimpinan — sudah terlewati",
  );
  assert.equal(
    crisisGateLabel({ status: "BELUM_SIAP", phaseNumber: 2, crisisTitle: "Krisis Otonomi" }),
    "Gerbang Fase 2: Krisis Otonomi — belum terlewati",
  );
  assert.equal(crisisGateLabel({ status: "SIAP_NAIK", phaseNumber: 1, crisisTitle: null }), null);
});

test("seksi di bawah 50 persen adalah area risiko di semua status", () => {
  assert.equal(isRiskSection(49.9), true);
  assert.equal(isRiskSection(50), false);
  assert.equal(isRiskSection(0), true);
  assert.equal(isRiskSection(null), false);
  assert.equal(riskAreaNote("SIAP_NAIK"), SIAP_NAIK_RISK_NOTE);
  assert.match(riskAreaNote("HAMPIR"), /area risiko/i);
  assert.doesNotMatch(riskAreaNote("BELUM_SIAP"), /sudah siap naik/);
});
