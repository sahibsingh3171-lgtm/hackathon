"use client";

import type { MatchPreferences, ModalityFilter } from "@/types/clarity";
import { ALL_INSURANCE, ALL_SPECIALTIES } from "@/data/therapists";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export function MatchFilters({
  value,
  onChange,
  className,
}: {
  value: MatchPreferences;
  onChange: (next: MatchPreferences) => void;
  /** Optional wrapper classes (e.g. editorial spacing on the matches page). */
  className?: string;
}) {
  const toggleSpecialty = (s: string) => {
    const set = new Set(value.specialties);
    if (set.has(s)) set.delete(s);
    else set.add(s);
    onChange({ ...value, specialties: [...set] });
  };

  const toggleInsurance = (s: string) => {
    const set = new Set(value.insurance);
    if (set.has(s)) set.delete(s);
    else set.add(s);
    onChange({ ...value, insurance: [...set] });
  };

  return (
    <div
      className={cn(
        "space-y-7 rounded-3xl border border-border/45 bg-card p-8 shadow-sm ring-1 ring-foreground/[0.02] backdrop-blur-sm sm:p-9",
        className
      )}
    >
      <div className="space-y-2">
        <Label className="text-foreground">Max budget per session (USD, sample)</Label>
        <Input
          type="number"
          min={0}
          placeholder="e.g. 150"
          value={value.maxBudgetUsd ?? ""}
          onChange={(e) => {
            const v = e.target.value;
            onChange({
              ...value,
              maxBudgetUsd: v === "" ? undefined : Number(v),
            });
          }}
          className="max-w-xs rounded-xl border-border bg-muted/30"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-foreground">Location preference (optional)</Label>
        <Input
          type="text"
          placeholder="e.g. TX, Seattle, or Remote"
          value={value.locationPreference ?? ""}
          onChange={(e) => {
            const v = e.target.value.trim();
            onChange({
              ...value,
              locationPreference: v === "" ? undefined : v,
            });
          }}
          className="max-w-xs rounded-xl border-border bg-muted/30"
        />
        <p className="text-xs text-muted-foreground">
          Loosely compared to sample profile locations — not GPS or exact matching.
        </p>
      </div>

      <div className="space-y-2">
        <Label className="text-foreground">Modality</Label>
        <select
          className="h-10 w-full max-w-xs rounded-xl border border-border bg-muted/30 px-3 text-sm text-foreground"
          value={value.modality}
          onChange={(e) =>
            onChange({ ...value, modality: e.target.value as ModalityFilter })
          }
        >
          <option value="any">Any</option>
          <option value="telehealth">Telehealth</option>
          <option value="in_person">In person</option>
        </select>
      </div>

      <div className="space-y-2">
        <Label className="text-foreground">Focus areas</Label>
        <div className="flex flex-wrap gap-2">
          {ALL_SPECIALTIES.map((s) => {
            const on = value.specialties.includes(s);
            return (
              <Button
                key={s}
                type="button"
                size="sm"
                variant={on ? "default" : "outline"}
                className={
                  on
                    ? "rounded-full border-0 bg-primary text-primary-foreground shadow-none"
                    : "rounded-full border-border text-muted-foreground"
                }
                onClick={() => toggleSpecialty(s)}
              >
                {s}
              </Button>
            );
          })}
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-foreground">Insurance (sample tags)</Label>
        <div className="flex flex-wrap gap-2">
          {ALL_INSURANCE.map((s) => {
            const on = value.insurance.includes(s);
            return (
              <Button
                key={s}
                type="button"
                size="sm"
                variant={on ? "secondary" : "outline"}
                className={
                  on
                    ? "rounded-full bg-muted text-foreground"
                    : "rounded-full border-border text-muted-foreground"
                }
                onClick={() => toggleInsurance(s)}
              >
                {s}
              </Button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
