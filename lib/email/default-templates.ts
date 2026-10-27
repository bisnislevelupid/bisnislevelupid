const shell = (kicker: string, title: string, body: string) => `<div style="font-family:Arial,Helvetica,sans-serif;color:#0f172a;background:#ffffff;border-radius:18px;overflow:hidden;border:1px solid #e2e8f0;">
<div style="background:#064e3b;padding:26px 28px;">
<div style="color:#a7f3d0;font-size:12px;letter-spacing:0.16em;font-weight:700;">BISNISLEVELUP.ID</div>
<div style="color:#ecfdf5;font-size:13px;margin-top:8px;">${kicker}</div>
<div style="color:#ffffff;font-size:24px;line-height:1.3;font-weight:700;margin-top:6px;">${title}</div>
</div>
<div style="padding:28px;">
${body}
</div>
<div style="background:#f8fafc;padding:16px 28px;color:#64748b;font-size:12px;line-height:1.5;">Audit fase bisnis untuk pengusaha Indonesia. Email ini terkait pesanan atau hasil tes di akun Anda.</div>
</div>`;

export const ORDER_CREATED_HTML = shell(
  "Menunggu pembayaran",
  "Selesaikan pembayaran Anda",
  `<p style="margin:0 0 14px;font-size:15px;line-height:1.6;">Halo {nama},</p>
<p style="margin:0 0 18px;font-size:15px;line-height:1.6;color:#334155;">Pesanan <strong>{produk}</strong> sudah kami catat. Bayar sebelum batas waktu agar akses audit langsung terbuka.</p>
<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;padding:16px 18px;margin:0 0 18px;">
<div style="font-size:12px;color:#64748b;font-weight:700;letter-spacing:0.04em;">RINGKASAN</div>
<div style="margin-top:10px;font-size:14px;line-height:1.7;">Invoice <strong>{invoice}</strong><br>Instrumen <strong>{instrumen}</strong><br>Metode <strong>{metode}</strong><br>Batas bayar <strong>{batas}</strong></div>
<div style="margin-top:12px;font-size:22px;font-weight:700;color:#064e3b;">{nominal}</div>
</div>
<div style="margin:0 0 18px;font-size:14px;line-height:1.6;color:#334155;">{instruksi}</div>
<a href="{bayar_url}" style="display:inline-block;background:#059669;color:#ffffff;text-decoration:none;font-weight:700;padding:12px 20px;border-radius:999px;">Buka halaman pembayaran</a>`,
);

export const ORDER_PAID_HTML = shell(
  "Pembayaran diterima",
  "Audit Anda sudah terbuka",
  `<p style="margin:0 0 14px;font-size:15px;line-height:1.6;">Halo {nama},</p>
<p style="margin:0 0 18px;font-size:15px;line-height:1.6;color:#334155;">Pembayaran untuk <strong>{produk}</strong> sudah masuk. Anda bisa mulai checklist dari akun.</p>
<div style="background:#ecfdf5;border:1px solid #a7f3d0;border-radius:14px;padding:16px 18px;margin:0 0 18px;">
<div style="font-size:12px;color:#047857;font-weight:700;letter-spacing:0.04em;">LUNAS</div>
<div style="margin-top:10px;font-size:14px;line-height:1.7;">Invoice <strong>{invoice}</strong><br>Instrumen <strong>{instrumen}</strong><br>Metode <strong>{metode}</strong></div>
<div style="margin-top:12px;font-size:22px;font-weight:700;color:#064e3b;">{nominal}</div>
</div>
<a href="{dashboard_url}" style="display:inline-block;background:#059669;color:#ffffff;text-decoration:none;font-weight:700;padding:12px 20px;border-radius:999px;">Masuk dan mulai audit</a>`,
);

export const TEST_RESULT_HTML = shell(
  "Hasil diagnosis",
  "{audit_name}",
  `<p style="margin:0 0 14px;font-size:15px;line-height:1.6;">Halo {sapaan},</p>
<p style="margin:0 0 18px;font-size:15px;line-height:1.6;color:#334155;">Audit sudah selesai pada {selesai}. Laporan PDF multi-halaman terlampir di email ini. Tautan unduh membuka akun Anda.</p>
<p style="margin:0 0 18px;font-size:15px;line-height:1.6;color:#334155;">{status_arti}</p>
<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;padding:16px 18px;margin:0 0 12px;">
<div style="font-size:12px;color:#64748b;font-weight:700;">SKOR</div>
<div style="font-size:28px;font-weight:700;color:#064e3b;margin-top:6px;">{skor}</div>
</div>
<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;padding:16px 18px;margin:0 0 18px;">
<div style="font-size:12px;color:#64748b;font-weight:700;">STATUS</div>
<div style="font-size:18px;font-weight:700;color:#0f172a;margin-top:8px;">{status}</div>
</div>
<a href="{pdf_url}" style="display:inline-block;background:#059669;color:#ffffff;text-decoration:none;font-weight:700;padding:12px 20px;border-radius:999px;">Unduh laporan PDF</a>
<a href="{dashboard_url}" style="display:inline-block;margin-left:8px;color:#047857;font-weight:700;text-decoration:none;padding:12px 8px;">Lihat di akun</a>
<div style="margin-top:18px;">{cta_html}</div>`,
);
