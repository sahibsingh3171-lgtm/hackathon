export function LandingWhyMatters() {
  return (
    <section
      aria-labelledby="why-heading"
      className="relative border-b border-border/40 bg-background py-24 sm:py-28 lg:py-36"
    >
      <div className="clarity-container">
        <div className="grid gap-14 lg:grid-cols-12 lg:items-start lg:gap-20">
          <div className="lg:col-span-5">
            <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.24em] text-muted-foreground/90">
              Why this exists
            </p>
            <h2
              id="why-heading"
              className="mt-4 max-w-[15ch] font-heading text-[2rem] font-semibold leading-[1.12] tracking-[-0.03em] text-foreground sm:text-4xl sm:leading-[1.1] lg:max-w-[18ch] lg:text-[2.5rem]"
            >
              The gap before the first conversation
            </h2>
          </div>
          <div className="lg:col-span-7">
            <div className="relative overflow-hidden rounded-[1.75rem] border border-border/55 bg-gradient-to-br from-card via-card to-muted/25 p-9 shadow-[0_1px_2px_rgb(15_23_42_/0.04),0_24px_60px_rgb(15_23_42_/0.05)] sm:p-11 lg:p-12">
              <div
                className="pointer-events-none absolute inset-y-0 left-0 w-[3px] bg-gradient-to-b from-primary/50 via-primary/35 to-primary/15"
                aria-hidden
              />
              <blockquote className="pl-5 font-heading text-xl font-medium leading-snug tracking-[-0.015em] text-foreground sm:pl-6 sm:text-2xl sm:leading-snug">
                A lot of us already know talking to someone might help. What is harder is crossing
                from “maybe later” to a first session that feels possible.
              </blockquote>
              <p className="mt-9 pl-5 text-base leading-[1.7] text-muted-foreground sm:pl-6 sm:text-[1.0625rem]">
                Clarity sits in that in-between: a place to notice what you are holding, see if
                support feels timely, and gather a few phrases and practical details — cost, format,
                what you hope for — so the door feels a little easier to open.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
