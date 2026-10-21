import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { saveAdmin } from "@/lib/admin/managed";
import { mutateResource } from "@/lib/admin/crud";
import { superadminFromRequest } from "@/lib/auth/session";

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  role: z.string().min(1),
  status: z.string().min(1),
});

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await superadminFromRequest(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  try {
    const body = schema.parse(await req.json());
    const saved = await saveAdmin(body, id);
    return NextResponse.json({ data: { id: saved } });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Gagal menyimpan" }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await superadminFromRequest(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  if (session.id === id) return NextResponse.json({ error: "Tidak bisa menghapus akun yang sedang masuk" }, { status: 400 });
  await mutateResource("admins", "delete", {}, id);
  return NextResponse.json({ ok: true });
}
