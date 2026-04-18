const STEPS = [
  {
    step: "01",
    title: "Put it into words",
    body: "Start with an open space for your words — messy is fine. Prefer structure first? The same thoughtful check-in is there when you choose it.",
  },
  {
    step: "02",
    title: "Check in at your pace",
    body: "We only ask what is still missing after your words — mood, stress, sleep, and practical details, one screen at a time.",
  },
  {
    step: "03",
    title: "Carry something forward",
    body: "A readable summary, optional match ideas, and a prep sheet you can print or bring to a first conversation.",
  },
] as const;

export function LandingHowItWorks() {
  return (
    <section
      id="how-it-works"
      aria-labelledby="how-heading"
      className="relative border-b border-border/40 bg-[linear-gradient(180deg,rgb(246_243_237)_0%,rgb(252_251_249)_55%,rgb(255_255_255_/0.92)_100%)] py-24 sm:py-28 lg:py-36"
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-border/50 to-transparent" aria-hidden />

      <div className="clarity-container">
        <div className="max-w-3xl">
          <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.24em] text-muted-foreground/90">
            Flow
          </p>
          <h2
            id="how-heading"
            className="mt-4 font-heading text-[2rem] font-semibold leading-[1.12] tracking-[-0.03em] text-foreground sm:text-4xl sm:leading-[1.1] lg:text-[2.5rem]"
          >
            How it works
          </h2>
          <p className="mt-6 max-w-2xl text-pretty text-lg leading-[1.65] text-muted-foreground sm:text-xl sm:leading-[1.65]">
            Three steps you can move through slowly. Stop whenever you need to — nothing here is
            meant to rush you.
          </p>
        </div>

        <ol className="mt-20 grid gap-5 sm:mt-24 sm:gap-6 lg:grid-cols-3 lg:gap-8">
          {STEPS.map((item) => (
            <li
              key={item.step}
              className="group flex flex-col rounded-[1.75rem] border border-border/60 bg-card/90 p-9 shadow-[0_1px_2px_rgb(15_23_42_/0.04),0_20px_50px_rgb(15_23_42_/0.04)] transition-[border-color,box-shadow] duration-300 hover:border-primary/20 hover:shadow-[0_1px_2px_rgb(15_23_42_/0.05),0_24px_56px_rgb(111_143_120_/0.07)] sm:p-10"
            >
              <span className="font-mono text-[0.6875rem] font-medium uppercase tracking-[0.22em] text-primary/90">
                {item.step}
              </span>
              <h3 className="mt-6 font-heading text-xl font-semibold tracking-[-0.02em] text-foreground sm:text-[1.35rem]">
                {item.title}
              </h3>
              <p className="mt-4 flex-1 text-[0.9375rem] leading-relaxed text-muted-foreground sm:text-base sm:leading-relaxed">
                {item.body}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
