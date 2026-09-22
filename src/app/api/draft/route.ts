import { NextResponse } from "next/server";
import { complete, extractJson } from "@/lib/anthropic";
import { loadDoctrine, SCOPE_OVERRIDE } from "@/lib/doctrine";
import type { IntakeBlock, ProbeAnswer, PlanSection, KpiRow, AttachedFile } from "@/lib/types";

export const runtime = "nodejs";

interface DraftResponse {
  execSummaryMarkup: string;
  sections: PlanSection[];
  kpiRows: KpiRow[];
  weekOneItems: string[];
  frameworksUsed: string[];
  unownedAreas: string[];
  scopingDecisions: string[];
  sectionsCut: string[];
}

const INTERVIEW_STRUCTURE = `Produce exactly these sections, numbers "01"-"09", per §5 (Interview / New-in-Seat):
01 Executive Summary (label "EXECUTIVE SUMMARY", <=200 words, goes in execSummaryMarkup not sections[])
02 Outside-In Diagnostic
03 Phase 1 — Days 1-90: Reactivate + Found
04 Phase 2 — Months 4-6: Convert
05 Phase 3 — Months 7-12: Systemize
06 KPI & Risk (goes in kpiRows, not sections[] body — still include a short section with number "06" and label "KPI & RISK" whose bodyMarkup is empty string, frameworksLinked citing Disposition Science for Meeting+Activated rate)
07 Competitive Positioning — OPTIONAL, include only if the competitive set is known from intake/probe; mark constructed:true (§4.2, Execution Value Thesis retired — build this section's positioning logic openly instead, still labeled constructed since Execution Value Thesis itself is out of scope for this personal build)
08 Strategic Leverage Plays — OPTIONAL, 2-3 plays max; mark constructed:true
09 What I'd Need in Week One (goes in weekOneItems, not sections[] body — still include a stub section "09" with empty bodyMarkup)
Word ceiling: 1,800-2,200 words total across execSummaryMarkup + section bodies (excluding evidence-tag detail text and KPI/week-one items). If over ceiling, cut in this order: §08 -> §07 -> trim §05 to targets only. Never cut §02, §06, §09.`;

const INTERNAL_STRUCTURE = `Produce these sections per §6.2 (Internal Operating Plan):
01 Executive Summary (<=200 words, board-readable — execSummaryMarkup)
02 Baseline and Variance Read (Sourced tier throughout — an internal plan carrying Assumed figures in its baseline has a data problem before a strategy problem)
03 Capacity and Coverage Model (§4.2 unowned area — mark constructed:true, state every assumption)
04 Quarterly Initiative Sequence (gated — each quarter states what must be true to proceed)
05 KPI and Risk Table (kpiRows)
06 Assumptions Register (every Assumed and Requires Data item, with owner and test date — weekOneItems)
No fixed word ceiling, but section discipline still applies — don't pad.`;

export async function POST(req: Request) {
  const { intake, probeAnswers, attachments } = (await req.json()) as {
    intake: IntakeBlock;
    probeAnswers: ProbeAnswer[];
    attachments: AttachedFile[];
  };

  const structure = intake.mode === "Internal" ? INTERNAL_STRUCTURE : INTERVIEW_STRUCTURE;

  const system = `${loadDoctrine()}

${SCOPE_OVERRIDE}

---

You are drafting the plan itself. Scoping has already cleared — do not ask
questions, just build, per §1-§6, §11 style, and §3 evidence standard.

${structure}

Evidence tagging (§3) is mandatory and mechanical: every figure, rate, or
quantified claim gets an inline tag immediately after it in this exact form:
{{S|source named inline}} for Sourced, {{D|the math, shown}} for Derived,
{{A|the range plus the named first test}} for Assumed, {{RD|the named data pull}}
for Requires Data. No unlabeled figures. Interview mode has no internal data
(§3 rule 4) — never fabricate a closed/lost analysis, win-rate baseline, or
cycle-time figure; supply the method and the named pull instead, tagged RD.
Keep every tag's detail to a short fragment, well under 15 words — a citation
or a named pull, not a restated sentence. This is JSON-embedded, so verbosity
here costs real output budget; be as terse as the claim allows without losing
the citation.
Routed frameworks (§4.1) must be named in the section that uses them, listed
in each section's frameworksLinked array using their exact names (e.g. "ICP
Datapoint Framework", "RVP Framework", "VALID Deal Model", "Disposition
Science"). §4.2 unowned areas (pricing/packaging, capacity/quota modeling,
pipeline coverage math, compensation design, territory allocation, and — for
this build — Competitive Positioning and Strategic Leverage Plays since
Execution Value Thesis is out of scope) must set constructed:true and must
not borrow a routed framework's authority.

Style (§11): sharp, quantified, operator voice. Zero category vocabulary
(transformation, optimize, unlock, synergy, flywheel, supercharge,
best-in-class, leverage-as-verb). Recommendation first, reasoning second. No
em dashes, curly apostrophes only. Tight is a feature, not a shortfall — stay
inside the word ceiling comfortably rather than writing to fill space.

Output budget is finite. Do not draft supporting reasoning, an outline, or
commentary before or after the JSON — those cost tokens the plan itself
needs. Respond with ONLY this JSON shape, starting immediately with "{" and
ending with "}", no prose, no markdown fence:
{
  "execSummaryMarkup": string,
  "sections": [{"id": string, "number": string, "label": string, "title": string, "subtitle": string|null, "frameworksLinked": string[], "constructed": boolean, "bodyMarkup": string}],
  "kpiRows": [{"metric": string, "target": string, "riskSignal": string, "mitigation": string}],
  "weekOneItems": string[],
  "frameworksUsed": string[],
  "unownedAreas": string[],
  "scopingDecisions": string[],
  "sectionsCut": string[]
}`;

  const attachmentContext = (attachments || [])
    .filter((f) => f.text)
    .map((f) => `--- ${f.name} ---\n${f.text}`)
    .join("\n\n");

  const user = `Intake block:\n${JSON.stringify(intake, null, 2)}

Gap probe answers:\n${JSON.stringify(probeAnswers, null, 2)}
${attachmentContext ? `\nAttached reference material (tier every claim you pull from this — attachment text is not automatically Sourced):\n${attachmentContext}` : ""}`;

  try {
    const text = await complete({ system, user, maxTokens: 30000 });
    const parsed = extractJson<DraftResponse>(text);
    return NextResponse.json(parsed);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Draft generation failed." },
      { status: 500 }
    );
  }
}
