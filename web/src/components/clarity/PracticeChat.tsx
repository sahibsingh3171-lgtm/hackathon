"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  BookmarkPlus,
  Check,
  Loader2,
  Mic,
  RotateCcw,
  Send,
  ShieldAlert,
  Sparkles,
  Square,
} from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useClaritySession } from "@/contexts/clarity-session-context";
import { useVoiceDictation } from "@/hooks/use-voice-dictation";
import {
  buildPracticeContext,
  createMessage,
  createPracticeConversation,
  DEFAULT_PRACTICE_MAX_USER_TURNS,
} from "@/lib/clarity/practice-conversation";
import { cn } from "@/lib/utils";
import type {
  ClaritySession,
  PracticeConversationState,
  PracticeTurnApiRequestBody,
  PracticeTurnApiResponseBody,
  PracticeTurnMessage,
} from "@/types/clarity";

const TURN_CAP_MS = 5 * 60 * 1000;

function appendTranscript(existing: string, chunk: string): string {
  const addition = chunk.trim();
  if (!addition) return existing;
  if (!existing.trim()) return addition;
  const sep = /[.!?…]\s*$/.test(existing) ? " " : " ";
  return `${existing}${sep}${addition}`;
}

function buildContextFromSession(session: ClaritySession) {
  return buildPracticeContext(session);
}

async function postPracticeTurn(
  body: PracticeTurnApiRequestBody
): Promise<PracticeTurnApiResponseBody> {
  const res = await fetch("/api/clarity/practice-turn", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`practice-turn failed (${res.status})`);
  }
  return (await res.json()) as PracticeTurnApiResponseBody;
}

/** Find the last assistant (non-summary) message — used to anchor the active "live" card. */
function lastAssistantQuestion(messages: PracticeTurnMessage[]): PracticeTurnMessage | null {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === "assistant") return messages[i];
  }
  return null;
}

interface PracticeChatProps {
  /** Extra controls rendered inline in the end-state — e.g. "Continue to prep sheet". */
  afterEndAside?: React.ReactNode;
}

export function PracticeChat({ afterEndAside }: PracticeChatProps) {
  const { session, setSession } = useClaritySession();
  const conversation = session.practiceConversation;

  const [draft, setDraft] = useState("");
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedToPrep, setSavedToPrep] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const onVoiceFinal = useCallback((chunk: string) => {
    setDraft((prev) => appendTranscript(prev, chunk));
  }, []);

  const voice = useVoiceDictation({ onFinalText: onVoiceFinal, maxDurationMs: TURN_CAP_MS });
  const {
    listening: voiceListening,
    start: startVoice,
    stop: stopVoice,
    supported: voiceSupported,
    interimText: voiceInterim,
    error: voiceError,
    status: voiceStatus,
  } = voice;

  const setConversation = useCallback(
    (updater: (prev: PracticeConversationState | null) => PracticeConversationState | null) => {
      setSession((prev) => ({
        ...prev,
        practiceConversation: updater(prev.practiceConversation ?? null),
      }));
    },
    [setSession]
  );

  const askOpening = useCallback(
    async (conv: PracticeConversationState) => {
      setWorking(true);
      setError(null);
      try {
        const res = await postPracticeTurn({
          conversation: {
            id: conv.id,
            maxUserTurns: conv.maxUserTurns,
            userTurnCount: conv.userTurnCount,
            messages: conv.messages,
            phase: conv.phase,
          },
          context: buildContextFromSession(session),
          mode: "opening",
        });
        if (res.crisisHalt && res.summary) {
          setConversation((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              phase: "crisis_halt",
              crisisTripped: true,
              summary: res.summary ?? null,
              updatedAt: new Date().toISOString(),
            };
          });
          return;
        }
        const assistantMsg = createMessage(
          "assistant",
          res.reflection ? `${res.reflection}\n\n${res.question}` : res.question
        );
        setConversation((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            phase: "in_progress",
            messages: [...prev.messages, assistantMsg],
            updatedAt: new Date().toISOString(),
          };
        });
      } catch (e) {
        console.error(e);
        setError("We couldn't reach the rehearsal guide. Try again in a moment.");
      } finally {
        setWorking(false);
      }
    },
    [session, setConversation]
  );

  // Scroll to bottom whenever messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [conversation?.messages.length, conversation?.phase]);

  const handleStart = useCallback(async () => {
    // Seed a fresh conversation, then fetch the opener.
    const fresh = createPracticeConversation(DEFAULT_PRACTICE_MAX_USER_TURNS);
    setSession((prev) => ({ ...prev, practiceConversation: fresh }));
    setSavedToPrep(false);
    setDraft("");
    await askOpening(fresh);
  }, [askOpening, setSession]);

  const submitUserReply = useCallback(async () => {
    if (!conversation) return;
    const text = draft.trim();
    if (!text) return;
    if (working) return;

    // Stop voice if mid-dictation so we never double-submit.
    if (voiceListening) stopVoice();

    const userMsg = createMessage("user", text, voiceListening ? "voice" : "typed");
    const nextUserTurnCount = conversation.userTurnCount + 1;
    const willWrap = nextUserTurnCount >= conversation.maxUserTurns;

    const optimistic: PracticeConversationState = {
      ...conversation,
      messages: [...conversation.messages, userMsg],
      userTurnCount: nextUserTurnCount,
      phase: willWrap ? "wrapping" : "in_progress",
      updatedAt: new Date().toISOString(),
    };
    setConversation(() => optimistic);
    setDraft("");
    setWorking(true);
    setError(null);

    try {
      const res = await postPracticeTurn({
        conversation: {
          id: optimistic.id,
          maxUserTurns: optimistic.maxUserTurns,
          userTurnCount: optimistic.userTurnCount,
          messages: optimistic.messages,
          phase: optimistic.phase,
        },
        context: buildContextFromSession(session),
        latestUserReply: text,
        mode: willWrap ? "wrap" : "follow_up",
      });

      if (res.crisisHalt) {
        setConversation((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            phase: "crisis_halt",
            crisisTripped: true,
            summary: res.summary ?? null,
            updatedAt: new Date().toISOString(),
          };
        });
        return;
      }

      if (willWrap) {
        setConversation((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            phase: "complete",
            summary: res.summary ?? null,
            updatedAt: new Date().toISOString(),
          };
        });
        return;
      }

      const assistantMsg = createMessage(
        "assistant",
        res.reflection ? `${res.reflection}\n\n${res.question}` : res.question
      );
      setConversation((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          messages: [...prev.messages, assistantMsg],
          updatedAt: new Date().toISOString(),
        };
      });
    } catch (e) {
      console.error(e);
      setError("We couldn't reach the rehearsal guide. Try sending that again.");
      // Roll the user message back — the user can edit and retry.
      setConversation((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          messages: prev.messages.slice(0, -1),
          userTurnCount: Math.max(0, prev.userTurnCount - 1),
          phase: "in_progress",
          updatedAt: new Date().toISOString(),
        };
      });
      setDraft(text);
    } finally {
      setWorking(false);
    }
  }, [conversation, draft, session, setConversation, stopVoice, voiceListening, working]);

  const endEarly = useCallback(async () => {
    if (!conversation) return;
    if (voiceListening) stopVoice();
    const optimistic: PracticeConversationState = {
      ...conversation,
      phase: "wrapping",
      updatedAt: new Date().toISOString(),
    };
    setConversation(() => optimistic);
    setWorking(true);
    setError(null);
    try {
      const res = await postPracticeTurn({
        conversation: {
          id: optimistic.id,
          maxUserTurns: optimistic.maxUserTurns,
          userTurnCount: optimistic.userTurnCount,
          messages: optimistic.messages,
          phase: optimistic.phase,
        },
        context: buildContextFromSession(session),
        mode: "wrap",
      });
      setConversation((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          phase: "complete",
          summary: res.summary ?? null,
          updatedAt: new Date().toISOString(),
        };
      });
    } catch (e) {
      console.error(e);
      setError("Couldn't generate the wrap — you can try again or restart.");
      setConversation((prev) => {
        if (!prev) return prev;
        return { ...prev, phase: "in_progress", updatedAt: new Date().toISOString() };
      });
    } finally {
      setWorking(false);
    }
  }, [conversation, session, setConversation, stopVoice, voiceListening]);

  const restart = useCallback(() => {
    setSession((prev) => ({ ...prev, practiceConversation: null }));
    setSavedToPrep(false);
    setDraft("");
    setError(null);
  }, [setSession]);

  const saveToPrep = useCallback(() => {
    if (!conversation?.summary) return;
    const s = conversation.summary;
    const formatted = [
      "— From your practice rehearsal —",
      s.communicatedClearly,
      "",
      "Themes:",
      ...s.themes.map((t) => `• ${t}`),
      "",
      "To bring to a real therapist:",
      ...s.bringToTherapist.map((t) => `• ${t}`),
    ].join("\n");

    setSession((prev) => {
      const current =
        typeof prev.intake.therapy_goals === "string" ? prev.intake.therapy_goals : "";
      const already = current.includes("From your practice rehearsal");
      return {
        ...prev,
        intake: {
          ...prev.intake,
          therapy_goals: already ? current : [current, formatted].filter(Boolean).join("\n\n"),
        },
      };
    });
    setSavedToPrep(true);
  }, [conversation?.summary, setSession]);

  const turnsUsed = conversation?.userTurnCount ?? 0;
  const turnsMax = conversation?.maxUserTurns ?? DEFAULT_PRACTICE_MAX_USER_TURNS;
  const progressPct = Math.min(100, Math.round((turnsUsed / turnsMax) * 100));

  const onKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      void submitUserReply();
    }
  };

  const currentAssistant = useMemo(
    () => (conversation ? lastAssistantQuestion(conversation.messages) : null),
    [conversation]
  );

  // ————————————————————————————————————————————————————— states ————

  // Intro state — not started yet.
  if (!conversation || conversation.phase === "intro") {
    return (
      <div className="space-y-6">
        <ChatDisclaimer />
        <div className="rounded-[1.75rem] border border-border/60 bg-card/95 px-7 py-9 shadow-clarity-card sm:px-10 sm:py-11">
          <div className="flex flex-wrap items-start gap-4">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-accent/60 text-primary ring-1 ring-primary/12">
              <Sparkles className="size-5" strokeWidth={1.75} aria-hidden />
            </span>
            <div className="min-w-0 flex-1 space-y-4">
              <h3 className="font-heading text-xl font-semibold tracking-tight text-foreground sm:text-[1.5rem]">
                Try a short, interactive rehearsal
              </h3>
              <p className="text-pretty text-[0.9375rem] leading-relaxed text-muted-foreground">
                I&apos;ll ask you a few first-session-style questions — one at a time. You can type or
                speak your answers. This is practice, not therapy, and it ends after{" "}
                {DEFAULT_PRACTICE_MAX_USER_TURNS} turns with a short reflection you can keep.
              </p>
              <ul className="grid gap-2.5 text-sm text-muted-foreground sm:grid-cols-2">
                <li className="flex items-start gap-2">
                  <Check className="mt-1 size-4 shrink-0 text-primary" strokeWidth={2} aria-hidden />
                  You control the pace and can stop any time.
                </li>
                <li className="flex items-start gap-2">
                  <Check className="mt-1 size-4 shrink-0 text-primary" strokeWidth={2} aria-hidden />
                  Typed or spoken answers work the same.
                </li>
                <li className="flex items-start gap-2">
                  <Check className="mt-1 size-4 shrink-0 text-primary" strokeWidth={2} aria-hidden />
                  Nothing is diagnosed. Clarity isn&apos;t your therapist.
                </li>
                <li className="flex items-start gap-2">
                  <Check className="mt-1 size-4 shrink-0 text-primary" strokeWidth={2} aria-hidden />
                  You can save the rehearsal summary to your prep notes.
                </li>
              </ul>
              <div className="pt-2">
                <Button
                  onClick={handleStart}
                  disabled={working}
                  className="h-auto rounded-2xl px-6 py-3 text-sm font-semibold shadow-clarity-soft"
                >
                  {working ? (
                    <>
                      <Loader2 className="mr-2 size-4 animate-spin" aria-hidden /> Starting rehearsal…
                    </>
                  ) : (
                    <>
                      Start the rehearsal
                      <ArrowRight className="ml-2 size-4" aria-hidden />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Crisis halt — rehearsal stopped, gentle redirection.
  if (conversation.phase === "crisis_halt") {
    return (
      <div className="space-y-6">
        <aside
          role="alert"
          className="rounded-2xl border border-red-400/30 bg-red-50/60 px-6 py-6 dark:border-red-500/30 dark:bg-red-950/30"
        >
          <div className="flex gap-4">
            <AlertTriangle
              className="mt-0.5 size-5 shrink-0 text-red-600 dark:text-red-400"
              strokeWidth={1.75}
              aria-hidden
            />
            <div className="min-w-0 space-y-3">
              <p className="text-base font-semibold text-foreground">
                Pausing the rehearsal — your words deserve a real human.
              </p>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Clarity is not a crisis service. If you are in the U.S., you can reach{" "}
                <a
                  href="tel:988"
                  className="font-semibold text-foreground underline decoration-foreground/30 underline-offset-2"
                >
                  988
                </a>{" "}
                by call or text — free and confidential. Outside the U.S., please use your local
                emergency number or crisis line.
              </p>
              {conversation.summary ? (
                <SummaryCard summary={conversation.summary} muted />
              ) : null}
              <div className="flex flex-wrap gap-3 pt-2">
                <Button variant="outline" onClick={restart} className="rounded-2xl">
                  <RotateCcw className="mr-2 size-4" aria-hidden />
                  Clear this rehearsal
                </Button>
                <Link
                  href="/matches"
                  className={cn(
                    buttonVariants({ variant: "ghost" }),
                    "rounded-2xl px-4 text-sm font-medium text-foreground/80"
                  )}
                >
                  Browse therapist matches
                </Link>
              </div>
            </div>
          </div>
        </aside>
      </div>
    );
  }

  // Complete — summary visible.
  if (conversation.phase === "complete" && conversation.summary) {
    return (
      <div className="space-y-6">
        <ChatDisclaimer subtle />
        <div className="rounded-[1.75rem] border border-primary/18 bg-gradient-to-b from-card via-card to-primary/[0.04] px-7 py-9 shadow-clarity-card sm:px-10 sm:py-11">
          <p className="clarity-kicker text-primary/90">Rehearsal reflection</p>
          <h3 className="mt-3 font-heading text-xl font-semibold tracking-tight text-foreground sm:text-[1.45rem]">
            A small, honest snapshot of what you practiced saying
          </h3>
          <SummaryCard summary={conversation.summary} />
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button
              onClick={saveToPrep}
              variant={savedToPrep ? "outline" : "default"}
              disabled={savedToPrep}
              className="rounded-2xl"
            >
              {savedToPrep ? (
                <>
                  <Check className="mr-2 size-4" aria-hidden /> Saved to prep notes
                </>
              ) : (
                <>
                  <BookmarkPlus className="mr-2 size-4" aria-hidden /> Save to prep notes
                </>
              )}
            </Button>
            <Button variant="outline" onClick={restart} className="rounded-2xl">
              <RotateCcw className="mr-2 size-4" aria-hidden />
              Start over
            </Button>
            {afterEndAside}
          </div>
          <p className="mt-5 text-xs leading-relaxed text-muted-foreground">
            This reflection is a draft for your own memory, not a clinical record. A real therapist
            will ask their own questions and will listen to you in their own way.
          </p>
        </div>

        <details className="rounded-2xl border border-border/50 bg-muted/15 px-5 py-4 text-sm text-muted-foreground">
          <summary className="cursor-pointer font-medium text-foreground">
            Show the full practice transcript
          </summary>
          <div className="mt-4 space-y-3">
            {conversation.messages.map((m) => (
              <MessageBubble key={m.id} message={m} compact />
            ))}
          </div>
        </details>
      </div>
    );
  }

  // Active chat (in_progress / wrapping).
  const wrapping = conversation.phase === "wrapping";
  const turnsRemaining = Math.max(0, turnsMax - turnsUsed);

  return (
    <div className="space-y-6">
      <ChatDisclaimer subtle />
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/50 bg-muted/10 px-5 py-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-3">
          <span className="font-medium uppercase tracking-[0.18em] text-foreground/70">
            Rehearsal
          </span>
          <span aria-hidden className="h-3 w-px bg-border" />
          <span>
            {turnsRemaining} {turnsRemaining === 1 ? "turn" : "turns"} left
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div
            className="h-1.5 w-32 overflow-hidden rounded-full bg-border/60"
            role="progressbar"
            aria-valuenow={progressPct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Rehearsal progress"
          >
            <div
              className="h-full rounded-full bg-primary/60 transition-[width] duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <button
            type="button"
            onClick={endEarly}
            disabled={working || wrapping}
            className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground underline-offset-2 hover:text-foreground hover:underline disabled:opacity-60"
          >
            End &amp; summarize
          </button>
        </div>
      </div>

      <div className="space-y-4" aria-live="polite">
        {conversation.messages.map((m) => (
          <MessageBubble
            key={m.id}
            message={m}
            highlight={currentAssistant?.id === m.id && m.role === "assistant"}
          />
        ))}
        {working && !wrapping ? <TypingBubble /> : null}
        {wrapping ? <WrappingBubble /> : null}
        <div ref={bottomRef} />
      </div>

      {error ? (
        <div
          role="alert"
          className="rounded-2xl border border-amber-500/35 bg-amber-500/[0.07] px-4 py-3 text-sm text-foreground/90"
        >
          {error}
        </div>
      ) : null}

      {conversation.phase !== "wrapping" ? (
        <div className="rounded-[1.75rem] border border-border/60 bg-card px-5 pb-5 pt-4 shadow-[0_1px_2px_rgb(15_23_42_/0.04)] sm:px-6">
          <label htmlFor="practice-reply" className="sr-only">
            Your reply
          </label>
          <Textarea
            id="practice-reply"
            ref={textareaRef}
            rows={4}
            value={voiceListening ? `${draft}${voiceInterim ? ` ${voiceInterim}` : ""}` : draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={onKey}
            disabled={working}
            placeholder={
              voiceListening
                ? "Listening — keep going at your own pace."
                : "Say what comes up in your own words — whatever that is. Ctrl/⌘ + Enter to send."
            }
            className="min-h-[7rem] resize-none border-0 bg-transparent p-0 text-[0.9375rem] leading-relaxed shadow-none focus-visible:ring-0"
          />
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-border/40 pt-3">
            <div className="flex items-center gap-2">
              {voiceSupported ? (
                voiceListening ? (
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={stopVoice}
                    className="rounded-2xl"
                    aria-label="Stop recording"
                  >
                    <Square className="mr-2 size-4" aria-hidden />
                    Stop mic
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={startVoice}
                    disabled={working || voiceStatus === "transcribing"}
                    className="rounded-2xl border-border/70"
                    aria-label="Start recording"
                  >
                    {voiceStatus === "transcribing" ? (
                      <>
                        <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
                        Transcribing…
                      </>
                    ) : (
                      <>
                        <Mic className="mr-2 size-4" aria-hidden />
                        Speak
                      </>
                    )}
                  </Button>
                )
              ) : null}
              {voiceError ? (
                <span className="text-xs text-muted-foreground">{voiceError}</span>
              ) : voiceListening ? (
                <span className="text-xs text-primary/90" aria-live="polite">
                  Listening…
                </span>
              ) : null}
            </div>
            <Button
              type="button"
              onClick={submitUserReply}
              disabled={working || !draft.trim()}
              className="rounded-2xl"
            >
              <Send className="mr-2 size-4" aria-hidden />
              Send reply
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

// ——————————————————————————————————————————————————————— Subviews ————

function ChatDisclaimer({ subtle = false }: { subtle?: boolean }) {
  return (
    <aside
      className={cn(
        "flex gap-3 rounded-2xl px-4 py-3 text-xs leading-relaxed",
        subtle
          ? "border border-border/50 bg-muted/[0.12] text-muted-foreground"
          : "border border-amber-500/25 bg-amber-500/[0.06] text-foreground/90"
      )}
    >
      <ShieldAlert
        className={cn(
          "mt-0.5 size-4 shrink-0",
          subtle ? "text-muted-foreground" : "text-amber-700/80 dark:text-amber-400/90"
        )}
        strokeWidth={1.75}
        aria-hidden
      />
      <p>
        This is a <span className="font-semibold">rehearsal, not therapy</span>. Clarity cannot
        diagnose or treat anything and is not a crisis service. If you feel unsafe, please contact{" "}
        <a
          href="tel:988"
          className="font-semibold text-foreground underline decoration-foreground/30 underline-offset-2"
        >
          988
        </a>{" "}
        or your local emergency number.
      </p>
    </aside>
  );
}

function MessageBubble({
  message,
  highlight,
  compact,
}: {
  message: PracticeTurnMessage;
  highlight?: boolean;
  compact?: boolean;
}) {
  if (message.role === "system") {
    return (
      <p className="mx-auto max-w-md text-center text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
        {message.text}
      </p>
    );
  }
  const isAssistant = message.role === "assistant";
  return (
    <div
      className={cn(
        "flex w-full",
        isAssistant ? "justify-start" : "justify-end"
      )}
    >
      <div
        className={cn(
          "max-w-[86%] rounded-[1.25rem] px-5 py-4 text-[0.9375rem] leading-relaxed shadow-[0_1px_2px_rgb(15_23_42_/0.04)] sm:max-w-[78%]",
          isAssistant
            ? "border border-border/60 bg-card text-foreground"
            : "bg-primary text-primary-foreground",
          highlight && "ring-2 ring-primary/25",
          compact && "px-4 py-3 text-sm"
        )}
      >
        {isAssistant ? (
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary/80">
            Rehearsal guide
          </p>
        ) : null}
        <div className={cn("whitespace-pre-wrap", isAssistant && "mt-1")}>{message.text}</div>
      </div>
    </div>
  );
}

function TypingBubble() {
  return (
    <div className="flex w-full justify-start">
      <div className="max-w-[86%] rounded-[1.25rem] border border-border/60 bg-card px-5 py-4 text-[0.9375rem] text-muted-foreground shadow-[0_1px_2px_rgb(15_23_42_/0.04)] sm:max-w-[78%]">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary/80">
          Rehearsal guide
        </p>
        <div className="mt-2 flex items-center gap-1.5" aria-label="thinking">
          <span className="size-1.5 animate-bounce rounded-full bg-primary/50 [animation-delay:-200ms]" />
          <span className="size-1.5 animate-bounce rounded-full bg-primary/50 [animation-delay:-100ms]" />
          <span className="size-1.5 animate-bounce rounded-full bg-primary/50" />
        </div>
      </div>
    </div>
  );
}

function WrappingBubble() {
  return (
    <div className="flex w-full justify-center">
      <div className="inline-flex items-center gap-2 rounded-full border border-border/50 bg-muted/15 px-4 py-2 text-xs text-muted-foreground">
        <Loader2 className="size-3.5 animate-spin" aria-hidden />
        Gathering a short reflection from what you said…
      </div>
    </div>
  );
}

function SummaryCard({
  summary,
  muted,
}: {
  summary: NonNullable<PracticeConversationState["summary"]>;
  muted?: boolean;
}) {
  return (
    <div
      className={cn(
        "mt-6 space-y-5 rounded-2xl border px-6 py-6",
        muted
          ? "border-border/40 bg-muted/[0.12]"
          : "border-border/60 bg-card/90 shadow-[0_1px_2px_rgb(15_23_42_/0.04)]"
      )}
    >
      <p className="text-[0.95rem] leading-relaxed text-foreground">
        {summary.communicatedClearly}
      </p>

      <section>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary/85">
          Themes you raised
        </p>
        <ul className="mt-2 list-none space-y-2">
          {summary.themes.map((t, i) => (
            <li key={i} className="text-sm text-foreground/95">
              • {t}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary/85">
          To bring to a real therapist
        </p>
        <ul className="mt-2 list-none space-y-2">
          {summary.bringToTherapist.map((t, i) => (
            <li key={i} className="text-sm text-foreground/95">
              • {t}
            </li>
          ))}
        </ul>
      </section>

      <p className="text-sm italic text-muted-foreground">{summary.closingLine}</p>
    </div>
  );
}
