-- Model konten laporan PDF (spec PM, disesuaikan skema live).
-- Tambahan saja: ADD COLUMN / CREATE TABLE / CREATE INDEX.
-- Kunci natural live tetap audit_code + question_number, bukan id hardcode.
-- Tidak ada DROP, TRUNCATE, atau DELETE.

ALTER TABLE recommendation_library
  ADD COLUMN IF NOT EXISTS why_it_helps text,
  ADD COLUMN IF NOT EXISTS format_note varchar(150),
  ADD COLUMN IF NOT EXISTS cta_label varchar(100),
  ADD COLUMN IF NOT EXISTS content_status varchar(20) NOT NULL DEFAULT 'DRAFT',
  ADD COLUMN IF NOT EXISTS seed_version integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS edited_in_panel boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS reviewed_by varchar(100),
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP;

UPDATE recommendation_library
SET code = 'legacy-' || id::text
WHERE code IS NULL;

UPDATE recommendation_library
SET content_status = 'APPROVED'
WHERE review_status = 'published' AND content_status = 'DRAFT' AND edited_in_panel = false AND seed_version = 0;

CREATE UNIQUE INDEX IF NOT EXISTS uq_reclibrary_code ON recommendation_library (code);
CREATE INDEX IF NOT EXISTS idx_reclibrary_pdf
  ON recommendation_library (type, sort_order)
  WHERE is_active = true AND content_status = 'APPROVED';

ALTER TABLE upsell_items
  ADD COLUMN IF NOT EXISTS pdf_blurb text,
  ADD COLUMN IF NOT EXISTS content_status varchar(20) NOT NULL DEFAULT 'DRAFT',
  ADD COLUMN IF NOT EXISTS seed_version integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS edited_in_panel boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS reviewed_by varchar(100),
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP;

UPDATE upsell_items SET code = 'legacy-' || id::text WHERE code IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_upsell_code ON upsell_items (code);

ALTER TABLE recommendation_triggers
  ADD COLUMN IF NOT EXISTS reason_text text,
  ADD COLUMN IF NOT EXISTS seed_version integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS edited_in_panel boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE UNIQUE INDEX IF NOT EXISTS idx_rectrigger_unique
  ON recommendation_triggers (question_id, recommendation_id, trigger_on_answer);
CREATE INDEX IF NOT EXISTS idx_rectrigger_q_active
  ON recommendation_triggers (question_id, trigger_on_answer, priority)
  WHERE is_active = true;

ALTER TABLE report_status_narratives
  ADD COLUMN IF NOT EXISTS score_band varchar(10) NOT NULL DEFAULT 'ANY',
  ADD COLUMN IF NOT EXISTS meaning text,
  ADD COLUMN IF NOT EXISTS coach_message text,
  ADD COLUMN IF NOT EXISTS focus_principle text,
  ADD COLUMN IF NOT EXISTS closing_message text,
  ADD COLUMN IF NOT EXISTS content_status varchar(20) NOT NULL DEFAULT 'DRAFT',
  ADD COLUMN IF NOT EXISTS seed_version integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS edited_in_panel boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS reviewed_by varchar(100),
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz,
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

ALTER TABLE section_education
  ADD COLUMN IF NOT EXISTS content_status varchar(20) NOT NULL DEFAULT 'DRAFT',
  ADD COLUMN IF NOT EXISTS seed_version integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS edited_in_panel boolean NOT NULL DEFAULT false;

ALTER TABLE question_coaching
  ADD COLUMN IF NOT EXISTS content_status varchar(20) NOT NULL DEFAULT 'DRAFT',
  ADD COLUMN IF NOT EXISTS seed_version integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS edited_in_panel boolean NOT NULL DEFAULT false;

ALTER TABLE phase_report_closings
  ADD COLUMN IF NOT EXISTS content_status varchar(20) NOT NULL DEFAULT 'DRAFT',
  ADD COLUMN IF NOT EXISTS seed_version integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS edited_in_panel boolean NOT NULL DEFAULT false;

ALTER TABLE notification_templates
  ADD COLUMN IF NOT EXISTS content_status varchar(20) NOT NULL DEFAULT 'DRAFT',
  ADD COLUMN IF NOT EXISTS seed_version integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS edited_in_panel boolean NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS recommendation_rules (
  id bigserial PRIMARY KEY,
  code varchar(80) NOT NULL,
  rule_type varchar(30) NOT NULL,
  audit_code varchar(20) REFERENCES audit_transitions (code) ON DELETE RESTRICT,
  section_id bigint REFERENCES test_sections (id) ON DELETE RESTRICT,
  band varchar(10),
  min_gap smallint,
  status varchar(30),
  recommendation_id bigint REFERENCES recommendation_library (id) ON DELETE RESTRICT,
  upsell_item_id bigint REFERENCES upsell_items (id) ON DELETE RESTRICT,
  placement varchar(20) NOT NULL DEFAULT 'RESOURCES',
  reason_text text,
  priority smallint NOT NULL DEFAULT 5,
  is_active boolean NOT NULL DEFAULT true,
  content_status varchar(20) NOT NULL DEFAULT 'DRAFT',
  seed_version integer NOT NULL DEFAULT 0,
  edited_in_panel boolean NOT NULL DEFAULT false,
  reviewed_by varchar(100),
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT ck_recrules_target CHECK (recommendation_id IS NOT NULL OR upsell_item_id IS NOT NULL),
  CONSTRAINT ck_recrules_band CHECK (band IS NULL OR band IN ('LOW', 'MID', 'HIGH')),
  CONSTRAINT ck_recrules_place CHECK (placement IN ('RESOURCES', 'CTA'))
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_recrules_code ON recommendation_rules (code);
CREATE INDEX IF NOT EXISTS idx_recrules_section
  ON recommendation_rules (section_id, rule_type, band) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_recrules_status
  ON recommendation_rules (audit_code, rule_type, status) WHERE is_active = true;

CREATE TABLE IF NOT EXISTS section_band_narratives (
  id bigserial PRIMARY KEY,
  section_id bigint NOT NULL REFERENCES test_sections (id) ON DELETE RESTRICT,
  band varchar(10) NOT NULL,
  headline varchar(200) NOT NULL,
  meaning text NOT NULL,
  advice jsonb NOT NULL DEFAULT '[]'::jsonb,
  concept_title varchar(150),
  concept_body text,
  quick_win text,
  coach_note text,
  content_status varchar(20) NOT NULL DEFAULT 'DRAFT',
  seed_version integer NOT NULL DEFAULT 0,
  edited_in_panel boolean NOT NULL DEFAULT false,
  reviewed_by varchar(100),
  reviewed_at timestamptz,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT ck_sbn_band CHECK (band IN ('LOW', 'MID', 'HIGH')),
  CONSTRAINT ck_sbn_advice CHECK (jsonb_typeof(advice) = 'array')
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_sbn_section_band ON section_band_narratives (section_id, band);

CREATE TABLE IF NOT EXISTS question_insights (
  id bigserial PRIMARY KEY,
  question_id bigint NOT NULL REFERENCES test_questions (id) ON DELETE RESTRICT,
  insight_level varchar(10) NOT NULL DEFAULT 'KEY',
  short_title varchar(150),
  why_it_matters text,
  risk_if_no text,
  fix_steps jsonb NOT NULL DEFAULT '[]'::jsonb,
  done_indicator text,
  concept_title varchar(150),
  concept_body text,
  tip_text text,
  legal_basis text,
  valid_as_of date,
  priority smallint NOT NULL DEFAULT 5,
  content_status varchar(20) NOT NULL DEFAULT 'DRAFT',
  seed_version integer NOT NULL DEFAULT 0,
  edited_in_panel boolean NOT NULL DEFAULT false,
  reviewed_by varchar(100),
  reviewed_at timestamptz,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT ck_qi_level CHECK (insight_level IN ('KEY', 'TIP')),
  CONSTRAINT ck_qi_steps CHECK (jsonb_typeof(fix_steps) = 'array')
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_qi_question ON question_insights (question_id);

CREATE TABLE IF NOT EXISTS action_plan_items (
  id bigserial PRIMARY KEY,
  code varchar(80) NOT NULL,
  source_type varchar(20) NOT NULL,
  audit_code varchar(20) REFERENCES audit_transitions (code) ON DELETE RESTRICT,
  question_id bigint REFERENCES test_questions (id) ON DELETE RESTRICT,
  section_id bigint REFERENCES test_sections (id) ON DELETE RESTRICT,
  band varchar(10),
  status varchar(30),
  horizon varchar(5) NOT NULL,
  action_text text NOT NULL,
  done_indicator text,
  sort_order smallint NOT NULL DEFAULT 0,
  content_status varchar(20) NOT NULL DEFAULT 'DRAFT',
  seed_version integer NOT NULL DEFAULT 0,
  edited_in_panel boolean NOT NULL DEFAULT false,
  reviewed_by varchar(100),
  reviewed_at timestamptz,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT ck_api_horizon CHECK (horizon IN ('D30', 'D60', 'D90')),
  CONSTRAINT ck_api_source CHECK (
    (source_type = 'QUESTION' AND question_id IS NOT NULL)
    OR (source_type = 'SECTION_BAND' AND section_id IS NOT NULL AND band IN ('LOW', 'MID'))
    OR (source_type = 'STATUS' AND audit_code IS NOT NULL AND status IS NOT NULL)
  )
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_api_code ON action_plan_items (code);
CREATE INDEX IF NOT EXISTS idx_api_question ON action_plan_items (question_id, horizon)
  WHERE is_active = true AND question_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_api_section ON action_plan_items (section_id, band, horizon)
  WHERE is_active = true AND section_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_api_status ON action_plan_items (audit_code, status)
  WHERE is_active = true AND source_type = 'STATUS';

CREATE TABLE IF NOT EXISTS report_text_blocks (
  id bigserial PRIMARY KEY,
  block_key varchar(80) NOT NULL,
  scope varchar(30) NOT NULL DEFAULT 'ALL',
  title varchar(200),
  body text NOT NULL,
  content_status varchar(20) NOT NULL DEFAULT 'DRAFT',
  seed_version integer NOT NULL DEFAULT 0,
  edited_in_panel boolean NOT NULL DEFAULT false,
  reviewed_by varchar(100),
  reviewed_at timestamptz,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_rtb_key_scope ON report_text_blocks (block_key, scope);

CREATE TABLE IF NOT EXISTS result_reports (
  id bigserial PRIMARY KEY,
  result_id bigint NOT NULL REFERENCES test_results (id) ON DELETE RESTRICT,
  report_version smallint NOT NULL DEFAULT 1,
  template_version varchar(20) NOT NULL,
  content_snapshot jsonb,
  content_warnings jsonb NOT NULL DEFAULT '[]'::jsonb,
  status varchar(20) NOT NULL DEFAULT 'PENDING',
  blob_path varchar(500),
  file_size_bytes integer,
  page_count smallint,
  render_ms integer,
  attempts smallint NOT NULL DEFAULT 0,
  last_error text,
  next_retry_at timestamptz,
  generated_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT ck_rr_status CHECK (status IN ('PENDING', 'GENERATING', 'READY', 'FAILED'))
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_rr_result_version ON result_reports (result_id, report_version);
CREATE INDEX IF NOT EXISTS idx_rr_retry
  ON result_reports (status, next_retry_at) WHERE status IN ('PENDING', 'FAILED');

CREATE TABLE IF NOT EXISTS result_report_recommendations (
  id bigserial PRIMARY KEY,
  result_id bigint NOT NULL REFERENCES test_results (id) ON DELETE RESTRICT,
  recommendation_id bigint REFERENCES recommendation_library (id) ON DELETE RESTRICT,
  upsell_item_id bigint REFERENCES upsell_items (id) ON DELETE RESTRICT,
  source_type varchar(20) NOT NULL,
  trigger_question_id bigint REFERENCES test_questions (id) ON DELETE RESTRICT,
  rule_id bigint REFERENCES recommendation_rules (id) ON DELETE RESTRICT,
  section_id bigint REFERENCES test_sections (id) ON DELETE RESTRICT,
  placement varchar(20) NOT NULL DEFAULT 'RESOURCES',
  priority smallint NOT NULL DEFAULT 5,
  is_key_trigger boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT ck_rrr_target CHECK (recommendation_id IS NOT NULL OR upsell_item_id IS NOT NULL)
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_rrr_result_rec
  ON result_report_recommendations (result_id, recommendation_id) WHERE recommendation_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_rrr_result_upsell
  ON result_report_recommendations (result_id, upsell_item_id) WHERE upsell_item_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_rrr_result_priority
  ON result_report_recommendations (result_id, placement, priority);

ALTER TABLE notification_logs
  ADD COLUMN IF NOT EXISTS result_id bigint,
  ADD COLUMN IF NOT EXISTS idempotency_key varchar(120),
  ADD COLUMN IF NOT EXISTS has_attachment boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS provider_message_id varchar(120);

DO $$
BEGIN
  ALTER TABLE notification_logs
    ADD CONSTRAINT fk_notif_logs_result FOREIGN KEY (result_id) REFERENCES test_results (id) ON DELETE RESTRICT;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS uq_notif_logs_idem
  ON notification_logs (idempotency_key) WHERE idempotency_key IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_notif_logs_result
  ON notification_logs (result_id, created_at DESC) WHERE result_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_test_sections_audit_sort ON test_sections (audit_transition_id, sort_order);
