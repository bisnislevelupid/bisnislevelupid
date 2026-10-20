import { NextResponse } from "next/server";
import { getOrderPublic } from "@/lib/checkout";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ invoice: string }> },
) {
  const { invoice } = await ctx.params;
  const order = await getOrderPublic(invoice);
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ data: order });
}
