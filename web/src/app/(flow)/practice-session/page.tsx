"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { BookOpenCheck, MessagesSquare } from "lucide-react";

import { PracticeChat } from "@/components/clarity/PracticeChat";
import { PracticeSessionPanel } from "@/components/clarity/PracticeSessionPanel";
import { StepShell } from "@/components/clarity/StepShell";
import { useClaritySession } from "@/contexts/clarity-session-context";
import { buildPracticeSession } from "@/lib/clarity/practice-session";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Mode = "chat" | "examples";

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
  const [mode, setMode] = useState<Mode>("chat");

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
        <>
          <ModeToggle value={mode} onChange={setMode} />
          <div className="mt-2">
            {mode === "chat" ? (
              <PracticeChat
                afterEndAside={
                  <Link
                    href="/prep-sheet"
                    className={cn(
                      buttonVariants({ variant: "ghost" }),
                      "rounded-2xl px-4 text-sm font-medium text-foreground/80"
                    )}
                  >
                    Continue to prep sheet
                  </Link>
                }
              />
            ) : (
              <PracticeSessionPanel content={content} />
            )}
          </div>
        </>
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

function ModeToggle({ value, onChange }: { value: Mode; onChange: (m: Mode) => void }) {
  return (
    <div
      role="tablist"
      aria-label="Practice mode"
      className="inline-flex rounded-full border border-border/60 bg-muted/[0.18] p-1 text-sm"
    >
      <button
        role="tab"
        aria-selected={value === "chat"}
        onClick={() => onChange("chat")}
        className={cn(
          "inline-flex items-center gap-2 rounded-full px-4 py-2 font-medium transition-colors",
          value === "chat"
            ? "bg-card text-foreground shadow-[0_1px_2px_rgb(15_23_42_/0.06)]"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        <MessagesSquare className="size-4" aria-hidden />
        Interactive rehearsal
      </button>
      <button
        role="tab"
        aria-selected={value === "examples"}
        onClick={() => onChange("examples")}
        className={cn(
          "inline-flex items-center gap-2 rounded-full px-4 py-2 font-medium transition-colors",
          value === "examples"
            ? "bg-card text-foreground shadow-[0_1px_2px_rgb(15_23_42_/0.06)]"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        <BookOpenCheck className="size-4" aria-hidden />
        Guided examples
      </button>
    </div>
  );
}
