import { NextRequest, NextResponse } from "next/server";
import { verifyMidtransSignature } from "@/lib/payment/midtrans";
import { markPaid } from "@/lib/checkout";
import { notifyOrderPaid } from "@/lib/email/notify";

export async function POST(req: NextRequest) {
  const payload = await req.json();
  const ok = verifyMidtransSignature({
    orderId: String(payload.order_id ?? ""),
    statusCode: String(payload.status_code ?? ""),
    grossAmount: String(payload.gross_amount ?? ""),
    signatureKey: String(payload.signature_key ?? ""),
  });
  if (!ok) return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  const status = String(payload.transaction_status ?? "");
  if (status === "settlement" || status === "capture") {
    const paid = await markPaid(String(payload.order_id), "/api/webhooks/midtrans", payload);
    if (paid) {
      try {
        await notifyOrderPaid(String(payload.order_id), req.nextUrl.origin);
      } catch (error) {
        console.error("[paid email]", error);
      }
    }
  }
  return NextResponse.json({ received: true });
}
