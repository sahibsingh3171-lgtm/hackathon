import type { IntakeAnswers } from "@/types/clarity";

import { isIntakeFlowComplete } from "@/lib/clarity/intake-flow-validation";

/** @deprecated Legacy list — retained for docs / imports; wizard uses {@link isIntakeFlowComplete}. */
export { INTAKE_QUESTIONS } from "@/lib/clarity/intake-questions";

/** True when the multi-step intake wizard is complete. */
export function intakeRequiredComplete(answers: IntakeAnswers): boolean {
  return isIntakeFlowComplete(answers);
}
