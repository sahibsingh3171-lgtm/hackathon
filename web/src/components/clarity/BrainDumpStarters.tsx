"use client";

import { Feather } from "lucide-react";

import { cn } from "@/lib/utils";

export type BrainDumpStarter = {
  /** Short label for the chip. */
  label: string;
  /** The prompt that is inserted into the textarea. */
  prompt: string;
};

const STARTERS: readonly BrainDumpStarter[] = [
  {
    label: "Not sure where to start",
    prompt: "I don’t really know where to start, but ",
  },
  {
    label: "Lately I’ve been feeling…",
    prompt: "Lately I’ve been feeling ",
  },
  {
    label: "Something weighing on me",
    prompt: "Something that’s been weighing on me is ",
  },
  {
    label: "Work / stress lately",
    prompt: "I think work and stress have been affecting me because ",
  },
  {
    label: "Relationships",
    prompt: "Things with the people close to me have been ",
  },
  {
    label: "Not sure therapy is right",
    prompt: "I’m not sure if therapy is right for me, but ",
  },
  {
    label: "Sleep / body",
    prompt: "My sleep and body have been ",
  },
  {
    label: "What would help?",
    prompt: "If I could change one thing right now, it would be ",
  },
] as const;

/**
 * Premium “ways to start” strip for the brain-dump page. Clicking a chip
 * either inserts its prompt at the current text position or appends it —
 * always focuses the textarea afterwards so the cursor lands in the right spot.
 */
export function BrainDumpStarters({
  hasText,
  onApply,
  disabled,
  className,
}: {
  hasText: boolean;
  onApply: (prompt: string) => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <section
      aria-labelledby="starters-heading"
      className={cn(
        "relative overflow-hidden rounded-[1.5rem] border border-border/55 bg-gradient-to-br from-card via-card to-muted/25 px-6 py-6 shadow-[0_1px_2px_rgb(15_23_42_/0.03)] sm:px-7 sm:py-7",
        className
      )}
    >
      <div className="flex items-center gap-2.5">
        <span className="flex size-8 items-center justify-center rounded-xl border border-border/60 bg-muted/30 text-primary">
          <Feather className="size-3.5" strokeWidth={1.75} aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="text-[0.625rem] font-semibold uppercase tracking-[0.22em] text-muted-foreground/90">
            Ways to start
          </p>
          <h3
            id="starters-heading"
            className="mt-1 font-heading text-[0.95rem] font-semibold tracking-[-0.01em] text-foreground"
          >
            Not sure how to begin? Try one of these openings.
          </h3>
        </div>
      </div>
      <p className="mt-3 max-w-xl text-[0.8125rem] leading-relaxed text-muted-foreground">
        Tap any line to drop it into your note — then keep going in your own words. Nothing here is
        required; these are just small doorways in.
      </p>
      <div className="mt-5 flex flex-wrap gap-2">
        {STARTERS.map((s) => (
          <button
            key={s.label}
            type="button"
            disabled={disabled}
            onClick={() => onApply(s.prompt)}
            className={cn(
              "group inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-[0.8125rem] font-medium leading-none transition-[background-color,border-color,color,box-shadow] duration-200",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
              disabled
                ? "cursor-not-allowed border-border/50 bg-background/50 text-muted-foreground/60"
                : "border-border/70 bg-background/70 text-foreground/85 hover:border-primary/35 hover:bg-primary/8 hover:text-primary"
            )}
          >
            <span className="text-primary/70 transition group-hover:text-primary">“</span>
            {s.label}
            <span className="text-primary/70 transition group-hover:text-primary">…</span>
          </button>
        ))}
      </div>
      {hasText ? (
        <p className="mt-5 text-[0.75rem] leading-relaxed text-muted-foreground/90">
          Picking one of these will add it to the end of what you have already written — so you
          never lose what you typed.
        </p>
      ) : null}
    </section>
  );
}
