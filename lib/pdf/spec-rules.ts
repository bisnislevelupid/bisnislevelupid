export type NarrativeBand = "LOW" | "MID" | "HIGH";

export const KEY_NA_LIST_TITLE = "Dinilai tidak berlaku untuk bisnis Anda";

const GROUP_ORDER = ["Kelas", "Ebook & Tool", "Coaching & Mentor", "Video", "Buku & Artikel", "Lainnya"] as const;

export function narrativeBand(score: number | null | undefined): NarrativeBand | null {
  if (typeof score !== "number" || !Number.isFinite(score)) return null;
  if (score < 60) return "LOW";
  if (score < 80) return "MID";
  return "HIGH";
}

export function itemsToward80(yaNonKey: number, assessed: number) {
  if (assessed <= 0) return null;
  return Math.max(0, Math.floor((80 * assessed + 99) / 100) - yaNonKey);
}

export function nonKeyCounts(input: { ya: number; tidak: number; keyYa: number; keyTidak: number }) {
  const ya = input.ya - input.keyYa;
  const assessed = ya + (input.tidak - input.keyTidak);
  return { ya, assessed };
}

export type PriorityItem = {
  title: string;
  reason: string;
  kind: "key" | "section" | "plain" | "prep";
};

export type PrioritySource = {
  status: string;
  sections: Array<{
    code: string;
    name: string;
    score: number | null;
    tidak: number;
    sortOrder: number;
    headline?: string | null;
    gaps: Array<{
      number: number;
      text: string;
      isKey: boolean;
      priority: number;
      shortTitle?: string | null;
      why?: string | null;
    }>;
  }>;
  prep: string[];
};

export function pickPriorities(source: PrioritySource): PriorityItem[] {
  const gaps = source.sections.flatMap((section) => section.gaps.map((gap) => ({ ...gap, section })));
  const keyFails = gaps.filter((gap) => gap.isKey).sort((a, b) => a.priority - b.priority || a.number - b.number);
  if (source.status === "SIAP_NAIK" && keyFails.length === 0 && gaps.every((gap) => gap.isKey)) {
    return source.prep.slice(0, 3).map((title) => ({
      title,
      reason: "Hal ini menjaga gerbang yang sudah terbuka sebelum fase berikutnya menambah beban.",
      kind: "prep" as const,
    }));
  }
  const picked: PriorityItem[] = [];
  const usedSections = new Set<string>();
  for (const gap of keyFails) {
    if (picked.length === 3) break;
    picked.push({
      title: (gap.shortTitle || gap.text).split(/\s+/).slice(0, 12).join(" "),
      reason: gap.why || `Butir kunci #${gap.number} di seksi ${gap.section.name} masih Tidak.`,
      kind: "key",
    });
  }
  const weak = [...source.sections]
    .filter((section) => section.score !== null)
    .sort((a, b) => {
      const bandA = narrativeBand(a.score) === "LOW" ? 0 : narrativeBand(a.score) === "MID" ? 1 : 2;
      const bandB = narrativeBand(b.score) === "LOW" ? 0 : narrativeBand(b.score) === "MID" ? 1 : 2;
      return bandA - bandB || (a.score ?? 0) - (b.score ?? 0) || b.tidak - a.tidak || a.sortOrder - b.sortOrder;
    });
  for (const section of weak) {
    if (picked.length === 3) break;
    const band = narrativeBand(section.score);
    if (band !== "LOW" && band !== "MID") continue;
    if (usedSections.has(section.code)) continue;
    usedSections.add(section.code);
    picked.push({
      title: section.headline || `Seksi ${section.code}. ${section.name}`,
      reason: `Skor butir biasa seksi ini ${section.score}% (band ${band === "LOW" ? "di bawah 60%" : "60–79%"}).`,
      kind: "section",
    });
  }
  const plain = gaps
    .filter((gap) => !gap.isKey)
    .sort((a, b) => (a.section.score ?? 100) - (b.section.score ?? 100) || a.number - b.number);
  for (const gap of plain) {
    if (picked.length === 3) break;
    picked.push({
      title: gap.text.split(/\s+/).slice(0, 12).join(" "),
      reason: `Butir biasa #${gap.number} di seksi ${gap.section.name} masih Tidak.`,
      kind: "plain",
    });
  }
  if (source.status === "SIAP_NAIK" && picked.length === 0) {
    return source.prep.slice(0, 3).map((title) => ({
      title,
      reason: "Hal ini menjaga gerbang yang sudah terbuka sebelum fase berikutnya menambah beban.",
      kind: "prep" as const,
    }));
  }
  return picked.slice(0, 3);
}

export type PlanAction = { code: string; text: string; done: string | null; horizon: "D30" | "D60" | "D90"; source: string };

export function buildHorizonPlan(input: {
  status: string;
  keyActions: PlanAction[];
  sectionActions: PlanAction[];
  statusActions: PlanAction[];
}) {
  const seen = new Set<string>();
  const take = (items: PlanAction[], horizon: PlanAction["horizon"], max: number) => {
    const out: PlanAction[] = [];
    for (const item of items) {
      if (item.horizon !== horizon || seen.has(item.code)) continue;
      seen.add(item.code);
      out.push(item);
      if (out.length === max) break;
    }
    return out;
  };
  if (input.status === "SIAP_NAIK") {
    const prep = input.statusActions.filter((item) => !seen.has(item.code));
    return {
      mode: "prep" as const,
      weekOne: null as string | null,
      d30: prep.slice(0, 6),
      d60: [] as PlanAction[],
      d90: [] as PlanAction[],
    };
  }
  const d30keys = [...input.keyActions].sort((a, b) => a.text.localeCompare(b.text, "id"));
  const d30 = take(d30keys, "D30", 6);
  const overflow = d30keys.filter((item) => item.horizon === "D30" && !seen.has(item.code));
  const d60 = [
    ...take(input.sectionActions.filter((item) => item.source === "LOW"), "D60", 5),
    ...take(overflow.map((item) => ({ ...item, horizon: "D60" as const })), "D60", 5),
    ...take(input.keyActions, "D60", 5),
  ].slice(0, 5);
  for (const item of d60) seen.add(item.code);
  const d90 = [...take(input.sectionActions.filter((item) => item.source === "MID"), "D90", 5), ...take(input.statusActions, "D90", 5)].slice(0, 5);
  const top = d30[0] ?? input.keyActions[0] ?? null;
  return {
    mode: "horizon" as const,
    weekOne: input.status === "DALAM_BAHAYA" && top ? top.text : null,
    d30,
    d60,
    d90,
  };
}

export type ResourceItem = { id: string; type: string; title: string; premium: boolean };

export function resourceGroup(type: string) {
  const code = type.toUpperCase();
  if (code.includes("KELAS")) return "Kelas";
  if (code === "EBOOK" || code === "TOOL") return "Ebook & Tool";
  if (code.includes("COACH") || code === "MENTOR") return "Coaching & Mentor";
  if (code === "VIDEO") return "Video";
  if (code === "BUKU" || code === "ARTIKEL") return "Buku & Artikel";
  return "Lainnya";
}

export function selectResources<T extends ResourceItem>(items: T[], limit = 10, perGroup = 3) {
  const counts = new Map<string, number>();
  const seen = new Set<string>();
  const out: T[] = [];
  const ordered = [...items].sort((a, b) => GROUP_ORDER.indexOf(resourceGroup(a.type) as (typeof GROUP_ORDER)[number]) - GROUP_ORDER.indexOf(resourceGroup(b.type) as (typeof GROUP_ORDER)[number]));
  for (const item of ordered) {
    if (seen.has(item.id) || out.length >= limit) continue;
    const group = resourceGroup(item.type);
    const count = counts.get(group) ?? 0;
    if (count >= perGroup) continue;
    seen.add(item.id);
    counts.set(group, count + 1);
    out.push(item);
  }
  return out;
}

export function contentVisible(status: string | null | undefined, allowed: string[]) {
  return allowed.includes((status || "DRAFT").toUpperCase());
}

export function fallbackCopy(band: NarrativeBand | "STATUS", status?: string) {
  if (band === "LOW") return "Seksi ini masih di bawah 60%. Tutup butir Tidak yang paling kecil minggu ini. Narasi khusus seksi belum disetujui, jadi teks ini adalah cadangan.";
  if (band === "MID") return "Seksi ini berada di 60% sampai di bawah 80%. Pilih dua butir Tidak dan tuntaskan bulan ini. Narasi khusus seksi belum disetujui, jadi teks ini adalah cadangan.";
  if (band === "HIGH") return "Seksi ini sudah di 80% atau lebih. Jaga ritme pemeriksaan mingguannya. Narasi khusus seksi belum disetujui, jadi teks ini adalah cadangan.";
  return `Status ${status ?? "audit"} dibaca dari butir kunci dan skor butir biasa. Narasi status yang disetujui belum tersedia, jadi teks ini adalah cadangan.`;
}
