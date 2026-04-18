import type { RankedTherapistMatch } from "./match-algorithm";

export type TherapistMatchSortMode = "recommended" | "fee_asc" | "rating_desc" | "reviews_desc";

function compareTupleDesc(a: RankedTherapistMatch, b: RankedTherapistMatch): number {
  for (let i = 0; i < 4; i++) {
    if (a.sortTuple[i] !== b.sortTuple[i]) return b.sortTuple[i]! - a.sortTuple[i]!;
  }
  return a.therapist.id.localeCompare(b.therapist.id);
}

/**
 * Re-orders ranked matches for UI. `recommended` preserves algorithm order (already sorted).
 */
export function sortRankedTherapistMatches(
  matches: readonly RankedTherapistMatch[],
  mode: TherapistMatchSortMode
): RankedTherapistMatch[] {
  const copy = [...matches];
  switch (mode) {
    case "recommended":
      return copy.sort(compareTupleDesc);
    case "fee_asc":
      return copy.sort((a, b) => {
        const d = a.profile.priceRange.min - b.profile.priceRange.min;
        if (d !== 0) return d;
        return compareTupleDesc(a, b);
      });
    case "rating_desc":
      return copy.sort((a, b) => {
        const d = b.profile.rating - a.profile.rating;
        if (d !== 0) return d > 0 ? 1 : d < 0 ? -1 : 0;
        return compareTupleDesc(a, b);
      });
    case "reviews_desc":
      return copy.sort((a, b) => {
        const d = b.profile.reviewCount - a.profile.reviewCount;
        if (d !== 0) return d;
        return compareTupleDesc(a, b);
      });
    default:
      return copy;
  }
}
