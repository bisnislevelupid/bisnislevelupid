export interface Phase {
  id: number;
  phase_number: number;
  code: string;
  name_short: string;
  name_label: string;
  crisis_title: string;
  crisis_desc: string;
  description: string;
  icon_key: string;
  color_hex: string;
}

export interface AuditTransition {
  id: number;
  code: string;
  from_phase_id: number;
  to_phase_id: number;
  name: string;
  gate_desc: string;
  total_questions: number;
  total_key_questions: number;
  passing_score: number;
}

export interface TestSection {
  id: number;
  audit_transition_id: number;
  code: string;
  name: string;
  sub_name?: string;
}

export interface TestQuestion {
  id: number;
  audit_transition_id: number;
  section_id: number;
  question_number: number;
  question_text: string;
  guidance_text?: string;
  is_key: boolean;
  is_conditional?: boolean;
  has_not_applicable?: boolean;
}

export interface RecommendationItem {
  id: number;
  type: 'BUKU' | 'MENTOR' | 'KELAS_INTERNAL' | 'EBOOK' | 'COACHING_ONLINE' | 'COACHING_OFFLINE' | 'VIDEO' | 'TOOL';
  title: string;
  author_or_name: string;
  description: string;
  cover_url?: string;
  external_url: string;
  phase_relevance: string;
  is_premium?: boolean;
  badge?: string;
  price?: number;
}

export interface Product {
  id: number;
  code: string;
  name: string;
  short_desc: string;
  type: 'SINGLE_AUDIT' | 'BUNDLE_AUDIT' | 'COACHING' | 'EBOOK';
  price: number;
  price_strikethrough?: number;
  includes_audit_ids?: string;
  badge?: string;
  features: string[];
}

export interface PaymentMethod {
  id: number;
  code: string;
  name: string;
  type: 'QR_CODE' | 'VIRTUAL_ACCOUNT' | 'E_WALLET' | 'BANK_TRANSFER';
  logo_url?: string;
  provider: string;
  instructions: { title: string; steps: string[] }[];
}

export interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string;
  business_name: string;
  business_field: string;
  business_city: string;
  avatar?: string;
}

export interface Order {
  id: number;
  invoice_code: string;
  customer_id: number;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  product_name: string;
  subtotal: number;
  discount_amount: number;
  total_amount: number;
  status: 'PENDING' | 'PAID' | 'EXPIRED';
  payment_method_name: string;
  va_number?: string;
  created_at: string;
  paid_at?: string;
}

export interface TestSession {
  id: number;
  customer_id: number;
  order_id: number;
  audit_transition_id: number;
  company_name: string;
  respondent_name: string;
  business_field: string;
  business_start_year: number;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
  started_at?: string;
  completed_at?: string;
  answered_count: number;
  total_questions: number;
}

export interface TestResult {
  session_id: number;
  overall_score: number;
  key_pass: boolean;
  status: 'SIAP_NAIK' | 'HAMPIR' | 'BELUM_SIAP' | 'DALAM_BAHAYA';
  status_label: string;
  from_phase: Phase;
  to_phase: Phase;
  total_questions: number;
  total_key_questions: number;
  answered_ya: number;
  answered_tidak: number;
  key_ya: number;
  key_tidak: number;
  section_scores: {
    section_code: string;
    section_name: string;
    score_pct: number;
    key_pass: boolean;
    ya_count: number;
    total: number;
  }[];
  critical_gaps: {
    question_text: string;
    section_name: string;
    is_key: boolean;
    recommendation?: RecommendationItem;
  }[];
  recommendations: RecommendationItem[];
}
