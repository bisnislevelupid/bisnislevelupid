import { NextRequest, NextResponse } from "next/server";
import { isAdminTable } from "@/lib/admin/resources";
import { getResource, mutateResource } from "@/lib/admin/crud";
import { superadminFromRequest } from "@/lib/auth/session";

const NO_EDIT = new Set(["payment_logs", "notification_logs"]);

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
  if (NO_EDIT.has(resource)) return NextResponse.json({ error: "Log tidak diubah" }, { status: 405 });
  try {
    const body = await req.json();
    const row = await mutateResource(resource, "update", body, decodeURIComponent(id));
    return NextResponse.json({ data: row });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Gagal" }, { status: 400 });
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
  await mutateResource(resource, "delete", {}, decodeURIComponent(id));
  return NextResponse.json({ ok: true });
}
