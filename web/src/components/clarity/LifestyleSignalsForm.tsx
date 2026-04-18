"use client";

import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Heart, Moon, Smartphone, Waves } from "lucide-react";

import { LikertScale } from "@/components/clarity/LikertScale";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { LifestyleSnapshot } from "@/types/clarity";
import { cn } from "@/lib/utils";

function FieldShell({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[1.75rem] border border-border/90 bg-card p-7 shadow-clarity-soft sm:p-8">
      <div className="flex gap-4">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-accent/60 text-primary">
          <Icon className="size-5" aria-hidden />
        </div>
        <div className="min-w-0 flex-1 space-y-5">
          <div>
            <h2 className="font-heading text-lg font-semibold tracking-tight text-foreground">
              {title}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>
          </div>
          {children}
        </div>
      </div>
    </section>
  );
}

function OptionalUploadZone({
  id,
  label,
  hint,
  note,
  onNoteChange,
  fileName,
  onFile,
  onClearFile,
}: {
  id: string;
  label: string;
  hint: string;
  note: string;
  onNoteChange: (v: string) => void;
  fileName?: string;
  onFile: (file: File) => void;
  onClearFile: () => void;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-border/90 bg-muted/15 px-4 py-5 sm:px-5">
      <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{hint}</p>
      <Label htmlFor={`${id}-note`} className="mt-4 block text-sm text-foreground">
        Short label (optional)
      </Label>
      <Input
        id={`${id}-note`}
        value={note}
        onChange={(e) => onNoteChange(e.target.value)}
        placeholder='e.g. "last week from Health app"'
        className="mt-2 rounded-xl border-border bg-background/80"
      />
      <Label htmlFor={`${id}-file`} className="mt-4 block text-sm text-foreground">
        Attach a screenshot (optional)
      </Label>
      <div className="mt-2">
        <input
          id={`${id}-file`}
          type="file"
          accept="image/*"
          className="block w-full cursor-pointer text-sm text-muted-foreground file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-primary/90 file:px-3 file:py-2 file:text-sm file:font-medium file:text-primary-foreground hover:file:bg-primary"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onFile(f);
            e.target.value = "";
          }}
        />
      </div>
      {fileName ? (
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span className="rounded-full bg-accent/50 px-2.5 py-1 text-foreground">{fileName}</span>
          <button
            type="button"
            className="text-primary underline decoration-primary/35 underline-offset-2"
            onClick={onClearFile}
          >
            Remove attachment
          </button>
        </div>
      ) : null}
    </div>
  );
}

export function LifestyleSignalsForm({
  value,
  onChange,
}: {
  value: LifestyleSnapshot;
  onChange: (next: LifestyleSnapshot) => void;
}) {
  const screen = value.screenTime;

  return (
    <div className="space-y-8 sm:space-y-10">
      <div className="rounded-[1.75rem] border border-primary/15 bg-accent/25 px-6 py-6 sm:px-8 sm:py-7">
        <p className="font-heading text-base font-semibold text-foreground">Why we ask this way</p>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          This page cannot read your phone the way a dedicated app might. You can enter{" "}
          <span className="text-foreground">rough averages</span> you already know, or add a
          screenshot <span className="text-foreground">only if it helps you tell the story</span>.
          Everything here is <span className="text-foreground">optional</span> and only nudges
          your reflection — not for diagnosis, ads, or background tracking.
        </p>
        <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
          We do <span className="font-medium text-foreground">not</span> read image contents in this
          demo: only filenames and sizes are kept so you remember what you attached. Your clinician
          is the right person to look at the actual image with you.
        </p>
      </div>

      <FieldShell
        icon={Heart}
        title="Overall mood"
        description="How heavy things feel today, in one glance — not a label or a diagnosis."
      >
        <LikertScale
          value={value.mood}
          onChange={(mood) => onChange({ ...value, mood })}
          lowLabel="Heavy / low"
          highLabel="Steady / okay"
        />
      </FieldShell>

      <FieldShell
        icon={Moon}
        title="Sleep"
        description="Quality and rough hours are enough. Add a screenshot note only if it helps you prepare for a conversation later."
      >
        <LikertScale
          value={value.sleepQuality}
          onChange={(sleepQuality) => onChange({ ...value, sleepQuality })}
          lowLabel="Restless"
          highLabel="Restorative"
        />
        <div className="space-y-2 pt-2">
          <Label className="text-sm text-muted-foreground">Average hours per night (optional)</Label>
          <Input
            type="number"
            min={0}
            max={24}
            step={0.5}
            value={value.sleepHoursApprox ?? ""}
            onChange={(e) =>
              onChange({
                ...value,
                sleepHoursApprox: e.target.value === "" ? undefined : Number(e.target.value),
              })
            }
            placeholder="e.g. 6.5"
            className="max-w-[8.5rem] rounded-xl border-border bg-muted/30"
          />
        </div>
        <OptionalUploadZone
          id="sleep"
          label="Sleep screenshot (optional)"
          hint="If you attach a file, only the filename and size are stored in this browser session — a reminder for you, not something we read automatically."
          note={value.sleepChartNote ?? ""}
          onNoteChange={(sleepChartNote) => onChange({ ...value, sleepChartNote })}
          fileName={value.sleepChartAttachmentMeta?.fileName}
          onFile={(file) =>
            onChange({
              ...value,
              sleepChartAttachmentMeta: {
                fileName: file.name,
                size: file.size,
                type: file.type || "image/*",
              },
            })
          }
          onClearFile={() =>
            onChange({
              ...value,
              sleepChartAttachmentMeta: undefined,
            })
          }
        />
      </FieldShell>

      <FieldShell
        icon={Waves}
        title="Stress load"
        description="How full or wired you feel — separate from sleep hours or screen time."
      >
        <LikertScale
          value={value.stressLevel}
          onChange={(stressLevel) => onChange({ ...value, stressLevel })}
          lowLabel="Calm"
          highLabel="Overwhelming"
        />
      </FieldShell>

      <FieldShell
        icon={Smartphone}
        title="Screen time"
        description="Estimate hours, or switch to a short note or screenshot if numbers feel wrong or you would rather show a chart when you meet someone."
      >
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant={screen.mode === "hours_estimate" ? "default" : "outline"}
            className={cn(
              "rounded-xl",
              screen.mode === "hours_estimate" && "bg-primary shadow-none"
            )}
            onClick={() =>
              onChange({
                ...value,
                screenTime: {
                  mode: "hours_estimate",
                  hoursApprox: screen.hoursApprox ?? 4,
                },
              })
            }
          >
            Enter hours
          </Button>
          <Button
            type="button"
            size="sm"
            variant={screen.mode === "screenshot_attached" ? "default" : "outline"}
            className={cn(
              "rounded-xl",
              screen.mode === "screenshot_attached" && "bg-primary shadow-none"
            )}
            onClick={() =>
              onChange({
                ...value,
                screenTime: {
                  mode: "screenshot_attached",
                  screenshotNote: screen.screenshotNote ?? "",
                },
              })
            }
          >
            Note or image
          </Button>
        </div>

        {screen.mode === "hours_estimate" ? (
          <div className="space-y-2 pt-2">
            <Label className="text-sm text-muted-foreground">Hours per day (approx.)</Label>
            <Input
              type="number"
              min={0}
              max={24}
              step={0.5}
              value={screen.hoursApprox ?? ""}
              onChange={(e) =>
                onChange({
                  ...value,
                  screenTime: {
                    ...screen,
                    mode: "hours_estimate",
                    hoursApprox: e.target.value === "" ? undefined : Number(e.target.value),
                  },
                })
              }
              className="max-w-[8.5rem] rounded-xl border-border bg-muted/30"
            />
          </div>
        ) : (
          <OptionalUploadZone
            id="screen"
            label="Screen-time context"
            hint="Use this when a chart says more than a number. Same rule as sleep: only basic file details are kept in this session."
            note={screen.screenshotNote ?? ""}
            onNoteChange={(screenshotNote) =>
              onChange({
                ...value,
                screenTime: {
                  ...screen,
                  mode: "screenshot_attached",
                  screenshotNote,
                },
              })
            }
            fileName={screen.attachmentMeta?.fileName}
            onFile={(file) =>
              onChange({
                ...value,
                screenTime: {
                  mode: "screenshot_attached",
                  screenshotNote: screen.screenshotNote,
                  attachmentMeta: {
                    fileName: file.name,
                    size: file.size,
                    type: file.type || "image/*",
                  },
                },
              })
            }
            onClearFile={() =>
              onChange({
                ...value,
                screenTime: {
                  ...screen,
                  mode: "screenshot_attached",
                  attachmentMeta: undefined,
                },
              })
            }
          />
        )}
      </FieldShell>
    </div>
  );
}
