import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { withPool } from "@/lib/db";
import { superadminFromRequest } from "@/lib/auth/session";

export async function POST(req: NextRequest) {
  const session = await superadminFromRequest(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const form = await req.formData();
  const file = form.get("file");
  const key = String(form.get("key") ?? "");
  if (!(file instanceof File)) return NextResponse.json({ error: "File kosong" }, { status: 400 });
  if (!["favicon_url", "og_image_url"].includes(key)) {
    return NextResponse.json({ error: "Key tidak diizinkan" }, { status: 400 });
  }
  const blob = await put(`site/${key}-${Date.now()}-${file.name}`, file, { access: "public" });
  await withPool((pool) =>
    pool.query(
      `INSERT INTO site_settings (key, value, updated_at) VALUES ($1,$2,NOW())
       ON CONFLICT (key) DO UPDATE SET value=EXCLUDED.value, updated_at=NOW()`,
      [key, blob.url],
    ),
  );
  return NextResponse.json({ data: { url: blob.url } });
}
