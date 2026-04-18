import { HelpCircle } from "lucide-react";

type FaqItem = { q: string; a: string };

const FAQ: readonly FaqItem[] = [
  {
    q: "Do I have to write a lot?",
    a: "No. A line or two is enough. Anything you share helps us skip questions we would otherwise ask — but blank is also a valid choice, and the check-in works either way.",
  },
  {
    q: "What happens to what I write?",
    a: "For this demo, your words stay on this device during your session and are cleared on refresh. We use them to draft a few answers for you to review — nothing is sent for storage, scoring, or sharing.",
  },
  {
    q: "Can I skip this and just fill in the check-in?",
    a: "Yes. The button underneath takes you to the full 28-question check-in, unchanged. Nothing here assumes you wrote a note.",
  },
  {
    q: "Will the AI put words in my mouth?",
    a: "No. Anything we infer from your note is shown clearly in the check-in as a suggestion — you can keep it, edit it, or replace it. You are always the final author.",
  },
  {
    q: "Is this therapy or a diagnosis?",
    a: "No. Clarity is not treatment, not a diagnosis, and not a crisis service. If you need urgent support, please call or text 988 (U.S.) or use your local emergency number.",
  },
] as const;

export function BrainDumpFaq() {
  return (
    <section
      aria-labelledby="faq-heading"
      className="relative overflow-hidden rounded-[1.5rem] border border-border/55 bg-card/90 px-6 py-6 shadow-[0_1px_2px_rgb(15_23_42_/0.03)] sm:px-7 sm:py-7"
    >
      <div className="flex items-center gap-2.5">
        <span className="flex size-8 items-center justify-center rounded-xl border border-border/60 bg-muted/30 text-primary">
          <HelpCircle className="size-3.5" strokeWidth={1.75} aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="text-[0.625rem] font-semibold uppercase tracking-[0.22em] text-muted-foreground/90">
            Before you start
          </p>
          <h3
            id="faq-heading"
            className="mt-1 font-heading text-[0.95rem] font-semibold tracking-[-0.01em] text-foreground"
          >
            A few quiet answers, in case you are wondering
          </h3>
        </div>
      </div>
      <dl className="mt-5 divide-y divide-border/45">
        {FAQ.map((item) => (
          <details
            key={item.q}
            className="group py-3.5 first:pt-0 last:pb-0 [&>summary::-webkit-details-marker]:hidden"
          >
            <summary className="flex cursor-pointer items-center justify-between gap-4 text-[0.875rem] font-medium text-foreground/90 transition hover:text-foreground">
              <span>{item.q}</span>
              <span
                aria-hidden
                className="shrink-0 text-xs text-muted-foreground transition group-open:rotate-180"
              >
                ⌄
              </span>
            </summary>
            <dd className="mt-2 pr-6 text-[0.875rem] leading-relaxed text-muted-foreground">
              {item.a}
            </dd>
          </details>
        ))}
      </dl>
    </section>
  );
}
