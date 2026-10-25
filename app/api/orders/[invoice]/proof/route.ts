import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { withPool } from "@/lib/db";

const MAX_BYTES = 5 * 1024 * 1024;
const TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ invoice: string }> },
) {
  const { invoice } = await ctx.params;
  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "Pilih gambar bukti transfer" }, { status: 400 });
  if (!TYPES.has(file.type)) return NextResponse.json({ error: "Gunakan gambar JPG, PNG, atau WebP" }, { status: 400 });
  if (file.size > MAX_BYTES) return NextResponse.json({ error: "Ukuran gambar maksimal 5 MB" }, { status: 400 });

  const saved = await withPool(async (pool) => {
    const { rows } = await pool.query(
      `SELECT o.id, m.type, m.provider
       FROM orders o
       LEFT JOIN payment_methods m ON m.id = o.payment_method_id
       WHERE o.invoice_code = $1`,
      [invoice],
    );
    const order = rows[0] as { id: string; type: string | null; provider: string | null } | undefined;
    if (!order) return { error: "Pesanan tidak ditemukan", status: 404 as const };
    if (order.provider !== "Manual" || order.type !== "bank_transfer") {
      return { error: "Bukti transfer hanya untuk pembayaran rekening manual", status: 400 as const };
    }
    const safeName = file.name.replace(/[^\w.-]+/g, "-").slice(0, 80) || "bukti";
    const blob = await put(`bukti/${invoice}-${Date.now()}-${safeName}`, file, {
      access: "public",
      contentType: file.type,
    });
    await pool.query(
      `UPDATE orders SET transfer_proof_url = $2, updated_at = NOW() WHERE invoice_code = $1`,
      [invoice, blob.url],
    );
    return { url: blob.url };
  });

  if ("error" in saved) return NextResponse.json({ error: saved.error }, { status: saved.status });
  return NextResponse.json({ data: { url: saved.url } });
}
