/**
 * Public API for mock therapist matching — deterministic scoring, sort modes, and “curated” highlights.
 * Judges: no network calls; consumes `MockTherapistProfile[]` from `src/data/`.
 */
export { matchTherapists } from "./match";
export {
  THERAPIST_MATCH_SCORING,
  buildTherapistMatchInput,
  buildTherapistMatchInputFromPrefsOnly,
  highlightCuratedMatches,
  rankTherapistMatches,
} from "./match-algorithm";
export type {
  CuratedHighlight,
  CuratedHighlightKind,
  MatchReason,
  MatchReasonTone,
  RankedTherapistMatch,
  TherapistMatchInput,
} from "./match-algorithm";
export { sortRankedTherapistMatches, type TherapistMatchSortMode } from "./match-sort";
