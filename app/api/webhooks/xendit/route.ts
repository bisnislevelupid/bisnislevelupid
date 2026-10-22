import { NextRequest, NextResponse } from "next/server";
import { verifyXenditToken } from "@/lib/payment/xendit";
import { markPaid } from "@/lib/checkout";
import { notifyOrderPaid } from "@/lib/email/notify";

export async function POST(req: NextRequest) {
  const token = req.headers.get("x-callback-token");
  if (!verifyXenditToken(token)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }
  const payload = await req.json();
  const event = String(payload.event ?? payload.status ?? "");
  const data = payload.data ?? payload;
  const status = String(data.status ?? payload.status ?? "");
  const invoice = String(data.reference_id ?? payload.external_id ?? data.referenceId ?? "");
  const success = event.includes("succeeded") || status === "SUCCEEDED" || status === "PAID" || status === "COMPLETED";
  if (success && invoice) {
    const paid = await markPaid(invoice, "/api/webhooks/xendit", payload);
    if (paid) {
      try {
        await notifyOrderPaid(invoice, req.nextUrl.origin);
      } catch (error) {
        console.error("[paid email]", error);
      }
    }
  }
  return NextResponse.json({ received: true });
}
