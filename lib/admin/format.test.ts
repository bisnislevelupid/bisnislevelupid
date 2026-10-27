import assert from "node:assert/strict";
import test from "node:test";
import { formatWib } from "@/lib/portal/labels";
import { formatCell, formatRupiah, statusText } from "./format";
import { columnLabel, pickVisibleColumns, tableLabel } from "./labels";
import { isReadonlyResource } from "./resources";
import { describePanelStatus } from "./status";

test("rupiah memakai pemisah ribuan Indonesia dan awalan Rp", () => {
  assert.equal(formatRupiah(1250000), "Rp 1.250.000");
  assert.equal(formatRupiah("1997000"), "Rp 1.997.000");
  assert.equal(formatRupiah(0), "Rp 0");
});

test("tanggal panel memakai formatWib", () => {
  const label = formatWib("2026-10-27T05:30:00.000Z");
  assert.match(label, /27 Oktober 2026/);
  assert.match(label, /12\.30/);
  assert.match(label, /WIB$/);
  assert.equal(
    formatCell({ name: "created_at", type: "timestamp with time zone" }, "2026-10-27T05:30:00.000Z"),
    label,
  );
  assert.equal(formatCell({ name: "created_at", type: "timestamp with time zone" }, null), "—");
});

test("label kolom panel berbahasa Indonesia", () => {
  assert.equal(columnLabel("is_key"), "Butir kunci ★");
  assert.equal(columnLabel("email_verified_at"), "Email terverifikasi");
  assert.equal(tableLabel("test_questions"), "Bank soal");
  assert.equal(statusText("CANCELLED"), "Dibatalkan");
  assert.equal(formatCell({ name: "is_key", type: "boolean" }, false), "Tidak");
  assert.equal(formatCell({ name: "is_key", type: "boolean" }, true), "Ya ★");
  assert.equal(formatCell({ name: "price", type: "bigint" }, "597000"), "Rp 597.000");
  assert.equal(formatCell({ name: "email_verified_at", type: "timestamp with time zone" }, null), "Belum");
});

test("bank soal menampilkan audit dan seksi", () => {
  const columns = pickVisibleColumns(
    "test_questions",
    ["id", "audit_transition_id", "section_id", "question_number", "question_text", "is_key", "guidance_text"],
    "id",
  );
  assert.ok(columns.includes("audit_transition_id"));
  assert.ok(columns.includes("section_id"));
  assert.ok(columns.includes("is_key"));
});

test("tabel sistem tidak bisa diubah dari panel", () => {
  for (const table of ["order_items", "test_results", "test_answers", "customer_sessions", "payment_logs", "notification_logs", "test_sessions", "coupon_usage", "affiliate_referrals", "result_section_scores", "result_recommendations"]) {
    assert.equal(isReadonlyResource(table), true, table);
  }
  assert.equal(isReadonlyResource("test_questions"), false);
  assert.equal(isReadonlyResource("orders"), false);
});

test("status header tidak mengaku Xendit tersambung bila kunci kosong", () => {
  const described = describePanelStatus({
    manualActive: 2,
    xenditActive: 15,
    midtransActive: 1,
    xenditConfigured: false,
    midtransConfigured: false,
    midtransProduction: false,
  });
  assert.match(described.short, /Transfer bank manual aktif/);
  assert.match(described.short, /Xendit belum dikonfigurasi/);
  assert.match(described.short, /Midtrans belum dikonfigurasi/);
  assert.doesNotMatch(described.short, /Xendit Connected/);
  const live = describePanelStatus({
    manualActive: 0,
    xenditActive: 0,
    midtransActive: 1,
    xenditConfigured: false,
    midtransConfigured: true,
    midtransProduction: false,
  });
  assert.match(live.short, /Transfer bank manual nonaktif/);
  assert.match(live.short, /Midtrans sandbox/);
});
