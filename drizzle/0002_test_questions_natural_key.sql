-- 0002_test_questions_natural_key.sql
-- Unique natural key required by drizzle/seed_question_bank.sql
-- (INSERT ... ON CONFLICT (audit_transition_id, question_number)).
-- Aborts if duplicate (audit_transition_id, question_number) rows already exist.
-- Apply: npm run db:migrate:0002
--        or: npx tsx scripts/db.ts drizzle/0002_test_questions_natural_key.sql
BEGIN;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM test_questions GROUP BY audit_transition_id, question_number HAVING count(*) > 1) THEN
    RAISE EXCEPTION 'Duplicate (audit_transition_id, question_number) rows exist in test_questions; resolve before adding unique index.';
  END IF;
END $$;
CREATE UNIQUE INDEX IF NOT EXISTS idx_test_questions_audit_number
  ON test_questions (audit_transition_id, question_number);
-- ERD-documented read-path indexes missing from 0000_init.sql (harmless if already present):
CREATE INDEX IF NOT EXISTS idx_test_questions_audit_sort ON test_questions (audit_transition_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_test_questions_section   ON test_questions (section_id);
COMMIT;
