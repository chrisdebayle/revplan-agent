import { NextResponse } from "next/server";
import { complete, extractJson } from "@/lib/anthropic";
import { loadDoctrine } from "@/lib/doctrine";
import type { IntakeBlock, ProbeQuestion } from "@/lib/types";

export const runtime = "nodejs";

interface ProbeResponse {
  cleared: boolean;
  questions: ProbeQuestion[];
}

export async function POST(req: Request) {
  const { intake } = (await req.json()) as { intake: IntakeBlock };

  const system = `${loadDoctrine()}

---

You are running the Scoping Gate (§2.2 Gap Probe) for this intake, nothing else.

Apply §2.2 exactly:
- Ask a maximum of five questions, only for fields that are missing or genuinely
  ambiguous enough to change a line of the plan. Never ask what the intake already
  answers clearly.
- Rank by the §2.2 priority order: 1) Target (provenance if known, existence/owner
  if unknown) 2) Audience (single hiring manager vs panel/board) 3) Pricing model
  4) Data availability (Client/Internal modes only, never ask this for Interview
  mode per §3 rule 4) 5) Competitive set.
- Assessments (segment/motion mismatch, unrealistic targets) are NOT probe
  questions; they belong in the audit pass. Do not ask them here.
- If nothing meets the bar, cleared is true and questions is empty.

Respond with ONLY this JSON shape, no prose, no markdown fence:
{"cleared": boolean, "questions": [{"field": string, "question": string, "rank": number}]}`;

  const user = `Intake block:\n${JSON.stringify(intake, null, 2)}`;

  try {
    const text = await complete({ system, user, maxTokens: 1024 });
    const parsed = extractJson<ProbeResponse>(text);
    parsed.questions = (parsed.questions || [])
      .sort((a, b) => a.rank - b.rank)
      .slice(0, 5);
    return NextResponse.json(parsed);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Probe generation failed." },
      { status: 500 }
    );
  }
}
