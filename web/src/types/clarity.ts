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

/**
 * Lightweight “first session” rehearsal — prompts + suggested phrasing from the user’s own inputs.
 * Not therapy and not an AI clinician; see `buildPracticeSession` copy and UI disclaimers.
 */
export interface PracticeSessionPromptBlock {
  id: string;
  /** Plain-language question a therapist might ask in a first meeting. */
  question: string;
  /** Short lines the user could try aloud; paraphrase freely — not a script. */
  exampleLines: string[];
}

export interface PracticeSessionContent {
  /** One calm line framing the whole page. */
  intro: string;
  /** Short banner text — practice only, not treatment. */
  notTherapyBanner: string;
  /** Supporting disclaimer (limits, no diagnosis). */
  notTherapyBody: string;
  /** If you freeze — simple openers. */
  freezeStarters: string[];
  prompts: PracticeSessionPromptBlock[];
}

export type ModalityFilter = "any" | "in_person" | "telehealth";

export interface MatchPreferences {
  specialties: string[];
  maxBudgetUsd?: number;
  modality: ModalityFilter;
  insurance: string[];
  /** Optional city, state, or region substring for soft location fit (mock matching). */
  locationPreference?: string;
  /** Identity / cultural lenses the user wants their therapist fluent in (soft signal). */
  identityFocus?: string[];
  /** Session style the user is drawn to (e.g. Warm, Direct, Structured). */
  styleTags?: string[];
  /** High-level therapy approaches the user has heard of and is curious about. */
  approaches?: string[];
  /** Languages the user wants the session in (beyond English). */
  languages?: string[];
  /** Bias top of list toward lower fees when true (sliding scale / budget stretched). */
  prioritizeAffordability?: boolean;
}

/** Rich output from brain-dump → intake extraction (non-diagnostic; supports UI + wizard filtering). */
export type IntakeExtractionMeta = {
  /** Model-estimated confidence 0–1 per questionnaire step id that received a value. */
  fieldConfidence?: Record<string, number>;
  /** Step ids the model considers satisfied without further screens (subset of all steps). */
  answeredStepIds?: string[];
  /** Short internal rationale (not shown as clinical fact). */
  reasoningSummary?: string;
  /** One calm line for the user (optional). */
  trustLine?: string;
  /** Free-form themes (e.g. sleep_disturbance, emptiness, self_minimizing) — not diagnoses. */
  emotionalSignals?: string[];
};

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
   * Step ids whose fields were prefilled from the brain-dump extraction patch (for gentle read +
   * “light draft” banners). Not the same as `intakeWizardStepIds` (screens still to show).
   */
  intakePrefilledStepIds?: string[];
  /** Prefilled step ids the user has continued past in the check-in wizard. */
  intakeConfirmedStepIds?: string[];
  /**
   * When set, the check-in wizard only shows these questionnaire step ids in flow order.
   * Cleared on skip-brain-dump or reset. Null = classic full wizard.
   */
  intakeWizardStepIds?: string[] | null;
  /** Latest extraction metadata (confidence, signals, summaries). */
  intakeExtractionMeta?: IntakeExtractionMeta | null;
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
