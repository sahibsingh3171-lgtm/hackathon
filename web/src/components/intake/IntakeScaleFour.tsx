"use client";

import { SCALE4_LABELS } from "@/lib/clarity/intake-flow-config";
import { cn } from "@/lib/utils";

export function IntakeScaleFour({
  value,
  onChange,
  disabled,
}: {
  value: number | undefined;
  onChange: (v: 0 | 1 | 2 | 3) => void;
  disabled?: boolean;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2" role="group" aria-label="Frequency">
      {SCALE4_LABELS.map((opt) => {
        const selected = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            disabled={disabled}
            onClick={() => onChange(opt.value as 0 | 1 | 2 | 3)}
            className={cn(
              "flex min-h-[4.25rem] flex-col items-start justify-center rounded-2xl border px-4 py-3.5 text-left transition",
              selected
                ? "border-primary bg-accent text-foreground shadow-clarity-soft"
                : "border-border bg-card text-foreground hover:border-primary/30 hover:bg-muted/40",
              disabled && "pointer-events-none opacity-50"
            )}
            aria-pressed={selected}
          >
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              {opt.short}
            </span>
            <span className="mt-1 text-sm font-medium leading-snug">{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}
