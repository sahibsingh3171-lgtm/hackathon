/**
 * **Adaptive questionnaire**: which `INTAKE_FLOW_STEPS` indices are “due.”
 */
export {
  computeDueIntakeStepIndices,
  humanLabelsForInferredSteps,
  nextDueCursorAfterAdvance,
  sortStepIdsByFlow,
} from "@/lib/clarity/intake-due-steps";
export { INTAKE_FLOW_STEP_TOTAL, INTAKE_FLOW_STEPS } from "@/lib/clarity/intake-flow-config";
