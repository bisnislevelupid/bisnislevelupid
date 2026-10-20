import { NextRequest, NextResponse } from "next/server";
import { isAdminTable } from "@/lib/admin/resources";
import { getResource, mutateResource } from "@/lib/admin/crud";

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ resource: string; id: string }> },
) {
  const { resource, id } = await ctx.params;
  if (!isAdminTable(resource)) return NextResponse.json({ error: "Unknown" }, { status: 404 });
  const data = await getResource(resource, decodeURIComponent(id));
  if (!data.row) return NextResponse.json({ error: "Tidak ditemukan" }, { status: 404 });
  return NextResponse.json(data);
}

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ resource: string; id: string }> },
) {
  const { resource, id } = await ctx.params;
  if (!isAdminTable(resource)) return NextResponse.json({ error: "Unknown" }, { status: 404 });
  try {
    const body = await req.json();
    const row = await mutateResource(resource, "update", body, decodeURIComponent(id));
    return NextResponse.json({ data: row });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Gagal" }, { status: 400 });
  }
}

export async function DELETE(
  _req: NextRequest,
  ctx: { params: Promise<{ resource: string; id: string }> },
) {
  const { resource, id } = await ctx.params;
  if (!isAdminTable(resource)) return NextResponse.json({ error: "Unknown" }, { status: 404 });
  await mutateResource(resource, "delete", {}, decodeURIComponent(id));
  return NextResponse.json({ ok: true });
}
