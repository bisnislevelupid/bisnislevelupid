CREATE TABLE IF NOT EXISTS admins (
  id bigserial PRIMARY KEY,
  name varchar(100) NOT NULL,
  email varchar(150) NOT NULL UNIQUE,
  password_hash varchar(255) NOT NULL,
  role varchar(50) NOT NULL DEFAULT 'STAFF',
  status varchar(20) NOT NULL DEFAULT 'ACTIVE',
  last_login_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS affiliates (
  id bigserial PRIMARY KEY,
  customer_id bigint,
  name varchar(150) NOT NULL,
  email varchar(150) NOT NULL UNIQUE,
  phone varchar(30),
  code varchar(30) NOT NULL UNIQUE,
  commission_type varchar(20) NOT NULL DEFAULT 'PERCENTAGE',
  commission_value numeric(10,2) NOT NULL DEFAULT 10.00,
  total_referrals bigint NOT NULL DEFAULT 0,
  total_revenue bigint NOT NULL DEFAULT 0,
  total_commission bigint NOT NULL DEFAULT 0,
  status varchar(20) NOT NULL DEFAULT 'ACTIVE',
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS customers (
  id bigserial PRIMARY KEY,
  name varchar(150) NOT NULL,
  email varchar(150) NOT NULL UNIQUE,
  phone varchar(30),
  password_hash varchar(255),
  email_verified_at timestamptz,
  phone_verified_at timestamptz,
  business_name varchar(200),
  business_field varchar(100),
  business_city varchar(100),
  referral_code varchar(50) UNIQUE,
  affiliate_id bigint REFERENCES affiliates(id) ON DELETE SET NULL,
  status varchar(20) NOT NULL DEFAULT 'ACTIVE',
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at timestamptz
);

ALTER TABLE affiliates
  DROP CONSTRAINT IF EXISTS fk_affiliate_customer;
ALTER TABLE affiliates
  ADD CONSTRAINT fk_affiliate_customer FOREIGN KEY (customer_id)
  REFERENCES customers(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS customer_sessions (
  id bigserial PRIMARY KEY,
  customer_id bigint NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  token_hash varchar(64) NOT NULL UNIQUE,
  ip_address varchar(45),
  user_agent text,
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS phases (
  id bigserial PRIMARY KEY,
  phase_number smallint NOT NULL UNIQUE,
  code varchar(30) NOT NULL UNIQUE,
  name_short varchar(80) NOT NULL,
  name_label varchar(80) NOT NULL,
  crisis_title varchar(150),
  crisis_desc text,
  description text,
  icon_key varchar(50),
  color_hex varchar(7),
  sort_order smallint NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS audit_transitions (
  id bigserial PRIMARY KEY,
  code varchar(20) NOT NULL UNIQUE,
  from_phase_id bigint NOT NULL REFERENCES phases(id) ON DELETE RESTRICT,
  to_phase_id bigint NOT NULL REFERENCES phases(id) ON DELETE RESTRICT,
  name varchar(150) NOT NULL,
  gate_desc text,
  total_questions smallint NOT NULL DEFAULT 0,
  total_key_questions smallint NOT NULL DEFAULT 0,
  passing_score numeric(5,2) NOT NULL DEFAULT 80.00,
  is_active boolean NOT NULL DEFAULT true,
  sort_order smallint NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS test_sections (
  id bigserial PRIMARY KEY,
  audit_transition_id bigint NOT NULL REFERENCES audit_transitions(id) ON DELETE CASCADE,
  code varchar(5) NOT NULL,
  name varchar(100) NOT NULL,
  sub_name varchar(100),
  description text,
  sort_order smallint NOT NULL DEFAULT 0,
  UNIQUE (audit_transition_id, code)
);

CREATE TABLE IF NOT EXISTS test_questions (
  id bigserial PRIMARY KEY,
  audit_transition_id bigint NOT NULL REFERENCES audit_transitions(id) ON DELETE CASCADE,
  section_id bigint NOT NULL REFERENCES test_sections(id) ON DELETE CASCADE,
  question_number smallint NOT NULL,
  question_text text NOT NULL,
  guidance_text text,
  is_key boolean NOT NULL DEFAULT false,
  is_conditional boolean NOT NULL DEFAULT false,
  condition_text varchar(255),
  has_not_applicable boolean NOT NULL DEFAULT false,
  is_added boolean NOT NULL DEFAULT false,
  weight numeric(4,2) NOT NULL DEFAULT 1.00,
  sort_order smallint NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS recommendation_library (
  id bigserial PRIMARY KEY,
  type varchar(30) NOT NULL,
  title varchar(255) NOT NULL,
  author_or_name varchar(150),
  description text,
  cover_url varchar(500),
  external_url varchar(500),
  internal_product_id bigint,
  phase_relevance varchar(50),
  tags varchar(500),
  is_premium boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  sort_order smallint NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS recommendation_triggers (
  id bigserial PRIMARY KEY,
  question_id bigint NOT NULL REFERENCES test_questions(id) ON DELETE CASCADE,
  recommendation_id bigint NOT NULL REFERENCES recommendation_library(id) ON DELETE CASCADE,
  trigger_on_answer varchar(20) NOT NULL DEFAULT 'TIDAK',
  priority smallint NOT NULL DEFAULT 5,
  is_active boolean NOT NULL DEFAULT true,
  UNIQUE (question_id, recommendation_id, trigger_on_answer)
);

CREATE TABLE IF NOT EXISTS product_categories (
  id bigserial PRIMARY KEY,
  code varchar(50) NOT NULL UNIQUE,
  name varchar(100) NOT NULL,
  sort_order smallint NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS products (
  id bigserial PRIMARY KEY,
  category_id bigint NOT NULL REFERENCES product_categories(id) ON DELETE RESTRICT,
  code varchar(50) NOT NULL UNIQUE,
  name varchar(200) NOT NULL,
  short_desc varchar(500),
  long_desc text,
  type varchar(30) NOT NULL,
  price bigint NOT NULL DEFAULT 0,
  price_strikethrough bigint,
  includes_audit_ids varchar(100),
  is_featured boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  sort_order smallint NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS upsell_items (
  id bigserial PRIMARY KEY,
  product_id bigint REFERENCES products(id) ON DELETE SET NULL,
  name varchar(200) NOT NULL,
  short_desc varchar(500),
  type varchar(30) NOT NULL,
  price bigint NOT NULL DEFAULT 0,
  cta_label varchar(100),
  cta_url varchar(500),
  trigger_phase_ids varchar(50),
  trigger_condition varchar(255),
  is_active boolean NOT NULL DEFAULT true,
  sort_order smallint NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS payment_methods (
  id bigserial PRIMARY KEY,
  code varchar(50) NOT NULL UNIQUE,
  name varchar(100) NOT NULL,
  logo_url varchar(500),
  type varchar(50) NOT NULL,
  provider varchar(50) NOT NULL,
  admin_fee_flat bigint NOT NULL DEFAULT 0,
  admin_fee_pct numeric(5,2) NOT NULL DEFAULT 0.00,
  is_active boolean NOT NULL DEFAULT true,
  is_redirect boolean NOT NULL DEFAULT false,
  sort_order smallint NOT NULL DEFAULT 0,
  account_number varchar(50),
  account_holder varchar(150)
);

CREATE TABLE IF NOT EXISTS payment_instructions (
  id bigserial PRIMARY KEY,
  payment_method_id bigint NOT NULL REFERENCES payment_methods(id) ON DELETE CASCADE,
  title varchar(255) NOT NULL,
  content text NOT NULL,
  sort_order smallint NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS coupon_codes (
  id bigserial PRIMARY KEY,
  code varchar(50) NOT NULL UNIQUE,
  description varchar(255),
  discount_type varchar(20) NOT NULL,
  discount_value numeric(10,2) NOT NULL,
  min_purchase bigint NOT NULL DEFAULT 0,
  max_discount bigint,
  usage_limit integer,
  usage_count integer NOT NULL DEFAULT 0,
  usage_limit_per_user smallint NOT NULL DEFAULT 1,
  applicable_product_ids varchar(200),
  valid_from timestamptz NOT NULL,
  valid_until timestamptz NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_by bigint REFERENCES admins(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS orders (
  id bigserial PRIMARY KEY,
  invoice_code varchar(50) NOT NULL UNIQUE,
  customer_id bigint NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  payment_method_id bigint REFERENCES payment_methods(id) ON DELETE SET NULL,
  affiliate_id bigint REFERENCES affiliates(id) ON DELETE SET NULL,
  coupon_code_id bigint REFERENCES coupon_codes(id) ON DELETE SET NULL,
  subtotal bigint NOT NULL DEFAULT 0,
  discount_amount bigint NOT NULL DEFAULT 0,
  admin_fee bigint NOT NULL DEFAULT 0,
  total_amount bigint NOT NULL DEFAULT 0,
  unique_amount bigint,
  currency varchar(5) NOT NULL DEFAULT 'IDR',
  status varchar(30) NOT NULL DEFAULT 'PENDING',
  payment_type varchar(50),
  payment_url varchar(1000),
  va_number varchar(80),
  qr_string text,
  payment_code varchar(100),
  snap_token varchar(200),
  payment_ref varchar(100),
  paid_at timestamptz,
  expired_at timestamptz,
  utm_source varchar(100),
  utm_medium varchar(100),
  utm_campaign varchar(100),
  fb_click_id varchar(200),
  fb_browser_id varchar(200),
  tiktok_click_id varchar(200),
  google_click_id varchar(200),
  customer_name varchar(150),
  customer_email varchar(150),
  customer_phone varchar(30),
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_manual_unique_day
  ON orders (payment_method_id, unique_amount, ((created_at AT TIME ZONE 'Asia/Jakarta')::date))
  WHERE unique_amount IS NOT NULL AND status = 'PENDING';

CREATE TABLE IF NOT EXISTS order_items (
  id bigserial PRIMARY KEY,
  order_id bigint NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id bigint NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  product_name varchar(200) NOT NULL,
  product_type varchar(30) NOT NULL,
  quantity smallint NOT NULL DEFAULT 1,
  unit_price bigint NOT NULL,
  total_price bigint NOT NULL,
  audit_ids_unlocked varchar(100)
);

CREATE TABLE IF NOT EXISTS payment_logs (
  id bigserial PRIMARY KEY,
  invoice_code varchar(50) NOT NULL,
  order_id bigint REFERENCES orders(id) ON DELETE SET NULL,
  endpoint varchar(500),
  type varchar(50),
  request_payload text,
  response_payload text,
  http_status smallint,
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS test_sessions (
  id bigserial PRIMARY KEY,
  customer_id bigint NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  order_id bigint NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
  audit_transition_id bigint NOT NULL REFERENCES audit_transitions(id) ON DELETE RESTRICT,
  respondent_name varchar(150),
  company_name varchar(200),
  business_field varchar(100),
  business_start_year smallint,
  external_auditor_name varchar(150),
  status varchar(30) NOT NULL DEFAULT 'NOT_STARTED',
  current_section_id bigint REFERENCES test_sections(id) ON DELETE SET NULL,
  answered_count smallint NOT NULL DEFAULT 0,
  total_questions smallint NOT NULL DEFAULT 0,
  started_at timestamptz,
  completed_at timestamptz,
  expired_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_tsess_customer_audit_active
  ON test_sessions (customer_id, audit_transition_id)
  WHERE status IN ('NOT_STARTED', 'IN_PROGRESS');

CREATE TABLE IF NOT EXISTS test_answers (
  id bigserial PRIMARY KEY,
  session_id bigint NOT NULL REFERENCES test_sessions(id) ON DELETE CASCADE,
  question_id bigint NOT NULL REFERENCES test_questions(id) ON DELETE RESTRICT,
  answer varchar(20) NOT NULL,
  note text,
  answered_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (session_id, question_id)
);

CREATE TABLE IF NOT EXISTS test_results (
  id bigserial PRIMARY KEY,
  session_id bigint NOT NULL UNIQUE REFERENCES test_sessions(id) ON DELETE CASCADE,
  customer_id bigint NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  audit_transition_id bigint NOT NULL REFERENCES audit_transitions(id) ON DELETE RESTRICT,
  total_questions smallint NOT NULL,
  total_key_questions smallint NOT NULL,
  answered_ya smallint NOT NULL DEFAULT 0,
  answered_tidak smallint NOT NULL DEFAULT 0,
  answered_na smallint NOT NULL DEFAULT 0,
  key_ya smallint NOT NULL DEFAULT 0,
  key_tidak smallint NOT NULL DEFAULT 0,
  overall_score numeric(5,2) NOT NULL,
  key_pass boolean NOT NULL DEFAULT false,
  status varchar(30) NOT NULL,
  from_phase_id bigint NOT NULL REFERENCES phases(id) ON DELETE RESTRICT,
  to_phase_id bigint NOT NULL REFERENCES phases(id) ON DELETE RESTRICT,
  pdf_url varchar(500),
  pdf_generated_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS result_section_scores (
  id bigserial PRIMARY KEY,
  result_id bigint NOT NULL REFERENCES test_results(id) ON DELETE CASCADE,
  section_id bigint NOT NULL REFERENCES test_sections(id) ON DELETE RESTRICT,
  total_questions smallint NOT NULL,
  total_key smallint NOT NULL DEFAULT 0,
  ya_count smallint NOT NULL DEFAULT 0,
  tidak_count smallint NOT NULL DEFAULT 0,
  na_count smallint NOT NULL DEFAULT 0,
  key_ya_count smallint NOT NULL DEFAULT 0,
  key_tidak_count smallint NOT NULL DEFAULT 0,
  score_pct numeric(5,2) NOT NULL,
  key_pass boolean NOT NULL DEFAULT true,
  UNIQUE (result_id, section_id)
);

CREATE TABLE IF NOT EXISTS result_recommendations (
  id bigserial PRIMARY KEY,
  result_id bigint NOT NULL REFERENCES test_results(id) ON DELETE CASCADE,
  recommendation_id bigint NOT NULL REFERENCES recommendation_library(id) ON DELETE RESTRICT,
  triggered_by_q_id bigint NOT NULL REFERENCES test_questions(id) ON DELETE RESTRICT,
  priority smallint NOT NULL DEFAULT 5,
  is_key_trigger boolean NOT NULL DEFAULT false,
  is_shown_in_pdf boolean NOT NULL DEFAULT true,
  UNIQUE (result_id, recommendation_id)
);

CREATE TABLE IF NOT EXISTS affiliate_referrals (
  id bigserial PRIMARY KEY,
  affiliate_id bigint NOT NULL REFERENCES affiliates(id) ON DELETE RESTRICT,
  order_id bigint NOT NULL UNIQUE REFERENCES orders(id) ON DELETE RESTRICT,
  commission_amount bigint NOT NULL DEFAULT 0,
  commission_status varchar(20) NOT NULL DEFAULT 'PENDING',
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS coupon_usage (
  id bigserial PRIMARY KEY,
  coupon_id bigint NOT NULL REFERENCES coupon_codes(id) ON DELETE RESTRICT,
  customer_id bigint NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  order_id bigint NOT NULL UNIQUE REFERENCES orders(id) ON DELETE RESTRICT,
  discount_applied bigint NOT NULL,
  used_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notification_templates (
  id bigserial PRIMARY KEY,
  event_trigger varchar(80) NOT NULL,
  channel varchar(20) NOT NULL,
  subject varchar(255),
  message_content text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (event_trigger, channel)
);

CREATE TABLE IF NOT EXISTS notification_logs (
  id bigserial PRIMARY KEY,
  template_id bigint REFERENCES notification_templates(id) ON DELETE SET NULL,
  invoice_code varchar(50),
  order_id bigint REFERENCES orders(id) ON DELETE SET NULL,
  session_id bigint REFERENCES test_sessions(id) ON DELETE SET NULL,
  recipient varchar(150) NOT NULL,
  channel varchar(20) NOT NULL,
  request_payload text,
  response_payload text,
  status varchar(20) NOT NULL DEFAULT 'PENDING',
  error_message text,
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS testimonials (
  id bigserial PRIMARY KEY,
  customer_id bigint REFERENCES customers(id) ON DELETE SET NULL,
  name varchar(100) NOT NULL,
  role varchar(100),
  photo_url varchar(500),
  content text NOT NULL,
  rating smallint NOT NULL DEFAULT 5,
  video_url varchar(500),
  business_type varchar(100),
  is_featured boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  sort_order smallint NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS site_settings (
  key varchar(80) PRIMARY KEY,
  value text,
  updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE recommendation_library
  DROP CONSTRAINT IF EXISTS fk_reclib_upsell;
ALTER TABLE recommendation_library
  ADD CONSTRAINT fk_reclib_upsell FOREIGN KEY (internal_product_id)
  REFERENCES upsell_items(id) ON DELETE SET NULL;
