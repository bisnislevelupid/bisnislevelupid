import { existsSync } from "node:fs";
import path from "node:path";
import PDFDocument from "pdfkit";
import { buildReportCtas } from "@/lib/portal/ctas";
import { formatWib, statusLabel } from "@/lib/portal/labels";
import { customerGuidance } from "@/lib/pdf/guidance";
import { buildActionPlan } from "@/lib/pdf/plan";
import { KEY_NA_NOTE, crisisGateLabel, formatAuditScore, formatPercent, isRiskSection, riskAreaNote, scoreBasisLine } from "@/lib/pdf/format";
import type { ReportDocument, ReportGap, ReportSection } from "@/lib/pdf/types";

type Doc = PDFKit.PDFDocument;

const INK = "#0f172a";
const MUTED = "#475569";
const BRAND = "#064e3b";
const LINE = "#e2e8f0";

function fonts() {
  const dir = path.join(process.cwd(), "assets/fonts");
  const regular = path.join(dir, "DejaVuSans.ttf");
  const bold = path.join(dir, "DejaVuSans-Bold.ttf");
  if (!existsSync(regular) || !existsSync(bold)) throw new Error("Font laporan tidak ditemukan di assets/fonts");
  return { regular, bold };
}

function pdfTitle(title: string) {
  return title.replace(/\p{Extended_Pictographic}/gu, "").replace(/\s+/g, " ").trim();
}

function width(doc: Doc) {
  return doc.page.width - doc.page.margins.left - doc.page.margins.right;
}

function need(doc: Doc, height: number) {
  if (doc.y + height > doc.page.height - doc.page.margins.bottom) doc.addPage();
}

function gap(doc: Doc, amount = 10) {
  doc.y += amount;
}

function h1(doc: Doc, text: string) {
  need(doc, 36);
  doc.font("Bold").fontSize(18).fillColor(BRAND).text(text, { width: width(doc) });
  gap(doc, 6);
}

function h2(doc: Doc, text: string) {
  need(doc, 28);
  doc.font("Bold").fontSize(13).fillColor(INK).text(text, { width: width(doc) });
  gap(doc, 4);
}

function para(doc: Doc, text: string, size = 10.5) {
  const body = text.trim();
  if (!body) return;
  doc.font("Body").fontSize(size).fillColor(INK).text(body, { width: width(doc), lineGap: 2 });
  gap(doc, 8);
}

function bullet(doc: Doc, text: string) {
  const x = doc.page.margins.left;
  need(doc, 18);
  const y = doc.y;
  doc.font("Body").fontSize(10.5).fillColor(BRAND).text("·", x, y, { width: 12, lineBreak: false });
  doc.fillColor(INK).text(text, x + 14, y, { width: width(doc) - 14, lineGap: 1 });
  gap(doc, 3);
}

function callout(doc: Doc, title: string, body: string, accent = BRAND) {
  const x = doc.page.margins.left;
  const w = width(doc);
  doc.font("Body").fontSize(10.5);
  const bodyHeight = doc.heightOfString(body, { width: w - 24 });
  const box = bodyHeight + 36;
  need(doc, box + 8);
  const y = doc.y;
  doc.save();
  doc.roundedRect(x, y, w, box, 8).fill("#f8fafc");
  doc.rect(x, y, 4, box).fill(accent);
  doc.restore();
  doc.font("Bold").fontSize(9).fillColor(accent).text(title, x + 14, y + 8, { width: w - 28 });
  doc.font("Body").fontSize(10.5).fillColor(INK).text(body, x + 14, y + 24, { width: w - 28, lineGap: 2 });
  doc.y = y + box + 10;
}

function bar(doc: Doc, label: string, text: string, ratio: number | null, color: string, note: string) {
  const x = doc.page.margins.left;
  const w = width(doc);
  need(doc, 46);
  const y = doc.y;
  doc.font("Bold").fontSize(10).fillColor(INK).text(label, x, y, { width: w - 90 });
  doc.font("Bold").fontSize(10).fillColor(color).text(text, x + w - 88, y, { width: 88, align: "right" });
  const barY = y + 16;
  doc.save();
  doc.roundedRect(x, barY, w, 8, 4).fill(LINE);
  if (ratio !== null && ratio > 0) {
    doc.roundedRect(x, barY, Math.max(4, Math.min(1, ratio) * w), 8, 4).fill(color);
  }
  doc.restore();
  doc.font("Body").fontSize(9).fillColor(MUTED).text(note, x, barY + 12, { width: w });
  gap(doc, 6);
}

function substitute(section: ReportSection) {
  return [section.measures, section.concepts, section.framework].filter(Boolean).join(" ");
}

function paintGap(doc: Doc, item: ReportGap, section: ReportSection) {
  h2(doc, `${item.isKey ? "Butir kunci" : "Butir"} #${item.number}`);
  para(doc, item.text);
  const guidance = customerGuidance(item.guidance);
  if (guidance) para(doc, `Panduan instrumen: ${guidance}`);
  else para(doc, `Narasi seksi ${section.code} ${section.name}: ${substitute(section) || section.gapReading || "Gunakan kerangka seksi ini sebagai pengganti panduan butir."}`);
  if (item.why) para(doc, item.why);
  if (item.risk) para(doc, `Risiko bila tetap Tidak: ${item.risk}`);
  for (const step of item.steps) bullet(doc, step);
  if (item.education) para(doc, item.education, 10);
}

function paint(doc: Doc, report: ReportDocument) {
  const label = statusLabel(report.status);
  const x = doc.page.margins.left;
  const w = width(doc);
  doc.save();
  doc.rect(0, 0, doc.page.width, 168).fill(BRAND);
  doc.restore();
  doc.fillColor("#a7f3d0").font("Bold").fontSize(11).text("BISNISLEVELUP.ID", x, 36, { width: w });
  doc.fillColor("#ffffff").font("Bold").fontSize(22).text("Laporan diagnosis fase bisnis", x, 58, { width: w });
  doc.font("Body").fontSize(11).fillColor("#ecfdf5").text(`${report.fromPhase} → ${report.toPhase}`, x, 96, { width: w });
  doc.font("Body").fontSize(10).text(report.auditName, x, 116, { width: w });
  doc.y = 188;
  doc.font("Bold").fontSize(16).fillColor(INK).text(report.company || report.respondent || "Peserta", { width: w });
  para(doc, [report.respondent, report.businessField, report.startYear ? `Mulai ${report.startYear}` : null, report.externalAuditor ? `Penilai: ${report.externalAuditor}` : null].filter(Boolean).join(" · ") || "Identitas peserta tertera di akun.");
  para(doc, `Selesai ${formatWib(report.completedAt) || "—"} · Sesi ${report.sessionId}`);
  callout(doc, pdfTitle(label.title), `${label.meaning} Nada: ${label.tone}.`, label.color);
  const scoreText = formatAuditScore(report.score, report.status);
  h2(doc, "Skor butir biasa");
  para(doc, scoreText);
  para(doc, scoreBasisLine(report));
  const gate = crisisGateLabel({ status: report.status, phaseNumber: report.fromPhaseNumber, crisisTitle: report.crisis });
  if (gate) para(doc, gate);

  doc.addPage();
  h1(doc, "Bab 1. Ringkasan");
  para(doc, label.meaning);
  if (report.narrative) {
    h2(doc, report.narrative.headline);
    para(doc, report.narrative.summary);
    para(doc, report.narrative.implication);
    para(doc, report.narrative.focus);
  }
  para(
    doc,
    "Cara membaca skor: butir bintang harus Ya pada semua yang dinilai. Butir bintang yang dijawab Tidak Berlaku tidak menggagalkan gerbang. Skor adalah persentase Ya pada butir biasa yang dinilai; Tidak Berlaku keluar dari pembilang dan penyebut. Ambang 80 persen tidak dibulatkan. Urutan status: dalam bahaya, gerbang belum terbuka, siap naik fase, hampir (60 persen sampai di bawah 80 persen), perlu fondasi (semua bintang Ya dan butir biasa di bawah 60 persen). Tidak dapat dinilai hanya muncul bila tidak ada butir biasa yang bisa dihitung.",
  );
  if (gate) para(doc, gate);
  if (report.gateDesc) para(doc, `Gerbang transisi: ${report.gateDesc}`);

  h1(doc, "Bab 2. Skor per seksi");
  for (const section of report.sections) {
    const ratio = section.score === null ? null : Math.max(0, Math.min(100, section.score)) / 100;
    const color = section.score === null ? "#94a3b8" : section.score >= 80 ? "#059669" : section.score >= 60 ? "#d97706" : "#dc2626";
    const text = section.score === null ? "—" : formatPercent(section.score);
    const keyNote = section.keyTotal === 0 ? "tidak ada butir kunci" : section.keyPass ? "kunci lulus" : `kunci gagal (${section.keyTidak})`;
    const risk = isRiskSection(section.score) ? " Area risiko." : "";
    const note = section.score === null ? "Tidak ada butir biasa yang dinilai di seksi ini. Bukan nol persen." : `${keyNote}. Tidak: ${section.tidak}.${risk}`;
    bar(doc, `${section.code}. ${section.name}`, text, ratio, color, note);
  }

  if (report.triad) {
    h1(doc, "Indikator siap: sistem, kas, orang");
    para(doc, "Di audit fase 3 ke 4, tiga kelompok ini adalah keterangan tambahan. Status tetap mengikuti gerbang bintang dan skor butir biasa.");
    for (const group of report.triad) {
      bar(
        doc,
        group.label,
        group.ready ? "Gerbang kelompok lulus" : "Gerbang kelompok belum",
        group.scorePct === null ? null : group.scorePct / 100,
        group.ready ? "#059669" : "#dc2626",
        group.scorePct === null ? "Skor pendukung tidak dinilai." : `Skor pendukung ${formatPercent(group.scorePct)}.`,
      );
    }
  }
  if (report.agBlock) {
    h1(doc, "Lean Again dan identitas berjalan bersama");
    para(doc, report.agBlock.warning ? "Salah satu lulus dan yang lain belum. Keduanya harus berjalan bersamaan sebelum ekspansi." : report.agBlock.ready ? "Bagian A dan G sama-sama lulus pada butir kunci yang dinilai." : "Bagian A dan G belum sama-sama lulus.");
    for (const group of [report.agBlock.a, report.agBlock.g]) {
      bar(doc, group.label, group.ready ? "Lulus" : "Belum", group.scorePct === null ? null : group.scorePct / 100, group.ready ? "#059669" : "#dc2626", group.scorePct === null ? "Skor pendukung tidak dinilai." : `Skor pendukung ${formatPercent(group.scorePct)}.`);
    }
  }

  if (report.skippedKeys.length) {
    h1(doc, "Butir kunci yang dilewati");
    para(doc, "Butir ini tetap dihitung lulus gerbang. Satu jawaban Tidak Berlaku pada butir bintang tidak menahan kenaikan fase.");
    for (const item of report.skippedKeys) {
      h2(doc, `#${item.number} · ${item.sectionName}`);
      para(doc, item.text);
      callout(doc, "Tidak Berlaku", KEY_NA_NOTE, "#475569");
    }
  }

  const keyGaps = report.sections.flatMap((section) => section.gaps.filter((gapItem) => gapItem.isKey).map((gapItem) => ({ gapItem, section })));
  h1(doc, keyGaps.length ? "Bab 3. Butir kunci yang masih Tidak" : "Bab 3. Butir kunci yang sudah terbuka");
  if (!keyGaps.length) para(doc, "Tidak ada butir kunci yang dijawab Tidak. Gerbang tidak tertahan oleh bintang. Yang perlu dijaga adalah bukti, bukan ingatan owner.");
  for (const item of keyGaps) paintGap(doc, item.gapItem, item.section);

  const risks = report.sections.filter((section) => isRiskSection(section.score));
  doc.addPage();
  h1(doc, "Bab 4. Area risiko");
  if (!risks.length) {
    para(doc, "Tidak ada seksi dengan skor butir biasa di bawah 50%. Seksi yang tidak dinilai tidak dihitung sebagai area risiko.");
  } else {
    para(doc, riskAreaNote(report.status));
    for (const section of risks) {
      h2(doc, `Area risiko · Seksi ${section.code}. ${section.name}`);
      para(doc, `Skor butir biasa ${formatPercent(section.score ?? 0)}. ${section.gapReading || "Tutup butir Tidak di seksi ini sebelum fase berikutnya menambah beban."}`);
    }
  }

  for (const section of report.sections) {
    doc.addPage();
    h1(doc, `Seksi ${section.code}. ${section.name}`);
    if (isRiskSection(section.score)) callout(doc, "Area risiko", riskAreaNote(report.status), "#dc2626");
    const ratio = section.score === null ? null : section.score / 100;
    const color = section.score === null ? "#94a3b8" : section.score >= 80 ? "#059669" : section.score >= 60 ? "#d97706" : "#dc2626";
    bar(doc, "Skor butir biasa", section.score === null ? "—" : formatPercent(section.score), ratio, color, section.keyPass ? "Gerbang kunci seksi ini lulus." : "Ada butir kunci Tidak di seksi ini.");
    if (section.description) para(doc, section.description);
    if (section.measures) {
      h2(doc, "Apa yang diukur");
      para(doc, section.measures);
    }
    if (section.whyItMatters) para(doc, section.whyItMatters);
    if (section.concepts) {
      h2(doc, "Kerangka dan konsep");
      para(doc, section.concepts);
    }
    if (section.framework) para(doc, section.framework);
    if (section.commonMistakes) {
      h2(doc, "Kesalahan yang sering terjadi");
      para(doc, section.commonMistakes);
    }
    h2(doc, "Yang sudah jalan");
    para(doc, section.strengths.length ? section.strengthReading || "Butir berikut dijawab Ya." : section.strengthReading || "Belum ada butir Ya yang bisa disebut kekuatan di seksi ini.");
    for (const item of section.strengths.slice(0, 6)) bullet(doc, `${item.isKey ? "Kunci · " : ""}#${item.number} ${item.text}`);
    h2(doc, "Celah");
    const plainGaps = section.gaps.filter((item) => !item.isKey);
    if (!plainGaps.length) para(doc, section.gapReading || "Tidak ada butir Tidak di seksi ini.");
    else para(doc, section.gapReading || "Butir Tidak di bawah ini yang perlu ditutup lebih dulu.");
    const full = plainGaps.slice(0, 4);
    const rest = plainGaps.slice(4);
    for (const item of full) paintGap(doc, item, section);
    for (const item of rest) bullet(doc, `#${item.number} ${item.text}`);
  }

  doc.addPage();
  h1(doc, "Rencana 30, 60, dan 90 hari");
  const plan = buildActionPlan(report);
  h2(doc, "30 hari");
  for (const line of plan.d30) bullet(doc, line);
  h2(doc, "60 hari");
  for (const line of plan.d60) bullet(doc, line);
  h2(doc, "90 hari");
  for (const line of plan.d90) bullet(doc, line);

  h1(doc, "Rekomendasi yang terpicu");
  if (!report.recommendations.length) para(doc, "Belum ada rekomendasi yang terpicu dari jawaban Tidak. Gunakan narasi seksi dan rencana 90 hari sebagai urutan kerja.");
  for (const item of report.recommendations) {
    h2(doc, `${item.critical ? "Prioritas kritis · " : ""}${item.type} · ${item.title}`);
    if (item.author) para(doc, item.author);
    if (item.description) para(doc, item.description);
    if (item.url) para(doc, item.url);
  }
  if (report.status !== "TIDAK_DAPAT_DINILAI" && report.upsells.length) {
    h1(doc, "Langkah belajar berikutnya");
    for (const item of report.upsells) {
      h2(doc, item.name);
      if (item.summary) para(doc, item.summary);
      if (item.modules) para(doc, item.modules);
      para(doc, item.ctaLabel ? `${item.ctaLabel}: ${item.href}` : item.href);
    }
  }

  const ctas = buildReportCtas({ status: report.status, auditCode: report.auditCode, origin: report.origin, whatsapp: report.whatsapp });
  if (ctas.items.length) {
    h1(doc, "Ajakan bertindak");
    for (const item of ctas.items) {
      h2(doc, item.label);
      para(doc, item.detail);
      para(doc, item.href);
    }
  }

  h1(doc, "Penutup");
  if (report.closing) {
    para(doc, report.closing.closingText);
    h2(doc, report.closing.nextPhaseTitle);
    para(doc, report.closing.nextPhasePreview);
    para(doc, report.closing.prepareText);
  } else if (report.nextPhaseDescription) para(doc, report.nextPhaseDescription);
  para(doc, "Narasi edukasi pada laporan ini berstatus draf di basis data dan tetap ditampilkan agar peserta mendapat saran yang utuh. Owner dapat meninjau teks sebelum statusnya diubah menjadi final.");
  para(doc, "Laporan ini adalah diagnosis operasional BisnisLevelUp.id, bukan nasihat hukum, pajak, ketenagakerjaan, atau keuangan. Angka dan dasar aturan yang disebut di instrumen perlu dikonfirmasi ke konsultan yang berwenang, karena ketentuan dapat berubah.");
  para(doc, `BisnisLevelUp.id · sesi ${report.sessionId} · ${formatWib(report.completedAt) || "—"}`);
}

export function buildReportPdf(report: ReportDocument, options?: { compress?: boolean }) {
  const face = fonts();
  return new Promise<Buffer>((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      compress: options?.compress !== false,
      bufferPages: true,
      margins: { top: 56, bottom: 52, left: 48, right: 48 },
      info: {
        Title: `Laporan ${report.auditName}`,
        Author: "BisnisLevelUp.id",
        Subject: "Diagnosis fase bisnis",
      },
    });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("error", reject);
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.registerFont("Body", face.regular);
    doc.registerFont("Bold", face.bold);
    paint(doc, report);
    const range = doc.bufferedPageRange();
    for (let index = 0; index < range.count; index += 1) {
      doc.switchToPage(range.start + index);
      doc.font("Body").fontSize(8).fillColor(MUTED);
      const y = doc.page.height - 32;
      doc.text("BisnisLevelUp.id · Laporan diagnosis", 48, y, { width: 320, height: 12, lineBreak: false });
      doc.text(`${index + 1} / ${range.count}`, 400, y, { width: 147, height: 12, align: "right", lineBreak: false });
    }
    doc.end();
  });
}
