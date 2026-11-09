import { NextResponse } from "next/server";
import { z, ZodError } from "zod";
import { getPesertaSession } from "@/lib/auth/session";
import { updateNamaSapaan } from "@/lib/db/customers";
import { namaSapaanSchema } from "@/lib/validations/customer";

const schema = z.object({
  namaSapaan: namaSapaanSchema,
});

export async function POST(req: Request) {
  const session = await getPesertaSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = schema.parse(await req.json());
    const result = await updateNamaSapaan(session.id, body.namaSapaan);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
    return NextResponse.json({ data: { namaSapaan: result.namaSapaan } });
  } catch (error) {
    const message = error instanceof ZodError ? error.issues[0]?.message ?? "Nama sapaan tidak valid" : "Nama sapaan tidak valid";
    if (!(error instanceof ZodError)) console.error("[POST /api/akun/profil]", error);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
