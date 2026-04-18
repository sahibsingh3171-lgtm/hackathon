/**
 * Contract types for the Clarity **readiness analysis** AI layer (structured output).
 *
 * Runtime validation, Zod schemas, normalization, and samples:
 * `@/lib/ai/readiness-analysis.contract`.
 *
 * JSON Schema (response): `src/schemas/readiness-analysis-response.schema.json`.
 */

/** How strongly the user might consider professional support — not a clinical verdict. */
export type TherapyConsiderationLevel =
  | "monitor"
  | "consider_support"
  | "strongly_consider_support";

/**
 * What the model receives: structured intake (from the wizard) plus optional lifestyle
 * and brain-dump material. Shapes are intentionally permissive at the edges (`unknown`)
 * so the server can forward Convex/session JSON without tight coupling here.
 */
export interface ReadinessAnalysisRequest {
  /** Normalized wizard output (e.g. `buildStructuredIntakeForAnalysis`). */
  intakeStructured: unknown;
  /** Optional raw `intake` map for backward compatibility or debugging. */
  intakeRaw?: Record<string, unknown>;
  lifestyle?: unknown | null;
  /** Rich brain dump when available. */
  brainDump?: {
    text: string;
    themes?: string[];
    voice?: unknown;
  } | null;
  /** Optional shorthand when only free text is forwarded. */
  brainDumpPlainText?: string;
}

/**
 * Strongly structured model output. All list fields should be short phrases or single
 * sentences suitable for UI and prep artifacts.
 */
export interface ReadinessAnalysisResponse {
  therapyConsiderationLevel: TherapyConsiderationLevel;
  /** One short paragraph, plain language, no diagnosis. */
  conciseSummary: string;
  /** 3–7 bullets the user would recognize as “about me”. */
  mainConcerns: string[];
  /** Recurring emotional “shapes” (e.g. guilt–spiral, shutdown after conflict). */
  emotionalPatterns: string[];
  /** Where gentle professional help could matter (themes, not labels). */
  potentialSupportAreas: string[];
  /** Small self-care / pacing ideas — not treatment plans. */
  lowFrictionInterventions: string[];
  /** Printable-style narrative for a first therapy visit. */
  therapyPrepSummary: string;
  /** Traits / modalities / focus to bias matching copy (not real directory data). */
  suggestedTherapistTraits: string[];
  /** True when copy or signals warrant urgent-resource messaging in UI. */
  crisisFlag: boolean;
  /** Human-readable reason for `crisisFlag` (empty or null when false). */
  crisisReason: string | null;
  /** Short reflective paragraph suitable for a private journal export. */
  journalSummary: string;
  /** Questions the user might ask a clinician in session one. */
  recommendedQuestionsForTherapy: string[];
  /** How confident the model is and what it did not see (epistemic humility). */
  confidenceNotes: string[];
  /** Hard limits of the tool (not therapy, not crisis service, etc.). */
  limitations: string[];
}
