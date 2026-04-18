"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { ClarityLogo } from "@/components/clarity/ClarityLogo";
import { useClaritySession } from "@/contexts/clarity-session-context";
import { HEADER_CRISIS_CTA } from "@/lib/clarity/crisis-copy";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function SiteHeader() {
  const router = useRouter();
  const { resetFlow } = useClaritySession();

  return (
    <header className="no-print sticky top-0 z-40 border-b border-border/40 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/70">
      <div className="clarity-container flex h-14 items-center justify-between gap-3 sm:h-16">
        <Link
          href="/"
          className="group flex items-center gap-3 text-foreground"
          aria-label="Clarity — home"
        >
          <ClarityLogo
            size="sm"
            priority
            className="h-10 w-10 transition duration-300 group-hover:scale-[1.04] sm:h-11 sm:w-11"
          />
          <span
            className="font-heading text-[1.125rem] font-medium italic tracking-[-0.03em] sm:text-xl"
            style={{ fontFeatureSettings: '"SOFT" 1, "WONK" 1' }}
          >
            <span className="bg-gradient-to-r from-foreground to-primary/85 bg-clip-text text-transparent">
              Clarity
            </span>
          </span>
        </Link>
        <nav className="flex items-center gap-1.5 sm:gap-2">
          <a
            href="#crisis-support"
            className="inline-flex h-9 items-center rounded-lg px-2.5 text-xs font-medium text-muted-foreground transition hover:bg-muted/60 hover:text-foreground sm:px-3 sm:text-sm"
          >
            {HEADER_CRISIS_CTA}
          </a>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="hidden h-9 rounded-xl border-border/70 text-muted-foreground hover:bg-muted/40 sm:inline-flex"
            onClick={() => {
              if (
                confirm(
                  "Start a new session? What you have entered on this device will be cleared."
                )
              ) {
                resetFlow();
                router.push("/");
              }
            }}
          >
            New session
          </Button>
          <Link
            href="/brain-dump"
            className={cn(
              "inline-flex h-9 items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-clarity-soft transition hover:bg-primary/90 sm:h-10 sm:px-5"
            )}
          >
            Start
          </Link>
        </nav>
      </div>
    </header>
  );
}
