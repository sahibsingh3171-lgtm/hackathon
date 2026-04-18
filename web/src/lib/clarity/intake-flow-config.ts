/**
 * Multi-step intake flow (Typeform-style). Not licensed PHQ-9 / GAD-7 administration —
 * PHQ-9 / GAD-7 *inspired* wording for self-reflection only.
 */

export type IntakeFlowFieldType =
  | "visit_reason"
  | "overall_mood"
  | "phq9_item"
  | "gad7_item"
  | "life_stress_tags"
  | "sleep_hours_avg"
  | "screen_hours_avg"
  | "stress_overall"
  | "therapy_history"
  | "budget_range"
  | "insurance"
  | "modality_preference"
  | "therapist_preferences"
  | "therapy_goals";

export type IntakeFlowStepMeta = {
  id: string;
  field: IntakeFlowFieldType;
  /** PHQ / GAD item index when field is phq9_item / gad7_item */
  itemIndex?: number;
  title: string;
  subtitle?: string;
  /** Short reassurance under the title */
  microcopy?: string;
};

export const PHQ9_PROMPTS = [
  "Over the last two weeks, how often have you had little interest or pleasure in doing things?",
  "Over the last two weeks, how often have you felt down, depressed, or hopeless?",
  "Over the last two weeks, how often have you had trouble falling or staying asleep, or sleeping too much?",
  "Over the last two weeks, how often have you felt tired or had little energy?",
  "Over the last two weeks, how often have you had poor appetite or been overeating?",
  "Over the last two weeks, how often have you felt bad about yourself — or that you are a failure or have let yourself or your family down?",
  "Over the last two weeks, how often have you had trouble concentrating on things, such as reading or watching television?",
  "Over the last two weeks, how often have you moved or spoken slowly enough that others could have noticed — or the opposite: been so fidgety or restless you were moving a lot more than usual?",
  "Over the last two weeks, how often have you had thoughts that you would be better off dead, or of hurting yourself in some way?",
] as const;

export const GAD7_PROMPTS = [
  "Over the last two weeks, how often have you felt nervous, anxious, or on edge?",
  "Over the last two weeks, how often have you been unable to stop or control worrying?",
  "Over the last two weeks, how often have you worried too much about different things?",
  "Over the last two weeks, how often have you had trouble relaxing?",
  "Over the last two weeks, how often have you been so restless that it is hard to sit still?",
  "Over the last two weeks, how often have you become easily annoyed or irritable?",
  "Over the last two weeks, how often have you felt afraid, as if something awful might happen?",
] as const;

export const LIFE_STRESS_TAG_OPTIONS = [
  { id: "grief", label: "Grief or loss" },
  { id: "burnout", label: "Burnout" },
  { id: "relationship_stress", label: "Relationship stress" },
  { id: "loneliness", label: "Loneliness" },
  { id: "overwhelm", label: "Overwhelm" },
] as const;

export const THERAPY_HISTORY_OPTIONS = [
  { id: "never", label: "I have not been in therapy before" },
  { id: "past", label: "I have been in therapy in the past" },
  { id: "current", label: "I am currently in therapy" },
  { id: "unsure", label: "I am not sure how to answer" },
] as const;

export const BUDGET_RANGE_OPTIONS = [
  { id: "under_80", label: "Under ~$80 / session" },
  { id: "80_120", label: "~$80–$120" },
  { id: "120_200", label: "~$120–$200" },
  { id: "200_plus", label: "$200+ or sliding scale" },
  { id: "prefer_not", label: "Prefer not to say" },
] as const;

export const INSURANCE_OPTIONS = [
  { id: "private_oop", label: "Private pay / out of pocket" },
  { id: "insurance_in", label: "In-network insurance" },
  { id: "insurance_oon", label: "Out-of-network reimbursement" },
  { id: "public", label: "Medicaid / Medicare" },
  { id: "unsure_ins", label: "Not sure yet" },
] as const;

export const MODALITY_OPTIONS = [
  { id: "telehealth", label: "Mostly telehealth", modality: "telehealth" as const },
  { id: "in_person", label: "Mostly in person", modality: "in_person" as const },
  { id: "either", label: "Open to either", modality: "any" as const },
] as const;

export const SCALE4_LABELS = [
  { value: 0, label: "Not at all", short: "0" },
  { value: 1, label: "Several days", short: "1" },
  { value: 2, label: "More than half the days", short: "2" },
  { value: 3, label: "Nearly every day", short: "3" },
] as const;

function buildSteps(): IntakeFlowStepMeta[] {
  const steps: IntakeFlowStepMeta[] = [
    {
      id: "visit_reason",
      field: "visit_reason",
      title: "What brings you here today?",
      subtitle: "A few words you mean are enough.",
      microcopy:
        "Half-finished thoughts count. This is not a test — only what feels true for you today.",
    },
    {
      id: "overall_mood",
      field: "overall_mood",
      title: "Overall, how heavy or low have things felt this past week?",
      subtitle: "One honest snapshot is enough.",
      microcopy: "A simple scale so you can answer without having the full story figured out.",
    },
  ];

  PHQ9_PROMPTS.forEach((title, i) => {
    steps.push({
      id: `phq9_${i + 1}`,
      field: "phq9_item",
      itemIndex: i + 1,
      title,
      subtitle:
        "Wording similar to questions clinicians sometimes use — for reflection here, not a diagnosis.",
      microcopy:
        i === 8
          ? "If these thoughts feel present or urgent, please reach out now — in the U.S., call or text 988, or use your local emergency number."
          : "Go with what fits most days, not only the hardest day.",
    });
  });

  GAD7_PROMPTS.forEach((title, i) => {
    steps.push({
      id: `gad7_${i + 1}`,
      field: "gad7_item",
      itemIndex: i + 1,
      title,
      subtitle:
        "Similar in spirit to questions about worry and tension — context for you and a future clinician, not a label.",
      microcopy: "Rough honesty is enough; nothing here defines who you are.",
    });
  });

  steps.push(
    {
      id: "life_stress_tags",
      field: "life_stress_tags",
      title: "What else has been weighing on you?",
      subtitle: "Choose anything that lands — even roughly.",
      microcopy: "If more than one fits, that is okay. You can revisit this anytime.",
    },
    {
      id: "sleep_hours_avg",
      field: "sleep_hours_avg",
      title: "On average, how many hours do you sleep per night?",
      subtitle: "A rough average is fine.",
      microcopy: "Sleep touches everything else — we ask without reading anything into a single number.",
    },
    {
      id: "screen_hours_avg",
      field: "screen_hours_avg",
      title: "Roughly how many hours a day are you on screens?",
      subtitle: "Phone, laptop, TV — your best guess.",
      microcopy: "We do not access your devices; this is only what you choose to share.",
    },
    {
      id: "stress_overall",
      field: "stress_overall",
      title: "How intense does stress feel in your body most days?",
      subtitle: "Tension, racing thoughts, restlessness — however it shows up for you.",
      microcopy: "There is no correct answer — we are sketching how things feel in your body lately.",
    },
    {
      id: "therapy_history",
      field: "therapy_history",
      title: "What is your therapy history?",
      subtitle: "So we do not assume where you are starting from.",
      microcopy: "Never been, been before, or not sure — all of that is welcome.",
    },
    {
      id: "budget_range",
      field: "budget_range",
      title: "What per-session range feels realistic to explore?",
      subtitle: "A rough bracket — real fees depend on where you live and who you see.",
      microcopy: "Cost is part of care; naming it here is practical, not something to feel bad about.",
    },
    {
      id: "insurance",
      field: "insurance",
      title: "How do you expect to pay for therapy?",
      subtitle: "A first guess is enough.",
      microcopy: "You can sort details out with any clinician you talk to later.",
    },
    {
      id: "modality_preference",
      field: "modality_preference",
      title: "Where would you prefer sessions to happen?",
      subtitle: "You can change this later.",
      microcopy: "Some people prefer home; some prefer an office. Either can be the right fit.",
    },
    {
      id: "therapist_preferences",
      field: "therapist_preferences",
      title: "Anything you already know you want in a therapist?",
      subtitle: "Optional — language, style, identity, faith, LGBTQ+ affirming care, and so on.",
      microcopy: "Blank is fine if you are still discovering what you need.",
    },
    {
      id: "therapy_goals",
      field: "therapy_goals",
      title: "If therapy went really well, what would feel different in your life?",
      subtitle: "Imagining the future — not signing a contract.",
      microcopy: "Even one sentence can be a useful anchor when you talk with someone.",
    }
  );

  return steps;
}

export const INTAKE_FLOW_STEPS = buildSteps();

export const INTAKE_FLOW_STEP_TOTAL = INTAKE_FLOW_STEPS.length;
