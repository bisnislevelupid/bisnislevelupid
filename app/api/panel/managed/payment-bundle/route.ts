import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { saveMethod } from "@/lib/admin/managed";
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

export async function POST(req: NextRequest) {
  const session = await superadminFromRequest(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = schema.parse(await req.json());
    const id = await saveMethod(body);
    return NextResponse.json({ data: { id } });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Gagal menyimpan" }, { status: 400 });
  }
}
