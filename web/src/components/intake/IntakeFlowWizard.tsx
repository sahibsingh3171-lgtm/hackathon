"use client";

/*
 * Full intake wizard: renders only “due” steps from `computeDueIntakeStepIndices` (adaptive after brain dump).
 * Judges: writes answers to `session.intake` via `setSession`; advances `intake.intakeFlowStep` cursor.
 */
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { DisclaimerBlock } from "@/components/clarity/DisclaimerBlock";
import { LikertScale } from "@/components/clarity/LikertScale";
import { IntakeScaleFour } from "@/components/intake/IntakeScaleFour";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { useClaritySession } from "@/contexts/clarity-session-context";
import {
  computeDueIntakeStepIndices,
  humanLabelsForInferredSteps,
  nextDueCursorAfterAdvance,
} from "@/lib/clarity/intake-due-steps";
import {
  BUDGET_RANGE_OPTIONS,
  INSURANCE_OPTIONS,
  INTAKE_FLOW_STEPS,
  INTAKE_FLOW_STEP_TOTAL,
  LIFE_STRESS_TAG_OPTIONS,
  MODALITY_OPTIONS,
  THERAPY_HISTORY_OPTIONS,
} from "@/lib/clarity/intake-flow-config";
import {
  buildLifestyleFromIntake,
  buildMatchPreferencesFromIntake,
  isIntakeFlowComplete,
  validateIntakeStep,
} from "@/lib/clarity/intake-flow-validation";
import type { ClaritySession, IntakeAnswers, Likert } from "@/types/clarity";
import { cn } from "@/lib/utils";

function patchIntake(prev: IntakeAnswers, patch: Partial<IntakeAnswers>): IntakeAnswers {
  return { ...prev, ...patch };
}

function clampDueCursor(saved: number | undefined, dueLen: number): number {
  if (dueLen <= 0) return 0;
  const max = dueLen - 1;
  if (typeof saved !== "number" || !Number.isFinite(saved)) return 0;
  return Math.min(Math.max(0, Math.floor(saved)), max);
}

export function IntakeFlowWizard() {
  const router = useRouter();
  const { session, setSession, hydrated } = useClaritySession();
  const [attempted, setAttempted] = useState(false);
  const [panelVisible, setPanelVisible] = useState(true);

  const intake = session.intake;
  const wizardStepIds = session.intakeWizardStepIds;
  const wizardMode = Array.isArray(wizardStepIds) && wizardStepIds.length > 0;
  const due = useMemo(
    () =>
      computeDueIntakeStepIndices(
        intake,
        session.intakePrefilledStepIds,
        session.intakeConfirmedStepIds,
        wizardStepIds
      ),
    [intake, session.intakePrefilledStepIds, session.intakeConfirmedStepIds, wizardStepIds]
  );

  const cursor = clampDueCursor(intake.intakeFlowStep, due.length);
  const stepIdx = due[cursor] ?? 0;
  const step = INTAKE_FLOW_STEPS[stepIdx];
  const progressPct =
    due.length > 0 ? Math.round(((cursor + 1) / due.length) * 100) : 100;
  const validCurrent = step ? validateIntakeStep(stepIdx, intake) : false;
  const prefilledIds = session.intakePrefilledStepIds ?? [];
  const isSuggestedStep = step ? prefilledIds.includes(step.id) : false;
  const listenedFirst = wizardMode || prefilledIds.length > 0;
  const shorterPass = listenedFirst && due.length < INTAKE_FLOW_STEP_TOTAL;

  useEffect(() => {
    if (!hydrated || due.length > 0) return;
    if (isIntakeFlowComplete(intake)) {
      router.replace("/lifestyle");
    }
  }, [due.length, hydrated, intake, router]);

  useEffect(() => {
    if (!hydrated) return;
    const d = computeDueIntakeStepIndices(
      intake,
      session.intakePrefilledStepIds,
      session.intakeConfirmedStepIds,
      session.intakeWizardStepIds
    );
    if (d.length === 0) return;
    const c = clampDueCursor(intake.intakeFlowStep, d.length);
    if (c !== intake.intakeFlowStep) {
      setSession((prev) => ({
        ...prev,
        intake: patchIntake(prev.intake, { intakeFlowStep: c }),
      }));
    }
  }, [
    hydrated,
    intake,
    session.intakeConfirmedStepIds,
    session.intakePrefilledStepIds,
    session.intakeWizardStepIds,
    intake.intakeFlowStep,
    setSession,
  ]);

  const bumpStep = useCallback(
    (nextCursor: number) => {
      setPanelVisible(false);
      window.setTimeout(() => {
        setSession((prev: ClaritySession) => ({
          ...prev,
          intake: patchIntake(prev.intake, { intakeFlowStep: nextCursor }),
        }));
        setAttempted(false);
        setPanelVisible(true);
      }, 280);
    },
    [setSession]
  );

  const updateIntake = useCallback(
    (patch: Partial<IntakeAnswers>) => {
      setSession((prev: ClaritySession) => ({
        ...prev,
        intake: patchIntake(prev.intake, patch),
      }));
    },
    [setSession]
  );

  const onBack = useCallback(() => {
    if (cursor <= 0) {
      router.push("/brain-dump");
      return;
    }
    bumpStep(cursor - 1);
  }, [bumpStep, cursor, router]);

  const onNext = useCallback(() => {
    if (!step || due.length === 0) return;
    if (!validateIntakeStep(stepIdx, intake)) {
      setAttempted(true);
      return;
    }

    setSession((prev: ClaritySession) => {
      const prevIntake = prev.intake;
      const stepMeta = INTAKE_FLOW_STEPS[stepIdx];
      const confirmed = new Set(prev.intakeConfirmedStepIds ?? []);
      if (stepMeta && (prev.intakePrefilledStepIds ?? []).includes(stepMeta.id)) {
        confirmed.add(stepMeta.id);
      }

      const prevWizard = prev.intakeWizardStepIds;
      const useWizard = Array.isArray(prevWizard) && prevWizard.length > 0;

      const dueAfter = computeDueIntakeStepIndices(
        prevIntake,
        prev.intakePrefilledStepIds,
        Array.from(confirmed),
        prevWizard
      );

      if (dueAfter.length === 0) {
        queueMicrotask(() => router.push("/lifestyle"));
        return {
          ...prev,
          intake: patchIntake(prevIntake, { intakeFlowStep: 0 }),
          intakeConfirmedStepIds: Array.from(confirmed),
          lifestyle: buildLifestyleFromIntake(intake),
          matchPreferences: buildMatchPreferencesFromIntake(intake),
        };
      }

      if (useWizard) {
        if (cursor >= dueAfter.length - 1) {
          queueMicrotask(() => router.push("/lifestyle"));
          return {
            ...prev,
            intake: patchIntake(prevIntake, { intakeFlowStep: 0 }),
            intakeConfirmedStepIds: Array.from(confirmed),
            lifestyle: buildLifestyleFromIntake(intake),
            matchPreferences: buildMatchPreferencesFromIntake(intake),
          };
        }
        return {
          ...prev,
          intake: patchIntake(prevIntake, { intakeFlowStep: cursor + 1 }),
          intakeConfirmedStepIds: Array.from(confirmed),
        };
      }

      const nextCursor = nextDueCursorAfterAdvance(dueAfter, stepIdx);
      return {
        ...prev,
        intake: patchIntake(prevIntake, { intakeFlowStep: nextCursor }),
        intakeConfirmedStepIds: Array.from(confirmed),
      };
    });
  }, [cursor, due.length, intake, router, setSession, step, stepIdx]);

  const showError = attempted && !validCurrent;

  if (!hydrated || !step) {
    return (
      <div className="mx-auto flex min-h-[50vh] max-w-xl items-center justify-center px-clarity-section-x">
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    );
  }

  if (due.length === 0) {
    return (
      <div className="mx-auto flex min-h-[40vh] max-w-xl flex-col items-center justify-center gap-3 px-clarity-section-x">
        <p className="text-sm font-medium text-foreground/90">Almost there…</p>
        <p className="max-w-xs text-center text-xs leading-relaxed text-muted-foreground">
          Finishing this step on your device.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col px-4 py-10 sm:px-8 sm:py-12 lg:py-14">
      <div className="mb-8 space-y-4">
        <div className="flex items-center justify-between gap-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          <span>{shorterPass ? "Follow-up" : "Check-in"}</span>
          <span className="tabular-nums">
            {cursor + 1} / {due.length}
          </span>
        </div>
        <Progress value={progressPct} className="h-1.5 bg-muted" />
        <p className="text-xs leading-relaxed text-muted-foreground">
          {listenedFirst ? (
            <>
              You wrote in your own words first. These screens only ask for what is still open — edit
              freely; nothing is locked in. Some items echo familiar self-reflection prompts, not a
              diagnosis or a clinical score.
            </>
          ) : (
            <>
              A calm, one-at-a-time pass through mood, stress, sleep, and practical details. A few
              items echo familiar self-reflection prompts — for your own context, not a diagnosis or a
              clinical score.
            </>
          )}
        </p>
      </div>

      {cursor < 2 ? (
        <div className="mb-8">
          <DisclaimerBlock variant="inline" />
        </div>
      ) : null}

      {listenedFirst && cursor === 0 ? (
        <div
          className="mb-8 space-y-3 rounded-2xl border border-border/70 bg-gradient-to-b from-muted/25 to-muted/10 px-5 py-5 shadow-clarity-soft sm:px-6"
          aria-labelledby="gentle-read-heading"
        >
          <p
            id="gentle-read-heading"
            className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground"
          >
            A gentle read of your note
          </p>
          <p className="text-sm leading-relaxed text-foreground">
            Nothing here is a verdict — we loosely matched a few questionnaire spots so you face less
            empty space. You will walk each one in a moment; change anything that does not feel like
            you.
          </p>
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
            Tentatively touched
          </p>
          <ul className="list-inside list-disc space-y-1.5 text-sm leading-relaxed text-muted-foreground">
            {humanLabelsForInferredSteps(prefilledIds).map((row) => (
              <li key={row.id}>{row.label}</li>
            ))}
          </ul>
          {session.intakeExtractionMeta?.trustLine ? (
            <p className="text-sm leading-relaxed text-foreground/85">{session.intakeExtractionMeta.trustLine}</p>
          ) : null}
        </div>
      ) : null}

      <div
        key={step.id}
        className={cn(
          "space-y-8 transition-[opacity,transform] duration-400 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none",
          panelVisible ? "translate-y-0 opacity-100" : "translate-y-1.5 opacity-0"
        )}
      >
        <header className="space-y-4">
          {isSuggestedStep ? (
            <p className="rounded-2xl border border-border/80 bg-muted/20 px-4 py-3 text-sm leading-relaxed text-foreground">
              <span className="font-medium text-foreground">Light draft.</span> This answer was loosely
              drawn from your opening note — adjust or clear it before you continue. It only sticks
              because you let it.
            </p>
          ) : null}
          {step.field === "phq9_item" && step.itemIndex === 1 ? (
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Mood & energy</p>
          ) : null}
          {step.field === "gad7_item" && step.itemIndex === 1 ? (
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Worry & tension</p>
          ) : null}
          <h1 className="font-heading text-2xl font-semibold leading-snug tracking-tight text-foreground sm:text-3xl">
            {step.title}
          </h1>
          {step.subtitle ? (
            <p className="text-base leading-relaxed text-muted-foreground">{step.subtitle}</p>
          ) : null}
          {step.microcopy ? (
            <p className="text-sm leading-relaxed text-muted-foreground/90">{step.microcopy}</p>
          ) : null}
        </header>

        <div className="rounded-3xl border border-border bg-card p-6 shadow-clarity-soft sm:p-8">
          <Label className="sr-only">{step.title}</Label>
          <StepBody field={step.field} intake={intake} itemIndex={step.itemIndex} showError={showError} updateIntake={updateIntake} />
        </div>
      </div>

      <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-8">
        <Button type="button" variant="ghost" className="text-muted-foreground" onClick={onBack}>
          {cursor === 0 ? (listenedFirst ? "Return to your note" : "Back") : "Back"}
        </Button>
        <Button
          type="button"
          onClick={onNext}
          className="h-auto min-h-11 rounded-2xl bg-primary px-8 py-3 text-sm font-semibold text-primary-foreground shadow-clarity-soft hover:bg-primary/90"
        >
          {cursor === due.length - 1 ? "Continue to rhythms" : "Continue"}
        </Button>
      </div>

      {(due.length > 1 && cursor > 0) || (listenedFirst && cursor === 0) ? (
        <p className="mt-6 text-center text-xs leading-relaxed text-muted-foreground">
          Your answers stay on this device as you go.
        </p>
      ) : null}
    </div>
  );
}

function StepBody({
  field,
  intake,
  itemIndex,
  showError,
  updateIntake,
}: {
  field: (typeof INTAKE_FLOW_STEPS)[number]["field"];
  intake: IntakeAnswers;
  itemIndex?: number;
  showError: boolean;
  updateIntake: (patch: Partial<IntakeAnswers>) => void;
}) {
  switch (field) {
    case "visit_reason":
      return (
        <div className="space-y-4">
          <Textarea
            value={typeof intake.visit_reason === "string" ? intake.visit_reason : ""}
            onChange={(e) => updateIntake({ visit_reason: e.target.value })}
            rows={6}
            placeholder="e.g. I have been running on empty… or I am not sure anything is wrong but something feels off."
            className="min-h-[160px] resize-y rounded-2xl border-border bg-muted/25 px-4 py-4 text-base leading-relaxed text-foreground placeholder:text-muted-foreground/60"
            aria-invalid={showError}
          />
          {showError ? (
            <p className="text-sm text-destructive" role="alert">
              A sentence or two more helps — write what feels true, even if it is incomplete.
            </p>
          ) : null}
        </div>
      );

    case "overall_mood":
      return (
        <LikertScale
          value={intake.overall_mood as Likert | undefined}
          onChange={(v) => updateIntake({ overall_mood: v })}
          lowLabel="Lighter / steadier"
          highLabel="Heavier / harder"
        />
      );

    case "phq9_item": {
      const idx = itemIndex ?? 1;
      const key = `phq9_${idx}` as keyof IntakeAnswers;
      const raw = intake[key as string];
      const value = typeof raw === "number" ? raw : undefined;
      const isLastPhq = idx === 9;
      return (
        <div className="space-y-6">
          <IntakeScaleFour
            value={value}
            onChange={(v) => updateIntake({ [key]: v } as Partial<IntakeAnswers>)}
          />
          {isLastPhq && typeof value === "number" && value >= 1 ? (
            <p
              className="rounded-2xl border px-4 py-3 text-sm leading-relaxed"
              style={{
                backgroundColor: "var(--clarity-urgent-bg)",
                borderColor: "var(--clarity-urgent-line)",
                color: "var(--clarity-urgent-ink)",
              }}
            >
              If you might act on thoughts of hurting yourself, please call or text{" "}
              <a className="font-semibold underline underline-offset-2" href="tel:988">
                988
              </a>{" "}
              in the U.S., or your local emergency number. Clarity cannot provide crisis support.
            </p>
          ) : null}
        </div>
      );
    }

    case "gad7_item": {
      const idx = itemIndex ?? 1;
      const key = `gad7_${idx}` as keyof IntakeAnswers;
      const raw = intake[key as string];
      const value = typeof raw === "number" ? raw : undefined;
      return <IntakeScaleFour value={value} onChange={(v) => updateIntake({ [key]: v } as Partial<IntakeAnswers>)} />;
    }

    case "life_stress_tags": {
      const selected = new Set(Array.isArray(intake.life_stress_tags) ? (intake.life_stress_tags as string[]) : []);
      const toggle = (id: string) => {
        const next = new Set(selected);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        updateIntake({ life_stress_tags: Array.from(next) });
      };
      return (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2.5">
            {LIFE_STRESS_TAG_OPTIONS.map((tag) => {
              const on = selected.has(tag.id);
              return (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => toggle(tag.id)}
                  className={cn(
                    "rounded-full border px-4 py-2.5 text-sm font-medium transition",
                    on
                      ? "border-primary bg-primary text-primary-foreground shadow-clarity-soft"
                      : "border-border bg-card text-foreground hover:border-primary/35"
                  )}
                  aria-pressed={on}
                >
                  {tag.label}
                </button>
              );
            })}
          </div>
          {showError ? (
            <p className="text-sm text-destructive" role="alert">
              Tap whichever tags feel closest — at least one helps us frame the rest gently.
            </p>
          ) : null}
        </div>
      );
    }

    case "sleep_hours_avg": {
      const v = intake.sleep_hours_avg;
      return (
        <div className="space-y-3">
          <Input
            type="number"
            inputMode="decimal"
            min={0}
            max={24}
            step={0.5}
            value={v === undefined || v === null ? "" : v}
            onChange={(e) => {
              const n = e.target.value === "" ? undefined : Number(e.target.value);
              updateIntake({ sleep_hours_avg: n });
            }}
            className="h-14 max-w-[11rem] rounded-2xl border-border bg-muted/25 text-center text-lg font-medium tabular-nums"
            aria-invalid={showError}
          />
          {showError ? (
            <p className="text-sm text-destructive" role="alert">
              Enter a number between 0 and 24 (decimals are fine).
            </p>
          ) : null}
        </div>
      );
    }

    case "screen_hours_avg": {
      const v = intake.screen_hours_avg;
      return (
        <div className="space-y-3">
          <Input
            type="number"
            inputMode="decimal"
            min={0}
            max={24}
            step={0.5}
            value={v === undefined || v === null ? "" : v}
            onChange={(e) => {
              const n = e.target.value === "" ? undefined : Number(e.target.value);
              updateIntake({ screen_hours_avg: n });
            }}
            className="h-14 max-w-[11rem] rounded-2xl border-border bg-muted/25 text-center text-lg font-medium tabular-nums"
            aria-invalid={showError}
          />
          {showError ? (
            <p className="text-sm text-destructive" role="alert">
              Enter a rough daily total between 0 and 24.
            </p>
          ) : null}
        </div>
      );
    }

    case "stress_overall":
      return (
        <LikertScale
          value={intake.stress_overall as Likert | undefined}
          onChange={(v) => updateIntake({ stress_overall: v })}
          lowLabel="Mild / manageable"
          highLabel="Intense / consuming"
        />
      );

    case "therapy_history":
      return (
        <ChoiceGrid
          options={THERAPY_HISTORY_OPTIONS}
          value={typeof intake.therapy_history === "string" ? intake.therapy_history : ""}
          onChange={(id) => updateIntake({ therapy_history: id })}
          showError={showError}
        />
      );

    case "budget_range":
      return (
        <ChoiceGrid
          options={BUDGET_RANGE_OPTIONS}
          value={typeof intake.budget_range === "string" ? intake.budget_range : ""}
          onChange={(id) => updateIntake({ budget_range: id })}
          showError={showError}
        />
      );

    case "insurance":
      return (
        <ChoiceGrid
          options={INSURANCE_OPTIONS}
          value={typeof intake.insurance === "string" ? intake.insurance : ""}
          onChange={(id) => updateIntake({ insurance: id })}
          showError={showError}
        />
      );

    case "modality_preference":
      return (
        <ChoiceGrid
          options={MODALITY_OPTIONS.map((o) => ({ id: o.id, label: o.label }))}
          value={typeof intake.modality_preference === "string" ? intake.modality_preference : ""}
          onChange={(id) => updateIntake({ modality_preference: id })}
          showError={showError}
        />
      );

    case "therapist_preferences":
      return (
        <Textarea
          value={typeof intake.therapist_preferences === "string" ? intake.therapist_preferences : ""}
          onChange={(e) => updateIntake({ therapist_preferences: e.target.value })}
          rows={5}
          placeholder="Optional — e.g. Spanish-speaking, trauma-informed, faith-neutral, queer-affirming…"
          className="min-h-[140px] resize-y rounded-2xl border-border bg-muted/25 px-4 py-4 text-base leading-relaxed text-foreground placeholder:text-muted-foreground/60"
        />
      );

    case "therapy_goals":
      return (
        <div className="space-y-4">
          <Textarea
            value={typeof intake.therapy_goals === "string" ? intake.therapy_goals : ""}
            onChange={(e) => updateIntake({ therapy_goals: e.target.value })}
            rows={6}
            placeholder="e.g. I would like to sleep without dreading the next day, or argue less from a guarded place."
            className="min-h-[160px] resize-y rounded-2xl border-border bg-muted/25 px-4 py-4 text-base leading-relaxed text-foreground placeholder:text-muted-foreground/60"
            aria-invalid={showError}
          />
          {showError ? (
            <p className="text-sm text-destructive" role="alert">
              A little more here helps a future therapist sense what “better” might mean for you.
            </p>
          ) : null}
        </div>
      );

    default:
      return null;
  }
}

function ChoiceGrid({
  options,
  value,
  onChange,
  showError,
}: {
  options: readonly { id: string; label: string }[];
  value: string;
  onChange: (id: string) => void;
  showError: boolean;
}) {
  return (
    <div className="space-y-3">
      <div className="grid gap-3">
        {options.map((opt) => {
          const selected = value === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => onChange(opt.id)}
              className={cn(
                "w-full rounded-2xl border px-4 py-4 text-left text-sm font-medium leading-snug transition sm:text-base",
                selected
                  ? "border-primary bg-accent text-foreground shadow-clarity-soft"
                  : "border-border bg-muted/20 text-foreground hover:border-primary/30 hover:bg-muted/40"
              )}
              aria-pressed={selected}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
      {showError ? (
        <p className="text-sm text-destructive" role="alert">
          Choose one option to continue when you are ready.
        </p>
      ) : null}
    </div>
  );
}
