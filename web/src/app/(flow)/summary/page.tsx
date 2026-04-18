"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { AISummaryPanel } from "@/components/clarity/AISummaryPanel";
import { DisclaimerBlock } from "@/components/clarity/DisclaimerBlock";
import { StepShell } from "@/components/clarity/StepShell";
import { useClaritySession } from "@/contexts/clarity-session-context";
import { Button } from "@/components/ui/button";
import type { AiSummaryResult } from "@/types/clarity";

export default function SummaryPage() {
  const router = useRouter();
  const { session, setSession } = useClaritySession();
  const [loading, setLoading] = useState(!session.summary);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (session.summary) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/clarity/summary", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            session: {
              intake: session.intake,
              lifestyle: session.lifestyle,
              brainDump: session.brainDump ?? { text: "" },
            },
          }),
        });
        if (cancelled) return;
        if (!res.ok) {
          setError("We couldn’t finish your reflection. Try again.");
          setLoading(false);
          return;
        }
        const data = (await res.json()) as { summary?: AiSummaryResult };
        if (data.summary) {
          setSession({ summary: data.summary });
        } else {
          setError("Unexpected response. Try again.");
        }
      } catch {
        if (!cancelled) setError("Network error. Check your connection and try again.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [
    attempt,
    session.summary,
    session.intake,
    session.lifestyle,
    session.brainDump,
    setSession,
  ]);

  return (
    <StepShell
      path="/summary"
      title="Your reflection"
      subtitle="Read slowly. This is perspective to explore with a licensed clinician — not a label."
      onBack={() => router.push("/brain-dump")}
      onNext={() => router.push("/next-steps")}
      nextDisabled={loading || !session.summary}
      nextLabel="See next steps"
      showNext={!!session.summary}
    >
      <DisclaimerBlock variant="inline" />
      {loading ? (
        <div className="space-y-4 py-14 text-center">
          <div className="mx-auto h-10 w-10 animate-clarity-breathe rounded-full bg-primary/25" />
          <p className="text-sm text-muted-foreground">Composing a gentle summary…</p>
        </div>
      ) : null}
      {error ? (
        <div className="rounded-3xl border border-border bg-muted/40 px-5 py-4 text-sm text-foreground">
          {error}
          <div className="mt-4">
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="rounded-xl border-border"
              onClick={() => {
                setSession({ summary: null });
                setAttempt((a) => a + 1);
              }}
            >
              Retry
            </Button>
          </div>
        </div>
      ) : null}
      {session.summary ? <AISummaryPanel summary={session.summary} /> : null}
    </StepShell>
  );
}
