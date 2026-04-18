"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { MatchFilters } from "@/components/clarity/MatchFilters";
import { TherapistCard } from "@/components/clarity/TherapistCard";
import { StepShell } from "@/components/clarity/StepShell";
import { useClaritySession } from "@/contexts/clarity-session-context";
import { MOCK_THERAPISTS } from "@/data/therapists";
import { matchTherapists } from "@/lib/therapist";
import type { MatchPreferences } from "@/types/clarity";

const defaultPrefs: MatchPreferences = {
  specialties: [],
  modality: "any",
  insurance: [],
};

export default function MatchesPage() {
  const router = useRouter();
  const { session, setSession } = useClaritySession();
  const [prefs, setPrefs] = useState<MatchPreferences>(
    () => session.matchPreferences ?? defaultPrefs
  );

  const results = useMemo(() => matchTherapists(MOCK_THERAPISTS, prefs), [prefs]);

  return (
    <StepShell
      path="/matches"
      title="Therapist matches (demo)"
      subtitle="Illustrative profiles only — not a directory, booking tool, or endorsement."
      onBack={() => router.push("/prep-sheet")}
      onNext={() => router.push("/")}
      nextLabel="Back to home"
      showNext
    >
      <MatchFilters
        value={prefs}
        onChange={(next) => {
          setPrefs(next);
          setSession({ matchPreferences: next });
        }}
      />
      <p className="text-center text-xs text-muted-foreground">
        Showing {results.length} mock profiles · filters apply instantly in your browser
      </p>
      <ul className="space-y-5">
        {results.map((t) => (
          <li key={t.id}>
            <TherapistCard therapist={t} />
          </li>
        ))}
      </ul>
    </StepShell>
  );
}
