"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo } from "react";

import { PracticeSessionPanel } from "@/components/clarity/PracticeSessionPanel";
import { StepShell } from "@/components/clarity/StepShell";
import { useClaritySession } from "@/contexts/clarity-session-context";
import { buildPracticeSession } from "@/lib/clarity/practice-session";
import { buttonVariants } from "@/components/ui/button";
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

export default function PracticeSessionPage() {
  const router = useRouter();
  const { session } = useClaritySession();

  const content = useMemo(() => buildPracticeSession(session), [session]);

  return (
    <StepShell
      path="/practice-session"
      title="Practice session"
      subtitle="Rehearse opening lines before you sit down with a real clinician — grounded in what you already shared, not a stand-in for therapy."
      onBack={() => router.push("/matches")}
      onNext={() => router.push("/prep-sheet")}
      nextLabel="Prep sheet"
      nextDisabled={!content}
      maxWidthClass="max-w-3xl"
      calmProgress
      footerAside={browseMatchesAside}
    >
      <p className="text-sm leading-relaxed text-muted-foreground">
        Your therapist shortlist is still here — you can{" "}
        <Link
          href="/matches"
          className="font-medium text-primary underline decoration-primary/35 underline-offset-2"
        >
          browse your matches
        </Link>{" "}
        anytime without losing this page.
      </p>
      {content ? (
        <PracticeSessionPanel content={content} />
      ) : (
        <div className="space-y-6 rounded-[1.75rem] border border-border/60 bg-muted/15 px-8 py-12 text-center">
          <p className="font-heading text-lg font-semibold text-foreground">Nothing to rehearse yet</p>
          <p className="mx-auto max-w-md text-sm leading-relaxed text-muted-foreground">
            Finish your reflection first — then we can suggest gentle wording from your own words.
          </p>
          <Link
            href="/summary"
            className={cn(
              buttonVariants({ variant: "default" }),
              "inline-flex h-auto rounded-2xl px-7 py-3.5 text-sm font-semibold shadow-clarity-soft"
            )}
          >
            Go to reflection
          </Link>
        </div>
      )}
    </StepShell>
  );
}
