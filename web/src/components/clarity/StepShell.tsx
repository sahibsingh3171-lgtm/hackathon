"use client";

import Link from "next/link";

import { FLOW_STEPS, stepIndexForPath } from "@/lib/clarity/constants";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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
  /** Wider column for calmer, text-heavy steps (e.g. brain dump). */
  maxWidthClass = "max-w-2xl",
  /** Softer progress treatment when true. */
  calmProgress = false,
  /** e.g. while saving or calling an API — dims primary actions slightly. */
  busy = false,
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
  maxWidthClass?: string;
  calmProgress?: boolean;
  busy?: boolean;
}) {
  const idx = stepIndexForPath(path);
  const total = FLOW_STEPS.length;
  const pct = Math.round(((idx + 1) / total) * 100);
  const stepMeta = FLOW_STEPS[idx];
  const stepLabel = stepMeta?.label ?? "Step";

  return (
    <div
      className={cn(
        "mx-auto flex w-full flex-col px-4 py-10 transition-opacity duration-300 sm:px-8 sm:py-12 lg:py-14",
        maxWidthClass,
        busy && "opacity-[0.78]"
      )}
      aria-busy={busy || undefined}
    >
      <header className={cn("space-y-5", calmProgress && "space-y-6")}>
        <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
          <p className="clarity-kicker text-foreground/70">{stepLabel}</p>
          <p
            className="text-xs tabular-nums text-muted-foreground/80"
            aria-label={`Step ${idx + 1} of ${total}`}
          >
            <span className="font-medium text-foreground/80">{idx + 1}</span>
            <span className="mx-1.5 text-border">/</span>
            {total}
          </p>
        </div>
        <div
          className="relative h-1 w-full overflow-hidden rounded-full bg-muted/80"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={pct}
          aria-label={`Journey progress, ${pct} percent`}
        >
          <div
            className={cn(
              "h-full rounded-full bg-primary transition-[width] duration-500 ease-out",
              calmProgress ? "opacity-80" : null
            )}
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="space-y-3 pt-1">
          <h1 className="max-w-[22rem] font-heading text-3xl font-semibold leading-[1.12] tracking-tight text-foreground sm:max-w-2xl sm:text-[2.125rem] sm:leading-[1.14]">
            {title}
          </h1>
          {subtitle ? (
            <p className="max-w-2xl text-pretty text-[0.9375rem] leading-[1.65] text-muted-foreground sm:text-base sm:leading-[1.65]">
              {subtitle}
            </p>
          ) : null}
        </div>
      </header>

      <div className={cn("mt-10", calmProgress ? "mt-12 space-y-10" : "space-y-8")}>{children}</div>

      <footer className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-border/50 pt-8 sm:mt-14 sm:pt-10">
        {onBack ? (
          <Button
            type="button"
            variant="ghost"
            className="-ml-2 rounded-xl px-3 text-muted-foreground hover:text-foreground"
            onClick={onBack}
          >
            Back
          </Button>
        ) : (
          <Link
            href="/"
            className="inline-flex h-10 items-center rounded-xl px-3 text-sm font-medium text-muted-foreground transition hover:bg-muted/60 hover:text-foreground"
          >
            Home
          </Link>
        )}
        {showNext && onNext ? (
          <Button
            type="button"
            disabled={nextDisabled}
            onClick={onNext}
            className="h-auto min-h-11 rounded-2xl bg-primary px-8 py-3.5 text-sm font-semibold text-primary-foreground shadow-clarity-soft transition hover:bg-primary/90 disabled:opacity-50"
          >
            {nextLabel}
          </Button>
        ) : null}
      </footer>
    </div>
  );
}
