"use client";

import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef } from "react";
import { Loader2, Mic, Square } from "lucide-react";

import type { BrainDump } from "@/types/clarity";
import { LIFE_STRESS_TAG_OPTIONS } from "@/lib/clarity/intake-flow-config";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useVoiceDictation } from "@/hooks/use-voice-dictation";
import { cn } from "@/lib/utils";

export type BrainDumpInputHandle = {
  /**
   * Insert text into the textarea — either at the caret (when focused) or
   * appended at the end — and focus it. Triggers the normal onChange flow.
   */
  insertText: (text: string) => void;
};

const MAX_RECORDING_MS = 5 * 60 * 1000;

function formatMmSs(totalSec: number): string {
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/** Merge a new chunk of transcript into an existing text blob with forgiving spacing. */
function appendTranscript(existing: string, chunk: string): string {
  const addition = chunk.trim();
  if (!addition) return existing;
  if (!existing.trim()) return addition;

  const endsSentence = /[.!?…]\s*$/.test(existing);
  const endsNewline = existing.endsWith("\n");
  const separator = endsNewline ? "" : endsSentence ? " " : " ";
  return `${existing}${separator}${addition}`;
}

export const BrainDumpInput = forwardRef<
  BrainDumpInputHandle,
  {
    value: BrainDump;
    onChange: (next: BrainDump) => void;
    disabled?: boolean;
  }
>(function BrainDumpInput({ value, onChange, disabled }, ref) {
  const valueRef = useRef(value);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const sessionStartedTextRef = useRef<string>(value.text);

  const themes = value.themes ?? [];

  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  useImperativeHandle(
    ref,
    (): BrainDumpInputHandle => ({
      insertText: (text: string) => {
        const v = valueRef.current;
        const el = textareaRef.current;
        const focused = el && document.activeElement === el;
        let nextText: string;
        let nextCaret: number;
        if (el && focused) {
          const start = el.selectionStart ?? v.text.length;
          const end = el.selectionEnd ?? v.text.length;
          nextText = v.text.slice(0, start) + text + v.text.slice(end);
          nextCaret = start + text.length;
        } else if (v.text.trim().length > 0) {
          const pad = v.text.endsWith("\n\n") || v.text === "" ? "" : v.text.endsWith("\n") ? "\n" : "\n\n";
          nextText = v.text + pad + text;
          nextCaret = nextText.length;
        } else {
          nextText = text;
          nextCaret = nextText.length;
        }
        onChange({ ...v, text: nextText });
        requestAnimationFrame(() => {
          const t = textareaRef.current;
          if (!t) return;
          t.focus();
          try {
            t.setSelectionRange(nextCaret, nextCaret);
          } catch {
            /* ignore — some browsers disallow until focused */
          }
        });
      },
    }),
    [onChange]
  );

  const appendFinalText = useCallback(
    (chunk: string) => {
      const v = valueRef.current;
      const nextText = appendTranscript(v.text, chunk);
      onChange({ ...v, text: nextText });
    },
    [onChange]
  );

  const voice = useVoiceDictation({
    onFinalText: appendFinalText,
    maxDurationMs: MAX_RECORDING_MS,
  });

  const {
    engine,
    status,
    listening,
    elapsedSec,
    interimText,
    error: voiceError,
    start: startVoice,
    stop: stopVoice,
    supported: voiceSupported,
  } = voice;

  const transcribing = status === "transcribing";
  const blockInput = Boolean(disabled) || transcribing;

  const handleStart = useCallback(async () => {
    if (!voiceSupported || listening || transcribing) return;
    sessionStartedTextRef.current = valueRef.current.text;
    await startVoice();
    onChange({ ...valueRef.current, voice: { status: "recorded" } });
  }, [listening, onChange, startVoice, transcribing, voiceSupported]);

  const handleStop = useCallback(() => {
    if (!listening) return;
    stopVoice();
  }, [listening, stopVoice]);

  // Mirror voice status into the BrainDump metadata so downstream UI (if any) still reflects it.
  useEffect(() => {
    if (status === "error" && voiceError) {
      onChange({ ...valueRef.current, voice: { status: "unsupported" } });
    }
  }, [status, voiceError, onChange]);

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

  const engineLabel = useMemo(() => {
    if (engine === "web-speech") return "Live on-device transcription";
    if (engine === "whisper-fallback") return "Upload on stop → secure transcription";
    return null;
  }, [engine]);

  const micButtonLabel = useMemo(() => {
    if (status === "requesting-permission") return "Asking for mic…";
    if (status === "transcribing") return "Transcribing…";
    if (listening) return "Stop & save transcript";
    return voiceSupported ? "Speak your reflection" : "Voice not available here";
  }, [listening, status, voiceSupported]);

  const maxCapSec = Math.floor(MAX_RECORDING_MS / 1000);

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
              Type it, or tap the mic and just talk — your words land in the same box either way.
              You can stop the recording whenever you want, and edit anything before moving on.
            </p>
          </header>

          <div className="space-y-3">
            <label htmlFor="brain-dump" className="sr-only">
              Your words
            </label>
            <div className="relative">
              <Textarea
                id="brain-dump"
                ref={textareaRef}
                disabled={blockInput}
                value={value.text}
                onChange={(e) => onChange({ ...value, text: e.target.value })}
                rows={12}
                placeholder={
                  listening
                    ? "Listening — just talk; your words appear here when phrases wrap."
                    : "A line is enough to start. Add more only if it helps."
                }
                className={cn(
                  "min-h-[min(22rem,55vh)] resize-y rounded-2xl border-border/80 bg-muted/20 px-5 py-5 text-lg leading-[1.65] text-foreground shadow-none placeholder:text-muted-foreground/55 focus-visible:border-primary/40 focus-visible:ring-2 focus-visible:ring-ring/40 sm:px-6 sm:py-6",
                  listening &&
                    "border-primary/45 bg-primary/[0.035] ring-1 ring-primary/10 placeholder:text-primary/60"
                )}
                aria-describedby={listening ? "voice-interim" : undefined}
              />
              {listening ? (
                <div className="pointer-events-none absolute right-4 top-4 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-primary">
                  <span className="relative flex size-2">
                    <span className="absolute inset-0 rounded-full bg-primary motion-safe:animate-ping" />
                    <span className="absolute inset-0 rounded-full bg-primary" />
                  </span>
                  Listening
                </div>
              ) : null}
              {transcribing ? (
                <div className="pointer-events-none absolute right-4 top-4 inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/90 px-3 py-1 text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  <Loader2 className="size-3 animate-spin" aria-hidden />
                  Transcribing
                </div>
              ) : null}
            </div>

            {listening && interimText ? (
              <p
                id="voice-interim"
                className="rounded-xl border border-dashed border-primary/25 bg-primary/[0.04] px-4 py-2.5 text-sm italic leading-relaxed text-muted-foreground"
                aria-live="polite"
              >
                <span className="mr-1 font-semibold not-italic uppercase tracking-[0.14em] text-[0.65rem] text-primary/80">
                  Hearing
                </span>
                “{interimText}…”
              </p>
            ) : null}

            {voiceError ? (
              <p
                className="rounded-xl border border-border/70 bg-muted/25 px-4 py-2.5 text-sm leading-relaxed text-muted-foreground"
                role="status"
              >
                {voiceError}
              </p>
            ) : null}
          </div>

          {/* Voice control panel */}
          <div className="rounded-2xl border border-border/55 bg-card/90 px-5 py-5 shadow-[0_1px_2px_rgb(15_23_42_/0.03)] sm:px-6 sm:py-6">
            <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center sm:gap-6">
              <div className="flex items-center gap-4">
                <div className="relative">
                  {listening ? (
                    <span
                      className="absolute inset-0 -m-2 rounded-full border border-primary/25 motion-safe:animate-pulse"
                      aria-hidden
                    />
                  ) : null}
                  <button
                    type="button"
                    disabled={blockInput || (!voiceSupported && !listening)}
                    onClick={() => (listening ? handleStop() : void handleStart())}
                    className={cn(
                      "flex size-16 items-center justify-center rounded-full border-2 shadow-clarity-soft transition",
                      listening
                        ? "border-destructive/45 bg-destructive/[0.06] text-destructive hover:bg-destructive/10"
                        : voiceSupported
                          ? "border-primary/40 bg-card text-primary hover:border-primary/60 hover:bg-accent/60"
                          : "border-border/60 bg-muted/30 text-muted-foreground opacity-70",
                      (blockInput || (!voiceSupported && !listening)) && "cursor-not-allowed opacity-70"
                    )}
                    aria-pressed={listening}
                    aria-label={micButtonLabel}
                  >
                    {status === "requesting-permission" || transcribing ? (
                      <Loader2 className="size-7 animate-spin" strokeWidth={1.75} />
                    ) : listening ? (
                      <Square className="size-6 fill-current" />
                    ) : (
                      <Mic className="size-7" strokeWidth={1.75} />
                    )}
                  </button>
                </div>

                {listening ? (
                  <div className="flex h-8 items-end gap-1" aria-hidden>
                    {[4, 7, 5, 8, 6, 9, 5, 7, 6].map((h, i) => (
                      <span
                        key={i}
                        className="w-[3px] rounded-full bg-primary/55 motion-safe:animate-pulse"
                        style={{
                          height: `${h * 2}px`,
                          animationDelay: `${i * 0.09}s`,
                        }}
                      />
                    ))}
                  </div>
                ) : null}
              </div>

              <div className="min-w-0 flex-1 space-y-1.5">
                <p className="font-heading text-[0.9375rem] font-semibold text-foreground">
                  {listening
                    ? "Listening — speak naturally, stop whenever"
                    : transcribing
                      ? "Transcribing your clip…"
                      : voiceSupported
                        ? "Prefer to talk it out?"
                        : "Voice input not available here"}
                </p>
                <p className="text-[0.8125rem] leading-relaxed text-muted-foreground">
                  {listening ? (
                    <>
                      <span className="font-medium tabular-nums text-foreground">
                        {formatMmSs(elapsedSec)}
                      </span>{" "}
                      / {formatMmSs(maxCapSec)} · tap the red square to stop whenever you’re done.
                    </>
                  ) : transcribing ? (
                    "We’re turning your clip into text. You’ll be able to edit every word in the box above."
                  ) : voiceSupported ? (
                    "Your speech gets transcribed straight into the box above — same pipeline as typing. Stop whenever you’re ready."
                  ) : (
                    "Your browser doesn’t expose microphone transcription. Typing works end-to-end the same way."
                  )}
                </p>
                {engineLabel && !listening && !transcribing ? (
                  <p className="text-[0.6875rem] uppercase tracking-[0.16em] text-muted-foreground/85">
                    {engineLabel}
                  </p>
                ) : null}
              </div>

              {!listening && !transcribing ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={blockInput}
                  className="shrink-0 text-muted-foreground"
                  onClick={() =>
                    onChange({
                      ...value,
                      voice: { status: "skipped" },
                    })
                  }
                >
                  Skip voice
                </Button>
              ) : null}
            </div>
          </div>

          <div className="space-y-4">
            <p className="text-center text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground sm:text-left">
              Optional — nudge the tone if something fits
            </p>
            <div className="flex flex-wrap justify-center gap-2.5 sm:justify-start">
              {LIFE_STRESS_TAG_OPTIONS.map((chip) => {
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

          <p className="text-center text-xs leading-relaxed text-muted-foreground/90 sm:text-left">
            If your words suggest you might be in danger, we may show crisis resources in the header.
            That check stays on your device — it is not a clinical read and not sent for scoring.
          </p>
        </div>
      </div>
    </div>
  );
});
