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

export const PANEL_SECTIONS: {
  label: string;
  href: string;
  icon: string;
  tabs: { label: string; href: string; icon: string }[];
}[] = [
  { label: "Dashboard", href: "/panel", icon: "LayoutDashboard", tabs: [] },
  {
    label: "Auth",
    href: "/panel/pengguna",
    icon: "Shield",
    tabs: [
      { label: "Pengguna panel", href: "/panel/pengguna", icon: "UserCog" },
      { label: "Data customer", href: "/panel/customers", icon: "Users" },
      { label: "Sesi peserta", href: "/panel/customer_sessions", icon: "KeyRound" },
      { label: "Afiliasi", href: "/panel/affiliates", icon: "Handshake" },
    ],
  },
  {
    label: "Konten",
    href: "/panel/phases",
    icon: "Library",
    tabs: [
      { label: "Fase bisnis", href: "/panel/phases", icon: "Layers" },
      { label: "Transisi audit", href: "/panel/audit_transitions", icon: "GitBranch" },
      { label: "Seksi soal", href: "/panel/test_sections", icon: "FolderTree" },
      { label: "Bank soal", href: "/panel/test_questions", icon: "HelpCircle" },
      { label: "Library rekomendasi", href: "/panel/recommendation_library", icon: "BookOpen" },
      { label: "Pemicu rekomendasi", href: "/panel/recommendation_triggers", icon: "Zap" },
    ],
  },
  {
    label: "Produk",
    href: "/panel/products",
    icon: "Package",
    tabs: [
      { label: "Kategori", href: "/panel/product_categories", icon: "Tags" },
      { label: "Katalog", href: "/panel/products", icon: "Package" },
      { label: "Upsell", href: "/panel/upsell_items", icon: "BadgePlus" },
    ],
  },
  {
    label: "Pembayaran",
    href: "/panel/orders",
    icon: "Wallet",
    tabs: [
      { label: "Metode & instruksi", href: "/panel/metode-bayar", icon: "CreditCard" },
      { label: "Pesanan", href: "/panel/orders", icon: "ShoppingCart" },
      { label: "Item pesanan", href: "/panel/order_items", icon: "List" },
      { label: "Log pembayaran", href: "/panel/log-pembayaran", icon: "Receipt" },
    ],
  },
  {
    label: "Tes",
    href: "/panel/test_sessions",
    icon: "ClipboardList",
    tabs: [
      { label: "Sesi", href: "/panel/test_sessions", icon: "Timer" },
      { label: "Jawaban", href: "/panel/test_answers", icon: "CheckSquare" },
      { label: "Hasil", href: "/panel/test_results", icon: "BarChart3" },
      { label: "Skor seksi", href: "/panel/result_section_scores", icon: "PieChart" },
      { label: "Rekomendasi", href: "/panel/result_recommendations", icon: "Lightbulb" },
    ],
  },
  {
    label: "Promo",
    href: "/panel/coupon_codes",
    icon: "Ticket",
    tabs: [
      { label: "Kode kupon", href: "/panel/coupon_codes", icon: "Ticket" },
      { label: "Pemakaian", href: "/panel/coupon_usage", icon: "TicketCheck" },
      { label: "Rujukan afiliasi", href: "/panel/affiliate_referrals", icon: "Share2" },
    ],
  },
  {
    label: "Notifikasi",
    href: "/panel/template-notifikasi",
    icon: "Bell",
    tabs: [
      { label: "Template", href: "/panel/template-notifikasi", icon: "Mail" },
      { label: "Log", href: "/panel/log-notifikasi", icon: "ScrollText" },
    ],
  },
  {
    label: "CMS",
    href: "/panel/testimonials",
    icon: "PanelsTopLeft",
    tabs: [
      { label: "Testimoni", href: "/panel/testimonials", icon: "Quote" },
      { label: "Pengaturan situs", href: "/panel/site_settings", icon: "Settings" },
    ],
  },
];

function pathMatches(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function sectionForPath(pathname: string) {
  return PANEL_SECTIONS.find((section) => section.tabs.some((tab) => pathMatches(pathname, tab.href))) ?? null;
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
