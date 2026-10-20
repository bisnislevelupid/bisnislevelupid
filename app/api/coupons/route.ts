import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { quoteCoupon } from "@/lib/checkout";

const schema = z.object({
  code: z.string().regex(/^[A-Za-z0-9]{4,20}$/, "Format kupon: 4–20 huruf atau angka"),
  productCode: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Kupon tidak valid" }, { status: 400 });
  }
  const quote = await quoteCoupon(parsed.data.code, parsed.data.productCode);
  if (!quote.ok) return NextResponse.json({ error: quote.error }, { status: 400 });
  return NextResponse.json({ data: quote });
}
