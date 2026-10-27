import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getPesertaSession } from "@/lib/auth/session";
import { placeOrder } from "@/lib/checkout";
import { getCheckoutProfile } from "@/lib/db/public";
import { notifyOrderCreated } from "@/lib/email/notify";
import { runLater } from "@/lib/notify/later";

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
  auditCode: z.string().trim().max(20).optional(),
  agree: z.literal(true),
});

export async function POST(req: NextRequest) {
  try {
    const body = schema.parse(await req.json());
    const origin = req.nextUrl.origin;
    const session = await getPesertaSession();
    let email = body.email;
    let customerId: string | undefined;
    if (session) {
      const profile = await getCheckoutProfile(session.id);
      if (!profile) return NextResponse.json({ error: "Akun tidak ditemukan" }, { status: 401 });
      email = profile.email;
      customerId = session.id;
    }
    const result = await placeOrder({ ...body, email, customerId, origin });
    if (["bank_transfer", "va", "retail_outlet"].includes(result.methodType)) {
      runLater(() => notifyOrderCreated(result.invoice, origin));
    }
    return NextResponse.json({ data: { invoice: result.invoice, redirect: result.redirect } });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Checkout gagal";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
