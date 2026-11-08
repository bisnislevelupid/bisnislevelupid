import type { GroupIndicator } from "@/lib/scoring";

export type ReportGap = {
  number: number;
  sectionCode: string;
  sectionName: string;
  text: string;
  isKey: boolean;
  guidance: string | null;
  why: string | null;
  risk: string | null;
  steps: string[];
  education: string | null;
  horizon: string;
};

export type ReportSection = {
  code: string;
  name: string;
  description: string | null;
  score: number | null;
  keyPass: boolean;
  tidak: number;
  ya: number;
  total: number;
  keyTotal: number;
  keyTidak: number;
  measures: string | null;
  whyItMatters: string | null;
  concepts: string | null;
  framework: string | null;
  commonMistakes: string | null;
  strengthReading: string | null;
  gapReading: string | null;
  video: { title: string; url: string } | null;
  strengths: Array<{ number: number; text: string; isKey: boolean }>;
  gaps: ReportGap[];
};

export type ReportRecommendation = {
  id: string;
  type: string;
  title: string;
  author: string | null;
  description: string | null;
  url: string | null;
  critical: boolean;
};

export type ReportUpsell = {
  code: string;
  name: string;
  summary: string | null;
  modules: string | null;
  price: number;
  ctaLabel: string | null;
  href: string;
  productCode: string | null;
};

export type ReportDocument = {
  sessionId: string;
  auditCode: string;
  auditName: string;
  gateDesc: string | null;
  passingScore: number;
  respondent: string | null;
  salutation: string | null;
  pdfVersion: number;
  coach: { name: string; roleLine: string; bio: string } | null;
  company: string | null;
  businessField: string | null;
  startYear: number | null;
  externalAuditor: string | null;
  completedAt: string | null;
  status: string;
  score: number | null;
  keyTidak: number;
  keyYa: number;
  keyTotal: number;
  ya: number;
  tidak: number;
  na: number;
  total: number;
  fromPhase: string;
  toPhase: string;
  fromPhaseNumber: number | null;
  crisis: string | null;
  crisisDesc: string | null;
  nextPhaseDescription: string | null;
  narrative: { headline: string; summary: string; implication: string; focus: string } | null;
  closing: { closingText: string; nextPhaseTitle: string; nextPhasePreview: string; prepareText: string } | null;
  skippedKeys: Array<{ number: number; sectionName: string; text: string }>;
  sections: ReportSection[];
  recommendations: ReportRecommendation[];
  upsells: ReportUpsell[];
  triad: GroupIndicator[] | null;
  agBlock: { ready: boolean; warning: boolean; a: GroupIndicator; g: GroupIndicator } | null;
  whatsapp: string | null;
  origin: string;
};
