import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { KEY_NA_NOTE, SIAP_NAIK_RISK_NOTE } from "./format";
import { buildLegacyReportPdf } from "./report-legacy";
import { buildReportPdf } from "./report";
import { sendsNewPdf } from "./version";
import type { ReportDocument, ReportSection } from "./types";

function section(partial: Partial<ReportSection> & Pick<ReportSection, "code" | "name" | "score">): ReportSection {
  return {
    description: null,
    keyPass: true,
    tidak: 0,
    ya: 1,
    total: 2,
    keyTotal: 0,
    keyTidak: 0,
    measures: `Narasi seksi ${partial.code} mengukur praktik yang bisa diulang.`,
    whyItMatters: "Seksi ini menahan transisi bila dibiarkan.",
    concepts: "Kerangka seksi: gerbang bintang terpisah dari skor butir biasa.",
    framework: "Tidak Berlaku keluar dari penyebut.",
    commonMistakes: "Menjawab Ya karena pernah dilakukan sekali.",
    strengthReading: "Jawaban Ya berarti praktiknya sudah terlihat.",
    gapReading: "Jawaban Tidak di seksi ini menjadi urutan kerja.",
    video: null,
    strengths: [],
    gaps: [],
    ...partial,
  };
}

function document(overrides: Partial<ReportDocument> = {}): ReportDocument {
  return {
    sessionId: "41",
    auditCode: "audit_1_2",
    auditName: "Audit Fase 1 ke 2",
    gateDesc: "Model berulang dan uang terpisah.",
    passingScore: 80,
    respondent: "Sari",
    salutation: null,
    pdfVersion: 2,
    coach: null,
    company: "Dapur Sari",
    businessField: "Katering",
    startYear: 2022,
    externalAuditor: null,
    completedAt: "2026-10-27T05:00:00.000Z",
    status: "SIAP_NAIK",
    score: 81,
    keyTidak: 0,
    keyYa: 13,
    keyTotal: 13,
    ya: 77,
    tidak: 15,
    na: 0,
    total: 92,
    fromPhase: "Cari Makan",
    toPhase: "Cari Duit",
    fromPhaseNumber: 1,
    crisis: "Krisis Kepemimpinan",
    crisisDesc: "Owner mengerjakan hampir semuanya sendiri.",
    nextPhaseDescription: null,
    narrative: {
      headline: "Gerbang sudah terbuka",
      summary: "Semua butir kunci yang dinilai dijawab Ya.",
      implication: "Skor butir biasa sudah melewati ambang.",
      focus: "Bereskan seksi yang masih di bawah 50 persen.",
    },
    closing: {
      closingText: "Naik fase berarti menjaga yang sudah Ya.",
      nextPhaseTitle: "Menuju Cari Duit",
      nextPhasePreview: "Fase berikutnya menuntut delegasi.",
      prepareText: "Tulis satu proses yang masih menempel di owner.",
    },
    skippedKeys: [{ number: 47, sectionName: "Kepatuhan", text: "Pajak UMKM bersyarat omzet." }],
    sections: [
      section({ code: "A", name: "Operasi", score: 90, keyPass: true }),
      section({
        code: "B",
        name: "Penjualan",
        score: 40,
        tidak: 4,
        gaps: [
          {
            number: 14,
            sectionCode: "B",
            sectionName: "Penjualan",
            text: "Apakah harga dihitung dari HPP?",
            isKey: false,
            guidance: "Lihat slide Anda sebelum presentasi.",
            why: "Harga tanpa HPP membuat barang laris tetap rugi.",
            risk: "Makin ramai, makin cepat kas habis.",
            steps: ["Hitung HPP produk terlaris."],
            education: "Harga adalah keputusan biaya.",
            horizon: "30",
          },
        ],
      }),
    ],
    recommendations: [],
    upsells: [],
    triad: [{ id: "system", label: "System Ready", ready: false, scorePct: 40, color: "merah" }],
    agBlock: null,
    whatsapp: null,
    origin: "https://bisnislevelup.id",
    ...overrides,
  };
}

function pages(pdf: Buffer) {
  return pdf.toString("latin1").match(/\/Type \/Page(?!s)/g)?.length ?? 0;
}

function pdfText(pdf: Buffer) {
  const dir = mkdtempSync(path.join(tmpdir(), "laporan-"));
  const file = path.join(dir, "laporan.pdf");
  writeFileSync(file, pdf);
  return execFileSync("pdftotext", [file, "-"], { encoding: "utf8" });
}

test("PDF menyebut dasar skor, gerbang, area risiko, dan menyembunyikan panduan editor", async () => {
  const pdf = await buildReportPdf(document(), { compress: false });
  const text = pdfText(pdf).replace(/\s+/g, " ");
  assert.ok(pages(pdf) > 1);
  assert.match(text, /64 dari 79 butir non-kunci · 13\/13 kunci terpenuhi/);
  assert.match(text, /Gerbang Fase 1: Krisis Kepemimpinan — sudah terlewati/);
  assert.match(text, /Bab 4\. Area risiko/);
  assert.match(text, new RegExp(SIAP_NAIK_RISK_NOTE));
  assert.match(text, /Area risiko · Seksi B\. Penjualan/);
  assert.match(text, new RegExp(KEY_NA_NOTE));
  assert.match(text, /Cari Makan → Cari Duit/);
  assert.match(text, /WIB/);
  assert.match(text, /System Ready/);
  assert.doesNotMatch(text, /slide Anda/);
  assert.doesNotMatch(text, /Jawaban Ya 77/);
  assert.doesNotMatch(text, /Krisis fase ini/);
  assert.match(text, /Narasi seksi B/);
  assert.match(text, /Laporan Audit Fase Bisnis/);
  assert.match(text, /Riza Zacharias/);
  assert.match(text, /Owner Syaamil Group/);
  assert.match(text, /Hal \d+\/\d+/);
  assert.match(text, /Halo Anda/);
  assert.match(text, /Harga SIMULASI/);
  assert.doesNotMatch(text, /youtube\.com/);
  assert.match(pdf.toString("latin1"), /AlbertSans/);
  assert.match(pdf.toString("latin1"), /Cabin/);
});

test("status selain siap naik menandai gerbang belum terlewati", async () => {
  const pdf = await buildReportPdf(
    document({
      status: "BELUM_SIAP",
      score: 40,
      keyYa: 10,
      keyTidak: 3,
      ya: 74,
      tidak: 18,
    }),
    { compress: false },
  );
  const text = pdfText(pdf).replace(/\s+/g, " ");
  assert.match(text, /Gerbang Fase 1: Krisis Kepemimpinan — belum terlewati/);
  assert.match(text, /Area risiko/);
  assert.doesNotMatch(text, /sudah siap naik/);
});

test("belum dapat dinilai menampilkan rekomendasi edukatif tanpa upsell berbayar", async () => {
  const pdf = await buildReportPdf(
    document({
      status: "TIDAK_DAPAT_DINILAI",
      score: null,
      ya: 9,
      tidak: 0,
      keyYa: 9,
      keyTidak: 0,
      keyTotal: 9,
      narrative: null,
      recommendations: [
        {
          id: "1",
          type: "BUKU",
          title: "The E-Myth Revisited",
          author: "Michael E. Gerber",
          description: "Buku ini memisahkan teknisi, manajer, dan owner.",
          url: null,
          critical: false,
        },
      ],
      upsells: [
        {
          code: "audit-coaching",
          name: "Coaching 1:1",
          summary: "Sesi berbayar.",
          modules: null,
          price: 1997000,
          ctaLabel: "Checkout",
          href: "https://bisnislevelup.id/checkout?product=audit-coaching",
          productCode: "audit-coaching",
        },
      ],
      coach: {
        name: "SIMULASI Riza Zacharias",
        roleLine: "Owner Syaamil Group",
        bio: "30+ tahun di dunia bisnis. 5 Fase Bisnis, 4 instrumen audit.",
      },
    }),
    { compress: false },
  );
  const text = pdfText(pdf).replace(/\s+/g, " ");
  assert.match(text, /Tidak ada butir non-kunci yang dinilai · 9\/9 kunci terpenuhi/);
  assert.match(text, /The E-Myth Revisited/);
  assert.match(text, /Riza Zacharias/);
  assert.doesNotMatch(text, /Coaching 1:1/);
  assert.doesNotMatch(text, /Langkah belajar berikutnya/);
  assert.doesNotMatch(text, /SIMULASI/);
});

test("sapaan terisi dipakai di salam, kalimat risiko tetap", async () => {
  const pdf = await buildReportPdf(document({ salutation: "Pak Irvan" }), { compress: false });
  const text = pdfText(pdf).replace(/\s+/g, " ");
  assert.match(text, /Halo Pak Irvan/);
  assert.match(text, new RegExp(SIAP_NAIK_RISK_NOTE));
});

test("video seksi hanya tampil bila URL ada", async () => {
  const pdf = await buildReportPdf(
    document({
      sections: [
        section({
          code: "B",
          name: "Penjualan",
          score: 40,
          video: {
            title: "Deal Maker",
            url: "https://www.youtube.com/watch?v=aR1sN06FXmg",
          },
        }),
      ],
    }),
    { compress: false },
  );
  const text = pdfText(pdf).replace(/\s+/g, " ");
  assert.match(text, /Deal Maker/);
  assert.match(text, /https:\/\/www\.youtube\.com\/watch\?v=aR1sN06FXmg/);
});

test("label A dan G mengikuti skor yang tercetak, bukan gerbang kunci saja", async () => {
  const pdf = await buildReportPdf(
    document({
      auditCode: "audit_4_5",
      status: "DALAM_BAHAYA",
      agBlock: {
        ready: false,
        warning: true,
        a: { id: "a", label: "Lean Again", ready: false, scorePct: 20, color: "merah" },
        g: { id: "g", label: "Identitas", ready: true, scorePct: 0, color: "merah" },
      },
    }),
    { compress: false },
  );
  const text = pdfText(pdf).replace(/\s+/g, " ");
  assert.match(text, /belum sama-sama lulus/);
  assert.match(text, /Lean Again/);
  assert.match(text, /Identitas/);
  assert.doesNotMatch(text, /Salah satu lulus/);
  assert.match(text, /Lulus ambang/);
});

test("teks meta editor tidak ikut tercetak", async () => {
  const pdf = await buildReportPdf(document(), { compress: false });
  const text = pdfText(pdf).replace(/\s+/g, " ");
  assert.doesNotMatch(text, /Panduan instrumen/);
  assert.doesNotMatch(text, /berstatus draf di basis data/);
  assert.doesNotMatch(text, /Butir tanpa panduan peserta/);
  assert.doesNotMatch(text, /SUPPORT_WHATSAPP/);
  assert.doesNotMatch(text, /\bkamu\b/i);
});

test("sapaan kosong tetap Anda dan sapaan terisi sama dengan sampul", async () => {
  const named = pdfText(await buildReportPdf(document({ salutation: "Pak Irvan" }), { compress: false })).replace(/\s+/g, " ");
  assert.match(named, /Halo Pak Irvan/);
  assert.match(named, /Pak Irvan/);
  assert.doesNotMatch(named, /\bkamu\b/i);
  const anon = pdfText(await buildReportPdf(document({ salutation: null, company: "Dapur Sari" }), { compress: false })).replace(/\s+/g, " ");
  assert.match(anon, /Halo Anda/);
  assert.doesNotMatch(anon, /\bkamu\b/i);
});

test("belum siap tidak menampilkan hero lulus saat skor butir biasa penuh", async () => {
  const pdf = await buildReportPdf(
    document({
      status: "BELUM_SIAP",
      score: 100,
      sections: [section({ code: "A", name: "Operasi", score: 70 })],
    }),
    { compress: false },
  );
  const text = pdfText(pdf).replace(/\s+/g, " ");
  assert.match(text, /Gerbang belum/);
  assert.doesNotMatch(text, /100% · Lulus ambang/);
});

test("rekomendasi dibatasi tiga per grup dan bab bernomor", async () => {
  const tools = Array.from({ length: 8 }, (_, index) => ({
    id: String(index),
    type: "TOOL",
    title: `Alat ${index}`,
    author: null,
    description: `Penjelasan alat ${index}.`,
    url: null,
    critical: index === 0,
  }));
  const pdf = await buildReportPdf(document({ recommendations: tools }), { compress: false });
  const text = pdfText(pdf).replace(/\s+/g, " ");
  assert.match(text, /Bab 9\. Langkah berikutnya/);
  assert.match(text, /Lampiran A/);
  assert.match(text, /Alat 0/);
  assert.doesNotMatch(text, /Alat 7/);
  assert.match(text, /https:\/\/www\.bisnislevelup\.id\//);
});

test("kartu generik yang sama tidak mendominasi halaman", async () => {
  const gaps = Array.from({ length: 8 }, (_, index) => ({
    number: index + 1,
    sectionCode: "B",
    sectionName: "Penjualan",
    text: `Butir generik ${index + 1}`,
    isKey: false,
    guidance: null,
    why: "Butir 1 mengukur bagian yang sama di setiap seksi.",
    risk: "Jawaban Tidak pada butir ini menahan skor seksi.",
    steps: ["Tulis bukti minggu ini untuk butir 1."],
    education: null,
    horizon: "30",
  }));
  const pdf = await buildReportPdf(
    document({
      sections: [section({ code: "B", name: "Penjualan", score: 40, tidak: 8, gaps, measures: "Ukuran khusus seksi B." })],
    }),
    { compress: false },
  );
  const text = pdfText(pdf).replace(/\s+/g, " ");
  assert.match(text, /Celah: #1, #2, #3, #4, #5, #6, #7, #8/);
  const sentences = text.split(/(?<=[.!?])\s+/).map((part) => part.trim()).filter((part) => part.length > 40);
  const counts = new Map<string, number>();
  for (const sentence of sentences) counts.set(sentence, (counts.get(sentence) ?? 0) + 1);
  const duplicated = [...counts.values()].filter((count) => count > 1).reduce((sum, count) => sum + count, 0);
  assert.ok(sentences.length > 0);
  assert.ok(duplicated / sentences.length < 0.15, `rasio duplikat ${duplicated}/${sentences.length}`);
});

test("hasil lama memakai PDF teks dan tidak masuk antrean versi baru", () => {
  const legacy = buildLegacyReportPdf(document({ pdfVersion: 1 }));
  const raw = legacy.toString("latin1");
  assert.match(raw, /^%PDF-1\.4/);
  assert.match(raw, /BisnisLevelUp/);
  assert.doesNotMatch(raw, /AlbertSans/);
  assert.equal(sendsNewPdf(1), false);
  assert.equal(sendsNewPdf(2), true);
});
