"use client";

import { useState } from "react";
import type { ProbeQuestion } from "@/lib/types";

export function ProbeForm({
  questions,
  onSubmit,
  onBuildAnyway,
  submitting,
}: {
  questions: ProbeQuestion[];
  onSubmit: (answers: Record<string, string>) => void;
  onBuildAnyway: () => void;
  submitting: boolean;
}) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const allAnswered = questions.every((q) => (answers[q.field] || "").trim().length > 0);

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
          marginBottom: 4,
        }}
      >
        Gap Probe · §2.2
      </div>
      <div style={{ fontSize: 11.5, color: "var(--db-muted, #888)", marginBottom: 12 }}>
        {questions.length} question{questions.length === 1 ? "" : "s"}, ranked by how much each answer
        changes the plan.
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {questions.map((q) => (
          <div key={q.field}>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--db-dark, #111)", marginBottom: 4 }}>
              {q.rank}. {q.question}
            </div>
            <textarea
              rows={2}
              value={answers[q.field] || ""}
              onChange={(e) => setAnswers((s) => ({ ...s, [q.field]: e.target.value }))}
              style={{
                width: "100%",
                border: "1px solid var(--db-line, #ddd)",
                borderRadius: 8,
                padding: "8px 10px",
                fontFamily: "var(--db-font-body, inherit)",
                fontSize: 13,
                color: "var(--db-dark, #111)",
                outline: "none",
                resize: "vertical",
                boxSizing: "border-box",
              }}
            />
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
        <button
          onClick={() => onSubmit(answers)}
          disabled={!allAnswered || submitting}
          style={{
            flex: 1,
            background: "var(--db-primary, #2f5eff)",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            padding: "10px 0",
            fontFamily: "var(--db-font-display, inherit)",
            fontWeight: 600,
            fontSize: 12.5,
            cursor: !allAnswered || submitting ? "default" : "pointer",
            opacity: !allAnswered || submitting ? 0.5 : 1,
          }}
        >
          Submit answers
        </button>
        <button
          onClick={onBuildAnyway}
          disabled={submitting}
          title="Proceeds without these answers; unresolved fields are logged in the Context Summary, per §2.2."
          style={{
            flex: "none",
            background: "transparent",
            color: "var(--db-muted, #888)",
            border: "1px solid var(--db-line, #ddd)",
            borderRadius: 8,
            padding: "10px 14px",
            fontFamily: "var(--db-font-display, inherit)",
            fontWeight: 600,
            fontSize: 12.5,
            cursor: "pointer",
          }}
        >
          Build anyway
        </button>
      </div>
    </div>
  );
}
