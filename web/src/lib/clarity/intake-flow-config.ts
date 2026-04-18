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
      subtitle: "A few honest words are enough.",
      microcopy:
        "Fragments are welcome. This is not a test — there is no wrong answer, only what feels true for you right now.",
    },
    {
      id: "overall_mood",
      field: "overall_mood",
      title: "Overall, how heavy or low have things felt this past week?",
      subtitle: "A single snapshot, not a verdict.",
      microcopy: "We use a simple scale so you can answer without explaining perfectly.",
    },
  ];

  PHQ9_PROMPTS.forEach((title, i) => {
    steps.push({
      id: `phq9_${i + 1}`,
      field: "phq9_item",
      itemIndex: i + 1,
      title,
      subtitle: "Inspired by common depression screening questions — Clarity does not score or diagnose.",
      microcopy:
        i === 8
          ? "If these thoughts feel active or urgent, please reach out to 988 or local emergency services — we care about your safety."
          : "Take a breath. Choose the option that fits most days, not the worst moment.",
    });
  });

  GAD7_PROMPTS.forEach((title, i) => {
    steps.push({
      id: `gad7_${i + 1}`,
      field: "gad7_item",
      itemIndex: i + 1,
      title,
      subtitle: "Inspired by common anxiety screening questions — for reflection with a professional, not a label.",
      microcopy: "Rough estimates help you prepare — they do not define you.",
    });
  });

  steps.push(
    {
      id: "life_stress_tags",
      field: "life_stress_tags",
      title: "What else has been weighing on you?",
      subtitle: "Choose any that apply — or none.",
      microcopy: "Tap what resonates. You can change your mind later.",
    },
    {
      id: "sleep_hours_avg",
      field: "sleep_hours_avg",
      title: "On average, how many hours do you sleep per night?",
      subtitle: "A ballpark number is perfect.",
      microcopy: "Sleep affects everything else — we ask gently, without judgment.",
    },
    {
      id: "screen_hours_avg",
      field: "screen_hours_avg",
      title: "Roughly how many hours a day are you on screens?",
      subtitle: "Phone, laptop, TV — your honest guess.",
      microcopy: "We never read your device. This is only what you choose to report.",
    },
    {
      id: "stress_overall",
      field: "stress_overall",
      title: "How intense does stress feel in your body most days?",
      subtitle: "Tension, racing thoughts, restlessness — however it shows up for you.",
      microcopy: "There is no “right” level. We are mapping your lived experience.",
    },
    {
      id: "therapy_history",
      field: "therapy_history",
      title: "What is your therapy history?",
      subtitle: "Helps us frame suggestions without assuming.",
      microcopy: "Every path — including none yet — is completely okay.",
    },
    {
      id: "budget_range",
      field: "budget_range",
      title: "What per-session range feels realistic to explore?",
      subtitle: "Illustrative only — real rates vary by region and clinician.",
      microcopy: "Money should not be a shame topic when you are seeking care.",
    },
    {
      id: "insurance",
      field: "insurance",
      title: "How do you expect to pay for therapy?",
      subtitle: "Rough sense is enough.",
      microcopy: "You can refine this with any therapist you speak with.",
    },
    {
      id: "modality_preference",
      field: "modality_preference",
      title: "Where would you prefer sessions to happen?",
      subtitle: "You can always change your mind.",
      microcopy: "Some people need home; some need a separate space. Both are valid.",
    },
    {
      id: "therapist_preferences",
      field: "therapist_preferences",
      title: "Anything you already know you want in a therapist?",
      subtitle: "Optional — identity, language, style, faith, LGBTQ+ affirming, etc.",
      microcopy: "Leave blank if you are still figuring it out. That is normal.",
    },
    {
      id: "therapy_goals",
      field: "therapy_goals",
      title: "If therapy went really well, what would feel different in your life?",
      subtitle: "Future-oriented, not a commitment — just a compass.",
      microcopy: "Even one sentence is a gift to your future self.",
    }
  );

  return steps;
}

export const INTAKE_FLOW_STEPS = buildSteps();

export const INTAKE_FLOW_STEP_TOTAL = INTAKE_FLOW_STEPS.length;
