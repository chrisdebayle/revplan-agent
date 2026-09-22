# Revenue Plan OS

A personal agent for building revenue plans during interviews and once in-seat.
The operating doctrine — mode selection, scoping gate, evidence standard,
framework routing, output structure, audit, ship gate — lives in
[`uploads/Revenue_Plan_OS.md`](uploads/Revenue_Plan_OS.md), the spec of
record. See [`HANDOFF.md`](HANDOFF.md) for the original UI-mockup handoff
notes this build grew out of.

## Running it locally

```bash
npm install
cp .env.local.example .env.local   # then add your own ANTHROPIC_API_KEY
npm run dev
```

Open http://localhost:3000. `.env.local` is gitignored — your key never gets
committed.

Get a key at https://console.anthropic.com/settings/keys. The default model
is `claude-sonnet-5`; override with `ANTHROPIC_MODEL` in `.env.local` if
needed.

## What's built (core loop)

- **Real scoping gate (§2)** — the intake form feeds `/api/probe`, which asks
  Claude to apply §2.2's gap-probe rules and return up to five ranked
  questions, or clear straight to drafting. "Build anyway" bypasses and logs
  the gap.
- **Real drafting (§4, §5/§6.2, §11)** — `/api/draft` sends the full doctrine
  as the system prompt plus the intake, probe answers, and any parsed
  attachments, and gets back a structured plan: sections, KPI table, and
  either Week One asks (Interview mode) or an Assumptions Register (Internal
  mode).
- **Evidence tiers (§3)** — the model tags every figure inline as
  `{{S|...}}` / `{{D|...}}` / `{{A|...}}` / `{{RD|...}}`; the UI renders
  those as hoverable superscripts, exactly like the original mockup.
- **Section-scoped revision (§13)** — click Revise on any prose section,
  finish the instruction in the composer, and `/api/revise` regenerates only
  that section.
- **Context Summary (§10)** — populates live from real state: intake and
  probe answers verbatim, frameworks used, unowned areas, and every
  Requires-Data item pulled straight out of the plan's own evidence tags.
- **Design system reuse** — `Section`, `StepLadder`, `DataTable`, `RulesList`
  from the Chris Debayle Brand Components bundle (`_ds/`) are loaded at
  runtime in `src/components/DsProvider.tsx`, per HANDOFF.md's instruction
  to reuse rather than rebuild them. Falls back to plain styled markup if the
  bundle fails to load.
- **Local persistence** — the whole session (intake, chat log, plan) is
  saved to `localStorage` so a page refresh doesn't lose work. Single slot,
  single user — this is a personal tool, not a multi-project app yet.

## What's not built yet

Carried over from HANDOFF.md's original list, still open:

- **Audit pass (§7)** and **Ship Gate (§9)** as their own distinct turn. The
  stage stepper shows Audit/Ship but they're inert. Revisions that flag
  `target-changed` / `framework-routing-changed` / `assumption-changed` say
  so in the chat log, but nothing automatically re-runs against them yet.
- **File ingestion is partial** — `.md`/`.markdown`/`.txt`/`.srt`/`.vtt` get
  read client-side and passed into the draft prompt as reference context.
  `.pdf`/`.doc`/`.docx` are attached for the record but not parsed. Nothing
  auto-tiers extracted claims yet (§3's tiers still apply, but the model does
  that tiering at draft time, not a dedicated pre-pass).
- **Pre-PMF Lean Canvas exit route (§1.1)** — not built; still an open
  question per HANDOFF.md.
- **Multi-build history** — one localStorage slot, no way to save/switch
  between multiple companies yet.

## A note on generation time and length

Drafting a full plan is one large structured-JSON response covering 9
sections (Interview mode) with inline evidence tags — expect it to take
somewhere in the 30–90 second range, sometimes longer. If it fails with
"Unterminated JSON in model reply," the model hit its output budget before
finishing; `src/app/api/draft/route.ts` sets `maxTokens: 30000`, which should
cover it, but if you see this again, that's the first thing to raise.

## Project layout

```
src/
  app/
    api/probe|draft|revise/route.ts   scoping, drafting, section revision
    layout.tsx, page.tsx, globals.css
  components/
    RevPlanApp.tsx                    the whole app shell + state machine
    IntakeForm.tsx, ProbeForm.tsx, ChatLog.tsx
    PlanView.tsx                      the living plan document
    Drawers.tsx                       Frameworks / Context Summary drawers
    DsProvider.tsx, EvidenceProse.tsx
  lib/
    types.ts, doctrine.ts, anthropic.ts, evidence.ts, contextSummary.ts,
    useLocalState.ts
public/ds/                            copied design-system bundle + CSS
_ds/                                  original design-system source (reference)
uploads/Revenue_Plan_OS.md            doctrine, spec of record
Revenue Plan OS.dc.html               original static mockup (reference)
```
