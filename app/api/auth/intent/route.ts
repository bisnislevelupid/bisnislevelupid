import { NextRequest, NextResponse } from "next/server";
import { intentCookie } from "@/lib/auth/options";

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as { realm?: string } | null;
  const realm = body?.realm === "superadmin" ? "superadmin" : body?.realm === "peserta" ? "peserta" : null;
  if (!realm) return NextResponse.json({ error: "Realm tidak dikenal" }, { status: 400 });
  const secure = process.env.NEXTAUTH_URL?.startsWith("https://") ?? false;
  const res = NextResponse.json({ ok: true });
  res.cookies.set(intentCookie(), realm, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 10 * 60,
    secure,
  });
  return res;
}
