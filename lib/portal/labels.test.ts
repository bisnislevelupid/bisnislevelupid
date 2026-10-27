import assert from "node:assert/strict";
import test from "node:test";
import { codesFromUnlocked, formatWib } from "./labels";

test("codesFromUnlocked accepts phase keys and instrument codes", () => {
  assert.deepEqual(codesFromUnlocked("1,2,3,4"), ["audit_1_2", "audit_2_3", "audit_3_4", "audit_4_5"]);
  assert.deepEqual(codesFromUnlocked("audit_2_3"), ["audit_2_3"]);
  assert.deepEqual(codesFromUnlocked("2,audit_2_3"), ["audit_2_3"]);
  assert.deepEqual(codesFromUnlocked(null), []);
  assert.deepEqual(codesFromUnlocked("bukan"), []);
});

test("formatWib labels Western Indonesia Time", () => {
  const label = formatWib("2026-10-27T05:00:00.000Z");
  assert.match(label, /27 Oktober 2026/);
  assert.match(label, /12\.00/);
  assert.match(label, /WIB$/);
  assert.equal(formatWib(null), "");
  const fromPg = formatWib("2026-10-27 05:45:00.830753+00");
  assert.match(fromPg, /12\.45/);
  assert.match(fromPg, /WIB$/);
  assert.doesNotMatch(fromPg, /05\.45/);
  const naiveUtc = formatWib("2026-10-27 05:45:00");
  assert.match(naiveUtc, /12\.45/);
  assert.match(naiveUtc, /WIB$/);
  assert.doesNotMatch(naiveUtc, /05\.45/);
  const shortOffset = formatWib("2026-10-27T05:45:00.830753+00");
  assert.match(shortOffset, /12\.45/);
  assert.match(shortOffset, /WIB$/);
});
