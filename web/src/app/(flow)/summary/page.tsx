"use client";

/*
 * Route: `/summary` — first visit triggers parallel `fetch` to `/api/clarity/summary` and
 * `/api/clarity/readiness-analysis`; results stored on `session` and shown in `AnalysisResultsView`.
 */
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { AnalysisResultsView } from "@/components/clarity/AnalysisResultsView";
import { CrisisSupportPanel } from "@/components/clarity/CrisisSupportPanel";
import { DisclaimerBlock } from "@/components/clarity/DisclaimerBlock";
import { StepShell } from "@/components/clarity/StepShell";
import { useClaritySession } from "@/contexts/clarity-session-context";
import { buildNextSteps } from "@/lib/clarity/next-steps-templates";
import { Button } from "@/components/ui/button";
import type { AiSummaryResult, ReadinessAnalysisApiResponseBody } from "@/types/clarity";

export default function SummaryPage() {
  const router = useRouter();
  const { session, setSession, resetCrisisPanelDismiss } = useClaritySession();
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
        const payload = {
          session: {
            intake: session.intake,
            lifestyle: session.lifestyle,
            brainDump: session.brainDump ?? { text: "" },
          },
        };
        const [summaryRes, readinessRes] = await Promise.all([
          fetch("/api/clarity/summary", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          }),
          fetch("/api/clarity/readiness-analysis", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          }),
        ]);
        if (cancelled) return;
        if (!summaryRes.ok) {
          setError("We could not finish your reflection. When you feel up to it, try again.");
          setLoading(false);
          return;
        }
        const data = (await summaryRes.json()) as { summary?: AiSummaryResult };
        if (!data.summary) {
          setError("Something came back incomplete. Try again in a moment.");
          setLoading(false);
          return;
        }
        let readinessAnalysis: ReadinessAnalysisApiResponseBody["analysis"] | null = null;
        if (readinessRes.ok) {
          const ra = (await readinessRes.json()) as ReadinessAnalysisApiResponseBody;
          if (ra?.analysis) readinessAnalysis = ra.analysis;
        }
        setSession({
          summary: data.summary,
          readinessAnalysis,
          nextSteps: buildNextSteps(data.summary.tags),
        });
      } catch {
        if (!cancelled) {
          setError("We could not reach the server. Check your connection and try again when you can.");
        }
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
      title={session.summary ? "Your reflection" : "Gathering your reflection"}
      subtitle={
        session.summary
          ? "Read at whatever pace feels kind. This does not replace a licensed professional — it is here to organize what you already know so it is easier to share."
          : "Take your time once it appears. What follows is perspective to sort through with a clinician — not a verdict."
      }
      onBack={() => router.push("/lifestyle")}
      onNext={() => router.push("/matches")}
      nextDisabled={loading || !session.summary}
      nextLabel="Explore matches"
      showNext={!!session.summary}
      maxWidthClass={session.summary ? "max-w-3xl" : "max-w-2xl"}
      calmProgress={!!session.summary}
    >
      <div className="mb-2 max-w-xl">
        <DisclaimerBlock variant="inline" />
      </div>
      {session.summary ? <CrisisSupportPanel /> : null}
      {loading ? (
        <div className="flex flex-col items-center justify-center gap-5 py-16 sm:py-20">
          <div className="h-11 w-11 animate-clarity-breathe rounded-full bg-primary/20 ring-4 ring-primary/5" />
          <p className="max-w-xs text-center text-sm leading-relaxed text-muted-foreground">
            Putting your summary together…
          </p>
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
                resetCrisisPanelDismiss();
                setSession({ summary: null, readinessAnalysis: null, nextSteps: null });
                setAttempt((a) => a + 1);
              }}
            >
              Try again
            </Button>
          </div>
        </div>
      ) : null}
      {session.summary ? (
        <AnalysisResultsView
          session={{
            summary: session.summary,
            readinessAnalysis: session.readinessAnalysis,
            lifestyle: session.lifestyle,
            intake: session.intake,
          }}
        />
      ) : null}
    </StepShell>
  );
}
