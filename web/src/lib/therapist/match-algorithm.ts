/**
 * Deterministic therapist matching (heuristic, no ML).
 *
 * Priority when ranking (lexicographic tuple, high → low):
 * 1) Specialty / focus fit (intake + summary tags + AI traits + user specialty picks)
 * 2) Modality + optional location fit
 * 3) Budget + insurance fit
 * 4) Rating + review volume
 *
 * Tuning: edit `THERAPIST_MATCH_SCORING` only — all weights live there.
 */

import type { MockTherapistProfile } from "@/data/mock-therapist-profiles";
import { therapistFromMockProfile } from "@/data/therapists";
import { CONCERN_TAG_LABELS } from "@/lib/clarity/results-copy";
import type { ClaritySession, ConcernTag, MatchPreferences, ModalityFilter, Therapist } from "@/types/clarity";

// —— Tunable scoring (adjust here only) —————————————————————————————————————

export const THERAPIST_MATCH_SCORING = {
  /** Bucket 1 — specialty / focus */
  specialty: {
    /** Each distinct user/AI/tag “concern” string that clearly appears in therapist focus text. */
    strongHit: 22,
    strongMax: 110,
    /** Each AI suggested trait phrase match in therapist haystack. */
    traitHit: 16,
    traitMax: 80,
    /** Short tokens mined from intake prose (weaker signal). */
    intakeWordHit: 5,
    intakeWordMax: 25,
    /** Ignore intake tokens shorter than this (reduces noise). */
    intakeTokenMinLen: 4,
    /** Max intake tokens considered. */
    intakeTokenMaxCount: 14,
  },
  /** Bucket 2 — modality + optional location */
  modality: {
    meetsExplicitPreference: 52,
    /** User said “any”; reward therapists who offer both formats slightly. */
    flexibleAnyBonus: 18,
    bothFormatsExtra: 8,
    /** Substring match on therapist `location` (city / state / “telehealth”). */
    locationHit: 16,
  },
  /** Bucket 3 — budget + insurance */
  finance: {
    /** No budget entered — neutral so other buckets decide. */
    budgetNeutral: 26,
    /** Therapist typical floor at or under user max budget. */
    budgetComfort: 34,
    /** Within 12% over user max (soft squeeze — still listed, scored lower). */
    budgetStretch: 12,
    /** No insurance filter selected. */
    insuranceNeutral: 22,
    /** Per overlapping insurance tag (fuzzy), capped. */
    insuranceHit: 11,
    insuranceMax: 44,
  },
  /** Bucket 4 — reviews */
  reviews: {
    /** Scale ratings 4.0–5.0 into ~0–14 points. */
    ratingMultiplier: 14,
    /** Up to ~12 points from review volume (log-damped). */
    volumeMax: 12,
    volumeRef: 120,
  },
  /** Display score 0–100 — blend for UI only; ranking uses `sortTuple`. */
  display: {
    specialtyWeight: 0.46,
    modalityWeight: 0.24,
    financeWeight: 0.2,
    reviewsWeight: 0.1,
  },
} as const;

// —— Types ————————————————————————————————————————————————————————————————

export interface TherapistMatchInput {
  /** Lowercased, deduped focus strings from filters + summary tags + life stress tags. */
  specialtyConcerns: string[];
  /** Raw AI strings (lowercased before scoring). */
  suggestedTherapistTraits: string[];
  /** Lowercased tokens from intake prose (weak specialty signal). */
  intakeTextTokens: string[];
  maxBudgetUsd?: number;
  insuranceTagsWanted: string[];
  modality: ModalityFilter;
  locationPreference?: string;
}

export interface RankedTherapistMatch {
  /** Full mock profile for rich UI (cards, booking links). */
  profile: MockTherapistProfile;
  therapist: Therapist;
  /** Lexicographic sort key (specialty → modality → finance → reviews). */
  sortTuple: readonly [number, number, number, number];
  /** 0–100 rounded display score (derived from components, not the sort key). */
  matchScore: number;
  /** Human-readable explanation (2–4 short sentences). */
  matchExplanation: string;
}

interface SpecialtyEvidence {
  score: number;
  matchedLabels: string[];
}

interface ModalityEvidence {
  score: number;
  labels: string[];
}

interface FinanceEvidence {
  score: number;
  labels: string[];
}

interface ReviewEvidence {
  score: number;
  labels: string[];
}

// —— Input builders ———————————————————————————————————————————————————————

function norm(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, " ");
}

function dedupeLower(list: readonly string[]): string[] {
  const set = new Set<string>();
  for (const raw of list) {
    const t = norm(raw);
    if (t.length >= 2) set.add(t);
  }
  return [...set];
}

const TAG_FOCUS_NEEDLES: Record<ConcernTag, readonly string[]> = {
  anxiety: ["anxiety", "panic", "worry", "ocd", "phobia"],
  depression: ["depression", "mood", "low mood", "hopeless"],
  sleep: ["sleep", "insomnia", "fatigue", "rest"],
  stress: ["stress", "burnout", "overwhelm"],
  relationships: ["relationship", "couples", "communication", "attachment"],
  substance: ["substance", "harm reduction", "addiction", "recovery"],
  self_harm_ideation: ["trauma", "safety", "distress", "crisis"],
  other: [],
};

function concernStringsFromTags(tags: readonly ConcernTag[]): string[] {
  const out: string[] = [];
  for (const tag of tags) {
    const label = CONCERN_TAG_LABELS[tag];
    for (const piece of label.split(/[^a-zA-Z0-9+]+/)) {
      const t = norm(piece);
      if (t.length >= 3) out.push(t);
    }
    for (const n of TAG_FOCUS_NEEDLES[tag]) out.push(n);
  }
  return dedupeLower(out);
}

function tokenizeIntakeProse(intake: ClaritySession["intake"]): string[] {
  const parts = [
    typeof intake.visit_reason === "string" ? intake.visit_reason : "",
    typeof intake.therapy_goals === "string" ? intake.therapy_goals : "",
    typeof intake.therapist_preferences === "string" ? intake.therapist_preferences : "",
  ];
  const blob = parts.join(" ").toLowerCase();
  const rawTokens = blob.split(/[^a-z0-9+]+/g).filter(Boolean);
  const min = THERAPIST_MATCH_SCORING.specialty.intakeTokenMinLen;
  const seen = new Set<string>();
  const tokens: string[] = [];
  for (const w of rawTokens) {
    if (w.length < min) continue;
    if (seen.has(w)) continue;
    seen.add(w);
    tokens.push(w);
    if (tokens.length >= THERAPIST_MATCH_SCORING.specialty.intakeTokenMaxCount) break;
  }
  return tokens;
}

/**
 * Build matcher inputs from session + UI filters.
 * Intake + AI traits + summary tags inform specialty; prefs carry budget / insurance / modality / location.
 */
export function buildTherapistMatchInput(
  session: Pick<ClaritySession, "intake" | "summary" | "readinessAnalysis">,
  prefs: MatchPreferences
): TherapistMatchInput {
  const specialtyConcerns = dedupeLower([
    ...prefs.specialties,
    ...concernStringsFromTags(session.summary?.tags ?? []),
    ...(Array.isArray(session.intake.life_stress_tags)
      ? session.intake.life_stress_tags.filter((x): x is string => typeof x === "string")
      : []),
  ]);

  const suggestedTherapistTraits = (session.readinessAnalysis?.suggestedTherapistTraits ?? []).map(
    (t) => norm(t)
  );

  const intakeTextTokens = tokenizeIntakeProse(session.intake);

  const loc = prefs.locationPreference?.trim();
  return {
    specialtyConcerns,
    suggestedTherapistTraits: suggestedTherapistTraits.filter(Boolean),
    intakeTextTokens,
    maxBudgetUsd: prefs.maxBudgetUsd,
    insuranceTagsWanted: dedupeLower(prefs.insurance),
    modality: prefs.modality,
    locationPreference: loc && loc.length > 0 ? loc : undefined,
  };
}

/** Prefs-only input (no session context) — tests / minimal flows. */
export function buildTherapistMatchInputFromPrefsOnly(prefs: MatchPreferences): TherapistMatchInput {
  return buildTherapistMatchInput(
    { intake: {}, summary: null, readinessAnalysis: null },
    prefs
  );
}

// —— Scoring helpers ———————————————————————————————————————————————————————

function therapistHaystack(p: MockTherapistProfile): string {
  return norm(
    [
      ...p.specialties,
      ...p.tags,
      p.idealFor,
      p.bio.slice(0, 220),
      p.reviewSummary.slice(0, 120),
    ].join(" ")
  );
}

function haystackIncludesPhrase(haystack: string, phrase: string): boolean {
  const p = norm(phrase);
  if (!p) return false;
  return haystack.includes(p);
}

function scoreSpecialty(p: MockTherapistProfile, input: TherapistMatchInput): SpecialtyEvidence {
  const hay = therapistHaystack(p);
  const cfg = THERAPIST_MATCH_SCORING.specialty;
  const matchedLabels: string[] = [];

  let score = 0;
  for (const concern of input.specialtyConcerns) {
    if (!concern) continue;
    if (haystackIncludesPhrase(hay, concern)) {
      score += cfg.strongHit;
      matchedLabels.push(concern);
    }
  }
  score = Math.min(score, cfg.strongMax);

  let traitPoints = 0;
  for (const trait of input.suggestedTherapistTraits) {
    if (!trait) continue;
    if (haystackIncludesPhrase(hay, trait)) {
      traitPoints += cfg.traitHit;
      matchedLabels.push(`“${trait}”`);
    }
  }
  traitPoints = Math.min(traitPoints, cfg.traitMax);

  let weak = 0;
  const labelSet = new Set(matchedLabels);
  for (const tok of input.intakeTextTokens) {
    if (hay.includes(tok)) {
      weak += cfg.intakeWordHit;
      labelSet.add(`from your words: “${tok}”`);
    }
  }
  weak = Math.min(weak, cfg.intakeWordMax);

  const total = Math.min(score + traitPoints + weak, cfg.strongMax + cfg.traitMax + cfg.intakeWordMax);
  return {
    score: total,
    matchedLabels: [...labelSet].slice(0, 6),
  };
}

function scoreModality(
  p: MockTherapistProfile,
  modality: ModalityFilter,
  locationPreference?: string
): ModalityEvidence {
  const cfg = THERAPIST_MATCH_SCORING.modality;
  const labels: string[] = [];
  let score = 0;

  if (modality === "any") {
    score = cfg.flexibleAnyBonus;
    labels.push("Offers more than one way to meet in this sample set");
    if (p.telehealth && p.inPerson) {
      score += cfg.bothFormatsExtra;
      labels.push("Lists both telehealth and in-person");
    }
  } else if (modality === "telehealth") {
    if (p.telehealth) {
      score = cfg.meetsExplicitPreference;
      labels.push("Offers telehealth");
    }
  } else if (modality === "in_person") {
    if (p.inPerson) {
      score = cfg.meetsExplicitPreference;
      labels.push("Sees people in person");
    }
  }

  if (locationPreference) {
    const loc = norm(locationPreference);
    if (loc && p.location.toLowerCase().includes(loc)) {
      score += cfg.locationHit;
      labels.push(`Their location text mentions “${locationPreference.trim()}”`);
    }
  }

  return { score, labels };
}

function scoreFinance(
  p: MockTherapistProfile,
  input: TherapistMatchInput
): FinanceEvidence {
  const cfg = THERAPIST_MATCH_SCORING.finance;
  const labels: string[] = [];
  let score = 0;

  const maxB = input.maxBudgetUsd;
  const minPrice = p.priceRange.min;
  if (maxB == null || Number.isNaN(maxB)) {
    score += cfg.budgetNeutral;
    labels.push("No budget entered — fees were not used to move anyone down the list");
  } else if (minPrice <= maxB) {
    score += cfg.budgetComfort;
    labels.push(`Their listed range starts at or below the $${maxB} you named`);
  } else if (minPrice <= maxB * 1.12) {
    score += cfg.budgetStretch;
    labels.push(
      "Their listed range starts a little above what you named — still worth asking about sliding scale or out-of-network options"
    );
  } else {
    labels.push("Their listed range is above what you named — they appear lower, not hidden");
  }

  if (!input.insuranceTagsWanted.length) {
    score += cfg.insuranceNeutral;
    labels.push("No insurance filters selected");
  } else {
    let ins = 0;
    const hits: string[] = [];
    for (const want of input.insuranceTagsWanted) {
      const hit = p.insuranceAccepted.find((tag) =>
        norm(tag).includes(want) || want.includes(norm(tag))
      );
      if (hit) {
        ins += cfg.insuranceHit;
        hits.push(hit);
      }
    }
    ins = Math.min(ins, cfg.insuranceMax);
    score += ins;
    if (hits.length) {
      labels.push(`Insurance tags that line up: ${[...new Set(hits)].slice(0, 3).join(", ")}`);
    } else {
      labels.push("No clear insurance tag match — ask them about out-of-network or reimbursement");
    }
  }

  return { score, labels };
}

function scoreReviews(p: MockTherapistProfile): ReviewEvidence {
  const cfg = THERAPIST_MATCH_SCORING.reviews;
  const ratingPart = Math.max(0, (p.rating - 4) * cfg.ratingMultiplier);
  const vol =
    cfg.volumeMax *
    (Math.log1p(p.reviewCount) / Math.log1p(cfg.volumeRef));
  const score = ratingPart + Math.min(vol, cfg.volumeMax);
  return {
    score,
    labels: [
      `${p.rating.toFixed(2)} average in sample data (${p.reviewCount} reviews)`,
      p.reviewSummary,
    ],
  };
}

function modalityHardOk(p: MockTherapistProfile, modality: ModalityFilter): boolean {
  if (modality === "any") return true;
  if (modality === "telehealth") return p.telehealth;
  return p.inPerson;
}

function displayScore(
  spec: number,
  mod: number,
  fin: number,
  rev: number,
  specMax: number,
  modMax: number,
  finMax: number,
  revMax: number
): number {
  const d = THERAPIST_MATCH_SCORING.display;
  const sn = specMax > 0 ? Math.min(1, spec / specMax) : 0;
  const mn = modMax > 0 ? Math.min(1, mod / modMax) : 0;
  const fn = finMax > 0 ? Math.min(1, fin / finMax) : 0;
  const rn = revMax > 0 ? Math.min(1, rev / revMax) : 0;
  const raw =
    sn * d.specialtyWeight +
    mn * d.modalityWeight +
    fn * d.financeWeight +
    rn * d.reviewsWeight;
  return Math.round(Math.min(100, Math.max(0, raw * 100)));
}

function buildExplanation(
  spec: SpecialtyEvidence,
  mod: ModalityEvidence,
  fin: FinanceEvidence,
  rev: ReviewEvidence,
  p: MockTherapistProfile
): string {
  const sentences: string[] = [];

  if (spec.matchedLabels.length) {
    sentences.push(
      `They rose on the list partly because their focus areas overlap what you shared — including ${spec.matchedLabels
        .slice(0, 4)
        .join(", ")}.`
    );
  } else {
    sentences.push(
      "They are a wider-fit option: not a tight keyword match to your themes, but still worth reading if their style speaks to you."
    );
  }

  if (mod.labels.length) {
    sentences.push(mod.labels.join(" "));
  }

  sentences.push(fin.labels.join(" "));

  sentences.push(`${rev.labels[0]} — ${rev.labels[1]}`);

  sentences.push(`What they often work well with: ${p.idealFor}`);

  return sentences.join(" ");
}

// —— Public API ——————————————————————————————————————————————————————————————

const SPEC_MAX =
  THERAPIST_MATCH_SCORING.specialty.strongMax +
  THERAPIST_MATCH_SCORING.specialty.traitMax +
  THERAPIST_MATCH_SCORING.specialty.intakeWordMax;
const MOD_MAX =
  THERAPIST_MATCH_SCORING.modality.meetsExplicitPreference +
  THERAPIST_MATCH_SCORING.modality.bothFormatsExtra +
  THERAPIST_MATCH_SCORING.modality.locationHit;
/** Upper bound for normalizing finance bucket (budget + insurance paths). */
const FIN_MAX =
  THERAPIST_MATCH_SCORING.finance.budgetNeutral +
  THERAPIST_MATCH_SCORING.finance.insuranceNeutral +
  THERAPIST_MATCH_SCORING.finance.insuranceMax;
const REV_MAX =
  (5 - 4) * THERAPIST_MATCH_SCORING.reviews.ratingMultiplier +
  THERAPIST_MATCH_SCORING.reviews.volumeMax;

/**
 * Rank mock therapists deterministically.
 * - Hard filter: modality must be satisfiable when user picks telehealth or in-person only.
 * - Soft signals: budget / insurance never remove a provider (score only).
 */
export function rankTherapistMatches(
  input: TherapistMatchInput,
  profiles: readonly MockTherapistProfile[]
): RankedTherapistMatch[] {
  const ranked: RankedTherapistMatch[] = [];

  for (const p of profiles) {
    if (!modalityHardOk(p, input.modality)) continue;

    const specE = scoreSpecialty(p, input);
    const modE = scoreModality(p, input.modality, input.locationPreference);
    const finE = scoreFinance(p, input);
    const revE = scoreReviews(p);

    const specInt = Math.round(specE.score * 100);
    const modInt = Math.round(modE.score * 100);
    const finInt = Math.round(finE.score * 100);
    const revInt = Math.round(revE.score * 100);

    const therapist: Therapist = {
      ...therapistFromMockProfile(p),
      matchScore: displayScore(specE.score, modE.score, finE.score, revE.score, SPEC_MAX, MOD_MAX, FIN_MAX, REV_MAX),
      matchExplanation: buildExplanation(specE, modE, finE, revE, p),
    };

    ranked.push({
      profile: p,
      therapist,
      sortTuple: [specInt, modInt, finInt, revInt] as const,
      matchScore: therapist.matchScore ?? 0,
      matchExplanation: therapist.matchExplanation ?? "",
    });
  }

  ranked.sort((a, b) => {
    for (let i = 0; i < 4; i++) {
      if (a.sortTuple[i] !== b.sortTuple[i]) return b.sortTuple[i]! - a.sortTuple[i]!;
    }
    return a.therapist.id.localeCompare(b.therapist.id);
  });

  return ranked;
}
