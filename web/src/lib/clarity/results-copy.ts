import type { ConcernTag, TherapyReadiness } from "@/types/clarity";
import type { TherapyConsiderationLevel } from "@/types/readiness-analysis";

export const THERAPY_CONSIDERATION_COPY: Record<
  TherapyConsiderationLevel,
  { title: string; lead: string }
> = {
  monitor: {
    title: "You might keep going as you are — with the door open",
    lead:
      "Nothing here says you have to start therapy tomorrow. Many people do well with steady self-care and people they trust, while staying open if the ground shifts.",
  },
  consider_support: {
    title: "Talking with someone trained could be grounding",
    lead:
      "What you shared fits a stretch where a licensed therapist can help you sort patterns, slow things down, and feel less alone with the weight of it.",
  },
  strongly_consider_support: {
    title: "This may be a time to prioritize professional support",
    lead:
      "From what we heard, skilled company could matter soon — not because anything is wrong with you, but because you are carrying a lot and should not have to sort it all alone.",
  },
};

/** Fallback when readiness analysis did not load — uses legacy summary readiness. */
export const THERAPY_READINESS_FALLBACK_COPY: Record<
  TherapyReadiness,
  { title: string; lead: string }
> = {
  unclear: {
    title: "It is all right if the picture still feels fuzzy",
    lead:
      "Your answers do not tell one simple story — that is common. A clinician can help you map what matters without forcing a quick label.",
  },
  worth_exploring: THERAPY_CONSIDERATION_COPY.consider_support,
  strongly_consider: THERAPY_CONSIDERATION_COPY.strongly_consider_support,
};

export const CONCERN_TAG_LABELS: Record<ConcernTag, string> = {
  anxiety: "Worry & tension",
  depression: "Low mood & energy",
  sleep: "Sleep",
  stress: "Stress load",
  relationships: "Relationships",
  substance: "Substance use",
  self_harm_ideation: "Distress & safety",
  other: "Something else",
};

export function formatConcernTag(tag: ConcernTag): string {
  return CONCERN_TAG_LABELS[tag] ?? tag;
}
