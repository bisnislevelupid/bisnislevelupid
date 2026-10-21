import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { saveMethod } from "@/lib/admin/managed";
import { mutateResource } from "@/lib/admin/crud";
import { superadminFromRequest } from "@/lib/auth/session";

const step = z.object({
  id: z.string().optional(),
  title: z.string().min(1),
  content: z.string().min(1),
  sortOrder: z.coerce.number().int().default(0),
});

const schema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  logoUrl: z.string().default(""),
  type: z.string().min(1),
  provider: z.string().min(1),
  adminFeeFlat: z.coerce.number().int().nonnegative(),
  adminFeePct: z.coerce.number().nonnegative(),
  isActive: z.boolean(),
  isRedirect: z.boolean(),
  sortOrder: z.coerce.number().int(),
  accountNumber: z.string().default(""),
  accountHolder: z.string().default(""),
  instructions: z.array(step),
});

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await superadminFromRequest(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  try {
    const body = schema.parse(await req.json());
    const saved = await saveMethod(body, id);
    return NextResponse.json({ data: { id: saved } });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Gagal menyimpan" }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await superadminFromRequest(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  await mutateResource("payment_methods", "delete", {}, id);
  return NextResponse.json({ ok: true });
}
