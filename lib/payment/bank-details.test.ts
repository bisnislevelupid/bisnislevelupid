import assert from "node:assert/strict";
import test from "node:test";
import { fillPlaceholders } from "@/lib/email/html";
import { paymentPlaceholderValues } from "./bank-details";

test("instruksi transfer mengisi rekening dan atas nama dari data metode", () => {
  const values = paymentPlaceholderValues({
    accountNumber: "8800112233",
    accountHolder: "CV Contoh Dagang",
    nominal: "Rp 197.123",
    methodName: "BCA (Transfer Manual)",
  });
  const html = fillPlaceholders(
    "<ol><li>Nomor rekening {rekening}.</li><li>Atas nama {atas_nama}.</li><li>Nominal {nominal}.</li></ol>",
    values,
  );
  assert.match(html, /8800112233/);
  assert.match(html, /CV Contoh Dagang/);
  assert.match(html, /Rp 197\.123/);
  assert.doesNotMatch(html, /1234567890|9876543210|BisnisLevelUp/);
});

test("rekening kosong tidak diganti nama perusahaan", () => {
  const values = paymentPlaceholderValues({
    accountNumber: "  ",
    accountHolder: null,
    nominal: "Rp 1",
  });
  assert.equal(values.rekening, "—");
  assert.equal(values.atas_nama, "—");
});
