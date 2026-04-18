import type { ClaritySession } from "@/types/clarity";

function newId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `clarity_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

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
