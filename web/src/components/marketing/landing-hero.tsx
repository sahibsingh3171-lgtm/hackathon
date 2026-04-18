import Link from "next/link";
import { ArrowRight, BadgeCheck } from "lucide-react";

import { ClarityLogo } from "@/components/clarity/ClarityLogo";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { LandingProductMockup } from "./landing-product-mockup";

export function LandingHero() {
  return (
    <section
      aria-labelledby="hero-heading"
      className="relative overflow-x-hidden border-b border-border/50"
    >
      {/* Atmospheric canvas — calm depth, no loud gradients */}
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div
          className="absolute inset-0 bg-[linear-gradient(180deg,rgb(255_255_255_/0.55)_0%,transparent_42%,rgb(246_243_237)_100%)]"
        />
        <div
          className="absolute inset-0 opacity-[0.5]"
          style={{
            backgroundImage: `radial-gradient(ellipse 85% 55% at 12% -5%, rgb(111 143 120 / 0.07), transparent 52%),
              radial-gradient(ellipse 60% 45% at 92% 8%, rgb(111 143 120 / 0.05), transparent 48%)`,
          }}
        />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-border/60 to-transparent" />
      </div>

      <div className="clarity-container relative pt-16 pb-20 sm:pt-20 sm:pb-24 lg:grid lg:grid-cols-12 lg:gap-x-12 lg:gap-y-0 lg:pt-24 lg:pb-32 xl:gap-x-16">
        {/* Copy column — editorial measure */}
        <div className="flex min-w-0 flex-col lg:col-span-5 lg:pt-2">
          <div className="flex flex-wrap items-end gap-4 sm:gap-5">
            <ClarityLogo size="lg" className="h-[5.5rem] w-[5.5rem] shrink-0 sm:h-24 sm:w-24" />
            <div className="min-w-0 pb-0.5">
              <p
                className="font-heading text-[2rem] font-medium leading-none tracking-[-0.04em] text-foreground sm:text-[2.35rem] lg:text-[2.5rem]"
                style={{ fontFeatureSettings: '"SOFT" 1, "WONK" 1' }}
              >
                <span className="bg-gradient-to-br from-foreground via-foreground to-primary/75 bg-clip-text text-transparent">
                  Clarity
                </span>
              </p>
            </div>
          </div>

          <p className="mt-10 inline-flex w-fit items-center rounded-full border border-border/70 bg-card/70 px-3.5 py-2 text-[0.625rem] font-semibold uppercase tracking-[0.22em] text-muted-foreground backdrop-blur-md sm:px-4 sm:py-2.5">
            Before the first session
          </p>

          <h1
            id="hero-heading"
            className="mt-7 max-w-[16rem] text-balance font-heading text-[2.125rem] font-semibold leading-[1.08] tracking-[-0.035em] text-foreground sm:mt-9 sm:max-w-[19rem] sm:text-4xl sm:leading-[1.06] lg:mt-10 lg:max-w-[22rem] lg:text-[2.75rem] lg:leading-[1.05]"
          >
            A steadier way to think about therapy.
          </h1>

          <p className="mt-8 max-w-[34rem] text-pretty text-base leading-[1.65] text-muted-foreground sm:text-lg sm:leading-[1.7] lg:mt-9">
            Notice how you have been doing, say what is hard in your own words, and leave with a few
            anchors — questions to ask, language that fits you, and a sense of what might help next.
          </p>

          <div className="mt-10 flex flex-col gap-3 sm:mt-12 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
            <Link
              href="/brain-dump"
              className={cn(
                buttonVariants(),
                "inline-flex h-12 min-h-12 items-center justify-center gap-2 rounded-full bg-primary px-8 text-[0.9375rem] font-semibold text-primary-foreground shadow-[0_1px_2px_rgb(15_23_42_/0.06),0_12px_40px_rgb(111_143_120_/0.22)] transition-[transform,box-shadow] duration-300 hover:bg-primary/92 hover:shadow-[0_1px_2px_rgb(15_23_42_/0.08),0_16px_44px_rgb(111_143_120_/0.26)] active:scale-[0.99]"
              )}
            >
              Start the check-in
              <ArrowRight className="size-4 shrink-0 opacity-90" aria-hidden />
            </Link>
            <Link
              href="#how-it-works"
              className="inline-flex h-12 items-center justify-center rounded-full border border-border/80 bg-transparent px-6 text-sm font-medium text-foreground/85 transition hover:border-primary/35 hover:bg-muted/30"
            >
              How it works
            </Link>
          </div>

          <p className="mt-12 flex max-w-md flex-wrap items-center gap-x-2 gap-y-1 text-sm leading-relaxed text-muted-foreground sm:mt-14">
            <BadgeCheck className="size-4 shrink-0 text-primary/90" aria-hidden />
            <span className="text-foreground/85">Stays on this device for the demo</span>
            <span className="hidden text-border/80 sm:inline" aria-hidden>
              ·
            </span>
            <span>No account needed</span>
          </p>
        </div>

        {/* Product preview — generous stage */}
        <div className="relative mt-16 min-h-0 lg:col-span-7 lg:mt-0 lg:flex lg:items-start lg:justify-end lg:pl-4">
          <div className="relative w-full max-w-xl lg:max-w-none lg:translate-y-1">
            <LandingProductMockup />
          </div>
        </div>
      </div>
    </section>
  );
}
