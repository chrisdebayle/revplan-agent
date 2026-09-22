import type { IntakeBlock, ProbeAnswer, RevenuePlan } from "./types";

export function formatIntakeVerbatim(intake: IntakeBlock): string {
  return [
    `MODE: ${intake.mode}`,
    `COMPANY: ${intake.company}`,
    `ROLE / SEAT: ${intake.role}`,
    `SEGMENT FOCUS: ${intake.segmentFocus}`,
    `MOTION: ${intake.motion}`,
    `TARGET: ${intake.target}`,
    `TARGET PROVENANCE: ${intake.targetProvenance || "—"}`,
    `GEO: ${intake.geo || "—"}`,
    `PRICING MODEL: ${intake.pricingModel || "—"}`,
    `REFERENCE MATERIAL: ${intake.referenceMaterial || "—"}`,
    `KNOWN COMPETITORS: ${intake.knownCompetitors || "—"}`,
    `DATA AVAILABLE: ${intake.dataAvailable || "—"}`,
    `WHAT I ALREADY KNOW: ${intake.whatIAlreadyKnow || "—"}`,
    `BLIND SPOTS: ${intake.blindSpots || "—"}`,
  ].join("\n");
}

export function formatProbeAnswersVerbatim(answers: ProbeAnswer[]): string {
  if (!answers.length) return "(none — intake cleared scoping with no probes needed)";
  return answers.map((a) => `Q: ${a.question}\nA: ${a.answer}`).join("\n\n");
}

const RD_TAG_RE = /\{\{RD\|([^}]*)\}\}/g;

/** Pulls every Requires-Data item out of the plan so the ship-gate's
 * "requests consolidated" idea (§9) has one real list behind it, even though
 * the formal ship gate itself isn't built yet in this pass. */
export function extractRequiresData(plan: RevenuePlan): string[] {
  const items = new Set<string>();
  const scan = (text: string) => {
    let m: RegExpExecArray | null;
    RD_TAG_RE.lastIndex = 0;
    while ((m = RD_TAG_RE.exec(text)) !== null) {
      const detail = m[1].trim();
      if (detail) items.add(detail);
    }
  };
  scan(plan.execSummaryMarkup);
  plan.sections.forEach((s) => scan(s.bodyMarkup));
  plan.kpiRows.forEach((r) => {
    if (/requires data/i.test(r.target)) items.add(`KPI target — ${r.metric}: ${r.target}`);
  });
  return Array.from(items);
}
