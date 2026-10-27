import assert from "node:assert/strict";
import test from "node:test";
import { sendFonnte, skippedWhatsApp, WA_NOT_CONFIGURED, whatsAppLog } from "./fonnte";

test("token Fonnte kosong dicatat dilewati, bukan gagal", async () => {
  const previous = process.env.FONNTE_TOKEN;
  delete process.env.FONNTE_TOKEN;
  const result = await sendFonnte({ target: "081234567890", message: "halo" });
  assert.equal(result.skipped, true);
  assert.equal(result.ok, false);
  assert.equal(whatsAppLog(result).status, "SKIPPED");
  assert.equal(whatsAppLog(result).error, WA_NOT_CONFIGURED);
  assert.equal(whatsAppLog(skippedWhatsApp()).error, "WA belum dikonfigurasi");
  process.env.FONNTE_TOKEN = "   ";
  const blank = await sendFonnte({ target: "081234567890", message: "halo" });
  assert.equal(whatsAppLog(blank).status, "SKIPPED");
  if (previous === undefined) delete process.env.FONNTE_TOKEN;
  else process.env.FONNTE_TOKEN = previous;
});

test("kegagalan Fonnte yang sudah dikonfigurasi tetap gagal", () => {
  const logged = whatsAppLog({ ok: false, skipped: false, error: "nomor tidak valid", response: null });
  assert.equal(logged.status, "FAILED");
  assert.equal(logged.error, "nomor tidak valid");
});
