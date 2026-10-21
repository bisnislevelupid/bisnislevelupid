import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { saveAdmin } from "@/lib/admin/managed";
import { superadminFromRequest } from "@/lib/auth/session";

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  role: z.string().min(1),
  status: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const session = await superadminFromRequest(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = schema.parse(await req.json());
    const id = await saveAdmin(body);
    return NextResponse.json({ data: { id } });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Gagal menyimpan" }, { status: 400 });
  }
}
