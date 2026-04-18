import { Mic, Sparkles } from "lucide-react";

/** Layered UI preview — no imagery, design-system surfaces only. */
export function LandingProductMockup() {
  return (
    <div className="relative mx-auto w-full max-w-lg lg:max-w-none" aria-hidden>
      <div className="absolute -inset-4 rounded-[2rem] bg-accent/40 blur-2xl sm:-inset-6" />
      <div className="relative space-y-4 sm:space-y-5">
        {/* Back layer */}
        <div className="clarity-surface relative z-0 ml-auto w-[88%] translate-y-2 rounded-3xl p-5 opacity-90 sm:p-6">
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Intake
          </p>
          <p className="mt-3 font-heading text-lg font-medium text-foreground">How have nights been?</p>
          <div className="mt-4 flex gap-2">
            <span className="rounded-xl border border-border bg-muted/50 px-3 py-1.5 text-xs text-muted-foreground">
              Restless
            </span>
            <span className="rounded-xl border border-primary/25 bg-accent/80 px-3 py-1.5 text-xs text-foreground">
              Mixed
            </span>
          </div>
        </div>

        {/* Middle layer */}
        <div className="clarity-surface relative z-10 -mt-8 w-[92%] rounded-3xl p-5 shadow-clarity-soft sm:-mt-10 sm:p-6">
          <div className="flex items-center gap-2 text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            <Mic className="size-3.5 text-primary" />
            Your words
          </div>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            “I keep waiting for a pause that does not come. I think I want to talk to someone — I
            just do not know how to start.”
          </p>
        </div>

        {/* Front layer */}
        <div className="clarity-surface relative z-20 -mt-6 ml-2 w-full max-w-md rounded-3xl p-5 sm:-mt-8 sm:ml-4 sm:p-7">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Prep sheet
            </p>
            <Sparkles className="size-4 text-primary" />
          </div>
          <p className="mt-4 font-heading text-xl font-semibold text-foreground">Something to bring along</p>
          <ul className="mt-4 space-y-2.5 text-sm leading-relaxed text-muted-foreground">
            <li className="flex gap-2">
              <span className="mt-2 size-1 shrink-0 rounded-full bg-primary/70" />
              Threads you named: overload, sleep, hoping to feel less alone with it
            </li>
            <li className="flex gap-2">
              <span className="mt-2 size-1 shrink-0 rounded-full bg-primary/70" />
              A question you might ask: what could change in a couple of months if this helped?
            </li>
          </ul>
          <div className="mt-6 rounded-2xl border border-border bg-muted/30 px-4 py-3 text-xs text-muted-foreground">
            Sample matches only — always check credentials, fees, and fit directly with any
            clinician.
          </div>
        </div>
      </div>
    </div>
  );
}
