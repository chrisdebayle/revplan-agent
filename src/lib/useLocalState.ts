"use client";

import { useEffect, useState, type Dispatch, type SetStateAction } from "react";

const KEY = "revplan-agent-state-v1";

/** Single-slot localStorage persistence: this is a personal, single-user
 * tool, so one save slot is enough for now; a real per-build history is a
 * later pass, not this one. */
export function useLocalState<T>(initial: T): [T, Dispatch<SetStateAction<T>>] {
  const [state, setState] = useState<T>(initial);
  // Must be React state, not a ref: a ref mutation is visible to every effect
  // in the same commit immediately, including one that already captured the
  // pre-hydration `state` closure; that combination (flag flipped, state
  // stale) makes the save-effect below write the empty initial state over
  // real saved data the instant it loads. Using state instead means the
  // hydration effect's setState + setHydrated land in the same batched
  // re-render, so the save-effect only ever sees them together.
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // Mount-only, client-only sync from an external store (localStorage);
    // this has to run after the SSR-matching first render, not during it, or
    // it would cause a hydration mismatch.
    try {
      const raw = window.localStorage.getItem(KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (raw) setState(JSON.parse(raw));
    } catch {
      // corrupt or inaccessible storage, start fresh
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      // storage full or unavailable, nothing to do about it here
    }
  }, [state, hydrated]);

  return [state, setState];
}
