"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { BrainDumpInput } from "@/components/clarity/BrainDumpInput";
import { StepShell } from "@/components/clarity/StepShell";
import { Button } from "@/components/ui/button";
import { useClaritySession } from "@/contexts/clarity-session-context";
import { mergeIntakePreferExisting } from "@/lib/ai/intake-extraction";
import { isBrainDumpLongEnough } from "@/lib/validation";
import type { BrainDump, IntakeAnswers } from "@/types/clarity";

const empty: BrainDump = { text: "", themes: [], voice: { status: "skipped" } };

type ExtractResponse = {
  intakePatch?: Partial<IntakeAnswers>;
  inferredStepIds?: string[];
  error?: string;
};

export default function BrainDumpPage() {
  const router = useRouter();
  const { session, setSession } = useClaritySession();
  const [extracting, setExtracting] = useState(false);
  const [extractError, setExtractError] = useState<string | null>(null);

  const dump = useMemo((): BrainDump => {
    const raw = session.brainDump;
    if (!raw) return empty;
    if (raw.themes?.length) return raw;
    const fromIntake = session.intake.brain_dump_tags;
    if (Array.isArray(fromIntake) && fromIntake.length) {
      return { ...raw, themes: [...fromIntake] };
    }
    return raw;
  }, [session.brainDump, session.intake.brain_dump_tags]);

  const ok = useMemo(() => isBrainDumpLongEnough(dump.text), [dump.text]);

  const goIntakeCleared = () => {
    setSession({
      brainDump: null,
      intakeInferredStepIds: [],
      intakeConfirmedStepIds: [],
      intake: { ...session.intake, intakeFlowStep: 0 },
    });
    router.push("/intake");
  };

  const continueWithExtraction = async () => {
    setExtractError(null);
    setExtracting(true);
    const tags = dump.themes?.filter(Boolean) ?? [];
    const intakePayload: IntakeAnswers = {
      ...session.intake,
      brain_dump_tags: tags.length ? tags : session.intake.brain_dump_tags,
    };
    setSession({ brainDump: dump, intake: intakePayload });
    try {
      const res = await fetch("/api/clarity/intake-from-brain-dump", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brainDump: dump,
          intake: intakePayload,
        }),
      });
      const data = (await res.json()) as ExtractResponse;
      if (!res.ok) {
        setExtractError(
          data.error ??
            "We could not shape suggestions from your note just now. Your words are still saved — the next screens will walk you through everything at an easy pace."
        );
        setSession({
          brainDump: dump,
          intake: { ...intakePayload, intakeFlowStep: 0 },
          intakeInferredStepIds: [],
          intakeConfirmedStepIds: [],
        });
        router.push("/intake");
        return;
      }
      const patch = data.intakePatch ?? {};
      const inferred = Array.isArray(data.inferredStepIds) ? data.inferredStepIds : [];
      const merged = mergeIntakePreferExisting(intakePayload, patch);
      setSession({
        brainDump: dump,
        intake: {
          ...merged,
          brain_dump_tags: tags.length ? tags : merged.brain_dump_tags,
          intakeFlowStep: 0,
        },
        intakeInferredStepIds: inferred,
        intakeConfirmedStepIds: [],
      });
      router.push("/intake");
    } catch {
      setExtractError(
        "Connection hiccup — your note is saved. We will take you through the full check-in so nothing gets lost."
      );
      setSession({
        brainDump: dump,
        intake: { ...intakePayload, intakeFlowStep: 0 },
        intakeInferredStepIds: [],
        intakeConfirmedStepIds: [],
      });
      router.push("/intake");
    } finally {
      setExtracting(false);
    }
  };

  return (
    <div className="relative flex flex-1 flex-col">
      <div
        className="pointer-events-none absolute inset-0 opacity-50"
        aria-hidden
        style={{
          backgroundImage: `radial-gradient(ellipse 100% 60% at 50% -15%, rgb(255 255 255 / 0.7), transparent 50%)`,
        }}
      />
      <div className="relative flex-1">
        <StepShell
          path="/brain-dump"
          title="Listen first, in your own words"
          subtitle="There is no wrong shape for this — fragments, lists, or a single honest paragraph are all welcome. When you are ready, we use only what you type to quietly sketch a few answers; you stay in charge of every line."
          maxWidthClass="max-w-3xl"
          calmProgress
          busy={extracting}
          onBack={() => router.push("/")}
          onNext={() => void continueWithExtraction()}
          nextDisabled={!ok || extracting}
          nextLabel={
            extracting ? "Finding what is still to ask…" : "Continue — only what is left to ask"
          }
        >
          <BrainDumpInput
            value={dump}
            onChange={(next) => setSession({ brainDump: next })}
            disabled={extracting}
          />

          {extractError ? (
            <p
              className="mx-auto mt-8 max-w-2xl rounded-2xl border border-border/70 bg-muted/20 px-5 py-4 text-center text-sm leading-relaxed text-muted-foreground"
              role="status"
            >
              {extractError}
            </p>
          ) : null}

          <div className="mx-auto mt-12 max-w-2xl">
            <div className="clarity-surface rounded-2xl border border-border/60 px-5 py-5 sm:px-7 sm:py-6">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 space-y-1.5">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Prefer to start structured?
                  </p>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    That is a perfectly good choice. You will see the same thoughtful questions, in full
                    — nothing assumes you wrote an opening note.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="h-auto shrink-0 rounded-2xl border-border/80 px-5 py-3 text-sm font-medium text-foreground shadow-none hover:bg-muted/40"
                  disabled={extracting}
                  onClick={goIntakeCleared}
                >
                  Go to full check-in
                </Button>
              </div>
            </div>
          </div>
        </StepShell>
      </div>
    </div>
  );
}
