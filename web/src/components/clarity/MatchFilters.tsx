"use client";

import { useCallback, useMemo, useState } from "react";
import { Building2, Loader2, MapPin, RotateCcw, Settings2, Sparkles, Video, X } from "lucide-react";

import {
  ALL_APPROACHES,
  ALL_IDENTITY_FOCUS,
  ALL_LANGUAGES,
  ALL_STYLE_TAGS,
} from "@/data/mock-therapist-profiles";
import { ALL_INSURANCE, ALL_SPECIALTIES } from "@/data/therapists";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { resolveTherapistAreaLabelFromBrowser } from "@/lib/clarity/therapist-area-from-browser";
import type { MatchPreferences, ModalityFilter } from "@/types/clarity";
import { cn } from "@/lib/utils";

const BUDGET_CAPS: readonly { label: string; value: number | undefined }[] = [
  { label: "Any", value: undefined },
  { label: "Under $80", value: 80 },
  { label: "$120", value: 120 },
  { label: "$160", value: 160 },
  { label: "$200", value: 200 },
  { label: "$250+", value: 250 },
];

const MODALITY_OPTIONS: readonly {
  id: ModalityFilter;
  label: string;
  icon: typeof Video;
}[] = [
  { id: "any", label: "Any", icon: Sparkles },
  { id: "telehealth", label: "Telehealth", icon: Video },
  { id: "in_person", label: "In person", icon: Building2 },
];

function defaultPrefs(): MatchPreferences {
  return {
    specialties: [],
    modality: "any",
    insurance: [],
  };
}

function countActive(p: MatchPreferences): number {
  let n = 0;
  if (p.specialties.length) n += 1;
  if (p.modality && p.modality !== "any") n += 1;
  if (p.insurance.length) n += 1;
  if (p.maxBudgetUsd != null) n += 1;
  if (p.locationPreference) n += 1;
  if (p.identityFocus?.length) n += 1;
  if (p.styleTags?.length) n += 1;
  if (p.approaches?.length) n += 1;
  if (p.languages?.length) n += 1;
  if (p.prioritizeAffordability) n += 1;
  return n;
}

type ChipProps = {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
  size?: "sm" | "md";
  icon?: React.ReactNode;
};

function Chip({ active, children, onClick, size = "sm", icon }: ChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border text-xs font-medium leading-none transition-[background-color,border-color,box-shadow,color] duration-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
        size === "sm" ? "h-8 px-3.5" : "h-9 px-4 text-[0.8125rem]",
        active
          ? "border-primary/40 bg-primary/10 text-primary shadow-[inset_0_0_0_1px_rgb(111_143_120_/0.08)]"
          : "border-border/70 bg-background/70 text-muted-foreground hover:border-border hover:bg-muted/40 hover:text-foreground"
      )}
    >
      {icon}
      {children}
    </button>
  );
}

type FilterSectionProps = {
  title: string;
  microcopy?: string;
  children: React.ReactNode;
  priority?: "primary" | "secondary";
};

function ActiveChip({
  onRemove,
  children,
}: {
  onRemove: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onRemove}
      className="group inline-flex items-center gap-1.5 rounded-full border border-primary/35 bg-primary/10 px-3 py-1 text-[0.75rem] font-medium text-primary transition hover:border-primary/55 hover:bg-primary/14"
    >
      <span>{children}</span>
      <X className="size-3 opacity-70 group-hover:opacity-100" aria-hidden />
    </button>
  );
}

function FilterSection({ title, microcopy, children, priority = "primary" }: FilterSectionProps) {
  return (
    <section className="space-y-3.5">
      <div className="flex items-baseline justify-between gap-2">
        <h3
          className={cn(
            "font-heading text-sm font-semibold tracking-[-0.01em] text-foreground",
            priority === "secondary" && "text-foreground/85"
          )}
        >
          {title}
        </h3>
        {microcopy ? (
          <p className="text-[0.6875rem] text-muted-foreground/80">{microcopy}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

export function MatchFilters({
  value,
  onChange,
  resultCount,
  className,
}: {
  value: MatchPreferences;
  onChange: (next: MatchPreferences) => void;
  /** Optional — rendered in the summary bar when provided. */
  resultCount?: number;
  className?: string;
}) {
  const [moreOpen, setMoreOpen] = useState(false);
  const [geoBusy, setGeoBusy] = useState(false);
  const [geoHint, setGeoHint] = useState<string | null>(null);

  const activeCount = useMemo(() => countActive(value), [value]);

  const handleApproximateArea = useCallback(async () => {
    setGeoHint(null);
    setGeoBusy(true);
    try {
      const result = await resolveTherapistAreaLabelFromBrowser();
      if (result.ok) {
        onChange({ ...value, locationPreference: result.display });
        setGeoHint(`Filled “${result.display}” — adjust the text anytime if it is not quite right.`);
      } else {
        setGeoHint(result.error);
      }
    } finally {
      setGeoBusy(false);
    }
  }, [onChange, value]);

  const toggleList = (
    key: "specialties" | "insurance" | "identityFocus" | "styleTags" | "approaches" | "languages",
    item: string
  ) => {
    const current = (value[key] as string[] | undefined) ?? [];
    const set = new Set(current);
    if (set.has(item)) set.delete(item);
    else set.add(item);
    onChange({ ...value, [key]: [...set] });
  };

  const handleReset = () => onChange(defaultPrefs());

  return (
    <section
      aria-labelledby="filters-heading"
      className={cn(
        "relative overflow-hidden rounded-[1.75rem] border border-border/55 bg-card/95 shadow-[0_1px_2px_rgb(15_23_42_/0.035),0_18px_50px_rgb(15_23_42_/0.04)] backdrop-blur-sm",
        className
      )}
    >
      {/* Header row */}
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-border/45 px-6 py-4 sm:px-8">
        <div className="flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-xl border border-border/60 bg-muted/30 text-primary">
            <Settings2 className="size-4" strokeWidth={1.75} aria-hidden />
          </span>
          <div>
            <h2
              id="filters-heading"
              className="font-heading text-[0.95rem] font-semibold tracking-[-0.01em] text-foreground"
            >
              Refine your matches
            </h2>
            <p className="text-[0.75rem] leading-snug text-muted-foreground">
              None of these hide people — they shape the order.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {typeof resultCount === "number" ? (
            <p className="hidden text-xs text-muted-foreground sm:block">
              <span className="font-semibold text-foreground">{resultCount}</span>{" "}
              {resultCount === 1 ? "profile" : "profiles"}
            </p>
          ) : null}
          <button
            type="button"
            onClick={handleReset}
            disabled={activeCount === 0}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-medium transition",
              activeCount === 0
                ? "cursor-not-allowed border-border/40 text-muted-foreground/60"
                : "border-border/70 text-foreground/85 hover:border-border hover:bg-muted/40"
            )}
          >
            <RotateCcw className="size-3.5" aria-hidden />
            Reset{activeCount ? ` (${activeCount})` : ""}
          </button>
        </div>
      </header>

      {/* Active-filter chip row */}
      {activeCount > 0 ? (
        <div className="flex flex-wrap gap-2 border-b border-border/40 bg-muted/[0.15] px-6 py-3 sm:px-8">
          {value.specialties.map((s) => (
            <ActiveChip
              key={`sp-${s}`}
              onRemove={() => toggleList("specialties", s)}
            >
              {s}
            </ActiveChip>
          ))}
          {value.modality !== "any" ? (
            <ActiveChip onRemove={() => onChange({ ...value, modality: "any" })}>
              {value.modality === "telehealth" ? "Telehealth" : "In person"}
            </ActiveChip>
          ) : null}
          {value.maxBudgetUsd != null ? (
            <ActiveChip onRemove={() => onChange({ ...value, maxBudgetUsd: undefined })}>
              Budget ≤ ${value.maxBudgetUsd}
            </ActiveChip>
          ) : null}
          {value.prioritizeAffordability ? (
            <ActiveChip onRemove={() => onChange({ ...value, prioritizeAffordability: false })}>
              Prioritize affordability
            </ActiveChip>
          ) : null}
          {value.locationPreference ? (
            <ActiveChip onRemove={() => onChange({ ...value, locationPreference: undefined })}>
              Near “{value.locationPreference}”
            </ActiveChip>
          ) : null}
          {value.insurance.map((i) => (
            <ActiveChip key={`in-${i}`} onRemove={() => toggleList("insurance", i)}>
              {i}
            </ActiveChip>
          ))}
          {(value.identityFocus ?? []).map((i) => (
            <ActiveChip key={`id-${i}`} onRemove={() => toggleList("identityFocus", i)}>
              {i}
            </ActiveChip>
          ))}
          {(value.styleTags ?? []).map((s) => (
            <ActiveChip key={`st-${s}`} onRemove={() => toggleList("styleTags", s)}>
              {s}
            </ActiveChip>
          ))}
          {(value.approaches ?? []).map((a) => (
            <ActiveChip key={`ap-${a}`} onRemove={() => toggleList("approaches", a)}>
              {a}
            </ActiveChip>
          ))}
          {(value.languages ?? []).map((l) => (
            <ActiveChip key={`lg-${l}`} onRemove={() => toggleList("languages", l)}>
              {l}
            </ActiveChip>
          ))}
        </div>
      ) : null}

      {/* Primary filters */}
      <div className="space-y-8 px-6 py-7 sm:px-8 sm:py-8">
        {/* Row 1 — what matters most: focus areas */}
        <FilterSection
          title="What you want help with"
          microcopy={`${value.specialties.length || "none"} picked`}
        >
          <div className="flex flex-wrap gap-2">
            {ALL_SPECIALTIES.map((s) => (
              <Chip
                key={s}
                active={value.specialties.includes(s)}
                onClick={() => toggleList("specialties", s)}
              >
                {s}
              </Chip>
            ))}
          </div>
        </FilterSection>

        <div className="grid gap-7 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-10">
          {/* Row 2 left — modality */}
          <FilterSection title="How you want to meet">
            <div className="flex flex-wrap gap-2">
              {MODALITY_OPTIONS.map(({ id, label, icon: Icon }) => (
                <Chip
                  key={id}
                  size="md"
                  active={value.modality === id}
                  onClick={() => onChange({ ...value, modality: id })}
                  icon={<Icon className="size-3.5 opacity-80" aria-hidden />}
                >
                  {label}
                </Chip>
              ))}
            </div>
          </FilterSection>

          {/* Row 2 right — budget */}
          <FilterSection
            title="Typical session budget"
            microcopy={value.maxBudgetUsd ? `≤ $${value.maxBudgetUsd}` : "no cap"}
          >
            <div className="flex flex-wrap gap-2">
              {BUDGET_CAPS.map((opt) => (
                <Chip
                  key={opt.label}
                  active={value.maxBudgetUsd === opt.value}
                  onClick={() => onChange({ ...value, maxBudgetUsd: opt.value })}
                >
                  {opt.label}
                </Chip>
              ))}
            </div>
            <label className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
              <input
                type="checkbox"
                className="size-3.5 rounded border-border text-primary focus:ring-primary/40"
                checked={!!value.prioritizeAffordability}
                onChange={(e) =>
                  onChange({ ...value, prioritizeAffordability: e.target.checked })
                }
              />
              Prioritize affordability in the order
            </label>
          </FilterSection>
        </div>

        <FilterSection
          title="Area or region"
          microcopy={value.locationPreference ? `“${value.locationPreference}”` : "optional"}
        >
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:gap-8">
            <div className="min-w-0 flex-1 space-y-2">
              <Label htmlFor="location-pref" className="text-[0.6875rem] font-medium text-muted-foreground">
                City, state, neighborhood, or remote
              </Label>
              <Input
                id="location-pref"
                type="text"
                placeholder="e.g. Austin, Seattle, Bay Area, Remote"
                value={value.locationPreference ?? ""}
                onChange={(e) => {
                  const v = e.target.value.trim();
                  onChange({ ...value, locationPreference: v === "" ? undefined : v });
                }}
                className="h-11 rounded-2xl border-border/60 bg-background/60 px-4 text-sm"
              />
              <p className="text-[0.6875rem] leading-relaxed text-muted-foreground/90">
                We softly match this text to each demo profile&apos;s listed location. When something is
                here, cards show sample lines for how reviewers describe the therapist — helpful context,
                not real quotes.
              </p>
            </div>
            <div className="flex shrink-0 flex-col gap-2 lg:w-[min(100%,13.5rem)]">
              <Button
                type="button"
                variant="outline"
                disabled={geoBusy}
                onClick={() => void handleApproximateArea()}
                className="h-11 shrink-0 rounded-2xl border-border/70 px-4 text-sm font-medium shadow-none hover:bg-muted/40"
              >
                {geoBusy ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
                    Locating…
                  </>
                ) : (
                  <>
                    <MapPin className="mr-2 size-4 text-primary/85" aria-hidden />
                    Approximate my area
                  </>
                )}
              </Button>
              <p className="text-[0.625rem] leading-snug text-muted-foreground">
                One-time browser location, then a city/region guess you can edit. Skips quietly if you
                decline permission.
              </p>
            </div>
          </div>
          {geoHint ? (
            <p className="mt-3 text-[0.8125rem] leading-relaxed text-muted-foreground" role="status">
              {geoHint}
            </p>
          ) : null}
        </FilterSection>
      </div>

      {/* Disclosure: more filters */}
      <div className="border-t border-border/40 bg-muted/[0.1]">
        <button
          type="button"
          onClick={() => setMoreOpen((v) => !v)}
          aria-expanded={moreOpen}
          className="flex w-full items-center justify-between gap-3 px-6 py-4 text-left text-sm font-medium text-foreground/85 transition hover:bg-muted/20 sm:px-8"
        >
          <span className="inline-flex items-center gap-2">
            <span className="inline-flex size-5 items-center justify-center rounded-md border border-border/60 bg-card text-[0.625rem] font-semibold text-primary">
              +
            </span>
            More filters
            <span className="ml-1 text-xs font-normal text-muted-foreground">
              identity · style · approach · insurance · language
            </span>
          </span>
          <span className="text-xs text-muted-foreground">{moreOpen ? "Hide" : "Show"}</span>
        </button>

        {moreOpen ? (
          <div className="space-y-8 px-6 pb-8 pt-2 sm:px-8">
            <FilterSection
              title="Identity & cultural lens"
              microcopy="Optional — soft signal only"
              priority="secondary"
            >
              <div className="flex flex-wrap gap-2">
                {ALL_IDENTITY_FOCUS.map((tag) => (
                  <Chip
                    key={tag}
                    active={(value.identityFocus ?? []).includes(tag)}
                    onClick={() => toggleList("identityFocus", tag)}
                  >
                    {tag}
                  </Chip>
                ))}
              </div>
            </FilterSection>

            <div className="grid gap-7 md:grid-cols-2 lg:gap-10">
              <FilterSection title="Session style" priority="secondary">
                <div className="flex flex-wrap gap-2">
                  {ALL_STYLE_TAGS.map((tag) => (
                    <Chip
                      key={tag}
                      active={(value.styleTags ?? []).includes(tag)}
                      onClick={() => toggleList("styleTags", tag)}
                    >
                      {tag}
                    </Chip>
                  ))}
                </div>
              </FilterSection>

              <FilterSection title="Approach you are curious about" priority="secondary">
                <div className="flex flex-wrap gap-2">
                  {ALL_APPROACHES.map((tag) => (
                    <Chip
                      key={tag}
                      active={(value.approaches ?? []).includes(tag)}
                      onClick={() => toggleList("approaches", tag)}
                    >
                      {tag}
                    </Chip>
                  ))}
                </div>
              </FilterSection>
            </div>

            <FilterSection title="Language" priority="secondary">
              <div className="flex flex-wrap gap-2">
                {ALL_LANGUAGES.map((lang) => (
                  <Chip
                    key={lang}
                    active={(value.languages ?? []).includes(lang)}
                    onClick={() => toggleList("languages", lang)}
                  >
                    {lang}
                  </Chip>
                ))}
              </div>
            </FilterSection>

            <FilterSection
              title="Insurance (sample tags)"
              microcopy="Non-match only nudges order"
              priority="secondary"
            >
              <div className="flex flex-wrap gap-2">
                {ALL_INSURANCE.map((tag) => (
                  <Chip
                    key={tag}
                    active={value.insurance.includes(tag)}
                    onClick={() => toggleList("insurance", tag)}
                  >
                    {tag}
                  </Chip>
                ))}
              </div>
            </FilterSection>
          </div>
        ) : null}
      </div>
    </section>
  );
}
