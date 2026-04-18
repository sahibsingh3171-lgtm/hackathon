import type {
  ClaritySession,
  PracticeAiContextPayload,
  PracticeConversationState,
  PracticeTurnMessage,
} from "@/types/clarity";

/** Smallest safe id that works in older browsers used by demo judges. */
function newId(prefix: string): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return `${prefix}_${crypto.randomUUID()}`;
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

/** Default bound — rehearsal is meant to feel short and finishable. */
export const DEFAULT_PRACTICE_MAX_USER_TURNS = 6;
/** Hard ceiling for UI — the server will wrap once we hit max. */
export const PRACTICE_MESSAGE_SOFT_LIMIT = 30;

export function createMessage(
  role: PracticeTurnMessage["role"],
  text: string,
  input?: PracticeTurnMessage["input"]
): PracticeTurnMessage {
  return {
    id: newId("msg"),
    role,
    text,
    createdAt: new Date().toISOString(),
    input,
  };
}

export function createPracticeConversation(
  maxUserTurns = DEFAULT_PRACTICE_MAX_USER_TURNS
): PracticeConversationState {
  const now = new Date().toISOString();
  return {
    id: newId("practice"),
    startedAt: now,
    updatedAt: now,
    phase: "intro",
    maxUserTurns,
    userTurnCount: 0,
    messages: [],
    summary: null,
    crisisTripped: false,
  };
}

/** Build a tiny, non-PII context packet for the AI — drawn only from the session we already have. */
export function buildPracticeContext(session: ClaritySession): PracticeAiContextPayload {
  const themes = new Set<string>();
  for (const t of session.summary?.keyThemes ?? []) if (t) themes.add(t);
  for (const t of session.readinessAnalysis?.mainConcerns ?? []) if (t) themes.add(t);
  for (const t of session.brainDump?.themes ?? []) if (t) themes.add(t);
  const concernHints = Array.from(themes).slice(0, 4);

  const brainDumpText =
    typeof session.brainDump?.text === "string" ? session.brainDump.text.trim() : "";
  const brainDumpThemes = Array.isArray(session.brainDump?.themes)
    ? session.brainDump!.themes.filter(Boolean)
    : [];

  const visitReason =
    typeof session.intake.visit_reason === "string" && session.intake.visit_reason.trim().length > 0
      ? session.intake.visit_reason.trim()
      : null;
  const therapyGoals =
    typeof session.intake.therapy_goals === "string" &&
    session.intake.therapy_goals.trim().length > 0
      ? session.intake.therapy_goals.trim()
      : null;

  return {
    brainDump:
      brainDumpText || brainDumpThemes.length > 0
        ? { text: brainDumpText.slice(0, 1200), themes: brainDumpThemes }
        : null,
    concernHints,
    therapyGoals,
    visitReason,
    summaryHeadline: session.summary?.headline ?? null,
    lifestyle: session.lifestyle,
  };
}
