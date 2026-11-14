import { existsSync } from "node:fs";
import path from "node:path";
import PDFDocument from "pdfkit";
import { buildReportCtas } from "@/lib/portal/ctas";
import { formatWib, rupiah, statusLabel } from "@/lib/portal/labels";
import { customerGuidance } from "@/lib/pdf/guidance";
import { pdfHref } from "@/lib/pdf/links";
import { buildActionPlan } from "@/lib/pdf/plan";
import {
  KEY_NA_NOTE,
  agTogetherNote,
  crisisGateLabel,
  formatAuditScore,
  formatPercent,
  hampirGapLine,
  plainGlyphs,
  indicatorPassLabel,
  isRiskSection,
  publicCopy,
  riskAreaNote,
  closingGreeting,
  openingGreeting,
  sapaanOrAnda,
  scoreBasisLine,
  statusActionLine,
  triadGroupNote,
} from "@/lib/pdf/format";
import { pickPriorities, selectResources } from "@/lib/pdf/spec-rules";
import { AUDIT_3_4_TRIAD, AUDIT_4_5_AG } from "@/lib/scoring";
import type { ReportDocument, ReportGap, ReportRecommendation, ReportSection } from "@/lib/pdf/types";

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
  return openingGreeting(report.salutation);
}

function coachName(report: ReportDocument) {
  const raw = report.coach?.name?.trim() || "Riza Zacharias";
  return raw.replace(/^SIMULASI\s+/i, "") || "Riza Zacharias";
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
  painted: string;
  chapters: string[];
  page: number;
};

function fonts() {
  // Panah dan bintang ditulis sebagai teks supaya font subset simbol tidak ikut ter-embed.
  const dir = path.join(process.cwd(), "assets/fonts");
  const files = {
    heading: path.join(dir, "AlbertSans-ExtraBold.ttf"),
    label: path.join(dir, "AlbertSans-Bold.ttf"),
    albert: path.join(dir, "AlbertSans-Regular.ttf"),
    body: path.join(dir, "Cabin-Regular.ttf"),
    bodyBold: path.join(dir, "Cabin-Bold.ttf"),
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

function pageRoom(doc: Doc) {
  return doc.page.height - doc.page.margins.top - doc.page.margins.bottom;
}

function ensure(canvas: Canvas, height: number) {
  const doc = canvas.doc;
  const bottom = doc.page.height - doc.page.margins.bottom;
  // Blok lebih tinggi dari satu halaman tidak dipaksa pindah; isinya mengalir.
  if (height > pageRoom(doc)) return;
  if (doc.y + height <= bottom) return;
  doc.addPage();
  canvas.page += 1;
  const continued = canvas.painted === canvas.chapter && !canvas.chapter.includes("(lanjutan)");
  canvas.chapters[canvas.page] = continued ? `${canvas.chapter} (lanjutan)` : canvas.chapter;
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
  doc.font(fontName).fontSize(size).fillColor(color);
  doc.text(plainGlyphs(value), x, y, {
    width: options.width,
    height: options.height,
    lineGap: options.lineGap,
    lineBreak: options.lineBreak,
    align: options.align,
    ellipsis: options.ellipsis,
    characterSpacing: options.characterSpacing,
    link: options.link,
  });
}

function h1(canvas: Canvas, text: string) {
  const doc = canvas.doc;
  canvas.chapter = text;
  ensure(canvas, 78);
  remember(canvas);
  write(doc, text, doc.page.margins.left, doc.y, { fontName: "Heading", size: 16, color: FOREST, width: contentWidth(doc) });
  gap(doc, 3);
  doc.save();
  doc.moveTo(doc.page.margins.left, doc.y).lineTo(doc.page.margins.left + 64, doc.y).lineWidth(2.5).strokeColor(EMERALD).stroke();
  doc.restore();
  gap(doc, 8);
  canvas.painted = canvas.chapter;
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

function toneFor(score: number | null, gateClosed = false) {
  if (score === null) return { color: GRAY, label: "Tidak dinilai", hatch: false, text: MUTED };
  if (gateClosed) return { color: DANGER, label: "Gerbang belum", hatch: score < 50, text: DANGER_TEXT };
  if (score < 60) return { color: DANGER, label: score < 50 ? "Area risiko" : "Di bawah 60%", hatch: score < 50, text: DANGER_TEXT };
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
  const chipWidth = Math.min(doc.widthOfString(chip) + 36, 320);
  doc.roundedRect(40, 174, chipWidth, 28, 14).fill(WHITE);
  doc.circle(54, 188, 4).fill(phase?.fill ?? EMERALD);
  coverLine(doc, chip, 66, 181, 10, INK, chipWidth - 32, "Label");
  write(doc, `${report.fromPhase} ke ${report.toPhase}`, 40, 208, {
    fontName: "Label",
    size: 12,
    color: WHITE,
    width: doc.page.width - 80,
    height: 18,
    lineBreak: false,
  });

  doc.font("Label").fontSize(11);
  const badgeWidth = Math.min(doc.widthOfString(title) + 28, 300);
  doc.roundedRect(40, 230, badgeWidth, 30, 15).fill(label.bg);
  coverLine(doc, title, 40, 238, 11, label.color, badgeWidth, "Label");

  const sheetY = 276;
  const sheetH = 490;
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
  const person = sapaanOrAnda(report.salutation);
  const company = report.company && !/^Sampel [A-Z0-9_]+$/.test(report.company) ? report.company : null;
  coverLine(doc, person, left, sheetY + 146, 18, INK, inner, "Heading");
  const meta = [company, report.businessField, report.startYear ? `Mulai ${report.startYear}` : null].filter(Boolean).join(" · ");
  coverLine(doc, meta || report.auditName, left, sheetY + 172, 11, SLATE, inner, "Body");
  coverLine(doc, `Selesai ${formatWib(report.completedAt) || "—"}`, left, sheetY + 190, 11, INK, inner, "Label");
  const coverScore = report.status === "TIDAK_DAPAT_DINILAI" ? "—" : formatAuditScore(report.score, report.status);
  coverLine(doc, coverScore, left, sheetY + 208, 22, toneFor(report.status === "TIDAK_DAPAT_DINILAI" ? null : report.score).text, inner, "Heading");
  if (report.status === "TIDAK_DAPAT_DINILAI") coverLine(doc, "Belum dapat dinilai", left, sheetY + 234, 11, MUTED, inner, "Label");
  coverLine(doc, scoreBasisLine(report), left, sheetY + 250, 10, SLATE, inner, "Body");
  const gate = crisisGateLabel({ status: report.status, phaseNumber: report.fromPhaseNumber, crisisTitle: report.crisis });
  if (gate) coverLine(doc, gate, left, sheetY + 268, 10, INK, inner, "BodyBold");
  coverLine(doc, greeting(report), left, sheetY + 286, 12, INK, inner, "BodyBold");
  const risks = report.sections.filter((section) => isRiskSection(section.score)).length;
  const stats = [
    { k: "Skor", v: coverScore },
    { k: "Kunci", v: scoreBasisLine(report).split(" · ")[1] ?? "—" },
    { k: "Area risiko", v: String(risks) },
  ];
  const gapX = 8;
  const tileW = (inner - gapX * 2) / 3;
  stats.forEach((stat, index) => {
    const x = left + index * (tileW + gapX);
    doc.roundedRect(x, sheetY + 312, tileW, 48, 8).fill(PAPER);
    coverLine(doc, stat.k, x + 8, sheetY + 318, 8, MUTED, tileW - 16, "Label");
    coverLine(doc, stat.v, x + 8, sheetY + 332, 10, INK, tileW - 16, "Heading");
  });
  const chapters = ["Bab 1 Ringkasan", "Bab 2 Skor per seksi", "Bab 3 Butir kunci", "Bab 4 Area risiko", "Bab 5 Rencana 30/60/90", "Bab 6–9 dan Lampiran A"];
  chapters.forEach((item, index) => {
    const col = index < 3 ? 0 : 1;
    const row = index % 3;
    coverLine(doc, item, left + col * (inner / 2), sheetY + 372 + row * 16, 10, SLATE, inner / 2 - 8, "Body");
  });
  coverLine(doc, "Audit Bisnis. Temukan Fasemu. Naik Level.", left, sheetY + 428, 10, EMERALD_TEXT, inner, "Label");
  coverLine(doc, report.auditName, left, sheetY + 444, 10, MUTED, inner, "Body");
}

function callout(canvas: Canvas, title: string, body: string, fill: string, accent: string, titleColor: string) {
  const doc = canvas.doc;
  const x = doc.page.margins.left;
  const w = contentWidth(doc);
  doc.font("Body").fontSize(10.5);
  const bodyHeight = doc.heightOfString(body, { width: w - 28, lineGap: 2 });
  const box = bodyHeight + 36;
  if (box > pageRoom(doc)) {
    h2(canvas, title);
    para(canvas, body);
    return;
  }
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
  const gateClosed = report.status === "BELUM_SIAP" || report.status === "DALAM_BAHAYA";
  const tone = toneFor(score, gateClosed);
  const x = doc.page.margins.left;
  const w = contentWidth(doc);
  ensure(canvas, 58);
  const y = doc.y;
  const text = report.status === "TIDAK_DAPAT_DINILAI" ? "—" : formatAuditScore(report.score, report.status);
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
  const valueW = 168;
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
    write(doc, row.name, x, y, { fontName: "Albert", size: 9, color: INK, width: w - valueW });
    const afterName = doc.y;
    const value = row.section.score === null ? "—" : `${formatPercent(row.section.score)} · ${row.tone.label}`;
    write(doc, value, x + w - valueW, y, {
      fontName: "Label",
      size: 8,
      color: row.tone.text,
      width: valueW,
      align: "right",
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
  para(canvas, "Garis hijau adalah ambang 80%. Merah di bawah 60%, kuning 60% sampai di bawah 80%, hijau 80% atau lebih. Label Area risiko hanya untuk seksi di bawah 50%. Abu-abu berarti seksi itu tidak dinilai.");
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
  write(doc, note, x, barY + 14, { fontName: "Body", size: 9, color: MUTED, width: w, lineGap: 1 });
  doc.y += 6;
}

function substitute(section: ReportSection) {
  return [section.measures, section.concepts, section.framework].filter(Boolean).join(" ");
}

const GENERIC_WHY = /butir \d+ mengukur bagian/i;
const GENERIC_RISK = /jawaban tidak pada butir ini menahan skor seksi/i;
const GENERIC_STEP = /^(tulis bukti minggu ini untuk butir \d+|pilih satu perubahan kecil)/i;
const GENERIC_EDUCATION = /narasi seksi|sebagai pengganti|tidak punya panduan|butir tanpa panduan/i;

function specificInsight(item: ReportGap) {
  const why = publicCopy(item.why);
  const risk = publicCopy(item.risk);
  const steps = item.steps.map((step) => step.trim()).filter((step) => step && !GENERIC_STEP.test(step));
  const education = publicCopy(item.education);
  const guidance = customerGuidance(item.guidance);
  return Boolean(
    (guidance && !META_LINE.test(guidance) && !GENERIC_EDUCATION.test(guidance)) ||
      (why && !GENERIC_WHY.test(why)) ||
      (risk && !GENERIC_RISK.test(risk)) ||
      steps.length ||
      (education && !META_LINE.test(education) && !GENERIC_EDUCATION.test(education)),
  );
}

const META_LINE = /panduan instrumen|sebagai pengganti|berstatus draf|butir tanpa panduan|support_whatsapp/i;

function gapLines(item: ReportGap, section: ReportSection) {
  const lines = [publicCopy(item.text)];
  const why = publicCopy(item.why);
  const risk = publicCopy(item.risk);
  const education = publicCopy(item.education);
  const guidance = customerGuidance(item.guidance);
  const narrative = publicCopy(substitute(section) || section.gapReading || section.measures);
  if (guidance && !META_LINE.test(guidance) && !GENERIC_EDUCATION.test(guidance)) lines.push(guidance);
  else if (why && !GENERIC_WHY.test(why)) lines.push(why);
  else if (narrative) lines.push(narrative.split(/(?<=[.!?])\s+/)[0] ?? "");
  if (risk && !GENERIC_RISK.test(risk)) lines.push(`Risiko bila tetap Tidak: ${risk}`);
  if (education && !META_LINE.test(education)) lines.push(education);
  return lines.filter((line) => line && !META_LINE.test(line));
}

function paintGap(canvas: Canvas, item: ReportGap, section: ReportSection) {
  const doc = canvas.doc;
  const lines = gapLines(item, section);
  const steps = item.steps.filter((step) => step && !/^Tulis bukti minggu ini untuk butir \d+/i.test(step));
  doc.font("Body").fontSize(10.5);
  let height = 28;
  for (const line of lines) height += doc.heightOfString(line, { width: contentWidth(doc), lineGap: 2 }) + 8;
  for (const step of steps) height += doc.heightOfString(step, { width: contentWidth(doc) - 16, lineGap: 1 }) + 6;
  if (height <= pageRoom(doc)) ensure(canvas, height);
  h2(canvas, `${item.isKey ? "Butir kunci" : "Butir"} #${item.number}`);
  for (const line of lines) para(canvas, line);
  for (const step of steps) bullet(canvas, publicCopy(step));
}

function cappedRecommendations(items: ReportRecommendation[]) {
  const ranked = [...items].sort((a, b) => Number(b.critical) - Number(a.critical));
  return selectResources(ranked.map((item) => ({ ...item, premium: false })), 10, 3);
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
  if (box > pageRoom(doc)) {
    h2(canvas, `Bintang · Tidak · #${item.number}`);
    for (const line of lines) para(canvas, line);
    for (const step of steps) bullet(canvas, step);
    return;
  }
  ensure(canvas, box + 8);
  const y = doc.y;
  doc.save();
  doc.roundedRect(x, y, w, box, 10).fill(RISK_BG);
  doc.rect(x, y, 5, box).fill(DANGER);
  doc.roundedRect(x, y, w, box, 10).lineWidth(1).strokeColor(DANGER).stroke();
  doc.restore();
  write(doc, `Bintang · Tidak · #${item.number}`, x + 16, y + 10, { fontName: "Label", size: 10, color: DANGER_TEXT, width: inner });
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
  const h = 30;
  ensure(canvas, h + 4);
  const y = doc.y;
  doc.save();
  doc.roundedRect(x, y, w, h, 13).fill(EMERALD);
  doc.fillColor(WHITE).font("Label").fontSize(10);
  doc.text(label, x, y + 9, { width: w, align: "center", height: 14, lineBreak: false });
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
  if (box > pageRoom(doc)) {
    h2(canvas, name);
    para(canvas, detail);
    para(canvas, priceLine);
    pill(canvas, button, url);
    return;
  }
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

function footerIdentity(report: ReportDocument) {
  return [plainGlyphs(report.auditName), report.sessionCode?.trim()].filter(Boolean).join(" · ");
}

function statusSafe(text: string, status: string) {
  const copy = publicCopy(text);
  if (!copy) return copy;
  return copy
    .split(/(?<=[.!?])\s+/)
    .filter((part) => {
      if (/gerbang fase \d/i.test(part)) return false;
      if (status !== "SIAP_NAIK" && /gerbang utama sudah terbuka|gerbang sudah terbuka/i.test(part)) return false;
      return true;
    })
    .join(" ")
    .trim();
}

function sectionBrief(section: ReportSection) {
  const seen = new Set<string>();
  const sentences: string[] = [];
  for (const chunk of [section.measures, section.whyItMatters, section.concepts, section.commonMistakes, section.gapReading]) {
    const copy = publicCopy(chunk);
    if (!copy) continue;
    for (const sentence of copy.split(/(?<=[.!?])\s+/)) {
      const key = sentence.slice(0, 70).toLowerCase();
      if (!sentence || seen.has(key)) continue;
      seen.add(key);
      sentences.push(sentence);
      if (sentences.length === 4) return sentences.join(" ");
    }
  }
  return sentences.join(" ");
}

function withFailedKeys(report: ReportDocument, numbers: readonly number[], note: string) {
  if (!/belum/i.test(note)) return note;
  const wanted = new Set(numbers);
  const failed = report.sections.flatMap((section) =>
    section.gaps.filter((gap) => gap.isKey && wanted.has(gap.number)).map((gap) => gap.number),
  );
  if (!failed.length) return note;
  return `${note.replace(/\.$/, "")}. Butir bintang ${failed.map((item) => `#${item}`).join(", ")} belum.`;
}

function paintLampiran(canvas: Canvas, report: ReportDocument) {
  h1(canvas, "Lampiran A. Butir Tidak dan Tidak Berlaku");
  para(canvas, "Daftar ini melengkapi kartu di bab sebelumnya. Butir bintang ditandai.");
  let any = false;
  for (const section of report.sections) {
    const tidak = section.gaps;
    if (!tidak.length) continue;
    any = true;
    const keys = tidak.filter((item) => item.isKey).map((item) => `#${item.number}`);
    const plain = tidak.filter((item) => !item.isKey).map((item) => `#${item.number}`);
    const bits = [keys.length ? `bintang ${keys.join(", ")}` : "", plain.length ? plain.join(", ") : ""].filter(Boolean);
    para(canvas, `Seksi ${section.code}. ${section.name}: ${bits.join("; ")}.`);
  }
  if (report.skippedKeys.length) {
    any = true;
    para(canvas, `Tidak Berlaku: ${report.skippedKeys.map((item) => `#${item.number} ${item.sectionName}`).join(", ")}. ${KEY_NA_NOTE}`);
  }
  if (!any) para(canvas, "Tidak ada butir Tidak atau Tidak Berlaku pada hasil ini.");
}

function paintCta(canvas: Canvas, report: ReportDocument) {
  freshPage(canvas, "Bab 9. Langkah berikutnya");
  h1(canvas, "Bab 9. Langkah berikutnya");
  const ctas = buildReportCtas({
    status: report.status,
    auditCode: report.auditCode,
    origin: "https://www.bisnislevelup.id",
    whatsapp: report.whatsapp,
  });
  if (report.status === "TIDAK_DAPAT_DINILAI") {
    para(canvas, "Hasil ini tidak representatif, jadi laporan tidak menawarkan produk berbayar.");
  }
  const offers = pricedOffers(report);
  for (const item of ctas.items.slice(0, 3)) {
    if (!item.href) {
      callout(canvas, item.label, publicCopy(item.detail) || item.detail, PAPER, MUTED, INK);
      continue;
    }
    const href = pdfHref(item.href);
    const priced = offers.find((offer) =>
      ["audit-coaching", "audit-satu-fase", "audit-lengkap"].some((code) => item.href.includes(code) && offer.url.includes(code)),
    );
    const priceLine = report.status === "TIDAK_DAPAT_DINILAI" || item.href.includes("/akun/") ? "Tanpa harga di laporan ini" : priced ? priced.priceLine : "Tanpa harga di laporan ini";
    productCard(canvas, item.label, publicCopy(item.detail) || item.detail, priceLine, href, item.role === "primary" ? "Buka langkah utama" : "Buka");
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
  para(canvas, "Laporan ini adalah diagnosis operasional BisnisLevelUp.id, bukan nasihat hukum, pajak, ketenagakerjaan, atau keuangan. Angka dan dasar aturan yang disebut di instrumen perlu dikonfirmasi ke konsultan yang berwenang, karena ketentuan dapat berubah.", 9);
  const primary = ctas.items.find((item) => item.href);
  if (primary?.href) para(canvas, pdfHref(primary.href), 9);
  para(canvas, "Laporan ini juga tersimpan di dashboard Anda.", 9);
  para(canvas, footerIdentity(report), 9);
}

function paint(canvas: Canvas, report: ReportDocument) {
  const doc = canvas.doc;
  paintCover(doc, report);
  const gate = crisisGateLabel({ status: report.status, phaseNumber: report.fromPhaseNumber, crisisTitle: report.crisis });

  freshPage(canvas, "Bab 1. Ringkasan");
  h1(canvas, "Bab 1. Ringkasan");
  para(canvas, `${greeting(report)} Berikut ringkasan audit Anda.`);
  para(canvas, statusActionLine(report));
  const gapLine = hampirGapLine(report);
  if (gapLine && report.status !== "HAMPIR") para(canvas, gapLine);
  gauge(canvas, report);
  para(canvas, scoreBasisLine(report));
  if (gate) para(canvas, gate);
  if (report.narrative) {
    const headline = statusSafe(report.narrative.headline, report.status);
    const summary = statusSafe(`${report.narrative.summary} ${report.narrative.implication}`, report.status);
    if (headline || summary) callout(canvas, headline || "Ringkasan", summary || headline, MINT, EMERALD, EMERALD_TEXT);
    const focus = statusSafe(report.narrative.focus, report.status);
    if (focus && focus !== summary) para(canvas, focus);
  }
  const priorities = pickPriorities({
    status: report.status,
    prep: report.status === "SIAP_NAIK" ? ["Jaga bukti mingguan", "Tulis satu proses yang masih menempel", "Siapkan audit fase berikutnya"] : [],
    sections: report.sections.map((section, index) => ({
      code: section.code,
      name: section.name,
      score: section.score,
      tidak: section.tidak,
      sortOrder: index,
      gaps: section.gaps.map((gap) => ({
        number: gap.number,
        text: gap.text,
        isKey: gap.isKey,
        priority: gap.isKey ? 0 : 1,
        why: gap.why,
      })),
    })),
  });
  if (priorities.length) {
    h2(canvas, "3 Prioritas Utama");
    for (const item of priorities) bullet(canvas, `${item.title}. ${publicCopy(item.reason)}`);
  }
  const gateDetail = statusSafe(report.gateDesc ?? "", report.status);
  if (gateDetail && gate && !gateDetail.includes(gate)) para(canvas, gateDetail);

  h1(canvas, "Bab 2. Skor per seksi");
  para(canvas, `${report.fromPhase} ke ${report.toPhase}`);
  sectionChart(canvas, report.sections);
  if (report.triad) {
    h2(canvas, "Indikator siap: sistem, kas, orang");
    para(canvas, "Di audit fase 3 ke 4, tiga kelompok ini adalah keterangan tambahan. Status tetap mengikuti gerbang bintang dan skor butir biasa.");
    for (const group of report.triad) {
      const spec = AUDIT_3_4_TRIAD.find((item) => item.id === group.id);
      miniBar(canvas, group.label, group.scorePct, withFailedKeys(report, spec?.keyNumbers ?? [], triadGroupNote(group.scorePct, group.ready)));
    }
  }
  if (report.agBlock) {
    h2(canvas, "Lean Again dan identitas berjalan bersama");
    para(canvas, agTogetherNote(report.agBlock.a, report.agBlock.g));
    miniBar(canvas, report.agBlock.a.label, report.agBlock.a.scorePct, withFailedKeys(report, AUDIT_4_5_AG.a.keyNumbers, indicatorPassLabel(report.agBlock.a.scorePct, report.agBlock.a.ready)));
    miniBar(canvas, report.agBlock.g.label, report.agBlock.g.scorePct, withFailedKeys(report, AUDIT_4_5_AG.g.keyNumbers, indicatorPassLabel(report.agBlock.g.scorePct, report.agBlock.g.ready)));
  }

  if (report.skippedKeys.length) {
    h2(canvas, "Butir kunci yang dilewati");
    para(canvas, KEY_NA_NOTE);
    para(canvas, report.skippedKeys.map((item) => `#${item.number} ${item.sectionName}`).join(", "));
  }

  const keyGaps = report.sections.flatMap((section) => section.gaps.filter((item) => item.isKey).map((item) => ({ item, section })));
  h1(canvas, keyGaps.length ? "Bab 3. Butir kunci yang masih Tidak" : "Bab 3. Butir kunci yang sudah terbuka");
  if (!keyGaps.length) {
    callout(canvas, "Gerbang kunci", "Tidak ada butir kunci yang dijawab Tidak. Gerbang tidak tertahan oleh bintang. Yang perlu dijaga adalah bukti, bukan ingatan owner.", MINT, EMERALD, EMERALD_TEXT);
  }
  for (const entry of keyGaps) keyCard(canvas, entry.item, entry.section);

  const risks = report.sections.filter((section) => isRiskSection(section.score));
  h1(canvas, "Bab 4. Area risiko");
  if (!risks.length) {
    para(canvas, "Tidak ada seksi dengan skor butir biasa di bawah 50%. Seksi yang tidak dinilai tidak dihitung sebagai area risiko.");
  } else {
    para(canvas, riskAreaNote(report.status));
    for (const section of risks) {
      bullet(canvas, `${section.code}. ${section.name}: ${formatPercent(section.score ?? 0)}.`);
    }
  }

  h1(canvas, "Seksi");
  for (const section of report.sections) {
    h2(canvas, `Seksi ${section.code}. ${section.name}`);
    const failed = section.gaps.filter((item) => item.isKey).map((item) => `#${item.number}`);
    const keyNote = section.score === null
      ? "Tidak ada butir biasa yang dinilai. Bukan nol persen."
      : failed.length
        ? `Gerbang kelompok belum. Butir bintang ${failed.join(", ")} belum.`
        : section.keyTotal === 0
          ? "Tidak ada butir kunci."
          : "Gerbang kunci seksi ini lulus.";
    miniBar(canvas, "Skor butir biasa", section.score, keyNote);
    const brief = sectionBrief(section);
    if (brief) para(canvas, brief);
    const shown = section.strengths.slice(0, 4);
    const hidden = section.strengths.length - shown.length;
    if (shown.length) {
      h2(canvas, "Yang sudah jalan");
      for (const item of shown) bullet(canvas, `${item.isKey ? "Kunci · " : ""}#${item.number} ${plainGlyphs(item.text)}`);
      if (hidden > 0) para(canvas, `+${hidden} lainnya.`);
    }
    const plainGaps = section.gaps.filter((item) => !item.isKey);
    const detailed = plainGaps.filter((item) => specificInsight(item));
    const generic = plainGaps.filter((item) => !specificInsight(item));
    if (generic.length) para(canvas, `Celah: ${generic.map((item) => `#${item.number}`).join(", ")}.`);
    for (const item of detailed) paintGap(canvas, item, section);
  }

  freshPage(canvas, "Bab 5. Rencana 30, 60, dan 90 hari");
  h1(canvas, "Bab 5. Rencana 30, 60, dan 90 hari");
  if (report.status === "SIAP_NAIK") para(canvas, "Persiapan fase berikutnya: jaga butir yang sudah Ya, lalu tutup titik lemah sebelum beban fase baru menekan.");
  if (report.status === "DALAM_BAHAYA") para(canvas, "Minggu ini dulu: tutup butir kunci yang masih Tidak sebelum menambah proyek baru.");
  const plan = buildActionPlan(report);
  const horizons = [
    { n: "30", title: report.status === "DALAM_BAHAYA" ? "30 hari · Minggu ini dulu" : "30 hari", lines: plan.d30, color: EMERALD },
    { n: "60", title: "60 hari", lines: plan.d60, color: EMERALD_TEXT },
    { n: "90", title: "90 hari", lines: plan.d90, color: FOREST },
  ];
  const seenPlan = new Set<string>();
  for (const horizon of horizons) {
    const lines = horizon.lines.filter((line) => {
      const key = line.toLowerCase().replace(/#\d+/g, "#").replace(/butir \d+/gi, "butir");
      if (seenPlan.has(key)) return false;
      seenPlan.add(key);
      return true;
    });
    if (!lines.length) continue;
    doc.font("Body").fontSize(10.5);
    const textH = lines.reduce((sum, line) => sum + doc.heightOfString(line, { width: contentWidth(doc) - 36, lineGap: 1 }) + 4, 28);
    ensure(canvas, textH);
    const y = doc.y;
    doc.save();
    doc.roundedRect(doc.page.margins.left, y, 22, 22, 11).fill(horizon.color);
    doc.fillColor(WHITE).font("Label").fontSize(8);
    doc.text(horizon.n, doc.page.margins.left, y + 6, { width: 22, align: "center", height: 12, lineBreak: false });
    doc.restore();
    write(doc, horizon.title, doc.page.margins.left + 30, y + 4, { fontName: "Label", size: 12, color: INK, width: contentWidth(doc) - 30 });
    doc.y = Math.max(doc.y, y + 26);
    for (const line of lines) bullet(canvas, plainGlyphs(line));
  }

  h1(canvas, "Bab 6. Gerbang krisis dan fase berikutnya");
  if (report.closing) {
    h2(canvas, plainGlyphs(report.closing.nextPhaseTitle));
    para(canvas, publicCopy(report.closing.nextPhasePreview));
    para(canvas, publicCopy(report.closing.prepareText));
  } else if (report.nextPhaseDescription) para(canvas, publicCopy(report.nextPhaseDescription));

  h1(canvas, "Bab 7. Sumber belajar");
  const videos = report.sections.filter((section) => section.video);
  if (!videos.length) para(canvas, "Belum ada video kanal @JalanLangitRiza yang dipasangkan ke seksi pada audit ini.");
  for (const section of videos) {
    if (!section.video) continue;
    para(canvas, `Seksi ${section.code}. ${section.video.title}`);
    pill(canvas, "Tonton video", section.video.url);
  }
  h2(canvas, "Rekomendasi yang terpicu");
  const resources = report.status === "TIDAK_DAPAT_DINILAI"
    ? cappedRecommendations(report.recommendations.filter((item) => item.type === "TOOL" || item.type === "BUKU"))
    : cappedRecommendations(report.recommendations);
  if (!resources.length) para(canvas, "Belum ada rekomendasi yang terpicu dari jawaban Tidak. Gunakan rencana 90 hari sebagai urutan kerja.");
  for (const item of resources) {
    const bits = [item.author, publicCopy(item.description)].filter(Boolean).join(" ");
    callout(canvas, `${item.critical ? "Prioritas kritis · " : ""}${item.type} · ${item.title}`, bits || item.title, item.critical ? "#fffbeb" : MINT, item.critical ? AMBER_TEXT : EMERALD, item.critical ? AMBER_TEXT : EMERALD_TEXT);
  }

  h1(canvas, "Bab 8. Penutup");
  if (report.closing) para(canvas, publicCopy(report.closing.closingText));
  para(canvas, closingGreeting(report.salutation));

  paintCta(canvas, report);
  paintLampiran(canvas, report);
}

function stamp(doc: Doc, chapters: string[], identity: string) {
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
      doc.text(identity, 200, height - 26, { width: width - 370, height: 12, align: "center", lineBreak: false, ellipsis: true });
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
    doc.text(identity, 180, height - 28, { width: width - 360, height: 12, align: "center", lineBreak: false, ellipsis: true });
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
    doc.registerFont("Albert", face.albert);
    doc.registerFont("Body", face.body);
    doc.registerFont("BodyBold", face.bodyBold);
    const canvas: Canvas = { doc, chapter: "Sampul", painted: "", chapters: ["Sampul"], page: 0 };
    paint(canvas, report);
    stamp(doc, canvas.chapters, footerIdentity(report));
    doc.end();
  });
}
