import type {
  AiSummaryResult,
  BrainDump,
  IntakeAnswers,
  LifestyleSnapshot,
  TherapyReadiness,
} from "@/types/clarity";

import { isScale4 } from "@/lib/clarity/intake-flow-validation";

function sumPhq9(intake: IntakeAnswers): { total: number; count: number } {
  let total = 0;
  let count = 0;
  for (let i = 1; i <= 9; i += 1) {
    const v = intake[`phq9_${i}`];
    if (isScale4(v)) {
      total += v;
      count += 1;
    }
  }
  return { total, count };
}

function sumGad7(intake: IntakeAnswers): { total: number; count: number } {
  let total = 0;
  let count = 0;
  for (let i = 1; i <= 7; i += 1) {
    const v = intake[`gad7_${i}`];
    if (isScale4(v)) {
      total += v;
      count += 1;
    }
  }
  return { total, count };
}

/** Map PHQ-9–style total (0–27) + GAD-7 (0–21) to a soft 1–5 “load” for mock logic only. */
function approximateLoad(intake: IntakeAnswers, lifestyle: LifestyleSnapshot | null): number {
  const phq = sumPhq9(intake);
  const gad = sumGad7(intake);
  let load = 2.5;
  if (phq.count === 9) load = 1 + (phq.total / 27) * 4;
  else if (phq.count > 0) load = 1 + (phq.total / (phq.count * 3)) * 4;
  if (gad.count === 7) {
    const g = 1 + (gad.total / 21) * 4;
    load = load * 0.65 + g * 0.35;
  }
  if (lifestyle?.stressLevel != null) {
    load = load * 0.75 + (lifestyle.stressLevel / 5) * 4 * 0.25;
  }
  return Math.min(5, Math.max(1, load));
}

/** Deterministic fallback when OpenAI is unavailable — same JSON shape. */
export function buildMockSummary(input: {
  intake: IntakeAnswers;
  lifestyle: LifestyleSnapshot | null;
  brainDump: BrainDump | null;
}): AiSummaryResult {
  const load = approximateLoad(input.intake, input.lifestyle);

  let readiness: TherapyReadiness = "unclear";
  if (load >= 3.55) readiness = "strongly_consider";
  else if (load >= 2.75) readiness = "worth_exploring";

  const phq = sumPhq9(input.intake);
  const gad = sumGad7(input.intake);

  const keyThemeLines: string[] = [];
  const chipThemes = input.brainDump?.themes?.filter(Boolean) ?? [];
  if (chipThemes.length) {
    keyThemeLines.push(`Themes you tapped: ${chipThemes.join(", ")}`);
  }
  if (phq.count >= 6 && phq.total >= 10) {
    keyThemeLines.push("Low mood, energy, or interest may have been persistent in what you reported");
  }
  if (gad.count >= 5 && gad.total >= 8) {
    keyThemeLines.push("Worry, tension, or restlessness show up often in your answers");
  }
  if (input.lifestyle?.stressLevel && input.lifestyle.stressLevel >= 4) {
    keyThemeLines.push("Day-to-day stress feels high in your snapshot");
  }
  if (
    input.lifestyle?.sleepHoursApprox != null &&
    input.lifestyle.sleepHoursApprox < 6
  ) {
    keyThemeLines.push("Sleep may be a meaningful piece of the picture right now");
  }
  const dump = input.brainDump?.text?.trim();
  if (dump) keyThemeLines.push("Your own words add texture beyond any checklist");

  if (keyThemeLines.length === 0) {
    keyThemeLines.push("You are taking a thoughtful look at how you have been doing");
  }

  const tags = deriveTags(input, load);

  return {
    headline: "A gentle read on what you shared",
    keyThemes: keyThemeLines.slice(0, 5),
    therapyReadiness: readiness,
    rationaleBullets: [
      "What you captured could be a helpful starting point for a licensed therapist.",
      "This summary reflects themes only — it is not a diagnosis or medical advice.",
      "You deserve support that fits your pace, your budget, and your story.",
    ],
    limitations: [
      "Clarity is an educational prep tool, not a crisis service or replacement for care.",
      "If you are in immediate danger, call 911 (U.S.) or your local emergency number.",
    ],
    tags,
    generatedAt: new Date().toISOString(),
    usedMock: true,
  };
}

function deriveTags(
  input: {
    intake: IntakeAnswers;
    lifestyle: LifestyleSnapshot | null;
    brainDump: BrainDump | null;
  },
  load: number
): AiSummaryResult["tags"] {
  const tags: AiSummaryResult["tags"] = [];
  const text = `${JSON.stringify(input.intake)} ${input.brainDump?.text ?? ""}`.toLowerCase();

  const phq = sumPhq9(input.intake);
  if (phq.total >= 8 || /depress|hopeless|empty|numb/.test(text)) tags.push("depression");

  const gad = sumGad7(input.intake);
  if (gad.total >= 6 || /anxious|panic|worry/.test(text)) tags.push("anxiety");

  if (
    (input.lifestyle?.sleepQuality && input.lifestyle.sleepQuality <= 2) ||
    (input.lifestyle?.sleepHoursApprox != null && input.lifestyle.sleepHoursApprox < 6)
  ) {
    tags.push("sleep");
  }

  if ((input.lifestyle?.stressLevel && input.lifestyle.stressLevel >= 4) || load >= 3.2) {
    tags.push("stress");
  }

  const stressTags = input.intake.life_stress_tags;
  if (Array.isArray(stressTags)) {
    if (stressTags.includes("relationship_stress")) tags.push("relationships");
    if (stressTags.includes("grief")) tags.push("other");
  }

  const brainChips = input.brainDump?.themes ?? [];
  if (brainChips.includes("anxiety")) tags.push("anxiety");
  if (brainChips.includes("relationships")) tags.push("relationships");
  if (brainChips.includes("burnout") || brainChips.includes("work")) tags.push("stress");

  if (/partner|relationship|family|marriage/.test(text)) tags.push("relationships");
  if (/alcohol|substance|drink|weed|drug/.test(text)) tags.push("substance");
  if (/hurt myself|self harm|suicid|kill myself/.test(text)) tags.push("self_harm_ideation");
  const q9 = input.intake.phq9_9;
  if (isScale4(q9) && q9 >= 1) tags.push("self_harm_ideation");

  if (!tags.length) tags.push("other");
  return Array.from(new Set(tags));
}
