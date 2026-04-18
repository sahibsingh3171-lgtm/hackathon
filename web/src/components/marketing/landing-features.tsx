import { ClipboardList, FileText, Mic2, UsersRound } from "lucide-react";

const FEATURES = [
  {
    icon: ClipboardList,
    title: "Guided check-in",
    body: "Questions with space around them — enough structure to think clearly, without feeling like a stack of forms.",
  },
  {
    icon: Mic2,
    title: "Voice or typing",
    body: "Say what is on your mind however it comes out. The point is truthfulness, not tidy sentences.",
  },
  {
    icon: FileText,
    title: "Prep sheet",
    body: "One page you can read quietly, print, or bring along: themes, questions you might ask, and what you want from care.",
  },
  {
    icon: UsersRound,
    title: "Illustrative matches",
    body: "Sample profiles ranked from what you shared — a way to imagine fit, not a directory or a promise of the right person.",
  },
] as const;

export function LandingFeatures() {
  return (
    <section
      id="features"
      aria-labelledby="features-heading"
      className="border-t border-border/50 bg-muted/20 py-20 sm:py-24 lg:py-28"
    >
      <div className="clarity-container">
        <div className="max-w-2xl">
          <h2
            id="features-heading"
            className="font-heading text-3xl font-semibold tracking-tight text-foreground sm:text-4xl"
          >
            For the stretch before you book
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
            Plain language, room to breathe, and clear limits — so what you see here can hand off
            cleanly to a real clinician when you are ready.
          </p>
        </div>

        <ul className="mt-16 grid gap-6 sm:grid-cols-2 sm:gap-8 lg:gap-10">
          {FEATURES.map(({ icon: Icon, title, body }) => (
            <li
              key={title}
              className="flex flex-col rounded-3xl border border-border/50 bg-card p-8 shadow-sm ring-1 ring-foreground/[0.02] sm:p-10"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/80 text-primary ring-1 ring-primary/10">
                <Icon className="size-5" aria-hidden />
              </span>
              <h3 className="mt-7 font-heading text-xl font-semibold tracking-tight text-foreground">
                {title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-[0.9375rem] sm:leading-relaxed">
                {body}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
