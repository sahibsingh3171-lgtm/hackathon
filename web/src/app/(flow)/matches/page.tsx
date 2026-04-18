"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { SlidersHorizontal, Sparkles } from "lucide-react";

import { MatchFilters } from "@/components/clarity/MatchFilters";
import { MatchTherapistCard } from "@/components/clarity/MatchTherapistCard";
import { StepShell } from "@/components/clarity/StepShell";
import { useClaritySession } from "@/contexts/clarity-session-context";
import { MOCK_THERAPIST_PROFILES } from "@/data/mock-therapist-profiles";
import {
  buildTherapistMatchInput,
  highlightCuratedMatches,
  rankTherapistMatches,
  sortRankedTherapistMatches,
  type TherapistMatchSortMode,
} from "@/lib/therapist";
import { Button } from "@/components/ui/button";
import type { MatchPreferences } from "@/types/clarity";

const defaultPrefs: MatchPreferences = {
  specialties: [],
  modality: "any",
  insurance: [],
};

const FEATURED_COUNT = 3;
const INITIAL_MORE_VISIBLE = 5;

export default function MatchesPage() {
  const router = useRouter();
  const { session, setSession } = useClaritySession();
  const [prefs, setPrefs] = useState<MatchPreferences>(
    () => session.matchPreferences ?? defaultPrefs
  );
  const [sortMode, setSortMode] = useState<TherapistMatchSortMode>("recommended");
  const [showAllMore, setShowAllMore] = useState(false);

  const { input, ranked } = useMemo(() => {
    const inp = buildTherapistMatchInput(
      {
        intake: session.intake,
        summary: session.summary,
        readinessAnalysis: session.readinessAnalysis,
      },
      prefs
    );
    const r = rankTherapistMatches(inp, MOCK_THERAPIST_PROFILES);
    highlightCuratedMatches(r, inp);
    return { input: inp, ranked: r };
  }, [prefs, session.intake, session.summary, session.readinessAnalysis]);

  const sorted = useMemo(
    () => sortRankedTherapistMatches(ranked, sortMode),
    [ranked, sortMode]
  );

  // Top picks: when sort is recommended, use first N from ranked (still carrying highlights).
  const showTopPicks = sortMode === "recommended" && sorted.length > FEATURED_COUNT;
  const topPicks = showTopPicks ? sorted.slice(0, FEATURED_COUNT) : [];
  const rest = showTopPicks ? sorted.slice(FEATURED_COUNT) : sorted;

  const visibleRest = showAllMore ? rest : rest.slice(0, INITIAL_MORE_VISIBLE);
  const hiddenMore = Math.max(0, rest.length - visibleRest.length);

  // Summary strip derived from inputs — gives users a sense the app heard them.
  const summaryChips: string[] = [];
  if (input.specialtyConcerns[0]) summaryChips.push(`Around ${input.specialtyConcerns[0]}`);
  if (input.modality !== "any") {
    summaryChips.push(input.modality === "telehealth" ? "Telehealth" : "In person");
  }
  if (input.maxBudgetUsd) summaryChips.push(`≤ $${input.maxBudgetUsd}`);
  if (input.identityFocus[0]) summaryChips.push(input.identityFocus[0]);
  if (input.styleTags[0]) summaryChips.push(`${input.styleTags[0]} style`);
  if (input.locationPreference) summaryChips.push(`Near ${input.locationPreference}`);

  return (
    <StepShell
      path="/matches"
      title="Your shortlist"
      subtitle="Sample matches ordered from what you shared — not a real directory or a promise of fit."
      onBack={() => router.push("/summary")}
      onNext={() => router.push("/practice-session")}
      nextLabel="Practice session"
      showNext
      maxWidthClass="max-w-5xl"
      calmProgress
    >
      <div className="space-y-12 sm:space-y-14">
        {/* Signal strip — shows the app heard the user */}
        <section
          aria-label="Matching signals"
          className="rounded-[1.5rem] border border-border/50 bg-gradient-to-br from-card via-card to-muted/25 px-7 py-6 shadow-[0_1px_2px_rgb(15_23_42_/0.035)] sm:px-9 sm:py-7"
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-[0.625rem] font-semibold uppercase tracking-[0.22em] text-muted-foreground/90">
                Matching signals
              </p>
              <p className="mt-1.5 text-[0.9375rem] leading-snug text-foreground">
                {summaryChips.length
                  ? `We are ranking around ${summaryChips.length} signal${summaryChips.length === 1 ? "" : "s"} from your check-in.`
                  : "We are using a wide view from your check-in — try a filter to narrow it."}
              </p>
            </div>
            <p className="text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">{sorted.length}</span>{" "}
              {sorted.length === 1 ? "profile" : "profiles"} · demo data
            </p>
          </div>
          {summaryChips.length ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {summaryChips.map((chip) => (
                <span
                  key={chip}
                  className="inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/8 px-3 py-1 text-[0.75rem] font-medium text-primary"
                >
                  <Sparkles className="size-3 opacity-70" aria-hidden />
                  {chip}
                </span>
              ))}
            </div>
          ) : null}
        </section>

        {/* Filters */}
        <MatchFilters
          value={prefs}
          onChange={(next) => {
            setPrefs(next);
            setSession({ matchPreferences: next });
          }}
          resultCount={sorted.length}
        />

        {!prefs.locationPreference?.trim() ? (
          <p className="text-[0.75rem] leading-relaxed text-muted-foreground">
            <span className="font-medium text-foreground/85">Location tip:</span> add a city or region, or use
            {" "}
            “Approximate my area” in filters, to unlock sample lines on each card for how reviewers
            describe the therapist (demo data only).
          </p>
        ) : null}

        {/* Sort + count row */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border/45 pt-7">
          <div className="flex items-center gap-3">
            <SlidersHorizontal className="size-4 text-muted-foreground" aria-hidden />
            <label
              htmlFor="match-sort"
              className="text-[0.8125rem] font-medium text-foreground/85"
            >
              Order by
            </label>
            <select
              id="match-sort"
              className="h-10 rounded-full border border-border/60 bg-background px-4 pr-8 text-[0.8125rem] font-medium text-foreground shadow-[0_1px_2px_rgb(15_23_42_/0.03)] transition focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/20"
              value={sortMode}
              onChange={(e) => setSortMode(e.target.value as TherapistMatchSortMode)}
            >
              <option value="recommended">Best fit for you</option>
              <option value="fee_asc">Lower fee first</option>
              <option value="rating_desc">Higher rating</option>
              <option value="reviews_desc">More reviews</option>
            </select>
          </div>
          {sortMode !== "recommended" ? (
            <p className="text-xs text-muted-foreground">
              Order changed for browsing — curated picks hidden.
            </p>
          ) : null}
        </div>

        {sorted.length === 0 ? (
          <div className="rounded-[1.75rem] border border-dashed border-border/60 bg-muted/[0.12] px-8 py-20 text-center">
            <p className="font-heading text-xl font-semibold tracking-[-0.01em] text-foreground">
              No profiles left with these filters
            </p>
            <p className="mt-3 mx-auto max-w-md text-[0.9375rem] leading-relaxed text-muted-foreground">
              Try widening modality, raising the budget cap, or removing an identity / style chip —
              the sample list is intentionally small.
            </p>
            <Button
              type="button"
              variant="outline"
              className="mt-7 rounded-full border-border/70 px-5"
              onClick={() => {
                setPrefs(defaultPrefs);
                setSession({ matchPreferences: defaultPrefs });
              }}
            >
              Reset filters
            </Button>
          </div>
        ) : (
          <div className="space-y-14 sm:space-y-16">
            {/* Top picks */}
            {topPicks.length ? (
              <section aria-labelledby="top-picks-heading" className="space-y-6 sm:space-y-8">
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <p className="text-[0.625rem] font-semibold uppercase tracking-[0.22em] text-muted-foreground/90">
                      Curated
                    </p>
                    <h2
                      id="top-picks-heading"
                      className="mt-2 font-heading text-[1.5rem] font-semibold tracking-[-0.02em] text-foreground sm:text-[1.75rem]"
                    >
                      Top picks for you
                    </h2>
                    <p className="mt-2 max-w-xl text-[0.9375rem] leading-relaxed text-muted-foreground">
                      The strongest alignment across themes, style, modality, and practical fit —
                      each with a reason it rose.
                    </p>
                  </div>
                </div>
                <ul className="space-y-8">
                  {topPicks.map((match, idx) => (
                    <li key={match.profile.id}>
                      <MatchTherapistCard
                        match={match}
                        emphasis={idx === 0 ? "featured" : "default"}
                        locationFilterText={prefs.locationPreference}
                      />
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {/* More options */}
            {rest.length ? (
              <section aria-labelledby="more-heading" className="space-y-6 sm:space-y-8">
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <p className="text-[0.625rem] font-semibold uppercase tracking-[0.22em] text-muted-foreground/90">
                      {showTopPicks ? "Also worth a look" : "Results"}
                    </p>
                    <h2
                      id="more-heading"
                      className="mt-2 font-heading text-[1.25rem] font-semibold tracking-[-0.02em] text-foreground sm:text-[1.375rem]"
                    >
                      {showTopPicks ? "More options" : "Matches"}
                    </h2>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Showing {visibleRest.length} of {rest.length}
                  </p>
                </div>
                <ul className="space-y-6 sm:space-y-7">
                  {visibleRest.map((match) => (
                    <li key={match.profile.id}>
                      <MatchTherapistCard
                        match={match}
                        locationFilterText={prefs.locationPreference}
                      />
                    </li>
                  ))}
                </ul>

                {hiddenMore > 0 ? (
                  <div className="flex justify-center pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="rounded-full border-border/70 px-6"
                      onClick={() => setShowAllMore(true)}
                    >
                      Show {hiddenMore} more
                    </Button>
                  </div>
                ) : rest.length > INITIAL_MORE_VISIBLE ? (
                  <div className="flex justify-center pt-2">
                    <Button
                      type="button"
                      variant="ghost"
                      className="rounded-full text-muted-foreground"
                      onClick={() => setShowAllMore(false)}
                    >
                      Show fewer
                    </Button>
                  </div>
                ) : null}
              </section>
            ) : null}
          </div>
        )}

        {/* How we ordered — collapsed, quieter */}
        <details className="group rounded-[1.5rem] border border-border/45 bg-card/80 px-7 py-5 shadow-[0_1px_2px_rgb(15_23_42_/0.03)] sm:px-9">
          <summary className="flex cursor-pointer items-center justify-between gap-3 text-[0.875rem] font-medium text-foreground/85 transition hover:text-foreground [&::-webkit-details-marker]:hidden">
            <span>How we ordered this list</span>
            <span className="text-xs text-muted-foreground transition group-open:rotate-180">⌄</span>
          </summary>
          <ol className="mt-5 list-decimal space-y-3 pl-5 text-[0.875rem] leading-relaxed text-muted-foreground marker:text-primary/70">
            <li>
              <span className="text-foreground">Themes & language</span> — overlap between what you
              shared (including AI traits and focus tags) and each profile&apos;s specialties.
            </li>
            <li>
              <span className="text-foreground">Identity, style, approach</span> — cultural lens,
              session feel (warm vs direct), and named methods like CBT, EMDR, IFS.
            </li>
            <li>
              <span className="text-foreground">How & where you meet</span> — telehealth / in-person
              preference and optional location text.
            </li>
            <li>
              <span className="text-foreground">Cost & coverage</span> — budget, insurance, and
              sliding-scale signals nudge order (never hide).
            </li>
            <li>
              <span className="text-foreground">Review quality</span> — sample rating and review
              volume break ties after everything above.
            </li>
          </ol>
          <p className="mt-4 text-[0.75rem] leading-relaxed text-muted-foreground">
            Tuning lives in{" "}
            <code className="rounded bg-muted/60 px-1.5 py-0.5 font-mono text-[0.7rem]">
              THERAPIST_MATCH_SCORING
            </code>{" "}
            (hackathon MVP — no ML, deterministic).
          </p>
        </details>

        <footer
          className="rounded-[1.5rem] border border-primary/15 bg-accent/25 px-7 py-6 text-[0.875rem] leading-relaxed text-muted-foreground ring-1 ring-primary/5 sm:px-9"
          role="note"
        >
          <p className="font-semibold text-foreground">Please read</p>
          <p className="mt-2">
            These are{" "}
            <span className="font-semibold text-foreground">starting points, not endorsements</span>
            . Clarity does not verify licenses, openings, or fit. Ask questions and confirm fees and
            insurance yourself. Profiles and booking links here are fictional.
          </p>
        </footer>
      </div>
    </StepShell>
  );
}
