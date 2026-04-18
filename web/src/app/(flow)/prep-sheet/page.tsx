"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { Printer } from "lucide-react";

import { TherapyPrepSheetDocument } from "@/components/clarity/TherapyPrepSheetDocument";
import { StepShell } from "@/components/clarity/StepShell";
import { useClaritySession } from "@/contexts/clarity-session-context";
import { buildPrepSheet } from "@/lib/clarity/prep-sheet";
import { Button } from "@/components/ui/button";

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
      onBack={() => router.push("/matches")}
      onNext={() => router.push("/next-steps")}
      nextDisabled={!sheet}
      nextLabel="Gentle wrap-up"
      maxWidthClass="max-w-3xl"
      calmProgress
    >
      <div className="no-print mb-10 space-y-4 rounded-[1.75rem] border border-border/80 bg-muted/20 px-6 py-6 sm:px-8">
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
