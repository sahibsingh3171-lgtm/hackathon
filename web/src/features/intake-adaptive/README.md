# Adaptive intake (which questions appear) — file map

| Role | Path |
|------|------|
| **Due-step list after brain dump / prefills** | `src/lib/clarity/intake-due-steps.ts` |
| **Step definitions (order, ids)** | `src/lib/clarity/intake-flow-config.ts` |
| **Per-step validation** | `src/lib/clarity/intake-flow-validation.ts` |
| **Wizard UI** | `src/components/intake/IntakeFlowWizard.tsx` |
| **Intake route** | `src/app/(flow)/intake/page.tsx` |

**Single import surface:** `./index.ts`.
