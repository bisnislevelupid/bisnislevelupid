import { NextResponse } from "next/server";
import { z } from "zod";
import { getPesertaSession } from "@/lib/auth/session";
import { saveAnswer } from "@/lib/db/portal";

const schema = z.object({
  sessionId: z.string().min(1),
  questionId: z.string().min(1),
  answer: z.enum(["YA", "TIDAK", "TIDAK_BERLAKU"]),
  note: z.string().max(1000).optional().default(""),
});

export async function POST(req: Request) {
  const session = await getPesertaSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = schema.parse(await req.json());
    const result = await saveAnswer({ customerId: session.id, ...body });
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
    return NextResponse.json({ data: { saved: true } });
  } catch (error) {
    console.error("[POST /api/akun/jawaban]", error);
    return NextResponse.json({ error: "Jawaban tidak valid" }, { status: 400 });
  }
}
