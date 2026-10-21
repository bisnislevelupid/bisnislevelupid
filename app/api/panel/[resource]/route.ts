import { NextRequest, NextResponse } from "next/server";
import { isAdminTable } from "@/lib/admin/resources";
import { listResource, mutateResource } from "@/lib/admin/crud";
import { superadminFromRequest } from "@/lib/auth/session";

const NO_CREATE = new Set(["payment_logs", "notification_logs"]);

async function guard(req: NextRequest) {
  const session = await superadminFromRequest(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return null;
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
  const result = await listResource(resource, page, limit, q);
  return NextResponse.json(result);
}

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ resource: string }> },
) {
  const denied = await guard(req);
  if (denied) return denied;
  const { resource } = await ctx.params;
  if (!isAdminTable(resource)) return NextResponse.json({ error: "Unknown" }, { status: 404 });
  if (NO_CREATE.has(resource)) return NextResponse.json({ error: "Log tidak dibuat manual" }, { status: 405 });
  try {
    const body = await req.json();
    const row = await mutateResource(resource, "insert", body);
    return NextResponse.json({ data: row });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Gagal" }, { status: 400 });
  }
}
