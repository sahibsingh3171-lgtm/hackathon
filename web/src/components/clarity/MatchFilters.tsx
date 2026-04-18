"use client";

import type { MatchPreferences, ModalityFilter } from "@/types/clarity";
import { ALL_INSURANCE, ALL_SPECIALTIES } from "@/data/therapists";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function MatchFilters({
  value,
  onChange,
}: {
  value: MatchPreferences;
  onChange: (next: MatchPreferences) => void;
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
    <div className="space-y-6 rounded-3xl border border-border bg-card p-6 shadow-clarity-soft">
      <div className="space-y-2">
        <Label className="text-foreground">Max budget (USD / session, mock)</Label>
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
        <Label className="text-foreground">Focus areas (tap to toggle)</Label>
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
        <Label className="text-foreground">Insurance tags (mock)</Label>
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
