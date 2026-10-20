import { NextRequest, NextResponse } from "next/server";
import { isAdminTable } from "@/lib/admin/resources";
import { listResource, mutateResource } from "@/lib/admin/crud";

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ resource: string }> },
) {
  const { resource } = await ctx.params;
  if (!isAdminTable(resource)) return NextResponse.json({ error: "Unknown" }, { status: 404 });
  const page = Number(req.nextUrl.searchParams.get("page") ?? 1);
  const limit = Math.min(50, Number(req.nextUrl.searchParams.get("limit") ?? 10));
  const q = req.nextUrl.searchParams.get("q") ?? undefined;
  const result = await listResource(resource, page, limit, q);
  return NextResponse.json(result);
}

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ resource: string }> },
) {
  const { resource } = await ctx.params;
  if (!isAdminTable(resource)) return NextResponse.json({ error: "Unknown" }, { status: 404 });
  try {
    const body = await req.json();
    const row = await mutateResource(resource, "insert", body);
    return NextResponse.json({ data: row });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Gagal" }, { status: 400 });
  }
}
