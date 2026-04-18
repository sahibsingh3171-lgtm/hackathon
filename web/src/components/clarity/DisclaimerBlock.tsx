import { cn } from "@/lib/utils";

const COPY = {
  hero: {
    title: "What Clarity is — and is not",
    body: "Clarity is here to help you think things through and get ready to talk with someone trained to help. It is not medical advice, therapy, or a crisis service.",
  },
  inline: {
    title: "A gentle boundary",
    body: "Use this alongside care from a licensed clinician — not instead of it.",
  },
  footer: {
    title: "If you need help right now",
    body: "If you might be in danger, call your local emergency number. In the U.S., you can call or text 988 for free, confidential support, any time.",
  },
} as const;

type Variant = keyof typeof COPY;

export function DisclaimerBlock({
  variant,
  className,
}: {
  variant: Variant;
  className?: string;
}) {
  const { title, body } = COPY[variant];
  return (
    <aside
      className={cn(
        "rounded-3xl border border-border/50 bg-card px-6 py-5 text-sm leading-relaxed text-muted-foreground shadow-sm ring-1 ring-foreground/[0.02]",
        variant === "hero" &&
          "border-primary/18 bg-accent/55 text-muted-foreground shadow-none ring-primary/5",
        className
      )}
    >
      <p className="font-heading text-base font-medium text-foreground">{title}</p>
      <p className="mt-2">{body}</p>
    </aside>
  );
}
