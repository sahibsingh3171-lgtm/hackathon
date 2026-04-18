"use client";

import type { Likert } from "@/types/clarity";
import { cn } from "@/lib/utils";

const POINTS: Likert[] = [1, 2, 3, 4, 5];

export function LikertScale({
  value,
  onChange,
  lowLabel,
  highLabel,
  disabled,
}: {
  value: Likert | undefined;
  onChange: (v: Likert) => void;
  lowLabel?: string;
  highLabel?: string;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-5 gap-2.5">
        {POINTS.map((n) => {
          const selected = value === n;
          return (
            <button
              key={n}
              type="button"
              disabled={disabled}
              onClick={() => onChange(n)}
              className={cn(
                "flex h-12 items-center justify-center rounded-2xl border text-sm font-semibold transition",
                selected
                  ? "border-primary bg-primary text-primary-foreground shadow-clarity-soft"
                  : "border-border bg-card text-muted-foreground hover:border-primary/35 hover:bg-accent/50 hover:text-foreground",
                disabled && "pointer-events-none opacity-50"
              )}
              aria-pressed={selected}
            >
              {n}
            </button>
          );
        })}
      </div>
      <div className="flex justify-between gap-4 text-xs text-muted-foreground">
        <span className="max-w-[44%] text-left leading-snug">{lowLabel ?? "Less"}</span>
        <span className="max-w-[44%] text-right leading-snug">{highLabel ?? "More"}</span>
      </div>
    </div>
  );
}
