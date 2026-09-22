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
