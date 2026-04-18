/**
 * Linear flow for Clarity MVP (browser-only session).
 *
 * **Journey:** landing → brain dump (optional voice + text) → check-in (intake; may be shortened after
 * extraction) → daily rhythms → reflection (AI) → matches → practice session (optional rehearsal) →
 * prep sheet → next steps → home.
 *
 * **State:** `ClaritySession` is in-memory only (refresh starts fresh). Brain dump can prefill
 * intake; `intakePrefilledStepIds` / `intakeConfirmedStepIds` drive which wizard screens still appear
 * (see `computeDueIntakeStepIndices` in `intake-due-steps.ts`). `contexts/clarity-session-context` owns
 * hydration, crisis flags, and persistence side effects.
 *
 * **Components:** `BrainDumpInput` captures text/voice; `/api/clarity/intake-from-brain-dump` returns a
 * patch + inferred ids; `IntakeFlowWizard` renders only “due” steps and lets users edit any field.
 * `StepShell` reads `FLOW_STEPS` for progress only.
 */

export const CLARITY_STORAGE_KEY = "clarity_session_v1";

export const FLOW_STEPS = [
  { path: "/brain-dump", label: "Your words", short: "1" },
  { path: "/intake", label: "Check-in", short: "2" },
  { path: "/lifestyle", label: "Daily rhythms", short: "3" },
  { path: "/summary", label: "Reflection", short: "4" },
  { path: "/matches", label: "Matches", short: "5" },
  { path: "/practice-session", label: "Practice", short: "6" },
  { path: "/prep-sheet", label: "Prep sheet", short: "7" },
  { path: "/next-steps", label: "Closing", short: "8" },
] as const;

export type FlowPath = (typeof FLOW_STEPS)[number]["path"];

export function stepIndexForPath(path: string): number {
  const i = FLOW_STEPS.findIndex((s) => s.path === path);
  return i === -1 ? 0 : i;
}
