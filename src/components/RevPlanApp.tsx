"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import {
  EMPTY_INTAKE,
  REQUIRED_INTAKE_FIELDS,
  type AttachedFile,
  type ChatMessage,
  type ContextSummary,
  type IntakeBlock,
  type PlanSection,
  type ProbeAnswer,
  type ProbeQuestion,
  type RevenuePlan,
  type Stage,
} from "@/lib/types";
import { countMarkupWords } from "@/lib/evidence";
import { formatIntakeVerbatim, formatProbeAnswersVerbatim, extractRequiresData } from "@/lib/contextSummary";
import { useLocalState } from "@/lib/useLocalState";
import { Header } from "./Header";
import { ChatLog } from "./ChatLog";
import { IntakeForm } from "./IntakeForm";
import { ProbeForm } from "./ProbeForm";
import { PlanView } from "./PlanView";
import { FrameworksDrawer, ContextDrawer } from "./Drawers";

type Phase = "intake" | "probing" | "ready" | "drafting" | "drafted";

interface DraftContext {
  frameworksUsed: string[];
  unownedAreas: string[];
  scopingDecisions: string[];
  sectionsCut: string[];
}

interface PersistedState {
  intake: IntakeBlock;
  phase: Phase;
  messages: ChatMessage[];
  probeQuestions: ProbeQuestion[];
  probeAnswers: ProbeAnswer[];
  attachments: AttachedFile[];
  bypassedNotes: string[];
  plan: RevenuePlan | null;
  draftContext: DraftContext | null;
}

const INITIAL: PersistedState = {
  intake: EMPTY_INTAKE,
  phase: "intake",
  messages: [{ kind: "agent-text", text: "Scoping gate open. I won't draft before the intake block clears, per §2." }],
  probeQuestions: [],
  probeAnswers: [],
  attachments: [],
  bypassedNotes: [],
  plan: null,
  draftContext: null,
};

const PARSEABLE_EXT = new Set(["md", "markdown", "txt", "srt", "vtt"]);

function wordCountForPlan(plan: Pick<RevenuePlan, "execSummaryMarkup" | "sections">): number {
  return (
    countMarkupWords(plan.execSummaryMarkup) +
    plan.sections.reduce((sum, s) => sum + countMarkupWords(s.bodyMarkup), 0)
  );
}

function sectionTitleFor(plan: RevenuePlan | null, sectionId: string): string {
  if (!plan) return "";
  if (sectionId === "exec-summary") return "§1 Executive Summary";
  const s = plan.sections.find((x) => x.id === sectionId);
  return s ? `§${s.number} ${s.title}` : "";
}

export function RevPlanApp() {
  const [state, setState] = useLocalState<PersistedState>(INITIAL);
  const { intake, phase, messages, probeQuestions, probeAnswers, attachments, bypassedNotes, plan, draftContext } = state;

  const [reviseTarget, setReviseTarget] = useState<string | null>(null);
  const [composerText, setComposerText] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [frameworksOpen, setFrameworksOpen] = useState(false);
  const [contextOpen, setContextOpen] = useState(false);

  const composerRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, phase]);

  function patch(next: Partial<PersistedState>) {
    setState((s) => ({ ...s, ...next }));
  }
  function pushMessage(msg: ChatMessage) {
    setState((s) => ({ ...s, messages: [...s.messages, msg] }));
  }

  async function handleIntakeSubmit() {
    setError(null);
    const missing = REQUIRED_INTAKE_FIELDS.filter((f) => !intake[f]?.trim());
    if (missing.length) {
      setError(`Required per §2.1: ${missing.join(", ")}`);
      return;
    }
    pushMessage({ kind: "intake", intake });
    setBusy("Reading intake…");
    try {
      const res = await fetch("/api/probe", { method: "POST", body: JSON.stringify({ intake }) });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      if (data.cleared || !data.questions?.length) {
        pushMessage({ kind: "agent-text", text: "Required fields are clear enough to draft — no probe needed, per §2.2." });
        patch({ phase: "ready" });
      } else {
        pushMessage({
          kind: "agent-text",
          text: `${data.questions.length} field${data.questions.length > 1 ? "s are" : " is"} ambiguous enough to change the plan — probing ${data.questions.length > 1 ? "those" : "it"} before I draft, per §2.2.`,
        });
        patch({ probeQuestions: data.questions, phase: "probing" });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Scoping failed.");
    } finally {
      setBusy(null);
    }
  }

  function handleProbeSubmit(answersMap: Record<string, string>) {
    const answers: ProbeAnswer[] = probeQuestions.map((q) => ({
      field: q.field,
      question: q.question,
      answer: answersMap[q.field] || "",
    }));
    pushMessage({ kind: "probe-answers", answers });
    pushMessage({ kind: "agent-text", text: "Scoping cleared. Ready to draft." });
    patch({ probeAnswers: answers, phase: "ready" });
  }

  function handleBuildAnyway() {
    const unanswered = probeQuestions.map((q) => `${q.question} (bypassed)`);
    const missingRequired = REQUIRED_INTAKE_FIELDS.filter((f) => !intake[f]?.trim()).map((f) => `${f} (required field left blank)`);
    pushMessage({ kind: "agent-text", text: "Proceeding without those answers — logged as open assumptions in the Context Summary, per §2.2." });
    patch({ bypassedNotes: [...unanswered, ...missingRequired], phase: "ready" });
  }

  async function handleGeneratePlan() {
    setError(null);
    setBusy("Drafting the plan…");
    patch({ phase: "drafting" });
    pushMessage({
      kind: "agent-text",
      text: `Scoping cleared. Drafting now against the ${intake.mode === "Interview" ? "Interview ceiling, 1,800–2,200 words" : "Internal Operating Plan structure"}.`,
    });
    try {
      const res = await fetch("/api/draft", {
        method: "POST",
        body: JSON.stringify({ intake, probeAnswers, attachments }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      const sections: PlanSection[] = data.sections.map((s: PlanSection, i: number) => ({
        ...s,
        id: s.id || `section-${s.number || i}`,
      }));

      const newPlan: RevenuePlan = {
        companyTitle: `Revenue Plan — ${intake.company}`,
        execSummaryMarkup: data.execSummaryMarkup,
        sections,
        kpiRows: data.kpiRows || [],
        weekOneItems: data.weekOneItems || [],
        wordCount: 0,
        wordCeiling: intake.mode === "Interview" ? 2200 : Number.POSITIVE_INFINITY,
        version: 1,
      };
      newPlan.wordCount = wordCountForPlan(newPlan);

      patch({
        plan: newPlan,
        draftContext: {
          frameworksUsed: data.frameworksUsed || [],
          unownedAreas: data.unownedAreas || [],
          scopingDecisions: data.scopingDecisions || [],
          sectionsCut: data.sectionsCut || [],
        },
        phase: "drafted",
      });
      pushMessage({
        kind: "agent-text",
        text: `Draft ready — v1, ${newPlan.wordCount} words. Audit pass and ship gate aren't built yet in this pass (see HANDOFF.md) — read this as a first draft, not a shipped one.`,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Draft generation failed.");
      patch({ phase: "ready" });
    } finally {
      setBusy(null);
    }
  }

  function handleReviseClick(sectionId: string) {
    setReviseTarget(sectionId);
    setComposerText(`Revise ${sectionTitleFor(plan, sectionId)} — `);
    composerRef.current?.focus();
  }

  async function handleComposerSend() {
    const text = composerText.trim();
    if (!text || !reviseTarget || !plan) return;
    setError(null);

    const currentSection: PlanSection =
      reviseTarget === "exec-summary"
        ? { id: "exec-summary", number: "01", label: "EXECUTIVE SUMMARY", title: "Executive Summary", frameworksLinked: [], bodyMarkup: plan.execSummaryMarkup }
        : plan.sections.find((s) => s.id === reviseTarget)!;

    pushMessage({ kind: "user-text", text });
    setComposerText("");
    setBusy(`Revising ${sectionTitleFor(plan, reviseTarget)}…`);

    try {
      const res = await fetch("/api/revise", {
        method: "POST",
        body: JSON.stringify({
          intake,
          probeAnswers,
          section: currentSection,
          instruction: text,
          otherSectionTitles: plan.sections.filter((s) => s.id !== reviseTarget).map((s) => s.title),
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      let updatedPlan: RevenuePlan;
      if (reviseTarget === "exec-summary") {
        updatedPlan = { ...plan, execSummaryMarkup: data.section.bodyMarkup, version: plan.version + 1 };
      } else {
        updatedPlan = {
          ...plan,
          sections: plan.sections.map((s) => (s.id === reviseTarget ? { ...data.section, id: s.id } : s)),
          version: plan.version + 1,
        };
      }
      updatedPlan.wordCount = wordCountForPlan(updatedPlan);
      patch({ plan: updatedPlan });

      const flagNote = data.flags?.length
        ? ` This also changes ${data.flags.join(", ")} — worth a full re-audit once that pass is built (§13).`
        : "";
      pushMessage({ kind: "agent-text", text: `${data.note || "Scoped edit applied."}${flagNote}` });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Revision failed.");
    } finally {
      setBusy(null);
      setReviseTarget(null);
    }
  }

  function handleFiles(e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const results: AttachedFile[] = [];
    let pending = files.length;

    files.forEach((f) => {
      const ext = (f.name.split(".").pop() || "").toLowerCase();
      if (PARSEABLE_EXT.has(ext)) {
        const reader = new FileReader();
        reader.onload = () => {
          results.push({ name: f.name, ext: ext.toUpperCase(), text: String(reader.result || "") });
          if (--pending === 0) finishAttach(results);
        };
        reader.onerror = () => {
          results.push({ name: f.name, ext: ext.toUpperCase(), unparsed: true });
          if (--pending === 0) finishAttach(results);
        };
        reader.readAsText(f);
      } else {
        results.push({ name: f.name, ext: ext.toUpperCase(), unparsed: true });
        if (--pending === 0) finishAttach(results);
      }
    });

    e.target.value = "";
  }

  function finishAttach(files: AttachedFile[]) {
    pushMessage({ kind: "attachment", files });
    const parsedCount = files.filter((f) => f.text).length;
    pushMessage({
      kind: "agent-text",
      text:
        parsedCount > 0
          ? `${parsedCount} file${parsedCount > 1 ? "s" : ""} parsed. Tiering happens at draft time — attachment text is context, not automatically Sourced.${
              files.length > parsedCount ? " PDF/Word/other formats aren't parsed in this build yet — attached for the record only." : ""
            }`
          : "Attached, but this build only parses .md/.markdown/.txt/.srt/.vtt today — noted for the record, not read into context.",
    });
    setState((s) => ({ ...s, attachments: [...s.attachments, ...files] }));
  }

  const stage: Stage = phase === "intake" || phase === "probing" || phase === "ready" ? "scoping" : "drafting";

  const contextSummary: ContextSummary | null =
    phase === "intake" && messages.length <= 1
      ? null
      : {
          build: `${intake.company || "(unnamed)"} · ${intake.mode} · ${new Date().toISOString().slice(0, 10)} · v${plan?.version ?? "—"}`,
          intake: formatIntakeVerbatim(intake),
          probeAnswers: formatProbeAnswersVerbatim(probeAnswers),
          frameworksUsed: draftContext?.frameworksUsed.join(", ") || "—",
          unownedAreas: draftContext?.unownedAreas.join("\n") || "—",
          scopingDecisions: draftContext?.scopingDecisions.join("\n") || "—",
          unresolved: [...bypassedNotes, ...(plan ? extractRequiresData(plan) : [])].join("\n") || "—",
          sectionsAdded: "—",
          sectionsCut: draftContext?.sectionsCut.join(", ") || "None",
        };

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", fontFamily: "var(--db-font-body, sans-serif)", background: "var(--db-paper, #fff)", overflow: "hidden" }}>
      <Header stage={stage} onToggleFrameworks={() => { setFrameworksOpen((v) => !v); setContextOpen(false); }} onToggleContext={() => { setContextOpen((v) => !v); setFrameworksOpen(false); }} />

      <div style={{ flex: 1, display: "flex", minHeight: 0 }}>
        <div style={{ width: 400, flex: "none", display: "flex", flexDirection: "column", borderRight: "1px solid var(--db-line, #ddd)", minHeight: 0 }}>
          <div style={{ display: "flex", gap: 6, padding: "14px 16px", borderBottom: "1px solid var(--db-line, #ddd)", flex: "none" }}>
            {(["Interview", "Internal"] as const).map((m) => (
              <button
                key={m}
                onClick={() => phase === "intake" && patch({ intake: { ...intake, mode: m } })}
                disabled={phase !== "intake"}
                style={{
                  fontFamily: "var(--db-font-display, inherit)",
                  fontWeight: 600,
                  fontSize: 12,
                  padding: "7px 14px",
                  borderRadius: 8,
                  border: `1px solid ${intake.mode === m ? "var(--db-primary, #2f5eff)" : "var(--db-line, #ddd)"}`,
                  background: intake.mode === m ? "var(--db-primary, #2f5eff)" : "transparent",
                  color: intake.mode === m ? "#fff" : "var(--db-ink-soft, #444)",
                  cursor: phase === "intake" ? "pointer" : "default",
                  opacity: phase === "intake" ? 1 : 0.6,
                  flex: 1,
                }}
              >
                {m}
              </button>
            ))}
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: "18px 16px", display: "flex", flexDirection: "column", gap: 14, minHeight: 0 }}>
            <ChatLog messages={messages} />

            {phase === "intake" && (
              <IntakeForm intake={intake} onChange={(next) => patch({ intake: next })} onSubmit={handleIntakeSubmit} submitting={!!busy} />
            )}
            {phase === "probing" && (
              <ProbeForm questions={probeQuestions} onSubmit={handleProbeSubmit} onBuildAnyway={handleBuildAnyway} submitting={!!busy} />
            )}
            {phase === "ready" && (
              <button
                onClick={handleGeneratePlan}
                disabled={!!busy}
                style={{
                  width: "100%",
                  background: "var(--db-primary, #2f5eff)",
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  padding: "12px 0",
                  fontFamily: "var(--db-font-display, inherit)",
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: busy ? "default" : "pointer",
                  opacity: busy ? 0.6 : 1,
                }}
              >
                {busy || "Generate Plan"}
              </button>
            )}
            {phase === "drafting" && !plan && (
              <div style={{ fontSize: 12.5, color: "var(--db-muted, #888)", textAlign: "center", padding: "12px 0" }}>{busy}</div>
            )}
            {error && (
              <div style={{ fontSize: 12, color: "var(--db-fail, #dc2626)", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "8px 10px" }}>
                {error}
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <div style={{ flex: "none", borderTop: "1px solid var(--db-line, #ddd)", padding: "12px 14px", display: "flex", gap: 8, alignItems: "flex-end" }}>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFiles}
              multiple
              accept=".md,.markdown,.pdf,.txt,.doc,.docx,.vtt,.srt"
              style={{ display: "none" }}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              title="Attach reference material — Markdown, PDF, call transcripts"
              style={{
                flex: "none",
                width: 34,
                height: 34,
                border: "1px solid var(--db-line, #ddd)",
                borderRadius: 8,
                background: "transparent",
                color: "var(--db-muted, #888)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21.44 11.05l-9.19 9.19a5 5 0 01-7.07-7.07l9.19-9.19a3.5 3.5 0 015 5l-9.2 9.19a2 2 0 01-2.82-2.83l8.49-8.48"></path>
              </svg>
            </button>
            <textarea
              ref={composerRef}
              value={composerText}
              onChange={(e) => setComposerText(e.target.value)}
              placeholder={reviseTarget ? "Finish your revision instruction…" : plan ? "Click Revise on a section to scope an edit…" : "Available once a plan exists…"}
              disabled={!reviseTarget}
              rows={1}
              style={{
                flex: 1,
                resize: "none",
                border: "1px solid var(--db-line, #ddd)",
                borderRadius: 8,
                padding: "9px 11px",
                fontFamily: "var(--db-font-body, inherit)",
                fontSize: 13,
                color: "var(--db-dark, #111)",
                outline: "none",
                opacity: reviseTarget ? 1 : 0.6,
              }}
            />
            <button
              onClick={handleComposerSend}
              disabled={!reviseTarget || !composerText.trim() || !!busy}
              style={{
                flex: "none",
                background: "var(--db-primary, #2f5eff)",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                padding: "0 16px",
                height: 34,
                fontFamily: "var(--db-font-display, inherit)",
                fontWeight: 600,
                fontSize: 12.5,
                cursor: reviseTarget && composerText.trim() ? "pointer" : "default",
                opacity: reviseTarget && composerText.trim() ? 1 : 0.5,
              }}
            >
              Send
            </button>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: "auto", minHeight: 0, padding: "34px 52px 80px", position: "relative" }}>
          {plan ? (
            <PlanView plan={plan} reviseTarget={reviseTarget} onRevise={handleReviseClick} />
          ) : (
            <div style={{ maxWidth: 560, margin: "80px auto 0", textAlign: "center", color: "var(--db-muted, #888)", fontSize: 13.5 }}>
              The living plan document appears here once scoping clears and a draft is generated.
            </div>
          )}
        </div>

        <FrameworksDrawer open={frameworksOpen} />
        <ContextDrawer open={contextOpen} summary={contextSummary} />
      </div>
    </div>
  );
}
