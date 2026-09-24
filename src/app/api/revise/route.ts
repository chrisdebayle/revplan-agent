import { NextResponse } from "next/server";
import { complete, extractJson } from "@/lib/anthropic";
import { loadDoctrine, SCOPE_OVERRIDE } from "@/lib/doctrine";
import type { IntakeBlock, ProbeAnswer, PlanSection } from "@/lib/types";

export const runtime = "nodejs";

interface ReviseResponse {
  section: PlanSection;
  note: string;
  flags: string[];
}

export async function POST(req: Request) {
  const { intake, probeAnswers, section, instruction, otherSectionTitles } = (await req.json()) as {
    intake: IntakeBlock;
    probeAnswers: ProbeAnswer[];
    section: PlanSection;
    instruction: string;
    otherSectionTitles: string[];
  };

  const system = `${loadDoctrine()}

${SCOPE_OVERRIDE}

---

You are performing a section-scoped revision per §13 Iteration Protocol.
Revise ONLY the section given below, per the instruction. Do not touch
anything outside it and do not restate or summarize the rest of the plan.
Bounded instructions produce controllable revisions; this is the point.

Keep the same JSON section schema and the same {{TIER|detail}} evidence-tag
format (§3). Keep §11 style. If this revision changes a target, an
assumption, or a framework's routing, list that in "flags" (e.g.
"target-changed", "framework-routing-changed", "assumption-changed") so the
caller knows to re-run the affected audit/ship checks per §13's last rule;
otherwise leave flags empty.

Respond with ONLY this JSON shape, no prose, no markdown fence:
{
  "section": {"id": string, "number": string, "label": string, "title": string, "subtitle": string|null, "frameworksLinked": string[], "constructed": boolean, "bodyMarkup": string},
  "note": string,
  "flags": string[]
}`;

  const user = `Intake block:\n${JSON.stringify(intake, null, 2)}

Gap probe answers:\n${JSON.stringify(probeAnswers, null, 2)}

Other section titles in the plan (for consistency only, do not revise these):\n${(otherSectionTitles || []).join(", ")}

Section to revise:\n${JSON.stringify(section, null, 2)}

Revision instruction: ${instruction}`;

  try {
    const text = await complete({ system, user, maxTokens: 4096 });
    const parsed = extractJson<ReviseResponse>(text);
    return NextResponse.json(parsed);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Revision failed." },
      { status: 500 }
    );
  }
}
