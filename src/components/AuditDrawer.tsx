"use client";

import type { AuditFinding, FindingSeverity, RevenuePlan, ShipGateCheck } from "@/lib/types";

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

const SEVERITY_COLOR: Record<FindingSeverity, string> = {
  critical: "var(--db-fail, #dc2626)",
  moderate: "var(--db-accent-800, #92400e)",
  minor: "var(--db-muted, #888)",
};

const btnStyle = {
  fontSize: 11,
  fontWeight: 600,
  padding: "4px 10px",
  borderRadius: 12,
  border: "1px solid var(--db-line, #ddd)",
  background: "transparent",
  cursor: "pointer" as const,
};

function FindingCard({
  finding,
  onAccept,
  onResolveDismiss,
  onJumpToRevise,
}: {
  finding: AuditFinding;
  onAccept: () => void;
  onResolveDismiss: () => void;
  onJumpToRevise: () => void;
}) {
  return (
    <div
      style={{
        border: `1px solid ${finding.status === "open" ? SEVERITY_COLOR[finding.severity] : "var(--db-line, #ddd)"}`,
        borderRadius: 8,
        padding: 12,
        marginBottom: 10,
        opacity: finding.status === "open" ? 1 : 0.6,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
        <span style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: SEVERITY_COLOR[finding.severity] }}>
          {finding.severity}
        </span>
        <span style={{ fontSize: 10.5, color: "var(--db-muted, #888)" }}>{finding.sectionLabel}</span>
      </div>
      <div style={{ fontSize: 11, fontWeight: 600, color: "var(--db-dark, #111)", marginBottom: 4 }}>{finding.problemType}</div>
      <div style={{ fontSize: 12.5, color: "var(--db-ink-soft, #444)", lineHeight: 1.5, marginBottom: 6 }}>{finding.description}</div>
      <div style={{ fontSize: 12, color: "var(--db-muted, #888)", lineHeight: 1.5, marginBottom: 8 }}>
        <b>Fix:</b> {finding.recommendedFix}
      </div>
      {finding.status !== "open" ? (
        <div style={{ fontSize: 11, color: "var(--db-primary, #2f5eff)" }}>{finding.status === "accepted" ? "Accepted" : "Resolved"}</div>
      ) : (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {finding.sectionId && (
            <button onClick={onJumpToRevise} style={btnStyle}>
              Revise section
            </button>
          )}
          {finding.severity !== "critical" && (
            <button onClick={onAccept} style={btnStyle}>
              Accept
            </button>
          )}
          {finding.severity === "minor" && (
            <button onClick={onResolveDismiss} style={btnStyle}>
              Dismiss
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function ShipGateRow({ check }: { check: ShipGateCheck }) {
  return (
    <div style={{ display: "flex", gap: 10, padding: "8px 0", borderTop: "1px solid var(--db-line, #ddd)" }}>
      <span style={{ flex: "none", width: 18, color: check.passed ? "var(--db-pass, #16a34a)" : "var(--db-fail, #dc2626)", fontWeight: 700 }}>
        {check.passed ? "✓" : "✗"}
      </span>
      <div>
        <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--db-dark, #111)" }}>{check.label}</div>
        <div style={{ fontSize: 11.5, color: "var(--db-muted, #888)" }}>{check.detail}</div>
      </div>
    </div>
  );
}

export function AuditDrawer({
  open,
  plan,
  findings,
  shipChecks,
  auditBusy,
  onRunAudit,
  onAccept,
  onDismiss,
  onJumpToRevise,
  ceilingAccepted,
  onAcceptCeiling,
}: {
  open: boolean;
  plan: RevenuePlan | null;
  findings: AuditFinding[] | null;
  shipChecks: ShipGateCheck[] | null;
  auditBusy: boolean;
  onRunAudit: () => void;
  onAccept: (id: string) => void;
  onDismiss: (id: string) => void;
  onJumpToRevise: (sectionId: string) => void;
  ceilingAccepted: boolean;
  onAcceptCeiling: () => void;
}) {
  const critical = (findings || []).filter((f) => f.severity === "critical");
  const moderate = (findings || []).filter((f) => f.severity === "moderate");
  const minor = (findings || []).filter((f) => f.severity === "minor");
  const shipClean = shipChecks?.every((c) => c.passed) ?? false;

  return (
    <div style={{ ...drawerBase, width: 400, transform: open ? "translateX(0)" : "translateX(100%)" }}>
      <div style={{ fontFamily: "var(--db-font-display, inherit)", fontWeight: 700, fontSize: 15, color: "var(--db-dark, #111)", marginBottom: 4 }}>
        Audit &amp; Ship Gate
      </div>
      <div style={{ fontSize: 12, color: "var(--db-muted, #888)", marginBottom: 16 }}>§7 audit, run as its own pass — §9 gates delivery.</div>

      {!plan ? (
        <div style={{ fontSize: 12.5, color: "var(--db-muted, #888)" }}>Draft a plan first.</div>
      ) : (
        <>
          <button
            onClick={onRunAudit}
            disabled={auditBusy}
            style={{
              width: "100%",
              background: "var(--db-primary, #2f5eff)",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              padding: "10px 0",
              fontFamily: "var(--db-font-display, inherit)",
              fontWeight: 600,
              fontSize: 12.5,
              cursor: auditBusy ? "default" : "pointer",
              opacity: auditBusy ? 0.6 : 1,
              marginBottom: 18,
            }}
          >
            {auditBusy ? "Auditing…" : findings ? "Re-run Audit" : "Run Audit"}
          </button>

          {findings && findings.length === 0 && (
            <div style={{ fontSize: 12.5, color: "var(--db-ink-soft, #444)", marginBottom: 16 }}>No findings — clean read.</div>
          )}

          {findings && findings.length > 0 && (
            <div style={{ marginBottom: 18 }}>
              {[...critical, ...moderate, ...minor].map((f) => (
                <FindingCard
                  key={f.id}
                  finding={f}
                  onAccept={() => onAccept(f.id)}
                  onResolveDismiss={() => onDismiss(f.id)}
                  onJumpToRevise={() => f.sectionId && onJumpToRevise(f.sectionId)}
                />
              ))}
            </div>
          )}

          {shipChecks && (
            <div style={{ borderTop: "1px solid var(--db-line, #ddd)", paddingTop: 14 }}>
              <div style={{ fontFamily: "var(--db-font-display, inherit)", fontWeight: 700, fontSize: 13, marginBottom: 2 }}>Ship Gate · §9</div>
              <div
                style={{
                  fontSize: 12.5,
                  fontWeight: 700,
                  color: shipClean ? "var(--db-pass, #16a34a)" : "var(--db-fail, #dc2626)",
                  marginBottom: 4,
                }}
              >
                {shipClean ? "Ship-clean." : "Not ship-clean yet."}
              </div>
              {shipChecks.map((c) => (
                <ShipGateRow key={c.key} check={c} />
              ))}
              {!ceilingAccepted && shipChecks.some((c) => c.key === "within-ceiling" && !c.passed) && (
                <button onClick={onAcceptCeiling} style={{ ...btnStyle, marginTop: 10 }}>
                  Accept over ceiling
                </button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
