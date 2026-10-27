-- 0004_test_answer_save.sql
-- Participant answer saves: ignore a late replay, and speed up session/section reads.
-- Additive and idempotent. No DROP, TRUNCATE, or DELETE.
-- Apply: npx tsx scripts/db.ts drizzle/0004_test_answer_save.sql

BEGIN;

-- Monotonic client sequence. A slower request with an older seq must not
-- overwrite the answer that already landed.
ALTER TABLE test_answers
  ADD COLUMN IF NOT EXISTS client_seq bigint NOT NULL DEFAULT 0;

-- Section finalization counts saved rows by joining test_questions (section_id)
-- to test_answers (question_id + session_id). The unique (session_id, question_id)
-- index cannot serve a question_id lookup, so that join scanned answers.
CREATE INDEX IF NOT EXISTS idx_test_answers_question_session
  ON test_answers (question_id, session_id);

-- Index-only read of one session's answers for resume and progress.
CREATE INDEX IF NOT EXISTS idx_test_answers_session_covering
  ON test_answers (session_id) INCLUDE (question_id, answer);

COMMIT;
