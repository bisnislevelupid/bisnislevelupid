import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { saveTemplate } from "@/lib/admin/managed";
import { superadminFromRequest } from "@/lib/auth/session";

const schema = z.object({
  eventTrigger: z.string().min(1),
  channel: z.string().min(1),
  subject: z.string().default(""),
  messageContent: z.string().min(1),
  isActive: z.boolean(),
});

export async function POST(req: NextRequest) {
  const session = await superadminFromRequest(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const id = await saveTemplate(schema.parse(await req.json()));
    return NextResponse.json({ data: { id } });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Gagal menyimpan" }, { status: 400 });
  }
}
