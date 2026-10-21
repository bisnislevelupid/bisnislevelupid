import NextAuth from "next-auth";
import type { NextRequest } from "next/server";
import { buildAuthOptions, intentCookie, type AuthRealm } from "@/lib/auth/options";

function realmFrom(req: NextRequest): AuthRealm {
  return req.cookies.get(intentCookie())?.value === "superadmin" ? "superadmin" : "peserta";
}

async function handler(req: NextRequest, context: { params: Promise<{ nextauth: string[] }> }) {
  return NextAuth(req, context, buildAuthOptions(realmFrom(req)));
}

export { handler as GET, handler as POST };
