"use client";

import type { ComponentType, ReactNode } from "react";
import { useDs } from "./DsProvider";
import { EvidenceProse } from "./EvidenceProse";
import type { RevenuePlan, PlanSection } from "@/lib/types";

const reviseBtnStyle = {
  position: "absolute" as const,
  top: 2,
  right: 0,
  fontSize: 11,
  color: "var(--db-muted, #888)",
  background: "none",
  border: "1px solid var(--db-line, #ddd)",
  borderRadius: 14,
  padding: "4px 10px",
  cursor: "pointer" as const,
};

const constructedBadge = (
  <div
    style={{
      fontSize: 11,
      marginBottom: 12,
      display: "inline-block",
      background: "var(--db-tint-warm, #fef3e2)",
      color: "var(--db-accent-800, #92400e)",
      borderRadius: 12,
      padding: "3px 10px",
      fontWeight: 600,
    }}
  >
    Constructed — §4.2, no owned framework
  </div>
);

function FrameworkLinks({ names }: { names: string[] }) {
  if (!names.length) return null;
  return (
    <div style={{ fontSize: 11, marginBottom: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
      {names.map((n) => (
        <span key={n} style={{ color: "var(--db-muted, #888)", borderBottom: "1px dotted var(--db-muted, #888)" }}>
          Routed via {n}
        </span>
      ))}
    </div>
  );
}

function SectionShell({
  section,
  onRevise,
  children,
}: {
  section: PlanSection;
  onRevise?: () => void;
  children: ReactNode;
}) {
  const ds = useDs();
  const Section = ds?.Section as ComponentType<Record<string, unknown>> | undefined;

  const inner = (
    <>
      {section.constructed && constructedBadge}
      <FrameworkLinks names={section.frameworksLinked} />
      {children}
    </>
  );

  return (
    <div style={{ position: "relative" }}>
      {onRevise && (
        <button onClick={onRevise} title="Request a scoped revision to this section" style={reviseBtnStyle}>
          Revise
        </button>
      )}
      {Section ? (
        <Section number={section.number} label={section.label} title={section.title} subtitle={section.subtitle || undefined}>
          {inner}
        </Section>
      ) : (
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 10.5, letterSpacing: ".18em", textTransform: "uppercase", color: "var(--db-muted, #888)", marginBottom: 4 }}>
            {section.number} · {section.label}
          </div>
          <div style={{ fontFamily: "var(--db-font-display, inherit)", fontWeight: 700, fontSize: 19, marginBottom: 4 }}>{section.title}</div>
          {section.subtitle && <div style={{ fontSize: 12.5, color: "var(--db-muted, #888)", marginBottom: 10 }}>{section.subtitle}</div>}
          {inner}
        </div>
      )}
    </div>
  );
}

function KpiTable({ rows }: { rows: RevenuePlan["kpiRows"] }) {
  const ds = useDs();
  const DataTable = ds?.DataTable as ComponentType<Record<string, unknown>> | undefined;
  const columns = ["Metric", "12-Month Target", "Early Risk Signal", "Mitigation"];
  const tableRows = rows.map((r) => [r.metric, r.target, r.riskSignal, r.mitigation]);

  if (DataTable) return <DataTable columns={columns} rows={tableRows} />;
  return (
    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
      <thead>
        <tr>
          {columns.map((c) => (
            <th key={c} style={{ textAlign: "left", padding: "6px 8px", borderBottom: "2px solid var(--db-line, #ddd)", color: "var(--db-muted, #888)" }}>
              {c}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {tableRows.map((row, i) => (
          <tr key={i}>
            {row.map((cell, j) => (
              <td key={j} style={{ padding: "6px 8px", borderBottom: "1px solid var(--db-line, #ddd)" }}>
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function ItemsList({ items }: { items: string[] }) {
  const ds = useDs();
  const RulesList = ds?.RulesList as ComponentType<Record<string, unknown>> | undefined;
  if (RulesList) return <RulesList items={items} variant="hard" />;
  return (
    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 14, lineHeight: 1.7, color: "var(--db-ink-soft, #444)" }}>
      {items.map((it, i) => (
        <li key={i}>{it}</li>
      ))}
    </ul>
  );
}

export function PlanView({
  plan,
  reviseTarget,
  onRevise,
}: {
  plan: RevenuePlan;
  reviseTarget: string | null;
  onRevise: (sectionId: string) => void;
}) {
  const overCeiling = plan.wordCount > plan.wordCeiling;

  return (
    <div style={{ maxWidth: 760, margin: "0 auto" }}>
      <div style={{ borderBottom: "1px solid var(--db-line, #ddd)", paddingBottom: 16, marginBottom: 6 }}>
        <div style={{ fontFamily: "var(--db-font-display, inherit)", fontWeight: 700, fontSize: 26, color: "var(--db-dark, #111)" }}>
          {plan.companyTitle}
        </div>
        <div style={{ fontSize: 12.5, color: overCeiling ? "var(--db-fail, #dc2626)" : "var(--db-muted, #888)", marginTop: 6 }}>
          Draft v{plan.version} · {plan.wordCount} / {Number.isFinite(plan.wordCeiling) ? plan.wordCeiling : "no ceiling"} words
          {overCeiling ? " — over ceiling, see §1 cut order" : ""}
        </div>
        <div style={{ fontSize: 11.5, color: "var(--db-muted, #888)", marginTop: 10 }}>
          Evidence: <sup style={{ color: "var(--db-primary, #2f5eff)", fontWeight: 700 }}>S</sup> Sourced ·{" "}
          <sup style={{ color: "var(--db-accent-700, #b45309)", fontWeight: 700 }}>D</sup> Derived ·{" "}
          <sup style={{ color: "var(--db-accent-800, #92400e)", fontWeight: 700 }}>A</sup> Assumed ·{" "}
          <sup style={{ color: "var(--db-fail, #dc2626)", fontWeight: 700 }}>RD</sup> Requires Data — hover any tag for detail.
        </div>
      </div>

      <SectionShell
        section={{ id: "exec-summary", number: "01", label: "EXECUTIVE SUMMARY", title: "12-month revenue thesis", frameworksLinked: [], bodyMarkup: plan.execSummaryMarkup }}
        onRevise={() => onRevise("exec-summary")}
      >
        <EvidenceProse markup={plan.execSummaryMarkup} />
      </SectionShell>

      {plan.sections.map((section) => {
        const isKpi = /KPI/i.test(section.label);
        const isItemsList = /WEEK ONE|ASSUMPTIONS REGISTER|SCOPE, DEPENDENC/i.test(section.label);
        if (!isKpi && !isItemsList && !section.bodyMarkup.trim()) return null;

        return (
          <SectionShell
            key={section.id}
            section={section}
            onRevise={isKpi || isItemsList ? undefined : () => onRevise(section.id)}
          >
            {isKpi ? (
              <KpiTable rows={plan.kpiRows} />
            ) : isItemsList ? (
              <ItemsList items={plan.weekOneItems} />
            ) : (
              <EvidenceProse markup={section.bodyMarkup} />
            )}
          </SectionShell>
        );
      })}

      {reviseTarget && (
        <div style={{ fontSize: 11, color: "var(--db-primary, #2f5eff)", textAlign: "center", padding: "8px 0" }}>
          Revising — finish your instruction in the composer and send.
        </div>
      )}
    </div>
  );
}
