import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { getPesertaSession } from "@/lib/auth/session";
import { rememberPdf } from "@/lib/db/portal";
import { getReportDocument } from "@/lib/db/report";
import { buildLegacyReportPdf } from "@/lib/pdf/report-legacy";
import { buildReportPdf } from "@/lib/pdf/report";
import { sendsNewPdf } from "@/lib/pdf/version";

export async function GET(req: Request, context: { params: Promise<{ sessionId: string }> }) {
  const session = await getPesertaSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { sessionId } = await context.params;
  const origin = new URL(req.url).origin;
  const report = await getReportDocument(session.id, sessionId, { origin });
  if (!report) return NextResponse.json({ error: "Laporan tidak ditemukan" }, { status: 404 });
  if (!sendsNewPdf(report.pdfVersion)) {
    const legacy = buildLegacyReportPdf(report);
    return new NextResponse(new Uint8Array(legacy), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="laporan-${sessionId}.pdf"`,
        "Cache-Control": "private, no-store",
      },
    });
  }
  const pdf = await buildReportPdf(report);
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      const stored = await put(`laporan/${sessionId}.pdf`, pdf, {
        access: "public",
        contentType: "application/pdf",
        addRandomSuffix: false,
        allowOverwrite: true,
      });
      try {
        await rememberPdf(sessionId, stored.url);
      } catch (error) {
        console.error("[pdf blob remember]", error);
      }
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
