import { NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";
import { complete, extractJson } from "@/lib/anthropic";
import { loadDoctrine, SCOPE_OVERRIDE } from "@/lib/doctrine";
import { renderDeckHtml, slugify } from "@/lib/deckTemplate";
import { SHAPE_VOCAB, DECK_VOICE } from "@/lib/deckPrompt";
import type { IntakeBlock, ProbeAnswer, RevenuePlan, DeckChapter } from "@/lib/types";

export const runtime = "nodejs";

interface DeckLLMResponse {
  eyebrow: string;
  chapters: DeckChapter[];
}

const FULL_DECK_SHAPE_RULES = `${SHAPE_VOCAB}
Do not produce a "cover" slide; that's generated separately from the plan's own title.
Every chapter opens with exactly one "divider" slide, chapterNumber is "01","02",... in order,
followed by 1-3 content slides. Thin content gets one slide; do not pad rich content past three.
The very last chapter ends with one "closing" slide after its content slides.`;

const INTERNAL_DECK_STRUCTURE = `This is an Internal Operating Plan (§6.2), an ongoing document for a role
already secured, revisited and iterated as the plan runs, not a one-time
interview pitch. Produce chapters in this order:
1. "The Baseline": from Baseline and Variance Read. Use "stats" for the
   actuals-vs-target numbers if there are enough of them, else "cards".
2. "Capacity & Coverage": from Capacity and Coverage Model. This is a
   constructed (§4.2) area, not a routed framework; say so in plain
   language in a card or note ("built for this plan, not drawn from an
   external model"), never claim it as validated methodology.
3. "The Quarters": from Quarterly Initiative Sequence. If quarters have
   explicit gate criteria to advance, render them as one "gaterow" (each
   quarter is a gate); otherwise use "cards" or "list", one entry per
   quarter, stating what must be true to proceed.
4. "KPI & Risk": from the KPI table, as a "stats" slide (value = target,
   detail = risk signal + mitigation folded into one line).
5. "Assumptions & Open Asks": from the Assumptions Register (weekOneItems).
   Use "list". This is the single place open questions and Requires-Data
   items live; do not scatter them elsewhere.
A quote slide pulling from the gap-probe answers (the reader's own words) is
a strong opener for "The Baseline" chapter if a probe answer reads well as a
quote; use it there, skip it if nothing fits naturally.`;

const INTERVIEW_DECK_STRUCTURE = `This is an Interview / New-in-Seat plan, a pitch for a hiring panel.
Produce chapters in this order:
1. "The Read": from the Outside-In Diagnostic. A quote slide from the
   gap-probe answers (the reader's own words) works well here if one fits.
2. "Days 1-90": from Phase 1.
3. "Months 4-6": from Phase 2.
4. "Months 7-12": from Phase 3.
5. "What Gets Measured": from the KPI table, as a "stats" slide.
6. "Competitive Positioning": only if that section exists in the plan (it's
   optional); skip this chapter entirely if it doesn't.
7. "Week One": from the Week One asks. Use "list". This is the single
   place open questions and Requires-Data items live.
Any section whose content is naturally a five-stage sequence with named
owners (e.g. VALID's five wins where they carry real weight in this plan)
is a strong candidate for "gaterow" instead of "cards".`;

export async function POST(req: Request) {
  const { intake, probeAnswers, plan, shipClean } = (await req.json()) as {
    intake: IntakeBlock;
    probeAnswers: ProbeAnswer[];
    plan: RevenuePlan;
    shipClean: boolean;
  };

  const structureGuide = intake.mode === "Internal" ? INTERNAL_DECK_STRUCTURE : INTERVIEW_DECK_STRUCTURE;

  const system = `${loadDoctrine()}

${SCOPE_OVERRIDE}

---

${DECK_VOICE} This is a distinct, later step from drafting.

${FULL_DECK_SHAPE_RULES}

${structureGuide}

Respond with ONLY this JSON shape, no prose, no markdown fence:
{
  "eyebrow": string,
  "chapters": [{"title": string, "slides": [ ...slide objects per the shape vocabulary... ]}]
}
"eyebrow" is a one-line descriptor for the cover slide (e.g. "Internal Operating Plan · Account Executive, Dallas/Ft. Worth").`;

  const user = `Intake block:\n${JSON.stringify(intake, null, 2)}

Gap probe answers:\n${JSON.stringify(probeAnswers, null, 2)}

Ship Gate status: ${shipClean ? "clean" : "NOT yet clean; note in a small aside that this deck reflects a plan still in progress, only if it fits naturally; do not force it onto a slide that has no room for it"}

Audited plan:\n${JSON.stringify(
    {
      execSummaryMarkup: plan.execSummaryMarkup,
      sections: plan.sections,
      kpiRows: plan.kpiRows,
      weekOneItems: plan.weekOneItems,
    },
    null,
    2
  )}`;

  try {
    const text = await complete({ system, user, maxTokens: 16000 });
    const parsed = extractJson<DeckLLMResponse>(text);

    const slug = slugify(intake.company);
    const manifest = {
      companyTitle: `Revenue Plan: ${intake.company}`,
      eyebrow: parsed.eyebrow,
      // Computed directly rather than left to the model: it's known data,
      // and asking the model to format "who + role + company" reliably
      // produced wrong orderings and dropped names in testing.
      preparedBy: `Prepared by Chris Debayle · ${intake.role || "Seat holder"}, ${intake.company}`,
      chapters: parsed.chapters,
      slug,
      generatedAt: new Date().toISOString(),
      shipClean,
    };

    const html = renderDeckHtml(manifest);
    const dir = path.join(process.cwd(), "public", "decks");
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, `${slug}.html`), html, "utf-8");

    return NextResponse.json({ manifest, path: `/decks/${slug}.html` });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Deck generation failed." },
      { status: 500 }
    );
  }
}
