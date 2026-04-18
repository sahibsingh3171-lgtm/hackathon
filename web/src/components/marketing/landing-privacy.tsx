import { Lock, Shield } from "lucide-react";

export function LandingPrivacy() {
  return (
    <section aria-labelledby="privacy-heading" className="py-16 sm:py-20 lg:py-24">
      <div className="mx-auto max-w-6xl px-clarity-section-x sm:px-10">
        <div className="clarity-surface rounded-[1.75rem] p-8 sm:p-10 lg:p-12">
          <div className="grid gap-10 lg:grid-cols-2 lg:gap-14 lg:items-center">
            <div>
              <h2 id="privacy-heading" className="font-heading text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                Privacy and trust, without the fine print theater
              </h2>
              <p className="mt-5 text-base leading-relaxed text-muted-foreground">
                We treat readiness work as sensitive by default. This demo keeps your flow in the
                browser session — designed so judges can see the product without signing up for
                another account they will forget.
              </p>
            </div>
            <ul className="space-y-6">
              <li className="flex gap-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent text-primary">
                  <Lock className="size-4" aria-hidden />
                </span>
                <div>
                  <p className="font-heading text-base font-medium text-foreground">Session-first storage</p>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    Your answers stay on this device for the demo path — clear the session anytime
                    from the header.
                  </p>
                </div>
              </li>
              <li className="flex gap-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent text-primary">
                  <Shield className="size-4" aria-hidden />
                </span>
                <div>
                  <p className="font-heading text-base font-medium text-foreground">Honest limits</p>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    Clarity does not diagnose, treat, or monitor crises. For emergencies, use 988
                    or local services — linked in the site footer.
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
