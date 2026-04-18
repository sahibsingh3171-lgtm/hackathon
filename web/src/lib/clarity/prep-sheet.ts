import { intakeFlowHighlightLines } from "./intake-flow-highlights";
import type { ClaritySession, TherapyPrepSheet } from "@/types/clarity";

export function intakeHighlightLines(intake: ClaritySession["intake"]): string[] {
  return intakeFlowHighlightLines(intake);
}

export function lifestyleHighlightLines(session: ClaritySession): string[] {
  const L = session.lifestyle;
  if (!L) return ["No lifestyle snapshot saved."];
  const lines: string[] = [];
  lines.push(`Mood (self-report scale): ${L.mood} / 5`);
  lines.push(`Sleep quality: ${L.sleepQuality} / 5`);
  if (L.sleepHoursApprox != null) lines.push(`Approximate sleep hours: ${L.sleepHoursApprox}`);
  lines.push(`Stress: ${L.stressLevel} / 5`);
  if (L.screenTime.mode === "hours_estimate" && L.screenTime.hoursApprox != null) {
    lines.push(`Screen time (your estimate): ~${L.screenTime.hoursApprox} hrs / day`);
  } else {
    lines.push(
      L.screenTime.screenshotNote
        ? `Screen time: screenshot / note — ${L.screenTime.screenshotNote}`
        : "Screen time: noted for discussion with a professional (no auto tracking)."
    );
  }
  return lines;
}

export function buildPrepSheet(session: ClaritySession): TherapyPrepSheet | null {
  if (!session.summary || !session.nextSteps?.length) return null;
  const excerpt = session.brainDump?.text?.trim() ?? "";
  return {
    sessionId: session.id,
    createdAt: new Date().toISOString(),
    summary: session.summary,
    nextSteps: session.nextSteps,
    intakeHighlights: intakeHighlightLines(session.intake),
    lifestyleHighlights: lifestyleHighlightLines(session),
    brainDumpExcerpt:
      excerpt.slice(0, 600) + (excerpt.length > 600 ? "…" : "") || "(No brain dump text saved.)",
  };
}
