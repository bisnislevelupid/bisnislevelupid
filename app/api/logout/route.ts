import { NextRequest, NextResponse } from "next/server";
import { sessionCookie, type AuthRealm } from "@/lib/auth/options";

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const realm: AuthRealm = form.get("realm") === "superadmin" ? "superadmin" : "peserta";
  const back = realm === "superadmin" ? "/masuk-admin" : "/masuk";
  const res = NextResponse.redirect(new URL(back, req.url), 303);
  const secure = process.env.NEXTAUTH_URL?.startsWith("https://") ?? false;
  const base = sessionCookie(realm);
  for (const name of [base, `${base}.0`, `${base}.1`]) {
    res.cookies.set(name, "", { httpOnly: true, sameSite: "lax", path: "/", maxAge: 0, secure });
  }
  return res;
}
