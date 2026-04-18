/**
 * Deterministic therapist matching (heuristic, no ML).
 *
 * Ranking priority (lexicographic tuple, high → low):
 *   1) Specialty / focus fit   (intake + summary tags + AI traits + user specialty picks)
 *   2) Identity / style / approach fit  (culturally responsive, warmth vs directness, CBT vs EMDR…)
 *   3) Modality + optional location fit
 *   4) Budget + insurance fit
 *   5) Review quality          (rating × review volume, log-damped)
 *
 * Tuning: edit `THERAPIST_MATCH_SCORING` only — all weights live there.
 *
 * The matcher also produces:
 *  - `reasons`: short, specific chips ("Specializes in burnout", "Fits your $150 budget") for UI.
 *  - `matchExplanation`: a 1–2-sentence natural-language summary (legacy field).
 *  - `highlight`: optional curated-bucket label ("Best overall fit", "Best budget fit", …).
 */

import type { MockTherapistProfile } from "@/data/mock-therapist-profiles";
import { therapistFromMockProfile } from "@/data/therapists";
import { CONCERN_TAG_LABELS } from "@/lib/clarity/results-copy";
import type {
  ClaritySession,
  ConcernTag,
  MatchPreferences,
  ModalityFilter,
  Therapist,
} from "@/types/clarity";

// —— Tunable scoring ——————————————————————————————————————————————————————

export const THERAPIST_MATCH_SCORING = {
  /** Bucket 1 — specialty / focus */
  specialty: {
    /** Each distinct user/AI/tag concern string that clearly appears in therapist focus text. */
    strongHit: 24,
    strongMax: 120,
    /** Each AI suggested trait phrase match in therapist haystack. */
    traitHit: 16,
    traitMax: 80,
    /** Short tokens mined from intake prose (weaker signal). */
    intakeWordHit: 5,
    intakeWordMax: 25,
    intakeTokenMinLen: 4,
    intakeTokenMaxCount: 14,
  },
  /** Bucket 2 — identity, style, approach (new) */
  fit: {
    identityHit: 22,
    identityMax: 44,
    styleHit: 14,
    styleMax: 28,
    approachHit: 14,
    approachMax: 28,
    languageHit: 18,
    languageMax: 18,
  },
  /** Bucket 3 — modality + location */
  modality: {
    meetsExplicitPreference: 52,
    flexibleAnyBonus: 18,
    bothFormatsExtra: 8,
    locationHit: 16,
  },
  /** Bucket 4 — finance */
  finance: {
    budgetNeutral: 24,
    /** Their floor <= user max. */
    budgetComfort: 36,
    /** Their floor within ~12% over max. */
    budgetStretch: 12,
    slidingScaleBonus: 8,
    insuranceNeutral: 20,
    insuranceHit: 11,
    insuranceMax: 44,
  },
  /** Bucket 5 — reviews */
  reviews: {
    ratingMultiplier: 14,
    volumeMax: 12,
    volumeRef: 120,
  },
  /** Display score blend — UI only (ranking uses sortTuple). */
  display: {
    specialtyWeight: 0.38,
    fitWeight: 0.18,
    modalityWeight: 0.18,
    financeWeight: 0.17,
    reviewsWeight: 0.09,
  },
} as const;

// —— Types ————————————————————————————————————————————————————————————————

export interface TherapistMatchInput {
  specialtyConcerns: string[];
  suggestedTherapistTraits: string[];
  intakeTextTokens: string[];
  maxBudgetUsd?: number;
  insuranceTagsWanted: string[];
  modality: ModalityFilter;
  locationPreference?: string;
  /** New — from richer MatchPreferences. */
  identityFocus: string[];
  styleTags: string[];
  approaches: string[];
  languagesWanted: string[];
  /** Derived from filters/intake: true when user seems budget-constrained. */
  prioritizeAffordability: boolean;
}

export type MatchReasonTone = "specialty" | "fit" | "modality" | "finance" | "reviews";

export interface MatchReason {
  /** Short chip label (≤ ~38 chars). */
  label: string;
  tone: MatchReasonTone;
  /** Optional longer context shown as tooltip / secondary line. */
  detail?: string;
}

export interface RankedTherapistMatch {
  profile: MockTherapistProfile;
  therapist: Therapist;
  /** 5-tuple sort key: [specialty, fit, modality, finance, reviews]. */
  sortTuple: readonly [number, number, number, number, number];
  matchScore: number;
  /** Short-chip reasons for the card UI. */
  reasons: MatchReason[];
  /** Legacy explanation — 1–2 sentences. */
  matchExplanation: string;
  /** Set by `highlightCuratedMatches` when this item is the “best X” pick. */
  highlight?: CuratedHighlight;
}

export type CuratedHighlightKind =
  | "best_overall"
  | "best_for_concern"
  | "best_budget"
  | "best_telehealth"
  | "identity_aligned";

export interface CuratedHighlight {
  kind: CuratedHighlightKind;
  label: string;
  blurb: string;
}

interface SpecialtyEvidence {
  score: number;
  matchedLabels: string[];
  primaryConcern?: string;
}
interface FitEvidence {
  score: number;
  identityHits: string[];
  styleHits: string[];
  approachHits: string[];
  languageHits: string[];
}
interface ModalityEvidence {
  score: number;
  labels: string[];
  modalityMet: boolean;
  locationMatched: boolean;
}
interface FinanceEvidence {
  score: number;
  labels: string[];
  budgetMet: boolean;
  insuranceMatched: boolean;
}
interface ReviewEvidence {
  score: number;
  labels: string[];
}

// —— Helpers ————————————————————————————————————————————————————————————————

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
  const raw = blob.split(/[^a-z0-9+]+/g).filter(Boolean);
  const min = THERAPIST_MATCH_SCORING.specialty.intakeTokenMinLen;
  const seen = new Set<string>();
  const tokens: string[] = [];
  for (const w of raw) {
    if (w.length < min) continue;
    if (seen.has(w)) continue;
    seen.add(w);
    tokens.push(w);
    if (tokens.length >= THERAPIST_MATCH_SCORING.specialty.intakeTokenMaxCount) break;
  }
  return tokens;
}

// —— Input builder ————————————————————————————————————————————————————————

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

  // Heuristic: explicit toggle OR a low budget cap signals we should favor cheaper options on ties.
  const explicit = prefs.prioritizeAffordability === true;
  const implicit = typeof prefs.maxBudgetUsd === "number" && prefs.maxBudgetUsd > 0 && prefs.maxBudgetUsd <= 110;

  return {
    specialtyConcerns,
    suggestedTherapistTraits: suggestedTherapistTraits.filter(Boolean),
    intakeTextTokens,
    maxBudgetUsd: prefs.maxBudgetUsd,
    insuranceTagsWanted: dedupeLower(prefs.insurance),
    modality: prefs.modality,
    locationPreference: loc && loc.length > 0 ? loc : undefined,
    identityFocus: dedupeLower(prefs.identityFocus ?? []),
    styleTags: dedupeLower(prefs.styleTags ?? []),
    approaches: dedupeLower(prefs.approaches ?? []),
    languagesWanted: dedupeLower(prefs.languages ?? []),
    prioritizeAffordability: explicit || implicit,
  };
}

export function buildTherapistMatchInputFromPrefsOnly(prefs: MatchPreferences): TherapistMatchInput {
  return buildTherapistMatchInput({ intake: {}, summary: null, readinessAnalysis: null }, prefs);
}

// —— Scoring ————————————————————————————————————————————————————————————————

function therapistHaystack(p: MockTherapistProfile): string {
  return norm(
    [
      ...p.specialties,
      ...p.tags,
      p.idealFor,
      p.bio.slice(0, 220),
      p.reviewSummary.slice(0, 120),
      ...(p.reviewerVoices ?? []),
      ...(p.identityFocus ?? []),
      ...(p.styleTags ?? []),
      ...(p.approaches ?? []),
    ].join(" ")
  );
}

function scoreSpecialty(p: MockTherapistProfile, input: TherapistMatchInput): SpecialtyEvidence {
  const hay = therapistHaystack(p);
  const cfg = THERAPIST_MATCH_SCORING.specialty;
  const matched: string[] = [];
  let score = 0;
  let primary: string | undefined;

  for (const concern of input.specialtyConcerns) {
    if (!concern) continue;
    if (hay.includes(concern)) {
      score += cfg.strongHit;
      matched.push(concern);
      if (!primary) primary = concern;
    }
  }
  score = Math.min(score, cfg.strongMax);

  let traitPoints = 0;
  for (const trait of input.suggestedTherapistTraits) {
    if (!trait) continue;
    if (hay.includes(trait)) {
      traitPoints += cfg.traitHit;
      matched.push(`“${trait}”`);
    }
  }
  traitPoints = Math.min(traitPoints, cfg.traitMax);

  let weak = 0;
  const seen = new Set(matched);
  for (const tok of input.intakeTextTokens) {
    if (hay.includes(tok)) {
      weak += cfg.intakeWordHit;
      seen.add(`from your words: “${tok}”`);
    }
  }
  weak = Math.min(weak, cfg.intakeWordMax);

  return {
    score: Math.min(score + traitPoints + weak, cfg.strongMax + cfg.traitMax + cfg.intakeWordMax),
    matchedLabels: [...seen].slice(0, 6),
    primaryConcern: primary,
  };
}

function overlapLower(
  wanted: readonly string[],
  haveRaw: readonly string[] | undefined
): string[] {
  if (!wanted.length || !haveRaw?.length) return [];
  const have = new Set(haveRaw.map((h) => norm(h)));
  const hits: string[] = [];
  for (const w of wanted) {
    if (have.has(norm(w))) hits.push(w);
  }
  return hits;
}

function scoreFit(p: MockTherapistProfile, input: TherapistMatchInput): FitEvidence {
  const cfg = THERAPIST_MATCH_SCORING.fit;
  let score = 0;

  const identityHits = overlapLower(input.identityFocus, p.identityFocus);
  const styleHits = overlapLower(input.styleTags, p.styleTags);
  const approachHits = overlapLower(input.approaches, p.approaches);
  const languageHits = overlapLower(input.languagesWanted, p.languages);

  score += Math.min(identityHits.length * cfg.identityHit, cfg.identityMax);
  score += Math.min(styleHits.length * cfg.styleHit, cfg.styleMax);
  score += Math.min(approachHits.length * cfg.approachHit, cfg.approachMax);
  score += Math.min(languageHits.length * cfg.languageHit, cfg.languageMax);

  return { score, identityHits, styleHits, approachHits, languageHits };
}

function scoreModality(
  p: MockTherapistProfile,
  modality: ModalityFilter,
  locationPreference?: string
): ModalityEvidence {
  const cfg = THERAPIST_MATCH_SCORING.modality;
  const labels: string[] = [];
  let score = 0;
  let met = false;
  let locHit = false;

  if (modality === "any") {
    score = cfg.flexibleAnyBonus;
    labels.push("Offers at least one way to meet");
    met = true;
    if (p.telehealth && p.inPerson) {
      score += cfg.bothFormatsExtra;
      labels.push("Telehealth and in-person both available");
    }
  } else if (modality === "telehealth") {
    if (p.telehealth) {
      score = cfg.meetsExplicitPreference;
      labels.push("Offers telehealth");
      met = true;
    }
  } else if (modality === "in_person") {
    if (p.inPerson) {
      score = cfg.meetsExplicitPreference;
      labels.push("Sees people in person");
      met = true;
    }
  }

  if (locationPreference) {
    const loc = norm(locationPreference);
    if (loc && p.location.toLowerCase().includes(loc)) {
      score += cfg.locationHit;
      labels.push(`Location mentions “${locationPreference.trim()}”`);
      locHit = true;
    }
  }

  return { score, labels, modalityMet: met, locationMatched: locHit };
}

function scoreFinance(p: MockTherapistProfile, input: TherapistMatchInput): FinanceEvidence {
  const cfg = THERAPIST_MATCH_SCORING.finance;
  const labels: string[] = [];
  let score = 0;
  let budgetMet = false;
  let insuranceMatched = false;

  const maxB = input.maxBudgetUsd;
  const minPrice = p.priceRange.min;
  if (maxB == null || Number.isNaN(maxB)) {
    score += cfg.budgetNeutral;
    labels.push("No budget set");
  } else if (minPrice <= maxB) {
    score += cfg.budgetComfort;
    labels.push(`Starts at or below your $${maxB} cap`);
    budgetMet = true;
  } else if (minPrice <= maxB * 1.12) {
    score += cfg.budgetStretch;
    labels.push("Slightly above your cap — ask about sliding scale");
  } else {
    labels.push("Above your listed cap");
  }

  if (p.slidingScale) {
    score += cfg.slidingScaleBonus;
    labels.push("Offers sliding-scale / reduced fee");
  }

  if (!input.insuranceTagsWanted.length) {
    score += cfg.insuranceNeutral;
  } else {
    let ins = 0;
    const hits: string[] = [];
    for (const want of input.insuranceTagsWanted) {
      const hit = p.insuranceAccepted.find(
        (tag) => norm(tag).includes(want) || want.includes(norm(tag))
      );
      if (hit) {
        ins += cfg.insuranceHit;
        hits.push(hit);
      }
    }
    ins = Math.min(ins, cfg.insuranceMax);
    score += ins;
    if (hits.length) {
      insuranceMatched = true;
      labels.push(`Insurance lines up: ${[...new Set(hits)].slice(0, 3).join(", ")}`);
    } else {
      labels.push("No insurance match — ask about out-of-network");
    }
  }

  return { score, labels, budgetMet, insuranceMatched };
}

function scoreReviews(p: MockTherapistProfile): ReviewEvidence {
  const cfg = THERAPIST_MATCH_SCORING.reviews;
  const ratingPart = Math.max(0, (p.rating - 4) * cfg.ratingMultiplier);
  const vol = cfg.volumeMax * (Math.log1p(p.reviewCount) / Math.log1p(cfg.volumeRef));
  const score = ratingPart + Math.min(vol, cfg.volumeMax);
  return {
    score,
    labels: [
      `${p.rating.toFixed(2)} avg · ${p.reviewCount} sample reviews`,
      p.reviewSummary,
    ],
  };
}

function modalityHardOk(p: MockTherapistProfile, modality: ModalityFilter): boolean {
  if (modality === "any") return true;
  if (modality === "telehealth") return p.telehealth;
  return p.inPerson;
}

// —— Reason builder ————————————————————————————————————————————————————————

function titleCase(s: string): string {
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}

function buildReasons(
  p: MockTherapistProfile,
  spec: SpecialtyEvidence,
  fit: FitEvidence,
  mod: ModalityEvidence,
  fin: FinanceEvidence,
  rev: ReviewEvidence,
  input: TherapistMatchInput
): MatchReason[] {
  const out: MatchReason[] = [];

  if (spec.primaryConcern) {
    out.push({
      tone: "specialty",
      label: `Specializes in ${titleCase(spec.primaryConcern)}`,
      detail: spec.matchedLabels.slice(0, 4).join(" · "),
    });
  } else if (spec.matchedLabels.length) {
    out.push({
      tone: "specialty",
      label: `Overlaps ${spec.matchedLabels.slice(0, 2).map(titleCase).join(" & ")}`,
    });
  }

  if (fit.identityHits.length) {
    out.push({
      tone: "fit",
      label: `${fit.identityHits[0]}`,
      detail: fit.identityHits.join(" · "),
    });
  }
  if (fit.styleHits.length) {
    out.push({
      tone: "fit",
      label: `${fit.styleHits[0]} style`,
      detail: fit.styleHits.join(" · "),
    });
  }
  if (fit.approachHits.length) {
    out.push({
      tone: "fit",
      label: `Uses ${fit.approachHits.join(" & ")}`,
    });
  }
  if (fit.languageHits.length) {
    out.push({
      tone: "fit",
      label: `Speaks ${fit.languageHits.join(" · ")}`,
    });
  }

  if (input.modality !== "any" && mod.modalityMet) {
    out.push({
      tone: "modality",
      label: input.modality === "telehealth" ? "Telehealth available" : "In-person available",
    });
  } else if (input.modality === "any" && p.telehealth && p.inPerson) {
    out.push({ tone: "modality", label: "Both formats offered" });
  }
  if (mod.locationMatched && input.locationPreference) {
    out.push({ tone: "modality", label: `Near “${input.locationPreference}”` });
  }

  if (fin.budgetMet && input.maxBudgetUsd != null) {
    out.push({
      tone: "finance",
      label: `Within $${input.maxBudgetUsd} budget`,
      detail: `Typical $${p.priceRange.min}–$${p.priceRange.max}`,
    });
  }
  if (p.slidingScale) {
    out.push({ tone: "finance", label: "Sliding-scale option" });
  }
  if (fin.insuranceMatched && input.insuranceTagsWanted.length) {
    out.push({ tone: "finance", label: "Insurance aligns" });
  }

  if (p.rating >= 4.85 && p.reviewCount >= 100) {
    out.push({
      tone: "reviews",
      label: `${p.rating.toFixed(2)} avg · ${p.reviewCount} reviews`,
      detail: rev.labels[1],
    });
  } else if (p.rating >= 4.8) {
    out.push({ tone: "reviews", label: `${p.rating.toFixed(2)} avg sample rating` });
  }

  return out.slice(0, 7);
}

function buildExplanation(
  p: MockTherapistProfile,
  spec: SpecialtyEvidence,
  fit: FitEvidence,
  reasons: MatchReason[]
): string {
  const parts: string[] = [];
  if (spec.matchedLabels.length) {
    parts.push(
      `Their focus overlaps what you shared — ${spec.matchedLabels.slice(0, 3).join(", ")}.`
    );
  } else {
    parts.push("Wider-fit option: not a tight keyword match, but worth reading if the style resonates.");
  }
  if (fit.identityHits.length || fit.approachHits.length || fit.styleHits.length) {
    const bits: string[] = [];
    if (fit.identityHits.length) bits.push(fit.identityHits.join(" & "));
    if (fit.styleHits.length) bits.push(`${fit.styleHits[0].toLowerCase()} in session`);
    if (fit.approachHits.length) bits.push(`uses ${fit.approachHits.join("/")}`);
    parts.push(`Fit notes: ${bits.join(" · ")}.`);
  }
  if (p.idealFor) parts.push(`Often works well with: ${p.idealFor}`);
  void reasons;
  return parts.join(" ");
}

// —— Ranking ————————————————————————————————————————————————————————————————

const SPEC_MAX =
  THERAPIST_MATCH_SCORING.specialty.strongMax +
  THERAPIST_MATCH_SCORING.specialty.traitMax +
  THERAPIST_MATCH_SCORING.specialty.intakeWordMax;
const FIT_MAX =
  THERAPIST_MATCH_SCORING.fit.identityMax +
  THERAPIST_MATCH_SCORING.fit.styleMax +
  THERAPIST_MATCH_SCORING.fit.approachMax +
  THERAPIST_MATCH_SCORING.fit.languageMax;
const MOD_MAX =
  THERAPIST_MATCH_SCORING.modality.meetsExplicitPreference +
  THERAPIST_MATCH_SCORING.modality.bothFormatsExtra +
  THERAPIST_MATCH_SCORING.modality.locationHit;
const FIN_MAX =
  THERAPIST_MATCH_SCORING.finance.budgetNeutral +
  THERAPIST_MATCH_SCORING.finance.insuranceNeutral +
  THERAPIST_MATCH_SCORING.finance.insuranceMax +
  THERAPIST_MATCH_SCORING.finance.slidingScaleBonus;
const REV_MAX =
  (5 - 4) * THERAPIST_MATCH_SCORING.reviews.ratingMultiplier +
  THERAPIST_MATCH_SCORING.reviews.volumeMax;

function displayScore(s: number, f: number, m: number, fi: number, r: number): number {
  const d = THERAPIST_MATCH_SCORING.display;
  const sn = SPEC_MAX > 0 ? Math.min(1, s / SPEC_MAX) : 0;
  const fn = FIT_MAX > 0 ? Math.min(1, f / FIT_MAX) : 0;
  const mn = MOD_MAX > 0 ? Math.min(1, m / MOD_MAX) : 0;
  const cn = FIN_MAX > 0 ? Math.min(1, fi / FIN_MAX) : 0;
  const rn = REV_MAX > 0 ? Math.min(1, r / REV_MAX) : 0;
  const raw =
    sn * d.specialtyWeight +
    fn * d.fitWeight +
    mn * d.modalityWeight +
    cn * d.financeWeight +
    rn * d.reviewsWeight;
  return Math.round(Math.min(100, Math.max(0, raw * 100)));
}

export function rankTherapistMatches(
  input: TherapistMatchInput,
  profiles: readonly MockTherapistProfile[]
): RankedTherapistMatch[] {
  const ranked: RankedTherapistMatch[] = [];

  for (const p of profiles) {
    if (!modalityHardOk(p, input.modality)) continue;

    const specE = scoreSpecialty(p, input);
    const fitE = scoreFit(p, input);
    const modE = scoreModality(p, input.modality, input.locationPreference);
    const finE = scoreFinance(p, input);
    const revE = scoreReviews(p);

    // Affordability tilts finance higher when set; we shadow-lift finance score in the tuple.
    const finInt = Math.round(
      finE.score * 100 * (input.prioritizeAffordability ? 1.15 : 1)
    );

    const specInt = Math.round(specE.score * 100);
    const fitInt = Math.round(fitE.score * 100);
    const modInt = Math.round(modE.score * 100);
    const revInt = Math.round(revE.score * 100);

    const matchScore = displayScore(specE.score, fitE.score, modE.score, finE.score, revE.score);

    const reasons = buildReasons(p, specE, fitE, modE, finE, revE, input);
    const explanation = buildExplanation(p, specE, fitE, reasons);

    const therapist: Therapist = {
      ...therapistFromMockProfile(p),
      matchScore,
      matchExplanation: explanation,
    };

    ranked.push({
      profile: p,
      therapist,
      sortTuple: [specInt, fitInt, modInt, finInt, revInt] as const,
      matchScore,
      reasons,
      matchExplanation: explanation,
    });
  }

  ranked.sort((a, b) => {
    for (let i = 0; i < 5; i++) {
      if (a.sortTuple[i] !== b.sortTuple[i]) return b.sortTuple[i]! - a.sortTuple[i]!;
    }
    return a.therapist.id.localeCompare(b.therapist.id);
  });

  return ranked;
}

// —— Curated highlights ———————————————————————————————————————————————————

/**
 * Mutates (and returns) the list, tagging up to 4 entries with curated-bucket labels.
 * Categories chosen to maximize *distinct* recommendations: we never stamp two labels on one row.
 */
export function highlightCuratedMatches(
  ranked: RankedTherapistMatch[],
  input: TherapistMatchInput
): RankedTherapistMatch[] {
  if (!ranked.length) return ranked;
  const used = new Set<string>();

  function pick(
    kind: CuratedHighlightKind,
    label: string,
    blurb: string,
    predicate: (m: RankedTherapistMatch) => boolean
  ): void {
    for (const m of ranked) {
      if (used.has(m.profile.id)) continue;
      if (!predicate(m)) continue;
      m.highlight = { kind, label, blurb };
      used.add(m.profile.id);
      return;
    }
  }

  // 1) Best overall — top of ranking, always stamped.
  pick(
    "best_overall",
    "Best overall fit",
    "Strongest alignment with the themes, style, and practicalities you shared.",
    () => true
  );

  // 2) Best for main concern (if we have one).
  const concern = input.specialtyConcerns[0];
  if (concern) {
    pick(
      "best_for_concern",
      `Best for ${titleCase(concern)}`,
      `Their sample profile centers on ${titleCase(concern)} work.`,
      (m) => (m.profile.specialties.join(" ") + " " + m.profile.tags.join(" "))
        .toLowerCase()
        .includes(concern)
    );
  }

  // 3) Best budget fit — cheapest that still scored well.
  pick(
    "best_budget",
    "Best budget fit",
    "Lower typical fee range with a sliding-scale or reduced-fee option listed.",
    (m) =>
      m.profile.priceRange.min <= 120 &&
      (m.profile.slidingScale === true || m.profile.priceRange.min <= 110)
  );

  // 4) Best telehealth — first telehealth-capable result the user would see.
  if (input.modality !== "in_person") {
    pick(
      "best_telehealth",
      "Best telehealth option",
      "Strong telehealth practice with flexible scheduling in the sample data.",
      (m) => m.profile.telehealth
    );
  }

  // 5) Identity-aligned (if user asked for one).
  if (input.identityFocus.length) {
    pick(
      "identity_aligned",
      "Identity-aligned pick",
      "Their sample profile names the identity lens you asked for.",
      (m) => overlapLower(input.identityFocus, m.profile.identityFocus).length > 0
    );
  }

  return ranked;
}
