import assert from "node:assert/strict";
import test from "node:test";
import { customerGuidance } from "./guidance";

test("panduan editor tidak lolos ke peserta", () => {
  assert.equal(customerGuidance("Lihat slide Anda sebelum presentasi."), null);
  assert.equal(customerGuidance("Ini catatan PT Anda."), null);
  assert.equal(customerGuidance("Disiplin survival nomor satu.", "editor"), null);
  assert.equal(customerGuidance("Disiplin survival nomor satu.", "missing"), null);
  assert.equal(customerGuidance("-"), null);
  assert.equal(customerGuidance("Disiplin survival nomor satu."), "Disiplin survival nomor satu.");
});
