# Revenue Plan OS, UI Handoff

## What this is
A UI mockup (`Revenue Plan OS.dc.html`) for an interactive agent that builds revenue plans, per `uploads/Revenue_Plan_OS.md` (the operating doctrine, treat as the spec of record). Personal tool: career advancement / job applications, used while interviewing and once in-seat. Not the chrisdebayle.com consulting practice.

## Scope decisions made in this pass
- **Modes: Interview and Internal only.** Client Engagement mode (and its §6.1 structure) is dropped; not needed for this use case.
- **Frameworks retained:** ICP Datapoint, RVP, VALID Deal Model, Disposition Science.
- **Frameworks removed:** Kosoglow 5 Agreements, Cold Calling 2026 New Rules, Execution Value Thesis, all treated as practice-specific IP not needed for personal interview/in-seat use. §3B, §4, §7 were rewritten to not depend on them; §7 is now flagged "Constructed: §4.2, no owned framework" like §8.
- **Open question:** whether the pre-PMF Lean Canvas exit route (§1.1) is in scope. It's not built in this UI. Likely irrelevant here (you're not validating an unbuilt product); confirm before Claude Code build, or just leave unbuilt.

## UI features in the mockup
- Header: stage stepper (Scoping → Drafting → Audit → Ship), Frameworks glossary toggle, Context Summary toggle.
- Left: chat thread with mode picker, intake block card (§2.1), gap-probe Q&A card (§2.2), file-attach control (accepts .md/.pdf/.doc/.docx/.txt/.vtt/.srt), section-scoped "Revise" buttons that pre-fill the composer (§13 iteration protocol).
- Right: living plan document, 9 sections (§5), evidence tiers as hover/click superscripts (S/D/A/RD), KPI table, framework citations link to the glossary drawer.
- Drawers: Frameworks in play (§4.1), Context Summary (§10).

## What's mocked vs. what Claude Code needs to build
This file has **no real logic**; it's a static interaction demo:
1. **Intake + gap-probe flow**: currently hardcoded messages. Needs a real conversational flow that reads the intake block, asks ≤5 ranked probe questions per §2.2 priority order, and gates drafting until required fields clear (or Chris explicitly says "build anyway," logging the bypass).
2. **File ingestion**: attach button is UI-only (no parsing). Needs real PDF/Markdown/transcript extraction and a way to tier extracted claims (Sourced/Derived/Assumed/Requires Data) before they enter the plan.
3. **Plan generation**: sections are static sample text. Needs an LLM call structured around §4 framework routing and §5 output structure, enforcing the evidence standard (§3) and word ceiling (§1) at generation time, not just visually.
4. **Audit pass (§7) and Ship Gate (§9)**: not built at all in this UI. Need a distinct "audit" turn (never in the same pass as drafting) producing severity-tagged findings, and a ship checklist that blocks delivery until it's clean.
5. **Section-scoped revision**: the Revise button only pre-fills chat text; real logic must scope the edit to that section only (§13) and re-run affected audit/ship checks (per the doc's revision-triggers-reaudit rule).
6. **Context Summary (§10) persistence**: currently static sample data. Needs to actually accumulate from the live intake/probe/build state and persist across sessions (this is what makes iteration cheap instead of a rebuild).
7. **Pre-PMF Lean Canvas exit route (§1.1)**: not built. Decide if in scope before building.

## Design system
Built on the Chris Debayle Brand Components bundle (`_ds/chris-debayle-brand-components-.../`). Section, StepLadder, DataTable, RulesList, SpineFrame are real DS components; reuse them in the Claude Code build rather than re-implementing from scratch.
