# Brain dump → intake extraction — file map

| Role | Path |
|------|------|
| **API route** | `src/app/api/clarity/intake-from-brain-dump/route.ts` |
| **Merge, prompts, mock extraction** | `src/lib/ai/intake-extraction.ts` |
| **Canonical step list after model** | `src/lib/ai/intake-extraction-canonical.ts` |
| **Brain dump page** | `src/app/(flow)/brain-dump/page.tsx` |
| **Text + voice input** | `src/components/clarity/BrainDumpInput.tsx` |

**Single import surface (server-safe helpers):** `./index.ts`.
