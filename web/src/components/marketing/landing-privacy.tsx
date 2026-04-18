import { Lock, Shield } from "lucide-react";

export function LandingPrivacy() {
  return (
    <section aria-labelledby="privacy-heading" className="py-20 sm:py-24 lg:py-28">
      <div className="clarity-container">
        <div className="clarity-surface rounded-3xl p-8 sm:p-11 lg:p-12">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 lg:items-center">
            <div>
              <h2 id="privacy-heading" className="font-heading text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                Privacy, said simply
              </h2>
              <p className="mt-5 text-base leading-relaxed text-muted-foreground">
                What you share here matters. For this demo, your answers stay in the browser on this
                device until you clear them — no account, no cloud save of your session by default.
              </p>
            </div>
            <ul className="space-y-8">
              <li className="flex gap-5">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-accent/90 text-primary ring-1 ring-primary/10">
                  <Lock className="size-4" aria-hidden />
                </span>
                <div>
                  <p className="font-heading text-base font-medium text-foreground">On this device</p>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    Your flow is stored locally for the demo. You can start fresh anytime from the
                    header.
                  </p>
                </div>
              </li>
              <li className="flex gap-5">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-accent/90 text-primary ring-1 ring-primary/10">
                  <Shield className="size-4" aria-hidden />
                </span>
                <div>
                  <p className="font-heading text-base font-medium text-foreground">What we cannot do</p>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
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
