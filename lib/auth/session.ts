import { cookies } from "next/headers";
import { decode, getToken } from "next-auth/jwt";
import type { JWT } from "next-auth/jwt";
import type { NextRequest } from "next/server";
import { type AuthRealm, sessionCookie } from "@/lib/auth/options";

export type RealmSession = {
  id: string;
  email: string;
  name: string;
  realm: AuthRealm;
  role: string;
};

async function tokenFromCookie(realm: AuthRealm): Promise<JWT | null> {
  const jar = await cookies();
  const raw = jar.get(sessionCookie(realm))?.value;
  if (!raw || !process.env.NEXTAUTH_SECRET) return null;
  try {
    return await decode({ token: raw, secret: process.env.NEXTAUTH_SECRET });
  } catch {
    return null;
  }
}

function asSession(token: JWT | null, realm: AuthRealm): RealmSession | null {
  if (!token?.sub || token.realm !== realm) return null;
  if (realm === "superadmin" && token.role !== "SUPERADMIN") return null;
  return {
    id: token.sub,
    email: token.email ?? "",
    name: token.name ?? "",
    realm,
    role: token.role ?? "",
  };
}

export async function getPesertaSession() {
  return asSession(await tokenFromCookie("peserta"), "peserta");
}

export async function getSuperadminSession() {
  return asSession(await tokenFromCookie("superadmin"), "superadmin");
}

export async function superadminFromRequest(req: NextRequest) {
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
    cookieName: sessionCookie("superadmin"),
    secureCookie: process.env.NEXTAUTH_URL?.startsWith("https://") ?? false,
  });
  return asSession(token, "superadmin");
}
