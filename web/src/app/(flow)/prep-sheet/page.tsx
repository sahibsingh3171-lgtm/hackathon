"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { StepShell } from "@/components/clarity/StepShell";
import { useClaritySession } from "@/contexts/clarity-session-context";
import { buildPrepSheet } from "@/lib/clarity/prep-sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export default function PrepSheetPage() {
  const router = useRouter();
  const { session, setSession } = useClaritySession();

  useEffect(() => {
    if (!session.summary || !session.nextSteps?.length) return;
    if (session.prepSheet) return;
    const sheet = buildPrepSheet(session);
    if (sheet) setSession({ prepSheet: sheet });
  }, [session, setSession]);

  const sheet = session.prepSheet;

  return (
    <StepShell
      path="/prep-sheet"
      title="Therapy prep sheet"
      subtitle="Bring this to a first session — one page, your words and our gentle framing."
      onBack={() => router.push("/next-steps")}
      onNext={() => router.push("/matches")}
      nextDisabled={!sheet}
      nextLabel="View therapist matches"
    >
      <div className="no-print mb-8 flex flex-wrap gap-3">
        <Button
          type="button"
          className="rounded-xl bg-primary px-6 text-primary-foreground shadow-clarity-soft hover:bg-primary/90"
          onClick={() => window.print()}
        >
          Print or save as PDF
        </Button>
        <p className="w-full text-xs text-muted-foreground">
          Use your browser print dialog → “Save as PDF” if you want a file.
        </p>
      </div>

      {sheet ? (
        <article className="print-main clarity-surface space-y-10 p-8 sm:p-10">
          <header className="space-y-2 border-b border-border pb-8">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
              Clarity — therapy prep
            </p>
            <h2 className="font-heading text-2xl font-semibold text-foreground">Session snapshot</h2>
            <p className="text-sm text-muted-foreground">
              For discussion with a licensed professional only ·{" "}
              {new Date(sheet.createdAt).toLocaleDateString()}
            </p>
          </header>

          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Reflection headline
            </h3>
            <p className="mt-3 font-heading text-xl text-foreground">{sheet.summary.headline}</p>
          </section>

          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Themes</h3>
            <ul className="mt-3 list-inside list-disc space-y-2 text-sm text-muted-foreground">
              {sheet.summary.keyThemes.map((t, i) => (
                <li key={i}>{t}</li>
              ))}
            </ul>
          </section>

          <Separator className="bg-border" />

          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Check-in highlights
            </h3>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              {sheet.intakeHighlights.map((t, i) => (
                <li key={i}>{t}</li>
              ))}
            </ul>
          </section>

          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Lifestyle snapshot
            </h3>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              {sheet.lifestyleHighlights.map((t, i) => (
                <li key={i}>{t}</li>
              ))}
            </ul>
          </section>

          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              In your words
            </h3>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
              {sheet.brainDumpExcerpt}
            </p>
          </section>

          <Separator className="bg-border" />

          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Ideas before your visit
            </h3>
            <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
              {sheet.nextSteps.map((s) => (
                <li key={s.id}>
                  <span className="font-medium text-foreground">{s.title}</span> — {s.description}
                </li>
              ))}
            </ul>
          </section>

          <footer className="border-t border-border pt-8 text-xs text-muted-foreground">
            Clarity does not diagnose or replace emergency services. If you are in danger, call
            911. In the U.S., call or text 988 for the Suicide &amp; Crisis Lifeline.
          </footer>
        </article>
      ) : (
        <p className="text-sm text-muted-foreground">Preparing your sheet…</p>
      )}
    </StepShell>
  );
}
