"use client";

import { LifeBuoy, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useClaritySession } from "@/contexts/clarity-session-context";
import {
  CRISIS_FOOTER_LINK,
  CRISIS_PANEL_ELEVATED_CARE,
  CRISIS_PANEL_ELEVATED_LEAD,
  CRISIS_PANEL_ELEVATED_TITLE,
  CRISIS_PANEL_NOT_EMERGENCY,
  CRISIS_PANEL_URGENT_CARE,
  CRISIS_PANEL_URGENT_LEAD,
  CRISIS_PANEL_URGENT_TITLE,
} from "@/lib/clarity/crisis-copy";
import { cn } from "@/lib/utils";

/** Results-page crisis card: calm, high-contrast, never implies the app is sufficient alone. */
export function CrisisSupportPanel() {
  const { crisisSupportPanelVariant, dismissCrisisPanel } = useClaritySession();

  if (!crisisSupportPanelVariant) return null;

  const urgent = crisisSupportPanelVariant === "urgent";

  return (
    <section
      role={urgent ? "alert" : "region"}
      aria-label={urgent ? "Urgent support resources" : "Support resources"}
      className={cn(
        "mb-10 rounded-3xl border p-7 shadow-sm sm:p-9",
        urgent
          ? "border-[var(--clarity-urgent-line)] bg-[var(--clarity-urgent-bg)]"
          : "border-[var(--clarity-elevated-line)] bg-[var(--clarity-elevated-bg)]"
      )}
    >
      <div className="relative flex gap-4">
        <LifeBuoy
          className={cn(
            "mt-0.5 size-6 shrink-0",
            urgent ? "text-[var(--clarity-urgent-ink)]" : "text-[var(--clarity-elevated-ink)]"
          )}
          aria-hidden
        />
        <div className="min-w-0 flex-1 space-y-3 pr-10">
          <h2
            className={cn(
              "font-heading text-xl font-semibold tracking-tight sm:text-2xl",
              urgent ? "text-[var(--clarity-urgent-ink)]" : "text-foreground"
            )}
          >
            {urgent ? CRISIS_PANEL_URGENT_TITLE : CRISIS_PANEL_ELEVATED_TITLE}
          </h2>
          <p
            className={cn(
              "text-sm leading-relaxed sm:text-[0.9375rem]",
              urgent ? "text-[var(--clarity-urgent-ink)]/95" : "text-muted-foreground"
            )}
          >
            {urgent ? CRISIS_PANEL_URGENT_LEAD : CRISIS_PANEL_ELEVATED_LEAD}
          </p>
          <p
            className={cn(
              "text-sm font-medium leading-relaxed sm:text-[0.9375rem]",
              urgent ? "text-[var(--clarity-urgent-ink)]" : "text-foreground"
            )}
          >
            {urgent ? CRISIS_PANEL_URGENT_CARE : CRISIS_PANEL_ELEVATED_CARE}
          </p>
          <p className="text-xs leading-relaxed text-muted-foreground sm:text-sm">
            {CRISIS_PANEL_NOT_EMERGENCY}
          </p>
          <p className="text-xs text-muted-foreground">{CRISIS_FOOTER_LINK}</p>
          <p className="text-sm font-medium">
            <a
              href="tel:988"
              className="text-primary underline decoration-primary/35 underline-offset-2"
            >
              Call or text 988
            </a>
            <span className="text-muted-foreground"> · </span>
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
          className="absolute top-0 right-0 h-9 w-9 shrink-0 text-muted-foreground hover:bg-background/60"
          onClick={dismissCrisisPanel}
          aria-label="Dismiss this panel for the rest of the session"
        >
          <X className="size-4" />
        </Button>
      </div>
    </section>
  );
}
