import { NextRequest, NextResponse } from "next/server";
import { isAdminTable, isReadonlyResource } from "@/lib/admin/resources";
import { listResource, mutateResource } from "@/lib/admin/crud";
import { superadminFromRequest } from "@/lib/auth/session";

async function guard(req: NextRequest) {
  const session = await superadminFromRequest(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return null;
}

function numericParam(value: string | null) {
  if (!value) return undefined;
  return /^\d+$/.test(value) ? value : null;
}

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ resource: string }> },
) {
  const denied = await guard(req);
  if (denied) return denied;
  const { resource } = await ctx.params;
  if (!isAdminTable(resource)) return NextResponse.json({ error: "Unknown" }, { status: 404 });
  const page = Number(req.nextUrl.searchParams.get("page") ?? 1);
  const limit = Math.min(50, Number(req.nextUrl.searchParams.get("limit") ?? 10));
  const q = req.nextUrl.searchParams.get("q") ?? undefined;
  const audit = numericParam(req.nextUrl.searchParams.get("audit"));
  const section = numericParam(req.nextUrl.searchParams.get("section"));
  if (audit === null || section === null) {
    return NextResponse.json({ error: "Filter audit atau seksi tidak valid" }, { status: 400 });
  }
  try {
    const result = await listResource(resource, {
      page,
      limit,
      q,
      audit,
      section,
      includeOptions: req.nextUrl.searchParams.get("options") === "1",
    });
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Gagal" }, { status: 400 });
  }
}

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ resource: string }> },
) {
  const denied = await guard(req);
  if (denied) return denied;
  const { resource } = await ctx.params;
  if (!isAdminTable(resource)) return NextResponse.json({ error: "Unknown" }, { status: 404 });
  if (isReadonlyResource(resource)) return NextResponse.json({ error: "Tabel ini hanya bisa dibaca" }, { status: 405 });
  try {
    const body = await req.json();
    const row = await mutateResource(resource, "insert", body);
    return NextResponse.json({ data: row });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Gagal" }, { status: 400 });
  }
}
