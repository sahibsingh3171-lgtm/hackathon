import { z } from "zod";

import {
  BUDGET_RANGE_OPTIONS,
  INSURANCE_OPTIONS,
  INTAKE_FLOW_STEPS,
  LIFE_STRESS_TAG_OPTIONS,
  MODALITY_OPTIONS,
  THERAPY_HISTORY_OPTIONS,
} from "@/lib/clarity/intake-flow-config";
import {
  isLikert5,
  isScale4,
  validateIntakeStep,
} from "@/lib/clarity/intake-flow-validation";
import type { IntakeAnswers } from "@/types/clarity";

const OPTION_IDS = {
  life_stress: new Set<string>(LIFE_STRESS_TAG_OPTIONS.map((o) => o.id)),
  therapy_history: new Set<string>(THERAPY_HISTORY_OPTIONS.map((o) => o.id)),
  budget: new Set<string>(BUDGET_RANGE_OPTIONS.map((o) => o.id)),
  insurance: new Set<string>(INSURANCE_OPTIONS.map((o) => o.id)),
  modality: new Set<string>(MODALITY_OPTIONS.map((o) => o.id)),
};

const STEP_IDS = new Set(INTAKE_FLOW_STEPS.map((s) => s.id));

const extractionSchema = z.object({
  visit_reason: z.string().nullable().optional(),
  therapy_goals: z.string().nullable().optional(),
  therapist_preferences: z.string().nullable().optional(),
  overall_mood: z.number().int().min(1).max(5).nullable().optional(),
  stress_overall: z.number().int().min(1).max(5).nullable().optional(),
  life_stress_tags: z.array(z.string()).nullable().optional(),
  sleep_hours_avg: z.number().min(0).max(24).nullable().optional(),
  screen_hours_avg: z.number().min(0).max(24).nullable().optional(),
  therapy_history: z.string().nullable().optional(),
  budget_range: z.string().nullable().optional(),
  insurance: z.string().nullable().optional(),
  modality_preference: z.string().nullable().optional(),
  phq9: z.array(z.number().int().min(0).max(3)).length(9).nullable().optional(),
  gad7: z.array(z.number().int().min(0).max(3)).length(7).nullable().optional(),
  inferredStepIds: z.array(z.string()).optional(),
});

export type IntakeExtractionResult = {
  intakePatch: Partial<IntakeAnswers>;
  inferredStepIds: string[];
};

function sanitizeTags(raw: string[] | null | undefined): string[] | undefined {
  if (!raw?.length) return undefined;
  const out = raw.filter((id) => OPTION_IDS.life_stress.has(id));
  return out.length ? out : undefined;
}

/** Merge extraction into existing answers — only fills gaps (empty / missing). */
export function mergeIntakePreferExisting(
  existing: IntakeAnswers,
  patch: Partial<IntakeAnswers>
): IntakeAnswers {
  const next: IntakeAnswers = { ...existing };
  for (const [key, val] of Object.entries(patch) as [keyof IntakeAnswers, unknown][]) {
    if (val === undefined || val === null) continue;
    const cur = next[key];
    if (typeof val === "string") {
      if (!val.trim()) continue;
      if (typeof cur === "string" && cur.trim().length > 0) continue;
      (next as Record<string, unknown>)[key as string] = val;
      continue;
    }
    if (Array.isArray(val)) {
      if (val.length === 0) continue;
      if (Array.isArray(cur) && cur.length > 0) continue;
      (next as Record<string, unknown>)[key as string] = val;
      continue;
    }
    if (typeof val === "number" && Number.isFinite(val)) {
      if (typeof cur === "number" && Number.isFinite(cur)) continue;
      (next as Record<string, unknown>)[key as string] = val;
      continue;
    }
  }
  return next;
}

function phqGadPatchFromArrays(
  parsed: z.infer<typeof extractionSchema>
): Partial<IntakeAnswers> {
  const extra: Partial<IntakeAnswers> = {};
  if (parsed.phq9?.length === 9) {
    parsed.phq9.forEach((v, i) => {
      if (isScale4(v)) {
        (extra as Record<string, number>)[`phq9_${i + 1}`] = v;
      }
    });
  }
  if (parsed.gad7?.length === 7) {
    parsed.gad7.forEach((v, i) => {
      if (isScale4(v)) {
        (extra as Record<string, number>)[`gad7_${i + 1}`] = v;
      }
    });
  }
  return extra;
}

export function normalizeExtractionParsed(raw: unknown): IntakeExtractionResult {
  const parsed = extractionSchema.safeParse(raw);
  if (!parsed.success) {
    return { intakePatch: {}, inferredStepIds: [] };
  }
  const p = parsed.data;
  const intakePatch: Partial<IntakeAnswers> = {};

  if (p.visit_reason?.trim()) intakePatch.visit_reason = p.visit_reason.trim().slice(0, 2000);
  if (p.therapy_goals?.trim()) intakePatch.therapy_goals = p.therapy_goals.trim().slice(0, 2000);
  if (p.therapist_preferences?.trim()) {
    intakePatch.therapist_preferences = p.therapist_preferences.trim().slice(0, 2000);
  }
  if (isLikert5(p.overall_mood)) intakePatch.overall_mood = p.overall_mood;
  if (isLikert5(p.stress_overall)) intakePatch.stress_overall = p.stress_overall;
  const tags = sanitizeTags(p.life_stress_tags ?? undefined);
  if (tags) intakePatch.life_stress_tags = tags;
  if (typeof p.sleep_hours_avg === "number") intakePatch.sleep_hours_avg = p.sleep_hours_avg;
  if (typeof p.screen_hours_avg === "number") intakePatch.screen_hours_avg = p.screen_hours_avg;
  if (p.therapy_history && OPTION_IDS.therapy_history.has(p.therapy_history)) {
    intakePatch.therapy_history = p.therapy_history;
  }
  if (p.budget_range && OPTION_IDS.budget.has(p.budget_range)) {
    intakePatch.budget_range = p.budget_range;
  }
  if (p.insurance && OPTION_IDS.insurance.has(p.insurance)) {
    intakePatch.insurance = p.insurance;
  }
  if (p.modality_preference && OPTION_IDS.modality.has(p.modality_preference)) {
    intakePatch.modality_preference = p.modality_preference;
  }

  Object.assign(intakePatch, phqGadPatchFromArrays(p));

  const inferredStepIds = (p.inferredStepIds ?? []).filter((id) => STEP_IDS.has(id));
  return { intakePatch, inferredStepIds };
}

export function buildMockIntakeFromBrainDump(
  text: string,
  themes: string[] | undefined
): IntakeExtractionResult {
  const t = text.trim();
  if (t.length < 8) return { intakePatch: {}, inferredStepIds: [] };

  const patch: Partial<IntakeAnswers> = {};
  const inferred: string[] = [];

  patch.visit_reason = t.slice(0, 900);
  inferred.push("visit_reason");

  const lower = t.toLowerCase();
  const tags: string[] = [];
  const tagHints: [string, string][] = [
    ["grief", "grief"],
    ["loss", "grief"],
    ["burnout", "burnout"],
    ["exhaust", "burnout"],
    ["relationship", "relationship_stress"],
    ["partner", "relationship_stress"],
    ["lonely", "loneliness"],
    ["alone", "loneliness"],
    ["overwhelm", "overwhelm"],
    ["too much", "overwhelm"],
  ];
  for (const [needle, id] of tagHints) {
    if (lower.includes(needle) && OPTION_IDS.life_stress.has(id) && !tags.includes(id)) {
      tags.push(id);
    }
  }
  if (themes?.length) {
    for (const th of themes) {
      if (OPTION_IDS.life_stress.has(th) && !tags.includes(th)) tags.push(th);
    }
  }
  if (tags.length) {
    patch.life_stress_tags = tags;
    inferred.push("life_stress_tags");
  }

  let mood: 1 | 2 | 3 | 4 | 5 = 3;
  if (/(hopeless|empty|can'?t cope|suicidal|self-harm)/i.test(t)) mood = 5;
  else if (/(heavy|drowning|panic|breaking)/i.test(t)) mood = 4;
  else if (/(stress|tired|hard time|struggling)/i.test(t)) mood = 4;
  else if (/(curious|maybe|figuring|unsure)/i.test(t)) mood = 2;
  patch.overall_mood = mood;
  inferred.push("overall_mood");

  patch.stress_overall = mood;
  inferred.push("stress_overall");

  const goalsLine =
    t.length > 120
      ? `What I want next: ${t.slice(Math.floor(t.length * 0.35), Math.min(t.length, 900)).trim()}`
      : `${t.slice(0, 120)} — still forming what better might look like day to day.`;
  const goals = goalsLine.slice(0, 900);
  if (goals.trim().length >= 12) {
    patch.therapy_goals = goals;
    inferred.push("therapy_goals");
  }

  if (/(never been to therapy|first time|new to therapy)/i.test(t)) {
    patch.therapy_history = "never";
    inferred.push("therapy_history");
  } else if (/(used to see|past therapy|before.*therap)/i.test(t)) {
    patch.therapy_history = "past";
    inferred.push("therapy_history");
  }

  if (/(telehealth|zoom|video session|online)/i.test(t)) {
    patch.modality_preference = "telehealth";
    inferred.push("modality_preference");
  } else if (/(in person|office|face to face)/i.test(t)) {
    patch.modality_preference = "in_person";
    inferred.push("modality_preference");
  }

  if (/(insurance|in-network|oon|out of pocket|medicaid|medicare)/i.test(lower)) {
    if (lower.includes("medicaid") || lower.includes("medicare")) {
      patch.insurance = "public";
      inferred.push("insurance");
    } else if (lower.includes("in-network") || lower.includes("in network")) {
      patch.insurance = "insurance_in";
      inferred.push("insurance");
    } else if (lower.includes("out of network") || lower.includes("reimburs")) {
      patch.insurance = "insurance_oon";
      inferred.push("insurance");
    } else if (lower.includes("private") || lower.includes("out of pocket")) {
      patch.insurance = "private_oop";
      inferred.push("insurance");
    }
  }

  const sh = lower.match(/(\d+(?:\.\d+)?)\s*(?:h|hr|hours?).{0,12}sleep/);
  const sh2 = lower.match(/sleep.{0,20}(\d+(?:\.\d+)?)\s*(?:h|hr|hours?)/);
  const sleepNum = sh?.[1] ?? sh2?.[1];
  if (sleepNum) {
    const n = Math.min(24, Math.max(0, Number(sleepNum)));
    if (Number.isFinite(n)) {
      patch.sleep_hours_avg = n;
      inferred.push("sleep_hours_avg");
    }
  }

  return { intakePatch: patch, inferredStepIds: [...new Set(inferred)] };
}

export const INTAKE_EXTRACTION_SYSTEM = `You are Clarity — a careful assistant helping someone prepare for therapy (not a clinician).

From the user's free-text brain dump (and optional theme chips), extract only information they clearly implied.
Rules:
- Never diagnose. Do not invent trauma, abuse, or clinical labels they did not imply.
- Prefer omission over guessing. If unsure, use null for that field.
- PHQ-9 / GAD-7–style arrays (phq9, gad7): only fill if the user's language clearly maps to frequency over the last two weeks; otherwise null. Each item is 0–3 (not at all → nearly every day). If you fill any item in an instrument, fill all 9 or all 7 consistently.
- life_stress_tags: only use these exact ids: grief, burnout, relationship_stress, loneliness, overwhelm (subset allowed).
- therapy_history ids: never, past, current, unsure
- budget_range: under_80, 80_120, 120_200, 200_plus, prefer_not
- insurance: private_oop, insurance_in, insurance_oon, public, unsure_ins
- modality_preference: telehealth, in_person, either
- inferredStepIds: list every intake step id you populated with a confident value. Valid step ids are the keys in the schema output you were given — use exact ids from this list only:
visit_reason, overall_mood, phq9_1..phq9_9, gad7_1..gad7_7, life_stress_tags, sleep_hours_avg, screen_hours_avg, stress_overall, therapy_history, budget_range, insurance, modality_preference, therapist_preferences, therapy_goals

Output ONLY valid JSON:
{
  "visit_reason": string | null,
  "therapy_goals": string | null,
  "therapist_preferences": string | null,
  "overall_mood": number | null,
  "stress_overall": number | null,
  "life_stress_tags": string[] | null,
  "sleep_hours_avg": number | null,
  "screen_hours_avg": number | null,
  "therapy_history": string | null,
  "budget_range": string | null,
  "insurance": string | null,
  "modality_preference": string | null,
  "phq9": number[] | null,
  "gad7": number[] | null,
  "inferredStepIds": string[]
}`;

export function buildIntakeExtractionUserPayload(text: string, themes: string[]): string {
  return JSON.stringify({
    brainDumpText: text.slice(0, 12000),
    themeChips: themes,
    note: "Extract conservatively. JSON only.",
  });
}

/** Keep only inferred ids where merged answers actually pass that step's validation. */
export function refineInferredStepIds(
  existing: IntakeAnswers,
  patch: Partial<IntakeAnswers>,
  claimed: readonly string[]
): string[] {
  const merged = mergeIntakePreferExisting(existing, patch);
  return claimed.filter((id) => {
    const idx = INTAKE_FLOW_STEPS.findIndex((s) => s.id === id);
    if (idx === -1) return false;
    return validateIntakeStep(idx, merged);
  });
}

/** When the model omits `inferredStepIds`, treat steps that became valid only after merge as inferred. */
export function deriveInferredStepIdsFromPatch(
  existing: IntakeAnswers,
  patch: Partial<IntakeAnswers>
): string[] {
  if (Object.keys(patch).length === 0) return [];
  const merged = mergeIntakePreferExisting(existing, patch);
  const ids: string[] = [];
  for (let i = 0; i < INTAKE_FLOW_STEPS.length; i += 1) {
    const step = INTAKE_FLOW_STEPS[i];
    if (!step) continue;
    if (!validateIntakeStep(i, merged)) continue;
    if (!validateIntakeStep(i, existing)) {
      ids.push(step.id);
    }
  }
  return ids;
}
