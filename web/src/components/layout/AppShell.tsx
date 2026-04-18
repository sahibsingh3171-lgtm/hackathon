"use client";

/*
 * App chrome around all routes: crisis banner strip, marketing header, main scroll region, footer with 988.
 * Judges: `(marketing)` and `(flow)` pages both render as `children` inside `<main>`.
 */
import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

import { CrisisBanner } from "@/components/clarity/CrisisBanner";
import { SiteHeader } from "@/components/clarity/SiteHeader";
import { useClaritySession } from "@/contexts/clarity-session-context";

/** Global chrome: canvas background, crisis strip, header, main, footer. */
export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { crisisSupportPanelVariant } = useClaritySession();
  /* Avoid duplicate crisis UI when summary page shows the full in-content support panel. */
  const hideCrisisBannerOnSummary =
    pathname === "/summary" && crisisSupportPanelVariant !== null;

  return (
    <div className="clarity-canvas flex min-h-full flex-col">
      {!hideCrisisBannerOnSummary ? <CrisisBanner /> : null}
      <SiteHeader />
      <main className="relative z-10 flex flex-1 flex-col">{children}</main>
      <footer
        id="crisis-support"
        className="no-print relative z-10 scroll-mt-24 border-t border-border/50 bg-card/50 px-4 py-10 text-center text-xs leading-relaxed text-muted-foreground backdrop-blur-sm sm:px-8"
      >
        <span className="mx-auto block max-w-md text-muted-foreground">
          U.S. · Call or text{" "}
          <a
            className="font-medium text-primary underline decoration-primary/30 underline-offset-2"
            href="tel:988"
          >
            988
          </a>{" "}
          ·{" "}
          <a
            className="font-medium text-primary underline decoration-primary/30 underline-offset-2"
            href="https://988lifeline.org"
            target="_blank"
            rel="noopener noreferrer"
          >
            988lifeline.org
          </a>
        </span>
        <span className="mx-auto mt-3 block max-w-lg text-[0.8125rem] leading-relaxed sm:max-w-xl">
          Clarity is a small prep companion for this demo. It does not replace a crisis line, a
          diagnosis, or ongoing care with a licensed professional.
        </span>
      </footer>
    </div>
  );
}
