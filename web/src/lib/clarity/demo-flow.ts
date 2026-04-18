/**
 * Hackathon demo: persona, intake, brain dump, AI-shaped results, and a full session snapshot.
 *
 * Persistence across refresh is disabled globally. `applyDemoSession` uses a
 * dedicated **one-shot** handoff key (see `persisted-session.ts`) that is read
 * and deleted by the session context on its next mount — so a follow-up
 * refresh still starts fresh, matching the rest of the app.
 */

import { INTAKE_FLOW_STEP_TOTAL } from "@/lib/clarity/intake-flow-config";
import { buildMatchPreferencesFromIntake } from "@/lib/clarity/intake-flow-validation";
import { buildNextSteps } from "@/lib/clarity/next-steps-templates";
import { writeDemoOneShot } from "@/lib/clarity/persisted-session";
import { buildPrepSheet } from "@/lib/clarity/prep-sheet";
import type {
  AiSummaryResult,
  BrainDump,
  ClaritySession,
  IntakeAnswers,
  LifestyleSnapshot,
} from "@/types/clarity";
import type { ReadinessAnalysisResponse } from "@/types/readiness-analysis";

/** 1 · Realistic sample persona (fictional). */
export const DEMO_PERSONA = {
  name: "Alex Rivera",
  age: 29,
  role: "Product designer, growth-stage startup",
  context:
    "First serious look at therapy after months of “pushing through.” Partner and manager are supportive; Alex minimizes out loud.",
  innerStory:
    "Sunday scaries that bleed into Monday, trouble falling asleep after late Slack, irritability at home, and guilt for not feeling “grateful enough.”",
  demoGoal:
    "Language for what is happening, a sense of whether timing is right, and something concrete for a first session without performing “perfect patient.”",
} as const;

function phq9Scores(): Record<string, number> {
  const vals = [1, 1, 2, 2, 1, 2, 1, 1, 0];
  return Object.fromEntries(vals.map((v, i) => [`phq9_${i + 1}`, v]));
}

function gad7Scores(): Record<string, number> {
  const vals = [2, 2, 1, 2, 1, 2, 1];
  return Object.fromEntries(vals.map((v, i) => [`gad7_${i + 1}`, v]));
}

/** 2 · Complete intake answers (PHQ-9 / GAD-7–style items use 0–3 scale). Item 9 is 0 — avoids urgent crisis UI for the demo. */
export const DEMO_INTAKE: IntakeAnswers = {
  intakeFlowStep: INTAKE_FLOW_STEP_TOTAL - 1,
  visit_reason:
    "I have been telling myself I should be fine — good job, good partner, nothing “wrong enough” for therapy. But I am tired in a way sleep does not fix. I snap over small things, then feel awful. Work feels like a treadmill where the speed keeps increasing and I am scared that if I admit I am drowning, people will think I am dramatic or ungrateful.",
  overall_mood: 4,
  ...phq9Scores(),
  ...gad7Scores(),
  life_stress_tags: ["burnout", "relationship_stress", "overwhelm"],
  sleep_hours_avg: 6.25,
  screen_hours_avg: 8.5,
  stress_overall: 4,
  therapy_history: "past",
  budget_range: "80_120",
  insurance: "insurance_oon",
  modality_preference: "either",
  therapist_preferences:
    "Direct but warm; okay with humor; LGBTQ+ affirming; experience with burnout and high-performing professionals; not overly clinical in session.",
  therapy_goals:
    "I would like to sleep without rehearsing work at 2 a.m., argue less from a guarded place with my partner, and rebuild some steadiness — not hustle harder.",
};

/** 3 · Lifestyle snapshot (rhythms step). */
export const DEMO_LIFESTYLE: LifestyleSnapshot = {
  mood: 4,
  sleepQuality: 2,
  sleepHoursApprox: 6.25,
  sleepChartNote: "Sleep export — last week (filename only in demo)",
  stressLevel: 4,
  screenTime: { mode: "hours_estimate", hoursApprox: 8 },
};

/** 4 · Brain dump — long enough for gates; themes align with matcher + summary tags. */
export const DEMO_BRAIN_DUMP_TEXT = `I do not know how to start except to say I feel both too much and nothing at all.

At work I am the person who “has it together.” I run critiques, I calm the room, I send the follow-up doc. Then I get home and I am weirdly angry about crumbs on the counter or a tone in a text message. I hate that version of me. My partner is patient but I can tell they are walking on eggshells sometimes.

I keep trying fixes — melatonin, a new planner, “no screens after ten” (lasted three days). The real thing is my chest feels tight on Sunday night like something bad is coming, even when nothing is. I am not in danger. I am just… worn down.

If therapy could help me understand why my stress shows up as irritation, and how to talk about work without making it my whole personality, that would be enough for a first step.`;

export const DEMO_BRAIN_DUMP: BrainDump = {
  text: DEMO_BRAIN_DUMP_TEXT,
  themes: ["anxiety", "burnout", "relationships", "work"],
  voice: { status: "skipped" },
};

/** 5a · Sample AI summary object (reflection page). */
export const DEMO_SUMMARY: AiSummaryResult = {
  headline: "You are carrying a lot with very little room to land",
  keyThemes: [
    "High-functioning exhaustion — competence at work paired with depletion at home",
    "Hypervigilance and irritability as stress signals, not “character flaws”",
    "Sleep and shutdown patterns that deserve gentle attention, not another productivity hack",
  ],
  therapyReadiness: "worth_exploring",
  rationaleBullets: [
    "Your words describe sustained strain, not a single bad week — that matters when deciding if support could help.",
    "You already notice how stress moves between your body, sleep, and relationships; therapy can widen that awareness without forcing a label.",
    "You are asking for steadiness and kinder self-talk, not a performance of gratitude — that is a workable starting point.",
  ],
  limitations: [
    "Clarity only sees what you typed in this session — it does not know medical history, trauma history, or day-to-day safety context.",
    "This is not a diagnosis or treatment plan; a licensed clinician should guide any decisions about care.",
  ],
  tags: ["anxiety", "stress", "sleep", "relationships"],
  generatedAt: "2026-04-18T16:00:00.000Z",
  usedMock: true,
};

/** 5b · Sample readiness analysis (structured layer + prep/match hints). */
export const DEMO_READINESS: ReadinessAnalysisResponse = {
  therapyConsiderationLevel: "consider_support",
  conciseSummary:
    "Alex, what you describe is less “being dramatic” and more like a nervous system that has been on high alert for a long time. You are still functioning — and still hurting. That combination is common, and it is worth talking about with someone trained, at a pace that respects your shame radar.",
  mainConcerns: [
    "Burnout and emotional whiplash between “capable at work” and “raw at home”",
    "Sleep disruption and Sunday-night dread tied to anticipatory anxiety",
    "Guilt and self-criticism for having needs when your life “looks fine on paper”",
    "Relationship friction that may be a signal, not the root problem",
  ],
  emotionalPatterns: [
    "Minimizing (“I should be fine”) until feelings leak out as irritability",
    "Over-functioning as a way to earn rest you never quite give yourself",
    "Binary thinking: either “I have it together” or “I am failing”",
  ],
  potentialSupportAreas: [
    "Pacing and boundaries at work without self-sabotage narratives",
    "Sleep hygiene that fits a real human schedule, not influencer rules",
    "Communication repair with your partner from curiosity, not self-attack",
  ],
  lowFrictionInterventions: [
    "Name one micro-boundary at work this week (e.g. no Slack after a set time) and notice what you feel — not whether you “succeed.”",
    "A ten-minute walk after the workday before scrolling — a buffer between roles.",
    "One honest sentence to your partner: “I am more overwhelmed than I sound.”",
    "Keep a tiny “evidence list” of moments you were kind to yourself — counterweight to the guilt voice.",
  ],
  therapyPrepSummary:
    "If I sit in a first session, I want to say that I am tired in a way that does not fix with coffee. I want help naming what happens between Sunday night dread and snapping at home. I am not looking to be fixed in eight weeks — I want steadier ground, kinder language for myself, and tools that do not feel like another job.",
  suggestedTherapistTraits: [
    "Burnout and high-stress professionals",
    "CBT or ACT-informed, practical language",
    "Warm directness — can challenge gently without coldness",
    "Telehealth-friendly",
    "Affirming of LGBTQ+ clients and relationship diversity",
  ],
  crisisFlag: false,
  crisisReason: null,
  journalSummary:
    "I am allowed to be tired even when my life looks good from the outside. Needing support is not ingratitude.",
  recommendedQuestionsForTherapy: [
    "When someone describes what I have been feeling, how do you usually start — structure first or space to vent?",
    "How do you work with people who are skeptical of therapy but curious?",
    "What does progress look like in the first six sessions for someone with burnout patterns?",
    "How do you handle it if I shut down or deflect when a topic feels too close?",
  ],
  confidenceNotes: [
    "We do not know physical health, medications, or trauma history — those can change recommendations.",
    "If irritability ever feels uncontrollable or unsafe in relationships, say so explicitly so a clinician can respond.",
  ],
  limitations: [
    "Clarity cannot verify crisis status or replace 988 / emergency services.",
    "Matching is illustrative — credentials, fees, and fit must be confirmed with real providers.",
  ],
};

/**
 * 6 · Expected top mock profile ids for this narrative (verify live with matcher).
 * Story: anxiety + burnout + sleep + relationships → Amelia, Daniel, Priya, Jordan often rank high.
 */
export const DEMO_MATCH_PROFILE_IDS_ORDERED = ["ah-001", "ah-002", "ah-003", "ah-004"] as const;

const DEMO_SESSION_ID = "clarity-demo-alex-rivera";

/** Build a complete persisted-shaped session (prep sheet included). */
export function getDemoSession(): ClaritySession {
  const now = new Date().toISOString();
  const intake: IntakeAnswers = {
    ...DEMO_INTAKE,
    brain_dump_tags: [...(DEMO_BRAIN_DUMP.themes ?? [])],
  };
  const nextSteps = buildNextSteps(DEMO_SUMMARY.tags);
  let session: ClaritySession = {
    id: DEMO_SESSION_ID,
    updatedAt: now,
    intake,
    intakePrefilledStepIds: [],
    intakeConfirmedStepIds: [],
    lifestyle: DEMO_LIFESTYLE,
    brainDump: DEMO_BRAIN_DUMP,
    summary: DEMO_SUMMARY,
    readinessAnalysis: DEMO_READINESS,
    nextSteps,
    prepSheet: null,
    matchPreferences: buildMatchPreferencesFromIntake(intake),
  };
  session = { ...session, prepSheet: buildPrepSheet(session) };
  return session;
}

/** Hand off a demo-ready session via the one-shot key, then navigate to `/summary`. */
export function applyDemoSession(): void {
  if (typeof window === "undefined") return;
  try {
    writeDemoOneShot(getDemoSession());
    window.location.assign("/summary");
  } catch {
    /* quota */
  }
}

/** Ordered flow labels for narrator scripts (see `web/DEMO.md`). */
export const DEMO_SCREEN_ORDER = [
  "Landing — hook + trust",
  "Your words — brain dump first (optional voice)",
  "Check-in — shortened if extraction pre-filled fields",
  "Daily rhythms — quick believable numbers",
  "Reflection — AI summary + readiness + lifestyle panel",
  "Matches — explain ordering + open top card",
  "Practice session — rehearse opening lines (not therapy)",
  "Prep sheet — print / PDF differentiator",
  "Closing — next steps + 988",
] as const;
