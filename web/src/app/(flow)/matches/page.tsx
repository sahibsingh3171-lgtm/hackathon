"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { MatchFilters } from "@/components/clarity/MatchFilters";
import { MatchTherapistCard } from "@/components/clarity/MatchTherapistCard";
import { StepShell } from "@/components/clarity/StepShell";
import { useClaritySession } from "@/contexts/clarity-session-context";
import { MOCK_THERAPIST_PROFILES } from "@/data/mock-therapist-profiles";
import {
  buildTherapistMatchInput,
  rankTherapistMatches,
  sortRankedTherapistMatches,
  type TherapistMatchSortMode,
} from "@/lib/therapist";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { MatchPreferences } from "@/types/clarity";

const defaultPrefs: MatchPreferences = {
  specialties: [],
  modality: "any",
  insurance: [],
};

const INITIAL_VISIBLE = 8;

export default function MatchesPage() {
  const router = useRouter();
  const { session, setSession } = useClaritySession();
  const [prefs, setPrefs] = useState<MatchPreferences>(
    () => session.matchPreferences ?? defaultPrefs
  );
  const [sortMode, setSortMode] = useState<TherapistMatchSortMode>("recommended");
  const [showAll, setShowAll] = useState(false);

  const ranked = useMemo(() => {
    const input = buildTherapistMatchInput(
      {
        intake: session.intake,
        summary: session.summary,
        readinessAnalysis: session.readinessAnalysis,
      },
      prefs
    );
    return rankTherapistMatches(input, MOCK_THERAPIST_PROFILES);
  }, [prefs, session.intake, session.summary, session.readinessAnalysis]);

  const sorted = useMemo(() => sortRankedTherapistMatches(ranked, sortMode), [ranked, sortMode]);

  const visible = showAll ? sorted : sorted.slice(0, INITIAL_VISIBLE);
  const hiddenCount = Math.max(0, sorted.length - visible.length);

  return (
    <StepShell
      path="/matches"
      title="Sample matches"
      subtitle="A short list ordered from what you shared — demo data only, not a real directory or a promise of the right fit."
      onBack={() => router.push("/summary")}
      onNext={() => router.push("/prep-sheet")}
      nextLabel="Prep sheet"
      showNext
      maxWidthClass="max-w-4xl"
      calmProgress
    >
      <div className="space-y-12 sm:space-y-14">
        <section
          className="rounded-3xl border border-border/45 bg-card px-7 py-8 shadow-sm ring-1 ring-foreground/[0.02] sm:px-9 sm:py-9"
          aria-labelledby="how-match-heading"
        >
          <h2
            id="how-match-heading"
            className="font-heading text-lg font-semibold tracking-tight text-foreground sm:text-xl"
          >
            How we ordered this list
          </h2>
          <ol className="mt-5 list-decimal space-y-3.5 pl-5 text-sm leading-relaxed text-muted-foreground marker:text-primary/70">
            <li>
              <span className="text-foreground">Themes and language</span> — we look for overlap
              between what you shared (including suggested focus areas) and each profile&apos;s
              specialties and story.
            </li>
            <li>
              <span className="text-foreground">How and where you meet</span> — telehealth or
              in-person preference, plus optional location text, gently nudge the order.
            </li>
            <li>
              <span className="text-foreground">Cost and coverage</span> — budget and insurance tags
              matter, but they do not remove people from the list except when modality truly
              cannot work.
            </li>
            <li>
              <span className="text-foreground">Sample ratings</span> — mock reviews help break
              ties after the above.
            </li>
          </ol>
          <p className="mt-5 text-xs leading-relaxed text-muted-foreground">
            For a technical view of weights, see{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.7rem]">
              THERAPIST_MATCH_SCORING
            </code>{" "}
            in the codebase.
          </p>
        </section>

        <MatchFilters
          value={prefs}
          onChange={(next) => {
            setPrefs(next);
            setSession({ matchPreferences: next });
          }}
        />

        <div className="flex flex-col gap-5 border-t border-border/45 pt-8 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <Label htmlFor="match-sort" className="text-foreground">
              Sort list by
            </Label>
            <select
              id="match-sort"
              className="h-11 w-full max-w-xs rounded-xl border border-border bg-muted/30 px-3 text-sm text-foreground shadow-sm"
              value={sortMode}
              onChange={(e) => setSortMode(e.target.value as TherapistMatchSortMode)}
            >
              <option value="recommended">Suggested order</option>
              <option value="fee_asc">Lower typical fee first</option>
              <option value="rating_desc">Higher sample rating</option>
              <option value="reviews_desc">More sample reviews</option>
            </select>
          </div>
          <p className="text-sm text-muted-foreground">
            {sorted.length} profile{sorted.length === 1 ? "" : "s"} with current filters
            {sortMode !== "recommended" ? " · order changed for browsing" : ""}
          </p>
        </div>

        {sorted.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border/60 bg-muted/15 px-8 py-16 text-center">
            <p className="font-heading text-lg text-foreground">No one left with these filters</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Try widening modality, budget, or insurance — the sample list is intentionally small.
            </p>
          </div>
        ) : (
          <ul className="space-y-8 sm:space-y-10">
            {visible.map((match) => (
              <li key={match.profile.id}>
                <MatchTherapistCard match={match} />
              </li>
            ))}
          </ul>
        )}

        {hiddenCount > 0 ? (
          <div className="flex flex-col items-center gap-3 border-t border-border/60 pt-8 text-center">
            <p className="max-w-md text-sm text-muted-foreground">
              Showing the first {INITIAL_VISIBLE} to keep the page light. {hiddenCount} more are
              available when you expand.
            </p>
            <Button
              type="button"
              variant="outline"
              className="rounded-2xl border-border px-6"
              onClick={() => setShowAll(true)}
            >
              Show all {sorted.length} profiles
            </Button>
          </div>
        ) : sorted.length > INITIAL_VISIBLE ? (
          <div className="flex justify-center border-t border-border/60 pt-8">
            <Button
              type="button"
              variant="ghost"
              className="text-muted-foreground"
              onClick={() => setShowAll(false)}
            >
              Show fewer
            </Button>
          </div>
        ) : null}

        <footer
          className="rounded-3xl border border-primary/15 bg-accent/25 px-7 py-7 text-sm leading-relaxed text-muted-foreground ring-1 ring-primary/5 sm:px-9 sm:py-8"
          role="note"
        >
          <p className="font-medium text-foreground">Please read</p>
          <p className="mt-2">
            These are{" "}
            <span className="font-semibold text-foreground">starting points, not endorsements</span>
            . Clarity does not check licenses, openings, or fit. Talk with real clinicians, ask
            questions, and confirm fees and insurance yourself. Profiles and booking links here are
            fictional.
          </p>
        </footer>
      </div>
    </StepShell>
  );
}
