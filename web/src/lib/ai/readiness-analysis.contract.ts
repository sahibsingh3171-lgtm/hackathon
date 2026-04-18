/**
 * Readiness analysis AI contract: Zod schemas, parsing, defaults, and a sample payload.
 * Use this module from the API route when you wire the model — do not duplicate shapes ad hoc.
 */

import { z } from "zod";

import type { ReadinessAnalysisResponse, TherapyConsiderationLevel } from "@/types/readiness-analysis";

// —— Request ——————————————————————————————————————————————————————————————

export const therapyConsiderationLevelSchema = z.enum([
  "monitor",
  "consider_support",
  "strongly_consider_support",
]);

const brainDumpInSchema = z
  .object({
    text: z.string(),
    themes: z.array(z.string()).optional(),
    voice: z.unknown().optional(),
  })
  .strict();

/** Validates inbound payloads for the analysis step (server-side). */
export const readinessAnalysisRequestSchema = z
  .object({
    intakeStructured: z.unknown(),
    intakeRaw: z.record(z.string(), z.unknown()).optional(),
    lifestyle: z.unknown().nullable().optional(),
    brainDump: brainDumpInSchema.nullable().optional(),
    brainDumpPlainText: z.string().optional(),
  })
  .strict();

export type ReadinessAnalysisRequestValidated = z.infer<typeof readinessAnalysisRequestSchema>;

export function parseReadinessAnalysisRequest(raw: unknown) {
  return readinessAnalysisRequestSchema.safeParse(raw);
}

// —— Response helpers —————————————————————————————————————————————————————

function asStringArray(v: unknown): string[] {
  if (Array.isArray(v)) return v.filter((x): x is string => typeof x === "string" && x.trim().length > 0).map((s) => s.trim());
  if (typeof v === "string" && v.trim()) return [v.trim()];
  return [];
}

function asTherapyConsiderationLevel(v: unknown): TherapyConsiderationLevel {
  if (v === "monitor" || v === "consider_support" || v === "strongly_consider_support") return v;
  return "monitor";
}

function asBool(v: unknown, defaultFalse = false): boolean {
  if (typeof v === "boolean") return v;
  if (v === "true") return true;
  if (v === "false") return false;
  return defaultFalse;
}

function asNullableString(v: unknown): string | null {
  if (v == null) return null;
  if (typeof v === "string") {
    const t = v.trim();
    return t.length ? t : null;
  }
  return null;
}

function asNonEmptyString(v: unknown, fallback: string): string {
  if (typeof v === "string" && v.trim()) return v.trim();
  return fallback;
}

/** Lenient preprocess: accept model oddities, then output strict `ReadinessAnalysisResponse`. */
export function normalizeReadinessAnalysisResponse(raw: unknown): ReadinessAnalysisResponse {
  const o = raw && typeof raw === "object" && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {};

  const crisisFlag = asBool(o.crisisFlag, false);
  const crisisReason = asNullableString(o.crisisReason);

  return {
    therapyConsiderationLevel: asTherapyConsiderationLevel(o.therapyConsiderationLevel),
    conciseSummary: asNonEmptyString(
      o.conciseSummary,
      "We summarized what you shared in general terms. A licensed clinician can help you interpret this in context."
    ),
    mainConcerns: asStringArray(o.mainConcerns).length ? asStringArray(o.mainConcerns) : ["Not enough detail to name specific concerns"],
    emotionalPatterns: asStringArray(o.emotionalPatterns),
    potentialSupportAreas: asStringArray(o.potentialSupportAreas),
    lowFrictionInterventions: asStringArray(o.lowFrictionInterventions),
    therapyPrepSummary: asNonEmptyString(
      o.therapyPrepSummary,
      "Bring your own words to a first session — a therapist can help you shape goals together."
    ),
    suggestedTherapistTraits: asStringArray(o.suggestedTherapistTraits),
    crisisFlag,
    crisisReason: crisisFlag ? crisisReason : null,
    journalSummary: asNonEmptyString(
      o.journalSummary,
      "You took time to notice how you have been doing. That alone matters."
    ),
    recommendedQuestionsForTherapy: asStringArray(o.recommendedQuestionsForTherapy).length
      ? asStringArray(o.recommendedQuestionsForTherapy)
      : ["What would progress look like for me in the first few sessions?"],
    confidenceNotes: asStringArray(o.confidenceNotes).length
      ? asStringArray(o.confidenceNotes)
      : ["This reflection is based only on self-report text and checklists, not an interview or records."],
    limitations: asStringArray(o.limitations).length
      ? asStringArray(o.limitations)
      : [
          "Not a diagnosis or crisis service.",
          "Not a substitute for care from a qualified professional.",
        ],
  };
}

/**
 * Strict Zod schema after normalization (for tests / double-checking).
 * Prefer `normalizeReadinessAnalysisResponse` at the boundary, then optional `.safeParse`.
 */
export const readinessAnalysisResponseSchema = z
  .object({
    therapyConsiderationLevel: therapyConsiderationLevelSchema,
    conciseSummary: z.string().min(1),
    mainConcerns: z.array(z.string()).min(1),
    emotionalPatterns: z.array(z.string()),
    potentialSupportAreas: z.array(z.string()),
    lowFrictionInterventions: z.array(z.string()),
    therapyPrepSummary: z.string().min(1),
    suggestedTherapistTraits: z.array(z.string()),
    crisisFlag: z.boolean(),
    crisisReason: z.string().nullable(),
    journalSummary: z.string().min(1),
    recommendedQuestionsForTherapy: z.array(z.string()).min(1),
    confidenceNotes: z.array(z.string()).min(1),
    limitations: z.array(z.string()).min(1),
  })
  .strict();

export type ReadinessAnalysisResponseParsed = z.infer<typeof readinessAnalysisResponseSchema>;

export type ParseReadinessAnalysisResult =
  | { ok: true; data: ReadinessAnalysisResponse; issues?: undefined }
  | { ok: false; data: ReadinessAnalysisResponse; issues: z.ZodIssue[] };

/**
 * Full pipeline: coerce unknown JSON → normalized shape → strict Zod validation.
 * - If strict validation fails (should be rare after normalize), returns `{ ok: false }`
 *   with the **normalized** object and Zod issues (caller may log).
 * - If `raw` is not an object, normalization still yields a safe default object.
 */
export function parseReadinessAnalysisResponse(raw: unknown): ParseReadinessAnalysisResult {
  const normalized = normalizeReadinessAnalysisResponse(raw);
  const strict = readinessAnalysisResponseSchema.safeParse(normalized);
  if (strict.success) {
    return { ok: true, data: strict.data };
  }
  return { ok: false, data: normalized, issues: strict.error.issues };
}

/** Guaranteed valid object for mocks or catastrophic parse failure. */
export const FALLBACK_READINESS_ANALYSIS_RESPONSE: ReadinessAnalysisResponse = {
  therapyConsiderationLevel: "monitor",
  conciseSummary:
    "We could not safely read the model output. Your saved check-in is still yours — try again or bring this to a human clinician.",
  mainConcerns: ["Unable to derive concerns from the model response"],
  emotionalPatterns: [],
  potentialSupportAreas: [],
  lowFrictionInterventions: ["Rest, hydration, and one small block of time without screens today."],
  therapyPrepSummary:
    "If you choose to see someone, describe your week in your own words and what you hope might feel different.",
  suggestedTherapistTraits: ["Warm, collaborative, and comfortable with pacing you set"],
  crisisFlag: false,
  crisisReason: null,
  journalSummary: "You showed up to reflect. That is enough for today.",
  recommendedQuestionsForTherapy: [
    "How would I know if therapy is helping me?",
    "What should I do between sessions when things spike?",
  ],
  confidenceNotes: [
    "The automated summary was unavailable or malformed; this is a neutral placeholder.",
  ],
  limitations: [
    "Clarity does not diagnose or provide crisis care.",
    "This message is not based on a successful model run.",
  ],
};

/** Rich example for docs, tests, and UI fixtures (valid under strict schema). */
export const SAMPLE_READINESS_ANALYSIS_RESPONSE: ReadinessAnalysisResponse = {
  therapyConsiderationLevel: "consider_support",
  conciseSummary:
    "You have been carrying a heavy load for a while — especially around sleep and worry — and you are naming it clearly. Speaking with a therapist could help you feel less alone with the weight.",
  mainConcerns: [
    "Sleep has been uneven and draining",
    "Worry shows up most days",
    "Motivation dips when stress spikes",
  ],
  emotionalPatterns: [
    "Tension rises at night when you finally slow down",
    "Self-critical thoughts after social or work friction",
  ],
  potentialSupportAreas: [
    "Anxiety regulation and wind-down routines",
    "Grief or loss that still echoes in daily life",
    "Boundaries at work without guilt",
  ],
  lowFrictionInterventions: [
    "Five minutes of quiet breathing before bed, no goal beyond arriving",
    "One short walk after lunch, phone left inside",
    "Name one true sentence to yourself on hard evenings",
  ],
  therapyPrepSummary:
    "You might open with how sleep and worry weave together, and that you want practical tools but also space to talk without fixing everything at once. Mention budget and telehealth preferences up front so you and the therapist can align.",
  suggestedTherapistTraits: [
    "Trauma-informed",
    "CBT or ACT-informed for anxiety",
    "Comfortable with telehealth",
    "Affirming of your pace and identity",
  ],
  crisisFlag: false,
  crisisReason: null,
  journalSummary:
    "This week you noticed how tired your mind feels even when your body keeps going. You are allowed to want rest without earning it first.",
  recommendedQuestionsForTherapy: [
    "How would we know if we are a good fit in the first few sessions?",
    "What does progress look like for someone with my kind of stress?",
    "How do you think about medication versus therapy, without pressure?",
  ],
  confidenceNotes: [
    "Themes come only from your self-report and checklists — no medical records or third-party data.",
    "Wording is intentionally cautious; a clinician may see nuance differently.",
  ],
  limitations: [
    "Educational reflection only — not diagnosis or treatment.",
    "If you feel unsafe with yourself, use 988 or local emergency services.",
  ],
};
