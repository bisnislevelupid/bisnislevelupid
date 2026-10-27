import { foundationFor } from "@/lib/portal/foundations";

export type ReportCta = {
  role: "primary" | "secondary";
  label: string;
  href: string;
  detail: string;
};

export type ReportCtaPlan = {
  suppressProducts: boolean;
  items: ReportCta[];
};

const WA_MESSAGE =
  "Halo tim BisnisLevelUp.id, hasil audit saya belum dapat dinilai karena terlalu banyak jawaban Tidak Berlaku. Saya ingin membahasnya.";

export function whatsAppHref(number: string | null | undefined, message = WA_MESSAGE) {
  const digits = (number ?? "").replace(/\D/g, "");
  if (!digits) return null;
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

export function buildReportCtas(input: {
  status: string;
  auditCode: string;
  origin: string;
  whatsapp: string | null;
}): ReportCtaPlan {
  const origin = input.origin.replace(/\/$/, "");
  const coaching: ReportCta = {
    role: "secondary",
    label: "Coaching 1:1",
    href: `${origin}/checkout?product=audit-coaching`,
    detail: "Sesi pendampingan untuk menyusun urutan kerja dari celah yang sudah terlihat di laporan ini.",
  };
  if (input.status === "TIDAK_DAPAT_DINILAI") {
    const href = whatsAppHref(input.whatsapp);
    return {
      suppressProducts: true,
      items: [
        {
          role: "primary",
          label: "Bicara dengan Tim Kami",
          href: href ?? `${origin}/akun/laporan`,
          detail: href
            ? "Terlalu banyak jawaban Tidak Berlaku, jadi hasilnya tidak representatif. Hubungi tim lewat WhatsApp. Tidak ada penawaran produk pada status ini."
            : "Terlalu banyak jawaban Tidak Berlaku, jadi hasilnya tidak representatif. Nomor WhatsApp tim diatur lewat SUPPORT_WHATSAPP atau pengaturan support_whatsapp. Tidak ada penawaran produk pada status ini.",
        },
      ],
    };
  }
  if (input.status === "PERLU_FONDASI") {
    const offer = foundationFor(input.auditCode);
    return {
      suppressProducts: true,
      items: [
        {
          role: "primary",
          label: "Kelas & ebook fondasi",
          href: `${origin}/akun/layanan#${offer?.code ?? "fondasi"}`,
          detail: offer
            ? `${offer.name}. ${offer.summary}`
            : "Kelas dan ebook fondasi untuk fase ini menyusun pondasi pendukung yang masih di bawah 60%.",
        },
        { ...coaching, role: "secondary" },
      ],
    };
  }
  if (input.status === "BELUM_SIAP" || input.status === "DALAM_BAHAYA") {
    return {
      suppressProducts: false,
      items: [
        {
          ...coaching,
          role: "primary",
          detail: "Gerbang kunci masih tertutup. Coaching 1:1 membantu memilih butir yang harus ditutup lebih dulu.",
        },
      ],
    };
  }
  return { suppressProducts: false, items: [] };
}

export function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function ctaEmailHtml(items: ReportCta[]) {
  return items
    .map((item) => {
      const primary = item.role === "primary";
      const style = primary
        ? "display:inline-block;background:#059669;color:#ffffff;text-decoration:none;font-weight:700;padding:12px 20px;border-radius:999px;margin:0 8px 14px 0;"
        : "display:inline-block;background:#ffffff;color:#047857;border:1px solid #059669;text-decoration:none;font-weight:700;padding:12px 20px;border-radius:999px;margin:0 8px 14px 0;";
      return `<p style="margin:0 0 8px;font-size:14px;line-height:1.6;color:#334155;">${escapeHtml(item.detail)}</p><a href="${escapeHtml(item.href)}" style="${style}">${escapeHtml(item.label)}</a>`;
    })
    .join("");
}

export function ctaPlainText(items: ReportCta[]) {
  return items.map((item) => `${item.label}: ${item.detail} ${item.href}`).join("\n\n");
}
