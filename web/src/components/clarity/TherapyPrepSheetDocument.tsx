"use client";

import type { ReactNode } from "react";

import type { TherapyPrepSheet } from "@/types/clarity";
import { cn } from "@/lib/utils";

function formatGeneratedDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

function Section({
  title,
  children,
  className,
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "prep-sheet-section border-t border-border/70 pt-9 first:border-t-0 first:pt-0",
        className
      )}
    >
      <h3 className="font-heading text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
        {title}
      </h3>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2.5 text-[0.9375rem] leading-[1.65] text-foreground">
      {items.map((item, i) => (
        <li key={i} className="flex gap-3">
          <span className="mt-2.5 size-1 shrink-0 rounded-full bg-primary/55" aria-hidden />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

/**
 * Print-first therapy prep artifact — calm typography, generous rhythm, emotionally respectful copy.
 */
export function TherapyPrepSheetDocument({ sheet }: { sheet: TherapyPrepSheet }) {
  const lim = sheet.summary.limitations[0];

  return (
    <article
      className={cn(
        "prep-sheet-print print-main mx-auto max-w-[42rem]",
        "rounded-[1.5rem] border border-border/80 bg-card px-8 py-10 shadow-clarity-card sm:px-12 sm:py-14",
        "text-foreground"
      )}
    >
      <header className="border-b border-border/80 pb-10 text-center sm:pb-12">
        <p className="text-[0.65rem] font-semibold uppercase tracking-[0.28em] text-primary">
          Clarity
        </p>
        <h1 className="mt-4 font-heading text-balance text-3xl font-semibold tracking-tight sm:text-[2.1rem] sm:leading-tight">
          Session prep sheet
        </h1>
        <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-muted-foreground">
          For you and, if you choose, a clinician — a snapshot, not a diagnosis. Change anything
          that does not sound like you before you go in.
        </p>
        <p className="mt-6 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
          Generated {formatGeneratedDate(sheet.createdAt)}
        </p>
      </header>

      <div className="mt-10 space-y-0 sm:mt-12">
        <Section title="What I have been experiencing">
          <p className="text-[0.975rem] leading-[1.75] text-foreground sm:text-[1.02rem]">
            {sheet.experiencingNarrative}
          </p>
        </Section>

        <Section title="Patterns that showed up">
          <BulletList items={sheet.emotionalPatterns} />
        </Section>

        <Section title="Stressors or triggers on my mind">
          <BulletList items={sheet.triggersAndStressors} />
        </Section>

        <Section title="Support I might be looking for">
          <BulletList items={sheet.supportImLookingFor} />
        </Section>

        <Section title="What I want from therapy">
          <p className="whitespace-pre-wrap text-[0.9375rem] leading-[1.75] text-foreground">
            {sheet.whatIWantFromTherapy}
          </p>
        </Section>

        <Section title="Questions I want to ask">
          <ol className="list-none space-y-4 text-[0.9375rem] leading-[1.65] text-foreground">
            {sheet.questionsIWantToAsk.map((q, i) => (
              <li key={i} className="flex gap-4">
                <span className="font-heading text-sm font-semibold tabular-nums text-primary/70">
                  {i + 1}.
                </span>
                <span>{q}</span>
              </li>
            ))}
          </ol>
        </Section>

        <Section title="What I do not want to forget in session">
          <p className="whitespace-pre-wrap text-[0.9375rem] leading-[1.8] text-foreground/95">
            {sheet.dontForgetInSession}
          </p>
        </Section>

        <Section title="Rhythms and context I shared (optional to discuss)">
          <div className="grid gap-8 sm:grid-cols-2">
            <div>
              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Check-in
              </p>
              <ul className="mt-3 space-y-2 text-sm leading-relaxed text-muted-foreground">
                {sheet.intakeHighlights.map((t, i) => (
                  <li key={i}>{t}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Daily rhythms
              </p>
              <ul className="mt-3 space-y-2 text-sm leading-relaxed text-muted-foreground">
                {sheet.lifestyleHighlights.map((t, i) => (
                  <li key={i}>{t}</li>
                ))}
              </ul>
            </div>
          </div>
          <div className="mt-8">
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              In my own words
            </p>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
              {sheet.brainDumpExcerpt}
            </p>
          </div>
        </Section>

        <footer className="prep-sheet-section mt-12 border-t border-border/80 pt-10 text-center">
          {lim ? (
            <p className="mx-auto max-w-xl text-xs leading-relaxed text-muted-foreground">
              Note: {lim}
            </p>
          ) : null}
          <p className="mx-auto mt-4 max-w-xl text-xs leading-relaxed text-muted-foreground">
            Clarity is not for emergencies. If you may be in danger, call your local emergency
            number. In the U.S., call or text <span className="text-foreground">988</span> for the
            Suicide and Crisis Lifeline.
          </p>
        </footer>
      </div>
    </article>
  );
}
