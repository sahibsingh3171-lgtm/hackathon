import type { ClaritySession, PracticeSessionContent, PracticeSessionPromptBlock } from "@/types/clarity";

function clip(s: string, max: number): string {
  const t = s.replace(/\s+/g, " ").trim();
  if (!t) return "";
  if (t.length <= max) return t;
  const cut = t.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(" ");
  const base = lastSpace > max * 0.5 ? cut.slice(0, lastSpace) : cut;
  return `${base}…`;
}

function firstParagraph(s: string, max: number): string {
  const t = s.trim();
  if (!t) return "";
  const nl = t.indexOf("\n");
  const first = (nl === -1 ? t : t.slice(0, nl)).trim();
  return clip(first, max);
}

const DEFAULT_FREEZE_STARTERS = [
  "I'm not totally sure where to start — is it okay if I go slowly?",
  "This is hard to say out loud, but I'd like to try in my own words.",
  "I've never done therapy before — I'm nervous, and I wanted to be honest about that.",
  "Could I start with what's felt heaviest this week, even if it's a bit scattered?",
  "I'm here because things have felt like a lot — I'd like help figuring out what to focus on first.",
] as const;

function buildSeekSupportExamples(session: ClaritySession): string[] {
  const lines: string[] = [];
  const visit =
    typeof session.intake.visit_reason === "string" ? session.intake.visit_reason.trim() : "";
  if (visit) {
    lines.push(
      `I might open with something I already wrote down: “${clip(visit, 220)}” — you can shorten it in the room.`
    );
  }
  const bd = session.brainDump?.text?.trim();
  if (bd && !visit) {
    lines.push(
      `One way in is to name what brought me here today, in plain words — for example around: “${clip(bd, 160)}”`
    );
  }
  const headline = session.summary!.headline;
  lines.push(
    `Or I could keep it simple: “Things have felt heavier than usual, and I'm hoping for a steady place to talk — something like ‘${clip(headline, 100)}’ in my own voice.”`
  );
  return lines.slice(0, 3);
}

function buildHardestExamples(session: ClaritySession): string[] {
  const ra = session.readinessAnalysis;
  const s = session.summary!;
  const concerns =
    ra && ra.mainConcerns.length > 0 ? ra.mainConcerns : s.keyThemes.length > 0 ? s.keyThemes : [];
  const patterns = ra?.emotionalPatterns?.filter(Boolean) ?? [];
  const lines: string[] = [];
  if (concerns[0]) {
    lines.push(
      `Lately the part that takes the most energy sounds like: “${clip(concerns[0], 200)}” — I'd say that in whatever words feel natural.`
    );
  }
  if (patterns[0]) {
    lines.push(
      `I also notice a pattern: ${clip(patterns[0], 200)}. I don't have to explain it perfectly — just name it.`
    );
  }
  if (lines.length === 0) {
    lines.push(
      "I've been running on low bandwidth — sleep, stress, or relationships might be in the mix. I'd pick one thread to start with.",
      "Even naming ‘it's a few things at once’ is a real answer — the therapist can help sort what to unpack first."
    );
  } else if (lines.length === 1) {
    lines.push(
      "If it helps, I can add one concrete moment from this week — a conversation, a night I couldn't wind down, or a day that went sideways."
    );
  }
  return lines.slice(0, 3);
}

function buildHelpMostExamples(session: ClaritySession): string[] {
  const goals = typeof session.intake.therapy_goals === "string" ? session.intake.therapy_goals.trim() : "";
  const ra = session.readinessAnalysis;
  const support = ra?.potentialSupportAreas?.filter(Boolean) ?? [];
  const prep = ra?.therapyPrepSummary?.trim();
  const lines: string[] = [];
  if (goals) {
    lines.push(
      `What I want help with first is close to: “${clip(goals, 240)}” — I can read that, or paraphrase so it feels like me.`
    );
  } else if (support[0]) {
    lines.push(
      `I'm hoping for support around: “${clip(support[0], 220)}” — still my story, just a clearer label for the room.`
    );
  } else if (prep) {
    lines.push(
      `From what I've already reflected, I'd point toward: “${firstParagraph(prep, 260)}”`
    );
  }
  if (lines.length === 0) {
    lines.push(
      "I'd like help pacing myself — not fixing everything at once — and having a place to say the quiet parts out loud.",
      "I'm still figuring out the goal, and that's okay to say: ‘I'm not sure yet — I'd like your help naming what would help.’"
    );
  } else {
    lines.push(
      "I don't need a perfect goal — even ‘I want to feel less alone with this’ is enough to start."
    );
  }
  return lines.slice(0, 3);
}

function buildWhenWorseExamples(session: ClaritySession): string[] {
  const L = session.lifestyle;
  const lines: string[] = [];
  if (L) {
    if (L.sleepQuality <= 2) {
      lines.push(
        "When my sleep is thin, everything feels louder the next day — I might say I'm rougher around the edges after short nights."
      );
    }
    if (L.stressLevel >= 4) {
      lines.push(
        `My own check-in had stress around ${L.stressLevel}/5 — I could name that stress tends to spike certain days or after certain tasks.`
      );
    }
    if (L.mood <= 2) {
      lines.push(
        "My mood has been low in the snapshot I saved — I could say afternoons or weekends feel emptier, if that's true for me."
      );
    }
  }
  const tags = Array.isArray(session.intake.life_stress_tags)
    ? session.intake.life_stress_tags.filter((x): x is string => typeof x === "string" && x.trim().length > 0)
    : [];
  if (tags.length && lines.length < 3) {
    lines.push(
      `Some of what's on my mind tracks with: ${tags.slice(0, 3).join(", ")} — I can say when those areas tend to flare.`
    );
  }
  if (lines.length === 0) {
    lines.push(
      "It isn't always the same time — sometimes it's evenings when I finally slow down, or Sunday nights before the week starts.",
      "Transitions are hard for me — after work, after conflict, or when I'm alone with my thoughts.",
      "If I'm not sure, I can still say: ‘It comes in waves — I'm still mapping when it hits hardest.’"
    );
  } else {
    lines.push(
      "If the timing shifts week to week, I can say that honestly — patterns don't have to be neat to be worth mentioning."
    );
  }
  return lines.slice(0, 3);
}

function personalizedFreezeLine(session: ClaritySession): string | null {
  const h = session.summary!.headline.trim();
  if (h.length < 8 || h.length > 120) return null;
  return `I might even start tiny: “I've been circling around ${clip(h, 72)}.”`;
}

/**
 * Builds a bounded rehearsal artifact from reflection + intake + readiness + rhythms.
 * Requires `session.summary` (same gate as continuing past reflection). No chat, no diagnosis.
 */
export function buildPracticeSession(session: ClaritySession): PracticeSessionContent | null {
  if (!session.summary) return null;

  const extraFreeze = personalizedFreezeLine(session);
  const freezeStarters = [
    ...(extraFreeze ? [extraFreeze] : []),
    ...DEFAULT_FREEZE_STARTERS,
  ].slice(0, 6);

  const prompts: PracticeSessionPromptBlock[] = [
    {
      id: "seek_now",
      question: "What made you decide to seek support now?",
      exampleLines: buildSeekSupportExamples(session),
    },
    {
      id: "hardest",
      question: "What has been feeling hardest lately?",
      exampleLines: buildHardestExamples(session),
    },
    {
      id: "help_most",
      question: "What do you want help with most?",
      exampleLines: buildHelpMostExamples(session),
    },
    {
      id: "when_worse",
      question: "When do things tend to feel worse?",
      exampleLines: buildWhenWorseExamples(session),
    },
  ];

  return {
    intro:
      "A quiet rehearsal — not therapy, not a chat with an AI therapist. Just a few first-session-style prompts and lines you could borrow, drawn from what you already shared.",
    notTherapyBanner: "Practice for a real conversation — not a replacement for one.",
    notTherapyBody:
      "Clarity cannot diagnose or treat anything. This page is only to help you find words before you meet a licensed clinician. Edit every line so it sounds like you; say only what feels true and safe.",
    freezeStarters,
    prompts,
  };
}
