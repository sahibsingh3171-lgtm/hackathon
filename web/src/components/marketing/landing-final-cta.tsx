import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { DisclaimerBlock } from "@/components/clarity/DisclaimerBlock";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function LandingFinalCta() {
  return (
    <section
      aria-labelledby="final-cta-heading"
      className="relative overflow-hidden border-t border-border/40 bg-[linear-gradient(165deg,rgb(232_240_234_/0.55)_0%,rgb(246_243_237)_38%,rgb(252_251_249)_100%)] py-24 sm:py-28 lg:py-36"
    >
      <div
        className="pointer-events-none absolute -right-24 top-1/2 h-[min(90vw,520px)] w-[min(90vw,520px)] -translate-y-1/2 rounded-full bg-primary/[0.07] blur-3xl"
        aria-hidden
      />

      <div className="clarity-container relative mx-auto max-w-3xl text-center">
        <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.24em] text-muted-foreground/90">
          Begin
        </p>
        <h2
          id="final-cta-heading"
          className="mx-auto mt-4 max-w-lg font-heading text-[2rem] font-semibold leading-[1.12] tracking-[-0.03em] text-foreground sm:text-4xl sm:leading-[1.1] lg:text-[2.5rem]"
        >
          Whenever you are ready to begin.
        </h2>
        <p className="mx-auto mt-7 max-w-xl text-pretty text-lg leading-[1.65] text-muted-foreground sm:mt-8 sm:text-xl sm:leading-[1.65]">
          Set aside a few quiet minutes. There is nothing to prove — only a little more clarity for
          yourself, and maybe a useful line or two if you talk with someone later.
        </p>
        <div className="mt-12 flex justify-center sm:mt-14">
          <Link
            href="/brain-dump"
            className={cn(
              buttonVariants(),
              "inline-flex h-12 min-h-12 items-center justify-center gap-2 rounded-full bg-primary px-9 text-[0.9375rem] font-semibold text-primary-foreground shadow-[0_1px_2px_rgb(15_23_42_/0.06),0_12px_40px_rgb(111_143_120_/0.22)] transition-[transform,box-shadow] duration-300 hover:bg-primary/92 hover:shadow-[0_1px_2px_rgb(15_23_42_/0.08),0_16px_44px_rgb(111_143_120_/0.26)] active:scale-[0.99]"
            )}
          >
            Open the check-in
            <ArrowRight className="size-4 shrink-0 opacity-90" aria-hidden />
          </Link>
        </div>
        <div className="mx-auto mt-16 max-w-xl text-left sm:mt-20">
          <DisclaimerBlock variant="footer" />
        </div>
      </div>
    </section>
  );
}
