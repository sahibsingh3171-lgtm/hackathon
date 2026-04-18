"use client";

import { LifeBuoy, X } from "lucide-react";

import { useClaritySession } from "@/contexts/clarity-session-context";
import {
  CRISIS_ELEVATED_BODY,
  CRISIS_ELEVATED_TITLE,
  CRISIS_FOOTER_LINK,
  CRISIS_URGENT_BODY,
  CRISIS_URGENT_TITLE,
} from "@/lib/clarity/crisis-copy";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function CrisisBanner() {
  const { crisisLevel, crisisBannerVisible, dismissCrisisBanner } = useClaritySession();

  if (!crisisBannerVisible) return null;

  const urgent = crisisLevel === "urgent";

  return (
    <div
      role="alert"
      className={cn(
        "border-b px-clarity-section-x py-4",
        urgent
          ? "border-[var(--clarity-urgent-line)] bg-[var(--clarity-urgent-bg)]"
          : "border-[var(--clarity-elevated-line)] bg-[var(--clarity-elevated-bg)]"
      )}
    >
      <div className="relative mx-auto flex max-w-3xl gap-4">
        <LifeBuoy
          className={cn(
            "mt-0.5 size-5 shrink-0",
            urgent ? "text-[var(--clarity-urgent-ink)]" : "text-muted-foreground"
          )}
          aria-hidden
        />
        <div className="min-w-0 flex-1 pr-10">
          <p
            className={cn(
              "font-heading text-lg font-semibold tracking-tight",
              urgent ? "text-[var(--clarity-urgent-ink)]" : "text-foreground"
            )}
          >
            {urgent ? CRISIS_URGENT_TITLE : CRISIS_ELEVATED_TITLE}
          </p>
          <p
            className={cn(
              "mt-2 text-sm leading-relaxed",
              urgent ? "text-[var(--clarity-urgent-ink)]/95" : "text-muted-foreground"
            )}
          >
            {urgent ? CRISIS_URGENT_BODY : CRISIS_ELEVATED_BODY}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">{CRISIS_FOOTER_LINK}</p>
          <p className="mt-3 text-xs font-medium text-foreground">
            <a
              href="tel:988"
              className="text-primary underline decoration-primary/35 underline-offset-2"
            >
              Call or text 988
            </a>
            {" · "}
            <a
              href="https://988lifeline.org"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline decoration-primary/35 underline-offset-2"
            >
              988lifeline.org
            </a>
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute top-0 right-0 h-9 w-9 shrink-0 text-muted-foreground hover:bg-muted"
          onClick={dismissCrisisBanner}
          aria-label="Dismiss crisis resources banner"
        >
          <X className="size-4" />
        </Button>
      </div>
    </div>
  );
}
