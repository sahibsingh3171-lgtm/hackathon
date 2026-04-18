import Link from "next/link";
import { ArrowRight, BadgeCheck } from "lucide-react";

import { DisclaimerBlock } from "@/components/clarity/DisclaimerBlock";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { LandingProductMockup } from "./landing-product-mockup";

export function LandingHero() {
  return (
    <section
      aria-labelledby="hero-heading"
      className="relative overflow-hidden border-b border-border/60"
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.4]"
        style={{
          backgroundImage: `radial-gradient(ellipse 90% 70% at 15% -10%, rgb(111 143 120 / 0.09), transparent 50%),
            radial-gradient(ellipse 70% 50% at 95% 0%, rgb(111 143 120 / 0.06), transparent 45%)`,
        }}
        aria-hidden
      />

      <div className="clarity-container relative grid gap-12 py-20 sm:gap-14 sm:py-24 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.02fr)] lg:items-center lg:gap-20 lg:py-28">
        <div className="flex min-w-0 flex-col">
          <div className="mb-10 max-w-xl sm:mb-12">
            <DisclaimerBlock variant="hero" />
          </div>

          <p className="inline-flex w-fit items-center gap-2 rounded-full border border-border/60 bg-card/90 px-4 py-2.5 text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground shadow-sm backdrop-blur-sm">
            Before the first session
          </p>

          <h1
            id="hero-heading"
            className="mt-8 max-w-[20ch] text-balance font-heading text-4xl font-semibold leading-[1.06] tracking-tight text-foreground sm:mt-10 sm:text-5xl sm:leading-[1.05] lg:max-w-[22ch] lg:text-[3.2rem]"
          >
            A steadier way to think about therapy.
          </h1>

          <p className="mt-7 max-w-xl text-pretty text-lg leading-relaxed text-muted-foreground sm:mt-8">
            Notice how you have been doing, say what is hard in your own words, and leave with a few
            anchors — questions to ask, language that fits you, and a sense of what might help next.
          </p>

          <div className="mt-11 flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
            <Link
              href="/brain-dump"
              className={cn(
                buttonVariants(),
                "inline-flex h-auto min-h-11 items-center justify-center gap-2 rounded-2xl bg-primary px-8 py-3.5 text-sm font-semibold text-primary-foreground shadow-clarity-soft hover:bg-primary/90"
              )}
            >
              Start the check-in
              <ArrowRight className="size-4 shrink-0" aria-hidden />
            </Link>
            <Link
              href="#how-it-works"
              className="text-center text-sm font-medium text-muted-foreground underline decoration-border underline-offset-[0.35rem] transition hover:text-foreground hover:decoration-primary/40 sm:text-left"
            >
              How it works
            </Link>
          </div>

          <p className="mt-10 inline-flex max-w-md flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <BadgeCheck className="size-4 shrink-0 text-primary" aria-hidden />
            <span className="text-foreground/90">Stays on this device for the demo</span>
            <span className="hidden text-border sm:inline" aria-hidden>
              ·
            </span>
            <span>No account needed to try it</span>
          </p>
        </div>

        <div className="min-w-0 lg:pl-2">
          <LandingProductMockup />
        </div>
      </div>
    </section>
  );
}
