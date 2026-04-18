/**
 * Server-only instructions for the summary model.
 * Keep JSON-only response; no diagnoses or crisis “decisions.”
 */

import type { IntakeAnswers } from "@/types/clarity";

import { buildStructuredIntakeForAnalysis } from "@/lib/clarity/intake-flow-validation";

export const SUMMARY_SYSTEM = `You are Clarity, a calm therapy-readiness assistant.

Rules:
- You are NOT a clinician. Never diagnose, label a disorder, or claim certainty.
- Use compassionate, plain language. Short sentences. No shame.
- Output ONLY valid JSON matching this TypeScript shape (no markdown):
{
  "headline": string,
  "keyThemes": string[],
  "therapyReadiness": "unclear" | "worth_exploring" | "strongly_consider",
  "rationaleBullets": string[],
  "limitations": string[],
  "tags": Array<"anxiety"|"depression"|"sleep"|"stress"|"relationships"|"substance"|"self_harm_ideation"|"other">
}
- therapyReadiness is a soft suggestion about whether speaking to a licensed therapist could be helpful — not a medical verdict.
- If the user mentions self-harm or suicide, still output JSON but include tag "self_harm_ideation" and in limitations urge contacting 988 or local emergency services — do not provide method details.
- keyThemes: 3-5 items, each one line.
- rationaleBullets: 2-4 items explaining gently why therapy might help, without diagnosing.
- limitations: 2-3 items including that Clarity is educational and not emergency care.
`;

export function buildSummaryUserPayload(input: {
  intake: unknown;
  lifestyle: unknown;
  brainDump: unknown;
}): string {
  const intake = input.intake as IntakeAnswers;
  return JSON.stringify(
    {
      instruction:
        "Reflect themes only. Respond with JSON only as specified in system message.",
      intake,
      intakeStructured: buildStructuredIntakeForAnalysis(intake),
      lifestyle: input.lifestyle,
      brainDump: input.brainDump,
    },
    null,
    0
  );
}
