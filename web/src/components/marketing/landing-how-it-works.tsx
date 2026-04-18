const STEPS = [
  {
    step: "01",
    title: "Check in honestly",
    body: "A short guided intake captures how you are doing — mood, stress, sleep, and what matters most — without rushing you.",
  },
  {
    step: "02",
    title: "Say it your way",
    body: "Use voice or text to brain dump what is hard to say out loud. Nothing has to sound polished.",
  },
  {
    step: "03",
    title: "Leave with direction",
    body: "A calm prep summary and therapist-style matches help you budget time, cost, and fit before you book.",
  },
] as const;

export function LandingHowItWorks() {
  return (
    <section
      id="how-it-works"
      aria-labelledby="how-heading"
      className="border-b border-border/60 bg-card/30 py-16 sm:py-20 lg:py-24"
    >
      <div className="mx-auto max-w-6xl px-clarity-section-x sm:px-10">
        <div className="max-w-2xl">
          <h2 id="how-heading" className="font-heading text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            How it works
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
            Three gentle steps. Stop anywhere — your reflections stay yours.
          </p>
        </div>

        <ol className="mt-14 grid gap-8 lg:grid-cols-3 lg:gap-10">
          {STEPS.map((item) => (
            <li key={item.step} className="clarity-surface flex flex-col rounded-3xl p-8 sm:p-9">
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
