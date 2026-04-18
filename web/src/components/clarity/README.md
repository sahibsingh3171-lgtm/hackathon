# `components/clarity/` — Clarity product UI

Feature-oriented components for the wizard: brain dump input, filters, therapist cards, crisis UI, summary panels, practice chat, step chrome (`StepShell`), etc.

**Trace to logic:** these import hooks/context (`useClaritySession`) and call `fetch` to `app/api/clarity/*`. Heavy logic stays in `src/lib/`.

Map: [`../../../docs/CODEMAP.md`](../../../docs/CODEMAP.md).
