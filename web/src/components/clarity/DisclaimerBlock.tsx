import { cn } from "@/lib/utils";

const COPY = {
  hero: {
    title: "Clarity is not a diagnosis",
    body: "Clarity helps you reflect and prepare for a conversation with a licensed professional. It does not provide medical advice, therapy, or crisis services.",
  },
  inline: {
    title: "Reminder",
    body: "This is educational prep—not a substitute for care from a qualified clinician.",
  },
  footer: {
    title: "Limits of this tool",
    body: "If you are in immediate danger, call your local emergency number. In the U.S., call or text 988 for confidential support.",
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
        "rounded-3xl border border-border bg-card px-5 py-4 text-sm leading-relaxed text-muted-foreground shadow-clarity-soft",
        variant === "hero" &&
          "border-primary/20 bg-accent/60 text-muted-foreground shadow-none",
        className
      )}
    >
      <p className="font-heading text-base font-medium text-foreground">{title}</p>
      <p className="mt-2">{body}</p>
    </aside>
  );
}
