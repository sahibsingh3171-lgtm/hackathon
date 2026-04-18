import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { DisclaimerBlock } from "@/components/clarity/DisclaimerBlock";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function LandingFinalCta() {
  return (
    <section
      aria-labelledby="final-cta-heading"
      className="border-t border-border/60 bg-accent/35 py-16 sm:py-20 lg:py-24"
    >
      <div className="mx-auto max-w-3xl px-clarity-section-x text-center sm:px-10">
        <h2
          id="final-cta-heading"
          className="font-heading text-3xl font-semibold tracking-tight text-foreground sm:text-4xl"
        >
          When you are ready, we will meet you there.
        </h2>
        <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-muted-foreground">
          Take ten quiet minutes. No performance — just a clearer sentence for yourself, and
          optionally, for a therapist you choose.
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-5">
          <Link
            href="/intake"
            className={cn(
              buttonVariants(),
              "inline-flex h-auto min-h-11 items-center justify-center gap-2 rounded-2xl bg-primary px-8 py-3.5 text-sm font-semibold text-primary-foreground shadow-clarity-soft hover:bg-primary/90"
            )}
          >
            Start the check-in
            <ArrowRight className="size-4 shrink-0" aria-hidden />
          </Link>
        </div>
        <div className="mx-auto mt-12 max-w-xl text-left">
          <DisclaimerBlock variant="footer" />
        </div>
      </div>
    </section>
  );
}
