"use client";

import type { ComponentType } from "react";
import { useDs } from "./DsProvider";
import type { Stage } from "@/lib/types";

const STAGE_LABELS = ["Scoping", "Drafting", "Audit", "Ship"];

function stageIndex(stage: Stage): number {
  return STAGE_LABELS.findIndex((l) => l.toLowerCase() === stage);
}

const pillBtn = {
  whiteSpace: "nowrap" as const,
  fontFamily: "var(--db-font-display, inherit)",
  fontWeight: 600,
  fontSize: 11.5,
  letterSpacing: ".03em",
  padding: "7px 13px",
  borderRadius: 20,
  border: "1px solid var(--db-line, #ddd)",
  background: "transparent",
  color: "var(--db-ink-soft, #444)",
  cursor: "pointer" as const,
};

export function Header({
  stage,
  onToggleFrameworks,
  onToggleContext,
  onToggleAudit,
}: {
  stage: Stage;
  onToggleFrameworks: () => void;
  onToggleContext: () => void;
  onToggleAudit: () => void;
}) {
  const ds = useDs();
  const StepLadder = ds?.StepLadder as ComponentType<Record<string, unknown>> | undefined;
  const active = stageIndex(stage);

  return (
    <div
      style={{
        height: 64,
        flex: "none",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 22px",
        borderBottom: "1px solid var(--db-line, #ddd)",
        gap: 20,
      }}
    >
      <div style={{ display: "flex", alignItems: "baseline", gap: 12, minWidth: 0 }}>
        <span style={{ fontFamily: "var(--db-font-display, inherit)", fontWeight: 700, fontSize: 17, color: "var(--db-dark, #111)", whiteSpace: "nowrap" }}>
          Revenue Plan OS
        </span>
      </div>
      <div style={{ flex: "none", width: 450, display: "flex", justifyContent: "center" }}>
        {StepLadder ? (
          <StepLadder steps={STAGE_LABELS} activeIndex={active} />
        ) : (
          <div style={{ display: "flex", gap: 8, fontSize: 11.5, color: "var(--db-muted, #888)" }}>
            {STAGE_LABELS.map((l, i) => (
              <span key={l} style={{ fontWeight: i === active ? 700 : 400, color: i === active ? "var(--db-primary, #2f5eff)" : undefined }}>
                {l}
                {i < STAGE_LABELS.length - 1 ? " →" : ""}
              </span>
            ))}
          </div>
        )}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, flex: "none", whiteSpace: "nowrap" }}>
        <button onClick={onToggleFrameworks} style={pillBtn}>
          Frameworks
        </button>
        <button onClick={onToggleAudit} style={pillBtn}>
          Audit &amp; Ship
        </button>
        <button onClick={onToggleContext} style={pillBtn}>
          Context Summary
        </button>
      </div>
    </div>
  );
}
