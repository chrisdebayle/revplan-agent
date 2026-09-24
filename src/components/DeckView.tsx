"use client";

import type { RefObject } from "react";
import type { DeckManifest } from "@/lib/types";

export interface ActiveSlide {
  chapterIndex: number;
  slideIndex: number;
  globalIndex: number;
  total: number;
}

function slideLabel(manifest: DeckManifest, active: ActiveSlide | null): string {
  if (!active) return "";
  if (active.slideIndex === -1) return "Cover";
  const chapter = manifest.chapters[active.chapterIndex];
  const slide = chapter?.slides[active.slideIndex];
  return chapter && slide ? `${chapter.title} · ${slide.kind}` : "";
}

export function DeckView({
  manifest,
  deckPath,
  iframeRef,
  hasPlan,
  shipClean,
  generating,
  revising,
  activeSlide,
  reviseTarget,
  composerText,
  error,
  onGenerate,
  onReviseClick,
  onComposerChange,
  onSend,
}: {
  manifest: DeckManifest | null;
  deckPath: string | null;
  iframeRef: RefObject<HTMLIFrameElement | null>;
  hasPlan: boolean;
  shipClean: boolean;
  generating: boolean;
  revising: boolean;
  activeSlide: ActiveSlide | null;
  reviseTarget: { chapterIndex: number; slideIndex: number } | null;
  composerText: string;
  error: string | null;
  onGenerate: () => void;
  onReviseClick: () => void;
  onComposerChange: (text: string) => void;
  onSend: () => void;
}) {
  const canReviseActive = !!activeSlide && activeSlide.slideIndex !== -1 && !!manifest;

  return (
    <div style={{ flex: 1, display: "flex", minHeight: 0 }}>
      <div style={{ width: 360, flex: "none", display: "flex", flexDirection: "column", borderRight: "1px solid var(--db-line, #ddd)", minHeight: 0, padding: "18px 16px", gap: 14 }}>
        <div>
          <div style={{ fontFamily: "var(--db-font-display, inherit)", fontWeight: 700, fontSize: 15, color: "var(--db-dark, #111)", marginBottom: 4 }}>
            Deck
          </div>
          <div style={{ fontSize: 12, color: "var(--db-muted, #888)" }}>
            The plan, translated into a standalone slide deck. This is what the client sees.
          </div>
        </div>

        {!hasPlan ? (
          <div style={{ fontSize: 12.5, color: "var(--db-muted, #888)" }}>Draft a plan first, back in the Plan view.</div>
        ) : (
          <>
            {!shipClean && (
              <div style={{ fontSize: 12, color: "var(--db-accent-800, #92400e)", background: "var(--db-tint-warm, #fef3e2)", borderRadius: 8, padding: "8px 10px" }}>
                Ship Gate isn&rsquo;t clean yet; this deck reflects a plan in progress.
              </div>
            )}

            <button
              onClick={onGenerate}
              disabled={generating}
              style={{
                width: "100%",
                background: "var(--db-primary, #2f5eff)",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                padding: "10px 0",
                fontFamily: "var(--db-font-display, inherit)",
                fontWeight: 600,
                fontSize: 12.5,
                cursor: generating ? "default" : "pointer",
                opacity: generating ? 0.6 : 1,
              }}
            >
              {generating ? "Generating…" : manifest ? "Regenerate Deck" : "Generate Deck"}
            </button>

            {manifest && (
              <>
                <a
                  href={deckPath ?? "#"}
                  target="_blank"
                  rel="noreferrer"
                  style={{ fontSize: 11.5, color: "var(--db-primary, #2f5eff)", textDecoration: "none" }}
                >
                  Open in a new tab →
                </a>

                <div style={{ borderTop: "1px solid var(--db-line, #ddd)", paddingTop: 14, flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
                  <div style={{ fontSize: 10.5, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--db-muted, #888)", marginBottom: 8 }}>
                    Currently viewing
                  </div>
                  <div style={{ fontSize: 13, color: "var(--db-dark, #111)", marginBottom: 4 }}>
                    {activeSlide ? `Slide ${activeSlide.globalIndex + 1} of ${activeSlide.total}` : "(none)"}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--db-ink-soft, #444)", marginBottom: 14 }}>{slideLabel(manifest, activeSlide)}</div>

                  <button
                    onClick={onReviseClick}
                    disabled={!canReviseActive}
                    title={canReviseActive ? "Scope an edit to this slide" : "The cover isn't editable here yet; use Regenerate Deck"}
                    style={{
                      alignSelf: "flex-start",
                      fontSize: 12,
                      fontWeight: 600,
                      color: canReviseActive ? "var(--db-primary, #2f5eff)" : "var(--db-muted, #888)",
                      background: "transparent",
                      border: `1px solid ${canReviseActive ? "var(--db-primary, #2f5eff)" : "var(--db-line, #ddd)"}`,
                      borderRadius: 14,
                      padding: "6px 14px",
                      cursor: canReviseActive ? "pointer" : "default",
                      marginBottom: 14,
                    }}
                  >
                    Revise this slide
                  </button>

                  {error && (
                    <div style={{ fontSize: 12, color: "var(--db-fail, #dc2626)", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "8px 10px", marginBottom: 10 }}>
                      {error}
                    </div>
                  )}

                  <div style={{ flex: 1 }} />

                  <textarea
                    value={composerText}
                    onChange={(e) => onComposerChange(e.target.value)}
                    placeholder={reviseTarget ? "Describe the change…" : "Click Revise on the slide you want to change first…"}
                    disabled={!reviseTarget}
                    rows={3}
                    style={{
                      width: "100%",
                      resize: "none",
                      border: "1px solid var(--db-line, #ddd)",
                      borderRadius: 8,
                      padding: "9px 11px",
                      fontFamily: "var(--db-font-body, inherit)",
                      fontSize: 13,
                      color: "var(--db-dark, #111)",
                      outline: "none",
                      opacity: reviseTarget ? 1 : 0.6,
                      marginBottom: 8,
                      boxSizing: "border-box",
                    }}
                  />
                  <button
                    onClick={onSend}
                    disabled={!reviseTarget || !composerText.trim() || revising}
                    style={{
                      width: "100%",
                      background: "var(--db-primary, #2f5eff)",
                      color: "#fff",
                      border: "none",
                      borderRadius: 8,
                      padding: "10px 0",
                      fontFamily: "var(--db-font-display, inherit)",
                      fontWeight: 600,
                      fontSize: 12.5,
                      cursor: reviseTarget && composerText.trim() ? "pointer" : "default",
                      opacity: reviseTarget && composerText.trim() ? 1 : 0.5,
                    }}
                  >
                    {revising ? "Revising…" : "Send"}
                  </button>
                </div>
              </>
            )}
          </>
        )}
      </div>

      <div style={{ flex: 1, background: "#0B0E11", display: "flex", alignItems: "center", justifyContent: "center" }}>
        {manifest && deckPath ? (
          <iframe ref={iframeRef} src={deckPath} title="Deck preview" style={{ width: "100%", height: "100%", border: "none" }} />
        ) : (
          <div style={{ color: "#7E858E", fontSize: 13.5 }}>Generate the deck to preview it here.</div>
        )}
      </div>
    </div>
  );
}
