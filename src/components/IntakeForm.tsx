"use client";

import type { CSSProperties } from "react";
import type { IntakeBlock } from "@/lib/types";

const FIELD_META: { key: keyof IntakeBlock; label: string; required?: boolean; placeholder?: string }[] = [
  { key: "company", label: "Company", required: true },
  { key: "role", label: "Role / Seat", required: true, placeholder: "title being filled or advised" },
  { key: "segmentFocus", label: "Segment Focus", required: true, placeholder: "SMB / Mid-Market / Enterprise / Strategic" },
  { key: "motion", label: "Motion", required: true, placeholder: "New logo / Expansion / Both" },
  { key: "target", label: "Target", required: true, placeholder: "quota, growth %, ARR, or “unknown”" },
  { key: "targetProvenance", label: "Target Provenance", placeholder: "top-down / bottom-up / unknown" },
  { key: "geo", label: "Geo" },
  { key: "pricingModel", label: "Pricing Model", placeholder: "ARR / usage / consumption / platform / hybrid" },
  { key: "referenceMaterial", label: "Reference Material", placeholder: "JD, 10-K, investor deck, prior plan" },
  { key: "knownCompetitors", label: "Known Competitors" },
  { key: "dataAvailable", label: "Data Available", placeholder: "Client / Internal modes only" },
  { key: "whatIAlreadyKnow", label: "What I Already Know" },
  { key: "blindSpots", label: "Blind Spots" },
];

const inputStyle: CSSProperties = {
  width: "100%",
  border: "1px solid var(--db-line, #ddd)",
  borderRadius: 8,
  padding: "8px 10px",
  fontFamily: "var(--db-font-body, inherit)",
  fontSize: 13,
  color: "var(--db-dark, #111)",
  outline: "none",
  boxSizing: "border-box",
};

export function IntakeForm({
  intake,
  onChange,
  onSubmit,
  submitting,
}: {
  intake: IntakeBlock;
  onChange: (next: IntakeBlock) => void;
  onSubmit: () => void;
  submitting: boolean;
}) {
  const set = (key: keyof IntakeBlock, value: string) => onChange({ ...intake, [key]: value });

  return (
    <div style={{ background: "#fff", border: "1px solid var(--db-line, #ddd)", borderRadius: "var(--db-radius, 6px)", padding: "14px 16px" }}>
      <div
        style={{
          fontFamily: "var(--db-font-display, inherit)",
          fontWeight: 600,
          fontSize: 10.5,
          letterSpacing: ".18em",
          textTransform: "uppercase",
          color: "var(--db-primary, #2f5eff)",
          marginBottom: 12,
        }}
      >
        Intake Block · §2.1
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {FIELD_META.map((f) => (
          <label key={f.key} style={{ display: "block" }}>
            <div style={{ fontSize: 10.5, letterSpacing: ".06em", textTransform: "uppercase", color: "var(--db-muted, #888)", marginBottom: 4 }}>
              {f.label}
              {f.required && <span style={{ color: "var(--db-fail, #dc2626)" }}> *</span>}
            </div>
            <input
              style={inputStyle}
              value={intake[f.key]}
              placeholder={f.placeholder}
              onChange={(e) => set(f.key, e.target.value)}
            />
          </label>
        ))}
      </div>

      <button
        onClick={onSubmit}
        disabled={submitting}
        style={{
          marginTop: 14,
          width: "100%",
          background: "var(--db-primary, #2f5eff)",
          color: "#fff",
          border: "none",
          borderRadius: 8,
          padding: "10px 0",
          fontFamily: "var(--db-font-display, inherit)",
          fontWeight: 600,
          fontSize: 12.5,
          cursor: submitting ? "default" : "pointer",
          opacity: submitting ? 0.6 : 1,
        }}
      >
        {submitting ? "Reading intake…" : "Start Scoping"}
      </button>
      <div style={{ fontSize: 10.5, color: "var(--db-muted, #888)", marginTop: 8 }}>
        * required per §2.1. &quot;Target&quot; may be answered &quot;unknown&quot;; that is a valid answer.
      </div>
    </div>
  );
}
