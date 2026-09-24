"use client";

import { Fragment } from "react";
import type { ChatMessage } from "@/lib/types";

const cardStyle = {
  background: "#fff",
  border: "1px solid var(--db-line, #ddd)",
  borderRadius: "var(--db-radius, 6px)",
  padding: "12px 14px",
};

const labelStyle = {
  fontFamily: "var(--db-font-display, inherit)",
  fontWeight: 600,
  fontSize: 10.5,
  letterSpacing: ".18em",
  textTransform: "uppercase" as const,
  color: "var(--db-primary, #2f5eff)",
  marginBottom: 8,
};

export function ChatLog({ messages }: { messages: ChatMessage[] }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {messages.map((msg, i) => {
        if (msg.kind === "agent-text") {
          return (
            <div
              key={i}
              style={{
                maxWidth: "88%",
                background: "var(--db-light, #f4f5f7)",
                borderRadius: "var(--db-radius, 6px)",
                padding: "11px 14px",
                fontSize: 13.5,
                lineHeight: 1.5,
                color: "var(--db-ink-soft, #444)",
              }}
            >
              {msg.text}
            </div>
          );
        }
        if (msg.kind === "user-text") {
          return (
            <div
              key={i}
              style={{
                maxWidth: "88%",
                alignSelf: "flex-end",
                background: "var(--db-primary, #2f5eff)",
                borderRadius: "var(--db-radius, 6px)",
                padding: "11px 14px",
                fontSize: 13.5,
                lineHeight: 1.5,
                color: "#fff",
              }}
            >
              {msg.text}
            </div>
          );
        }
        if (msg.kind === "intake") {
          const rows: [string, string][] = [
            ["Mode", msg.intake.mode === "Interview" ? "Interview / New-in-Seat" : "Internal Operating Plan"],
            ["Company", msg.intake.company],
            ["Role / Seat", msg.intake.role],
            ["Segment Focus", msg.intake.segmentFocus],
            ["Motion", msg.intake.motion],
            ["Target", msg.intake.target],
          ];
          return (
            <div key={i} style={cardStyle}>
              <div style={labelStyle}>Intake Block · §2.1</div>
              <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "6px 12px" }}>
                {rows.map(([label, value]) => (
                  <Fragment key={label}>
                    <span
                      style={{ fontSize: 10.5, letterSpacing: ".06em", textTransform: "uppercase", color: "var(--db-muted, #888)", whiteSpace: "nowrap", paddingTop: 1 }}
                    >
                      {label}
                    </span>
                    <span style={{ fontSize: 13, color: "var(--db-dark, #111)" }}>
                      {value || "(none)"}
                    </span>
                  </Fragment>
                ))}
              </div>
            </div>
          );
        }
        if (msg.kind === "probe-answers") {
          return (
            <div key={i} style={cardStyle}>
              <div style={labelStyle}>Gap Probe · §2.2</div>
              {msg.answers.map((qa, j) => (
                <div key={j} style={{ padding: "8px 0", borderTop: j > 0 ? "1px solid var(--db-line, #ddd)" : "none" }}>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--db-dark, #111)", marginBottom: 4 }}>{qa.question}</div>
                  <div style={{ fontSize: 12.5, color: "var(--db-ink-soft, #444)", lineHeight: 1.5 }}>{qa.answer}</div>
                </div>
              ))}
            </div>
          );
        }
        if (msg.kind === "attachment") {
          return (
            <div key={i} style={cardStyle}>
              <div style={labelStyle}>Reference material attached</div>
              {msg.files.map((f, j) => (
                <div key={j} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 0" }}>
                  <span
                    style={{
                      fontFamily: "var(--db-font-display, inherit)",
                      fontWeight: 700,
                      fontSize: 9,
                      color: "#fff",
                      background: "var(--db-muted, #888)",
                      borderRadius: 4,
                      padding: "2px 5px",
                      flex: "none",
                    }}
                  >
                    {f.ext}
                  </span>
                  <span style={{ fontSize: 12.5, color: "var(--db-dark, #111)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {f.name}
                    {f.unparsed ? ", not parsed yet" : ""}
                  </span>
                </div>
              ))}
            </div>
          );
        }
        return null;
      })}
    </div>
  );
}
