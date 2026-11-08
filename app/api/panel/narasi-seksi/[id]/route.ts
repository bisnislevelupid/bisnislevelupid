import { NextRequest, NextResponse } from "next/server";
import { superadminFromRequest } from "@/lib/auth/session";
import { approveSectionNarrative } from "@/lib/db/section-narratives";

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await superadminFromRequest(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  try {
    const result = await approveSectionNarrative(decodeURIComponent(id), session.email || session.name || "panel");
    if (!result.ok) {
      const status = result.error === "Seksi tidak ditemukan" ? 404 : 400;
      return NextResponse.json({ error: result.error }, { status });
    }
    return NextResponse.json({ data: result });
  } catch (error) {
    console.error("[POST /api/panel/narasi-seksi]", error);
    return NextResponse.json({ error: "Gagal menyetujui seksi" }, { status: 500 });
  }
}
