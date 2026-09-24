import fs from "node:fs";
import path from "node:path";

let cached: string | null = null;

/**
 * Loads the operating doctrine verbatim (uploads/Revenue_Plan_OS.md is the spec
 * of record per HANDOFF.md) so the system prompt never drifts from the document
 * Chris edits directly.
 */
export function loadDoctrine(): string {
  if (cached) return cached;
  const p = path.join(process.cwd(), "uploads", "Revenue_Plan_OS.md");
  cached = fs.readFileSync(p, "utf-8");
  return cached;
}

/**
 * Kosoglow 5 Agreements is fully retired at the doctrine level now (see the
 * "Retired, do not cite" line in §4.1); no override needed for it anymore.
 * Cold Calling 2026 New Rules and Execution Value Thesis are still listed as
 * live routed frameworks in the doctrine's own §4.1 table, so this override
 * still has to suppress those two: without it the model routes to them
 * anyway, since they read as valid citations straight out of the doctrine
 * it was just given. Client Engagement mode is a build-scope decision from
 * HANDOFF.md, not a doctrine edit.
 *
 * IMPORTANT: this text itself goes into the system prompt, so it must never
 * name a framework we want to disappear entirely; the model will happily
 * echo "excluded per override" mentions of that name straight back into its
 * own scopingDecisions/audit output. State exclusions by requirement, not by
 * the retired framework's name, once removing the name is the goal.
 */
export const SCOPE_OVERRIDE = `---

BUILD SCOPE OVERRIDE (per HANDOFF.md, supersedes the doctrine above where
they conflict):

Only Interview and Internal modes are in scope; Client Engagement mode
(§1 row, §6.1) is out of scope for this build.

Only these four frameworks from §4.1 may be routed to or named in output:
ICP Datapoint Framework, RVP Framework, VALID Deal Model, Disposition
Science. Two requirements in the doctrine's own §4.1 table route to
frameworks that are retired for this build and must never be cited or
routed to: connect-rate/channel infrastructure, and positioning/why-us
narrative. Build both openly instead, per the §4.2 pattern: constructed:
true, no framework citation, no borrowed authority, and no mention of what
framework would normally apply; just build the content and label it
constructed. This includes §5.7 Competitive Positioning's why-us narrative.

The pre-PMF Lean Canvas exit route (§1.1) is unbuilt in this pass; if the
intake plainly describes a company without product-market fit, say so in
plain language inside the Outside-In Diagnostic (Interview mode) or Baseline
(Internal mode) section instead of attempting a Lean Canvas output.`;
