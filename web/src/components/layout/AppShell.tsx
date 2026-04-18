"use client";

import type { ReactNode } from "react";

import { CrisisBanner } from "@/components/clarity/CrisisBanner";
import { SiteHeader } from "@/components/clarity/SiteHeader";

/** Global chrome: canvas background, crisis strip, header, main, footer. */
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="clarity-canvas flex min-h-full flex-col">
      <CrisisBanner />
      <SiteHeader />
      <main className="relative z-10 flex flex-1 flex-col">{children}</main>
      <footer
        id="crisis-support"
        className="no-print relative z-10 scroll-mt-24 border-t border-border bg-card/60 px-clarity-section-x py-clarity-loose text-center text-xs text-muted-foreground backdrop-blur-sm"
      >
        <span className="block text-muted-foreground">
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
        <span className="mx-auto mt-2 block max-w-xl leading-relaxed">
          Clarity is a demo readiness tool — not a crisis service, diagnosis, or replacement for
          licensed care.
        </span>
      </footer>
    </div>
  );
}
