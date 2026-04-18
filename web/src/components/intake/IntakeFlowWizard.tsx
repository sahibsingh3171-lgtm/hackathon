"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

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
  validateIntakeStep,
} from "@/lib/clarity/intake-flow-validation";
import type { ClaritySession, IntakeAnswers, Likert } from "@/types/clarity";
import { cn } from "@/lib/utils";

function patchIntake(prev: IntakeAnswers, patch: Partial<IntakeAnswers>): IntakeAnswers {
  return { ...prev, ...patch };
}

function clampIntakeStep(saved: number | undefined): number {
  const max = INTAKE_FLOW_STEP_TOTAL - 1;
  if (typeof saved !== "number" || !Number.isFinite(saved)) return 0;
  return Math.min(Math.max(0, Math.floor(saved)), max);
}

export function IntakeFlowWizard() {
  const router = useRouter();
  const { session, setSession, hydrated } = useClaritySession();
  const [attempted, setAttempted] = useState(false);
  const [panelVisible, setPanelVisible] = useState(true);

  const intake = session.intake;
  const stepIdx = clampIntakeStep(intake.intakeFlowStep);
  const step = INTAKE_FLOW_STEPS[stepIdx];
  const progressPct = Math.round(((stepIdx + 1) / INTAKE_FLOW_STEP_TOTAL) * 100);
  const isLast = stepIdx >= INTAKE_FLOW_STEP_TOTAL - 1;
  const validCurrent = step ? validateIntakeStep(stepIdx, intake) : false;

  const bumpStep = useCallback((next: number) => {
    setPanelVisible(false);
    window.setTimeout(() => {
      setSession((prev: ClaritySession) => ({
        ...prev,
        intake: patchIntake(prev.intake, { intakeFlowStep: next }),
      }));
      setAttempted(false);
      setPanelVisible(true);
    }, 220);
  }, [setSession]);

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
    if (stepIdx <= 0) {
      router.push("/");
      return;
    }
    bumpStep(stepIdx - 1);
  }, [bumpStep, router, stepIdx]);

  const onNext = useCallback(() => {
    if (!step) return;
    if (!validateIntakeStep(stepIdx, intake)) {
      setAttempted(true);
      return;
    }
    if (isLast) {
      setSession((prev: ClaritySession) => {
        const merged = prev.intake;
        return {
          ...prev,
          intake: patchIntake(merged, { intakeFlowStep: INTAKE_FLOW_STEP_TOTAL - 1 }),
          lifestyle: buildLifestyleFromIntake(merged),
          matchPreferences: buildMatchPreferencesFromIntake(merged),
        };
      });
      router.push("/lifestyle");
      return;
    }
    bumpStep(stepIdx + 1);
  }, [bumpStep, intake, isLast, router, setSession, step, stepIdx]);

  const showError = attempted && !validCurrent;

  if (!hydrated || !step) {
    return (
      <div className="mx-auto flex min-h-[50vh] max-w-xl items-center justify-center px-clarity-section-x">
        <p className="text-sm text-muted-foreground">Loading your session…</p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col px-clarity-section-x py-clarity-section-y sm:px-8 lg:py-12">
      <div className="mb-8 space-y-4">
        <div className="flex items-center justify-between gap-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          <span>Check-in</span>
          <span className="tabular-nums">
            {stepIdx + 1} / {INTAKE_FLOW_STEP_TOTAL}
          </span>
        </div>
        <Progress value={progressPct} className="h-1.5 bg-muted" />
        <p className="text-xs leading-relaxed text-muted-foreground">
          This flow borrows themes from common screening tools — Clarity does not diagnose or score you
          clinically.
        </p>
      </div>

      {stepIdx < 3 ? (
        <div className="mb-8">
          <DisclaimerBlock variant="inline" />
        </div>
      ) : null}

      <div
        key={step.id}
        className={cn(
          "space-y-8 transition-[opacity,transform] duration-300 ease-out motion-reduce:transition-none",
          panelVisible ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0"
        )}
      >
        <header className="space-y-4">
          {step.field === "phq9_item" && step.itemIndex === 1 ? (
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Reflection set A</p>
          ) : null}
          {step.field === "gad7_item" && step.itemIndex === 1 ? (
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Reflection set B</p>
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
          {stepIdx === 0 ? "Exit to home" : "Back"}
        </Button>
        <Button
          type="button"
          onClick={onNext}
          className="h-auto min-h-11 rounded-2xl bg-primary px-8 py-3 text-sm font-semibold text-primary-foreground shadow-clarity-soft hover:bg-primary/90"
        >
          {isLast ? "Continue to daily rhythms" : "Continue"}
        </Button>
      </div>

      {!isLast && stepIdx > 2 ? (
        <p className="mt-6 text-center text-xs text-muted-foreground">
          Your answers save as you go on this device.
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
              A few more words help — aim for at least one short sentence you mean.
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
              (U.S.) or your local emergency number. Clarity is not a crisis service.
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
              Choose at least one that fits — or the one that fits most.
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
              A sentence or two more helps your future therapist understand what “better” could mean.
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
          Please choose one option to continue.
        </p>
      ) : null}
    </div>
  );
}
