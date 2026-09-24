export type BuildMode = "Interview" | "Internal";

export interface IntakeBlock {
  mode: BuildMode;
  company: string;
  role: string;
  segmentFocus: string;
  motion: string;
  target: string;
  targetProvenance: string;
  geo: string;
  pricingModel: string;
  accountTeamRoles: string;
  referenceMaterial: string;
  knownCompetitors: string;
  dataAvailable: string;
  whatIAlreadyKnow: string;
  blindSpots: string;
}

export const REQUIRED_INTAKE_FIELDS: (keyof IntakeBlock)[] = [
  "mode",
  "company",
  "role",
  "segmentFocus",
  "motion",
  "target",
];

export const EMPTY_INTAKE: IntakeBlock = {
  mode: "Interview",
  company: "",
  role: "",
  segmentFocus: "",
  motion: "",
  target: "",
  targetProvenance: "",
  geo: "",
  pricingModel: "",
  accountTeamRoles: "",
  referenceMaterial: "",
  knownCompetitors: "",
  dataAvailable: "",
  whatIAlreadyKnow: "",
  blindSpots: "",
};

export interface ProbeQuestion {
  field: string;
  question: string;
  rank: number;
}

export interface ProbeAnswer {
  field: string;
  question: string;
  answer: string;
}

export interface AttachedFile {
  name: string;
  ext: string;
  /** Extracted text, when we were able to parse it client-side. */
  text?: string;
  /** True when we could not extract text (e.g. pdf/docx in this build). */
  unparsed?: boolean;
}

export type ChatMessage =
  | { kind: "agent-text"; text: string }
  | { kind: "user-text"; text: string }
  | { kind: "intake"; intake: IntakeBlock }
  | { kind: "probe"; questions: ProbeQuestion[] }
  | { kind: "probe-answers"; answers: ProbeAnswer[] }
  | { kind: "attachment"; files: AttachedFile[] };

export type EvidenceTier = "S" | "D" | "A" | "RD";

export interface PlanSection {
  id: string;
  number: string;
  label: string;
  title: string;
  subtitle?: string;
  frameworksLinked: string[];
  constructed?: boolean;
  bodyMarkup: string; // prose with {{TIER|detail}} evidence tags inline
}

export interface KpiRow {
  metric: string;
  target: string;
  riskSignal: string;
  mitigation: string;
}

export interface RevenuePlan {
  companyTitle: string;
  execSummaryMarkup: string;
  sections: PlanSection[];
  kpiRows: KpiRow[];
  weekOneItems: string[];
  wordCount: number;
  wordCeiling: number;
  version: number;
}

export interface ContextSummary {
  build: string;
  intake: string;
  probeAnswers: string;
  frameworksUsed: string;
  unownedAreas: string;
  scopingDecisions: string;
  unresolved: string;
  sectionsAdded: string;
  sectionsCut: string;
}

export type Stage = "scoping" | "drafting" | "audit" | "ship";

export type FindingSeverity = "critical" | "moderate" | "minor";
export type FindingStatus = "open" | "accepted" | "resolved";

export interface AuditFinding {
  id: string;
  sectionId: string | null; // matches a PlanSection.id, "exec-summary", or null for plan-wide
  sectionLabel: string; // display label, always present even when sectionId doesn't resolve
  problemType: string; // §7 category: Logic integrity, Internal consistency, Evidence integrity, Framework fidelity, Structural assessment, Credibility risk, Audience fit
  severity: FindingSeverity;
  description: string;
  recommendedFix: string;
  status: FindingStatus;
}

export interface ShipGateCheck {
  key: string;
  label: string;
  passed: boolean;
  detail: string;
}

// --- Deck (final shippable artifact) -----------------------------------
// A fixed vocabulary of slide "shapes" borrowed from deck-example-tradeform.html.
// The deck is a translation layer: plain business language, no evidence-tag
// syntax, no doctrine section numbers; the plan is the source of truth, the
// deck is what a business leader actually reads.

export interface DeckCard {
  tag: string;
  title: string;
  body: string;
  highlight?: boolean;
}

export interface DeckStat {
  value: string;
  label: string;
  detail: string;
}

export interface DeckGate {
  name: string;
  owner: string;
  detail: string;
}

export type DeckSlide =
  | { kind: "cover"; eyebrow: string; title: string; lede: string }
  | { kind: "divider"; chapterNumber: string; title: string; lede: string }
  | { kind: "statement"; eyebrow?: string; text: string; chips?: string[] }
  | { kind: "quote"; eyebrow?: string; quote: string; source: string; note?: string }
  | { kind: "cards"; eyebrow?: string; columns: 2 | 3 | 4; cards: DeckCard[] }
  | { kind: "stats"; eyebrow?: string; stats: DeckStat[]; note?: string }
  | { kind: "list"; eyebrow?: string; items: string[]; note?: string }
  | { kind: "gaterow"; eyebrow?: string; gates: DeckGate[]; gateLabel: string; gateDetail: string; note?: string }
  | { kind: "closing"; eyebrow: string; title: string; lede: string };

export interface DeckChapter {
  title: string;
  slides: DeckSlide[];
}

export interface DeckManifest {
  companyTitle: string;
  eyebrow: string;
  preparedBy: string;
  chapters: DeckChapter[];
  slug: string;
  generatedAt: string;
  shipClean: boolean;
}
