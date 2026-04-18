# Readiness / support analysis — file map

| Role | Path |
|------|------|
| **API route** | `src/app/api/clarity/readiness-analysis/route.ts` |
| **System prompt + user payload** | `src/lib/ai/readiness-analysis-prompts.ts` |
| **Zod / normalize / parse** | `src/lib/ai/readiness-analysis.contract.ts` |
| **Crisis augmentation on top of model** | `src/lib/ai/readiness-analysis-crisis.ts` |
| **Mock fixture** | `src/lib/ai/readiness-analysis-mock.ts` |
| **Types** | `src/types/readiness-analysis.ts` |
| **Results UI** | `src/components/clarity/AnalysisResultsView.tsx` |

**Single import surface:** `./index.ts`.
