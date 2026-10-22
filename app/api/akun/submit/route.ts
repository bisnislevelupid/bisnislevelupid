import { NextResponse } from "next/server";
import { z } from "zod";
import { getPesertaSession } from "@/lib/auth/session";
import { submitSession } from "@/lib/db/portal";
import { notifyTestResult } from "@/lib/email/notify";

const schema = z.object({
  sessionId: z.string().min(1),
  confirm: z.literal(true),
});

export async function POST(req: Request) {
  const session = await getPesertaSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = schema.parse(await req.json());
    const result = await submitSession(session.id, body.sessionId);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
    try {
      await notifyTestResult(session.id, body.sessionId, new URL(req.url).origin);
    } catch (error) {
      console.error("[result email]", error);
    }
    return NextResponse.json({ data: { resultId: result.resultId } });
  } catch (error) {
    console.error("[POST /api/akun/submit]", error);
    return NextResponse.json({ error: "Submit gagal" }, { status: 400 });
  }
}
