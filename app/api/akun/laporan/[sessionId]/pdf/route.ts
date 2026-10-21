import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { getPesertaSession } from "@/lib/auth/session";
import { getReport, rememberPdf } from "@/lib/db/portal";
import { buildReportPdf } from "@/lib/pdf/report";

export async function GET(_req: Request, context: { params: Promise<{ sessionId: string }> }) {
  const session = await getPesertaSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { sessionId } = await context.params;
  const report = await getReport(session.id, sessionId);
  if (!report) return NextResponse.json({ error: "Laporan tidak ditemukan" }, { status: 404 });
  const pdf = buildReportPdf(report);
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      const stored = await put(`laporan/${sessionId}.pdf`, pdf, {
        access: "public",
        contentType: "application/pdf",
        addRandomSuffix: false,
        allowOverwrite: true,
      });
      await rememberPdf(sessionId, stored.url);
    } catch (error) {
      console.error("[pdf blob]", error);
    }
  }
  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="laporan-${sessionId}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
