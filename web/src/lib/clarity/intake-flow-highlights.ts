import type { IntakeAnswers } from "@/types/clarity";

import { isScale4 } from "./intake-flow-validation";

function sumPhq9(intake: IntakeAnswers): number {
  let s = 0;
  for (let i = 1; i <= 9; i += 1) {
    const v = intake[`phq9_${i}`];
    if (isScale4(v)) s += v;
  }
  return s;
}

function sumGad7(intake: IntakeAnswers): number {
  let s = 0;
  for (let i = 1; i <= 7; i += 1) {
    const v = intake[`gad7_${i}`];
    if (isScale4(v)) s += v;
  }
  return s;
}

/** Prep sheet / UI lines — human readable, not scores. */
export function intakeFlowHighlightLines(intake: IntakeAnswers): string[] {
  const lines: string[] = [];

  const vr = typeof intake.visit_reason === "string" ? intake.visit_reason.trim() : "";
  if (vr) {
    lines.push(`You shared what brought you here: “${vr.slice(0, 200)}${vr.length > 200 ? "…" : ""}”`);
  }

  const phq = sumPhq9(intake);
  if (phq > 0) {
    lines.push(
      `Reflection prompts (depression-themed): combined responses suggest this has been weighing on you — totals are for discussion with a clinician, not a diagnosis.`
    );
  }

  const gad = sumGad7(intake);
  if (gad > 0) {
    lines.push(
      `Anxiety-themed prompts: your answers show how often worry and tension have been present lately — bring this rhythm to a professional if you choose.`
    );
  }

  if (Array.isArray(intake.life_stress_tags) && intake.life_stress_tags.length) {
    lines.push(`Themes you tapped: ${intake.life_stress_tags.join(", ")}`);
  }

  if (intake.sleep_hours_avg != null && Number.isFinite(Number(intake.sleep_hours_avg))) {
    lines.push(`Sleep (your estimate): ~${intake.sleep_hours_avg} hrs / night`);
  }
  if (intake.screen_hours_avg != null && Number.isFinite(Number(intake.screen_hours_avg))) {
    lines.push(`Screen time (your estimate): ~${intake.screen_hours_avg} hrs / day`);
  }

  const goals = typeof intake.therapy_goals === "string" ? intake.therapy_goals.trim() : "";
  if (goals) {
    lines.push(`Hopes for therapy: “${goals.slice(0, 180)}${goals.length > 180 ? "…" : ""}”`);
  }

  if (lines.length === 0) {
    lines.push("Check-in responses will appear here as you complete the flow.");
  }

  return lines.slice(0, 12);
}
