-- Konten narasi laporan diagnosis (PDF multi-halaman).
-- Hanya tambahan: CREATE TABLE / ADD COLUMN / CREATE INDEX.
-- Jalankan: npm run db:migrate:0004

CREATE TABLE IF NOT EXISTS report_status_narratives (
  id bigserial PRIMARY KEY,
  audit_code varchar(20) NOT NULL REFERENCES audit_transitions (code) ON DELETE RESTRICT,
  status varchar(30) NOT NULL,
  headline varchar(255) NOT NULL,
  summary text NOT NULL,
  implication text NOT NULL,
  focus text NOT NULL,
  review_status varchar(20) NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (audit_code, status)
);

CREATE TABLE IF NOT EXISTS section_education (
  id bigserial PRIMARY KEY,
  audit_code varchar(20) NOT NULL REFERENCES audit_transitions (code) ON DELETE RESTRICT,
  section_code varchar(5) NOT NULL,
  measures text NOT NULL,
  why_it_matters text NOT NULL,
  concepts text NOT NULL,
  framework text NOT NULL,
  common_mistakes text NOT NULL,
  strength_reading text NOT NULL,
  gap_reading text NOT NULL,
  review_status varchar(20) NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (audit_code, section_code)
);

CREATE TABLE IF NOT EXISTS question_coaching (
  id bigserial PRIMARY KEY,
  audit_code varchar(20) NOT NULL REFERENCES audit_transitions (code) ON DELETE RESTRICT,
  question_number smallint NOT NULL,
  why_it_matters text NOT NULL,
  risk_if_no text NOT NULL,
  action_steps text NOT NULL,
  education_note text NOT NULL,
  horizon varchar(10) NOT NULL DEFAULT '60',
  review_status varchar(20) NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (audit_code, question_number)
);

CREATE TABLE IF NOT EXISTS phase_report_closings (
  id bigserial PRIMARY KEY,
  audit_code varchar(20) NOT NULL UNIQUE REFERENCES audit_transitions (code) ON DELETE RESTRICT,
  closing_text text NOT NULL,
  next_phase_title varchar(200) NOT NULL,
  next_phase_preview text NOT NULL,
  prepare_text text NOT NULL,
  review_status varchar(20) NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE recommendation_library ADD COLUMN IF NOT EXISTS code varchar(80);
ALTER TABLE upsell_items ADD COLUMN IF NOT EXISTS code varchar(80);

CREATE UNIQUE INDEX IF NOT EXISTS idx_recommendation_library_code ON recommendation_library (code);
CREATE UNIQUE INDEX IF NOT EXISTS idx_upsell_items_code ON upsell_items (code);

CREATE INDEX IF NOT EXISTS idx_question_coaching_lookup ON question_coaching (audit_code, question_number);
CREATE INDEX IF NOT EXISTS idx_section_education_lookup ON section_education (audit_code, section_code);
CREATE INDEX IF NOT EXISTS idx_report_status_lookup ON report_status_narratives (audit_code, status);
CREATE INDEX IF NOT EXISTS idx_test_answers_session_answer ON test_answers (session_id, answer);
CREATE INDEX IF NOT EXISTS idx_result_section_scores_result ON result_section_scores (result_id);
CREATE INDEX IF NOT EXISTS idx_result_recommendations_result ON result_recommendations (result_id, priority);
CREATE INDEX IF NOT EXISTS idx_recommendation_triggers_active_question ON recommendation_triggers (question_id) WHERE is_active;
CREATE INDEX IF NOT EXISTS idx_upsell_items_active_sort ON upsell_items (is_active, sort_order);
CREATE INDEX IF NOT EXISTS idx_recommendation_library_active_code ON recommendation_library (code) WHERE is_active;

ALTER TABLE report_status_narratives ADD COLUMN IF NOT EXISTS review_status varchar(20) NOT NULL DEFAULT 'draft';
ALTER TABLE section_education ADD COLUMN IF NOT EXISTS review_status varchar(20) NOT NULL DEFAULT 'draft';
ALTER TABLE question_coaching ADD COLUMN IF NOT EXISTS review_status varchar(20) NOT NULL DEFAULT 'draft';
ALTER TABLE phase_report_closings ADD COLUMN IF NOT EXISTS review_status varchar(20) NOT NULL DEFAULT 'draft';
ALTER TABLE recommendation_library ADD COLUMN IF NOT EXISTS review_status varchar(20) NOT NULL DEFAULT 'published';

ALTER TABLE test_questions ADD COLUMN IF NOT EXISTS guidance_audience varchar(20);
ALTER TABLE test_results ALTER COLUMN overall_score DROP NOT NULL;
ALTER TABLE result_section_scores ALTER COLUMN score_pct DROP NOT NULL;
ALTER TABLE test_results ADD COLUMN IF NOT EXISTS indicator_json jsonb;

CREATE TABLE IF NOT EXISTS report_status_recommendations (
  audit_code varchar(20) NOT NULL REFERENCES audit_transitions (code) ON DELETE RESTRICT,
  status varchar(30) NOT NULL,
  recommendation_id bigint NOT NULL REFERENCES recommendation_library (id) ON DELETE RESTRICT,
  sort_order smallint NOT NULL DEFAULT 0,
  PRIMARY KEY (audit_code, status, recommendation_id)
);

CREATE INDEX IF NOT EXISTS idx_status_recommendations_lookup ON report_status_recommendations (audit_code, status, sort_order);
CREATE INDEX IF NOT EXISTS idx_test_questions_guidance_audience ON test_questions (guidance_audience);
