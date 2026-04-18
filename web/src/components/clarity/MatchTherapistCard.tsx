"use client";

import { ExternalLink, MapPin, Sparkles, Video, Building2 } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { RankedTherapistMatch } from "@/lib/therapist";
import { cn } from "@/lib/utils";

function formatOffer(p: RankedTherapistMatch["profile"]): string[] {
  const out: string[] = [];
  if (p.telehealth) out.push("Telehealth");
  if (p.inPerson) out.push("In person");
  return out.length ? out : ["Format unclear"];
}

function insuranceSummary(p: RankedTherapistMatch["profile"]): string {
  const tags = p.insuranceAccepted;
  if (!tags.length) return "Insurance not listed in sample";
  const shown = tags.slice(0, 5);
  const extra = tags.length - shown.length;
  return extra > 0 ? `${shown.join(" · ")} · +${extra} more` : shown.join(" · ");
}

export function MatchTherapistCard({ match }: { match: RankedTherapistMatch }) {
  const { profile, therapist, matchScore, matchExplanation } = match;
  const offer = formatOffer(profile);

  return (
    <article
      className={cn(
        "group relative overflow-hidden rounded-3xl border border-border/45 bg-card",
        "shadow-sm ring-1 ring-foreground/[0.02] transition-[box-shadow,transform] duration-300",
        "hover:shadow-md hover:ring-border/30 motion-reduce:transform-none",
        "motion-safe:hover:-translate-y-px"
      )}
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent opacity-0 transition-opacity group-hover:opacity-100"
        aria-hidden
      />
      <div className="grid gap-8 p-8 sm:gap-10 sm:p-11 md:grid-cols-[minmax(0,6.75rem)_1fr] md:items-start">
        <div className="mx-auto w-full max-w-[7.5rem] md:mx-0">
          <div className="relative aspect-square overflow-hidden rounded-2xl border border-border/70 bg-muted/40 shadow-clarity-soft">
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
          <p className="mt-3 text-center text-[0.65rem] leading-snug text-muted-foreground md:text-left">
            Sample image — not a real photo.
          </p>
        </div>

        <div className="min-w-0 space-y-6">
          <header className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold tracking-wide text-primary">
                <Sparkles className="size-3.5 opacity-80" aria-hidden />
                Fit {matchScore}
              </span>
            </div>
            <div>
              <h2 className="font-heading text-2xl font-semibold tracking-tight text-foreground sm:text-[1.65rem]">
                {profile.name}
              </h2>
              <p className="mt-1 text-sm font-medium text-muted-foreground">{profile.credentials}</p>
            </div>
          </header>

          <p className="flex flex-wrap items-start gap-2 text-sm text-muted-foreground">
            <MapPin className="mt-0.5 size-4 shrink-0 text-primary/70" aria-hidden />
            <span>{profile.location}</span>
          </p>

          <div className="flex flex-wrap gap-2">
            {offer.map((label) => (
              <span
                key={label}
                className="inline-flex items-center gap-1.5 rounded-full border border-border/80 bg-muted/25 px-3 py-1.5 text-xs font-medium text-foreground"
              >
                {label === "Telehealth" ? (
                  <Video className="size-3.5 text-primary/80" aria-hidden />
                ) : (
                  <Building2 className="size-3.5 text-primary/80" aria-hidden />
                )}
                {label}
              </span>
            ))}
          </div>

          <div>
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Focus areas
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {profile.specialties.map((s) => (
                <Badge
                  key={s}
                  variant="secondary"
                  className="rounded-full border-0 bg-accent/60 px-3 py-1 text-xs font-normal text-foreground"
                >
                  {s}
                </Badge>
              ))}
            </div>
          </div>

          <div className="grid gap-6 border-t border-border/60 pt-6 sm:grid-cols-2">
            <div>
              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Typical session range
              </p>
              <p className="mt-2 font-heading text-lg font-semibold text-foreground">
                ${profile.priceRange.min}–${profile.priceRange.max}
                <span className="text-sm font-normal text-muted-foreground"> · sample USD</span>
              </p>
            </div>
            <div>
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Insurance & payment (sample)
            </p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{insuranceSummary(profile)}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-t border-border/60 pt-6">
            <span className="font-heading text-xl font-semibold text-foreground">
              {therapist.reviewScore.toFixed(2)}
            </span>
            <span className="text-sm text-muted-foreground">
              {therapist.reviewCount} sample reviews
              <span className="mx-2 text-border">·</span>
              illustrative ratings
            </span>
          </div>

          <figure className="rounded-2xl border border-border/50 bg-muted/20 px-5 py-4">
            <blockquote className="text-sm leading-relaxed text-foreground/90">
              <span className="font-heading text-primary/50">“</span>
              {profile.reviewSummary}
              <span className="font-heading text-primary/50">”</span>
            </blockquote>
          </figure>

          <section
            className="rounded-2xl border-l-[3px] border-primary/35 bg-accent/25 px-5 py-4 sm:px-6"
            aria-labelledby={`why-${profile.id}`}
          >
            <h3 id={`why-${profile.id}`} className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              Why they are on your list
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-foreground">{matchExplanation}</p>
          </section>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <a
              href={profile.bookingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                buttonVariants({ variant: "default" }),
                "inline-flex h-auto items-center gap-2 rounded-2xl px-6 py-3 text-sm font-semibold shadow-clarity-soft"
              )}
            >
              Open sample profile
              <ExternalLink className="size-4 opacity-90" aria-hidden />
            </a>
            <span className="text-xs text-muted-foreground">Demo link only — not a real booking flow.</span>
          </div>
        </div>
      </div>
    </article>
  );
}
