import type { BrainDump, IntakeAnswers, LifestyleSnapshot } from "@/types/clarity";
import type { ReadinessAnalysisResponse, TherapyConsiderationLevel } from "@/types/readiness-analysis";

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

function levelFromLoad(load: number): TherapyConsiderationLevel {
  if (load >= 3.55) return "strongly_consider_support";
  if (load >= 2.75) return "consider_support";
  return "monitor";
}

/** Offline / error-path readiness object — deterministic from session self-report. */
export function buildReadinessAnalysisMock(input: {
  intake: IntakeAnswers;
  lifestyle: LifestyleSnapshot | null;
  brainDump: BrainDump | null;
}): ReadinessAnalysisResponse {
  const load = approximateLoad(input.intake, input.lifestyle);
  const therapyConsiderationLevel = levelFromLoad(load);
  const dump = input.brainDump?.text?.trim();
  const themes = input.brainDump?.themes?.filter(Boolean) ?? [];

  const mainConcerns: string[] = [];
  const phq = sumPhq9(input.intake);
  const gad = sumGad7(input.intake);
  if (phq.count >= 6 && phq.total >= 10) {
    mainConcerns.push("Low mood, energy, or interest has been a recurring theme in your check-in");
  }
  if (gad.count >= 5 && gad.total >= 8) {
    mainConcerns.push("Worry or tension shows up often in how you answered");
  }
  if (input.lifestyle?.stressLevel && input.lifestyle.stressLevel >= 4) {
    mainConcerns.push("Day-to-day stress is running high in your snapshot");
  }
  if (themes.length) {
    mainConcerns.push(`You marked: ${themes.slice(0, 4).join(", ")}`);
  }
  if (dump) mainConcerns.push("Your free-text brain dump adds important personal detail");
  if (mainConcerns.length === 0) {
    mainConcerns.push("You are reflecting thoughtfully on how you have been doing");
  }

  return {
    therapyConsiderationLevel,
    conciseSummary:
      therapyConsiderationLevel === "strongly_consider_support"
        ? "From what you shared, professional support soon could help you feel less alone with the weight you are carrying. This is a gentle suggestion — not a medical judgment."
        : therapyConsiderationLevel === "consider_support"
          ? "Patterns in your answers suggest that talking with a licensed therapist could be a helpful next step when you feel ready."
          : "You seem to be monitoring a difficult stretch. Self-care and optional professional support are both reasonable paths as you keep noticing what you need.",
    mainConcerns: mainConcerns.slice(0, 6),
    emotionalPatterns: [
      "Stress and sleep may be interacting in familiar ways for many people",
      "You are already observing your inner life with care",
    ],
    potentialSupportAreas: [
      "Skills for winding down and easing worry",
      "Naming boundaries without guilt",
      "Processing grief or overload at a humane pace",
    ],
    lowFrictionInterventions: [
      "One screen-free half-hour before bed",
      "A short walk after a heavy task",
      "Text one person you trust that you are having a hard week",
    ],
    therapyPrepSummary:
      (dump
        ? `You might bring this note: “${dump.slice(0, 280)}${dump.length > 280 ? "…" : ""}” — and say what you hope might feel different in the next few months.`
        : "Bring a few bullet points about sleep, stress, and what feels hardest lately. You do not need a polished story.") +
      " Mention budget and telehealth preferences early so you and a therapist can align.",
    suggestedTherapistTraits: [
      "Warm and collaborative",
      "Comfortable with pacing you set",
      "Experienced with anxiety and mood support",
      "Telehealth-friendly if that matters to you",
    ],
    crisisFlag: false,
    crisisReason: null,
    journalSummary: dump
      ? `This week you put words to: ${dump.slice(0, 200)}${dump.length > 200 ? "…" : ""}`
      : "You took time to check in with yourself. That kind of attention matters.",
    recommendedQuestionsForTherapy: [
      "How would we know if we are a good fit?",
      "What would realistic progress look like for someone in my situation?",
    ],
    confidenceNotes: [
      "This offline summary uses only your self-report and simple heuristics — not a clinical interview.",
      "A human therapist may hear nuance differently.",
    ],
    limitations: [
      "Clarity is educational prep, not therapy or crisis care.",
      "If you are in immediate danger, call your local emergency number or 988 in the U.S.",
    ],
  };
}
