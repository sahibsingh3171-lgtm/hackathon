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
      className="border-b border-border/50 bg-card/25 py-20 sm:py-24 lg:py-28"
    >
      <div className="clarity-container">
        <div className="max-w-2xl">
          <h2 id="how-heading" className="font-heading text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            How it works
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
            Three steps you can move through slowly. Stop whenever you need to — nothing here is
            meant to rush you.
          </p>
        </div>

        <ol className="mt-16 grid gap-6 sm:gap-8 lg:grid-cols-3 lg:gap-8">
          {STEPS.map((item) => (
            <li key={item.step} className="clarity-surface flex flex-col rounded-3xl p-8 sm:p-10">
              <span className="font-mono text-xs font-medium uppercase tracking-[0.2em] text-primary">
                {item.step}
              </span>
              <h3 className="mt-5 font-heading text-xl font-semibold text-foreground">{item.title}</h3>
              <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">{item.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
