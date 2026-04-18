# Clarity — polished live demo (judges)

Fictional persona **Alex Rivera** (29, product designer) showcases **emotional clarity**, **structured AI**, **heuristic matching**, and the **prep sheet** differentiator — without crisis UI noise (PHQ item 9 scored `0`).

All therapist rows are **synthetic**. Sample AI objects live in code as **`getDemoSession()`** (`src/lib/clarity/demo-flow.ts`) so you can hydrate the app in one action.

---

## 1. Sample user profile (persona)

| Field | Value |
|--------|--------|
| **Name** | Alex Rivera |
| **Age** | 29 |
| **Role** | Product designer, growth-stage startup |
| **Situation** | “Fine on paper” — good job, supportive partner — but depleted, snappy at home, Sunday dread, guilt for “not being grateful enough.” |
| **Goal for therapy** | Sleep without 2 a.m. work rehearsals; less guarded conflict with partner; steadiness without “hustle harder.” |
| **Therapist wish-list** | Direct but warm, humor OK, LGBTQ+ affirming, burnout + high-performer experience, not icy-clinical. |

Full narrative strings: `DEMO_PERSONA` in `src/lib/clarity/demo-flow.ts`.

---

## 2. Sample intake (highlights)

- **Visit reason:** Long paragraph on masking at work vs. snapping at home; fear of seeming dramatic.
- **Mood (week):** Heavy (Likert `4` on your 1–5 scale).
- **PHQ-inspired items:** Mostly “several days” / “more than half” — **item 9 = `0`** (no self-harm endorsement → no urgent banner).
- **GAD-inspired items:** Moderate worry/tension pattern.
- **Stress tags:** `burnout`, `relationship_stress`, `overwhelm`.
- **Sleep / screen:** ~6.25 hrs sleep, ~8.5 hrs screens; stress body `4/5`.
- **Therapy history:** Past therapy.
- **Budget:** ~$80–$120/session band; **insurance:** out-of-network reimbursement; **modality:** open to either.

Exact object: **`DEMO_INTAKE`**.

---

## 3. Sample brain-dump text

First-person, ~900 characters: work mask vs. home irritability, failed “fixes,” Sunday chest tightness, **not in danger**, wants language + first-step framing.

Exact string: **`DEMO_BRAIN_DUMP_TEXT`** (and **`DEMO_BRAIN_DUMP`** with themes `anxiety`, `burnout`, `relationships`, `work`).

---

## 4. Sample AI result objects

### Summary (`AiSummaryResult`)

- **Headline:** “You are carrying a lot with very little room to land”
- **Themes:** high-functioning exhaustion; irritability as signal; sleep deserves care not hacks
- **Readiness:** `worth_exploring`
- **Tags:** `anxiety`, `stress`, `sleep`, `relationships`
- **`usedMock: true`** — honest if APIs are off; still demo-grade copy

→ **`DEMO_SUMMARY`**

### Readiness analysis (`ReadinessAnalysisResponse`)

- **Level:** `consider_support`
- **Concise summary** + **main concerns**, **patterns**, **support areas**, **interventions**, **`therapyPrepSummary`** (first-session voice), **`suggestedTherapistTraits`**, **questions for therapist**, **confidence notes**, **limitations**
- **`crisisFlag: false`**

→ **`DEMO_READINESS`**

---

## 5. Sample therapist matches

Run the **live matcher** on the seeded session (best for narrative). For this story, expect **Amelia Vasquez (mvp-001)**, **Daniel Okoro (mvp-002)**, **Priya Natarajan (mvp-003)**, **Jordan Lee (mvp-004)** to often surface first — anxiety, burnout, sleep, relationships overlap.

Reference order: **`DEMO_MATCH_PROFILE_IDS_ORDERED`** in `demo-flow.ts`.

---

## 6. Suggested click path (≈4–6 minutes)

1. **Landing** — Read hero + one scroll through “How it works” (10–15s).  
2. **Optional:** “Start” → **Intake** — Show **first screen + last screen** only if time; otherwise skip via seed (§8).  
3. If not seeded: **Lifestyle** → **Brain dump** (skim chips + one paragraph).  
4. **Reflection / Summary** — **Hero headline**, scroll “What stood out,” **therapy consideration** card, **interventions**, **questions**, **matches CTA**.  
5. **Matches** — Expand **#1 card** (“Why they are on your list”), mention **ordering explainer**, toggle **sort** once.  
6. **Prep sheet** — **Print / PDF** strip + scroll document (this is your differentiator).  
7. **Closing** — **Next steps** cards → footer **988** line.  
8. **Home** or Q&A.

---

## 7. Screens & order (product journey)

| # | Route | What to show |
|---|--------|----------------|
| 1 | `/` | Landing: trust, tone, CTA |
| 2 | `/intake` | Guided check-in (optional if seeded) |
| 3 | `/lifestyle` | Rhythms (optional if seeded) |
| 4 | `/brain-dump` | Unstructured voice (optional if seeded) |
| 5 | `/summary` | **AI summary + readiness + lifestyle** — main “wow” |
| 6 | `/matches` | **Match quality** + explainer |
| 7 | `/prep-sheet` | **Printable artifact** |
| 8 | `/next-steps` | Gentle closure + resources |
| 9 | `/` | Reset / thanks |

Mirror: `DEMO_SCREEN_ORDER` in code.

---

## 8. Pre-fill for speed (recommended)

**Instant path (reloads to `/summary`):**

- From your app shell (dev), call **`applyDemoSession()`** from `@/lib/clarity/demo-flow` (wire a hidden or `?demo=1` button during the event), **or** in browser console after importing the bundled helper:

```text
// Storage key: `clarity_session_v1` (see `CLARITY_STORAGE_KEY` in `src/lib/clarity/constants.ts`)
sessionStorage.setItem("clarity_session_v1", JSON.stringify(/* getDemoSession() JSON */));
location.assign("/summary");
```

`applyDemoSession()` already stringifies **`getDemoSession()`** and navigates to **`/summary`**.

**What is included in the snapshot**

- Full **`intake`** (wizard-complete), **`lifestyle`**, **`brainDump`**, **`summary`**, **`readinessAnalysis`**, **`nextSteps`**, **`matchPreferences`**, **`prepSheet`**.

**If you run the flow live instead**

- Pre-type **visit reason** + **therapy goals** in a notes app; paste to save 60s.  
- Use **same numbers** as `DEMO_INTAKE` for believable charts.  
- Paste **`DEMO_BRAIN_DUMP_TEXT`** on brain dump.  
- Let real APIs run on **Summary** if keys are on; otherwise mock path still matches **`usedMock: true`** story.

---

## Judge lines (15 seconds each)

- **Clarity:** “We turn scattered stress into something you can *bring* to a clinician — not a diagnosis in a box.”  
- **AI:** “Two layers: a readable summary *and* structured readiness — questions, prep language, humility.”  
- **Matching:** “Deterministic explainer you can tune — transparent, not a black box.”  
- **Prep sheet:** “One calm page for session one — print, PDF, or read in the waiting room.”  
- **Safety:** “988 in the footer; crisis copy when signals warrant — this demo stays in `consider_support` territory.”

---

## Files

| Purpose | Location |
|---------|-----------|
| Persona + payloads + `getDemoSession()` | `src/lib/clarity/demo-flow.ts` |
| Mock directory | `src/data/mock-therapist-profiles.ts` |
| Session key | `src/lib/clarity/constants.ts` → `CLARITY_STORAGE_KEY` |
