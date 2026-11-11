import assert from "node:assert/strict";
import test from "node:test";
import { internalNextPath } from "./next-path";

test("next hanya path internal", () => {
  assert.equal(internalNextPath("/akun/layanan#fondasi-audit-1-2"), "/akun/layanan#fondasi-audit-1-2");
  assert.equal(internalNextPath("https://evil.example/akun"), null);
  assert.equal(internalNextPath("//evil.example"), null);
  assert.equal(internalNextPath("/\\evil"), null);
  assert.equal(internalNextPath(null), null);
});
