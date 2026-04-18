# Session state (client + persistence) — file map

| Role | Path |
|------|------|
| **React context (live session)** | `src/contexts/clarity-session-context.tsx` |
| **Persistence helpers** | `src/lib/clarity/session.ts`, `persisted-session.ts` |
| **Session shape** | `src/types/clarity.ts` (`ClaritySession`) |
| **Demo one-shot** | `src/lib/clarity/demo-flow.ts` |

No `index.ts` here: the provider is a client component; import `ClaritySessionProvider` / `useClaritySession` from `@/contexts/clarity-session-context` in layout code.
