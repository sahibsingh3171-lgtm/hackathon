import { Lock, Shield } from "lucide-react";

export function LandingPrivacy() {
  return (
    <section aria-labelledby="privacy-heading" className="relative bg-background py-24 sm:py-28 lg:py-36">
      <div className="clarity-container">
        <div className="overflow-hidden rounded-[1.75rem] border border-border/55 bg-gradient-to-br from-card via-card to-muted/15 shadow-[0_1px_2px_rgb(15_23_42_/0.04),0_28px_70px_rgb(15_23_42_/0.045)]">
          <div className="grid gap-14 px-8 py-12 sm:gap-16 sm:px-11 sm:py-14 lg:grid-cols-2 lg:items-center lg:gap-20 lg:px-14 lg:py-16">
            <div>
              <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.24em] text-muted-foreground/90">
                Trust
              </p>
              <h2
                id="privacy-heading"
                className="mt-4 font-heading text-[2rem] font-semibold leading-[1.12] tracking-[-0.03em] text-foreground sm:text-4xl lg:text-[2.5rem]"
              >
                Privacy, said simply
              </h2>
              <p className="mt-6 max-w-md text-base leading-[1.7] text-muted-foreground sm:text-[1.0625rem]">
                What you share here matters. For this demo, your answers stay in the browser on this
                device until you clear them — no account, no cloud save of your session by default.
              </p>
            </div>
            <ul className="space-y-10 sm:space-y-11">
              <li className="flex gap-5">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-border/50 bg-muted/20 text-primary">
                  <Lock className="size-4" aria-hidden strokeWidth={1.75} />
                </span>
                <div>
                  <p className="font-heading text-base font-semibold tracking-[-0.01em] text-foreground">
                    On this device
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-[0.9375rem] sm:leading-relaxed">
                    Your flow is stored locally for the demo. You can start fresh anytime from the
                    header.
                  </p>
                </div>
              </li>
              <li className="flex gap-5">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-border/50 bg-muted/20 text-primary">
                  <Shield className="size-4" aria-hidden strokeWidth={1.75} />
                </span>
                <div>
                  <p className="font-heading text-base font-semibold tracking-[-0.01em] text-foreground">
                    What we cannot do
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-[0.9375rem] sm:leading-relaxed">
                    Clarity does not diagnose, treat, or watch over you in a crisis. If you need
                    immediate help, use 988 or local services — links are in the footer.
                  </p>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
