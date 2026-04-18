/**
 * Deterministic post-processing for brain-dump → intake extraction.
 * Produces a single canonical `stillNeededStepIds` list so the UI does not depend
 * on imperfect model ordering or length.
 */

import { sortStepIdsByFlow } from "@/lib/clarity/intake-due-steps";
import { INTAKE_FLOW_STEPS, LIFE_STRESS_TAG_OPTIONS } from "@/lib/clarity/intake-flow-config";
import { validateIntakeStep } from "@/lib/clarity/intake-flow-validation";
import type { IntakeAnswers } from "@/types/clarity";

import {
  type FullExtractionResult,
  confidenceForStepId,
  fallbackStillNeededStepIds,
  mergeIntakeFromExtraction,
} from "./intake-extraction";

const STEP_IDS = new Set(INTAKE_FLOW_STEPS.map((s) => s.id));
const ALLOWED_STRESS = new Set<string>(LIFE_STRESS_TAG_OPTIONS.map((o) => o.id));

/** Symptom / context screens that can be skipped when strongly inferred (never item 9 here). */
const SYMPTOM_LIKE = new Set<string>([
  "visit_reason",
  "overall_mood",
  ...Array.from({ length: 8 }, (_, i) => `phq9_${i + 1}`),
  ...Array.from({ length: 7 }, (_, i) => `gad7_${i + 1}`),
  "life_stress_tags",
  "sleep_hours_avg",
  "screen_hours_avg",
  "stress_overall",
]);

/** When capping, remove in this order first (tail = lower priority to keep). */
const DROP_PRIORITY: string[] = [
  ...Array.from({ length: 7 }, (_, i) => `gad7_${7 - i}`),
  ...Array.from({ length: 8 }, (_, i) => `phq9_${8 - i}`),
  "screen_hours_avg",
  "sleep_hours_avg",
  "stress_overall",
  "overall_mood",
  "life_stress_tags",
  "visit_reason",
  "therapist_preferences",
];

function stepIndexById(id: string): number {
  return INTAKE_FLOW_STEPS.findIndex((s) => s.id === id);
}

function invalidStepIds(merged: IntakeAnswers): string[] {
  const out: string[] = [];
  for (let i = 0; i < INTAKE_FLOW_STEPS.length; i += 1) {
    const step = INTAKE_FLOW_STEPS[i];
    if (!step) continue;
    if (!validateIntakeStep(i, merged)) out.push(step.id);
  }
  return out;
}

function mergeThemeChipsIntoIntake(intake: IntakeAnswers, chipIds: readonly string[]): IntakeAnswers {
  const fromChips = chipIds.filter((id) => ALLOWED_STRESS.has(id));
  if (!fromChips.length) return intake;
  const cur = Array.isArray(intake.life_stress_tags)
    ? intake.life_stress_tags.filter((x): x is string => ALLOWED_STRESS.has(x))
    : [];
  const merged = [...new Set([...cur, ...fromChips])];
  if (!merged.length) return intake;
  return { ...intake, life_stress_tags: merged };
}

export type BrainDumpSignalTier = "strong" | "moderate" | "weak";

export function brainDumpSignalTier(
  text: string,
  emotionalSignalCount: number,
  lifeStressTagCount: number
): BrainDumpSignalTier {
  const L = text.trim().length;
  if (L >= 320 || (L >= 200 && emotionalSignalCount >= 2)) return "strong";
  if (L >= 140 || emotionalSignalCount >= 1 || lifeStressTagCount >= 2) return "moderate";
  return "weak";
}

function answeredConfidenceThreshold(tier: BrainDumpSignalTier): number {
  if (tier === "strong") return 0.5;
  if (tier === "moderate") return 0.56;
  return 0.62;
}

function conf(merged: IntakeAnswers, fc: Record<string, number>, id: string): number {
  return fc[id] ?? confidenceForStepId(id, undefined, merged);
}

/** Heuristic “rich clinical sketch” beyond length — boosts confidence for symptom pruning. */
function lexicalRichSignals(lower: string): boolean {
  const sleep = /\b(3\s*am|2\s*am|4\s*am|wake|waking|insomnia|sleep)\b/i.test(lower);
  const mood = /\b(hollow|empty|motion|going through|get out of bed|out of bed|dramatic|therap)\b/i.test(
    lower
  );
  const stress = /\b(stress|work|exhaust|overwhelm)\b/i.test(lower);
  return (sleep && mood) || (mood && stress) || lower.length > 400;
}

function maxStepsForTier(tier: BrainDumpSignalTier): number {
  if (tier === "strong") return 10;
  if (tier === "moderate") return 14;
  return 20;
}

function isProtectedFromCap(id: string, merged: IntakeAnswers): boolean {
  if (id === "phq9_9") return true;
  const idx = stepIndexById(id);
  if (idx < 0) return true;
  if (!validateIntakeStep(idx, merged)) return true;
  return false;
}

/**
 * Shrink `ordered` to at most `max` ids by dropping validated, non-safety symptom screens first.
 */
function capStillNeededList(ordered: string[], merged: IntakeAnswers, max: number): string[] {
  if (ordered.length <= max) return ordered;
  const set = new Set(ordered);
  const dropOrder = [...DROP_PRIORITY, ...INTAKE_FLOW_STEPS.map((s) => s.id)].filter((id) =>
    set.has(id)
  );
  const uniqDrop: string[] = [];
  const seen = new Set<string>();
  for (const id of dropOrder) {
    if (seen.has(id)) continue;
    seen.add(id);
    uniqDrop.push(id);
  }

  while (set.size > max) {
    let removed = false;
    for (const id of uniqDrop) {
      if (!set.has(id)) continue;
      if (isProtectedFromCap(id, merged)) continue;
      set.delete(id);
      removed = true;
      break;
    }
    if (!removed) break;
  }
  return sortStepIdsByFlow([...set]);
}

export type FinalizeBrainDumpCanonicalInput = {
  existing: IntakeAnswers;
  model: FullExtractionResult;
  brainDumpText: string;
  themeChipIds: readonly string[];
};

/**
 * Merge model output + brain-dump themes into merged intake, expand answered set using
 * validation + confidence, reconcile stillNeeded vs answered, enforce safety/logistics,
 * and cap length for strong brain dumps.
 */
export function finalizeBrainDumpCanonical(input: FinalizeBrainDumpCanonicalInput): FullExtractionResult {
  const { existing, model, brainDumpText, themeChipIds } = input;

  let merged = mergeIntakeFromExtraction(existing, model.intakePatch);
  merged = mergeThemeChipsIntoIntake(merged, themeChipIds);

  const lifeTagN = Array.isArray(merged.life_stress_tags) ? merged.life_stress_tags.length : 0;
  const tier = brainDumpSignalTier(brainDumpText, model.emotionalSignals.length, lifeTagN);
  const thr = answeredConfidenceThreshold(tier);

  const fieldConfidence: Record<string, number> = { ...model.fieldConfidence };
  const lower = brainDumpText.toLowerCase();
  if (tier !== "weak" && lexicalRichSignals(lower)) {
    for (const id of SYMPTOM_LIKE) {
      const idx = stepIndexById(id);
      if (idx < 0) continue;
      if (validateIntakeStep(idx, merged) && (fieldConfidence[id] ?? 0) < 0.62) {
        fieldConfidence[id] = Math.max(fieldConfidence[id] ?? 0, 0.6);
      }
    }
  }

  const answered = new Set(
    model.answeredStepIds.filter((id) => STEP_IDS.has(id)).map((id) => id)
  );

  for (const id of STEP_IDS) {
    if (!SYMPTOM_LIKE.has(id)) continue;
    const idx = stepIndexById(id);
    if (idx < 0) continue;
    if (validateIntakeStep(idx, merged) && conf(merged, fieldConfidence, id) >= thr) {
      answered.add(id);
    }
  }

  const modelStill = model.stillNeededStepIds.length
    ? sortStepIdsByFlow(model.stillNeededStepIds.filter((id) => STEP_IDS.has(id)))
    : fallbackStillNeededStepIds(merged, fieldConfidence);

  const invalid = invalidStepIds(merged);
  const union = new Set<string>([...modelStill, ...invalid, "phq9_9"]);

  const reconciled: string[] = [];
  for (const id of sortStepIdsByFlow([...union])) {
    if (id === "phq9_9") {
      reconciled.push(id);
      continue;
    }
    if (SYMPTOM_LIKE.has(id) && answered.has(id)) {
      const idx = stepIndexById(id);
      if (idx >= 0 && validateIntakeStep(idx, merged)) continue;
    }
    if (!SYMPTOM_LIKE.has(id) && answered.has(id)) {
      const idx = stepIndexById(id);
      if (idx >= 0 && validateIntakeStep(idx, merged)) continue;
    }
    reconciled.push(id);
  }

  const deduped = sortStepIdsByFlow([...new Set(reconciled)]);
  const invalidN = invalid.length;
  const baseMax = maxStepsForTier(tier);
  const max = Math.min(
    28,
    Math.max(baseMax, Math.min(invalidN + 8, 24), invalidN > 12 ? invalidN + 4 : 0)
  );
  const stillNeededStepIds = capStillNeededList(deduped, merged, max);

  const intakePatch: Partial<IntakeAnswers> = { ...model.intakePatch };
  if (merged.life_stress_tags?.length) {
    intakePatch.life_stress_tags = merged.life_stress_tags;
  }

  const answeredStepIds = sortStepIdsByFlow([...answered]);

  return {
    ...model,
    intakePatch,
    fieldConfidence,
    answeredStepIds,
    stillNeededStepIds,
    inferredStepIds: stillNeededStepIds,
  };
}
