"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Mic, Square, Waves } from "lucide-react";

import type { BrainDump } from "@/types/clarity";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const THEME_CHIPS = [
  { id: "anxiety", label: "Anxiety" },
  { id: "grief", label: "Grief" },
  { id: "work", label: "Work" },
  { id: "relationships", label: "Relationships" },
  { id: "burnout", label: "Burnout" },
  { id: "motivation", label: "Motivation" },
] as const;

const MAX_RECORDING_MS = 5 * 60 * 1000;

function formatMmSs(totalSec: number): string {
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function BrainDumpInput({
  value,
  onChange,
  disabled,
}: {
  value: BrainDump;
  onChange: (next: BrainDump) => void;
  disabled?: boolean;
}) {
  const [recording, setRecording] = useState(false);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [unsupported, setUnsupported] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const recordingStartedAtRef = useRef<number | null>(null);
  /** Browser timer id (`@types/node` widens `setTimeout` to `NodeJS.Timeout` — store as number in client). */
  const maxTimerRef = useRef<number | null>(null);
  const valueRef = useRef(value);

  const themes = value.themes ?? [];

  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  useEffect(() => {
    if (!recording) return;
    const id = window.setInterval(() => {
      const start = recordingStartedAtRef.current;
      if (start == null) return;
      const sec = Math.floor((performance.now() - start) / 1000);
      setElapsedSec(Math.min(Math.floor(MAX_RECORDING_MS / 1000), sec));
    }, 400);
    return () => window.clearInterval(id);
  }, [recording]);

  const toggleTheme = useCallback(
    (id: string) => {
      const cur = valueRef.current.themes ?? [];
      const set = new Set(cur);
      if (set.has(id)) set.delete(id);
      else set.add(id);
      onChange({ ...valueRef.current, themes: Array.from(set) });
    },
    [onChange]
  );

  const stopRecording = useCallback(() => {
    if (maxTimerRef.current != null) {
      clearTimeout(maxTimerRef.current);
      maxTimerRef.current = null;
    }
    const mr = mediaRecorderRef.current;
    if (mr && mr.state !== "inactive") mr.stop();
    setRecording(false);
    setElapsedSec(0);
    mediaRecorderRef.current = null;
  }, []);

  const startRecording = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setUnsupported(true);
      onChange({
        ...valueRef.current,
        voice: { status: "unsupported" },
      });
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      recordingStartedAtRef.current = performance.now();
      mr.ondataavailable = (e) => {
        if (e.data.size) chunksRef.current.push(e.data);
      };
      mr.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: mr.mimeType || "audio/webm" });
        const start = recordingStartedAtRef.current;
        recordingStartedAtRef.current = null;
        const durationSec =
          start != null ? Math.max(1, Math.round((performance.now() - start) / 1000)) : undefined;
        const v = valueRef.current;
        onChange({
          ...v,
          voice: {
            status: "recorded",
            durationSec,
            blobMeta: { mimeType: blob.type, size: blob.size },
          },
        });
      };
      mediaRecorderRef.current = mr;
      mr.start(250);
      maxTimerRef.current = window.setTimeout(() => {
        stopRecording();
      }, MAX_RECORDING_MS) as unknown as number;
      setElapsedSec(0);
      setRecording(true);
      setUnsupported(false);
    } catch {
      setUnsupported(true);
      onChange({
        ...valueRef.current,
        voice: { status: "unsupported" },
      });
    }
  }, [onChange, stopRecording]);

  const voice = value.voice;
  const blockInput = Boolean(disabled);

  return (
    <div className="relative">
      <div
        className="pointer-events-none absolute -inset-x-6 -top-8 bottom-0 opacity-[0.45] sm:-inset-x-10"
        aria-hidden
        style={{
          backgroundImage: `radial-gradient(ellipse 85% 55% at 50% 0%, rgb(111 143 120 / 0.09), transparent 58%)`,
        }}
      />

      <div className="relative clarity-surface rounded-[1.75rem] px-6 py-10 sm:px-10 sm:py-12 lg:px-12 lg:py-14">
        <div className="mx-auto max-w-2xl space-y-10">
          <header className="space-y-4 text-center sm:text-left">
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              Space to be heard
            </p>
            <h2 className="font-heading text-2xl font-semibold leading-snug tracking-tight text-foreground sm:text-3xl">
              What has been sitting with you?
            </h2>
            <p className="text-base leading-relaxed text-muted-foreground sm:max-w-xl">
              Say it messy, say it small, say it sideways — order does not matter, and nothing here is
              scored. This box is only for what you choose to put into words.
            </p>
          </header>

          <div className="space-y-3">
            <label htmlFor="brain-dump" className="sr-only">
              Your words
            </label>
            <Textarea
              id="brain-dump"
              disabled={blockInput}
              value={value.text}
              onChange={(e) => onChange({ ...value, text: e.target.value })}
              rows={12}
              placeholder="A line is enough to start. Add more only if it helps."
              className="min-h-[min(22rem,55vh)] resize-y rounded-2xl border-border/80 bg-muted/20 px-5 py-5 text-lg leading-[1.65] text-foreground shadow-none placeholder:text-muted-foreground/55 focus-visible:border-primary/40 focus-visible:ring-2 focus-visible:ring-ring/40 sm:px-6 sm:py-6"
            />
          </div>

          <div className="space-y-4">
            <p className="text-center text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground sm:text-left">
              Optional — nudge the tone if something fits
            </p>
            <div className="flex flex-wrap justify-center gap-2.5 sm:justify-start">
              {THEME_CHIPS.map((chip) => {
                const on = themes.includes(chip.id);
                return (
                  <button
                    key={chip.id}
                    type="button"
                    disabled={blockInput}
                    onClick={() => toggleTheme(chip.id)}
                    className={cn(
                      "rounded-full border px-4 py-2 text-sm font-medium transition",
                      on
                        ? "border-primary bg-accent text-foreground shadow-clarity-soft"
                        : "border-transparent bg-muted/35 text-muted-foreground hover:bg-muted/55 hover:text-foreground"
                    )}
                    aria-pressed={on}
                  >
                    {chip.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="border-t border-border/70 pt-10">
            <div className="flex flex-col items-center gap-8 sm:flex-row sm:items-start sm:justify-between sm:gap-10">
              <div className="max-w-sm space-y-3 text-center sm:text-left">
                <div className="flex items-center justify-center gap-2 text-foreground sm:justify-start">
                  <Waves className="size-4 text-primary/80" aria-hidden />
                  <p className="font-heading text-base font-medium">Sounding it out</p>
                </div>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  If speaking helps you gather your thoughts, you can leave a short note here. The next
                  step reads only what you <span className="font-medium text-foreground/85">type</span>{" "}
                  above; any clip stays quietly on this device as a personal reminder, not something we
                  analyze.
                </p>
              </div>

              <div className="flex shrink-0 flex-col items-center gap-5">
                <div className="relative">
                  {recording ? (
                    <span
                      className="absolute inset-0 -m-3 rounded-full border border-primary/25 motion-safe:animate-pulse"
                      aria-hidden
                    />
                  ) : null}
                  {!recording ? (
                    <button
                      type="button"
                      disabled={blockInput}
                      onClick={startRecording}
                      className={cn(
                        "flex h-20 w-20 items-center justify-center rounded-full border-2 border-primary/35 bg-card text-primary shadow-clarity-soft transition hover:border-primary/55 hover:bg-accent/60",
                        blockInput && "pointer-events-none opacity-50"
                      )}
                      aria-label="Start voice note"
                    >
                      <Mic className="size-8" strokeWidth={1.75} />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={stopRecording}
                      className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-destructive/35 bg-card text-destructive shadow-clarity-soft transition hover:bg-destructive/5"
                      aria-label="Stop recording"
                    >
                      <Square className="size-7 fill-current" />
                    </button>
                  )}
                </div>

                {recording ? (
                  <p className="text-xs font-medium tabular-nums text-muted-foreground" aria-live="polite">
                    {formatMmSs(elapsedSec)} / {formatMmSs(Math.floor(MAX_RECORDING_MS / 1000))}
                  </p>
                ) : null}

                {recording ? (
                  <div
                    className="flex h-10 items-end justify-center gap-1 motion-reduce:opacity-80"
                    aria-hidden
                  >
                    {[4, 7, 5, 8, 6, 9, 5, 7].map((h, i) => (
                      <span
                        key={i}
                        className="w-1 rounded-full bg-primary/50 motion-safe:animate-pulse"
                        style={{
                          height: `${h * 2}px`,
                          animationDelay: `${i * 0.12}s`,
                        }}
                      />
                    ))}
                  </div>
                ) : null}

                <div className="flex flex-wrap justify-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={blockInput}
                    className="text-muted-foreground"
                    onClick={() =>
                      onChange({
                        ...value,
                        voice: { status: "skipped" },
                      })
                    }
                  >
                    Skip voice
                  </Button>
                </div>

                {voice?.status === "recorded" ? (
                  <p className="max-w-[16rem] text-center text-xs leading-relaxed text-muted-foreground">
                    Kept only on this device ({voice.durationSec != null ? `${voice.durationSec} sec` : "brief"}{" "}
                    · {Math.max(1, Math.round((voice.blobMeta?.size ?? 0) / 1024))} KB). Add anything you want
                    carried forward in the text area above.
                  </p>
                ) : null}
                {unsupported ? (
                  <p className="max-w-[14rem] text-center text-xs leading-relaxed text-muted-foreground">
                    Microphone is not available here — typing alone is more than enough.
                  </p>
                ) : null}
              </div>
            </div>
          </div>

          <p className="text-center text-xs leading-relaxed text-muted-foreground/90 sm:text-left">
            If your words suggest you might be in danger, we may show crisis resources in the header.
            That check stays on your device — it is not a clinical read and not sent for scoring.
          </p>
        </div>
      </div>
    </div>
  );
}
