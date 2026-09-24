// Shared between /api/deck (full generation) and /api/deck-revise (single
// slide edits) so the two paths never drift on shape vocabulary or voice.

export const SHAPE_VOCAB = `Available slide shapes, use only these, exactly this JSON shape each:
{"kind":"divider","chapterNumber":"01","title":string,"lede":string}
{"kind":"statement","eyebrow":string,"text":string,"chips":string[]?}
{"kind":"quote","eyebrow":string,"quote":string,"source":string,"note":string?}
{"kind":"cards","eyebrow":string,"columns":2|3|4,"cards":[{"tag":string,"title":string,"body":string,"highlight":boolean?}]}
{"kind":"stats","eyebrow":string,"stats":[{"value":string,"label":string,"detail":string}],"note":string?}
{"kind":"list","eyebrow":string,"items":string[],"note":string?}
{"kind":"gaterow","eyebrow":string,"gates":[{"name":string,"owner":string,"detail":string}],"gateLabel":string,"gateDetail":string,"note":string?}
{"kind":"closing","eyebrow":string,"title":string,"lede":string}`;

export const DECK_VOICE = `You are translating an already-drafted, audited revenue plan into a slide
deck for the business leader who will actually read it, not the doctrine
document, a business artifact. The plan is the source of truth and stays
as-is; the deck is a concise, plain-language projection of it.

Strip every doctrine artifact from what you write: no {{TIER|detail}} tags,
no "Sourced/Derived/Assumed/Requires Data" tier names, no section numbers
(§3, §5.4, etc.), no framework jargon unless the framework's plain-English
substance is what's being described. Translate a tagged claim like "close
rate 15-20% {{A|first test: ...}}" into something like "close rate: 15-20%,
first test is ..." in plain prose: the substance survives, the tagging
syntax does not. Numbers and their basis still matter; just say it in words
a business leader would say out loud, not doctrine notation.

For a "quote" slide's source line: never write "gap-probe" or any other
internal process name; that's this tool's own jargon, not something a
reader should ever see. Say where the words came from in plain terms, e.g.
"FROM THE SCOPING CONVERSATION" or "MANAGER · SCOPING CALL".

Sharp, quantified, operator voice per §11: the deck is even less tolerant
of padding than the plan itself. Zero category vocabulary. One idea per
slide. No em dashes anywhere; use a comma, colon, semicolon, or parentheses
instead.`;

// Chris's own VALID Deal Model is field-tested IP he wants visible in every
// deck this agent produces, not left to the model's discretion per plan.
// The win definitions are generic (from doctrine §4.1); the owners are not,
// they come from this specific plan's ACCOUNT TEAM / DEAL ROLES intake
// field, never invented.
export const RAIL_CHAPTER = `Every deck includes a chapter titled "The Rail", explaining the VALID deal
maturation model. This chapter is mandatory, never optional, never cut for
length, and always exactly these three slides in order:

1. A "divider" slide for "The Rail".
2. A "cards" slide (columns: 3), eyebrow along the lines of "What each win
   requires". Five cards, one per VALID win, in order V, A, L, I, D: tag is
   the single letter, title is the win's name (Validated, Aligned, Locked,
   Invested, Documented), body is that win's one-sentence definition from
   doctrine §4.1's VALID table, in plain words, not copied verbatim if the
   doctrine phrasing reads as internal jargon.
3. A "gaterow" slide, one gate per VALID win, in the same V/A/L/I/D order.
   Each gate's "name" is the win; "detail" is what closes that win for THIS
   specific plan, grounded in the plan's actual deal context, not the
   generic definition restated; "owner" is who carries that win, drawn from
   the intake's ACCOUNT TEAM / DEAL ROLES field. If that field describes
   one person doing everything, every gate's owner is that person; never
   invent named roles (a CTO, a CPO, a second AE) that weren't described.
   gateLabel is "FORECAST GATE"; gateDetail states plainly that the gate
   opens only once every win is documented, per §9.`;
