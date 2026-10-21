import { NextResponse } from "next/server";
import { z } from "zod";
import { getPesertaSession } from "@/lib/auth/session";
import { lockSection } from "@/lib/db/portal";

const schema = z.object({
  sessionId: z.string().min(1),
  sectionId: z.string().min(1),
});

export async function POST(req: Request) {
  const session = await getPesertaSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = schema.parse(await req.json());
    const result = await lockSection(session.id, body.sessionId, body.sectionId);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
    return NextResponse.json({ data: { locked: true } });
  } catch (error) {
    console.error("[POST /api/akun/seksi]", error);
    return NextResponse.json({ error: "Seksi tidak valid" }, { status: 400 });
  }
}
