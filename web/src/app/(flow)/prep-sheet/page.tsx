"use client";

/*
 * Route: `/prep-sheet` — printable one-pager from `buildPrepSheet(session)`; no separate DB row.
 */
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { Printer } from "lucide-react";

import { TherapyPrepSheetDocument } from "@/components/clarity/TherapyPrepSheetDocument";
import { StepShell } from "@/components/clarity/StepShell";
import { useClaritySession } from "@/contexts/clarity-session-context";
import { buildPrepSheet } from "@/lib/clarity/prep-sheet";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const browseMatchesAside = (
  <Link
    href="/matches"
    className={cn(
      buttonVariants({ variant: "outline" }),
      "inline-flex h-auto min-h-11 shrink-0 rounded-2xl border-border/70 px-4 py-2.5 text-sm font-medium text-foreground/90 shadow-none hover:bg-muted/50"
    )}
  >
    Browse your matches
  </Link>
);

export default function PrepSheetPage() {
  const router = useRouter();
  const { session } = useClaritySession();

  const sheet = useMemo(
    () => buildPrepSheet(session),
    [session]
  );

  return (
    <StepShell
      path="/prep-sheet"
      title="Your prep sheet"
      subtitle="One page you can print, save as PDF, or read slowly before a first session — drawn from your reflection and the structured read above."
      onBack={() => router.push("/practice-session")}
      onNext={() => router.push("/next-steps")}
      nextDisabled={!sheet}
      nextLabel="Gentle wrap-up"
      maxWidthClass="max-w-3xl"
      calmProgress
      footerAside={browseMatchesAside}
    >
      <div className="no-print mb-10 space-y-4 rounded-[1.75rem] border border-border/80 bg-muted/20 px-6 py-6 sm:px-8">
        <p className="text-sm leading-relaxed text-muted-foreground">
          Want to rehearse how you might open first?{" "}
          <Link
            href="/practice-session"
            className="font-medium text-primary underline decoration-primary/35 underline-offset-2"
          >
            Practice session
          </Link>{" "}
          — short prompts and sample lines from your reflection, not therapy itself. You can always{" "}
          <Link
            href="/matches"
            className="font-medium text-primary underline decoration-primary/35 underline-offset-2"
          >
            browse your matches
          </Link>{" "}
          again from here.
        </p>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-heading text-base font-semibold text-foreground">Print or save</p>
            <p className="mt-1 max-w-md text-sm leading-relaxed text-muted-foreground">
              Use your browser&apos;s print dialog; choose <span className="text-foreground">Save as PDF</span>{" "}
              if you want a file. Margins aim for one readable page when content allows.
            </p>
          </div>
          <Button
            type="button"
            className="h-auto shrink-0 rounded-2xl px-6 py-3 text-sm font-semibold shadow-clarity-soft"
            onClick={() => window.print()}
          >
            <Printer className="mr-2 inline size-4" aria-hidden />
            Print / PDF
          </Button>
        </div>
      </div>

      {sheet ? (
        <TherapyPrepSheetDocument sheet={sheet} />
      ) : (
        <p className="text-center text-sm text-muted-foreground">
          Preparing your sheet… if this lingers, finish your{" "}
          <Link
            href="/summary"
            className="font-medium text-primary underline decoration-primary/35 underline-offset-2"
          >
            reflection
          </Link>{" "}
          first, then return here.
        </p>
      )}
    </StepShell>
  );
}
