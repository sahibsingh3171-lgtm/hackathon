"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { LikertScale } from "@/components/clarity/LikertScale";
import { StepShell } from "@/components/clarity/StepShell";
import { useClaritySession } from "@/contexts/clarity-session-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { LifestyleSnapshot } from "@/types/clarity";
import { cn } from "@/lib/utils";

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
      subtitle="Rough estimates are fine — you’re building a snapshot to discuss with a human, not a medical record."
      onBack={() => router.push("/intake")}
      onNext={() => {
        setSession({ lifestyle: draft });
        router.push("/brain-dump");
      }}
      nextDisabled={!valid}
    >
      <div className="space-y-8">
        <Field label="Overall mood today">
          <LikertScale
            value={draft.mood}
            onChange={(v) => setDraft((d) => ({ ...d, mood: v }))}
            lowLabel="Heavy / low"
            highLabel="Steady / okay"
          />
        </Field>
        <Field label="Sleep quality last few nights">
          <LikertScale
            value={draft.sleepQuality}
            onChange={(v) => setDraft((d) => ({ ...d, sleepQuality: v }))}
            lowLabel="Restless"
            highLabel="Restorative"
          />
        </Field>
        <div className="space-y-3 rounded-3xl border border-border bg-card p-6 shadow-clarity-soft">
          <Label className="text-foreground">Approximate sleep hours / night</Label>
          <Input
            type="number"
            min={0}
            max={24}
            step={0.5}
            value={draft.sleepHoursApprox ?? ""}
            onChange={(e) =>
              setDraft((d) => ({
                ...d,
                sleepHoursApprox: e.target.value === "" ? undefined : Number(e.target.value),
              }))
            }
            className="max-w-[120px] rounded-xl border-border bg-muted/30"
          />
        </div>
        <Field label="Stress load right now">
          <LikertScale
            value={draft.stressLevel}
            onChange={(v) => setDraft((d) => ({ ...d, stressLevel: v }))}
            lowLabel="Calm"
            highLabel="Overwhelming"
          />
        </Field>

        <div className="space-y-4 rounded-3xl border border-border bg-card p-6 shadow-clarity-soft">
          <Label className="text-base text-foreground">Screen time</Label>
          <p className="text-sm text-muted-foreground">
            We never read your device. Estimate hours, or note that you&apos;ll bring a screenshot
            to therapy.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant={draft.screenTime.mode === "hours_estimate" ? "default" : "outline"}
              className={cn(
                "rounded-xl",
                draft.screenTime.mode === "hours_estimate" && "bg-primary shadow-none"
              )}
              onClick={() =>
                setDraft((d) => ({
                  ...d,
                  screenTime: {
                    mode: "hours_estimate",
                    hoursApprox: d.screenTime.hoursApprox ?? 4,
                  },
                }))
              }
            >
              Estimate hours
            </Button>
            <Button
              type="button"
              size="sm"
              variant={draft.screenTime.mode === "screenshot_attached" ? "default" : "outline"}
              className={cn(
                "rounded-xl",
                draft.screenTime.mode === "screenshot_attached" && "bg-primary shadow-none"
              )}
              onClick={() =>
                setDraft((d) => ({
                  ...d,
                  screenTime: {
                    mode: "screenshot_attached",
                    screenshotNote: d.screenTime.screenshotNote ?? "",
                  },
                }))
              }
            >
              Screenshot / note
            </Button>
          </div>
          {draft.screenTime.mode === "hours_estimate" ? (
            <div className="space-y-2 pt-2">
              <Label className="text-sm text-muted-foreground">Hours per day (approx.)</Label>
              <Input
                type="number"
                min={0}
                max={24}
                step={0.5}
                value={draft.screenTime.hoursApprox ?? ""}
                onChange={(e) =>
                  setDraft((d) => ({
                    ...d,
                    screenTime: {
                      ...d.screenTime,
                      mode: "hours_estimate",
                      hoursApprox: e.target.value === "" ? undefined : Number(e.target.value),
                    },
                  }))
                }
                className="max-w-[120px] rounded-xl border-border bg-muted/30"
              />
            </div>
          ) : (
            <div className="space-y-3 pt-2">
              <Label className="text-sm text-muted-foreground">
                Short note (e.g. “iOS Screen Time Wed”)
              </Label>
              <Input
                value={draft.screenTime.screenshotNote ?? ""}
                onChange={(e) =>
                  setDraft((d) => ({
                    ...d,
                    screenTime: {
                      ...d.screenTime,
                      mode: "screenshot_attached",
                      screenshotNote: e.target.value,
                    },
                  }))
                }
                className="rounded-xl border-border bg-muted/30"
              />
              <div>
                <Label className="text-sm text-muted-foreground">Optional file (metadata only)</Label>
                <Input
                  type="file"
                  accept="image/*"
                  className="mt-2 rounded-xl border-border bg-muted/30 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-sm file:text-primary-foreground"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    setDraft((d) => ({
                      ...d,
                      screenTime: {
                        mode: "screenshot_attached",
                        screenshotNote: d.screenTime.screenshotNote,
                        attachmentMeta: {
                          fileName: f.name,
                          size: f.size,
                          type: f.type || "image/*",
                        },
                      },
                    }));
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </StepShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4 rounded-3xl border border-border bg-card p-6 shadow-clarity-soft">
      <Label className="text-base text-foreground">{label}</Label>
      {children}
    </div>
  );
}
