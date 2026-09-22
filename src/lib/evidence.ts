import type { EvidenceTier } from "./types";

export const TIER_LABEL: Record<EvidenceTier, string> = {
  S: "Sourced",
  D: "Derived",
  A: "Assumed",
  RD: "Requires Data",
};

export type EvidenceToken =
  | { kind: "text"; value: string }
  | { kind: "bold"; value: string }
  | { kind: "tier"; tier: EvidenceTier; detail: string };

const TOKEN_RE = /\*\*(.+?)\*\*|\{\{(S|D|A|RD)\|([^}]*)\}\}/g;

/** Splits a section's bodyMarkup into paragraphs of tokens: plain text, **bold**,
 * and {{TIER|detail}} evidence tags the model is instructed to emit per §3. */
export function tokenizeEvidenceMarkup(markup: string): EvidenceToken[][] {
  const paragraphs = markup.split(/\n{2,}/).filter((p) => p.trim().length > 0);
  return paragraphs.map((para) => {
    const tokens: EvidenceToken[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;
    TOKEN_RE.lastIndex = 0;
    while ((match = TOKEN_RE.exec(para)) !== null) {
      if (match.index > lastIndex) {
        tokens.push({ kind: "text", value: para.slice(lastIndex, match.index) });
      }
      if (match[1] !== undefined) {
        tokens.push({ kind: "bold", value: match[1] });
      } else if (match[2] !== undefined) {
        tokens.push({
          kind: "tier",
          tier: match[2] as EvidenceTier,
          detail: (match[3] || "").trim(),
        });
      }
      lastIndex = TOKEN_RE.lastIndex;
    }
    if (lastIndex < para.length) {
      tokens.push({ kind: "text", value: para.slice(lastIndex) });
    }
    return tokens;
  });
}

/** Rough word count that ignores evidence-tag detail text (it never ships as
 * reader-facing prose) so the §1 ceiling is measured against what a reader sees. */
export function countMarkupWords(markup: string): number {
  const stripped = markup.replace(TOKEN_RE, (m, bold) => (bold !== undefined ? bold : ""));
  return stripped.split(/\s+/).filter(Boolean).length;
}
