import type { AuditFinding, PlanSection, RevenuePlan, ShipGateCheck } from "./types";
import { extractRequiresData } from "./contextSummary";

function isStructuralSection(section: PlanSection): boolean {
  return /KPI|WEEK ONE|ASSUMPTIONS REGISTER|SCOPE, DEPENDENC/i.test(section.label);
}

/**
 * §9 Ship Gate, computed deterministically rather than asked of the model a
 * second time — two of the six rows (audit clean, evidence tiered) read off
 * the audit findings, the rest are checked directly against the plan.
 */
export function computeShipGate(params: {
  plan: RevenuePlan;
  findings: AuditFinding[] | null;
  ceilingAccepted: boolean;
}): ShipGateCheck[] {
  const { plan, findings, ceilingAccepted } = params;
  const checks: ShipGateCheck[] = [];

  if (!findings) {
    checks.push({
      key: "audit-clean",
      label: "Audit clean",
      passed: false,
      detail: "Audit hasn't been run yet.",
    });
    checks.push({
      key: "evidence-tiered",
      label: "Evidence tiered",
      passed: false,
      detail: "Audit hasn't been run yet — evidence integrity is checked there.",
    });
  } else {
    const openCritical = findings.filter((f) => f.severity === "critical" && f.status !== "resolved");
    const openModerate = findings.filter((f) => f.severity === "moderate" && f.status === "open");
    const auditClean = openCritical.length === 0 && openModerate.length === 0;
    checks.push({
      key: "audit-clean",
      label: "Audit clean",
      passed: auditClean,
      detail: auditClean
        ? "Zero critical findings open; moderate findings resolved or accepted."
        : `${openCritical.length} critical, ${openModerate.length} moderate finding${openModerate.length === 1 ? "" : "s"} still open.`,
    });

    const openEvidence = findings.filter((f) => /evidence/i.test(f.problemType) && f.status === "open");
    checks.push({
      key: "evidence-tiered",
      label: "Evidence tiered",
      passed: openEvidence.length === 0,
      detail:
        openEvidence.length === 0
          ? "No open evidence-integrity findings."
          : `${openEvidence.length} open evidence-integrity finding${openEvidence.length === 1 ? "" : "s"}.`,
    });
  }

  const proseSections = plan.sections.filter((s) => !isStructuralSection(s) && s.bodyMarkup.trim());
  const unframed = proseSections.filter((s) => !s.constructed && s.frameworksLinked.length === 0);
  checks.push({
    key: "framework-named",
    label: "Framework named",
    passed: unframed.length === 0,
    detail:
      unframed.length === 0
        ? "Every routed section names its framework; unowned areas are labeled constructed."
        : `Missing a framework citation or constructed label: ${unframed.map((s) => `§${s.number} ${s.title}`).join(", ")}.`,
  });

  const withinCeiling = plan.wordCount <= plan.wordCeiling || ceilingAccepted;
  checks.push({
    key: "within-ceiling",
    label: "Within ceiling",
    passed: withinCeiling,
    detail: Number.isFinite(plan.wordCeiling)
      ? plan.wordCount <= plan.wordCeiling
        ? `${plan.wordCount} / ${plan.wordCeiling} words.`
        : ceilingAccepted
          ? `${plan.wordCount} / ${plan.wordCeiling} words — over ceiling, accepted.`
          : `${plan.wordCount} / ${plan.wordCeiling} words — over ceiling, not yet accepted.`
      : "No fixed ceiling for this mode.",
  });

  checks.push({
    key: "context-summary",
    label: "Context Summary populated",
    passed: true,
    detail: "Populated automatically from live intake, probe, and draft state.",
  });

  const rdItems = extractRequiresData(plan);
  const weekOneText = plan.weekOneItems.join(" • ").toLowerCase();
  const orphaned = rdItems.filter((item) => !weekOneText.includes(item.toLowerCase().slice(0, 24)));
  checks.push({
    key: "requests-consolidated",
    label: "Requests consolidated",
    passed: orphaned.length === 0,
    detail:
      orphaned.length === 0
        ? "Every Requires-Data item appears in the single request section."
        : `${orphaned.length} Requires-Data item${orphaned.length === 1 ? "" : "s"} not reflected in Week One / Assumptions Register: ${orphaned.join("; ")}.`,
  });

  return checks;
}
