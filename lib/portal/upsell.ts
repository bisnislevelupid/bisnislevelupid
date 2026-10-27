export type CatalogProduct = {
  code: string;
  name: string;
  short_desc: string | null;
  price: string;
  type: string;
};

type UpsellReport = {
  status: string;
  auditCode: string;
  sections: Array<{ name: string; tidak: number }>;
  gaps: Array<{ isKey: boolean; text: string }>;
};

export function suggestUpsells(report: UpsellReport | null, products: CatalogProduct[], ownedCodes: string[]) {
  const picks: Array<{ product: CatalogProduct; reason: string }> = [];
  const take = (predicate: (product: CatalogProduct) => boolean, reason: string) => {
    const product = products.find((item) => predicate(item) && !picks.some((pick) => pick.product.code === item.code));
    if (product) picks.push({ product, reason });
  };
  if (!report) {
    take((product) => product.type === "BUNDLE_AUDIT", "Mulai dari paket instrumen lengkap.");
    return picks.slice(0, 3);
  }
  if (report.status === "TIDAK_DAPAT_DINILAI" || report.status === "PERLU_FONDASI") return [];
  const marketing = report.sections.find((section) => /market|penjualan|sales/i.test(section.name));
  if (marketing && marketing.tidak >= 3) take((product) => /market|coaching/i.test(product.name), "Gap penjualan cukup lebar.");
  if (report.gaps.some((gap) => gap.isKey && /bep|belanja|pribadi|keuangan/i.test(gap.text))) {
    take((product) => /keuangan|ebook|coaching/i.test(`${product.name} ${product.short_desc ?? ""}`), "Butir kunci keuangan masih Tidak.");
  }
  if (report.status === "BELUM_SIAP" || report.status === "DALAM_BAHAYA") {
    take((product) => product.type === "COACHING" || /coaching/i.test(product.name), "Gerbang belum terbuka. Pendampingan 1:1 mempercepat penutupan butir kunci.");
  }
  if (report.auditCode === "audit_1_2" && !ownedCodes.some((code) => code !== "audit_1_2")) {
    take((product) => product.type === "BUNDLE_AUDIT", "Audit fase 1 selesai. Paket lengkap membuka instrumen berikutnya.");
  }
  const sdm = report.sections.find((section) => /sdm|manusia|tim/i.test(section.name));
  if (report.auditCode === "audit_2_3" && sdm && sdm.tidak >= 3) {
    take((product) => /tim|sdm|coaching/i.test(product.name), "Gap tim di fase pertumbuhan.");
  }
  if (picks.length === 0) take((product) => product.type !== "SINGLE_AUDIT", "Lanjutkan dengan layanan pendamping.");
  return picks.slice(0, 3);
}
