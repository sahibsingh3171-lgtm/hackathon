# `api/clarity/` — Clarity server endpoints (OpenAI & helpers)

| Route folder | Role |
|--------------|------|
| `summary/` | AI headline/themes summary (`SUMMARY_SYSTEM` in `lib/ai/prompts.ts`) |
| `intake-from-brain-dump/` | LLM maps brain dump → intake fields + step hints |
| `transcribe/` | Server-side speech-to-text for uploaded audio |
| `readiness-analysis/` | Structured readiness JSON + validation contract |
| `practice-turn/` | One bounded practice-chat model turn |
| `reverse-geocode/` | Optional location label helper (no OpenAI required) |

Each `route.ts` uses `export const runtime = "nodejs"` where Node APIs or stable OpenAI fetch is needed.

**Trace:** UI page → `fetch("/api/clarity/...")` → corresponding `route.ts` → `src/lib/ai/*` or `src/lib/clarity/*`.

Full map: [`../../../../docs/CODEMAP.md`](../../../../docs/CODEMAP.md).
