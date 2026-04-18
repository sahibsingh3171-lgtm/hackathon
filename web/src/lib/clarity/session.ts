import type { ClaritySession } from "@/types/clarity";
import { CLARITY_STORAGE_KEY } from "./constants";
import { buildNextSteps } from "./next-steps-templates";

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
    intakeInferredStepIds: [],
    intakeConfirmedStepIds: [],
    lifestyle: null,
    brainDump: null,
    summary: null,
    readinessAnalysis: null,
    nextSteps: null,
    prepSheet: null,
    matchPreferences: null,
  };
}

export function loadSession(): ClaritySession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(CLARITY_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ClaritySession;
    if (!parsed || typeof parsed !== "object" || !parsed.id) return null;
    const base: ClaritySession = {
      ...parsed,
      readinessAnalysis: parsed.readinessAnalysis ?? null,
      intakeInferredStepIds: parsed.intakeInferredStepIds ?? [],
      intakeConfirmedStepIds: parsed.intakeConfirmedStepIds ?? [],
    };
    if (
      base.summary &&
      (!base.nextSteps || base.nextSteps.length === 0)
    ) {
      return { ...base, nextSteps: buildNextSteps(base.summary.tags) };
    }
    return base;
  } catch {
    return null;
  }
}

export function saveSession(session: ClaritySession): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(
      CLARITY_STORAGE_KEY,
      JSON.stringify({ ...session, updatedAt: new Date().toISOString() })
    );
  } catch {
    /* quota or private mode */
  }
}

export function clearSession(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(CLARITY_STORAGE_KEY);
}
