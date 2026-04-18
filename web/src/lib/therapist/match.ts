import type { MatchPreferences, Therapist } from "@/types/clarity";

type ScoredTherapist = Therapist & { _score: number };

function modalityOk(t: Therapist, pref: MatchPreferences["modality"]): boolean {
  if (pref === "any") return true;
  return t.modalities.includes(pref);
}

function budgetOk(t: Therapist, maxUsd?: number): boolean {
  if (maxUsd == null || Number.isNaN(maxUsd)) return true;
  const from = t.priceFromUsd ?? 9999;
  return from <= maxUsd;
}

function insuranceOverlap(t: Therapist, wanted: string[]): boolean {
  if (!wanted.length) return true;
  return wanted.some((w) =>
    t.insuranceTags.some((tag) => tag.toLowerCase().includes(w.toLowerCase()))
  );
}

function specialtyScore(t: Therapist, wanted: string[]): number {
  if (!wanted.length) return 1;
  const set = new Set(t.specialties.map((s) => s.toLowerCase()));
  let score = 0;
  for (const w of wanted) {
    for (const s of set) {
      if (s.includes(w.toLowerCase()) || w.toLowerCase().includes(s)) score += 3;
    }
  }
  return score;
}

export function matchTherapists(
  therapists: Therapist[],
  prefs: MatchPreferences
): Therapist[] {
  const filtered = therapists.filter(
    (t) =>
      modalityOk(t, prefs.modality) &&
      budgetOk(t, prefs.maxBudgetUsd) &&
      insuranceOverlap(t, prefs.insurance)
  );

  const scored: ScoredTherapist[] = filtered.map((t) => {
    const spec = specialtyScore(t, prefs.specialties);
    const review = t.reviewScore * 10 + Math.min(t.reviewCount, 200) * 0.01;
    const score = spec * 5 + review;
    const reasons: string[] = [];
    if (spec > 0) reasons.push("Overlaps with what you prioritized");
    if (prefs.modality !== "any" && t.modalities.includes(prefs.modality)) {
      reasons.push(`Offers ${prefs.modality.replace("_", " ")}`);
    }
    if (prefs.maxBudgetUsd != null && (t.priceFromUsd ?? 0) <= prefs.maxBudgetUsd) {
      reasons.push("Within your budget filter");
    }
    if (prefs.insurance.length) {
      const hit = t.insuranceTags.find((tag) =>
        prefs.insurance.some((w) => tag.toLowerCase().includes(w.toLowerCase()))
      );
      if (hit) reasons.push(`Insurance tag: ${hit}`);
    }
    return {
      ...t,
      matchReason: reasons[0] ?? "Strong general fit for therapy readiness",
      _score: score,
    };
  });

  scored.sort((a, b) => b._score - a._score);
  return scored.map((entry) => {
    const { _score, ...rest } = entry;
    void _score;
    return rest;
  });
}
