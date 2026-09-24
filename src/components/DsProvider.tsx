"use client";

import * as React from "react";
import { createContext, useContext, useEffect, useState } from "react";

// The Chris Debayle Brand Components bundle is a plain browser-global build
// (window.ChrisDebayleBrandComponents) that calls window.React.createElement
// internally; see _ds/.../README.md. We load it client-side only, after
// pointing window.React at this app's own React so the DS components mount
// into the same tree instead of a second React instance.
type DsNamespace = Record<string, React.ComponentType<Record<string, unknown>>>;

const DsContext = createContext<DsNamespace | null>(null);

declare global {
  interface Window {
    React?: typeof React;
    ChrisDebayleBrandComponents?: DsNamespace;
  }
}

export function DsProvider({ children }: { children: React.ReactNode }) {
  // Lazy init so an already-loaded bundle (e.g. a client-only remount after
  // first load) is picked up without a synchronous setState in the effect
  // below; on the server / first client render this is always null, so
  // hydration still matches.
  const [ds, setDs] = useState<DsNamespace | null>(() =>
    typeof window === "undefined" ? null : window.ChrisDebayleBrandComponents ?? null
  );

  useEffect(() => {
    if (typeof window === "undefined" || window.ChrisDebayleBrandComponents) return;
    const src = "/ds/_ds_bundle.js";
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${src}"]`);
    if (existing) {
      // Dev Strict Mode runs this effect twice; reuse the tag from the
      // first pass instead of racing a second load/removal against it.
      existing.addEventListener("load", () => setDs(window.ChrisDebayleBrandComponents ?? null));
      return;
    }
    // The ESM React namespace object is frozen/non-extensible; the bundle's
    // shim mutates window.React directly (adding .jsx/.jsxs/...), so it needs
    // a plain, extensible copy rather than the namespace object itself.
    window.React = { ...React };
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.onload = () => setDs(window.ChrisDebayleBrandComponents ?? null);
    script.onerror = () => console.error(`Failed to load design system bundle from ${src}`);
    document.body.appendChild(script);
    // Left in place on unmount: it's already had its side effect (populating
    // window globals), and removing it mid-load is what caused the dev
    // double-invoke race this guard replaces.
  }, []);

  return <DsContext.Provider value={ds}>{children}</DsContext.Provider>;
}

/** Returns the DS component namespace, or null while it's still loading. */
export function useDs(): DsNamespace | null {
  return useContext(DsContext);
}
