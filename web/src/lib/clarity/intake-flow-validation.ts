import type { BrainDump, IntakeAnswers, LifestyleSnapshot, Likert, MatchPreferences } from "@/types/clarity";

import {
  BUDGET_RANGE_OPTIONS,
  INTAKE_FLOW_STEPS,
  INSURANCE_OPTIONS,
  MODALITY_OPTIONS,
  THERAPY_HISTORY_OPTIONS,
} from "./intake-flow-config";

export function isScale4(v: unknown): v is 0 | 1 | 2 | 3 {
  return v === 0 || v === 1 || v === 2 || v === 3;
}

export function isLikert5(v: unknown): v is Likert {
  return v === 1 || v === 2 || v === 3 || v === 4 || v === 5;
}

function phq9Key(i: number): string {
  return `phq9_${i}`;
}

function gad7Key(i: number): string {
  return `gad7_${i}`;
}

export function validateIntakeStep(stepIndex: number, intake: IntakeAnswers): boolean {
  const step = INTAKE_FLOW_STEPS[stepIndex];
  if (!step) return false;

  switch (step.field) {
    case "visit_reason": {
      const t = typeof intake.visit_reason === "string" ? intake.visit_reason.trim() : "";
      return t.length >= 8;
    }
    case "overall_mood":
      return isLikert5(intake.overall_mood);
    case "phq9_item": {
      const idx = step.itemIndex ?? 0;
      return isScale4(intake[phq9Key(idx)]);
    }
    case "gad7_item": {
      const idx = step.itemIndex ?? 0;
      return isScale4(intake[gad7Key(idx)]);
    }
    case "life_stress_tags": {
      const raw = intake.life_stress_tags;
      return Array.isArray(raw) && raw.length > 0;
    }
    case "sleep_hours_avg": {
      const n = Number(intake.sleep_hours_avg);
      return Number.isFinite(n) && n >= 0 && n <= 24;
    }
    case "screen_hours_avg": {
      const n = Number(intake.screen_hours_avg);
      return Number.isFinite(n) && n >= 0 && n <= 24;
    }
    case "stress_overall":
      return isLikert5(intake.stress_overall);
    case "therapy_history":
      return THERAPY_HISTORY_OPTIONS.some((o) => o.id === intake.therapy_history);
    case "budget_range":
      return BUDGET_RANGE_OPTIONS.some((o) => o.id === intake.budget_range);
    case "insurance":
      return INSURANCE_OPTIONS.some((o) => o.id === intake.insurance);
    case "modality_preference":
      return MODALITY_OPTIONS.some((o) => o.id === intake.modality_preference);
    case "therapist_preferences":
      // optional — always valid (empty allowed)
      return true;
    case "therapy_goals": {
      const t = typeof intake.therapy_goals === "string" ? intake.therapy_goals.trim() : "";
      return t.length >= 12;
    }
    default:
      return false;
  }
}

/** True when every intake flow step passes validation (full wizard complete). */
export function isIntakeFlowComplete(intake: IntakeAnswers): boolean {
  for (let i = 0; i < INTAKE_FLOW_STEPS.length; i += 1) {
    if (!validateIntakeStep(i, intake)) return false;
  }
  return true;
}

/** Count of validated steps (0 … {@link INTAKE_FLOW_STEP_TOTAL}). */
export function intakeFlowCompletionCount(intake: IntakeAnswers): number {
  let n = 0;
  for (let i = 0; i < INTAKE_FLOW_STEPS.length; i += 1) {
    if (validateIntakeStep(i, intake)) n += 1;
  }
  return n;
}

function sleepQualityFromHours(h: number): Likert {
  if (h < 5) return 1;
  if (h < 6.5) return 2;
  if (h < 8) return 4;
  return 5;
}

export function buildLifestyleFromIntake(intake: IntakeAnswers): LifestyleSnapshot {
  const mood = isLikert5(intake.overall_mood) ? intake.overall_mood : 3;
  const sleepH = Number(intake.sleep_hours_avg);
  const screenH = Number(intake.screen_hours_avg);
  const stress = isLikert5(intake.stress_overall) ? intake.stress_overall : 3;
  const hours = Number.isFinite(sleepH) ? sleepH : 7;
  const screen = Number.isFinite(screenH) ? screenH : 4;

  return {
    mood,
    sleepQuality: sleepQualityFromHours(hours),
    sleepHoursApprox: hours,
    stressLevel: stress,
    screenTime: {
      mode: "hours_estimate",
      hoursApprox: screen,
    },
  };
}

export function buildMatchPreferencesFromIntake(intake: IntakeAnswers): MatchPreferences {
  const modalityOpt = MODALITY_OPTIONS.find((o) => o.id === intake.modality_preference);
  const modality = modalityOpt?.modality ?? "any";

  const ins = INSURANCE_OPTIONS.find((o) => o.id === intake.insurance);
  const insuranceLabel = ins?.label ?? "unspecified";

  const budget = intake.budget_range;
  let maxBudgetUsd: number | undefined;
  if (budget === "under_80") maxBudgetUsd = 80;
  else if (budget === "80_120") maxBudgetUsd = 120;
  else if (budget === "120_200") maxBudgetUsd = 200;
  else if (budget === "200_plus") maxBudgetUsd = undefined;
  else maxBudgetUsd = undefined;

  const tags = Array.isArray(intake.life_stress_tags)
    ? (intake.life_stress_tags as string[]).filter(Boolean)
    : [];

  const prefsText =
    typeof intake.therapist_preferences === "string" ? intake.therapist_preferences.trim() : "";

  const specialties = [...tags];
  if (prefsText) specialties.push(`Preferences noted: ${prefsText.slice(0, 120)}`);

  return {
    specialties: specialties.length ? specialties : [],
    maxBudgetUsd,
    modality,
    insurance: [insuranceLabel],
  };
}

/** Structured payload for AI / logging — mirrors session.intake but typed for models. */
export function buildStructuredIntakeForAnalysis(intake: IntakeAnswers, brainDump?: BrainDump | null) {
  const phq9Scores: number[] = [];
  for (let i = 1; i <= 9; i += 1) {
    const v = intake[phq9Key(i)];
    if (isScale4(v)) phq9Scores.push(v);
  }
  const gad7Scores: number[] = [];
  for (let i = 1; i <= 7; i += 1) {
    const v = intake[gad7Key(i)];
    if (isScale4(v)) gad7Scores.push(v);
  }

  return {
    version: 2 as const,
    visitReason: typeof intake.visit_reason === "string" ? intake.visit_reason.trim() : "",
    overallMoodLikert: intake.overall_mood,
    phq9Inspired: {
      itemScores: phq9Scores,
      total: phq9Scores.reduce((a, b) => a + b, 0),
      disclaimer: "Not a administered PHQ-9; self-report reflection only.",
    },
    gad7Inspired: {
      itemScores: gad7Scores,
      total: gad7Scores.reduce((a, b) => a + b, 0),
      disclaimer: "Not a administered GAD-7; self-report reflection only.",
    },
    lifeStressTags: Array.isArray(intake.life_stress_tags) ? intake.life_stress_tags : [],
    sleepHoursAvg: intake.sleep_hours_avg,
    screenHoursAvg: intake.screen_hours_avg,
    stressOverallLikert: intake.stress_overall,
    therapyHistory: intake.therapy_history,
    budgetRange: intake.budget_range,
    insurance: intake.insurance,
    modalityPreference: intake.modality_preference,
    therapistPreferences: intake.therapist_preferences,
    therapyGoals: typeof intake.therapy_goals === "string" ? intake.therapy_goals.trim() : "",
    matchPreferencesPreview: buildMatchPreferencesFromIntake(intake),
    lifestylePreview: buildLifestyleFromIntake(intake),
    brainDumpCompanion: brainDump
      ? {
          themes:
            brainDump.themes?.length && brainDump.themes.length > 0
              ? brainDump.themes
              : Array.isArray(intake.brain_dump_tags)
                ? (intake.brain_dump_tags as string[])
                : [],
          textExcerpt: brainDump.text.trim().slice(0, 800),
          voiceStatus: brainDump.voice?.status ?? "skipped",
          voiceDurationSec: brainDump.voice?.durationSec,
        }
      : null,
  };
}
