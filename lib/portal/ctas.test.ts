import assert from "node:assert/strict";
import test from "node:test";
import { buildReportCtas, whatsAppHref } from "./ctas";

test("status yang tidak representatif tidak menjual produk", () => {
  const plan = buildReportCtas({
    status: "TIDAK_DAPAT_DINILAI",
    auditCode: "audit_1_2",
    origin: "https://bisnislevelup.id",
    whatsapp: "628123456789",
  });
  assert.equal(plan.suppressProducts, true);
  assert.equal(plan.items.length, 1);
  assert.equal(plan.items[0]?.label, "Bicara dengan Tim Kami");
  assert.match(plan.items[0]?.href ?? "", /^https:\/\/wa\.me\/628123456789/);
  assert.equal(whatsAppHref(""), null);
});

test("perlu fondasi mengarah ke kurikulum tanpa harga baru", () => {
  const plan = buildReportCtas({
    status: "PERLU_FONDASI",
    auditCode: "audit_1_2",
    origin: "https://bisnislevelup.id",
    whatsapp: null,
  });
  assert.equal(plan.suppressProducts, true);
  assert.equal(plan.items[0]?.label, "Kelas & ebook fondasi");
  assert.match(plan.items[0]?.href ?? "", /\/akun\/layanan#fondasi-audit-1-2$/);
  assert.equal(plan.items[1]?.label, "Coaching 1:1");
  assert.match(plan.items[1]?.href ?? "", /product=audit-coaching/);
});
