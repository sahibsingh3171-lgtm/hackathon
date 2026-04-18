import { MOCK_THERAPIST_PROFILES } from "@/data/mock-therapist-profiles";
import type { MatchPreferences, Therapist } from "@/types/clarity";

import {
  buildTherapistMatchInputFromPrefsOnly,
  rankTherapistMatches,
} from "./match-algorithm";

/**
 * Legacy entry: ranks the mock directory using **prefs only** (no session / AI traits).
 * Prefer `rankTherapistMatches` + `buildTherapistMatchInput` when session is available.
 */
export function matchTherapists(therapists: Therapist[], prefs: MatchPreferences): Therapist[] {
  void therapists;
  const input = buildTherapistMatchInputFromPrefsOnly(prefs);
  return rankTherapistMatches(input, MOCK_THERAPIST_PROFILES).map((r) => ({
    ...r.therapist,
    matchReason: r.matchExplanation,
  }));
}
