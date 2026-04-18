export function LandingWhyMatters() {
  return (
    <section aria-labelledby="why-heading" className="py-20 sm:py-24 lg:py-28">
      <div className="clarity-container">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-16 lg:items-start">
          <div className="lg:col-span-5">
            <h2
              id="why-heading"
              className="max-w-[16ch] font-heading text-3xl font-semibold leading-tight tracking-tight text-foreground sm:text-4xl sm:leading-tight"
            >
              The gap before the first conversation
            </h2>
          </div>
          <div className="lg:col-span-7">
            <div className="rounded-3xl border border-border/45 border-l-[3px] border-l-primary/40 bg-accent/45 px-8 py-10 shadow-sm sm:px-11 sm:py-11">
              <blockquote className="font-heading text-xl font-medium leading-snug text-foreground sm:text-2xl sm:leading-snug">
                A lot of us already know talking to someone might help. What is harder is crossing
                from “maybe later” to a first session that feels possible.
              </blockquote>
              <p className="mt-8 text-base leading-relaxed text-muted-foreground">
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
