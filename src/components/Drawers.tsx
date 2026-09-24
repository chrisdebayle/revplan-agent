"use client";

import type { ContextSummary } from "@/lib/types";

const FRAMEWORKS = [
  { name: "ICP Datapoint Framework", desc: "5 datapoint categories; segment calibration across SMB / MM / ENT / Strategic; cycle length and trigger scoring." },
  { name: "RVP Framework", desc: "Referential frame → operational reality → displaced priority → permission question. Outbound messaging and opener construction." },
  { name: "VALID Deal Model", desc: "Five wins (V/A/L/I/D) plus the Assumed–Verbal–Documented standard. Governs deal maturation and forecast gating." },
  { name: "Disposition Science", desc: "10 dispositions, composite metrics, IF/THEN matrix, minimum sample thresholds for campaign diagnostics." },
];

const drawerBase = {
  position: "fixed" as const,
  top: 64,
  right: 0,
  bottom: 0,
  background: "#fff",
  borderLeft: "1px solid var(--db-line, #ddd)",
  boxShadow: "-8px 0 24px rgba(0,0,0,.06)",
  transition: "transform .2s ease",
  overflowY: "auto" as const,
  padding: "22px 20px",
  zIndex: 20,
};

export function FrameworksDrawer({ open }: { open: boolean }) {
  return (
    <div style={{ ...drawerBase, width: 340, transform: open ? "translateX(0)" : "translateX(100%)" }}>
      <div style={{ fontFamily: "var(--db-font-display, inherit)", fontWeight: 700, fontSize: 15, color: "var(--db-dark, #111)", marginBottom: 4 }}>
        Frameworks in play
      </div>
      <div style={{ fontSize: 12, color: "var(--db-muted, #888)", marginBottom: 18 }}>Section 4.1: routed, not substituted.</div>
      {FRAMEWORKS.map((fw) => (
        <div key={fw.name} style={{ padding: 12, marginBottom: 8, borderRadius: 8, border: "1px solid var(--db-line, #ddd)" }}>
          <div style={{ fontFamily: "var(--db-font-display, inherit)", fontWeight: 600, fontSize: 13, color: "var(--db-dark, #111)", marginBottom: 4 }}>{fw.name}</div>
          <div style={{ fontSize: 12.5, lineHeight: 1.55, color: "var(--db-ink-soft, #444)" }}>{fw.desc}</div>
        </div>
      ))}
    </div>
  );
}

const CONTEXT_FIELDS: { key: keyof ContextSummary; label: string }[] = [
  { key: "build", label: "Build" },
  { key: "intake", label: "Intake" },
  { key: "probeAnswers", label: "Probe Answers" },
  { key: "frameworksUsed", label: "Frameworks Used" },
  { key: "unownedAreas", label: "Unowned Areas" },
  { key: "scopingDecisions", label: "Scoping Decisions" },
  { key: "unresolved", label: "Unresolved" },
  { key: "sectionsAdded", label: "Sections Added" },
  { key: "sectionsCut", label: "Sections Cut" },
];

export function ContextDrawer({ open, summary }: { open: boolean; summary: ContextSummary | null }) {
  return (
    <div style={{ ...drawerBase, width: 380, transform: open ? "translateX(0)" : "translateX(100%)" }}>
      <div style={{ fontFamily: "var(--db-font-display, inherit)", fontWeight: 700, fontSize: 15, color: "var(--db-dark, #111)", marginBottom: 4 }}>
        Context Summary
      </div>
      <div style={{ fontSize: 12, color: "var(--db-muted, #888)", marginBottom: 18 }}>§10: ships with every deliverable, verbatim.</div>
      {!summary ? (
        <div style={{ fontSize: 12.5, color: "var(--db-muted, #888)" }}>Populates once scoping starts.</div>
      ) : (
        CONTEXT_FIELDS.map((f) => (
          <div key={f.key} style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 10.5, letterSpacing: ".14em", textTransform: "uppercase", color: "var(--db-primary, #2f5eff)", fontWeight: 700, marginBottom: 4 }}>
              {f.label}
            </div>
            <div style={{ fontFamily: "ui-monospace, Menlo, monospace", fontSize: 12, lineHeight: 1.6, color: "var(--db-ink-soft, #444)", whiteSpace: "pre-wrap" }}>
              {summary[f.key] || "(none)"}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
