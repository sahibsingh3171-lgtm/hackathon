/** Domain types for Clarity — therapy readiness MVP (not diagnostic). */

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
  [questionId: string]: Likert | string | string[] | boolean | number | undefined;
}

export interface LifestyleSnapshot {
  mood: Likert;
  sleepQuality: Likert;
  sleepHoursApprox?: number;
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
}

export type ModalityFilter = "any" | "in_person" | "telehealth";

export interface MatchPreferences {
  specialties: string[];
  maxBudgetUsd?: number;
  modality: ModalityFilter;
  insurance: string[];
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
}

export interface ClaritySession {
  id: SessionId;
  updatedAt: string;
  intake: IntakeAnswers;
  lifestyle: LifestyleSnapshot | null;
  brainDump: BrainDump | null;
  summary: AiSummaryResult | null;
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
