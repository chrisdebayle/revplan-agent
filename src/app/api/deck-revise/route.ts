import { NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";
import { complete, extractJson } from "@/lib/anthropic";
import { loadDoctrine, SCOPE_OVERRIDE } from "@/lib/doctrine";
import { SHAPE_VOCAB, DECK_VOICE } from "@/lib/deckPrompt";
import { renderDeckHtml } from "@/lib/deckTemplate";
import type { IntakeBlock, RevenuePlan, DeckManifest, DeckSlide } from "@/lib/types";

export const runtime = "nodejs";

interface ReviseResponse {
  slide: DeckSlide;
  note: string;
}

export async function POST(req: Request) {
  const { intake, plan, manifest, chapterIndex, slideIndex, instruction } = (await req.json()) as {
    intake: IntakeBlock;
    plan: RevenuePlan;
    manifest: DeckManifest;
    chapterIndex: number;
    slideIndex: number;
    instruction: string;
  };

  const chapter = manifest.chapters[chapterIndex];
  if (!chapter || !chapter.slides[slideIndex]) {
    return NextResponse.json({ error: "That slide no longer exists — the deck may have changed. Regenerate and try again." }, { status: 400 });
  }
  const targetSlide = chapter.slides[slideIndex];

  const system = `${loadDoctrine()}

${SCOPE_OVERRIDE}

---

${DECK_VOICE}

You are revising ONE slide in an already-generated deck, per a scoped
instruction — this is a content edit, not a restructure. Do not add,
remove, or reorder slides or chapters; do not move this slide to a
different chapter. You may change the slide's "kind" if the instruction
calls for a different visual treatment (e.g. turning a cards slide into a
stats slide), but the result must still be exactly one slide object from
the shape vocabulary below, and it must still belong where it is.

Ground any new content in the plan provided below — do not invent a claim
the plan doesn't support. Stay consistent with the other slides in this
chapter (shown for context, not to be modified).

${SHAPE_VOCAB}

Respond with ONLY this JSON shape, no prose, no markdown fence:
{"slide": { ...one slide object per the shape vocabulary... }, "note": string}
"note" is one sentence on what changed, for the chat log.`;

  const user = `Intake block:\n${JSON.stringify(intake, null, 2)}

Plan (source of truth — ground the revision in this):\n${JSON.stringify(
    {
      execSummaryMarkup: plan.execSummaryMarkup,
      sections: plan.sections,
      kpiRows: plan.kpiRows,
      weekOneItems: plan.weekOneItems,
    },
    null,
    2
  )}

Chapter "${chapter.title}" — all its slides, for consistency (only slide index ${slideIndex} is in scope to change):\n${JSON.stringify(chapter.slides, null, 2)}

Slide to revise:\n${JSON.stringify(targetSlide, null, 2)}

Revision instruction: ${instruction}`;

  try {
    const text = await complete({ system, user, maxTokens: 4096 });
    const parsed = extractJson<ReviseResponse>(text);

    const updatedManifest: DeckManifest = {
      ...manifest,
      generatedAt: new Date().toISOString(),
      chapters: manifest.chapters.map((ch, i) =>
        i !== chapterIndex ? ch : { ...ch, slides: ch.slides.map((s, j) => (j === slideIndex ? parsed.slide : s)) }
      ),
    };

    const html = renderDeckHtml(updatedManifest);
    const dir = path.join(process.cwd(), "public", "decks");
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, `${updatedManifest.slug}.html`), html, "utf-8");

    return NextResponse.json({ manifest: updatedManifest, path: `/decks/${updatedManifest.slug}.html`, note: parsed.note });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Slide revision failed." },
      { status: 500 }
    );
  }
}
