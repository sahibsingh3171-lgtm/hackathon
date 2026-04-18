/**
 * **Headline / themes summary** — prompts, parser, mock fallback (no HTTP here).
 */
export { buildMockSummary } from "@/lib/ai/mock-summary";
export { parseAiSummaryResult } from "@/lib/ai/parse-summary";
export { buildSummaryUserPayload, SUMMARY_SYSTEM } from "@/lib/ai/prompts";
