import { INTAKE_FLOW_STEPS } from "./intake-flow-config";
import { validateIntakeStep } from "./intake-flow-validation";
import type { IntakeAnswers } from "@/types/clarity";

/** Sort questionnaire step ids in canonical flow order; drop unknowns and duplicates. */
export function sortStepIdsByFlow(ids: readonly string[]): string[] {
  const order = new Map(INTAKE_FLOW_STEPS.map((s, i) => [s.id, i]));
  const seen = new Set<string>();
  return [...ids]
    .filter((id) => {
      if (!order.has(id) || seen.has(id)) return false;
      seen.add(id);
      return true;
    })
    .sort((a, b) => (order.get(a)! - order.get(b)!));
}

/**
 * Indices into `INTAKE_FLOW_STEPS` for the wizard.
 * When `intakeWizardStepIds` is set (brain-dump extraction path), only those screens appear.
 * Otherwise: invalid answers, or prefilled values not yet continued past (classic path).
 */
export function computeDueIntakeStepIndices(
  intake: IntakeAnswers,
  prefilledStepIds: readonly string[] | undefined,
  confirmedStepIds: readonly string[] | undefined,
  wizardStepIds?: readonly string[] | null
): number[] {
  if (wizardStepIds && wizardStepIds.length > 0) {
    return sortStepIdsByFlow(wizardStepIds)
      .map((id) => INTAKE_FLOW_STEPS.findIndex((s) => s.id === id))
      .filter((i) => i >= 0);
  }

  const inferred = new Set(prefilledStepIds ?? []);
  const confirmed = new Set(confirmedStepIds ?? []);
  const out: number[] = [];
  for (let i = 0; i < INTAKE_FLOW_STEPS.length; i += 1) {
    const step = INTAKE_FLOW_STEPS[i];
    if (!step) continue;
    const valid = validateIntakeStep(i, intake);
    if (!valid) {
      out.push(i);
      continue;
    }
    if (inferred.has(step.id) && !confirmed.has(step.id)) {
      out.push(i);
    }
  }
  return out;
}

/** Next cursor in `due` after advancing from `currentReal` (exclusive greater index in flow order). */
export function nextDueCursorAfterAdvance(
  dueAfter: readonly number[],
  currentReal: number
): number {
  if (dueAfter.length === 0) return 0;
  const pos = dueAfter.findIndex((ri) => ri > currentReal);
  if (pos !== -1) return pos;
  return 0;
}

/** Calm, short labels for the review card — not the full questionnaire wording. */
function gentleLabelForStepId(id: string): string | null {
  if (id === "visit_reason") return "What brought you here (first pass)";
  if (id === "overall_mood") return "How heavy things have felt lately";
  if (id === "life_stress_tags") return "Stressors or strains you named";
  if (id === "sleep_hours_avg") return "Rough sleep hours";
  if (id === "screen_hours_avg") return "Rough screen time";
  if (id === "stress_overall") return "Stress in the body";
  if (id === "therapy_history") return "Therapy experience";
  if (id === "budget_range") return "Session cost range (rough)";
  if (id === "insurance") return "How you might pay";
  if (id === "modality_preference") return "In person or online";
  if (id === "therapist_preferences") return "Therapist preferences";
  if (id === "therapy_goals") return 'What "better" could look like';
  const phq = /^phq9_(\d+)$/.exec(id);
  if (phq) return `Mood & energy — prompt ${phq[1]} of 9`;
  const gad = /^gad7_(\d+)$/.exec(id);
  if (gad) return `Worry & tension — prompt ${gad[1]} of 7`;
  return null;
}

/** Step id + short label for the “gentle read” review (fixed questionnaire steps). */
export function humanLabelsForInferredSteps(
  inferredStepIds: readonly string[]
): { id: string; label: string }[] {
  const out: { id: string; label: string }[] = [];
  const seenId = new Set<string>();
  for (const id of inferredStepIds) {
    if (seenId.has(id)) continue;
    const meta = INTAKE_FLOW_STEPS.find((s) => s.id === id);
    if (!meta) continue;
    seenId.add(id);
    const gentle = gentleLabelForStepId(id);
    const label =
      gentle ??
      (meta.title.length > 48 ? `${meta.title.slice(0, 45)}…` : meta.title);
    out.push({ id, label });
  }
  return out.slice(0, 10);
}
