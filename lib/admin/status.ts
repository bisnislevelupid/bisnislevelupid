import { withPool } from "@/lib/db";

export type PanelConnection = {
  manualActive: number;
  xenditActive: number;
  midtransActive: number;
  xenditConfigured: boolean;
  midtransConfigured: boolean;
  midtransProduction: boolean;
};

export function describePanelStatus(input: PanelConnection) {
  const manual = input.manualActive > 0 ? "Transfer bank manual aktif" : "Transfer bank manual nonaktif";
  const xendit = input.xenditConfigured ? "Xendit terkonfigurasi" : "Xendit belum dikonfigurasi";
  const midtrans = !input.midtransConfigured
    ? "Midtrans belum dikonfigurasi"
    : input.midtransProduction
      ? "Midtrans produksi"
      : "Midtrans sandbox";
  const short = `Database terhubung · ${manual} · ${xendit} · ${midtrans}`;
  const title = `${short}. Metode aktif di katalog: transfer manual ${input.manualActive}, Xendit ${input.xenditActive}, Midtrans ${input.midtransActive}. Ini status konfigurasi, bukan hasil koneksi langsung ke gateway.`;
  return { short, title };
}

export async function getPanelStatus() {
  const counts = await withPool(async (pool) => {
    const { rows } = await pool.query(
      `SELECT
         count(*) FILTER (WHERE is_active AND type = 'bank_transfer')::int AS manual_active,
         count(*) FILTER (WHERE is_active AND lower(provider) = 'xendit')::int AS xendit_active,
         count(*) FILTER (WHERE is_active AND lower(provider) = 'midtrans')::int AS midtrans_active
       FROM payment_methods`,
    );
    return rows[0] as { manual_active: number; xendit_active: number; midtrans_active: number };
  });
  return describePanelStatus({
    manualActive: Number(counts?.manual_active ?? 0),
    xenditActive: Number(counts?.xendit_active ?? 0),
    midtransActive: Number(counts?.midtrans_active ?? 0),
    xenditConfigured: Boolean(process.env.XENDIT_API_KEY),
    midtransConfigured: Boolean(process.env.MIDTRANS_SERVER_KEY),
    midtransProduction: process.env.MIDTRANS_IS_PRODUCTION === "true",
  });
}
