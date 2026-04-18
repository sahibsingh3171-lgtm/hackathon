"use client";

import type { IntakeAnswers, LifestyleSnapshot, Likert } from "@/types/clarity";
import { cn } from "@/lib/utils";

type Metric = { id: string; label: string; value: Likert; hint?: string };

function sleepHoursToLikert(hours: number | undefined): Likert | null {
  if (hours == null || Number.isNaN(hours)) return null;
  if (hours < 5) return 2;
  if (hours < 6.5) return 3;
  if (hours < 8) return 4;
  return 5;
}

function screenHoursToLikert(hours: number | undefined): Likert | null {
  if (hours == null || Number.isNaN(hours)) return null;
  if (hours <= 3) return 5;
  if (hours <= 5) return 4;
  if (hours <= 7) return 3;
  if (hours <= 9) return 2;
  return 1;
}

function collectMetrics(
  lifestyle: LifestyleSnapshot | null,
  intake: IntakeAnswers
): Metric[] {
  const out: Metric[] = [];

  const mood = lifestyle?.mood ?? intake.overall_mood;
  if (typeof mood === "number" && mood >= 1 && mood <= 5) {
    out.push({
      id: "mood",
      label: "Mood lately",
      value: mood as Likert,
      hint: lifestyle ? "From your rhythms step" : "From check-in",
    });
  }

  const stress = lifestyle?.stressLevel ?? intake.stress_overall;
  if (typeof stress === "number" && stress >= 1 && stress <= 5) {
    out.push({
      id: "stress",
      label: "Stress felt",
      value: stress as Likert,
      hint: lifestyle ? "From your rhythms step" : "From check-in",
    });
  }

  if (lifestyle) {
    out.push({
      id: "sleepQ",
      label: "Sleep quality",
      value: lifestyle.sleepQuality,
      hint: "Your own read, not a diagnosis",
    });
  } else {
    const sh = sleepHoursToLikert(intake.sleep_hours_avg);
    if (sh) {
      out.push({
        id: "sleepH",
        label: "Sleep (rough hours)",
        value: sh,
        hint: "Rough sense from hours you entered",
      });
    }
  }

  const screenH = lifestyle?.screenTime?.hoursApprox ?? intake.screen_hours_avg;
  const screenL = screenHoursToLikert(typeof screenH === "number" ? screenH : undefined);
  if (screenL && (lifestyle?.screenTime?.hoursApprox != null || intake.screen_hours_avg != null)) {
    out.push({
      id: "screen",
      label: "Screen time load",
      value: screenL,
      hint: "Higher bar here means lighter screen load on this scale",
    });
  }

  return out;
}

export function hasLifestyleTrendData(
  lifestyle: LifestyleSnapshot | null,
  intake: IntakeAnswers
): boolean {
  return collectMetrics(lifestyle, intake).length > 0;
}

/** Sage-step bars — no harsh colors. */
const STEP_FILLED = [
  "bg-[var(--chart-5)]",
  "bg-[var(--chart-4)]",
  "bg-[var(--chart-3)]",
  "bg-[var(--chart-2)]",
  "bg-[var(--chart-1)]",
] as const;

function LikertMicroBarFixed({ value, max = 5 }: { value: Likert; max?: number }) {
  return (
    <div className="flex h-2 w-full gap-1" role="img" aria-label={`${value} out of ${max}`}>
      {Array.from({ length: max }, (_, i) => {
        const filled = i < value;
        const stepClass = STEP_FILLED[Math.min(4, Math.max(0, Math.round((i / (max - 1)) * 4)))];
        return (
          <span
            key={i}
            className={cn("h-full flex-1 rounded-full", filled ? stepClass : "bg-muted")}
          />
        );
      })}
    </div>
  );
}

export function ResultsLifestyleTrendPanel({
  lifestyle,
  intake,
}: {
  lifestyle: LifestyleSnapshot | null;
  intake: IntakeAnswers;
}) {
  const metrics = collectMetrics(lifestyle, intake);
  if (metrics.length === 0) return null;

  return (
    <aside
      className="rounded-3xl border border-border/45 bg-card p-7 shadow-sm ring-1 ring-foreground/[0.02] backdrop-blur-sm sm:p-8"
      aria-labelledby="results-trend-heading"
    >
      <p id="results-trend-heading" className="clarity-kicker">
        Lately, in brief
      </p>
      <p className="mt-2 font-heading text-lg font-semibold tracking-tight text-foreground">
        A soft snapshot
      </p>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        Not a scorecard — a small mirror of what you told us. Scales are subjective (1–5).
      </p>
      <ul className="mt-8 space-y-6">
        {metrics.map((m) => (
          <li key={m.id}>
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-sm font-medium text-foreground">{m.label}</span>
              <span className="tabular-nums text-xs text-muted-foreground">{m.value}/5</span>
            </div>
            <div className="mt-2">
              <LikertMicroBarFixed value={m.value} />
            </div>
            {m.hint ? <p className="mt-1.5 text-xs text-muted-foreground/90">{m.hint}</p> : null}
          </li>
        ))}
      </ul>
    </aside>
  );
}
