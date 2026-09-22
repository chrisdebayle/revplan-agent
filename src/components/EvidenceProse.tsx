"use client";

import { tokenizeEvidenceMarkup, TIER_LABEL, type EvidenceToken } from "@/lib/evidence";
import type { EvidenceTier } from "@/lib/types";

const TIER_COLOR: Record<EvidenceTier, string> = {
  S: "var(--db-primary, #2f5eff)",
  D: "var(--db-accent-700, #b45309)",
  A: "var(--db-accent-800, #92400e)",
  RD: "var(--db-fail, #dc2626)",
};

function Token({ token }: { token: EvidenceToken }) {
  if (token.kind === "text") return <>{token.value}</>;
  if (token.kind === "bold") return <b>{token.value}</b>;
  return (
    <sup
      title={`${TIER_LABEL[token.tier]}${token.detail ? ` — ${token.detail}` : ""}`}
      style={{ color: TIER_COLOR[token.tier], fontWeight: 700, cursor: "help", marginLeft: 1 }}
    >
      {token.tier}
    </sup>
  );
}

/** Renders a plan section's bodyMarkup: prose with **bold** and {{TIER|detail}}
 * evidence tags (§3) turned into hoverable superscripts, per paragraph. */
export function EvidenceProse({ markup, className }: { markup: string; className?: string }) {
  const paragraphs = tokenizeEvidenceMarkup(markup);
  return (
    <>
      {paragraphs.map((tokens, i) => (
        <p
          key={i}
          className={className}
          style={{ fontSize: 14.5, lineHeight: 1.68, color: "var(--db-ink-soft, #444)", margin: "0 0 12px" }}
        >
          {tokens.map((t, j) => (
            <Token key={j} token={t} />
          ))}
        </p>
      ))}
    </>
  );
}
