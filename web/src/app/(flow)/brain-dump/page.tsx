"use client";

import { useRouter } from "next/navigation";
import { useMemo } from "react";

import { BrainDumpInput } from "@/components/clarity/BrainDumpInput";
import { StepShell } from "@/components/clarity/StepShell";
import { useClaritySession } from "@/contexts/clarity-session-context";
import { isBrainDumpLongEnough } from "@/lib/validation";
import type { BrainDump } from "@/types/clarity";

const empty: BrainDump = { text: "", voice: { status: "skipped" } };

export default function BrainDumpPage() {
  const router = useRouter();
  const { session, setSession } = useClaritySession();
  const dump = session.brainDump ?? empty;

  const ok = useMemo(() => isBrainDumpLongEnough(dump.text), [dump.text]);

  return (
    <StepShell
      path="/brain-dump"
      title="Brain dump"
      subtitle="Unstructured is perfect. You can edit before we reflect anything back."
      onBack={() => router.push("/lifestyle")}
      onNext={() => {
        setSession({ brainDump: dump });
        router.push("/summary");
      }}
      nextDisabled={!ok}
      nextLabel="Generate reflection"
    >
      <BrainDumpInput
        value={dump}
        onChange={(next) => setSession({ brainDump: next })}
      />
    </StepShell>
  );
}
