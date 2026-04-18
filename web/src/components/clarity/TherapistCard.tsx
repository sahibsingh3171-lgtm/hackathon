import type { Therapist } from "@/types/clarity";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function TherapistCard({ therapist }: { therapist: Therapist }) {
  return (
    <Card className="rounded-3xl border-border bg-card shadow-clarity-soft">
      <CardHeader className="pb-2">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <CardTitle className="font-heading text-lg text-foreground">{therapist.name}</CardTitle>
          <div className="flex flex-col items-end gap-1 text-right">
            {therapist.matchScore != null ? (
              <span className="rounded-full bg-primary/12 px-2.5 py-0.5 text-xs font-semibold text-primary">
                Match {therapist.matchScore}
              </span>
            ) : null}
            <span className="text-sm font-medium text-primary">
              ★ {therapist.reviewScore.toFixed(1)}{" "}
              <span className="text-muted-foreground">({therapist.reviewCount})</span>
            </span>
          </div>
        </div>
        {therapist.matchExplanation ? (
          <p className="text-sm leading-relaxed text-foreground">{therapist.matchExplanation}</p>
        ) : therapist.matchReason ? (
          <p className="text-sm text-primary/90">{therapist.matchReason}</p>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-4 text-sm text-muted-foreground">
        <p className="leading-relaxed">{therapist.bioShort}</p>
        <div className="flex flex-wrap gap-2">
          {therapist.specialties.map((s) => (
            <Badge key={s} variant="secondary" className="rounded-full bg-muted font-normal">
              {s}
            </Badge>
          ))}
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          {therapist.modalities.map((m) => (
            <span
              key={m}
              className="rounded-full border border-border bg-muted/40 px-3 py-1 text-muted-foreground"
            >
              {m === "in_person" ? "In person" : "Telehealth"}
            </span>
          ))}
          {therapist.priceFromUsd != null ? (
            <span className="rounded-full border border-border bg-muted/40 px-3 py-1 text-foreground">
              From ${therapist.priceFromUsd}
              <span className="text-muted-foreground"> · mock</span>
            </span>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {therapist.insuranceTags.map((tag) => (
            <Badge key={tag} variant="outline" className="rounded-full border-border font-normal">
              {tag}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
