import { NextResponse } from "next/server";
import { z } from "zod";
import { getPesertaSession } from "@/lib/auth/session";
import { startSession } from "@/lib/db/portal";

const schema = z.object({
  auditCode: z.enum(["audit_1_2", "audit_2_3", "audit_3_4", "audit_4_5"]),
  orderId: z.string().min(1),
  respondentName: z.string().min(2),
  companyName: z.string().min(2),
  businessField: z.string().min(2),
  businessStartYear: z.coerce.number().int().min(1970).max(new Date().getFullYear()),
  externalAuditorName: z.string().optional().default(""),
});

export async function POST(req: Request) {
  const session = await getPesertaSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = schema.parse(await req.json());
    const result = await startSession({ customerId: session.id, ...body });
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
    return NextResponse.json({ data: { sessionId: result.sessionId } });
  } catch (error) {
    console.error("[POST /api/akun/sesi]", error);
    return NextResponse.json({ error: "Data sesi tidak valid" }, { status: 400 });
  }
}
