import type { ClaritySession } from "@/types/clarity";

import { clearSession, loadSession, saveSession } from "./session";

/**
 * Narrow persistence port for `ClaritySession`.
 *
 * NOTE: persistence across refresh is intentionally disabled in this build.
 * The port is retained so the context + demo helpers keep a single, stable
 * integration point — every method is a no-op today.
 */
export type ClaritySessionPersistence = {
  load(): ClaritySession | null;
  save(session: ClaritySession): void;
  clear(): void;
};

export const claritySessionPersistence: ClaritySessionPersistence = {
  load: loadSession,
  save: saveSession,
  clear: clearSession,
};

/**
 * One-shot handoff for the hackathon demo hydration path. Writes a single
 * payload to `sessionStorage` under a dedicated key, read + consumed by the
 * session context on its next mount (and then deleted). This is deliberately
 * *not* the regular session key so a manual refresh still starts fresh.
 */
export const CLARITY_DEMO_ONE_SHOT_KEY = "clarity_demo_one_shot_v1";

export function writeDemoOneShot(session: ClaritySession): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(CLARITY_DEMO_ONE_SHOT_KEY, JSON.stringify(session));
  } catch {
    /* quota / private mode */
  }
}

export function consumeDemoOneShot(): ClaritySession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(CLARITY_DEMO_ONE_SHOT_KEY);
    if (!raw) return null;
    sessionStorage.removeItem(CLARITY_DEMO_ONE_SHOT_KEY);
    const parsed = JSON.parse(raw) as ClaritySession;
    if (!parsed || typeof parsed !== "object" || !parsed.id) return null;
    return parsed;
  } catch {
    return null;
  }
}
