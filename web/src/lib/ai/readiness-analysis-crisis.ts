import { evaluateSessionCrisisLevel } from "@/lib/clarity/crisis-heuristics";
import type { BrainDump, IntakeAnswers } from "@/types/clarity";
import type { ReadinessAnalysisResponse } from "@/types/readiness-analysis";

function collectReflectiveText(intake: IntakeAnswers, brainDump: BrainDump | null): string {
  const parts: string[] = [];
  const push = (v: unknown) => {
    if (typeof v === "string" && v.trim()) parts.push(v.trim());
  };
  push(intake.visit_reason);
  push(intake.therapy_goals);
  push(intake.therapist_preferences);
  if (brainDump?.text) push(brainDump.text);
  return parts.join("\n");
}

/**
 * If lightweight heuristics suggest elevated risk but the model omitted crisisFlag,
 * turn the flag on with a humane reason. Does not downgrade model crisis output.
 */
export function augmentReadinessAnalysisWithCrisisHeuristics(
  intake: IntakeAnswers,
  brainDump: BrainDump | null,
  analysis: ReadinessAnalysisResponse
): ReadinessAnalysisResponse {
  const blob = collectReflectiveText(intake, brainDump);
  const level = evaluateSessionCrisisLevel(intake, blob);
  if (level === "none") return analysis;

  const serverReason =
    level === "urgent"
      ? "Your words or screening answers suggested possible self-harm risk. If you might act on these thoughts, call or text 988 (U.S.) or your local emergency number. Clarity is not a crisis service."
      : "Your responses suggested significant distress. Connecting with 988 or a licensed professional soon may help. This tool cannot assess risk fully.";

  if (!analysis.crisisFlag) {
    const extra =
      "A safety check on your text (not a clinical assessment) also flagged elevated concern.";
    return {
      ...analysis,
      therapyConsiderationLevel:
        analysis.therapyConsiderationLevel === "monitor"
          ? "consider_support"
          : analysis.therapyConsiderationLevel,
      crisisFlag: true,
      crisisReason: serverReason,
      limitations: Array.from(
        new Set([
          ...analysis.limitations,
          extra,
          "If you are in immediate danger, use emergency services or 988 (U.S.).",
        ])
      ).slice(0, 8),
    };
  }

  if (!analysis.crisisReason?.trim()) {
    return { ...analysis, crisisReason: serverReason };
  }

  return analysis;
}
