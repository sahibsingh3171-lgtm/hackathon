"use client";

import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";

import { BrainDumpFaq } from "@/components/clarity/BrainDumpFaq";
import { BrainDumpInput, type BrainDumpInputHandle } from "@/components/clarity/BrainDumpInput";
import { BrainDumpStarters } from "@/components/clarity/BrainDumpStarters";
import { StepShell } from "@/components/clarity/StepShell";
import { Button } from "@/components/ui/button";
import { useClaritySession } from "@/contexts/clarity-session-context";
import {
  derivePrefilledStepIdsFromPatch,
  mergeIntakeFromExtraction,
} from "@/lib/ai/intake-extraction";
import { sortStepIdsByFlow } from "@/lib/clarity/intake-due-steps";
import { isBrainDumpLongEnough } from "@/lib/validation";
import type { BrainDump, IntakeAnswers, IntakeExtractionMeta } from "@/types/clarity";

const empty: BrainDump = { text: "", themes: [], voice: { status: "skipped" } };

type ExtractResponse = {
  intakePatch?: Partial<IntakeAnswers>;
  prefilledStepIds?: string[];
  inferredStepIds?: string[];
  stillNeededStepIds?: string[];
  fieldConfidence?: Record<string, number>;
  emotionalSignals?: string[];
  reasoningSummary?: string;
  trustLine?: string;
  answeredStepIds?: string[];
  usedMock?: boolean;
  error?: string;
};

export default function BrainDumpPage() {
  const router = useRouter();
  const { session, setSession } = useClaritySession();
  const [extracting, setExtracting] = useState(false);
  const [extractError, setExtractError] = useState<string | null>(null);
  const inputRef = useRef<BrainDumpInputHandle>(null);

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
    // Clear any prior brain-dump state so the user sees the *full* 28-question
    // check-in unchanged. `intakeWizardStepIds: null` means “no shortcut —
    // show every step” in IntakeFlowWizard.
    setSession({
      brainDump: null,
      intakePrefilledStepIds: [],
      intakeConfirmedStepIds: [],
      intakeWizardStepIds: null,
      intakeExtractionMeta: null,
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
          intakePrefilledStepIds: [],
          intakeConfirmedStepIds: [],
          intakeWizardStepIds: null,
          intakeExtractionMeta: null,
        });
        router.push("/intake");
        return;
      }
      const patch = data.intakePatch ?? {};
      const merged = mergeIntakeFromExtraction(intakePayload, patch);
      const stillRaw = Array.isArray(data.stillNeededStepIds) ? data.stillNeededStepIds : [];
      const wizardIds = stillRaw.length ? sortStepIdsByFlow(stillRaw) : null;
      const prefilledFromServer = Array.isArray(data.prefilledStepIds) ? data.prefilledStepIds : null;
      const prefilled =
        prefilledFromServer && prefilledFromServer.length > 0
          ? sortStepIdsByFlow(prefilledFromServer)
          : derivePrefilledStepIdsFromPatch(patch);
      const meta: IntakeExtractionMeta = {
        fieldConfidence: data.fieldConfidence,
        answeredStepIds: Array.isArray(data.answeredStepIds) ? data.answeredStepIds : undefined,
        reasoningSummary: data.reasoningSummary,
        trustLine: data.trustLine,
        emotionalSignals: Array.isArray(data.emotionalSignals) ? data.emotionalSignals : undefined,
      };
      setSession({
        brainDump: dump,
        intake: {
          ...merged,
          brain_dump_tags: tags.length ? tags : merged.brain_dump_tags,
          intakeFlowStep: 0,
        },
        intakePrefilledStepIds: prefilled,
        intakeConfirmedStepIds: [],
        intakeWizardStepIds: wizardIds,
        intakeExtractionMeta: meta,
      });
      router.push("/intake");
    } catch {
      setExtractError(
        "Connection hiccup — your note is saved. We will take you through the full check-in so nothing gets lost."
      );
      setSession({
        brainDump: dump,
        intake: { ...intakePayload, intakeFlowStep: 0 },
        intakePrefilledStepIds: [],
        intakeConfirmedStepIds: [],
        intakeWizardStepIds: null,
        intakeExtractionMeta: null,
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
          subtitle="Optional — but if you write a few lines, we can quietly pre-answer parts of the full 28-question check-in, and only ask what is left. You stay in charge of every line, and you can edit anything we sketch."
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
          <div className="mx-auto max-w-2xl">
            <BrainDumpStarters
              hasText={dump.text.trim().length > 0}
              disabled={extracting}
              onApply={(prompt) => inputRef.current?.insertText(prompt)}
            />
          </div>

          <div className="mt-8">
            <BrainDumpInput
              ref={inputRef}
              value={dump}
              onChange={(next) => setSession({ brainDump: next })}
              disabled={extracting}
            />
          </div>

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
                    That is a perfectly good choice. You will see the same thoughtful 28-question
                    check-in, in full — nothing assumes you wrote an opening note.
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

          <div className="mx-auto mt-10 max-w-2xl">
            <BrainDumpFaq />
          </div>
        </StepShell>
      </div>
    </div>
  );
}
