# Matching + filters — file map

| Role | Path |
|------|------|
| **Filter panel UI** | `src/components/clarity/MatchFilters.tsx` |
| **Matches page (prefs state, list)** | `src/app/(flow)/matches/page.tsx` |
| **Rank / score / hard modality gate** | `src/lib/therapist/match-algorithm.ts` |
| **Sort modes** | `src/lib/therapist/match-sort.ts` |
| **Legacy prefs-only API** | `src/lib/therapist/match.ts` |
| **Public exports** | `src/lib/therapist/index.ts` |
| **Therapist cards** | `src/components/clarity/MatchTherapistCard.tsx` |
| **Mock data + filter lists** | `src/features/therapist-directory/` |

**Single import surface for scoring/sorting:** `./index.ts` → `import { rankTherapistMatches, … } from "@/features/matching-filters"`.
