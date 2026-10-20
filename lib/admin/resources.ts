export const ADMIN_TABLES = [
  "admins",
  "customers",
  "customer_sessions",
  "phases",
  "audit_transitions",
  "test_sections",
  "test_questions",
  "recommendation_library",
  "recommendation_triggers",
  "product_categories",
  "products",
  "upsell_items",
  "payment_methods",
  "payment_instructions",
  "orders",
  "order_items",
  "payment_logs",
  "test_sessions",
  "test_answers",
  "test_results",
  "result_section_scores",
  "result_recommendations",
  "affiliates",
  "affiliate_referrals",
  "coupon_codes",
  "coupon_usage",
  "notification_templates",
  "notification_logs",
  "testimonials",
  "site_settings",
] as const;

export type AdminTable = (typeof ADMIN_TABLES)[number];

export function isAdminTable(value: string): value is AdminTable {
  return (ADMIN_TABLES as readonly string[]).includes(value);
}

export const MENU_GROUPS: { label: string; tables: AdminTable[] }[] = [
  { label: "Auth", tables: ["admins", "customers", "customer_sessions", "affiliates"] },
  { label: "Konten", tables: ["phases", "audit_transitions", "test_sections", "test_questions", "recommendation_library", "recommendation_triggers"] },
  { label: "Produk", tables: ["product_categories", "products", "upsell_items"] },
  { label: "Pembayaran", tables: ["payment_methods", "payment_instructions", "orders", "order_items", "payment_logs"] },
  { label: "Tes", tables: ["test_sessions", "test_answers", "test_results", "result_section_scores", "result_recommendations"] },
  { label: "Promo", tables: ["coupon_codes", "coupon_usage", "affiliate_referrals"] },
  { label: "Notifikasi", tables: ["notification_templates", "notification_logs"] },
  { label: "CMS", tables: ["testimonials", "site_settings"] },
];
