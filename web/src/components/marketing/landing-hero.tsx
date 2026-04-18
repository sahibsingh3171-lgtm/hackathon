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

      <div className="relative mx-auto grid max-w-6xl gap-12 px-clarity-section-x py-16 sm:px-10 sm:py-20 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:items-center lg:gap-16 lg:py-24">
        <div className="flex min-w-0 flex-col">
          <div className="mb-8 max-w-xl">
            <DisclaimerBlock variant="hero" />
          </div>

          <p className="inline-flex w-fit items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground shadow-clarity-soft">
            Therapy readiness
          </p>

          <h1
            id="hero-heading"
            className="mt-8 max-w-[18ch] text-balance font-heading text-4xl font-semibold leading-[1.08] tracking-tight text-foreground sm:text-5xl lg:text-[3.25rem]"
          >
            Reflect, prepare, and find care that fits.
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
            Clarity helps you understand whether therapy might help right now, capture what you are
            experiencing in your own words, and walk into a first session with clarity — not
            pressure.
          </p>

          <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-5">
            <Link
              href="/intake"
              className={cn(
                buttonVariants(),
                "inline-flex h-auto min-h-11 items-center justify-center gap-2 rounded-2xl bg-primary px-8 py-3.5 text-sm font-semibold text-primary-foreground shadow-clarity-soft hover:bg-primary/90"
              )}
            >
              Begin your check-in
              <ArrowRight className="size-4 shrink-0" aria-hidden />
            </Link>
            <Link
              href="#how-it-works"
              className="text-center text-sm font-medium text-muted-foreground underline decoration-border underline-offset-[0.35rem] transition hover:text-foreground hover:decoration-primary/40 sm:text-left"
            >
              See how it works
            </Link>
          </div>

          <p className="mt-10 inline-flex max-w-md flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <BadgeCheck className="size-4 shrink-0 text-primary" aria-hidden />
            <span className="text-foreground/90">Private in your browser</span>
            <span className="hidden text-border sm:inline" aria-hidden>
              ·
            </span>
            <span>No account required for the demo</span>
          </p>
        </div>

        <div className="min-w-0 lg:pl-2">
          <LandingProductMockup />
        </div>
      </div>
    </section>
  );
}
