import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { placeOrder } from "@/lib/checkout";

const schema = z.object({
  productCode: z.string().min(1),
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(8),
  businessName: z.string().min(2),
  businessField: z.string().min(2),
  businessCity: z.string().min(2),
  businessStartYear: z.coerce.number().int().min(1970).max(new Date().getFullYear()),
  employeeRange: z.string().min(1),
  monthlyRevenue: z.string().min(1),
  ownerRole: z.string().min(1),
  paymentMethodId: z.string().min(1),
  coupon: z.string().optional(),
  agree: z.literal(true),
});

export async function POST(req: NextRequest) {
  try {
    const body = schema.parse(await req.json());
    const origin = req.nextUrl.origin;
    const result = await placeOrder({ ...body, origin });
    return NextResponse.json({ data: result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Checkout gagal";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
