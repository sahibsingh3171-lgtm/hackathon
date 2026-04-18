import type { NextStepItem } from "@/types/clarity";
import { BookOpen, HeartPulse, Stethoscope } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

function Icon({ category }: { category: NextStepItem["category"] }) {
  const cls = "size-5 shrink-0 text-primary";
  if (category === "education") return <BookOpen className={cls} aria-hidden />;
  if (category === "self_care") return <HeartPulse className={cls} aria-hidden />;
  return <Stethoscope className={cls} aria-hidden />;
}

export function NextStepsList({ items }: { items: NextStepItem[] }) {
  return (
    <ul className="space-y-5">
      {items.map((item) => (
        <li key={item.id}>
          <Card className="rounded-3xl border-border bg-card shadow-clarity-soft transition hover:border-primary/20">
            <CardContent className="flex gap-5 p-6 sm:p-7">
              <div
                className={cn(
                  "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl",
                  "border border-border bg-accent/50"
                )}
              >
                <Icon category={item.category} />
              </div>
              <div className="min-w-0">
                <p className="font-heading font-medium text-foreground">{item.title}</p>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {item.description}
                </p>
              </div>
            </CardContent>
          </Card>
        </li>
      ))}
    </ul>
  );
}
