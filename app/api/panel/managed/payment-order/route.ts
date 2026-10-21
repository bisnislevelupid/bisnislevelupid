import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { reorderMethods } from "@/lib/admin/managed";
import { superadminFromRequest } from "@/lib/auth/session";

const schema = z.object({ ids: z.array(z.string().min(1)).min(1) });

export async function POST(req: NextRequest) {
  const session = await superadminFromRequest(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = schema.parse(await req.json());
    await reorderMethods(body.ids);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Gagal mengurutkan" }, { status: 400 });
  }
}
