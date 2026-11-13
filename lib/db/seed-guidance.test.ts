import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const sql = readFileSync(new URL("../../drizzle/seed_report_content.sql", import.meta.url), "utf8");

test("seed guidance_audience hanya mengisi NULL dan tidak menimpa edit admin", () => {
  const explicit = sql.indexOf("UPDATE test_questions tq SET guidance_audience = 'editor'");
  const classified = sql.indexOf("SET guidance_audience = CASE");
  assert.ok(explicit > 0, "daftar editor eksplisit hilang");
  assert.ok(classified > explicit, "klasifikasi CASE harus setelah daftar editor, selagi NULL");
  const explicitSql = sql.slice(explicit, classified);
  const caseSql = sql.slice(classified, sql.indexOf("INSERT INTO site_settings"));
  assert.match(explicitSql, /tq\.guidance_audience IS NULL/);
  assert.match(caseSql, /tq\.guidance_audience IS NULL/);
  assert.doesNotMatch(explicitSql, /edited_in_panel = false AND content_status/);
});

test("seed tetap tidak menimpa APPROVED dan tidak menghidupkan is_active", () => {
  assert.match(sql, /WHERE upsell_items\.edited_in_panel = false AND upsell_items\.content_status IS DISTINCT FROM 'APPROVED'/);
  assert.match(sql, /WHERE notification_templates\.edited_in_panel = false/);
  assert.doesNotMatch(sql, /ON CONFLICT[\s\S]{0,400}is_active = true/);
  assert.doesNotMatch(sql, /\bDROP\b|\bTRUNCATE\b|\bDELETE FROM\b/i);
});
