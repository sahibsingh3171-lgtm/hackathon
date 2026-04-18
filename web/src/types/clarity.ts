/** Domain types for Clarity — therapy readiness MVP (not diagnostic). */

import type { ReadinessAnalysisResponse } from "./readiness-analysis";

export type SessionId = string;

export type Likert = 1 | 2 | 3 | 4 | 5;

export interface IntakeAnswers {
  /** Wizard position (persisted for refresh) */
  intakeFlowStep?: number;
  visit_reason?: string;
  overall_mood?: Likert;
  life_stress_tags?: string[];
  sleep_hours_avg?: number;
  screen_hours_avg?: number;
  stress_overall?: Likert;
  therapy_history?: string;
  budget_range?: string;
  insurance?: string;
  modality_preference?: string;
  therapist_preferences?: string;
  therapy_goals?: string;
  /** Denormalized from brain dump step for structured export / AI payload. */
  brain_dump_tags?: string[];
  [questionId: string]: Likert | string | string[] | boolean | number | undefined;
}

export interface LifestyleSnapshot {
  mood: Likert;
  sleepQuality: Likert;
  sleepHoursApprox?: number;
  /**
   * Optional only: a short label if the user might bring a sleep-app screenshot to therapy.
   * MVP stores filename/size only in-browser — no OCR or cloud upload.
   */
  sleepChartNote?: string;
  sleepChartAttachmentMeta?: { fileName: string; size: number; type: string };
  stressLevel: Likert;
  screenTime: {
    mode: "hours_estimate" | "screenshot_attached";
    hoursApprox?: number;
    screenshotNote?: string;
    attachmentMeta?: { fileName: string; size: number; type: string };
  };
}

export type VoiceStatus = "skipped" | "recorded" | "unsupported";

export interface BrainDump {
  text: string;
  /** Optional mood / topic chips — included in structured analysis payload. */
  themes?: string[];
  voice?: {
    status: VoiceStatus;
    durationSec?: number;
    blobMeta?: { mimeType: string; size: number };
  };
}

export type ConcernTag =
  | "anxiety"
  | "depression"
  | "sleep"
  | "stress"
  | "relationships"
  | "substance"
  | "self_harm_ideation"
  | "other";

export type TherapyReadiness = "unclear" | "worth_exploring" | "strongly_consider";

export interface AiSummaryResult {
  headline: string;
  keyThemes: string[];
  therapyReadiness: TherapyReadiness;
  rationaleBullets: string[];
  limitations: string[];
  tags: ConcernTag[];
  generatedAt: string;
  /** Present when server used offline mock (no API key or parse failure) */
  usedMock?: boolean;
}

export interface NextStepItem {
  id: string;
  title: string;
  description: string;
  category: "education" | "self_care" | "professional";
}

export interface TherapyPrepSheet {
  sessionId: SessionId;
  createdAt: string;
  summary: AiSummaryResult;
  nextSteps: NextStepItem[];
  intakeHighlights: string[];
  lifestyleHighlights: string[];
  brainDumpExcerpt: string;
  /** Narrative for “what I’ve been experiencing” — readiness summary or reflection fallback. */
  experiencingNarrative: string;
  /** Emotional patterns from readiness analysis or reflection themes. */
  emotionalPatterns: string[];
  /** Stress tags + concern bullets the model surfaced. */
  triggersAndStressors: string[];
  /** Where professional support might help (readiness) or rationale themes. */
  supportImLookingFor: string[];
  /** Goals and preferences in the user’s voice where possible. */
  whatIWantFromTherapy: string;
  /** Questions to bring — readiness list or gentle defaults. */
  questionsIWantToAsk: string[];
  /** Reminders between sessions + space for handwriting before print. */
  dontForgetInSession: string;
}

export type ModalityFilter = "any" | "in_person" | "telehealth";

export interface MatchPreferences {
  specialties: string[];
  maxBudgetUsd?: number;
  modality: ModalityFilter;
  insurance: string[];
  /** Optional city, state, or region substring for soft location fit (mock matching). */
  locationPreference?: string;
}

export interface Therapist {
  id: string;
  name: string;
  specialties: string[];
  modalities: ("in_person" | "telehealth")[];
  priceFromUsd?: number;
  insuranceTags: string[];
  reviewScore: number;
  reviewCount: number;
  bioShort: string;
  matchReason?: string;
  /** 0–100 heuristic fit score from `rankTherapistMatches` (when present). */
  matchScore?: number;
  /** Longer “why this matches you” copy from the matcher (when present). */
  matchExplanation?: string;
}

export interface ClaritySession {
  id: SessionId;
  updatedAt: string;
  intake: IntakeAnswers;
  /**
   * Intake wizard step ids prefilled from brain-dump extraction (`INTAKE_FLOW_STEPS[].id`).
   * User reviews these (pre-valid) until they tap Continue, which appends to `intakeConfirmedStepIds`.
   */
  intakeInferredStepIds?: string[];
  /** Inferred step ids the user has continued past in the check-in wizard. */
  intakeConfirmedStepIds?: string[];
  lifestyle: LifestyleSnapshot | null;
  brainDump: BrainDump | null;
  summary: AiSummaryResult | null;
  /** Structured readiness layer from `/api/clarity/readiness-analysis` (includes `crisisFlag`). */
  readinessAnalysis: ReadinessAnalysisResponse | null;
  nextSteps: NextStepItem[] | null;
  prepSheet: TherapyPrepSheet | null;
  matchPreferences: MatchPreferences | null;
}

export interface SummaryRequestBody {
  session: Pick<ClaritySession, "intake" | "lifestyle" | "brainDump">;
}

export interface SummaryResponseBody {
  summary: AiSummaryResult;
}

export type CrisisLevel = "none" | "elevated" | "urgent";

// —— API route (`POST /api/clarity/readiness-analysis`) —————————————————————

/** Body the browser sends (same session slice as the legacy summary route). */
export interface ReadinessAnalysisApiRequestBody {
  session: Pick<ClaritySession, "intake" | "lifestyle" | "brainDump">;
}

/** Stable handler response for the client. */
export interface ReadinessAnalysisApiResponseBody {
  analysis: ReadinessAnalysisResponse;
  /** True when OpenAI was skipped or the model response was replaced with a deterministic mock. */
  usedMock: boolean;
  /** False when Zod strict validation failed after normalization (data still usable). */
  strictParseOk: boolean;
}

/** Narrow type for route internals. */
export type ReadinessAnalysisSessionPayload = {
  intake: IntakeAnswers;
  lifestyle: LifestyleSnapshot | null;
  brainDump: BrainDump | null;
};
