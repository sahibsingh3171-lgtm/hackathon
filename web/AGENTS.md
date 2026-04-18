<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Codebase map (navigation for demos)

- **Primary:** [`docs/CODEMAP.md`](docs/CODEMAP.md) — feature → UI → Route Handler → `lib/` → data.
- **Folder labels:** `src/**/README.md` — what each directory is for (e.g. `app/api` = Next.js server, OpenAI key safe).

## Hackathon build principles (this repo)

- **Simplest explainable code** — Prefer the smallest number of files, patterns, and dependencies that still behave well. A teammate (or a judge) should be able to follow the flow without a map.
- **No dip in quality** — Clear names, straight-line control flow, TypeScript where it prevents mistakes, accessible UI. Simplicity means *obvious*, not sloppy.
- **Demo-first** — If a boring, explicit solution ships faster and is easier to narrate live, choose it over a clever abstraction. If something is temporary for the event, keep it small and easy to delete after.

## Clarity flow (MVP)

**Route order** (see `src/lib/clarity/constants.ts` → `FLOW_STEPS`): `/brain-dump` → `/intake` → `/lifestyle` → `/summary` → `/matches` → `/practice-session` → `/prep-sheet` → `/next-steps`.

**State** (`ClaritySession` in `src/types/clarity.ts`): `brainDump` is captured first. Optional `intakePrefilledStepIds` / `intakeConfirmedStepIds` record which fields were prefilled from `/api/clarity/intake-from-brain-dump` and which prefilled screens the user has already continued past. `intake.intakeFlowStep` is the **cursor into the “due” step list** (not a raw `INTAKE_FLOW_STEPS` index). Persistence: `src/lib/clarity/session.ts` + `claritySessionPersistence`.

**Responsibilities**: `BrainDumpInput` (typed text drives extraction; optional local voice note placeholder), brain-dump page (skip vs. continue + extraction call), `IntakeFlowWizard` (`computeDueIntakeStepIndices` — only invalid or unconfirmed inferred steps; first-screen “gentle read” card + calmer per-step draft copy), lifestyle + summary pages (navigation only). No conversational agent — one JSON extraction call and the existing one-screen-at-a-time wizard.
