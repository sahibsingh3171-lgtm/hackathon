# `features/` — one place per product area (judge map)

Each subfolder is a **single entry** for a slice of Clarity: open `index.ts` for re-exports (what the code calls) and **`README.md`** for the full file list (UI, API, prompts).

Implementation stays in `hooks/`, `lib/`, `components/`, and `app/api/` — this layer does **not** duplicate logic.

| Folder | What it covers |
|--------|----------------|
| [`voice-audio/`](./voice-audio/) | Mic, Web Speech vs Whisper fallback, transcription API |
| [`matching-filters/`](./matching-filters/) | Rank/score/sort therapists from prefs + session |
| [`therapist-directory/`](./therapist-directory/) | Mock rows + filter chip taxonomies |
| [`intake-adaptive/`](./intake-adaptive/) | Which intake steps show after brain dump |
| [`brain-dump-extraction/`](./brain-dump-extraction/) | LLM mapping text → intake fields + step hints |
| [`lifestyle-checkin/`](./lifestyle-checkin/) | Lifestyle snapshot from intake / form |
| [`ai-summary/`](./ai-summary/) | Summary prompt + parse + mock fallback |
| [`readiness-support/`](./readiness-support/) | Readiness prompts, contract, crisis augmentation |
| [`crisis-safety/`](./crisis-safety/) | Keyword / scale heuristics for crisis UX |
| [`prep-sheet/`](./prep-sheet/) | Prep sheet builder |
| [`practice-session/`](./practice-session/) | Practice turn prompts + conversation helpers |
| [`marketing-landing/`](./marketing-landing/) | Public landing composition |
| [`session-state/`](./session-state/) | Context + persistence (README only) |

Full cross-feature map: [`../../docs/CODEMAP.md`](../../docs/CODEMAP.md).
