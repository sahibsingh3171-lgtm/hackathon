import type {
  PracticeSessionSummary,
  PracticeTurnApiRequestBody,
  PracticeTurnApiResponseBody,
} from "@/types/clarity";

/**
 * Deterministic rehearsal fallback for when OPENAI_API_KEY is missing or the model call fails.
 * Intentionally gentle, non-diagnostic, and short. Picks a different question per turn.
 */

const OPENERS = [
  "What made you decide to look for support now — even if part of you isn't sure yet?",
  "When you think about the last week, what felt heaviest?",
  "Is there a moment you replayed more than once lately? What happened?",
  "What do you wish someone around you understood about what you've been carrying?",
  "When do things tend to feel worse — time of day, around certain people, or certain thoughts?",
  "If a version of 'a little better' was possible this month, what would it look like?",
  "What is something you almost said out loud today but didn't?",
] as const;

const FOLLOW_UPS = [
  "What part of that felt most important to say out loud?",
  "If you slowed down that moment, what was going on in your body?",
  "Is that a new feeling, or a familiar one in a new shape?",
  "Who, if anyone, knows this part of the story the way you just told it?",
  "Would you want to spend more time on that with a real therapist — or set it aside for now?",
] as const;

function pickDeterministic<T>(arr: readonly T[], idx: number): T {
  if (arr.length === 0) throw new Error("empty list");
  return arr[idx % arr.length];
}

function buildMockSummary(req: PracticeTurnApiRequestBody): PracticeSessionSummary {
  const raisedThemes = req.context.concernHints.filter((t) => t && t.trim().length > 0).slice(0, 4);
  const themes = raisedThemes.length
    ? raisedThemes
    : ["The practice helped you name a few recurring feelings in your own words."];

  const bring: string[] = [];
  if (req.context.visitReason) bring.push(`Open with your own line: "${req.context.visitReason}"`);
  if (req.context.therapyGoals) {
    bring.push(
      `Share what you want to work toward — you already wrote: "${req.context.therapyGoals}"`
    );
  }
  if (bring.length < 2) {
    bring.push("Name one concrete moment from the last week that captures how you've been feeling.");
  }
  if (bring.length < 3) {
    bring.push("Say what pace would help — slow, structured, or exploratory.");
  }

  return {
    communicatedClearly:
      "You put some of what's been quiet into words — even partial sentences count as practice.",
    themes,
    bringToTherapist: bring,
    closingLine:
      "A real therapist will ask their own questions; this was only rehearsal. You can always come back and try again.",
    generatedAt: new Date().toISOString(),
  };
}

export function buildPracticeTurnMock(
  req: PracticeTurnApiRequestBody
): PracticeTurnApiResponseBody {
  if (req.mode === "wrap") {
    return {
      question: "",
      summary: buildMockSummary(req),
      usedMock: true,
      crisisHalt: false,
      crisisReason: null,
    };
  }

  if (req.mode === "opening") {
    // Weight the opener toward the user's most salient concern if present.
    const leadingConcern = req.context.concernHints[0];
    const tailored =
      leadingConcern && req.conversation.userTurnCount === 0
        ? `What made you decide to look for support now — especially around ${leadingConcern.toLowerCase()}?`
        : pickDeterministic(OPENERS, req.conversation.userTurnCount);
    return {
      question: tailored,
      reflection: "There isn't a right answer here — whatever you want to start with is fine.",
      usedMock: true,
      crisisHalt: false,
      crisisReason: null,
    };
  }

  const follow = pickDeterministic(FOLLOW_UPS, req.conversation.userTurnCount);
  const reflection = req.latestUserReply
    ? "Thank you for putting that into words — even partially."
    : "Take your time with this one.";
  return {
    question: follow,
    reflection,
    usedMock: true,
    crisisHalt: false,
    crisisReason: null,
  };
}
