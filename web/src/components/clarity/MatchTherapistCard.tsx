"use client";

import {
  Building2,
  ExternalLink,
  Languages,
  MapPin,
  Quote,
  Sparkles,
  Star,
  Video,
} from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import type { MatchReason, MatchReasonTone, RankedTherapistMatch } from "@/lib/therapist";
import { cn } from "@/lib/utils";

const REASON_TONE: Record<MatchReasonTone, { base: string; text: string }> = {
  specialty: {
    base: "border-primary/30 bg-primary/10",
    text: "text-primary",
  },
  fit: {
    base: "border-[oklch(0.78_0.07_28)]/35 bg-[oklch(0.96_0.02_48)]",
    text: "text-[oklch(0.42_0.08_34)]",
  },
  modality: {
    base: "border-border/70 bg-muted/35",
    text: "text-foreground/85",
  },
  finance: {
    base: "border-[oklch(0.88_0.05_155)]/55 bg-[oklch(0.97_0.02_158)]",
    text: "text-[oklch(0.38_0.08_158)]",
  },
  reviews: {
    base: "border-border/70 bg-background/80",
    text: "text-muted-foreground",
  },
};

function ReasonChip({ reason }: { reason: MatchReason }) {
  const tone = REASON_TONE[reason.tone];
  return (
    <span
      title={reason.detail}
      className={cn(
        "inline-flex max-w-full items-center gap-1.5 truncate rounded-full border px-2.5 py-1 text-[0.75rem] font-medium leading-none",
        tone.base,
        tone.text
      )}
    >
      {reason.label}
    </span>
  );
}

function FitDial({ score }: { score: number }) {
  /* Simple SVG dial — premium scoreboard without shouting. */
  const size = 56;
  const stroke = 4;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.min(100, Math.max(0, score));
  const offset = c - (pct / 100) * c;
  return (
    <div className="relative flex size-14 items-center justify-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="currentColor"
          strokeOpacity={0.12}
          strokeWidth={stroke}
          className="text-foreground"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          className="text-primary"
        />
      </svg>
      <span className="absolute inset-0 flex flex-col items-center justify-center leading-none">
        <span className="font-heading text-[0.875rem] font-semibold text-foreground">{score}</span>
        <span className="text-[0.55rem] font-medium uppercase tracking-[0.16em] text-muted-foreground">
          fit
        </span>
      </span>
    </div>
  );
}

function locationFilterMatchesProfile(locationQuery: string, profileLocation: string): boolean {
  const q = locationQuery.trim().toLowerCase();
  if (!q) return false;
  const loc = profileLocation.toLowerCase();
  if (loc.includes(q)) return true;
  return q.split(/[\s,]+/).some((token) => token.length >= 2 && loc.includes(token));
}

export function MatchTherapistCard({
  match,
  emphasis = "default",
  /** When set, show sample “reviewer voice” lines tied to area exploration (demo). */
  locationFilterText,
}: {
  match: RankedTherapistMatch;
  /** `featured` is used for top-of-list cards — more visual weight. */
  emphasis?: "default" | "featured";
  locationFilterText?: string;
}) {
  const { profile, therapist, matchScore, reasons, highlight } = match;

  const offer: string[] = [];
  if (profile.telehealth) offer.push("Telehealth");
  if (profile.inPerson) offer.push("In person");
  if (!offer.length) offer.push("Format unclear");

  const featured = emphasis === "featured";
  const locationCtx = (locationFilterText ?? "").trim();
  const showReviewerLocationContext = locationCtx.length > 0 && (profile.reviewerVoices?.length ?? 0) > 0;
  const locationMatches = showReviewerLocationContext
    ? locationFilterMatchesProfile(locationCtx, profile.location)
    : false;

  return (
    <article
      className={cn(
        "group relative overflow-hidden rounded-[1.75rem] border bg-card transition-[box-shadow,transform,border-color] duration-300 motion-reduce:transform-none",
        "shadow-[0_1px_2px_rgb(15_23_42_/0.035)] hover:shadow-[0_1px_2px_rgb(15_23_42_/0.04),0_22px_56px_rgb(15_23_42_/0.05)] motion-safe:hover:-translate-y-[1px]",
        featured
          ? "border-primary/25 bg-gradient-to-br from-card via-card to-primary/[0.035] ring-1 ring-primary/10"
          : "border-border/55"
      )}
    >
      {/* Curated highlight strip */}
      {highlight ? (
        <div
          className={cn(
            "flex items-center gap-2 border-b px-7 py-3 text-[0.6875rem] font-semibold uppercase tracking-[0.2em]",
            featured
              ? "border-primary/20 bg-primary/[0.07] text-primary"
              : "border-border/50 bg-muted/25 text-muted-foreground"
          )}
        >
          <Sparkles className="size-3.5 opacity-80" aria-hidden strokeWidth={1.75} />
          <span>{highlight.label}</span>
          <span className="ml-auto hidden truncate text-[0.6875rem] font-medium normal-case tracking-normal text-muted-foreground sm:block">
            {highlight.blurb}
          </span>
        </div>
      ) : null}

      <div
        className={cn(
          "grid gap-7 p-7 sm:gap-9 sm:p-9",
          "md:grid-cols-[minmax(0,6rem)_1fr] md:items-start lg:gap-11"
        )}
      >
        {/* Avatar + rating column */}
        <div className="flex items-start gap-5 md:block">
          <div className="relative size-[5.25rem] shrink-0 overflow-hidden rounded-2xl border border-border/65 bg-muted/30 shadow-[0_1px_2px_rgb(15_23_42_/0.04),inset_0_1px_0_rgb(255_255_255_/0.7)] md:size-[6rem]">
            {/* eslint-disable-next-line @next/next/no-img-element -- demo SVG host; avoids remotePatterns config */}
            <img
              src={profile.profileImage}
              alt=""
              width={120}
              height={120}
              className="h-full w-full object-cover object-center"
              loading="lazy"
            />
          </div>

          {/* Mobile: rating inline; md+: fit dial below avatar */}
          <div className="flex flex-col gap-1.5 md:mt-4 md:items-start">
            <FitDial score={matchScore} />
            <p className="flex items-center gap-1 text-[0.75rem] text-muted-foreground md:mt-2">
              <Star className="size-3 fill-primary/80 text-primary/80" aria-hidden />
              <span className="font-semibold text-foreground">{profile.rating.toFixed(2)}</span>
              <span>({profile.reviewCount})</span>
            </p>
            <p className="hidden text-[0.625rem] leading-snug text-muted-foreground/85 md:block">
              Sample image · not a real photo
            </p>
          </div>
        </div>

        {/* Main content column */}
        <div className="min-w-0 space-y-6">
          <header className="space-y-1.5">
            <h3
              className={cn(
                "font-heading font-semibold tracking-[-0.02em] text-foreground",
                featured ? "text-[1.55rem] sm:text-[1.7rem]" : "text-[1.35rem] sm:text-[1.5rem]"
              )}
            >
              {profile.name}
              <span className="ml-2 text-sm font-medium text-muted-foreground">
                · {profile.credentials}
              </span>
            </h3>
            <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.8125rem] text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="size-3.5 text-primary/70" aria-hidden strokeWidth={1.75} />
                {profile.location}
              </span>
              {profile.languages && profile.languages.length > 1 ? (
                <span className="inline-flex items-center gap-1.5">
                  <Languages className="size-3.5 text-primary/70" aria-hidden strokeWidth={1.75} />
                  {profile.languages.join(", ")}
                </span>
              ) : null}
              <span className="inline-flex items-center gap-1.5">
                {profile.telehealth && profile.inPerson ? (
                  <>
                    <Video className="size-3.5 text-primary/70" aria-hidden strokeWidth={1.75} />
                    <span>Telehealth · in-person</span>
                  </>
                ) : profile.telehealth ? (
                  <>
                    <Video className="size-3.5 text-primary/70" aria-hidden strokeWidth={1.75} />
                    Telehealth only
                  </>
                ) : (
                  <>
                    <Building2 className="size-3.5 text-primary/70" aria-hidden strokeWidth={1.75} />
                    In person only
                  </>
                )}
              </span>
            </p>
          </header>

          {/* Why this matches — reason chips */}
          {reasons.length ? (
            <section aria-label="Why this matches you" className="space-y-2.5">
              <p className="text-[0.625rem] font-semibold uppercase tracking-[0.22em] text-muted-foreground/90">
                Why this matches you
              </p>
              <div className="flex flex-wrap gap-2">
                {reasons.map((r, i) => (
                  <ReasonChip key={`${r.tone}-${i}`} reason={r} />
                ))}
              </div>
            </section>
          ) : null}

          {/* Bio / ideal-for */}
          <p className="text-[0.9375rem] leading-relaxed text-foreground/85">
            <span className="text-foreground">Best for: </span>
            {profile.idealFor}
          </p>

          {/* Facts grid */}
          <div className="grid gap-x-8 gap-y-4 border-t border-border/50 pt-5 text-sm sm:grid-cols-2">
            <div>
              <p className="text-[0.625rem] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                Typical session (sample)
              </p>
              <p className="mt-1.5 font-heading text-[1.0625rem] font-semibold text-foreground">
                ${profile.priceRange.min}
                <span className="text-sm font-normal text-muted-foreground">–</span>$
                {profile.priceRange.max}
                {profile.slidingScale ? (
                  <span className="ml-2 rounded-full border border-border/70 bg-muted/35 px-2 py-0.5 align-middle text-[0.625rem] font-medium text-muted-foreground">
                    sliding scale
                  </span>
                ) : null}
              </p>
            </div>
            <div>
              <p className="text-[0.625rem] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                Insurance & payment
              </p>
              <p className="mt-1.5 text-[0.8125rem] leading-relaxed text-muted-foreground">
                {profile.insuranceAccepted.slice(0, 4).join(" · ")}
                {profile.insuranceAccepted.length > 4
                  ? ` · +${profile.insuranceAccepted.length - 4} more`
                  : ""}
              </p>
            </div>
          </div>

          {showReviewerLocationContext ? (
            <section
              aria-label="Sample reviewer descriptions"
              className="rounded-2xl border border-primary/20 bg-primary/[0.04] px-5 py-4"
            >
              <div className="flex items-start gap-2.5">
                <Quote className="mt-0.5 size-4 shrink-0 text-primary/75" strokeWidth={1.75} aria-hidden />
                <div className="min-w-0 space-y-2">
                  <p className="text-[0.625rem] font-semibold uppercase tracking-[0.2em] text-primary/90">
                    How reviewers describe them
                  </p>
                  <p className="text-[0.75rem] leading-relaxed text-muted-foreground">
                    For your area text{" "}
                    <span className="font-medium text-foreground/90">“{locationCtx}”</span>
                    {locationMatches
                      ? " — this profile’s listed location lines up with that filter."
                      : " — sample lines below are for texture only; always confirm geography and fit yourself."}
                  </p>
                  <ul className="list-none space-y-2.5 pt-1">
                    {(profile.reviewerVoices ?? []).map((line, i) => (
                      <li
                        key={i}
                        className="border-l-2 border-primary/25 pl-3 text-[0.875rem] leading-relaxed text-foreground/88"
                      >
                        {line}
                      </li>
                    ))}
                  </ul>
                  <p className="text-[0.625rem] leading-snug text-muted-foreground/90">
                    Synthetic demo snippets — not from real patients or verified reviews.
                  </p>
                </div>
              </div>
            </section>
          ) : null}

          {/* Review quote */}
          <figure className="rounded-2xl border border-border/50 bg-muted/20 px-5 py-4">
            <blockquote className="text-[0.875rem] leading-relaxed text-foreground/85">
              <span className="mr-0.5 font-heading text-primary/55">“</span>
              {profile.reviewSummary}
              <span className="ml-0.5 font-heading text-primary/55">”</span>
            </blockquote>
          </figure>

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <a
              href={profile.bookingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                buttonVariants(),
                "inline-flex h-11 items-center gap-2 rounded-full bg-primary px-5 text-[0.8125rem] font-semibold text-primary-foreground shadow-[0_1px_2px_rgb(15_23_42_/0.06),0_10px_28px_rgb(111_143_120_/0.18)] transition hover:bg-primary/92"
              )}
            >
              Open sample profile
              <ExternalLink className="size-3.5 opacity-90" aria-hidden />
            </a>
            <p className="text-[0.75rem] text-muted-foreground">
              Demo link only — always verify fit with any real clinician.
            </p>
          </div>

          {/* Legacy explanation as quiet footnote */}
          <p className="border-t border-border/45 pt-4 text-[0.75rem] leading-relaxed text-muted-foreground/85">
            {therapist.matchExplanation}
          </p>
        </div>
      </div>
    </article>
  );
}
