"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";

import { useClaritySession } from "@/contexts/clarity-session-context";
import { HEADER_CRISIS_CTA } from "@/lib/clarity/crisis-copy";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function SiteHeader() {
  const router = useRouter();
  const { resetFlow } = useClaritySession();

  return (
    <header className="no-print sticky top-0 z-40 border-b border-border/80 bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-clarity-section-x">
        <Link href="/" className="flex items-center gap-2.5 text-foreground">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-clarity-soft">
            <Sparkles className="size-[18px]" aria-hidden />
          </span>
          <span className="font-heading text-base font-semibold tracking-tight">Clarity</span>
        </Link>
        <nav className="flex items-center gap-2 sm:gap-3">
          <a
            href="#crisis-support"
            className="inline-flex h-9 items-center rounded-xl px-2 text-xs font-medium text-primary underline-offset-4 hover:underline sm:text-sm"
          >
            {HEADER_CRISIS_CTA}
          </a>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="hidden border-border text-muted-foreground sm:inline-flex"
            onClick={() => {
              if (confirm("Start a new Clarity session? Your current draft will be cleared.")) {
                resetFlow();
                router.push("/");
              }
            }}
          >
            New session
          </Button>
          <Link
            href="/intake"
            className={cn(
              "inline-flex h-9 items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-clarity-soft transition hover:bg-primary/90"
            )}
          >
            Start
          </Link>
        </nav>
      </div>
    </header>
  );
}
