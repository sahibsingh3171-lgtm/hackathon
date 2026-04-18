"use client";

import Link from "next/link";

import { FLOW_STEPS, stepIndexForPath } from "@/lib/clarity/constants";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

export function StepShell({
  path,
  title,
  subtitle,
  children,
  onBack,
  onNext,
  nextLabel = "Continue",
  nextDisabled,
  showNext = true,
}: {
  path: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  onBack?: () => void;
  onNext?: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
  showNext?: boolean;
}) {
  const idx = stepIndexForPath(path);
  const total = FLOW_STEPS.length;
  const pct = Math.round(((idx + 1) / total) * 100);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-clarity-loose px-clarity-section-x py-clarity-section-y sm:px-8">
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3 text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
          <span>
            Step {idx + 1} of {total}
          </span>
          <span className="tabular-nums text-muted-foreground/80">{pct}%</span>
        </div>
        <Progress value={pct} className="h-1.5 bg-muted" />
        <h1 className="font-heading text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          {title}
        </h1>
        {subtitle ? (
          <p className="max-w-xl text-base leading-relaxed text-muted-foreground">{subtitle}</p>
        ) : null}
      </div>

      <div className="space-y-6">{children}</div>

      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border pt-clarity-loose">
        {onBack ? (
          <Button type="button" variant="ghost" className="text-muted-foreground" onClick={onBack}>
            Back
          </Button>
        ) : (
          <Link
            href="/"
            className="inline-flex h-9 items-center rounded-xl px-3 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            Home
          </Link>
        )}
        {showNext && onNext ? (
          <Button
            type="button"
            disabled={nextDisabled}
            onClick={onNext}
            className="h-auto rounded-xl bg-primary px-8 py-3 text-sm font-semibold text-primary-foreground shadow-clarity-soft hover:bg-primary/90"
          >
            {nextLabel}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
