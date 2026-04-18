/**
 * **Structured readiness analysis** — prompts, contract, crisis layer, mocks.
 */
export { augmentReadinessAnalysisWithCrisisHeuristics } from "@/lib/ai/readiness-analysis-crisis";
export { buildReadinessAnalysisMock } from "@/lib/ai/readiness-analysis-mock";
export {
  buildReadinessAnalysisUserPayload,
  READINESS_ANALYSIS_QA_EXAMPLE_A_INPUT,
  READINESS_ANALYSIS_QA_EXAMPLE_A_OUTPUT,
  READINESS_ANALYSIS_QA_EXAMPLE_B_INPUT,
  READINESS_ANALYSIS_QA_EXAMPLE_B_OUTPUT,
  READINESS_ANALYSIS_SYSTEM,
} from "@/lib/ai/readiness-analysis-prompts";
export type { ReadinessAnalysisUserContextPayload } from "@/lib/ai/readiness-analysis-prompts";
export {
  FALLBACK_READINESS_ANALYSIS_RESPONSE,
  normalizeReadinessAnalysisResponse,
  parseReadinessAnalysisRequest,
  parseReadinessAnalysisResponse,
  readinessAnalysisRequestSchema,
  readinessAnalysisResponseSchema,
  SAMPLE_READINESS_ANALYSIS_RESPONSE,
  therapyConsiderationLevelSchema,
} from "@/lib/ai/readiness-analysis.contract";
export type { ReadinessAnalysisRequestValidated } from "@/lib/ai/readiness-analysis.contract";
