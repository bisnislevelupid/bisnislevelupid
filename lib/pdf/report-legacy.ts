import type { ReportDocument, ReportSection } from "@/lib/pdf/types";

function escapePdf(value: string) {
  return value.replace(/[^\x20-\x7E]/g, " ").replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function wrap(value: string, width = 90) {
  const words = value.replace(/[^\x20-\x7E]/g, " ").split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    if ((line + " " + word).trim().length > width) {
      if (line) lines.push(line);
      line = word;
    } else {
      line = (line + " " + word).trim();
    }
  }
  if (line) lines.push(line);
  return lines.length ? lines : [""];
}

function sectionScore(section: ReportSection) {
  return section.score === null ? "tidak dinilai" : `${section.score}%`;
}

/** PDF teks production sebelum laporan bermerek. Dipakai hanya untuk hasil pdf_version < 2. */
export function buildLegacyReportPdf(report: ReportDocument) {
  const scoreLine = report.score === null ? "Skor: Tidak dapat dinilai" : `Skor: ${report.score}%`;
  const gaps = report.sections.flatMap((section) => section.gaps);
  const lines = [
    "BisnisLevelUp.id",
    "Laporan Diagnosis Bisnis",
    `${report.respondent ?? "-"} · ${report.company ?? "-"}`,
    `${report.auditName}`,
    "",
    `Fase: ${report.fromPhase} -> ${report.toPhase}`,
    `Status: ${report.status}`,
    scoreLine,
    `Butir kunci Tidak: ${report.keyTidak} dari ${report.keyTotal}`,
    report.crisis ? `Krisis: ${report.crisis}` : "",
    "",
    "Skor per seksi",
    ...report.sections.flatMap((section) => [
      `${section.code} ${section.name}: ${sectionScore(section)} · kunci ${section.keyPass ? "lulus" : "gagal"}`,
    ]),
    "",
    "Gap (jawaban Tidak)",
    ...(gaps.length
      ? gaps.flatMap((gap) => wrap(`${gap.isKey ? "[KUNCI] " : ""}#${gap.number} ${gap.sectionName}: ${gap.text}`))
      : ["Tidak ada butir Tidak."]),
    "",
    "Rekomendasi",
    ...(report.recommendations.length
      ? report.recommendations.flatMap((item) =>
          wrap(`${item.critical ? "[PRIORITAS KRITIS] " : ""}[${item.type}] ${item.title}. ${item.description ?? ""}`),
        )
      : ["Belum ada rekomendasi yang terpicu."]),
    "",
    "Langkah berikutnya",
    "30 hari: tutup butir kunci yang masih Tidak dan catat pemilik tiap proses.",
    "60 hari: naikkan seksi dengan skor di bawah 80 sampai ambang lulus.",
    "90 hari: ulangi audit yang sama setelah fondasi tertutup.",
    report.nextPhaseDescription ? `Fase berikutnya: ${report.nextPhaseDescription}` : "",
    "",
    "Disclaimer: laporan ini adalah diagnosis operasional, bukan nasihat hukum, pajak, atau keuangan.",
    `Sesi ${report.sessionId} · BisnisLevelUp.id`,
  ];

  const pages: string[][] = [];
  for (let index = 0; index < lines.length; index += 42) pages.push(lines.slice(index, index + 42));
  const objects: string[] = [];
  objects.push("1 0 obj<< /Type /Catalog /Pages 2 0 R >>endobj\n");
  let id = 3;
  const pageIds: number[] = [];
  for (const page of pages) {
    const contentId = id + 1;
    pageIds.push(id);
    const commands = page
      .map((line, index) => `BT /F1 11 Tf 48 ${780 - index * 16} Td (${escapePdf(line).slice(0, 110)}) Tj ET`)
      .join("\n");
    objects.push(
      `${id} 0 obj<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents ${contentId} 0 R /Resources << /Font << /F1 ${id + 2} 0 R >> >> >>endobj\n`,
    );
    objects.push(`${contentId} 0 obj<< /Length ${commands.length} >>stream\n${commands}\nendstream\nendobj\n`);
    objects.push(`${id + 2} 0 obj<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>endobj\n`);
    id += 3;
  }
  const kids = pageIds.map((pageId) => `${pageId} 0 R`);
  objects.splice(1, 0, `2 0 obj<< /Type /Pages /Count ${pages.length} /Kids [${kids.join(" ")}] >>endobj\n`);
  let body = "%PDF-1.4\n";
  const offsets = [0];
  for (const object of objects) {
    offsets.push(body.length);
    body += object;
  }
  const xref = body.length;
  body += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const offset of offsets.slice(1)) body += `${String(offset).padStart(10, "0")} 00000 n \n`;
  body += `trailer<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return Buffer.from(body, "latin1");
}
