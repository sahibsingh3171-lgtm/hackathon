import { intakeFlowHighlightLines } from "./intake-flow-highlights";
import type { ClaritySession, TherapyPrepSheet } from "@/types/clarity";

const DEFAULT_PREP_QUESTIONS = [
  "How do you usually start when someone feels the way I’ve been feeling?",
  "What would it look like if therapy were helping — even in small ways?",
  "How should I reach you between sessions if I’m not in crisis but struggling?",
] as const;

export function intakeHighlightLines(intake: ClaritySession["intake"]): string[] {
  return intakeFlowHighlightLines(intake);
}

export function lifestyleHighlightLines(session: ClaritySession): string[] {
  const L = session.lifestyle;
  if (!L) return ["No lifestyle snapshot saved in this session."];
  const lines: string[] = [];
  lines.push(`Mood (self-report): ${L.mood} / 5`);
  lines.push(`Sleep quality: ${L.sleepQuality} / 5`);
  if (L.sleepHoursApprox != null) lines.push(`Approximate sleep hours: ${L.sleepHoursApprox}`);
  if (L.sleepChartNote?.trim()) {
    lines.push(`Sleep context (optional note): ${L.sleepChartNote.trim()}`);
  }
  if (L.sleepChartAttachmentMeta) {
    lines.push(
      `Sleep screenshot placeholder: “${L.sleepChartAttachmentMeta.fileName}” (${Math.round(L.sleepChartAttachmentMeta.size / 1024)} KB) — not read by Clarity; for your therapist’s eyes only if you choose.`
    );
  }
  lines.push(`Stress: ${L.stressLevel} / 5`);
  if (L.screenTime.mode === "hours_estimate" && L.screenTime.hoursApprox != null) {
    lines.push(`Screen time (your estimate): ~${L.screenTime.hoursApprox} hrs / day`);
  } else {
    lines.push(
      L.screenTime.screenshotNote
        ? `Screen time: note attached — ${L.screenTime.screenshotNote}`
        : "Screen time: noted for discussion (no automatic tracking)."
    );
  }
  return lines;
}

function brainDumpExcerptForPrep(session: ClaritySession): string {
  const excerpt = session.brainDump?.text?.trim() ?? "";
  const themes = session.brainDump?.themes?.filter(Boolean) ?? [];
  const body =
    excerpt.slice(0, 720) + (excerpt.length > 720 ? "…" : "") || "(No brain dump text saved in this session.)";
  if (themes.length === 0) return body;
  return `${body}\n\nThemes you marked: ${themes.join(", ")}`;
}

function dedupeStrings(items: readonly string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of items) {
    const t = raw.trim();
    if (!t || seen.has(t.toLowerCase())) continue;
    seen.add(t.toLowerCase());
    out.push(t);
  }
  return out;
}

function buildExperiencingNarrative(session: ClaritySession): string {
  const ra = session.readinessAnalysis;
  if (ra?.conciseSummary?.trim()) return ra.conciseSummary.trim();
  const s = session.summary!;
  const parts = [s.headline, ...s.keyThemes.slice(0, 4)];
  return parts.filter(Boolean).join(" ");
}

function buildEmotionalPatterns(session: ClaritySession): string[] {
  const ra = session.readinessAnalysis;
  if (ra?.emotionalPatterns?.length) return [...ra.emotionalPatterns];
  const s = session.summary!;
  if (s.keyThemes.length) return [...s.keyThemes];
  return ["Patterns will emerge as you talk — nothing here needs to be “complete.”"];
}

function buildTriggersStressors(session: ClaritySession): string[] {
  const ra = session.readinessAnalysis;
  const tags = Array.isArray(session.intake.life_stress_tags)
    ? session.intake.life_stress_tags.filter((x): x is string => typeof x === "string")
    : [];
  const fromModel = ra?.mainConcerns?.slice(0, 5) ?? [];
  const merged = dedupeStrings([...tags, ...fromModel]);
  if (merged.length) return merged;
  return [
    "I haven’t named specific triggers in this export yet — I’ll add my own notes before my visit.",
  ];
}

function buildSupportSeeking(session: ClaritySession): string[] {
  const ra = session.readinessAnalysis;
  if (ra?.potentialSupportAreas?.length) return [...ra.potentialSupportAreas];
  const s = session.summary!;
  return s.rationaleBullets.slice(0, 5).length
    ? [...s.rationaleBullets.slice(0, 5)]
    : [
        "I’m still figuring out what kind of support would feel right — I’d like help naming it.",
      ];
}

function buildWhatIWantFromTherapy(session: ClaritySession): string {
  const goals = typeof session.intake.therapy_goals === "string" ? session.intake.therapy_goals.trim() : "";
  const prefs =
    typeof session.intake.therapist_preferences === "string"
      ? session.intake.therapist_preferences.trim()
      : "";
  const chunks: string[] = [];
  if (goals) chunks.push(goals);
  if (prefs) chunks.push(`Preferences / style: ${prefs}`);
  if (chunks.length) return chunks.join("\n\n");
  const ra = session.readinessAnalysis;
  const prep = ra?.therapyPrepSummary?.trim();
  if (prep) {
    return `From my reflection (draft language to edit with my therapist):\n\n${prep.slice(0, 900)}${prep.length > 900 ? "…" : ""}`;
  }
  return `I want a space to explore what’s been hard without rushing to solutions. My reflection opened with: “${session.summary!.headline}”`;
}

function buildQuestions(session: ClaritySession): string[] {
  const ra = session.readinessAnalysis;
  if (ra?.recommendedQuestionsForTherapy?.length) return [...ra.recommendedQuestionsForTherapy];
  return [...DEFAULT_PREP_QUESTIONS];
}

function buildDontForget(session: ClaritySession): string {
  const ra = session.readinessAnalysis;
  const parts: string[] = [];

  if (ra?.journalSummary?.trim()) {
    parts.push("A line I might read aloud or leave on paper:\n" + ra.journalSummary.trim());
  }

  if (ra?.lowFrictionInterventions?.length) {
    const bullets = ra.lowFrictionInterventions.slice(0, 4).map((s) => `• ${s}`);
    parts.push("Gentle ideas to hold between sessions:\n" + bullets.join("\n"));
  } else {
    const selfCare = session.nextSteps?.filter((n) => n.category === "self_care").slice(0, 2) ?? [];
    if (selfCare.length) {
      parts.push(
        "Small steps I noted for myself:\n" +
          selfCare.map((n) => `• ${n.title} — ${n.description}`).join("\n")
      );
    }
  }

  parts.push(
    "\nAnything I don’t want to forget in the room:\n________________________________________________________________\n________________________________________________________________"
  );

  return parts.filter(Boolean).join("\n\n");
}

export function buildPrepSheet(session: ClaritySession): TherapyPrepSheet | null {
  if (!session.summary || !session.nextSteps?.length) return null;
  return {
    sessionId: session.id,
    createdAt: new Date().toISOString(),
    summary: session.summary,
    nextSteps: session.nextSteps,
    intakeHighlights: intakeHighlightLines(session.intake),
    lifestyleHighlights: lifestyleHighlightLines(session),
    brainDumpExcerpt: brainDumpExcerptForPrep(session),
    experiencingNarrative: buildExperiencingNarrative(session),
    emotionalPatterns: buildEmotionalPatterns(session),
    triggersAndStressors: buildTriggersStressors(session),
    supportImLookingFor: buildSupportSeeking(session),
    whatIWantFromTherapy: buildWhatIWantFromTherapy(session),
    questionsIWantToAsk: buildQuestions(session),
    dontForgetInSession: buildDontForget(session),
  };
}
