# `lib/therapist/` — Matching, ranking, sorting (deterministic)

| File | Role |
|------|------|
| `match-algorithm.ts` | Build `TherapistMatchInput`, **score** profiles, **hard-filter** modality in `rankTherapistMatches`, curated highlights |
| `match-sort.ts` | Sort modes for ranked results |
| `match.ts` | Legacy prefs-only helper |
| `index.ts` | Public exports |

Consumes **`src/data/mock-therapist-profiles`** (and related).

Map: [`../../../docs/CODEMAP.md`](../../../docs/CODEMAP.md).
