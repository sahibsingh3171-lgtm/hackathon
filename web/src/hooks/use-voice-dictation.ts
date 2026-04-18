"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Voice → text for the brain dump. Two engines, picked at runtime:
 *
 *   1. Primary — **Web Speech API** (`SpeechRecognition` / `webkitSpeechRecognition`).
 *      Streams interim + final transcripts live, on-device, no server roundtrip.
 *      Supported in Chrome, Edge, and recent Safari. Best UX.
 *
 *   2. Fallback — **MediaRecorder → `/api/clarity/transcribe` (Whisper)**.
 *      Used when the browser lacks Web Speech. Audio is recorded locally and
 *      posted only when the user stops. Final transcript arrives as one chunk.
 *
 * The hook exposes a single consistent API for both engines. Captured text is
 * delivered through `onFinalText`, which the caller uses to append to the
 * textarea — so voice behaves exactly like typing for everything downstream.
 */

export type VoiceDictationEngine = "web-speech" | "whisper-fallback" | null;
export type VoiceDictationStatus =
  | "idle"
  | "requesting-permission"
  | "listening"
  | "transcribing"
  | "error";

export interface UseVoiceDictationOptions {
  /** Called once per finalized phrase (Web Speech) or once with the full transcript (Whisper). */
  onFinalText: (text: string) => void;
  /** Optional — called when a fallback Whisper transcription kicks off. */
  onTranscribingChange?: (transcribing: boolean) => void;
  /** Hard cap — stops gracefully when reached. Defaults to 5 min. */
  maxDurationMs?: number;
  /** BCP-47 language tag for Web Speech (e.g. "en-US"). */
  language?: string;
}

export interface UseVoiceDictationResult {
  /** Best-effort engine detection. `null` until the component mounts. */
  engine: VoiceDictationEngine;
  status: VoiceDictationStatus;
  /** True while mic is actively listening (either engine). */
  listening: boolean;
  /** Seconds elapsed in the current session, updated ~every 250 ms. */
  elapsedSec: number;
  /** Best-effort live interim text from Web Speech. Empty in fallback mode. */
  interimText: string;
  /** Last user-facing error, cleared when a new session starts. */
  error: string | null;
  /** Starts listening. Resolves once actually listening (or rejects). */
  start: () => Promise<void>;
  /** Ends the session cleanly. Safe to call repeatedly. */
  stop: () => void;
  /** True if *any* transcription engine looks available in this browser. */
  supported: boolean;
}

type AnySpeechRecognition = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((e: SpeechRecognitionEventLike) => void) | null;
  onerror: ((e: { error?: string }) => void) | null;
  onend: (() => void) | null;
  onaudiostart: (() => void) | null;
};

type SpeechRecognitionEventLike = {
  results: ArrayLike<
    ArrayLike<{ transcript: string }> & { isFinal: boolean; length: number }
  > & { length: number };
  resultIndex: number;
};

function getSpeechRecognitionCtor():
  | (new () => AnySpeechRecognition)
  | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: new () => AnySpeechRecognition;
    webkitSpeechRecognition?: new () => AnySpeechRecognition;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

function hasMediaRecorder(): boolean {
  if (typeof window === "undefined") return false;
  return (
    typeof window.MediaRecorder === "function" &&
    typeof navigator !== "undefined" &&
    !!navigator.mediaDevices?.getUserMedia
  );
}

function pickBestMimeType(): string | undefined {
  if (typeof window === "undefined" || typeof window.MediaRecorder !== "function") return undefined;
  const types = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg;codecs=opus"];
  for (const t of types) {
    if (window.MediaRecorder.isTypeSupported?.(t)) return t;
  }
  return undefined;
}

function friendlyError(code: string | undefined): string {
  switch (code) {
    case "not-allowed":
    case "service-not-allowed":
      return "Microphone access was denied. You can still type — it goes through the same flow.";
    case "no-speech":
      return "We did not hear anything. Try again in a quieter moment, or type instead.";
    case "audio-capture":
      return "No microphone was found. Typing works just as well here.";
    case "network":
      return "A network hiccup interrupted voice-to-text. Try again, or keep typing.";
    case "aborted":
      return "";
    default:
      return "Voice-to-text hit a snag. You can keep typing — same downstream pipeline.";
  }
}

export function useVoiceDictation({
  onFinalText,
  onTranscribingChange,
  maxDurationMs = 5 * 60 * 1000,
  language = "en-US",
}: UseVoiceDictationOptions): UseVoiceDictationResult {
  const [engine, setEngine] = useState<VoiceDictationEngine>(null);
  const [status, setStatus] = useState<VoiceDictationStatus>("idle");
  const [elapsedSec, setElapsedSec] = useState(0);
  const [interimText, setInterimText] = useState("");
  const [error, setError] = useState<string | null>(null);

  const onFinalRef = useRef(onFinalText);
  const onTranscribingRef = useRef(onTranscribingChange);
  useEffect(() => {
    onFinalRef.current = onFinalText;
  }, [onFinalText]);
  useEffect(() => {
    onTranscribingRef.current = onTranscribingChange;
  }, [onTranscribingChange]);

  const recognitionRef = useRef<AnySpeechRecognition | null>(null);
  /** Per-recognition handle: lets us flush pending interim text on a forced stop without racing onend. */
  const recognitionFlushRef = useRef<(() => void) | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const startedAtRef = useRef<number | null>(null);
  const tickerRef = useRef<number | null>(null);
  const capTimerRef = useRef<number | null>(null);
  const stoppingRef = useRef(false);
  const manualStopRef = useRef(false);

  useEffect(() => {
    const hasWebSpeech = !!getSpeechRecognitionCtor();
    if (hasWebSpeech) setEngine("web-speech");
    else if (hasMediaRecorder()) setEngine("whisper-fallback");
    else setEngine(null);
  }, []);

  const clearTimers = useCallback(() => {
    if (tickerRef.current != null) {
      window.clearInterval(tickerRef.current);
      tickerRef.current = null;
    }
    if (capTimerRef.current != null) {
      window.clearTimeout(capTimerRef.current);
      capTimerRef.current = null;
    }
  }, []);

  const cleanupMedia = useCallback(() => {
    mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
    mediaStreamRef.current = null;
    mediaRecorderRef.current = null;
    chunksRef.current = [];
  }, []);

  /** Hard reset of all runtime refs + UI state (no callbacks). */
  const resetRuntime = useCallback(() => {
    clearTimers();
    cleanupMedia();
    recognitionRef.current = null;
    recognitionFlushRef.current = null;
    startedAtRef.current = null;
    stoppingRef.current = false;
    manualStopRef.current = false;
    setInterimText("");
    setElapsedSec(0);
  }, [clearTimers, cleanupMedia]);

  const finishWithError = useCallback(
    (message: string) => {
      resetRuntime();
      if (message) setError(message);
      setStatus("error");
    },
    [resetRuntime]
  );

  const stop = useCallback(() => {
    if (stoppingRef.current) return;
    stoppingRef.current = true;
    manualStopRef.current = true;
    clearTimers();

    const rec = recognitionRef.current;
    if (rec) {
      /*
       * Chrome's Web Speech engine in `continuous: true` mode has two quirks
       * that can make the mic feel "stuck on":
       *   1. `stop()` often waits for the next natural pause before ending.
       *      → we use `abort()`, which terminates immediately.
       *   2. After `abort()`, queued `onaudiostart` / `onresult` / `onend`
       *      events can still fire on the next microtask. `onaudiostart`
       *      *sets status back to "listening"*, which re-flips the UI to
       *      the red-square state the user just tried to exit.
       *      → we detach every handler *before* aborting so nothing the
       *        browser has queued can mutate React state.
       *
       * With handlers detached, we also don't need to wait for `onend` to
       * run cleanup — we reset synchronously, right here.
       */
      const flush = recognitionFlushRef.current;
      recognitionFlushRef.current = null;
      try {
        flush?.();
      } catch {
        /* ignore */
      }

      try { rec.onresult = null; } catch { /* ignore */ }
      try { rec.onerror = null; } catch { /* ignore */ }
      try { rec.onend = null; } catch { /* ignore */ }
      try { rec.onaudiostart = null; } catch { /* ignore */ }

      try {
        rec.abort();
      } catch {
        try {
          rec.stop();
        } catch {
          /* ignore */
        }
      }

      recognitionRef.current = null;
      resetRuntime();
      setStatus("idle");
      return;
    }

    const mr = mediaRecorderRef.current;
    if (mr && mr.state !== "inactive") {
      try {
        mr.stop();
      } catch {
        /* ignore */
      }
      return;
    }

    // Nothing was active — just clean up UI.
    resetRuntime();
    setStatus("idle");
  }, [clearTimers, resetRuntime]);

  const startTickers = useCallback(() => {
    startedAtRef.current = performance.now();
    setElapsedSec(0);

    tickerRef.current = window.setInterval(() => {
      const start = startedAtRef.current;
      if (start == null) return;
      const sec = Math.floor((performance.now() - start) / 1000);
      setElapsedSec(Math.min(Math.floor(maxDurationMs / 1000), sec));
    }, 250);

    capTimerRef.current = window.setTimeout(() => {
      stop();
    }, maxDurationMs);
  }, [maxDurationMs, stop]);

  // —— Web Speech engine ————————————————————————————————————————————————————

  const startWebSpeech = useCallback(async () => {
    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) throw new Error("speech-api-unavailable");

    const rec = new Ctor();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = language;

    let localInterim = "";

    rec.onresult = (event) => {
      let interimBuf = "";
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const res = event.results[i];
        const alt = res[0];
        const chunk = alt?.transcript ?? "";
        if (!chunk) continue;
        if (res.isFinal) {
          const trimmed = chunk.trim();
          if (trimmed.length > 0) onFinalRef.current(trimmed);
          localInterim = "";
        } else {
          interimBuf += chunk;
        }
      }
      localInterim = interimBuf;
      setInterimText(interimBuf.trim());
    };

    rec.onerror = (e) => {
      const msg = friendlyError(e?.error);
      if (msg) {
        finishWithError(msg);
      } else {
        resetRuntime();
        setStatus("idle");
      }
    };

    rec.onend = () => {
      // Flush anything still in interim — final event sometimes does not fire.
      const pending = localInterim.trim();
      if (pending.length > 0) {
        onFinalRef.current(pending);
        localInterim = "";
      }
      // Only reset if this recognition is still the active one. A manual
      // `abort()` may fire `onend` after the user has already started a new
      // session; we don't want to clobber that fresh state.
      if (recognitionRef.current === rec) {
        resetRuntime();
        setStatus("idle");
      }
    };

    rec.onaudiostart = () => {
      setStatus("listening");
    };

    recognitionRef.current = rec;
    // Expose a flush hook so a manual abort can commit the last interim buffer
    // without depending on `onend` firing (Chrome sometimes skips it on abort).
    recognitionFlushRef.current = () => {
      const pending = localInterim.trim();
      if (pending.length > 0) {
        onFinalRef.current(pending);
        localInterim = "";
      }
    };
    setStatus("requesting-permission");
    try {
      rec.start();
    } catch (e) {
      throw e instanceof Error ? e : new Error("speech-start-failed");
    }
    startTickers();
  }, [finishWithError, language, resetRuntime, startTickers]);

  // —— Whisper fallback engine ——————————————————————————————————————————————

  const sendBlobForTranscription = useCallback(async (blob: Blob) => {
    if (!blob.size) return;
    setStatus("transcribing");
    onTranscribingRef.current?.(true);
    try {
      const form = new FormData();
      const ext = blob.type.includes("mp4")
        ? "mp4"
        : blob.type.includes("ogg")
          ? "ogg"
          : "webm";
      form.append("audio", new File([blob], `voice-note.${ext}`, { type: blob.type || "audio/webm" }));

      const res = await fetch("/api/clarity/transcribe", { method: "POST", body: form });
      const data = (await res.json().catch(() => ({}))) as { text?: string; error?: string };

      if (!res.ok) {
        finishWithError(data.error ?? "Voice-to-text failed. You can keep typing — same outcome.");
        return;
      }
      const text = (data.text ?? "").trim();
      if (text) onFinalRef.current(text);
      resetRuntime();
      setStatus("idle");
    } catch {
      finishWithError("Network hiccup during voice-to-text. You can keep typing — same outcome.");
    } finally {
      onTranscribingRef.current?.(false);
    }
  }, [finishWithError, resetRuntime]);

  const startWhisperFallback = useCallback(async () => {
    if (!hasMediaRecorder()) throw new Error("media-recorder-unavailable");

    setStatus("requesting-permission");
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      throw new Error("mic-permission-denied");
    }
    mediaStreamRef.current = stream;

    const mimeType = pickBestMimeType();
    const mr = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
    chunksRef.current = [];
    mr.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
    };
    mr.onstop = () => {
      const parts = chunksRef.current;
      const blob = new Blob(parts, { type: mr.mimeType || "audio/webm" });
      // Release mic immediately; transcription runs after.
      mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
      mediaRecorderRef.current = null;
      chunksRef.current = [];
      clearTimers();
      if (!blob.size) {
        resetRuntime();
        setStatus("idle");
        return;
      }
      void sendBlobForTranscription(blob);
    };
    mr.onerror = () => finishWithError("Recording failed. You can keep typing — same outcome.");

    mediaRecorderRef.current = mr;
    mr.start(500);
    setStatus("listening");
    startTickers();
  }, [clearTimers, finishWithError, resetRuntime, sendBlobForTranscription, startTickers]);

  // —— Public API ————————————————————————————————————————————————————————————

  const start = useCallback(async () => {
    setError(null);
    setInterimText("");
    stoppingRef.current = false;
    manualStopRef.current = false;

    try {
      if (engine === "web-speech") {
        await startWebSpeech();
        return;
      }
      if (engine === "whisper-fallback" || (engine == null && hasMediaRecorder())) {
        await startWhisperFallback();
        return;
      }
      finishWithError("Voice-to-text is not available in this browser. Typing works the same.");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "unknown";
      if (msg === "mic-permission-denied") {
        finishWithError("Microphone access was denied. You can keep typing — same downstream pipeline.");
      } else if (msg === "speech-api-unavailable" || msg === "media-recorder-unavailable") {
        finishWithError("Voice-to-text is not available in this browser. Typing works the same.");
      } else {
        finishWithError("Voice-to-text could not start. You can keep typing — same outcome.");
      }
    }
  }, [engine, finishWithError, startWebSpeech, startWhisperFallback]);

  useEffect(() => {
    return () => {
      // Component unmount / page nav — make sure the mic is released.
      try {
        recognitionRef.current?.abort();
      } catch {
        /* ignore */
      }
      try {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
          mediaRecorderRef.current.stop();
        }
      } catch {
        /* ignore */
      }
      mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
      clearTimers();
    };
  }, [clearTimers]);

  const supported = engine === "web-speech" || engine === "whisper-fallback";
  const listening = status === "listening" || status === "requesting-permission";

  return {
    engine,
    status,
    listening,
    elapsedSec,
    interimText,
    error,
    start,
    stop,
    supported,
  };
}
