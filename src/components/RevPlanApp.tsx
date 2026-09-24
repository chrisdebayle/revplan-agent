"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import {
  EMPTY_INTAKE,
  REQUIRED_INTAKE_FIELDS,
  type AttachedFile,
  type AuditFinding,
  type ChatMessage,
  type ContextSummary,
  type DeckManifest,
  type IntakeBlock,
  type PlanSection,
  type ProbeAnswer,
  type ProbeQuestion,
  type RevenuePlan,
  type Stage,
} from "@/lib/types";
import { countMarkupWords } from "@/lib/evidence";
import { formatIntakeVerbatim, formatProbeAnswersVerbatim, extractRequiresData } from "@/lib/contextSummary";
import { computeShipGate } from "@/lib/shipGate";
import { useLocalState } from "@/lib/useLocalState";
import { Header } from "./Header";
import { ChatLog } from "./ChatLog";
import { IntakeForm } from "./IntakeForm";
import { ProbeForm } from "./ProbeForm";
import { PlanView } from "./PlanView";
import { FrameworksDrawer, ContextDrawer } from "./Drawers";
import { AuditDrawer } from "./AuditDrawer";
import { DeckView, type ActiveSlide } from "./DeckView";

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
  auditFindings: AuditFinding[] | null;
  ceilingAccepted: boolean;
  deckManifest: DeckManifest | null;
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
  auditFindings: null,
  ceilingAccepted: false,
  deckManifest: null,
};

const CLIENT_PARSEABLE_EXT = new Set(["md", "markdown", "txt", "srt", "vtt"]);
const SERVER_PARSEABLE_EXT = new Set(["pdf", "docx"]);

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
  const { intake, phase, messages, probeQuestions, probeAnswers, attachments, bypassedNotes, plan, draftContext, auditFindings, ceilingAccepted, deckManifest } = state;

  const [reviseTarget, setReviseTarget] = useState<string | null>(null);
  const [composerText, setComposerText] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [frameworksOpen, setFrameworksOpen] = useState(false);
  const [contextOpen, setContextOpen] = useState(false);
  const [auditOpen, setAuditOpen] = useState(false);
  const [auditBusy, setAuditBusy] = useState(false);

  const [viewMode, setViewMode] = useState<"plan" | "deck">("plan");
  const [deckBusy, setDeckBusy] = useState(false);
  const [deckRevising, setDeckRevising] = useState(false);
  const [activeSlide, setActiveSlide] = useState<ActiveSlide | null>(null);
  const [deckReviseTarget, setDeckReviseTarget] = useState<{ chapterIndex: number; slideIndex: number } | null>(null);
  const [deckComposerText, setDeckComposerText] = useState("");

  const composerRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const deckIframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, phase]);

  useEffect(() => {
    function onMessage(e: MessageEvent) {
      if (e.data?.type === "revplan-active-slide") {
        setActiveSlide({
          chapterIndex: e.data.chapterIndex,
          slideIndex: e.data.slideIndex,
          globalIndex: e.data.globalIndex,
          total: e.data.total,
        });
      }
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

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
        text: `Draft ready — v1, ${newPlan.wordCount} words. Run Audit (§7) from the header before treating this as more than a first draft — nothing's ship-clean until §9 clears.`,
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

      const staleCount = (auditFindings || []).filter((f) => f.sectionId === reviseTarget).length;
      const survivingFindings = (auditFindings || []).filter((f) => f.sectionId !== reviseTarget);
      patch({ plan: updatedPlan, auditFindings: staleCount ? survivingFindings : auditFindings });

      const flagNote = data.flags?.length ? ` This also changes ${data.flags.join(", ")}.` : "";
      const staleNote = staleCount
        ? ` Cleared ${staleCount} audit finding${staleCount > 1 ? "s" : ""} for this section — re-run Audit before shipping (§13).`
        : "";
      pushMessage({ kind: "agent-text", text: `${data.note || "Scoped edit applied."}${flagNote}${staleNote}` });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Revision failed.");
    } finally {
      setBusy(null);
      setReviseTarget(null);
    }
  }

  async function handleRunAudit() {
    if (!plan) return;
    setError(null);
    setAuditBusy(true);
    try {
      const res = await fetch("/api/audit", {
        method: "POST",
        body: JSON.stringify({ intake, probeAnswers, plan }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      patch({ auditFindings: data.findings as AuditFinding[], ceilingAccepted: false });
      const critical = (data.findings as AuditFinding[]).filter((f) => f.severity === "critical").length;
      const moderate = (data.findings as AuditFinding[]).filter((f) => f.severity === "moderate").length;
      pushMessage({
        kind: "agent-text",
        text:
          data.findings.length === 0
            ? "Audit ran clean — no findings."
            : `Audit found ${data.findings.length} issue${data.findings.length > 1 ? "s" : ""} (${critical} critical, ${moderate} moderate). See Audit & Ship in the header.`,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Audit failed.");
    } finally {
      setAuditBusy(false);
    }
  }

  function handleAcceptFinding(id: string) {
    patch({ auditFindings: (auditFindings || []).map((f) => (f.id === id ? { ...f, status: "accepted" } : f)) });
  }

  function handleDismissFinding(id: string) {
    patch({ auditFindings: (auditFindings || []).map((f) => (f.id === id ? { ...f, status: "resolved" } : f)) });
  }

  function handleJumpToReviseFromAudit(sectionId: string) {
    setAuditOpen(false);
    handleReviseClick(sectionId);
  }

  async function handleGenerateDeck() {
    if (!plan) return;
    setError(null);
    setDeckBusy(true);
    setActiveSlide(null);
    setDeckReviseTarget(null);
    try {
      const res = await fetch("/api/deck", {
        method: "POST",
        body: JSON.stringify({ intake, probeAnswers, plan, shipClean }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      patch({ deckManifest: data.manifest as DeckManifest });
      pushMessage({ kind: "agent-text", text: `Deck generated — public${data.path}. Switch to the Deck view to preview and revise it.` });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Deck generation failed.");
    } finally {
      setDeckBusy(false);
    }
  }

  function handleDeckReviseClick() {
    if (!activeSlide || activeSlide.slideIndex === -1) return;
    setDeckReviseTarget({ chapterIndex: activeSlide.chapterIndex, slideIndex: activeSlide.slideIndex });
    setDeckComposerText("");
    setError(null);
  }

  async function handleDeckComposerSend() {
    const text = deckComposerText.trim();
    if (!text || !deckReviseTarget || !deckManifest || !plan) return;
    setError(null);
    setDeckRevising(true);
    const targetGlobalIndex = activeSlide?.globalIndex ?? 0;
    try {
      const res = await fetch("/api/deck-revise", {
        method: "POST",
        body: JSON.stringify({
          intake,
          plan,
          manifest: deckManifest,
          chapterIndex: deckReviseTarget.chapterIndex,
          slideIndex: deckReviseTarget.slideIndex,
          instruction: text,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      patch({ deckManifest: data.manifest as DeckManifest });
      pushMessage({ kind: "agent-text", text: data.note || "Slide updated." });
      setDeckComposerText("");
      setDeckReviseTarget(null);
      // The iframe reload (triggered by the new generatedAt in its src) will
      // re-broadcast the active slide once it repaints at the same index —
      // pre-seed it now too so the sidebar label doesn't flicker to blank.
      setActiveSlide((s) => (s ? { ...s, globalIndex: targetGlobalIndex } : s));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Slide revision failed.");
    } finally {
      setDeckRevising(false);
    }
  }

  function handleFiles(e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const results: AttachedFile[] = [];
    let pending = files.length;
    const settle = () => {
      if (--pending === 0) finishAttach(results);
    };

    files.forEach((f) => {
      const ext = (f.name.split(".").pop() || "").toLowerCase();
      if (CLIENT_PARSEABLE_EXT.has(ext)) {
        const reader = new FileReader();
        reader.onload = () => {
          results.push({ name: f.name, ext: ext.toUpperCase(), text: String(reader.result || "") });
          settle();
        };
        reader.onerror = () => {
          results.push({ name: f.name, ext: ext.toUpperCase(), unparsed: true });
          settle();
        };
        reader.readAsText(f);
      } else if (SERVER_PARSEABLE_EXT.has(ext)) {
        const form = new FormData();
        form.append("file", f);
        fetch("/api/parse-file", { method: "POST", body: form })
          .then((res) => res.json())
          .then((data) => {
            if (data.error) throw new Error(data.error);
            results.push({ name: f.name, ext: ext.toUpperCase(), text: data.text as string });
          })
          .catch(() => {
            results.push({ name: f.name, ext: ext.toUpperCase(), unparsed: true });
          })
          .finally(settle);
      } else {
        results.push({ name: f.name, ext: ext.toUpperCase(), unparsed: true });
        settle();
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
              files.length > parsedCount ? " Legacy .doc isn't parsed — only .docx (Word's XML format)." : ""
            }`
          : "Attached, but couldn't extract text — only .md/.markdown/.txt/.srt/.vtt, .pdf, and .docx are supported.",
    });
    setState((s) => ({ ...s, attachments: [...s.attachments, ...files] }));
  }

  const shipChecks = plan && auditFindings ? computeShipGate({ plan, findings: auditFindings, ceilingAccepted }) : null;
  const shipClean = shipChecks?.every((c) => c.passed) ?? false;

  // The generatedAt timestamp changes on every generate/revise, so folding
  // it into the query string forces the iframe to actually reload instead
  // of silently keeping the previous file cached; slide= re-opens on the
  // same slide that was just edited rather than resetting to the cover.
  const deckPath = deckManifest
    ? `/decks/${deckManifest.slug}.html?slide=${activeSlide?.globalIndex ?? 0}&v=${encodeURIComponent(deckManifest.generatedAt)}`
    : null;

  const stage: Stage =
    phase === "intake" || phase === "probing" || phase === "ready"
      ? "scoping"
      : !plan || !auditFindings
        ? "drafting"
        : shipClean
          ? "ship"
          : "audit";

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
          unresolved:
            [
              ...bypassedNotes,
              ...(plan ? extractRequiresData(plan) : []),
              ...(auditFindings || [])
                .filter((f) => f.status === "open" && f.severity !== "minor")
                .map((f) => `${f.severity} — ${f.sectionLabel}: ${f.description}`),
            ].join("\n") || "—",
          sectionsAdded: "—",
          sectionsCut: draftContext?.sectionsCut.join(", ") || "None",
        };

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", fontFamily: "var(--db-font-body, sans-serif)", background: "var(--db-paper, #fff)", overflow: "hidden" }}>
      <Header
        stage={stage}
        viewMode={viewMode}
        onToggleFrameworks={() => { setFrameworksOpen((v) => !v); setContextOpen(false); setAuditOpen(false); }}
        onToggleContext={() => { setContextOpen((v) => !v); setFrameworksOpen(false); setAuditOpen(false); }}
        onToggleAudit={() => { setAuditOpen((v) => !v); setFrameworksOpen(false); setContextOpen(false); }}
        onSwitchToDeck={() => setViewMode("deck")}
        onSwitchToPlan={() => setViewMode("plan")}
      />

      {viewMode === "deck" ? (
        <DeckView
          manifest={deckManifest}
          deckPath={deckPath}
          iframeRef={deckIframeRef}
          hasPlan={!!plan}
          shipClean={shipClean}
          generating={deckBusy}
          revising={deckRevising}
          activeSlide={activeSlide}
          reviseTarget={deckReviseTarget}
          composerText={deckComposerText}
          error={error}
          onGenerate={handleGenerateDeck}
          onReviseClick={handleDeckReviseClick}
          onComposerChange={setDeckComposerText}
          onSend={handleDeckComposerSend}
        />
      ) : (
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
        <AuditDrawer
          open={auditOpen}
          plan={plan}
          findings={auditFindings}
          shipChecks={shipChecks}
          auditBusy={auditBusy}
          onRunAudit={handleRunAudit}
          onAccept={handleAcceptFinding}
          onDismiss={handleDismissFinding}
          onJumpToRevise={handleJumpToReviseFromAudit}
          ceilingAccepted={ceilingAccepted}
          onAcceptCeiling={() => patch({ ceilingAccepted: true })}
        />
      </div>
      )}
    </div>
  );
}
