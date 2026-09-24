// Shared between /api/deck (full generation) and /api/deck-revise (single
// slide edits) so the two paths never drift on shape vocabulary or voice.

export const SHAPE_VOCAB = `Available slide shapes — use only these, exactly this JSON shape each:
{"kind":"divider","chapterNumber":"01","title":string,"lede":string}
{"kind":"statement","eyebrow":string,"text":string,"chips":string[]?}
{"kind":"quote","eyebrow":string,"quote":string,"source":string,"note":string?}
{"kind":"cards","eyebrow":string,"columns":2|3|4,"cards":[{"tag":string,"title":string,"body":string,"highlight":boolean?}]}
{"kind":"stats","eyebrow":string,"stats":[{"value":string,"label":string,"detail":string}],"note":string?}
{"kind":"list","eyebrow":string,"items":string[],"note":string?}
{"kind":"gaterow","eyebrow":string,"gates":[{"name":string,"owner":string,"detail":string}],"gateLabel":string,"gateDetail":string,"note":string?}
{"kind":"closing","eyebrow":string,"title":string,"lede":string}`;

export const DECK_VOICE = `You are translating an already-drafted, audited revenue plan into a slide
deck for the business leader who will actually read it — not the doctrine
document, a business artifact. The plan is the source of truth and stays
as-is; the deck is a concise, plain-language projection of it.

Strip every doctrine artifact from what you write: no {{TIER|detail}} tags,
no "Sourced/Derived/Assumed/Requires Data" tier names, no section numbers
(§3, §5.4, etc.), no framework jargon unless the framework's plain-English
substance is what's being described. Translate a tagged claim like "close
rate 15-20% {{A|first test: ...}}" into something like "close rate: 15-20%,
first test is ..." in plain prose — the substance survives, the tagging
syntax does not. Numbers and their basis still matter; just say it in words
a business leader would say out loud, not doctrine notation.

For a "quote" slide's source line: never write "gap-probe" or any other
internal process name — that's this tool's own jargon, not something a
reader should ever see. Say where the words came from in plain terms, e.g.
"FROM THE SCOPING CONVERSATION" or "MANAGER · SCOPING CALL".

Sharp, quantified, operator voice per §11 — the deck is even less tolerant
of padding than the plan itself. Zero category vocabulary. One idea per
slide.`;
