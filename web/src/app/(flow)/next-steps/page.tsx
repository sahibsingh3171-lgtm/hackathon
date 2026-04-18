"use client";

/*
 * Route: `/next-steps` — closing checklist; `buildNextSteps` runs once from summary tags if missing.
 */
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { NextStepsList } from "@/components/clarity/NextStepsList";
import { StepShell } from "@/components/clarity/StepShell";
import { useClaritySession } from "@/contexts/clarity-session-context";
import { buildNextSteps } from "@/lib/clarity/next-steps-templates";

export default function NextStepsPage() {
  const router = useRouter();
  const { session, setSession } = useClaritySession();

  useEffect(() => {
    if (!session.summary) return;
    if (session.nextSteps?.length) return;
    const steps = buildNextSteps(session.summary.tags);
    setSession({ nextSteps: steps });
  }, [session.summary, session.nextSteps?.length, setSession]);

  return (
    <StepShell
      path="/next-steps"
      title="Before you close the tab"
      subtitle="A few small moves if you want them — plus reminders of when talking to a professional might help."
      onBack={() => router.push("/prep-sheet")}
      onNext={() => router.push("/")}
      nextDisabled={!session.nextSteps?.length}
      nextLabel="Return home"
    >
      {session.nextSteps?.length ? (
        <NextStepsList items={session.nextSteps} />
      ) : (
        <p className="text-sm text-muted-foreground">Gathering ideas…</p>
      )}
    </StepShell>
  );
}
