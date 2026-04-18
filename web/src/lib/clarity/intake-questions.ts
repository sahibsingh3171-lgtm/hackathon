import type { IntakeAnswers, Likert } from "@/types/clarity";

import { intakeFlowCompletionCount, isIntakeFlowComplete } from "./intake-flow-validation";

export type IntakeQuestionType = "likert" | "textarea";

export interface IntakeQuestion {
  id: string;
  type: IntakeQuestionType;
  title: string;
  description?: string;
  /** Likert: low → high label hints for UI */
  likertLow?: string;
  likertHigh?: string;
  /** Optional section heading (first question in section shows it) */
  section?: string;
}

/** Inspired by common intake themes — not a licensed instrument. */
export const INTAKE_QUESTIONS: IntakeQuestion[] = [
  {
    id: "mood_low",
    section: "How you have been feeling",
    type: "likert",
    title: "Over the past two weeks, how often have you felt down, low, or hopeless?",
    likertLow: "Not at all",
    likertHigh: "Nearly every day",
  },
  {
    id: "interest",
    type: "likert",
    title: "How often have you lost interest or pleasure in things you usually enjoy?",
    likertLow: "Not at all",
    likertHigh: "Nearly every day",
  },
  {
    id: "worry",
    type: "likert",
    title: "How often have you felt nervous, anxious, or on edge?",
    likertLow: "Not at all",
    likertHigh: "Nearly every day",
  },
  {
    id: "control_worry",
    type: "likert",
    title: "How often have you struggled to stop or control worrying?",
    likertLow: "Not at all",
    likertHigh: "Nearly every day",
  },
  {
    id: "sleep_issue",
    section: "Rest and tension",
    type: "likert",
    title: "How much has sleep been a problem for you lately?",
    likertLow: "Not a problem",
    likertHigh: "Severe problem",
  },
  {
    id: "tension",
    type: "likert",
    title: "How often have you felt physically tense (jaw, shoulders, chest, stomach)?",
    likertLow: "Rarely",
    likertHigh: "Almost always",
  },
  {
    id: "focus",
    type: "likert",
    title: "How often has it been hard to concentrate or make decisions?",
    likertLow: "Rarely",
    likertHigh: "Almost always",
  },
  {
    id: "avoidance",
    section: "Daily life",
    type: "likert",
    title: "How often have you avoided people, places, or tasks because of how you felt?",
    likertLow: "Rarely",
    likertHigh: "Almost always",
  },
  {
    id: "function",
    type: "likert",
    title: "How much have emotional difficulties affected work, school, or relationships?",
    likertLow: "Not at all",
    likertHigh: "Severely",
  },
  {
    id: "open_context",
    section: "Anything else",
    type: "textarea",
    title: "In a sentence or two, what feels heaviest right now? (Optional)",
    description: "Helps Clarity echo themes back to you — not for diagnosis.",
  },
];

export function isLikert(v: unknown): v is Likert {
  return v === 1 || v === 2 || v === 3 || v === 4 || v === 5;
}

export function intakeCompletionCount(answers: Record<string, unknown>): number {
  return intakeFlowCompletionCount(answers as IntakeAnswers);
}

/** Wizard completion (PHQ/GAD–style flow); delegates to multi-step intake validation. */
export function intakeRequiredComplete(answers: Record<string, unknown>): boolean {
  return isIntakeFlowComplete(answers as IntakeAnswers);
}
