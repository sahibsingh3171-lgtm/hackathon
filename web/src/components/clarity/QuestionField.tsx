"use client";

import type { IntakeQuestion } from "@/lib/clarity/intake-questions";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Likert } from "@/types/clarity";

import { LikertScale } from "./LikertScale";

export function QuestionField({
  question,
  value,
  onLikert,
  onText,
  disabled,
}: {
  question: IntakeQuestion;
  value: Likert | string | undefined;
  onLikert: (v: Likert) => void;
  onText: (v: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-4 rounded-3xl border border-border bg-card p-6 shadow-clarity-soft">
      <div>
        {question.type === "textarea" ? (
          <Label htmlFor={`intake-${question.id}`} className="text-base font-medium text-foreground">
            {question.title}
          </Label>
        ) : (
          <Label className="text-base font-medium text-foreground">{question.title}</Label>
        )}
        {question.description ? (
          <p className="mt-2 text-sm text-muted-foreground">{question.description}</p>
        ) : null}
      </div>
      {question.type === "likert" ? (
        <LikertScale
          value={typeof value === "number" ? value : undefined}
          onChange={onLikert}
          lowLabel={question.likertLow}
          highLabel={question.likertHigh}
          disabled={disabled}
        />
      ) : (
        <Textarea
          id={`intake-${question.id}`}
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onText(e.target.value)}
          disabled={disabled}
          rows={4}
          placeholder="Optional — share only what feels okay."
          className="min-h-[100px] resize-y rounded-2xl border-border bg-muted/30 text-foreground placeholder:text-muted-foreground/70"
        />
      )}
    </div>
  );
}
