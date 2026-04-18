/*
 * Client + server shared heuristics for “maybe show crisis UI” — regex on free text + PHQ-inspired item 9.
 * Judges: this is not a safety assessment product; it only drives copy + banners toward 988 resources.
 */
import type { CrisisLevel, IntakeAnswers } from "@/types/clarity";

import { isScale4 } from "./intake-flow-validation";

/**
 * Lightweight keyword checks for UX-only crisis prompts.
 * Not clinical triage; copy must stay humble and link to 988 / emergency.
 */
const URGENT_PATTERNS = [
  /\bkill myself\b/i,
  /\bend it all\b/i,
  /\bsuicid\w*\b/i,
  /\bcan't go on\b/i,
  /\bcannot go on\b/i,
  /\bhurt myself\b/i,
  /\bself[- ]harm\b/i,
  /\bplan to die\b/i,
];

const ELEVATED_PATTERNS = [
  /\bhopeless\b/i,
  /\bno way out\b/i,
  /\bcan't cope\b/i,
  /\bcannot cope\b/i,
  /\bbreaking down\b/i,
  /\bpanic\b/i,
  /\burge to hurt\b/i,
];

export function evaluateCrisisText(...texts: (string | undefined | null)[]): CrisisLevel {
  const blob = texts.filter(Boolean).join("\n").trim();
  if (!blob) return "none";
  if (URGENT_PATTERNS.some((re) => re.test(blob))) return "urgent";
  if (ELEVATED_PATTERNS.some((re) => re.test(blob))) return "elevated";
  return "none";
}

/** PHQ-9–style item 9: any non-zero self-report elevates UX crisis strip (not triage). */
export function crisisLevelFromPhq9Item9(intake: IntakeAnswers): CrisisLevel {
  const v = intake.phq9_9;
  if (!isScale4(v)) return "none";
  if (v >= 2) return "urgent";
  if (v >= 1) return "elevated";
  return "none";
}

function maxCrisis(a: CrisisLevel, b: CrisisLevel): CrisisLevel {
  const rank = { none: 0, elevated: 1, urgent: 2 };
  return rank[a] >= rank[b] ? a : b;
}

export function evaluateSessionCrisisLevel(
  intake: IntakeAnswers,
  ...texts: (string | undefined | null)[]
): CrisisLevel {
  return maxCrisis(evaluateCrisisText(...texts), crisisLevelFromPhq9Item9(intake));
}
