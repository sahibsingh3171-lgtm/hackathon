# Clarity — codebase map (judges & developers)

This document is the **single orientation point** for the Next.js app in `web/`. Use it to answer “where is X?” during a live demo. Folder-level `README.md` files under `src/` repeat shorter labels; this file connects **features → UI → API → logic → data**.

---

## Architecture at a glance

```
Browser (React, App Router pages)
    │
    ├─► Client state: React context (`src/contexts/clarity-session-context.tsx`)
    │       Types: `src/types/clarity.ts`
    │
    ├─► UI: `src/app/(flow)/*`, `src/app/(marketing)/*`, `src/components/*`
    │
    └─► Server: Next.js Route Handlers `src/app/api/clarity/*/route.ts`
            • Read `OPENAI_API_KEY` only on the server (`src/lib/env.ts`)
            • Call OpenAI HTTPS from Node (`runtime = "nodejs"`)
            • Return JSON to the client (no key in responses)
```

**Important:** `app/api/**` is **not** a separate backend service. It is **Next.js server code** colocated with the frontend. Anything that touches API keys or paid models belongs here (or in shared `lib/` imported only from these routes).

---

## Route order (product flow)

Defined in `src/lib/clarity/constants.ts` (`FLOW_STEPS`). Typical path:

`/brain-dump` → `/intake` → `/lifestyle` → `/summary` → `/matches` → `/practice-session` → `/prep-sheet` → `/next-steps`

---

## Feature → file index

### Brain dump (free text + optional voice)

| Layer | Location |
|--------|-----------|
| Page | `src/app/(flow)/brain-dump/page.tsx` |
| Main UI | `src/components/clarity/BrainDumpInput.tsx` |
| Session fields | `session.brainDump` in `src/types/clarity.ts` |

### Voice input & transcription

| Layer | Location |
|--------|-----------|
| Hook (mic, MediaRecorder, optional streaming behavior) | `src/hooks/use-voice-dictation.ts` |
| UI wiring | `BrainDumpInput.tsx` (and practice chat where applicable) |
| **Server** speech-to-text | `src/app/api/clarity/transcribe/route.ts` — receives audio from client, calls provider with **server** credentials |
| Env | See `.env.example`; keys must stay server-only |

### Intake from brain dump (LLM extraction)

| Layer | Location |
|--------|-----------|
| API route (entry) | `src/app/api/clarity/intake-from-brain-dump/route.ts` |
| Merge / step derivation | `src/lib/ai/intake-extraction.ts` |
| Canonical normalization | `src/lib/ai/intake-extraction-canonical.ts` |
| Prompts / payloads | Built in `intake-extraction.ts` (`INTAKE_EXTRACTION_SYSTEM`, etc.) |

### Adaptive questionnaire (“reduced” intake after brain dump)

| Layer | Location |
|--------|-----------|
| **Which steps exist** | `src/lib/clarity/intake-flow-config.ts` — `INTAKE_FLOW_STEPS` |
| **Which steps are “due”** (skip confirmed prefills, or wizard-only list) | `src/lib/clarity/intake-due-steps.ts` — `computeDueIntakeStepIndices` |
| Wizard UI | `src/components/intake/IntakeFlowWizard.tsx` |
| Per-step validation | `src/lib/clarity/intake-flow-validation.ts` |
| Page shell | `src/app/(flow)/intake/page.tsx` |

**Judge answer:** After extraction, the API can set `intakeWizardStepIds` / prefilled metadata on the session; `computeDueIntakeStepIndices` returns only those indices until the user confirms inferred fields — see `intake-due-steps.ts` header comments.

### Lifestyle check-in

| Layer | Location |
|--------|-----------|
| Page | `src/app/(flow)/lifestyle/page.tsx` |
| Form UI | `src/components/clarity/LifestyleSignalsForm.tsx` |
| Domain helpers | `src/lib/clarity/intake-flow-validation.ts` (`buildLifestyleFromIntake`, etc.) |

### AI summary (therapy-readiness copy, not diagnosis)

| Layer | Location |
|--------|-----------|
| Page (triggers / displays) | `src/app/(flow)/summary/page.tsx` |
| API route | `src/app/api/clarity/summary/route.ts` — OpenAI `chat/completions` or mock if no key |
| System prompt | `src/lib/ai/prompts.ts` — `SUMMARY_SYSTEM`, `buildSummaryUserPayload` |
| Parse / validate JSON | `src/lib/ai/parse-summary.ts` |
| Mock fallback | `src/lib/ai/mock-summary.ts` |
| Types for request/response | `src/types/clarity.ts` (`SummaryRequestBody`, `AiSummaryResult`, …) |
| Panel UI | `src/components/clarity/AISummaryPanel.tsx` |

### Readiness / support analysis (structured “readiness” output)

| Layer | Location |
|--------|-----------|
| API route | `src/app/api/clarity/readiness-analysis/route.ts` |
| Prompts | `src/lib/ai/readiness-analysis-prompts.ts` |
| Zod / parsing contract | `src/lib/ai/readiness-analysis.contract.ts` |
| Crisis augmentation on top of model output | `src/lib/ai/readiness-analysis-crisis.ts` |
| Mock / QA fixtures | `src/lib/ai/readiness-analysis-mock.ts` |
| Shared types | `src/types/readiness-analysis.ts` |
| JSON schema (reference) | `src/schemas/readiness-analysis-response.schema.json` |
| Results UI | `src/components/clarity/AnalysisResultsView.tsx` |

### Crisis detection & support UX

| Layer | Location |
|--------|-----------|
| Heuristics (keywords + PHQ item 9 style signals) | `src/lib/clarity/crisis-heuristics.ts` |
| Banners / panels | `src/components/clarity/CrisisBanner.tsx`, `CrisisSupportPanel.tsx` |
| Panel state helper | `src/lib/clarity/crisis-support-panel-state.ts` |
| Copy | `src/lib/clarity/crisis-copy.ts` |

**Judge answer:** This is **UX safety nudging**, not clinical triage.

### Therapist matching, filtering, ranking

| Concern | Location |
|---------|-----------|
| **Filter UI** (specialty, modality, insurance, budget, …) | `src/components/clarity/MatchFilters.tsx` |
| **Selected filters / prefs state** | `MatchPreferences` on `session.matchPreferences`; local UI state on `src/app/(flow)/matches/page.tsx` (`useState` + `setSession` to persist) |
| **Build matcher input** from session + prefs | `src/lib/therapist/match-algorithm.ts` — `buildTherapistMatchInput`, `buildTherapistMatchInputFromPrefsOnly` |
| **Hard filter** (excludes rows) | Same file — `modalityHardOk` inside `rankTherapistMatches` (e.g. telehealth vs in-person) |
| **Ranking / scoring** | `rankTherapistMatches`, `THERAPIST_MATCH_SCORING` in `match-algorithm.ts` |
| **Sort modes** (recommended vs price, etc.) | `src/lib/therapist/match-sort.ts` — `sortRankedTherapistMatches` |
| **“Curated” highlights** | `highlightCuratedMatches` in `match-algorithm.ts` |
| **Public API surface** | `src/lib/therapist/index.ts` |
| **Legacy helper** | `src/lib/therapist/match.ts` — `matchTherapists` |
| **Mock directory rows** | `src/data/mock-therapist-profiles.ts`, `src/data/therapists.ts`, `src/data/arlington-heights-build.ts` |
| **Match page** | `src/app/(flow)/matches/page.tsx` |

### Prep sheet

| Layer | Location |
|--------|-----------|
| Page | `src/app/(flow)/prep-sheet/page.tsx` |
| Generator | `src/lib/clarity/prep-sheet.ts` |

### Practice session (bounded chat turns)

| Layer | Location |
|--------|-----------|
| Page | `src/app/(flow)/practice-session/page.tsx` |
| Chat UI | `src/components/clarity/PracticeChat.tsx`, `PracticeSessionPanel.tsx` |
| API | `src/app/api/clarity/practice-turn/route.ts` |
| Prompts / mock | `src/lib/ai/practice-session-prompts.ts`, `practice-session-mock.ts` |
| Session transcript shape | `src/lib/clarity/practice-conversation.ts`, `practice-session.ts` |

### Landing / marketing

| Layer | Location |
|--------|-----------|
| Entry route | `src/app/(marketing)/page.tsx` |
| Layout | `src/app/(marketing)/layout.tsx` |
| Sections | `src/components/marketing/landing-*.tsx` |

### Geo / area label (optional UX)

| Layer | Location |
|--------|-----------|
| API | `src/app/api/clarity/reverse-geocode/route.ts` |
| Client resolver | `src/lib/clarity/therapist-area-from-browser.ts` |

### Session persistence & demo

| Layer | Location |
|--------|-----------|
| React provider | `src/contexts/clarity-session-context.tsx` |
| In-memory + optional localStorage keys | `src/lib/clarity/session.ts`, `persisted-session.ts` |
| Demo one-shot hydration | `src/lib/clarity/demo-flow.ts` |

### Shared layout / providers

| Layer | Location |
|--------|-----------|
| Root layout | `src/app/layout.tsx` |
| Flow layout | `src/app/(flow)/layout.tsx` |
| Shell | `src/components/layout/AppShell.tsx`, `AppProviders.tsx` |

### Env & validation

| Layer | Location |
|--------|-----------|
| Env accessors | `src/lib/env.ts` |
| Zod schemas for API bodies | `src/lib/validation/` |

---

## FAQ (verbatim judge questions)

| Question | Answer |
|----------|--------|
| Where is the filtering system? | UI: `MatchFilters.tsx`. State: `matches/page.tsx` + `session.matchPreferences`. Scoring + **hard** modality gate: `match-algorithm.ts` (`rankTherapistMatches`). |
| How does therapist matching work? | Deterministic heuristic in `match-algorithm.ts`; sort modes in `match-sort.ts`; data from `src/data/`. |
| Where is the AI prompt for the summary? | `src/lib/ai/prompts.ts` (`SUMMARY_SYSTEM`). |
| Where do you store session state? | In React: `clarity-session-context.tsx`; shapes in `types/clarity.ts`; persistence helpers in `lib/clarity/session.ts` and `persisted-session.ts`. |
| Where is crisis detection? | `lib/clarity/crisis-heuristics.ts` + UI in `CrisisBanner` / `CrisisSupportPanel`; readiness route may augment via `readiness-analysis-crisis.ts`. |
| How does the questionnaire get reduced after the brain dump? | Extraction API + `mergeIntakeFromExtraction` / step ids in `lib/ai/intake-extraction*.ts`; **due step list** from `computeDueIntakeStepIndices` in `intake-due-steps.ts`; wizard in `IntakeFlowWizard.tsx`. |

---

## Import alias

`@/*` → `src/*` (see `tsconfig.json`).

---

## Related docs

- **Agent / team conventions:** `web/AGENTS.md`
- **Run / deploy:** `web/README.md`

When you add a new feature, append one row to the relevant table above so the map stays honest.
