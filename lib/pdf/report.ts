import { existsSync } from "node:fs";
import path from "node:path";
import PDFDocument from "pdfkit";
import { buildReportCtas } from "@/lib/portal/ctas";
import { foundationFor } from "@/lib/portal/foundations";
import { formatWib, rupiah, statusLabel } from "@/lib/portal/labels";
import { customerGuidance } from "@/lib/pdf/guidance";
import { buildActionPlan } from "@/lib/pdf/plan";
import {
  KEY_NA_NOTE,
  crisisGateLabel,
  formatAuditScore,
  formatPercent,
  isRiskSection,
  riskAreaNote,
  sapaanOrAnda,
  scoreBasisLine,
} from "@/lib/pdf/format";
import type { ReportDocument, ReportGap, ReportSection } from "@/lib/pdf/types";

type Doc = PDFKit.PDFDocument;

const INK = "#0f172a";
const SLATE = "#334155";
const MUTED = "#475569";
const SUBTLE = "#64748b";
const LINE = "#e2e8f0";
const MINT = "#ecfdf5";
const MINT_LINE = "#a7f3d0";
const PAPER = "#f8fafc";
const WHITE = "#ffffff";
const EMERALD = "#059669";
const EMERALD_LIGHT = "#10b981";
const EMERALD_TEXT = "#047857";
const FOREST = "#064e3b";
const DANGER = "#ef4444";
const DANGER_TEXT = "#b91c1c";
const AMBER = "#f59e0b";
const AMBER_TEXT = "#b45309";
const RISK_BG = "#fef2f2";
const GRAY = "#94a3b8";

/** Warna fase dari spec laporan (chip + label, bukan latar halaman). */
const PHASE_SPEC: Record<number, { name: string; fill: string; ink: string }> = {
  1: { name: "Survival", fill: "#EF4444", ink: "#ffffff" },
  2: { name: "Cash Growth", fill: "#F97316", ink: "#ffffff" },
  3: { name: "Systemize", fill: "#EAB308", ink: "#0f172a" },
  4: { name: "Talent Building", fill: "#3B82F6", ink: "#ffffff" },
  5: { name: "Expansion", fill: "#8B5CF6", ink: "#ffffff" },
};

/** Harga dari products di drizzle/seed.sql. Di PDF selalu berlabel SIMULASI. */
const SIMULASI_PRODUCTS = [
  {
    code: "audit-satu-fase",
    name: "Audit Satu Fase",
    detail: "Satu instrumen audit plus laporan PDF.",
    price: 197000,
    path: "/checkout?product=audit-satu-fase",
  },
  {
    code: "audit-lengkap",
    name: "Audit Lengkap (4 Instrumen)",
    detail: "Semua 4 instrumen plus laporan komprehensif.",
    price: 597000,
    path: "/checkout?product=audit-lengkap",
  },
  {
    code: "audit-coaching",
    name: "Audit + Coaching",
    detail: "Audit lengkap plus 1 sesi coaching.",
    price: 1997000,
    path: "/checkout?product=audit-coaching",
  },
] as const;

function greeting(report: ReportDocument) {
  return `Halo ${sapaanOrAnda(report.salutation)},`;
}

function coachName(report: ReportDocument) {
  const raw = report.coach?.name?.trim() || "Riza Zacharias";
  if (report.status === "TIDAK_DAPAT_DINILAI") return raw.replace(/^SIMULASI\s+/i, "") || "Riza Zacharias";
  return raw;
}

function coachRole(report: ReportDocument) {
  return report.coach?.roleLine?.trim() || "Owner Syaamil Group";
}

function coachBio(report: ReportDocument) {
  return report.coach?.bio?.trim() || "30+ tahun di dunia bisnis. 5 Fase Bisnis, 4 instrumen audit. Audit Bisnis. Temukan Fasemu. Naik Level.";
}

function pricedOffers(report: ReportDocument) {
  const origin = report.origin.replace(/\/$/, "");
  const seeded = report.upsells.filter((item) => /\bSIMULASI\b/i.test(item.name) && item.price > 0);
  if (seeded.length) {
    return seeded.map((item) => ({
      name: item.name,
      detail: item.summary || "Produk simulasi. Bukan penawaran mengikat.",
      priceLine: `Harga SIMULASI ${rupiah(item.price)}`,
      url: item.href,
      button: item.ctaLabel || "Buka halaman",
    }));
  }
  return SIMULASI_PRODUCTS.map((product) => ({
    name: product.name,
    detail: product.detail,
    priceLine: `Harga SIMULASI ${rupiah(product.price)}`,
    url: `${origin}${product.path}`,
    button: "Buka halaman",
  }));
}

type Canvas = {
  doc: Doc;
  chapter: string;
  chapters: string[];
  page: number;
};

function fonts() {
  // symbols.ttf is a DejaVu subset for → and ★. Albert Sans and Cabin do not include those glyphs.
  const dir = path.join(process.cwd(), "assets/fonts");
  const files = {
    heading: path.join(dir, "AlbertSans-ExtraBold.ttf"),
    label: path.join(dir, "AlbertSans-Bold.ttf"),
    body: path.join(dir, "Cabin-Regular.ttf"),
    bodyBold: path.join(dir, "Cabin-Bold.ttf"),
    symbol: path.join(dir, "symbols.ttf"),
  };
  for (const file of Object.values(files)) {
    if (!existsSync(file)) throw new Error("Font laporan tidak ditemukan di assets/fonts");
  }
  return files;
}

function photoFile() {
  const file = path.join(process.cwd(), "public/brand/riza-zacharias.jpg");
  return existsSync(file) ? file : null;
}

function pdfTitle(title: string) {
  return title.replace(/\p{Extended_Pictographic}/gu, "").replace(/\s+/g, " ").trim();
}

function mix(from: string, to: string, t: number) {
  const channel = (hex: string) => [1, 3, 5].map((index) => Number.parseInt(hex.slice(index, index + 2), 16));
  const start = channel(from);
  const end = channel(to);
  return `#${start
    .map((value, index) => Math.round(value + (end[index] - value) * t).toString(16).padStart(2, "0"))
    .join("")}`;
}

function contentWidth(doc: Doc) {
  return doc.page.width - doc.page.margins.left - doc.page.margins.right;
}

function remember(canvas: Canvas) {
  if (!canvas.chapters[canvas.page]) canvas.chapters[canvas.page] = canvas.chapter;
}

function ensure(canvas: Canvas, height: number) {
  const doc = canvas.doc;
  if (doc.y + height <= doc.page.height - doc.page.margins.bottom) return;
  doc.addPage();
  canvas.page += 1;
  canvas.chapters[canvas.page] = canvas.chapter;
}

function gap(doc: Doc, amount = 8) {
  doc.y += amount;
}

function write(
  doc: Doc,
  value: string,
  x: number,
  y: number,
  options: PDFKit.Mixins.TextOptions & { fontName?: string; color?: string; size?: number },
) {
  const fontName = options.fontName ?? "Body";
  const color = options.color ?? INK;
  const size = options.size ?? 10.5;
  const kit: PDFKit.Mixins.TextOptions = {
    width: options.width,
    height: options.height,
    lineGap: options.lineGap,
    lineBreak: options.lineBreak,
    align: options.align,
    ellipsis: options.ellipsis,
    characterSpacing: options.characterSpacing,
    link: options.link,
  };
  const parts = value.split(/(→|★)/).filter((part) => part.length > 0);
  parts.forEach((part, index) => {
    const symbol = part === "→" || part === "★";
    doc.font(symbol ? "Symbol" : fontName).fontSize(size).fillColor(color);
    const next = { ...kit, continued: index < parts.length - 1 };
    if (index === 0) doc.text(part, x, y, next);
    else doc.text(part, next);
  });
}

function h1(canvas: Canvas, text: string) {
  const doc = canvas.doc;
  canvas.chapter = text;
  ensure(canvas, 36);
  remember(canvas);
  write(doc, text, doc.page.margins.left, doc.y, { fontName: "Heading", size: 16, color: FOREST, width: contentWidth(doc) });
  gap(doc, 3);
  doc.save();
  doc.moveTo(doc.page.margins.left, doc.y).lineTo(doc.page.margins.left + 64, doc.y).lineWidth(2.5).strokeColor(EMERALD).stroke();
  doc.restore();
  gap(doc, 8);
}

function h2(canvas: Canvas, text: string) {
  const doc = canvas.doc;
  ensure(canvas, 22);
  write(doc, text, doc.page.margins.left, doc.y, { fontName: "Label", size: 12, color: INK, width: contentWidth(doc) });
  gap(doc, 3);
}

function para(canvas: Canvas, text: string, size = 10.5) {
  const body = text.trim();
  if (!body) return;
  const doc = canvas.doc;
  doc.font("Body").fontSize(size);
  const height = doc.heightOfString(body, { width: contentWidth(doc), lineGap: 2 });
  ensure(canvas, height + 6);
  write(doc, body, doc.page.margins.left, doc.y, { fontName: "Body", size, color: SLATE, width: contentWidth(doc), lineGap: 2 });
  gap(doc, 8);
}

function bullet(canvas: Canvas, text: string) {
  const doc = canvas.doc;
  const x = doc.page.margins.left;
  doc.font("Body").fontSize(10.5);
  const height = doc.heightOfString(text, { width: contentWidth(doc) - 16, lineGap: 1 });
  ensure(canvas, height + 4);
  const y = doc.y;
  doc.fillColor(EMERALD).circle(x + 3, y + 5, 2.1).fill();
  write(doc, text, x + 14, y, { fontName: "Body", size: 10.5, color: SLATE, width: contentWidth(doc) - 14, lineGap: 1 });
  gap(doc, 3);
}

function freshPage(canvas: Canvas, title: string) {
  canvas.chapter = title;
  canvas.doc.addPage();
  canvas.page += 1;
  canvas.chapters[canvas.page] = title;
}

function toneFor(score: number | null) {
  if (score === null) return { color: GRAY, label: "Tidak dinilai", hatch: false, text: MUTED };
  if (score < 50) return { color: DANGER, label: "Area risiko", hatch: true, text: DANGER_TEXT };
  if (score < 80) return { color: AMBER, label: "Penguatan", hatch: false, text: AMBER_TEXT };
  return { color: EMERALD_LIGHT, label: "Lulus ambang", hatch: false, text: EMERALD_TEXT };
}

function hatch(doc: Doc, x: number, y: number, w: number, h: number) {
  doc.save();
  doc.rect(x, y, w, h).clip();
  doc.lineWidth(0.6).strokeColor(WHITE);
  for (let offset = -h; offset < w; offset += 3) {
    doc.moveTo(x + offset, y + h).lineTo(x + offset + h, y).stroke();
  }
  doc.restore();
}

function drawMark(doc: Doc, x: number, y: number, size: number, onDark: boolean) {
  doc.save();
  doc.roundedRect(x, y, size, size, size * 0.28).fill(onDark ? FOREST : EMERALD);
  const pad = size * 0.22;
  const scale = (size - pad * 2) / 24;
  const ox = x + pad;
  const oy = y + pad;
  doc.lineWidth(Math.max(1.2, size * 0.1)).lineCap("round").lineJoin("round").strokeColor(WHITE);
  const points: Array<[number, number]> = [
    [2, 17],
    [8.5, 10.5],
    [13.5, 15.5],
    [22, 7],
  ];
  doc.moveTo(ox + points[0][0] * scale, oy + points[0][1] * scale);
  for (const point of points.slice(1)) doc.lineTo(ox + point[0] * scale, oy + point[1] * scale);
  doc.stroke();
  doc.moveTo(ox + 16 * scale, oy + 7 * scale).lineTo(ox + 22 * scale, oy + 7 * scale).lineTo(ox + 22 * scale, oy + 13 * scale).stroke();
  doc.restore();
}

function drawWordmark(doc: Doc, x: number, y: number, size: number, onDark: boolean) {
  const spacing = -0.45;
  doc.font("Heading").fontSize(size).fillColor(onDark ? WHITE : INK);
  doc.text("Bisnis", x, y, { characterSpacing: spacing, lineBreak: false, continued: true, height: size + 6 });
  doc.fillColor(onDark ? "#d1fae5" : EMERALD);
  doc.text("LevelUp", { characterSpacing: spacing, lineBreak: false, continued: true, height: size + 6 });
  doc.font("Label").fontSize(size * 0.75).fillColor(onDark ? "#ecfdf5" : SUBTLE);
  doc.text(".id", { lineBreak: false, height: size + 6 });
}

function drawAvatar(doc: Doc, cx: number, cy: number, radius: number) {
  const file = photoFile();
  doc.save();
  doc.circle(cx, cy, radius).clip();
  if (file) doc.image(file, cx - radius, cy - radius, { width: radius * 2, height: radius * 2 });
  else {
    doc.rect(cx - radius, cy - radius, radius * 2, radius * 2).fill(MINT);
    doc.fillColor(EMERALD).font("Heading").fontSize(radius * 0.7);
    doc.text("RZ", cx - radius, cy - radius * 0.35, { width: radius * 2, align: "center", lineBreak: false });
  }
  doc.restore();
  doc.save();
  doc.lineWidth(3).strokeColor(WHITE).circle(cx, cy, radius - 1.2).stroke();
  doc.lineWidth(2.25).strokeColor(EMERALD_LIGHT).circle(cx, cy, radius + 2.4).stroke();
  doc.restore();
}

function paintGradient(doc: Doc) {
  const w = doc.page.width;
  const h = doc.page.height;
  const steps = 64;
  const slice = (w + h) / steps;
  doc.save();
  doc.rect(0, 0, w, h).clip();
  for (let index = 0; index < steps; index += 1) {
    const start = index * slice;
    const end = start + slice + 2;
    doc.fillColor(mix(EMERALD_LIGHT, EMERALD, index / (steps - 1)));
    doc.moveTo(start, 0).lineTo(end, 0).lineTo(end - h, h).lineTo(start - h, h).fill();
  }
  doc.restore();
}

function coverLine(doc: Doc, text: string, x: number, y: number, size: number, color: string, width: number, fontName = "Body") {
  write(doc, text, x, y, { fontName, size, color, width, height: size * 2.6, ellipsis: true });
}

function paintCover(doc: Doc, report: ReportDocument) {
  const label = statusLabel(report.status);
  const title = pdfTitle(label.title);
  paintGradient(doc);
  drawMark(doc, 40, 34, 34, true);
  drawWordmark(doc, 84, 40, 16, true);
  coverLine(doc, "AUDIT BISNIS", 40, 86, 9, "#d1fae5", 240, "Label");
  write(doc, "Laporan Audit Fase Bisnis", 40, 104, {
    fontName: "Heading",
    size: 26,
    color: WHITE,
    width: doc.page.width - 80,
    height: 68,
  });

  const phase = report.fromPhaseNumber ? PHASE_SPEC[report.fromPhaseNumber] : undefined;
  const chip = phase ? `Fase ${report.fromPhaseNumber} · ${phase.name}` : "Fase bisnis";
  doc.font("Label").fontSize(10);
  const chipWidth = Math.min(doc.widthOfString(chip) + 18, 280);
  doc.roundedRect(40, 178, chipWidth, 22, 11).fill(phase?.fill ?? FOREST);
  coverLine(doc, chip, 40, 183, 10, phase?.ink ?? WHITE, chipWidth, "Label");
  write(doc, `${report.fromPhase} → ${report.toPhase}`, 40, 208, {
    fontName: "Label",
    size: 12,
    color: WHITE,
    width: doc.page.width - 80,
    height: 18,
    lineBreak: false,
  });

  doc.font("Label").fontSize(11);
  const badgeWidth = Math.min(doc.widthOfString(title) + 22, 280);
  doc.roundedRect(40, 236, badgeWidth, 24, 12).fill(label.bg);
  coverLine(doc, title, 40, 241, 11, label.color, badgeWidth, "Label");

  const sheetY = 276;
  const sheetH = 368;
  const sheetW = doc.page.width - 56;
  doc.save();
  doc.roundedRect(28, sheetY, sheetW, sheetH, 16).fill(WHITE);
  doc.roundedRect(28, sheetY, sheetW, sheetH, 16).clip();
  doc.rect(28, sheetY, sheetW, 7).fill(EMERALD);
  doc.restore();

  drawAvatar(doc, 96, sheetY + 78, 46);
  coverLine(doc, "Coach dan penyusun metodologi", 156, sheetY + 28, 9, EMERALD_TEXT, 360, "Label");
  coverLine(doc, coachName(report), 156, sheetY + 44, 16, INK, 360, "Heading");
  coverLine(doc, coachRole(report), 156, sheetY + 68, 11, SLATE, 360, "BodyBold");
  coverLine(doc, "30+ tahun di dunia bisnis · 5 Fase Bisnis · 4 instrumen audit", 156, sheetY + 86, 10, MUTED, 360, "Body");

  const left = 48;
  const inner = doc.page.width - 96;
  doc.save();
  doc.moveTo(left, sheetY + 132).lineTo(left + inner, sheetY + 132).lineWidth(1).strokeColor(LINE).stroke();
  doc.restore();
  coverLine(doc, report.company || report.respondent || "Peserta", left, sheetY + 146, 18, INK, inner, "Heading");
  const meta = [report.respondent, report.businessField, report.startYear ? `Mulai ${report.startYear}` : null].filter(Boolean).join(" · ");
  coverLine(doc, meta || "Identitas peserta tertera di akun.", left, sheetY + 174, 11, SLATE, inner, "Body");
  coverLine(doc, `Selesai ${formatWib(report.completedAt) || "—"}`, left, sheetY + 194, 11, INK, inner, "Label");
  coverLine(doc, formatAuditScore(report.score, report.status), left, sheetY + 220, 22, toneFor(report.status === "TIDAK_DAPAT_DINILAI" ? null : report.score).text, inner, "Heading");
  coverLine(doc, scoreBasisLine(report), left, sheetY + 252, 11, SLATE, inner, "Body");
  const gate = crisisGateLabel({ status: report.status, phaseNumber: report.fromPhaseNumber, crisisTitle: report.crisis });
  if (gate) coverLine(doc, gate, left, sheetY + 272, 11, INK, inner, "BodyBold");
  coverLine(doc, "Audit Bisnis. Temukan Fasemu. Naik Level.", left, sheetY + 304, 10, EMERALD_TEXT, inner, "Label");
  coverLine(doc, report.auditName, left, sheetY + 322, 10, MUTED, inner, "Body");
  coverLine(doc, greeting(report), left, sheetY + 340, 12, INK, inner, "BodyBold");
}

function callout(canvas: Canvas, title: string, body: string, fill: string, accent: string, titleColor: string) {
  const doc = canvas.doc;
  const x = doc.page.margins.left;
  const w = contentWidth(doc);
  doc.font("Body").fontSize(10.5);
  const bodyHeight = doc.heightOfString(body, { width: w - 28, lineGap: 2 });
  const box = bodyHeight + 36;
  ensure(canvas, box + 8);
  const y = doc.y;
  doc.save();
  doc.roundedRect(x, y, w, box, 10).fill(fill);
  doc.rect(x, y, 5, box).fill(accent);
  doc.restore();
  write(doc, title, x + 16, y + 8, { fontName: "Label", size: 9, color: titleColor, width: w - 28 });
  write(doc, body, x + 16, y + 24, { fontName: "Body", size: 10.5, color: SLATE, width: w - 28, lineGap: 2 });
  doc.y = y + box + 10;
}

function gauge(canvas: Canvas, report: ReportDocument) {
  const doc = canvas.doc;
  const score = report.status === "TIDAK_DAPAT_DINILAI" ? null : report.score;
  const tone = toneFor(score);
  const x = doc.page.margins.left;
  const w = contentWidth(doc);
  ensure(canvas, 58);
  const y = doc.y;
  const text = formatAuditScore(report.score, report.status);
  write(doc, text, x, y, { fontName: "Heading", size: 22, color: tone.text, width: 150, height: 28, lineBreak: false });
  write(doc, tone.label, x + 150, y + 8, { fontName: "Label", size: 11, color: tone.text, width: w - 150, height: 16, lineBreak: false });
  const barY = y + 32;
  doc.save();
  doc.roundedRect(x, barY, w, 12, 6).fill(LINE);
  if (score !== null && score > 0) {
    const fill = Math.max(8, Math.min(1, score / 100) * w);
    doc.roundedRect(x, barY, fill, 12, 6).fill(tone.color);
    if (tone.hatch) hatch(doc, x, barY, fill, 12);
  }
  const marker = x + w * 0.8;
  doc.moveTo(marker, barY - 3).lineTo(marker, barY + 15).lineWidth(1.25).strokeColor(EMERALD_TEXT).stroke();
  doc.restore();
  write(doc, "80", marker - 8, barY + 16, { fontName: "Label", size: 8, color: EMERALD_TEXT, width: 24, height: 10, lineBreak: false });
  doc.y = barY + 30;
}

function sectionChart(canvas: Canvas, sections: ReportSection[]) {
  const doc = canvas.doc;
  const x = doc.page.margins.left;
  const w = contentWidth(doc);
  const valueW = 124;
  const rows = sections.map((section) => {
    const name = `${section.code}. ${section.name}`;
    doc.font("Label").fontSize(9);
    return { section, tone: toneFor(section.score), name, nameH: Math.max(12, doc.heightOfString(name, { width: w - valueW })) };
  });
  const height = 16 + rows.reduce((sum, row) => sum + row.nameH + 18, 0);
  ensure(canvas, height);
  const top = doc.y;
  let y = top + 12;
  const barYs: number[] = [];
  for (const row of rows) {
    write(doc, row.name, x, y, { fontName: "Label", size: 9, color: INK, width: w - valueW });
    const afterName = doc.y;
    const value = row.section.score === null ? "Tidak dinilai" : `${formatPercent(row.section.score)} · ${row.tone.label}`;
    write(doc, value, x + w - valueW, y, {
      fontName: "Label",
      size: 8,
      color: row.tone.text,
      width: valueW,
      align: "right",
      height: 12,
      lineBreak: false,
    });
    const barY = afterName + 3;
    doc.save();
    doc.roundedRect(x, barY, w, 8, 4).fill(LINE);
    if (row.section.score !== null && row.section.score > 0) {
      const fill = Math.max(4, Math.min(1, row.section.score / 100) * w);
      doc.roundedRect(x, barY, fill, 8, 4).fill(row.tone.color);
      if (row.tone.hatch) hatch(doc, x, barY, fill, 8);
    }
    doc.restore();
    barYs.push(barY);
    y = barY + 16;
  }
  if (barYs.length) {
    const x80 = x + w * 0.8;
    doc.save();
    doc.moveTo(x80, barYs[0] - 2).lineTo(x80, barYs[barYs.length - 1] + 10).lineWidth(1.15).strokeColor(EMERALD_TEXT).stroke();
    doc.restore();
    write(doc, "Ambang 80%", x80 - 26, top, { fontName: "Label", size: 8, color: EMERALD_TEXT, width: 58, height: 10, lineBreak: false });
  }
  doc.y = y + 2;
  para(canvas, "Garis hijau adalah ambang 80%. Batang merah berarsir berarti Area risiko (di bawah 50%) dan tetap disebut dengan label, bukan warna saja. Kuning berarti 50% sampai di bawah 80%. Abu-abu berarti seksi itu tidak dinilai.");
}

function miniBar(canvas: Canvas, label: string, score: number | null, note: string) {
  const doc = canvas.doc;
  const x = doc.page.margins.left;
  const w = contentWidth(doc);
  const tone = toneFor(score);
  ensure(canvas, 48);
  const y = doc.y;
  write(doc, label, x, y, { fontName: "Label", size: 10, color: INK, width: w - 120, height: 14, lineBreak: false, ellipsis: true });
  const value = score === null ? "—" : formatPercent(score);
  write(doc, `${value} · ${tone.label}`, x + w - 150, y, { fontName: "Label", size: 9, color: tone.text, width: 150, align: "right", height: 14, lineBreak: false });
  const barY = y + 16;
  doc.save();
  doc.roundedRect(x, barY, w, 8, 4).fill(LINE);
  if (score !== null && score > 0) {
    const fill = Math.max(4, Math.min(1, score / 100) * w);
    doc.roundedRect(x, barY, fill, 8, 4).fill(tone.color);
    if (tone.hatch) hatch(doc, x, barY, fill, 8);
  }
  const marker = x + w * 0.8;
  doc.moveTo(marker, barY - 2).lineTo(marker, barY + 10).lineWidth(1).strokeColor(EMERALD_TEXT).stroke();
  doc.restore();
  write(doc, note, x, barY + 12, { fontName: "Body", size: 9, color: MUTED, width: w, height: 14, lineBreak: false, ellipsis: true });
  doc.y = barY + 28;
}

function substitute(section: ReportSection) {
  return [section.measures, section.concepts, section.framework].filter(Boolean).join(" ");
}

function gapLines(item: ReportGap, section: ReportSection) {
  const lines = [item.text];
  const guidance = customerGuidance(item.guidance);
  if (guidance) lines.push(`Panduan instrumen: ${guidance}`);
  else lines.push(`Narasi seksi ${section.code} ${section.name}: ${substitute(section) || section.gapReading || "Gunakan kerangka seksi ini sebagai pengganti panduan butir."}`);
  if (item.why) lines.push(item.why);
  if (item.risk) lines.push(`Risiko bila tetap Tidak: ${item.risk}`);
  return lines;
}

function paintGap(canvas: Canvas, item: ReportGap, section: ReportSection) {
  h2(canvas, `${item.isKey ? "Butir kunci" : "Butir"} #${item.number}`);
  for (const line of gapLines(item, section)) para(canvas, line);
  for (const step of item.steps) bullet(canvas, step);
  if (item.education) para(canvas, item.education, 10);
}

function keyCard(canvas: Canvas, item: ReportGap, section: ReportSection) {
  const doc = canvas.doc;
  const x = doc.page.margins.left;
  const w = contentWidth(doc);
  const inner = w - 32;
  const lines = gapLines(item, section);
  const steps = item.steps.filter(Boolean);
  doc.font("Body").fontSize(10.5);
  let box = 32;
  for (const line of lines) box += doc.heightOfString(line, { width: inner, lineGap: 2 }) + 6;
  for (const step of steps) box += doc.heightOfString(step, { width: inner - 16, lineGap: 1 }) + 4;
  box += 8;
  ensure(canvas, box + 8);
  const y = doc.y;
  doc.save();
  doc.roundedRect(x, y, w, box, 10).fill(RISK_BG);
  doc.rect(x, y, 5, box).fill(DANGER);
  doc.roundedRect(x, y, w, box, 10).lineWidth(1).strokeColor(DANGER).stroke();
  doc.restore();
  write(doc, `★ Bintang · Tidak · #${item.number}`, x + 16, y + 10, { fontName: "Label", size: 10, color: DANGER_TEXT, width: inner });
  let cursor = doc.y + 4;
  for (const line of lines) {
    write(doc, line, x + 16, cursor, { fontName: "Body", size: 10.5, color: SLATE, width: inner, lineGap: 2 });
    cursor = doc.y + 4;
  }
  for (const step of steps) {
    doc.fillColor(DANGER).circle(x + 22, cursor + 5, 2).fill();
    write(doc, step, x + 32, cursor, { fontName: "Body", size: 10.5, color: SLATE, width: inner - 18, lineGap: 1 });
    cursor = doc.y + 3;
  }
  doc.y = y + box + 10;
}

function pill(canvas: Canvas, label: string, url: string) {
  const doc = canvas.doc;
  const x = doc.page.margins.left;
  const w = 168;
  const h = 26;
  ensure(canvas, h + 4);
  const y = doc.y;
  doc.save();
  doc.roundedRect(x, y, w, h, 13).fill(EMERALD);
  doc.fillColor(WHITE).font("Label").fontSize(10);
  doc.text(label, x, y + 7, { width: w, align: "center", height: 14, lineBreak: false });
  doc.link(x, y, w, h, url);
  doc.restore();
  doc.fillColor(MUTED).font("Body").fontSize(8);
  doc.text(url, x + w + 10, y + 8, { width: contentWidth(doc) - w - 10, height: 12, lineBreak: false, ellipsis: true });
  doc.y = y + h + 8;
}

function productCard(canvas: Canvas, name: string, detail: string, priceLine: string, url: string, button: string) {
  const doc = canvas.doc;
  const x = doc.page.margins.left;
  const w = contentWidth(doc);
  doc.font("Body").fontSize(10);
  const detailH = doc.heightOfString(detail, { width: w - 28, lineGap: 1 });
  const box = detailH + 96;
  ensure(canvas, box + 8);
  const y = doc.y;
  doc.save();
  doc.roundedRect(x, y, w, box, 12).fill(WHITE);
  doc.roundedRect(x, y, w, box, 12).lineWidth(1).strokeColor(MINT_LINE).stroke();
  doc.rect(x, y, 5, box).fill(EMERALD);
  doc.restore();
  write(doc, name, x + 16, y + 10, { fontName: "Label", size: 12, color: INK, width: w - 32 });
  write(doc, detail, x + 16, y + 28, { fontName: "Body", size: 10, color: SLATE, width: w - 32, lineGap: 1 });
  write(doc, priceLine, x + 16, doc.y + 4, { fontName: "Label", size: 10, color: EMERALD_TEXT, width: w - 32 });
  const buttonY = y + box - 34;
  doc.save();
  doc.roundedRect(x + 16, buttonY, 150, 24, 12).fill(EMERALD);
  doc.fillColor(WHITE).font("Label").fontSize(10);
  doc.text(button, x + 16, buttonY + 6, { width: 150, align: "center", height: 14, lineBreak: false });
  doc.link(x + 16, buttonY, 150, 24, url);
  doc.restore();
  doc.y = y + box + 8;
}

function paintCta(canvas: Canvas, report: ReportDocument) {
  freshPage(canvas, "Langkah berikutnya");
  h1(canvas, "Langkah berikutnya");
  const origin = report.origin.replace(/\/$/, "");
  const ctas = buildReportCtas({ status: report.status, auditCode: report.auditCode, origin: report.origin, whatsapp: report.whatsapp });
  if (report.status === "TIDAK_DAPAT_DINILAI") {
    para(canvas, "Hasil ini tidak representatif, jadi laporan tidak menawarkan produk berbayar.");
    for (const item of ctas.items) {
      callout(canvas, item.label, item.detail, PAPER, MUTED, INK);
      pill(canvas, item.label, item.href);
    }
  } else {
    para(canvas, "Harga pada halaman ini berlabel SIMULASI. Angka mengikuti katalog yang sudah ada dan bukan penawaran mengikat.");
    for (const product of pricedOffers(report)) {
      productCard(canvas, product.name, product.detail, product.priceLine, product.url, product.button);
    }
    const offer = foundationFor(report.auditCode);
    productCard(
      canvas,
      offer?.name ?? "Kelas fondasi",
      "Kurikulum fondasi untuk fase ini. Bukan produk berbayar, jadi tidak ada harga di laporan.",
      "Tanpa harga di laporan ini",
      `${origin}/akun/layanan#${offer?.code ?? "fondasi"}`,
      "Buka kelas",
    );
  }

  const doc = canvas.doc;
  const x = doc.page.margins.left;
  const w = contentWidth(doc);
  const profile = `${coachName(report)}, ${coachRole(report)}. ${coachBio(report)}`;
  doc.font("Body").fontSize(10.5);
  const profileH = doc.heightOfString(profile, { width: w - 88, lineGap: 2 });
  const box = Math.max(78, profileH + 24);
  ensure(canvas, box + 8);
  const y = doc.y;
  doc.save();
  doc.roundedRect(x, y, w, box, 12).fill(MINT);
  doc.restore();
  drawAvatar(doc, x + 36, y + box / 2, 24);
  write(doc, "Penyusun metodologi", x + 72, y + 12, { fontName: "Label", size: 8, color: EMERALD_TEXT, width: w - 88 });
  write(doc, profile, x + 72, y + 26, { fontName: "Body", size: 10.5, color: SLATE, width: w - 88, lineGap: 2 });
  doc.y = y + box + 10;
  para(canvas, "Narasi edukasi pada laporan ini berstatus draf di basis data dan tetap ditampilkan agar peserta mendapat saran yang utuh. Owner dapat meninjau teks sebelum statusnya diubah menjadi final.", 9);
  para(canvas, "Laporan ini adalah diagnosis operasional BisnisLevelUp.id, bukan nasihat hukum, pajak, ketenagakerjaan, atau keuangan. Angka dan dasar aturan yang disebut di instrumen perlu dikonfirmasi ke konsultan yang berwenang, karena ketentuan dapat berubah.", 9);
  para(canvas, `BisnisLevelUp.id · www.bisnislevelup.id · sesi ${report.sessionId} · ${formatWib(report.completedAt) || "—"}`, 9);
}

function paint(canvas: Canvas, report: ReportDocument) {
  const doc = canvas.doc;
  const label = statusLabel(report.status);
  paintCover(doc, report);
  const gate = crisisGateLabel({ status: report.status, phaseNumber: report.fromPhaseNumber, crisisTitle: report.crisis });

  freshPage(canvas, "Bab 1. Ringkasan");
  h1(canvas, "Bab 1. Ringkasan");
  para(canvas, greeting(report));
  para(canvas, label.meaning);
  gauge(canvas, report);
  para(canvas, scoreBasisLine(report));
  if (gate) para(canvas, gate);
  write(doc, `${report.fromPhase} → ${report.toPhase}`, doc.page.margins.left, doc.y, {
    fontName: "Label",
    size: 12,
    color: FOREST,
    width: contentWidth(doc),
  });
  gap(doc, 8);
  if (report.narrative) {
    callout(canvas, report.narrative.headline, `${report.narrative.summary} ${report.narrative.implication}`, MINT, EMERALD, EMERALD_TEXT);
    para(canvas, report.narrative.focus);
  }
  para(
    canvas,
    "Cara membaca skor: butir bintang harus Ya pada semua yang dinilai. Butir bintang yang dijawab Tidak Berlaku tidak menggagalkan gerbang. Skor adalah persentase Ya pada butir biasa yang dinilai; Tidak Berlaku keluar dari pembilang dan penyebut. Ambang 80 persen tidak dibulatkan. Urutan status: dalam bahaya, gerbang belum terbuka, siap naik fase, hampir (60 persen sampai di bawah 80 persen), perlu fondasi (semua bintang Ya dan butir biasa di bawah 60 persen). Tidak dapat dinilai hanya muncul bila tidak ada butir biasa yang bisa dihitung.",
  );
  if (report.gateDesc) para(canvas, `Gerbang transisi: ${report.gateDesc}`);

  h1(canvas, "Bab 2. Skor per seksi");
  sectionChart(canvas, report.sections);
  if (report.triad) {
    h2(canvas, "Indikator siap: sistem, kas, orang");
    para(canvas, "Di audit fase 3 ke 4, tiga kelompok ini adalah keterangan tambahan. Status tetap mengikuti gerbang bintang dan skor butir biasa.");
    for (const group of report.triad) {
      miniBar(canvas, group.label, group.scorePct, group.ready ? "Gerbang kelompok lulus." : "Gerbang kelompok belum.");
    }
  }
  if (report.agBlock) {
    h2(canvas, "Lean Again dan identitas berjalan bersama");
    para(
      canvas,
      report.agBlock.warning
        ? "Salah satu lulus dan yang lain belum. Keduanya harus berjalan bersamaan sebelum ekspansi."
        : report.agBlock.ready
          ? "Bagian A dan G sama-sama lulus pada butir kunci yang dinilai."
          : "Bagian A dan G belum sama-sama lulus.",
    );
    for (const group of [report.agBlock.a, report.agBlock.g]) {
      miniBar(canvas, group.label, group.scorePct, group.ready ? "Lulus." : "Belum.");
    }
  }

  if (report.skippedKeys.length) {
    h2(canvas, "Butir kunci yang dilewati");
    para(canvas, "Butir ini tetap dihitung lulus gerbang. Satu jawaban Tidak Berlaku pada butir bintang tidak menahan kenaikan fase.");
    for (const item of report.skippedKeys) {
      h2(canvas, `#${item.number} · ${item.sectionName}`);
      para(canvas, item.text);
      callout(canvas, "Tidak Berlaku", KEY_NA_NOTE, PAPER, MUTED, INK);
    }
  }

  const keyGaps = report.sections.flatMap((section) => section.gaps.filter((item) => item.isKey).map((item) => ({ item, section })));
  h1(canvas, keyGaps.length ? "Bab 3. Butir kunci yang masih Tidak" : "Bab 3. Butir kunci yang sudah terbuka");
  if (!keyGaps.length) {
    callout(canvas, "Gerbang kunci", "Tidak ada butir kunci yang dijawab Tidak. Gerbang tidak tertahan oleh bintang. Yang perlu dijaga adalah bukti, bukan ingatan owner.", MINT, EMERALD, EMERALD_TEXT);
  }
  for (const entry of keyGaps) keyCard(canvas, entry.item, entry.section);

  const risks = report.sections.filter((section) => isRiskSection(section.score));
  freshPage(canvas, "Bab 4. Area risiko");
  h1(canvas, "Bab 4. Area risiko");
  if (!risks.length) {
    callout(canvas, "AREA RISIKO", "Tidak ada seksi dengan skor butir biasa di bawah 50%. Seksi yang tidak dinilai tidak dihitung sebagai area risiko.", PAPER, GRAY, MUTED);
  } else {
    callout(canvas, "AREA RISIKO", riskAreaNote(report.status), RISK_BG, DANGER, DANGER_TEXT);
    for (const section of risks) {
      h2(canvas, `Area risiko · Seksi ${section.code}. ${section.name}`);
      miniBar(canvas, `${section.code}. ${section.name}`, section.score, section.gapReading || "Tutup butir Tidak di seksi ini sebelum fase berikutnya menambah beban.");
      para(canvas, `Skor butir biasa ${formatPercent(section.score ?? 0)}. ${section.gapReading || "Tutup butir Tidak di seksi ini sebelum fase berikutnya menambah beban."}`);
    }
  }

  for (const section of report.sections) {
    freshPage(canvas, `Seksi ${section.code}. ${section.name}`);
    h1(canvas, `Seksi ${section.code}. ${section.name}`);
    const keyNote = section.keyTotal === 0 ? "Tidak ada butir kunci." : section.keyPass ? "Gerbang kunci seksi ini lulus." : "Ada butir kunci Tidak di seksi ini.";
    const note = section.score === null ? "Tidak ada butir biasa yang dinilai di seksi ini. Bukan nol persen." : keyNote;
    miniBar(canvas, "Skor butir biasa", section.score, note);
    if (isRiskSection(section.score)) callout(canvas, "AREA RISIKO", riskAreaNote(report.status), RISK_BG, DANGER, DANGER_TEXT);
    if (section.video) {
      para(canvas, `Video dari kanal @JalanLangitRiza: ${section.video.title}`);
      pill(canvas, "Tonton video", section.video.url);
    }
    if (section.description) para(canvas, section.description);
    if (section.measures) callout(canvas, "Apa yang diukur", section.measures, MINT, EMERALD, EMERALD_TEXT);
    if (section.whyItMatters) para(canvas, section.whyItMatters);
    if (section.concepts) {
      h2(canvas, "Kerangka dan konsep");
      para(canvas, section.concepts);
    }
    if (section.framework) para(canvas, section.framework);
    if (section.commonMistakes) {
      h2(canvas, "Kesalahan yang sering terjadi");
      para(canvas, section.commonMistakes);
    }
    h2(canvas, "Yang sudah jalan");
    para(canvas, section.strengths.length ? section.strengthReading || "Butir berikut dijawab Ya." : section.strengthReading || "Belum ada butir Ya yang bisa disebut kekuatan di seksi ini.");
    for (const item of section.strengths.slice(0, 6)) bullet(canvas, `${item.isKey ? "Kunci · " : ""}#${item.number} ${item.text}`);
    h2(canvas, "Celah");
    const plainGaps = section.gaps.filter((item) => !item.isKey);
    if (!plainGaps.length) para(canvas, section.gapReading || "Tidak ada butir Tidak di seksi ini.");
    else para(canvas, section.gapReading || "Butir Tidak di bawah ini yang perlu ditutup lebih dulu.");
    for (const item of plainGaps.slice(0, 4)) paintGap(canvas, item, section);
    for (const item of plainGaps.slice(4)) bullet(canvas, `#${item.number} ${item.text}`);
  }

  freshPage(canvas, "Rencana 30, 60, dan 90 hari");
  h1(canvas, "Rencana 30, 60, dan 90 hari");
  if (report.status === "SIAP_NAIK") para(canvas, "Persiapan fase berikutnya: jaga butir yang sudah Ya, lalu tutup titik lemah sebelum beban fase baru menekan.");
  if (report.status === "DALAM_BAHAYA") para(canvas, "Minggu ini dulu: tutup butir kunci yang masih Tidak sebelum menambah proyek baru.");
  const plan = buildActionPlan(report);
  const horizons = [
    { n: "30", title: report.status === "DALAM_BAHAYA" ? "30 hari · Minggu ini dulu" : "30 hari", lines: plan.d30, color: EMERALD },
    { n: "60", title: "60 hari", lines: plan.d60, color: EMERALD_TEXT },
    { n: "90", title: "90 hari", lines: plan.d90, color: FOREST },
  ];
  for (const horizon of horizons) {
    doc.font("Body").fontSize(10.5);
    const textH = horizon.lines.reduce((sum, line) => sum + doc.heightOfString(line, { width: contentWidth(doc) - 36, lineGap: 1 }) + 4, 28);
    ensure(canvas, textH);
    const y = doc.y;
    doc.save();
    doc.roundedRect(doc.page.margins.left, y, 22, 22, 11).fill(horizon.color);
    doc.fillColor(WHITE).font("Label").fontSize(8);
    doc.text(horizon.n, doc.page.margins.left, y + 6, { width: 22, align: "center", height: 12, lineBreak: false });
    doc.restore();
    write(doc, horizon.title, doc.page.margins.left + 30, y + 4, { fontName: "Label", size: 12, color: INK, width: contentWidth(doc) - 30 });
    doc.y = Math.max(doc.y, y + 26);
    if (!horizon.lines.length) para(canvas, "Belum ada butir untuk horison ini.");
    for (const line of horizon.lines) bullet(canvas, line);
  }

  h1(canvas, "Rekomendasi yang terpicu");
  if (!report.recommendations.length) para(canvas, "Belum ada rekomendasi yang terpicu dari jawaban Tidak. Gunakan narasi seksi dan rencana 90 hari sebagai urutan kerja.");
  for (const item of report.recommendations) {
    const bits = [item.author, item.description, item.url].filter(Boolean).join(" ");
    callout(canvas, `${item.critical ? "Prioritas kritis · " : ""}${item.type} · ${item.title}`, bits || item.title, item.critical ? "#fffbeb" : MINT, item.critical ? AMBER_TEXT : EMERALD, item.critical ? AMBER_TEXT : EMERALD_TEXT);
  }

  h1(canvas, "Penutup");
  if (report.closing) {
    para(canvas, report.closing.closingText);
    h2(canvas, report.closing.nextPhaseTitle);
    para(canvas, report.closing.nextPhasePreview);
    para(canvas, report.closing.prepareText);
  } else if (report.nextPhaseDescription) para(canvas, report.nextPhaseDescription);

  paintCta(canvas, report);
}

function stamp(doc: Doc, chapters: string[]) {
  const range = doc.bufferedPageRange();
  for (let index = 0; index < range.count; index += 1) {
    doc.switchToPage(range.start + index);
    const width = doc.page.width;
    const height = doc.page.height;
    if (index === 0) {
      doc.save();
      doc.moveTo(40, height - 40).lineTo(width - 40, height - 40).lineWidth(1.25).strokeColor("#d1fae5").stroke();
      doc.restore();
      drawMark(doc, 40, height - 30, 14, true);
      doc.font("Body").fontSize(8).fillColor("#ecfdf5");
      doc.text("www.bisnislevelup.id", 60, height - 26, { width: 180, height: 12, lineBreak: false });
      doc.text("Rahasia peserta", 230, height - 26, { width: 160, height: 12, align: "center", lineBreak: false });
      doc.font("Label").fontSize(9).fillColor(WHITE);
      doc.text(`Hal ${index + 1}/${range.count}`, width - 150, height - 27, { width: 110, align: "right", height: 12, lineBreak: false });
      continue;
    }
    const chapter = chapters[index] || "Laporan Audit Fase Bisnis";
    drawMark(doc, 46, 16, 16, false);
    doc.font("Label").fontSize(9).fillColor(FOREST);
    doc.text(chapter, 68, 19, { width: width - 230, height: 12, lineBreak: false, ellipsis: true });
    doc.font("Label").fontSize(8).fillColor(EMERALD);
    doc.text("BisnisLevelUp.id", width - 156, 20, { width: 110, align: "right", height: 12, lineBreak: false });
    doc.save();
    doc.moveTo(46, 38).lineTo(width - 46, 38).lineWidth(1.5).strokeColor(EMERALD).stroke();
    doc.moveTo(46, height - 40).lineTo(width - 46, height - 40).lineWidth(1.25).strokeColor(EMERALD).stroke();
    doc.restore();
    doc.font("Body").fontSize(8).fillColor(MUTED);
    doc.text("www.bisnislevelup.id", 46, height - 28, { width: 170, height: 12, lineBreak: false });
    doc.text("Rahasia peserta", 220, height - 28, { width: 150, height: 12, align: "center", lineBreak: false });
    doc.font("Label").fontSize(9).fillColor(EMERALD_TEXT);
    doc.text(`Hal ${index + 1}/${range.count}`, width - 150, height - 29, { width: 104, align: "right", height: 12, lineBreak: false });
  }
}

export function buildReportPdf(report: ReportDocument, options?: { compress?: boolean }) {
  const face = fonts();
  const completed = report.completedAt ? new Date(report.completedAt) : null;
  return new Promise<Buffer>((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      compress: options?.compress !== false,
      bufferPages: true,
      margins: { top: 58, bottom: 56, left: 46, right: 46 },
      info: {
        Title: "Laporan Audit Fase Bisnis",
        Author: "BisnisLevelUp.id",
        Subject: report.auditName,
        ...(completed && !Number.isNaN(completed.getTime()) ? { CreationDate: completed } : {}),
      },
    });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("error", reject);
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.registerFont("Heading", face.heading);
    doc.registerFont("Label", face.label);
    doc.registerFont("Body", face.body);
    doc.registerFont("BodyBold", face.bodyBold);
    doc.registerFont("Symbol", face.symbol);
    const canvas: Canvas = { doc, chapter: "Sampul", chapters: ["Sampul"], page: 0 };
    paint(canvas, report);
    stamp(doc, canvas.chapters);
    doc.end();
  });
}
