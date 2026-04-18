import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { DisclaimerBlock } from "@/components/clarity/DisclaimerBlock";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function LandingFinalCta() {
  return (
    <section
      aria-labelledby="final-cta-heading"
      className="border-t border-border/50 bg-accent/30 py-20 sm:py-24 lg:py-28"
    >
      <div className="clarity-container mx-auto max-w-3xl text-center">
        <h2
          id="final-cta-heading"
          className="mx-auto max-w-lg font-heading text-3xl font-semibold leading-tight tracking-tight text-foreground sm:text-4xl sm:leading-tight"
        >
          Whenever you are ready to begin.
        </h2>
        <p className="mx-auto mt-6 max-w-xl text-pretty text-lg leading-relaxed text-muted-foreground">
          Set aside a few quiet minutes. There is nothing to prove — only a little more clarity for
          yourself, and maybe a useful line or two if you talk with someone later.
        </p>
        <div className="mt-11 flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-6">
          <Link
            href="/brain-dump"
            className={cn(
              buttonVariants(),
              "inline-flex h-auto min-h-11 items-center justify-center gap-2 rounded-2xl bg-primary px-8 py-3.5 text-sm font-semibold text-primary-foreground shadow-clarity-soft hover:bg-primary/90"
            )}
          >
            Open the check-in
            <ArrowRight className="size-4 shrink-0" aria-hidden />
          </Link>
        </div>
        <div className="mx-auto mt-14 max-w-xl text-left">
          <DisclaimerBlock variant="footer" />
        </div>
      </div>
    </section>
  );
}
