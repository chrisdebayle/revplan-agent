import { NextResponse } from "next/server";
import { complete, extractJson } from "@/lib/anthropic";
import { loadDoctrine, SCOPE_OVERRIDE } from "@/lib/doctrine";
import type { IntakeBlock, ProbeAnswer, RevenuePlan, PlanSection, FindingSeverity } from "@/lib/types";

export const runtime = "nodejs";

interface RawFinding {
  sectionId: string | null;
  sectionLabel: string;
  problemType: string;
  severity: FindingSeverity;
  description: string;
  recommendedFix: string;
}

interface AuditResponse {
  findings: RawFinding[];
}

/**
 * The KPI table and Week One / Assumptions Register sections carry their
 * real content in plan.kpiRows / plan.weekOneItems, not bodyMarkup — that's
 * a rendering convention (PlanView.tsx renders them as a DataTable/RulesList
 * instead of prose), not a content gap. Handing the model an empty
 * bodyMarkup for them reads as a drafting failure, so synthesize the actual
 * content into a reviewable form instead.
 */
function sectionForAudit(s: PlanSection, plan: RevenuePlan): PlanSection {
  if (/KPI/i.test(s.label)) {
    return {
      ...s,
      bodyMarkup: plan.kpiRows
        .map((r) => `${r.metric} — target: ${r.target}; risk signal: ${r.riskSignal}; mitigation: ${r.mitigation}`)
        .join("\n\n"),
    };
  }
  if (/WEEK ONE|ASSUMPTIONS REGISTER|SCOPE, DEPENDENC/i.test(s.label)) {
    return { ...s, bodyMarkup: plan.weekOneItems.map((item, i) => `${i + 1}. ${item}`).join("\n\n") };
  }
  return s;
}

export async function POST(req: Request) {
  const { intake, probeAnswers, plan } = (await req.json()) as {
    intake: IntakeBlock;
    probeAnswers: ProbeAnswer[];
    plan: RevenuePlan;
  };

  const validIds = ["exec-summary", ...plan.sections.map((s) => s.id)];

  const system = `${loadDoctrine()}

${SCOPE_OVERRIDE}

---

You are running the §7 Audit Pass on an already-drafted plan. This is a
separate cognitive task from drafting — you are reviewing, not writing.
Auditing and drafting are different jobs; do not rewrite anything, only
report on it.

Check across all seven §7 categories: Logic integrity, Internal consistency,
Evidence integrity, Framework fidelity, Structural assessment, Credibility
risk, Audience fit. Report only genuine issues — do not manufacture findings
to pad the list or to cover every category if a category is clean. A clean
plan can legitimately have zero or few findings.

The KPI & Risk and Week One / Assumptions Register sections' bodyMarkup below
has been synthesized from their real structured data (rows and list items)
into reviewable prose for you — that's a rendering convention, not a content
gap, so don't flag "empty section" for them; audit their actual content
(row completeness, evidence tiers, orphaned asks) like any other section.

For each finding, set sectionId to the id of the single section it's about,
chosen from this exact list: ${JSON.stringify(validIds)}. Use null only for
a plan-wide issue that isn't about one section (e.g. a Phase 1 target that
contradicts a Phase 3 one). sectionLabel is a short human-readable label
regardless (e.g. "§3 Phase 1" or "Plan-wide").

Severity is critical / moderate / minor, per §7's own definition — critical
means the plan is not shippable with this open (a fabricated number, a
routed framework generating a substitute, a target that contradicts stated
capacity); moderate means it would draw a real challenge from a sharp CRO
reader but isn't disqualifying; minor is a polish note.

Respond with ONLY this JSON shape, no prose, no markdown fence:
{"findings": [{"sectionId": string|null, "sectionLabel": string, "problemType": string, "severity": "critical"|"moderate"|"minor", "description": string, "recommendedFix": string}]}`;

  const user = `Intake block:\n${JSON.stringify(intake, null, 2)}

Gap probe answers:\n${JSON.stringify(probeAnswers, null, 2)}

Plan under audit:\n${JSON.stringify(
    {
      execSummaryMarkup: plan.execSummaryMarkup,
      sections: plan.sections.map((s) => sectionForAudit(s, plan)),
      wordCount: plan.wordCount,
      wordCeiling: plan.wordCeiling,
    },
    null,
    2
  )}`;

  try {
    const text = await complete({ system, user, maxTokens: 8000 });
    const parsed = extractJson<AuditResponse>(text);
    const findings = (parsed.findings || []).map((f, i) => ({
      id: `finding-${Date.now()}-${i}`,
      sectionId: validIds.includes(f.sectionId || "") ? f.sectionId : null,
      sectionLabel: f.sectionLabel,
      problemType: f.problemType,
      severity: f.severity,
      description: f.description,
      recommendedFix: f.recommendedFix,
      status: "open" as const,
    }));
    return NextResponse.json({ findings });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Audit failed." },
      { status: 500 }
    );
  }
}
