"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { LifestyleSignalsForm } from "@/components/clarity/LifestyleSignalsForm";
import { StepShell } from "@/components/clarity/StepShell";
import { useClaritySession } from "@/contexts/clarity-session-context";
import type { LifestyleSnapshot } from "@/types/clarity";

function defaultLifestyle(): LifestyleSnapshot {
  return {
    mood: 3,
    sleepQuality: 3,
    sleepHoursApprox: 7,
    stressLevel: 3,
    screenTime: { mode: "hours_estimate", hoursApprox: 4 },
  };
}

export default function LifestylePage() {
  const router = useRouter();
  const { session, setSession } = useClaritySession();
  const [draft, setDraft] = useState<LifestyleSnapshot>(() => session.lifestyle ?? defaultLifestyle());

  const valid = useMemo(() => {
    if (draft.screenTime.mode === "hours_estimate") {
      return draft.screenTime.hoursApprox != null && draft.screenTime.hoursApprox >= 0;
    }
    return true;
  }, [draft.screenTime]);

  return (
    <StepShell
      path="/lifestyle"
      title="Daily rhythms"
      subtitle="Rough estimates are enough — you are painting context for a human conversation, not filing a medical record."
      onBack={() => router.push("/intake")}
      onNext={() => {
        setSession({ lifestyle: draft });
        router.push("/summary");
      }}
      nextDisabled={!valid}
      maxWidthClass="max-w-2xl"
      calmProgress
    >
      <LifestyleSignalsForm value={draft} onChange={setDraft} />
    </StepShell>
  );
}
