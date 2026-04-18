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
      className="relative border-b border-border/40 bg-muted/[0.12] py-24 sm:py-28 lg:py-36"
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-border/45 to-transparent" aria-hidden />

      <div className="clarity-container">
        <div className="max-w-3xl">
          <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.24em] text-muted-foreground/90">
            Product
          </p>
          <h2
            id="features-heading"
            className="mt-4 font-heading text-[2rem] font-semibold leading-[1.12] tracking-[-0.03em] text-foreground sm:text-4xl lg:text-[2.5rem]"
          >
            For the stretch before you book
          </h2>
          <p className="mt-6 max-w-2xl text-pretty text-lg leading-[1.65] text-muted-foreground sm:text-xl sm:leading-[1.65]">
            Plain language, room to breathe, and clear limits — so what you see here can hand off
            cleanly to a real clinician when you are ready.
          </p>
        </div>

        <ul className="mt-20 grid gap-5 sm:mt-24 sm:grid-cols-2 sm:gap-6 lg:gap-8">
          {FEATURES.map(({ icon: Icon, title, body }) => (
            <li
              key={title}
              className="flex flex-col rounded-[1.75rem] border border-border/60 bg-card p-9 shadow-[0_1px_2px_rgb(15_23_42_/0.035)] transition-[border-color,box-shadow] duration-300 hover:border-border hover:shadow-[0_1px_2px_rgb(15_23_42_/0.04),0_18px_48px_rgb(15_23_42_/0.045)] sm:p-10"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-border/50 bg-muted/25 text-primary">
                <Icon className="size-[1.125rem]" aria-hidden strokeWidth={1.75} />
              </span>
              <h3 className="mt-8 font-heading text-lg font-semibold tracking-[-0.02em] text-foreground sm:text-xl">
                {title}
              </h3>
              <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted-foreground sm:text-base sm:leading-relaxed">
                {body}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
