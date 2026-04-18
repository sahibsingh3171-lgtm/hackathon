"use client";

import Link from "next/link";
import {
  ArrowRight,
  FileText,
  HandHeart,
  Leaf,
  MessageCircleQuestion,
  Sparkles,
  Theater,
  Waves,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  formatConcernTag,
  THERAPY_CONSIDERATION_COPY,
  THERAPY_READINESS_FALLBACK_COPY,
} from "@/lib/clarity/results-copy";
import { cn } from "@/lib/utils";
import type { ClaritySession } from "@/types/clarity";
import type { TherapyConsiderationLevel } from "@/types/readiness-analysis";

import { hasLifestyleTrendData, ResultsLifestyleTrendPanel } from "./ResultsLifestyleTrendPanel";

/** Shared results surfaces — one system, less “dashboard panel” noise */
const sectionCard =
  "rounded-3xl border border-border/45 bg-card px-7 py-10 shadow-sm ring-1 ring-foreground/[0.02] sm:px-10 sm:py-11";
const sectionHeaderRow = "flex flex-wrap items-start gap-5";
const sectionIcon =
  "flex size-12 shrink-0 items-center justify-center rounded-2xl bg-accent/55 text-primary shadow-sm ring-1 ring-primary/10";

function considerationTone(level: TherapyConsiderationLevel | null): string {
  if (!level) return "border-border bg-card";
  switch (level) {
    case "monitor":
      return "border-border/90 bg-muted/15";
    case "consider_support":
      return "border-primary/22 bg-accent/45";
    case "strongly_consider_support":
      return "border-primary/30 bg-primary/[0.08]";
    default:
      return "border-border bg-card";
  }
}

function considerationBadgeLabel(level: TherapyConsiderationLevel | null): string {
  if (!level) return "Reflection";
  switch (level) {
    case "monitor":
      return "Mostly steady";
    case "consider_support":
      return "Talking may help";
    case "strongly_consider_support":
      return "Extra support may help";
    default:
      return "";
  }
}

export function AnalysisResultsView({
  session,
}: {
  session: Pick<ClaritySession, "summary" | "readinessAnalysis" | "lifestyle" | "intake">;
}) {
  const summary = session.summary;
  if (!summary) return null;

  const ra = session.readinessAnalysis;
  const level = ra?.therapyConsiderationLevel ?? null;
  const considerationCopy = level
    ? THERAPY_CONSIDERATION_COPY[level]
    : THERAPY_READINESS_FALLBACK_COPY[summary.therapyReadiness];

  const heroSubtitle = ra?.conciseSummary?.trim()
    ? "Below, your words have a bit more room — still plain language, still yours."
    : summary.keyThemes[0]
      ? `One thread that showed up: ${summary.keyThemes[0]}. There is more below — go slowly if you need to.`
      : "A quiet read on what rose to the surface. Nothing here is final or diagnostic.";

  const noticingBullets =
    ra && ra.mainConcerns.length > 0 ? ra.mainConcerns : summary.keyThemes;

  let interventions: string[] =
    ra && ra.lowFrictionInterventions.length > 0
      ? ra.lowFrictionInterventions
      : summary.rationaleBullets.slice(0, 4);
  if (interventions.length === 0) {
    interventions = [
      "Name one small thing that went okay this week — including simply getting through.",
      "Set aside ten minutes with no agenda except being still.",
      "If it feels safe, tell someone you trust you have been tired; you do not have to hold it all quietly.",
    ];
  }

  const patterns = ra?.emotionalPatterns?.length ? ra.emotionalPatterns : [];
  const prepBody = ra?.therapyPrepSummary?.trim();
  const questions =
    ra && ra.recommendedQuestionsForTherapy.length > 0
      ? ra.recommendedQuestionsForTherapy
      : [
          "What could change in the next few months if therapy went well for me?",
          "How do you usually work with someone who has been feeling the way I describe?",
          "What pace do you suggest if opening up feels hard?",
        ];

  const limitations = ra?.limitations?.length ? ra.limitations : summary.limitations;
  const confidenceNotes = ra?.confidenceNotes?.filter(Boolean) ?? [];
  const supportAreas = ra?.potentialSupportAreas?.filter(Boolean) ?? [];

  return (
    <article className="clarity-measure mx-auto w-full space-y-10 sm:space-y-14 md:space-y-16">
      {/* Hero — editorial anchor */}
      <header
        className={cn(
          "relative overflow-hidden rounded-3xl bg-card px-8 py-11 shadow-clarity-card ring-1 ring-border/55 sm:px-11 sm:py-14",
          "before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-primary/30 before:to-transparent"
        )}
      >
        <div
          className="pointer-events-none absolute -right-20 -top-28 h-64 w-64 rounded-full bg-primary/[0.055] blur-3xl"
          aria-hidden
        />
        <p className="clarity-kicker relative">From this session</p>
        <h2 className="relative mt-5 max-w-none font-heading text-balance text-3xl font-semibold leading-[1.12] tracking-tight text-foreground sm:text-[2.25rem] sm:leading-[1.1]">
          {summary.headline}
        </h2>
        <p className="relative mt-5 max-w-prose text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg sm:leading-relaxed">
          {heroSubtitle}
        </p>
        <div className="relative mt-9 flex flex-wrap items-center gap-x-4 gap-y-2">
          {summary.usedMock ? (
            <Badge variant="outline" className="rounded-full border-border/70 bg-muted/20 px-3.5 py-1 text-xs font-medium">
              Offline sample
            </Badge>
          ) : null}
          <span className="text-xs leading-relaxed text-muted-foreground sm:text-sm">
            Perspective only — not a diagnosis or a care plan.
          </span>
        </div>
      </header>

      {/* 1 · What we’re noticing */}
      <section className={sectionCard} aria-labelledby="results-noticing-heading">
        <div className={sectionHeaderRow}>
          <div className={sectionIcon}>
            <Sparkles className="size-5" aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <h3
              id="results-noticing-heading"
              className="font-heading text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
            >
              What stood out to us
            </h3>
            <p className="mt-3 max-w-prose text-sm leading-relaxed text-muted-foreground sm:text-base">
              Plain language — honest, bounded, and meant to be read slowly.
            </p>
          </div>
        </div>
        {ra?.conciseSummary?.trim() ? (
          <p className="mt-9 max-w-prose text-base leading-relaxed text-foreground sm:text-[1.05rem] sm:leading-relaxed">
            {ra.conciseSummary}
          </p>
        ) : null}
        <ul className="mt-9 space-y-4 border-t border-border/45 pt-9">
          {noticingBullets.map((line, i) => (
            <li key={i} className="flex gap-4 text-sm leading-relaxed text-foreground sm:text-base">
              <span
                className="mt-2 size-1.5 shrink-0 rounded-full bg-primary/55"
                aria-hidden
              />
              <span>{line}</span>
            </li>
          ))}
        </ul>
        {supportAreas.length > 0 ? (
          <div className="mt-10 rounded-2xl border border-border/40 bg-muted/25 px-6 py-5 sm:px-7">
            <p className="clarity-kicker">Where support might help</p>
            <ul className="mt-3 space-y-2 text-sm leading-relaxed text-muted-foreground">
              {supportAreas.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>

      {/* 2 · Therapy consideration */}
      <section
        className={cn(
          "rounded-3xl border px-7 py-10 shadow-sm ring-1 ring-foreground/[0.02] sm:px-10 sm:py-11",
          considerationTone(level)
        )}
        aria-labelledby="results-therapy-heading"
      >
        <div className="flex flex-wrap items-center gap-4">
          <div className={cn(sectionIcon, "bg-card/90 shadow-sm")}>
            <HandHeart className="size-5" aria-hidden />
          </div>
          <Badge
            variant="secondary"
            className="rounded-full border-0 bg-background/70 px-3 py-1 text-xs font-medium"
          >
            {considerationBadgeLabel(level)}
          </Badge>
        </div>
        <h3
          id="results-therapy-heading"
          className="mt-6 max-w-2xl font-heading text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
        >
          {considerationCopy.title}
        </h3>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
          {considerationCopy.lead}
        </p>
        <p className="mt-5 max-w-2xl text-xs leading-relaxed text-muted-foreground">
          This is gentle guidance, not a referral or a medical decision. Your next step stays yours.
        </p>
      </section>

      {/* 3 · Low-friction interventions */}
      <section className={sectionCard} aria-labelledby="results-interventions-heading">
        <div className={sectionHeaderRow}>
          <div className={sectionIcon}>
            <Leaf className="size-5" aria-hidden />
          </div>
          <div>
            <h3
              id="results-interventions-heading"
              className="font-heading text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
            >
              Small things that might ease the week
            </h3>
            <p className="mt-2 max-w-prose text-sm text-muted-foreground">
              Ideas you can try without permission — not assignments from a clinician, and not a
              replacement for care when you need more.
            </p>
          </div>
        </div>
        <ol className="mt-10 grid gap-4 sm:grid-cols-2 sm:gap-5">
          {interventions.map((item, i) => (
            <li
              key={i}
              className="rounded-2xl border border-border/40 bg-background/90 px-6 py-5 text-sm leading-relaxed text-foreground shadow-sm"
            >
              <span className="font-mono text-[0.7rem] font-semibold tabular-nums text-primary/75">
                {String(i + 1).padStart(2, "0")}
              </span>
              <p className="mt-2.5 leading-relaxed">{item}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* 4 · Patterns + concern chips */}
      <section className={sectionCard} aria-labelledby="results-patterns-heading">
        <div className={sectionHeaderRow}>
          <div className={sectionIcon}>
            <Waves className="size-5" aria-hidden />
          </div>
          <div>
            <h3
              id="results-patterns-heading"
              className="font-heading text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
            >
              Patterns in what you shared
            </h3>
            <p className="mt-2 max-w-prose text-sm text-muted-foreground">
              Shapes in your language that might be useful in therapy — not fixed labels.
            </p>
          </div>
        </div>
        {patterns.length > 0 ? (
          <ul className="mt-9 flex flex-wrap gap-2">
            {patterns.map((p, i) => (
              <li
                key={i}
                className="rounded-full border border-border/50 bg-muted/20 px-4 py-2 text-sm text-foreground/95"
              >
                {p}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-8 text-sm text-muted-foreground">
            We did not name separate patterns this round — your themes above still hold the thread.
          </p>
        )}
        {summary.tags.length > 0 ? (
          <div className="mt-10 border-t border-border/40 pt-9">
            <p className="clarity-kicker">Themes you named</p>
            <ul className="mt-4 flex flex-wrap gap-2">
              {summary.tags.map((tag) => (
                <li key={tag}>
                  <span className="inline-flex rounded-full bg-primary/[0.11] px-3.5 py-1.5 text-xs font-medium text-foreground">
                    {formatConcernTag(tag)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>

      {/* 5 · Therapy prep narrative */}
      <section className={cn(sectionCard, "sm:py-12")} aria-labelledby="results-prep-heading">
        <div className={sectionHeaderRow}>
          <div className={sectionIcon}>
            <FileText className="size-5" aria-hidden />
          </div>
          <div>
            <h3
              id="results-prep-heading"
              className="font-heading text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
            >
              Words you could bring to a first session
            </h3>
            <p className="mt-2 max-w-prose text-sm text-muted-foreground">
              A snapshot you can edit, set aside, or rewrite. It belongs to you.
            </p>
          </div>
        </div>
        <div className="mx-auto mt-10 max-w-prose border-t border-border/35 pt-9">
          {prepBody ? (
            <p className="whitespace-pre-wrap text-base leading-[1.8] text-foreground sm:text-[1.0625rem]">
              {prepBody}
            </p>
          ) : (
            <ul className="space-y-4 text-base leading-relaxed text-foreground">
              {summary.rationaleBullets.map((b, i) => (
                <li key={i} className="flex gap-3">
                  <span className="mt-2.5 size-1 shrink-0 rounded-full bg-primary/45" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        {ra?.suggestedTherapistTraits && ra.suggestedTherapistTraits.length > 0 ? (
          <div className="mx-auto mt-10 max-w-prose rounded-2xl border border-primary/18 bg-accent/35 px-6 py-4 text-sm leading-relaxed text-muted-foreground">
            <span className="font-medium text-foreground">For thinking about fit later: </span>
            {ra.suggestedTherapistTraits.join(" · ")}
          </div>
        ) : null}
      </section>

      {/* 6 · Questions for therapy */}
      <section className={sectionCard} aria-labelledby="results-questions-heading">
        <div className={sectionHeaderRow}>
          <div className={cn(sectionIcon, "bg-muted/35")}>
            <MessageCircleQuestion className="size-5" aria-hidden />
          </div>
          <div>
            <h3
              id="results-questions-heading"
              className="font-heading text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
            >
              Questions you might ask a therapist
            </h3>
            <p className="mt-2 max-w-prose text-sm text-muted-foreground">
              Use them as written or let them spark your own. Clear questions help both of you see
              if it is a fit.
            </p>
          </div>
        </div>
        <ul className="mt-10 space-y-4">
          {questions.map((q, i) => (
            <li
              key={i}
              className="flex gap-4 rounded-2xl border border-border/40 bg-background/80 px-5 py-4 sm:gap-5 sm:px-6 sm:py-5"
            >
              <span className="font-heading text-lg font-semibold tabular-nums text-primary/65">
                {i + 1}
              </span>
              <span className="min-w-0 text-sm leading-relaxed text-foreground sm:text-base">
                {q}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* 7 · Optional lifestyle snapshot (minimal, sage-only) */}
      {hasLifestyleTrendData(session.lifestyle, session.intake) ? (
        <div className="mx-auto w-full max-w-lg pt-2">
          <ResultsLifestyleTrendPanel lifestyle={session.lifestyle} intake={session.intake} />
        </div>
      ) : null}

      {/* 8 · Crisis resources when flagged — CrisisSupportPanel renders above this article on the page */}

      {/* 9 · CTA — therapist matches */}
      <section
        className="relative overflow-hidden rounded-3xl border border-primary/18 bg-gradient-to-b from-accent/45 to-card px-8 py-11 shadow-clarity-card ring-1 ring-primary/10 sm:px-10 sm:py-12"
        aria-labelledby="results-matches-heading"
      >
        <div className="pointer-events-none absolute -bottom-24 -left-12 h-52 w-52 rounded-full bg-primary/[0.06] blur-3xl" />
        <h3
          id="results-matches-heading"
          className="relative max-w-lg font-heading text-2xl font-semibold leading-snug tracking-tight text-foreground sm:text-[1.75rem]"
        >
          If you want to imagine who might fit
        </h3>
        <p className="relative mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base sm:leading-relaxed">
          Sample profiles ordered from what you shared — a demo sketch of a search, not a real
          directory or a promise of the right person.
        </p>
        <div className="relative mt-9 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-4">
          <Link
            href="/matches"
            className={cn(
              buttonVariants({ variant: "default" }),
              "inline-flex h-auto items-center justify-center rounded-2xl px-7 py-3.5 text-sm font-semibold shadow-clarity-soft"
            )}
          >
            Browse sample matches
            <ArrowRight className="ml-2 size-4" aria-hidden />
          </Link>
          <Link
            href="/practice-session"
            className={cn(
              buttonVariants({ variant: "outline" }),
              "inline-flex h-auto items-center justify-center gap-2 rounded-2xl border-border px-6 py-3.5 text-sm font-semibold"
            )}
          >
            <Theater className="size-4 text-primary/85" aria-hidden />
            Practice first-session lines
          </Link>
          <Link
            href="/prep-sheet"
            className={cn(
              buttonVariants({ variant: "outline" }),
              "inline-flex h-auto items-center justify-center rounded-2xl border-border px-6 py-3.5 text-sm font-medium"
            )}
          >
            Open prep sheet
          </Link>
        </div>
        <p className="relative mt-4 max-w-xl text-xs leading-relaxed text-muted-foreground">
          “Practice first-session lines” is a short rehearsal from your own reflection — not an AI
          therapist and not treatment. Your prep sheet is still the printable snapshot for the visit.
        </p>
      </section>

      {/* Trust & limits */}
      <footer className="space-y-8 border-t border-border/45 pt-10 sm:pt-12">
        {confidenceNotes.length > 0 ? (
          <div className="rounded-2xl border border-border/45 bg-muted/20 px-6 py-5 text-sm leading-relaxed text-muted-foreground">
            <p className="clarity-kicker">Gaps in what we know</p>
            <ul className="mt-3 space-y-2">
              {confidenceNotes.map((c, i) => (
                <li key={i}>{c}</li>
              ))}
            </ul>
          </div>
        ) : null}
        <div>
          <p className="clarity-kicker">Limits of this read</p>
          <ul className="mt-4 space-y-2.5 text-sm leading-relaxed text-muted-foreground">
            {limitations.map((t, i) => (
              <li key={i}>{t}</li>
            ))}
          </ul>
        </div>
        <p className="text-center text-xs text-muted-foreground">
          Drafted {new Date(summary.generatedAt).toLocaleString()}
        </p>
      </footer>
    </article>
  );
}
