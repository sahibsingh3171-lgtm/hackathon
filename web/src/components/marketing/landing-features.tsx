import { ClipboardList, FileText, Mic2, UsersRound } from "lucide-react";

const FEATURES = [
  {
    icon: ClipboardList,
    title: "Intake and reflection",
    body: "Structured prompts meet breathing room — so patterns surface without feeling like a form dump.",
  },
  {
    icon: Mic2,
    title: "Voice or text brain dump",
    body: "Speak or type freely. The goal is honesty, not grammar — especially when shame or fatigue shows up.",
  },
  {
    icon: FileText,
    title: "Therapy prep summary",
    body: "A single readable page you can print or share: themes, questions to ask, and what you want from care.",
  },
  {
    icon: UsersRound,
    title: "Therapist matching",
    body: "Explore fit by style, focus areas, and budget assumptions — always as a starting point with a licensed clinician.",
  },
] as const;

export function LandingFeatures() {
  return (
    <section
      id="features"
      aria-labelledby="features-heading"
      className="border-t border-border/60 bg-muted/25 py-16 sm:py-20 lg:py-24"
    >
      <div className="mx-auto max-w-6xl px-clarity-section-x sm:px-10">
        <div className="max-w-2xl">
          <h2
            id="features-heading"
            className="font-heading text-3xl font-semibold tracking-tight text-foreground sm:text-4xl"
          >
            Built for the moment before the waiting room
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
            Every feature is tuned for emotional safety, plain language, and a credible handoff to
            real care.
          </p>
        </div>

        <ul className="mt-14 grid gap-8 sm:grid-cols-2 lg:gap-10">
          {FEATURES.map(({ icon: Icon, title, body }) => (
            <li
              key={title}
              className="flex flex-col rounded-3xl border border-border bg-card p-8 shadow-clarity-soft sm:p-9"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent text-primary">
                <Icon className="size-5" aria-hidden />
              </span>
              <h3 className="mt-6 font-heading text-xl font-semibold text-foreground">{title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{body}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
