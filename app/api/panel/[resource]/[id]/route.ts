import { NextRequest, NextResponse } from "next/server";
import { isAdminTable, isReadonlyResource } from "@/lib/admin/resources";
import { getResource, mutateResource } from "@/lib/admin/crud";
import { cancelUnpaidManualOrder } from "@/lib/admin/orders";
import { superadminFromRequest } from "@/lib/auth/session";

async function guard(req: NextRequest) {
  const session = await superadminFromRequest(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return null;
}

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ resource: string; id: string }> },
) {
  const denied = await guard(req);
  if (denied) return denied;
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
  const denied = await guard(req);
  if (denied) return denied;
  const { resource, id } = await ctx.params;
  if (!isAdminTable(resource)) return NextResponse.json({ error: "Unknown" }, { status: 404 });
  if (isReadonlyResource(resource)) return NextResponse.json({ error: "Tabel ini hanya bisa dibaca" }, { status: 405 });
  try {
    const body = await req.json();
    if (resource === "orders" && (body?.action === "cancel" || body?.status === "CANCELLED")) {
      const row = await cancelUnpaidManualOrder(decodeURIComponent(id), String(body?.reason ?? ""));
      return NextResponse.json({ data: row });
    }
    const row = await mutateResource(resource, "update", body, decodeURIComponent(id));
    return NextResponse.json({ data: row });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Gagal";
    const status = message === "Pesanan tidak ditemukan" ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(
  req: NextRequest,
  ctx: { params: Promise<{ resource: string; id: string }> },
) {
  const denied = await guard(req);
  if (denied) return denied;
  const { resource, id } = await ctx.params;
  if (!isAdminTable(resource)) return NextResponse.json({ error: "Unknown" }, { status: 404 });
  if (isReadonlyResource(resource)) return NextResponse.json({ error: "Tabel ini hanya bisa dibaca" }, { status: 405 });
  try {
    await mutateResource(resource, "delete", {}, decodeURIComponent(id));
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Gagal" }, { status: 400 });
  }
}
