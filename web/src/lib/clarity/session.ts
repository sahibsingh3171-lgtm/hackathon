/**
 * Session factory + persistence stubs for Clarity.
 *
 * Judges: `createDefaultSession()` is the empty shape of everything the app tracks in React state.
 * `loadSession` / `saveSession` / `clearSession` are intentionally no-ops so a browser refresh always
 * clears the journey (except the separate one-shot demo key in `persisted-session.ts`).
 */
import type { ClaritySession } from "@/types/clarity";

/** Stable random id for this tab’s session object (used in crisis-dismiss keys, etc.). */
function newId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `clarity_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

/** Initial `ClaritySession` — also used after `resetFlow()` in context. */
export function createDefaultSession(): ClaritySession {
  const now = new Date().toISOString();
  return {
    id: newId(),
    updatedAt: now,
    intake: {},
    intakePrefilledStepIds: [],
    intakeConfirmedStepIds: [],
    intakeWizardStepIds: null,
    intakeExtractionMeta: null,
    lifestyle: null,
    brainDump: null,
    summary: null,
    readinessAnalysis: null,
    nextSteps: null,
    prepSheet: null,
    matchPreferences: null,
    practiceConversation: null,
  };
}

/**
 * Persistence is intentionally disabled for this build: refresh restarts the flow.
 * These helpers are kept as stable no-ops so legacy callers (context, demo helpers)
 * continue to compile and behave correctly when called.
 */
export function loadSession(): ClaritySession | null {
  return null;
}

export function saveSession(_session: ClaritySession): void {
  void _session;
}

export function clearSession(): void {
  /* no-op — nothing to clear when we never persist */
}
