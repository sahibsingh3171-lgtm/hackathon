# `lib/ai/` — LLM prompts, parsers, contracts

Used primarily from **`src/app/api/clarity/*/route.ts`** (server). Exports are listed in `index.ts`.

| Area | Files (typical) |
|------|-----------------|
| Summary | `prompts.ts`, `parse-summary.ts`, `mock-summary.ts` |
| Brain dump → intake | `intake-extraction.ts`, `intake-extraction-canonical.ts` |
| Readiness analysis | `readiness-analysis-prompts.ts`, `readiness-analysis.contract.ts`, `readiness-analysis-crisis.ts`, `readiness-analysis-mock.ts` |
| Practice session | `practice-session-prompts.ts`, `practice-session-mock.ts` |

**Judge line:** “The prompt lives next to the parser under `lib/ai/`; the HTTP entry is `app/api/clarity/...`.”

Map: [`../../../docs/CODEMAP.md`](../../../docs/CODEMAP.md).
