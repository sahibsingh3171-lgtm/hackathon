# `lib/` — Shared application logic

Pure TS / small utilities importable from **client or server** unless a file imports Node-only APIs.

| Subfolder | Role |
|-----------|------|
| `ai/` | Prompts, parsers, contracts, mocks for OpenAI-backed features |
| `clarity/` | Domain logic: intake steps, crisis heuristics, prep sheet, session persistence, constants |
| `therapist/` | Deterministic matching, ranking, sorting (no network) |
| `validation/` | Zod (and similar) for API request bodies |

`env.ts` — central place to read environment variables (never expose server keys to the client).

Map: [`../../docs/CODEMAP.md`](../../docs/CODEMAP.md).
