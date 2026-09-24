"use client";

const drawerBase = {
  position: "fixed" as const,
  top: 64,
  right: 0,
  bottom: 0,
  background: "#fff",
  borderLeft: "1px solid var(--db-line, #ddd)",
  boxShadow: "-8px 0 24px rgba(0,0,0,.06)",
  transition: "transform .2s ease",
  overflowY: "auto" as const,
  padding: "22px 20px",
  zIndex: 20,
  width: 340,
};

export function DeckDrawer({
  open,
  hasPlan,
  shipClean,
  busy,
  deckPath,
  generatedAt,
  onGenerate,
}: {
  open: boolean;
  hasPlan: boolean;
  shipClean: boolean;
  busy: boolean;
  deckPath: string | null;
  generatedAt: string | null;
  onGenerate: () => void;
}) {
  return (
    <div style={{ ...drawerBase, transform: open ? "translateX(0)" : "translateX(100%)" }}>
      <div style={{ fontFamily: "var(--db-font-display, inherit)", fontWeight: 700, fontSize: 15, color: "var(--db-dark, #111)", marginBottom: 4 }}>
        Deck
      </div>
      <div style={{ fontSize: 12, color: "var(--db-muted, #888)", marginBottom: 18 }}>
        The plan, translated into a standalone slide deck — no doctrine notation, no tags, plain business language.
      </div>

      {!hasPlan ? (
        <div style={{ fontSize: 12.5, color: "var(--db-muted, #888)" }}>Draft a plan first.</div>
      ) : (
        <>
          {!shipClean && (
            <div
              style={{
                fontSize: 12,
                color: "var(--db-accent-800, #92400e)",
                background: "var(--db-tint-warm, #fef3e2)",
                borderRadius: 8,
                padding: "8px 10px",
                marginBottom: 14,
              }}
            >
              Ship Gate isn&rsquo;t clean yet — you can still generate a preview, but treat it as a work in progress.
            </div>
          )}

          <button
            onClick={onGenerate}
            disabled={busy}
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
              cursor: busy ? "default" : "pointer",
              opacity: busy ? 0.6 : 1,
              marginBottom: 14,
            }}
          >
            {busy ? "Generating…" : deckPath ? "Regenerate Deck" : "Generate Deck"}
          </button>

          {deckPath && (
            <div style={{ border: "1px solid var(--db-line, #ddd)", borderRadius: 8, padding: 12 }}>
              <div style={{ fontSize: 12.5, color: "var(--db-dark, #111)", marginBottom: 4 }}>
                <code style={{ fontFamily: "ui-monospace, Menlo, monospace", fontSize: 11.5 }}>public{deckPath}</code>
              </div>
              {generatedAt && (
                <div style={{ fontSize: 11, color: "var(--db-muted, #888)", marginBottom: 10 }}>
                  Generated {new Date(generatedAt).toLocaleString()}
                </div>
              )}
              <a
                href={deckPath}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: "inline-block",
                  fontSize: 12,
                  fontWeight: 600,
                  color: "var(--db-primary, #2f5eff)",
                  textDecoration: "none",
                  border: "1px solid var(--db-primary, #2f5eff)",
                  borderRadius: 14,
                  padding: "6px 14px",
                }}
              >
                Open deck →
              </a>
              <div style={{ fontSize: 11, color: "var(--db-muted, #888)", marginTop: 10 }}>
                Committed to the repo like any other file — review with <code>git diff</code>, commit and push when
                you&rsquo;re ready to ship it.
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
