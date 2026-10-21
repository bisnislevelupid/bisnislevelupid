import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { saveTemplate } from "@/lib/admin/managed";
import { mutateResource } from "@/lib/admin/crud";
import { superadminFromRequest } from "@/lib/auth/session";

const schema = z.object({
  eventTrigger: z.string().min(1),
  channel: z.string().min(1),
  subject: z.string().default(""),
  messageContent: z.string().min(1),
  isActive: z.boolean(),
});

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await superadminFromRequest(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  try {
    const saved = await saveTemplate(schema.parse(await req.json()), id);
    return NextResponse.json({ data: { id: saved } });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Gagal menyimpan" }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await superadminFromRequest(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  await mutateResource("notification_templates", "delete", {}, id);
  return NextResponse.json({ ok: true });
}
