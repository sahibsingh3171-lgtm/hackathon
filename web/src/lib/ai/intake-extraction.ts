import { z } from "zod";

import { sortStepIdsByFlow } from "@/lib/clarity/intake-due-steps";
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

/** Always re-ask for matching / logistics; PHQ-9 item 9 for safety touchpoint. */
export const EXTRACTION_ALWAYS_STILL_NEEDED = [
  "phq9_9",
  "budget_range",
  "insurance",
  "modality_preference",
] as const;

const extractionCoreSchema = z.object({
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
  stillNeededStepIds: z.array(z.string()).optional(),
  answeredStepIds: z.array(z.string()).optional(),
  reviewStepIds: z.array(z.string()).optional(),
  fieldConfidence: z.record(z.string(), z.number().min(0).max(1)).optional(),
  emotionalSignals: z.array(z.string()).optional(),
  reasoningSummary: z.string().nullable().optional(),
  trustLine: z.string().nullable().optional(),
});

export type FullExtractionResult = {
  intakePatch: Partial<IntakeAnswers>;
  inferredStepIds: string[];
  /** Ordered step ids the wizard should still show (subset of full questionnaire). */
  stillNeededStepIds: string[];
  fieldConfidence: Record<string, number>;
  emotionalSignals: string[];
  reasoningSummary: string;
  trustLine?: string;
  answeredStepIds: string[];
};

/** @deprecated use FullExtractionResult */
export type IntakeExtractionResult = Pick<
  FullExtractionResult,
  "intakePatch" | "inferredStepIds"
>;

function sanitizeTags(raw: string[] | null | undefined): string[] | undefined {
  if (!raw?.length) return undefined;
  const out = raw.filter((id) => OPTION_IDS.life_stress.has(id));
  return out.length ? out : undefined;
}

/** Step ids that received a concrete value in the extraction patch (for gentle read + “light draft”). */
export function derivePrefilledStepIdsFromPatch(patch: Partial<IntakeAnswers>): string[] {
  const ids: string[] = [];
  const push = (cond: boolean, id: string) => {
    if (cond) ids.push(id);
  };
  push(typeof patch.visit_reason === "string" && patch.visit_reason.trim().length > 0, "visit_reason");
  push(patch.overall_mood != null && isLikert5(patch.overall_mood), "overall_mood");
  push(patch.stress_overall != null && isLikert5(patch.stress_overall), "stress_overall");
  push(Array.isArray(patch.life_stress_tags) && patch.life_stress_tags.length > 0, "life_stress_tags");
  push(
    typeof patch.sleep_hours_avg === "number" && Number.isFinite(patch.sleep_hours_avg),
    "sleep_hours_avg"
  );
  push(
    typeof patch.screen_hours_avg === "number" && Number.isFinite(patch.screen_hours_avg),
    "screen_hours_avg"
  );
  push(typeof patch.therapy_history === "string" && patch.therapy_history.trim().length > 0, "therapy_history");
  push(typeof patch.budget_range === "string" && !!patch.budget_range.trim(), "budget_range");
  push(typeof patch.insurance === "string" && !!patch.insurance.trim(), "insurance");
  push(
    typeof patch.modality_preference === "string" && !!patch.modality_preference.trim(),
    "modality_preference"
  );
  push(
    typeof patch.therapist_preferences === "string" && patch.therapist_preferences.trim().length > 0,
    "therapist_preferences"
  );
  push(typeof patch.therapy_goals === "string" && patch.therapy_goals.trim().length > 0, "therapy_goals");
  for (let i = 1; i <= 9; i += 1) {
    const v = (patch as Record<string, unknown>)[`phq9_${i}`];
    if (isScale4(v)) ids.push(`phq9_${i}`);
  }
  for (let i = 1; i <= 7; i += 1) {
    const v = (patch as Record<string, unknown>)[`gad7_${i}`];
    if (isScale4(v)) ids.push(`gad7_${i}`);
  }
  return sortStepIdsByFlow(ids);
}

/** Merge brain-dump extraction aggressively (extraction overwrites overlapping keys). */
export function mergeIntakeFromExtraction(
  existing: IntakeAnswers,
  patch: Partial<IntakeAnswers>
): IntakeAnswers {
  const next: IntakeAnswers = { ...existing };
  for (const [key, val] of Object.entries(patch) as [keyof IntakeAnswers, unknown][]) {
    if (val === undefined || val === null) continue;
    if (typeof val === "string" && !val.trim()) continue;
    if (Array.isArray(val) && val.length === 0) continue;
    (next as Record<string, unknown>)[key as string] = val;
  }
  return next;
}

/** Prefer existing user answers when filling gaps only (skip / non-extraction paths). */
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
  parsed: z.infer<typeof extractionCoreSchema>
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

function intakePatchFromCore(
  p: z.infer<typeof extractionCoreSchema>
): Partial<IntakeAnswers> {
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
  return intakePatch;
}

/** Exported for deterministic extraction finalization (`intake-extraction-canonical`). */
export function confidenceForStepId(
  id: string,
  explicit: Record<string, number> | undefined,
  patch: Partial<IntakeAnswers>
): number {
  if (explicit && id in explicit) return explicit[id]!;
  if (id.startsWith("phq9_") || id.startsWith("gad7_")) {
    const k = id as keyof IntakeAnswers;
    const v = patch[k];
    return isScale4(v) ? 0.72 : 0;
  }
  if (id === "visit_reason" && typeof patch.visit_reason === "string" && patch.visit_reason.trim())
    return 0.82;
  if (id === "therapy_goals" && typeof patch.therapy_goals === "string" && patch.therapy_goals.trim())
    return 0.7;
  if (id === "life_stress_tags" && Array.isArray(patch.life_stress_tags) && patch.life_stress_tags.length)
    return 0.74;
  if (id === "overall_mood" && isLikert5(patch.overall_mood)) return 0.78;
  if (id === "stress_overall" && isLikert5(patch.stress_overall)) return 0.76;
  if (id === "sleep_hours_avg" && typeof patch.sleep_hours_avg === "number") return 0.7;
  if (id === "screen_hours_avg" && typeof patch.screen_hours_avg === "number") return 0.62;
  if (id === "therapy_history" && typeof patch.therapy_history === "string") return 0.68;
  return 0;
}

/**
 * When the model omits or under-specifies `stillNeededStepIds`, derive a shorter wizard from
 * merged answers + confidences (always keep logistics + PHQ-9 item 9).
 */
export function fallbackStillNeededStepIds(
  merged: IntakeAnswers,
  fieldConfidence: Record<string, number>
): string[] {
  const out: string[] = [];
  const force = new Set<string>(EXTRACTION_ALWAYS_STILL_NEEDED);
  const conf = (id: string) => fieldConfidence[id] ?? confidenceForStepId(id, undefined, merged);

  for (let i = 0; i < INTAKE_FLOW_STEPS.length; i += 1) {
    const step = INTAKE_FLOW_STEPS[i];
    if (!step) continue;
    const id = step.id;
    if (force.has(id)) {
      out.push(id);
      continue;
    }
    const valid = validateIntakeStep(i, merged);
    if (!valid) {
      out.push(id);
      continue;
    }
    if (conf(id) < 0.66) {
      out.push(id);
    }
  }
  return sortStepIdsByFlow(out);
}

export function normalizeFullExtraction(raw: unknown): FullExtractionResult {
  const parsed = extractionCoreSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      intakePatch: {},
      inferredStepIds: [],
      stillNeededStepIds: [],
      fieldConfidence: {},
      emotionalSignals: [],
      reasoningSummary: "",
      answeredStepIds: [],
    };
  }
  const p = parsed.data;
  const intakePatch = intakePatchFromCore(p);
  const fieldConfidence: Record<string, number> = { ...(p.fieldConfidence ?? {}) };
  for (const id of STEP_IDS) {
    if (fieldConfidence[id] !== undefined) continue;
    const c = confidenceForStepId(id, p.fieldConfidence ?? undefined, intakePatch);
    if (c > 0) fieldConfidence[id] = c;
  }

  const emotionalSignals = (p.emotionalSignals ?? []).filter(
    (s) => typeof s === "string" && s.trim().length > 0
  );
  const reasoningSummary = (p.reasoningSummary ?? "").trim();
  const trustLine = p.trustLine?.trim() || undefined;

  const stillNeeded = sortStepIdsByFlow(
    (p.stillNeededStepIds ?? []).filter((id) => STEP_IDS.has(id))
  );
  const answeredStepIds = sortStepIdsByFlow(
    (p.answeredStepIds ?? []).filter((id) => STEP_IDS.has(id))
  );

  const inferredStepIds = (p.inferredStepIds ?? []).filter((id) => STEP_IDS.has(id));
  const review = (p.reviewStepIds ?? []).filter((id) => STEP_IDS.has(id));

  return {
    intakePatch,
    inferredStepIds: inferredStepIds.length ? inferredStepIds : review,
    stillNeededStepIds: stillNeeded,
    fieldConfidence,
    emotionalSignals,
    reasoningSummary,
    trustLine,
    answeredStepIds: answeredStepIds.length ? answeredStepIds : inferredStepIds,
  };
}

/** @deprecated — use normalizeFullExtraction */
export function normalizeExtractionParsed(raw: unknown): IntakeExtractionResult {
  const f = normalizeFullExtraction(raw);
  return { intakePatch: f.intakePatch, inferredStepIds: f.inferredStepIds };
}

function looksLikeSampleHollowDump(t: string): boolean {
  const s = t.toLowerCase();
  return (
    s.includes("3am") &&
    s.includes("hollow") &&
    (s.includes("get out of bed") || s.includes("out of bed")) &&
    (s.includes("therapist") || s.includes("dramatic"))
  );
}

export function buildMockIntakeFromBrainDump(
  text: string,
  themes: string[] | undefined
): FullExtractionResult {
  const t = text.trim();
  if (t.length < 8) {
    return {
      intakePatch: {},
      inferredStepIds: [],
      stillNeededStepIds: sortStepIdsByFlow(INTAKE_FLOW_STEPS.map((s) => s.id)),
      fieldConfidence: {},
      emotionalSignals: [],
      reasoningSummary: "",
      answeredStepIds: [],
    };
  }

  if (looksLikeSampleHollowDump(t)) {
    const patch: Partial<IntakeAnswers> = {
      visit_reason: t.slice(0, 1900),
      overall_mood: 4,
      stress_overall: 4,
      life_stress_tags: ["burnout", "overwhelm", "loneliness"],
      sleep_hours_avg: 5,
      screen_hours_avg: 6,
      therapy_history: "unsure",
      therapy_goals:
        "Figure out whether low days are burnout, something deeper, or both — and what would help without feeling dramatic. Want steadier sleep and mornings that do not feel heavy for no clear reason.",
      therapist_preferences:
        "Someone direct but kind who will not dismiss \"maybe I'm fine\" — experience with high-functioning depression or emptiness is a plus.",
    };
    const phq9: (0 | 1 | 2 | 3)[] = [2, 2, 3, 2, 1, 2, 2, 1, 0];
    const gad7: (0 | 1 | 2 | 3)[] = [2, 2, 2, 2, 2, 2, 2];
    phq9.forEach((v, i) => {
      (patch as Record<string, number>)[`phq9_${i + 1}`] = v;
    });
    gad7.forEach((v, i) => {
      (patch as Record<string, number>)[`gad7_${i + 1}`] = v;
    });

    const fieldConfidence: Record<string, number> = {};
    for (let i = 1; i <= 9; i += 1) {
      fieldConfidence[`phq9_${i}`] = i === 9 ? 0.55 : 0.78;
    }
    for (let i = 1; i <= 7; i += 1) {
      fieldConfidence[`gad7_${i}`] = 0.74;
    }
    fieldConfidence.visit_reason = 0.88;
    fieldConfidence.overall_mood = 0.8;
    fieldConfidence.stress_overall = 0.79;
    fieldConfidence.life_stress_tags = 0.77;
    fieldConfidence.sleep_hours_avg = 0.76;
    fieldConfidence.screen_hours_avg = 0.64;
    fieldConfidence.therapy_history = 0.62;
    fieldConfidence.therapy_goals = 0.71;
    fieldConfidence.therapist_preferences = 0.58;

    const answeredStepIds = sortStepIdsByFlow([
      "visit_reason",
      "overall_mood",
      ...Array.from({ length: 9 }, (_, i) => `phq9_${i + 1}`),
      ...Array.from({ length: 7 }, (_, i) => `gad7_${i + 1}`),
      "life_stress_tags",
      "sleep_hours_avg",
      "screen_hours_avg",
      "stress_overall",
    ]);

    const stillNeededStepIds = sortStepIdsByFlow([
      "therapy_history",
      "phq9_9",
      "therapist_preferences",
      "therapy_goals",
      "budget_range",
      "insurance",
      "modality_preference",
    ]);

    return {
      intakePatch: patch,
      inferredStepIds: stillNeededStepIds,
      stillNeededStepIds,
      fieldConfidence,
      emotionalSignals: [
        "sleep_disturbance",
        "emptiness_or_hollowness",
        "work_stress",
        "motivation_fluctuation",
        "social_masking",
        "therapy_ambivalence",
        "self_minimizing_language",
      ],
      reasoningSummary:
        "Narrative describes early waking, anhedonia-like hollowness, variable motivation, masking with friends, and doubt about therapy value — maps to moderate PHQ/GAD-style frequencies without claiming a diagnosis.",
      trustLine:
        "We sketched answers from the tone of your note — not from a clinical interview. The next screens focus on logistics, safety, and anything you may still want to adjust.",
      answeredStepIds,
    };
  }

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
  else if (/(heavy|drowning|panic|breaking|hollow)/i.test(t)) mood = 4;
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

  const merged = mergeIntakeFromExtraction({}, patch);
  const fc: Record<string, number> = {};
  for (const id of inferred) {
    fc[id] = 0.7;
  }
  const stillNeeded = fallbackStillNeededStepIds(merged, fc);

  return {
    intakePatch: patch,
    inferredStepIds: stillNeeded,
    stillNeededStepIds: stillNeeded,
    fieldConfidence: fc,
    emotionalSignals: [],
    reasoningSummary: "Heuristic mock extraction.",
    trustLine: "A few answers were drafted from keywords — you can change every field.",
    answeredStepIds: inferred,
  };
}

export const INTAKE_EXTRACTION_SYSTEM = `You are Clarity — a careful, non-diagnostic assistant helping someone prepare for therapy (you are not a clinician).

You will read a free-text brain dump (and optional theme chips). Infer meaning **semantically** — the user will not use questionnaire wording. If their experience clearly maps to a symptom pattern over the last ~two weeks, you may fill PHQ-9–style and GAD-7–style items using the same 0–3 frequency scale clinicians sometimes use for self-report (0 = not at all, 3 = nearly every day). Never invent self-harm intent they did not express; keep PHQ-9 item 9 conservative unless there is clear language of self-harm ideation.

You must NOT diagnose, label a disorder, or sound certain about a condition. Use tentative language in reasoningSummary. Prefer helping the user skip redundant screens by filling plausible answers when evidence in the text is **medium or strong**.

### Output JSON (only keys listed; use null when omitting)
{
  "visit_reason": string | null,
  "therapy_goals": string | null,
  "therapist_preferences": string | null,
  "overall_mood": 1-5 | null,
  "stress_overall": 1-5 | null,
  "life_stress_tags": string[] | null,
  "sleep_hours_avg": number | null,
  "screen_hours_avg": number | null,
  "therapy_history": "never"|"past"|"current"|"unsure"|null,
  "budget_range": string | null,
  "insurance": string | null,
  "modality_preference": string | null,
  "phq9": [9 numbers 0-3] | null,
  "gad7": [7 numbers 0-3] | null,
  "fieldConfidence": { "<stepId>": 0-1, ... }  // one entry per step id you materially filled,
  "answeredStepIds": string[],  // step ids you believe are adequately covered (high or medium confidence),
  "stillNeededStepIds": string[], // ordered list of step ids the product should STILL show the user (see rules),
  "emotionalSignals": string[], // short snake_case tags, e.g. sleep_disturbance, emptiness, work_stress, therapy_ambivalence,
  "reasoningSummary": string,    // internal: how you inferred (non-clinical),
  "trustLine": string | null     // one gentle sentence for the UI, optional
}

### Step ids (exact strings)
visit_reason, overall_mood, phq9_1..phq9_9, gad7_1..gad7_7, life_stress_tags, sleep_hours_avg, screen_hours_avg, stress_overall, therapy_history, budget_range, insurance, modality_preference, therapist_preferences, therapy_goals

### stillNeededStepIds rules (critical)
- **Always include** phq9_9, budget_range, insurance, modality_preference (safety + matching logistics) even if you guessed other fields with high confidence.
- Include therapist_preferences and therapy_goals when they are missing, low-confidence, or need the user's voice for matching.
- Include therapy_history when ambivalent or unclear from text.
- **Omit** a step id when you have **medium (>=0.55) or high confidence** AND it is not in the always-include list above, and the text gives enough substance that a reasonable self-report would stand.
- Be **generous** interpreting sleep disruption, fatigue, anhedonia/emptiness, anxiety/worry, irritability, motivation swings, masking, minimization ("maybe I'm dramatic"), and ambivalence about therapy — map them into PHQ/GAD arrays and Likert fields when appropriate.
- life_stress_tags must be subset of: grief, burnout, relationship_stress, loneliness, overwhelm.

Order stillNeededStepIds in the same order as the step ids appear in the list above (visit_reason first, … therapy_goals last), but **only include ids the user must still see**.`;

export function buildIntakeExtractionUserPayload(text: string, themes: string[]): string {
  return JSON.stringify({
    brainDumpText: text.slice(0, 12000),
    themeChips: themes,
    instruction:
      "Return JSON only. stillNeededStepIds must be a short list when the note is rich — aim to remove the majority of redundant symptom screens when confidence is medium+.",
  });
}

/** Keep only inferred ids where merged answers actually pass that step's validation. */
export function refineInferredStepIds(
  existing: IntakeAnswers,
  patch: Partial<IntakeAnswers>,
  claimed: readonly string[]
): string[] {
  const merged = mergeIntakeFromExtraction(existing, patch);
  return claimed.filter((id) => {
    const idx = INTAKE_FLOW_STEPS.findIndex((s) => s.id === id);
    if (idx === -1) return false;
    return validateIntakeStep(idx, merged);
  });
}

export function deriveInferredStepIdsFromPatch(
  existing: IntakeAnswers,
  patch: Partial<IntakeAnswers>
): string[] {
  if (Object.keys(patch).length === 0) return [];
  const merged = mergeIntakeFromExtraction(existing, patch);
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
