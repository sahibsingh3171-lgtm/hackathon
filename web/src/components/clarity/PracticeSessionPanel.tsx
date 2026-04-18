"use client";

import { MessageCircle, ShieldAlert, Sparkles } from "lucide-react";

import type { PracticeSessionContent } from "@/types/clarity";
import { cn } from "@/lib/utils";

const heroCard =
  "relative overflow-hidden rounded-[1.75rem] border border-primary/18 bg-gradient-to-b from-card via-card to-primary/[0.04] px-8 py-10 shadow-clarity-card ring-1 ring-primary/10 sm:px-10 sm:py-12";

const promptCard =
  "rounded-2xl border border-border/55 bg-card/95 px-6 py-7 shadow-[0_1px_2px_rgb(15_23_42_/0.04)] sm:px-8 sm:py-8";

const exampleLine =
  "rounded-xl border border-border/50 bg-muted/[0.18] px-4 py-3 text-[0.9375rem] leading-relaxed text-foreground/95";

export function PracticeSessionPanel({ content }: { content: PracticeSessionContent }) {
  return (
    <div className="space-y-12 sm:space-y-14">
      <header className={cn(heroCard)}>
        <div
          className="pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full bg-primary/[0.07] blur-3xl"
          aria-hidden
        />
        <div className="relative flex flex-wrap items-start gap-4">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-accent/60 text-primary shadow-sm ring-1 ring-primary/12">
            <Sparkles className="size-5" strokeWidth={1.75} aria-hidden />
          </span>
          <div className="min-w-0 flex-1 space-y-4">
            <p className="clarity-kicker text-primary/90">Rehearsal — not therapy</p>
            <h2 className="font-heading text-balance text-2xl font-semibold tracking-tight text-foreground sm:text-[1.65rem] sm:leading-snug">
              Practice how you might start in a first session
            </h2>
            <p className="max-w-prose text-pretty text-[0.9375rem] leading-relaxed text-muted-foreground sm:text-base">
              {content.intro}
            </p>
          </div>
        </div>
      </header>

      <aside
        className="flex gap-4 rounded-2xl border border-amber-500/25 bg-amber-500/[0.06] px-5 py-5 sm:px-6 sm:py-6"
        aria-labelledby="practice-disclaimer-heading"
      >
        <ShieldAlert
          className="mt-0.5 size-5 shrink-0 text-amber-700/80 dark:text-amber-400/90"
          strokeWidth={1.75}
          aria-hidden
        />
        <div className="min-w-0 space-y-2">
          <p
            id="practice-disclaimer-heading"
            className="text-sm font-semibold leading-snug text-foreground"
          >
            {content.notTherapyBanner}
          </p>
          <p className="text-sm leading-relaxed text-muted-foreground">{content.notTherapyBody}</p>
        </div>
      </aside>

      <section aria-labelledby="freeze-starters-heading" className="space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h3
            id="freeze-starters-heading"
            className="font-heading text-lg font-semibold tracking-tight text-foreground"
          >
            If you freeze, you can say this
          </h3>
          <p className="max-w-md text-xs leading-relaxed text-muted-foreground">
            Borrow a line or mix your own — there is no wrong opener as long as it feels honest to you.
          </p>
        </div>
        <ul className="grid list-none gap-3 sm:grid-cols-2">
          {content.freezeStarters.map((line, i) => (
            <li
              key={i}
              className="rounded-2xl border border-border/60 bg-muted/[0.12] px-4 py-4 text-[0.875rem] leading-relaxed text-foreground/95"
            >
              <span className="sr-only">Starter {i + 1}. </span>
              “{line}”
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="prompts-heading" className="space-y-6">
        <div className="flex flex-wrap items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted/50 text-primary ring-1 ring-border/60">
            <MessageCircle className="size-5" strokeWidth={1.75} aria-hidden />
          </span>
          <div>
            <h3 id="prompts-heading" className="font-heading text-lg font-semibold text-foreground">
              First-session-style prompts
            </h3>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              The kinds of questions many therapists ask early on — with example wording woven from your
              reflection, not a script to read word for word.
            </p>
          </div>
        </div>

        <ol className="list-none space-y-6">
          {content.prompts.map((block, idx) => (
            <li key={block.id}>
              <article className={promptCard}>
                <p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  Prompt {idx + 1}
                </p>
                <h4 className="mt-2 font-heading text-lg font-semibold leading-snug text-foreground">
                  {block.question}
                </h4>
                <p className="mt-3 text-xs font-medium uppercase tracking-[0.14em] text-primary/85">
                  You might try saying
                </p>
                <ul className="mt-3 space-y-2.5">
                  {block.exampleLines.map((line, j) => (
                    <li key={j} className={exampleLine}>
                      {line}
                    </li>
                  ))}
                </ul>
              </article>
            </li>
          ))}
        </ol>
      </section>

      <footer className="rounded-2xl border border-dashed border-border/70 bg-muted/[0.08] px-5 py-5 text-center text-sm leading-relaxed text-muted-foreground sm:px-8">
        When you meet a real therapist, you set the pace. This page is only rehearsal — they will ask
        their own questions, and you can always pause, correct, or change direction.
      </footer>
    </div>
  );
}
