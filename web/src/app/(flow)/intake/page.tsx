"use client";

/*
 * Route: `/intake` — PHQ/GAD-inspired questionnaire + goals/budget/modality (see `INTAKE_FLOW_STEPS`).
 * The wizard component decides which screens show based on brain-dump extraction + validation.
 */
import { IntakeFlowWizard } from "@/components/intake/IntakeFlowWizard";

export default function IntakePage() {
  return (
    <div className="relative flex flex-1 flex-col">
      <IntakeFlowWizard />
    </div>
  );
}
