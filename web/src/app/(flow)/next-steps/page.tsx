"use client";

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
      title="Low-friction next steps"
      subtitle="Small actions you can try today — plus signals for when professional support helps."
      onBack={() => router.push("/summary")}
      onNext={() => router.push("/prep-sheet")}
      nextDisabled={!session.nextSteps?.length}
      nextLabel="Build prep sheet"
    >
      {session.nextSteps?.length ? (
        <NextStepsList items={session.nextSteps} />
      ) : (
        <p className="text-sm text-muted-foreground">Loading suggestions…</p>
      )}
    </StepShell>
  );
}
