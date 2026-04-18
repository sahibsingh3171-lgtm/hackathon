export function LandingWhyMatters() {
  return (
    <section aria-labelledby="why-heading" className="py-16 sm:py-20 lg:py-24">
      <div className="mx-auto max-w-6xl px-clarity-section-x sm:px-10">
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-16 lg:items-start">
          <div className="lg:col-span-5">
            <h2 id="why-heading" className="font-heading text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Why therapy feels hard before it starts
            </h2>
          </div>
          <div className="lg:col-span-7">
            <div className="rounded-3xl border-l-[3px] border-primary/35 bg-accent/50 px-8 py-9 sm:px-10 sm:py-10">
              <blockquote className="font-heading text-xl font-medium leading-snug text-foreground sm:text-2xl">
                Most people do not need convincing that support helps. They need a bridge between
                “I should probably…” and a first conversation that feels survivable.
              </blockquote>
              <p className="mt-8 text-base leading-relaxed text-muted-foreground">
                Clarity exists in that gap: not to replace a therapist, but to help you name what
                you are carrying, decide if timing feels right, and walk in with language you trust
                — including budget and modality preferences you actually care about.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
