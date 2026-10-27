import { NextRequest, NextResponse } from "next/server";
import { listSiteSettings, saveSiteSettings } from "@/lib/admin/settings";
import { superadminFromRequest } from "@/lib/auth/session";

export async function GET(req: NextRequest) {
  const session = await superadminFromRequest(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const data = await listSiteSettings();
  return NextResponse.json({ data });
}

export async function PUT(req: NextRequest) {
  const session = await superadminFromRequest(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await req.json();
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json({ error: "Payload tidak valid" }, { status: 400 });
    }
    await saveSiteSettings(body as Record<string, unknown>);
    const data = await listSiteSettings();
    return NextResponse.json({ data });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Gagal menyimpan" }, { status: 400 });
  }
}
