# AI summary (therapy-readiness copy) — file map

| Role | Path |
|------|------|
| **API route** | `src/app/api/clarity/summary/route.ts` |
| **System prompt + user payload** | `src/lib/ai/prompts.ts` |
| **Parse model JSON** | `src/lib/ai/parse-summary.ts` |
| **Mock when no API key** | `src/lib/ai/mock-summary.ts` |
| **Summary page + panel** | `src/app/(flow)/summary/page.tsx`, `src/components/clarity/AISummaryPanel.tsx` |

**Single import surface (prompts + parsing):** `./index.ts`.
