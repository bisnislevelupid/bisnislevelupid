ALTER TABLE test_sessions ADD COLUMN IF NOT EXISTS locked_section_ids text NOT NULL DEFAULT '';
