/**
 * Clarity domain helpers: flow constants, session persistence, intake copy,
 * crisis heuristics, prep sheet, next-step templates. AI + matching live under
 * `lib/ai` and `lib/therapist`; mock rows under `data/`.
 */

export { FLOW_STEPS, stepIndexForPath } from "./constants";
export type { FlowPath } from "./constants";
export {
  crisisLevelFromPhq9Item9,
  evaluateCrisisText,
  evaluateSessionCrisisLevel,
} from "./crisis-heuristics";
export * from "./crisis-copy";
export {
  BUDGET_RANGE_OPTIONS,
  GAD7_PROMPTS,
  INSURANCE_OPTIONS,
  INTAKE_FLOW_STEPS,
  INTAKE_FLOW_STEP_TOTAL,
  LIFE_STRESS_TAG_OPTIONS,
  MODALITY_OPTIONS,
  PHQ9_PROMPTS,
  SCALE4_LABELS,
  THERAPY_HISTORY_OPTIONS,
} from "./intake-flow-config";
export {
  buildLifestyleFromIntake,
  buildMatchPreferencesFromIntake,
  buildStructuredIntakeForAnalysis,
  intakeFlowCompletionCount,
  isIntakeFlowComplete,
  isLikert5,
  isScale4,
  validateIntakeStep,
} from "./intake-flow-validation";
export { intakeFlowHighlightLines } from "./intake-flow-highlights";
export { INTAKE_QUESTIONS, intakeCompletionCount, intakeRequiredComplete, isLikert } from "./intake-questions";
export { buildNextSteps } from "./next-steps-templates";
export { buildPrepSheet, intakeHighlightLines, lifestyleHighlightLines } from "./prep-sheet";
export {
  clearSession,
  createDefaultSession,
  loadSession,
  saveSession,
} from "./session";
