import type { AiSummaryResult, TherapyReadiness } from "@/types/clarity";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

const READINESS_COPY: Record<
  TherapyReadiness,
  { label: string; tone: string }
> = {
  unclear: {
    label: "Exploring together may help",
    tone: "border-border bg-muted/50 text-foreground",
  },
  worth_exploring: {
    label: "Speaking with a therapist could be worthwhile",
    tone: "border-primary/25 bg-accent/80 text-foreground",
  },
  strongly_consider: {
    label: "Professional support is worth prioritizing",
    tone: "border-primary/35 bg-primary/10 text-foreground",
  },
};

export function AISummaryPanel({ summary }: { summary: AiSummaryResult }) {
  const rc = READINESS_COPY[summary.therapyReadiness];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h2 className="font-heading text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          {summary.headline}
        </h2>
        {summary.usedMock ? (
          <Badge variant="outline" className="border-border text-muted-foreground">
            Offline reflection
          </Badge>
        ) : null}
      </div>

      <div className={cn("rounded-3xl border px-5 py-4 text-sm shadow-clarity-soft", rc.tone)}>
        <p className="font-medium">{rc.label}</p>
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
          This is a gentle suggestion, not a diagnosis or medical decision.
        </p>
      </div>

      <Card className="rounded-3xl border-border bg-card shadow-clarity-soft">
        <CardHeader>
          <CardTitle className="font-heading text-lg text-foreground">Themes we heard</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <ul className="list-inside list-disc space-y-2 text-sm leading-relaxed text-muted-foreground">
            {summary.keyThemes.map((t, i) => (
              <li key={i}>{t}</li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card className="rounded-3xl border-border bg-card shadow-clarity-soft">
        <CardHeader>
          <CardTitle className="font-heading text-lg text-foreground">Why therapy might help</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3 text-sm text-muted-foreground">
            {summary.rationaleBullets.map((t, i) => (
              <li key={i} className="flex gap-3">
                <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary/70" />
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <div className="rounded-3xl border border-border bg-muted/30 px-5 py-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Limitations
        </p>
        <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
          {summary.limitations.map((t, i) => (
            <li key={i}>{t}</li>
          ))}
        </ul>
      </div>

      <Separator className="bg-border" />
      <p className="text-center text-xs text-muted-foreground">
        Generated {new Date(summary.generatedAt).toLocaleString()}
      </p>
    </div>
  );
}
