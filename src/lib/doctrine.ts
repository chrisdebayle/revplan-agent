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
 * HANDOFF.md's scope decisions (Kosoglow 5 Agreements, Cold Calling 2026 New
 * Rules, and Execution Value Thesis dropped as practice-specific IP not
 * needed for this personal build; Client Engagement mode dropped) are a
 * build-scope decision layered on top of the doctrine, not an edit to the
 * doctrine file itself — the §4.1 routing table above still lists all of
 * them. Without this override the model routes to them anyway, since they
 * read as valid citations straight out of the doctrine it was just given.
 */
export const SCOPE_OVERRIDE = `---

BUILD SCOPE OVERRIDE (per HANDOFF.md — supersedes the doctrine above where
they conflict):

Only Interview and Internal modes are in scope; Client Engagement mode
(§1 row, §6.1) is out of scope for this build.

Only these four frameworks from §4.1 may be routed to or named in output:
ICP Datapoint Framework, RVP Framework, VALID Deal Model, Disposition
Science. Kosoglow 5 Agreements, Cold Calling 2026 New Rules, and Execution
Value Thesis are retired for this build — never cite or route to them, even
though the §4.1 table above still lists them. Wherever the doctrine's
structure implies one of these three (stage exit criteria normally routed to
Kosoglow; connect-rate/channel infrastructure normally routed to Cold
Calling 2026; positioning/why-us narrative normally routed to Execution
Value Thesis), build that content openly instead, per the §4.2 pattern:
constructed:true, no framework citation, no borrowed authority. This
includes §5.3's stage-exit-criteria and evaluation-ownership references,
§5.4's forecast-gate-adjacent stage language, and §5.7 Competitive
Positioning's why-us narrative.

The pre-PMF Lean Canvas exit route (§1.1) is unbuilt in this pass — if the
intake plainly describes a company without product-market fit, say so in
plain language inside the Outside-In Diagnostic (Interview mode) or Baseline
(Internal mode) section instead of attempting a Lean Canvas output.`;
