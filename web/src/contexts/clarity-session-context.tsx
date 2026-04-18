"use client";

import {
  createContext,
  startTransition,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { crisisSupportPanelState } from "@/lib/clarity/crisis-support-panel-state";
import { evaluateSessionCrisisLevel } from "@/lib/clarity/crisis-heuristics";
import { consumeDemoOneShot } from "@/lib/clarity/persisted-session";
import { createDefaultSession } from "@/lib/clarity/session";
import type { ClaritySession, CrisisLevel } from "@/types/clarity";
import type { CrisisSupportPanelVariant } from "@/lib/clarity/crisis-support-panel-state";

/*
 * -----------------------------------------------------------------------------
 * CLARITY SESSION CONTEXT (judges: global in-memory state for the whole flow)
 * -----------------------------------------------------------------------------
 * - `session` is the single source of truth: intake answers, brain dump, lifestyle,
 *   AI summary/readiness, match prefs, practice chat transcript, etc.
 * - Navigating between Next.js pages does NOT lose state — this provider wraps the app.
 * - Refresh intentionally starts fresh (see `lib/clarity/session.ts` load/save no-ops), except
 *   a one-shot demo payload from `consumeDemoOneShot()` in `persisted-session.ts`.
 * - Crisis UI: `crisisLevel` from keyword heuristics + intake PHQ-inspired item 9; banner vs
 *   summary panel coordinated here; dismiss flags use sessionStorage keys (not full session).
 * -----------------------------------------------------------------------------
 */

const CRISIS_DISMISS_PREFIX = "clarity_crisis_dismissed_";
const CRISIS_PANEL_DISMISS_PREFIX = "clarity_crisis_panel_dismissed_";

type Update = Partial<ClaritySession> | ((prev: ClaritySession) => ClaritySession);

type ClarityContextValue = {
  session: ClaritySession;
  setSession: (u: Update) => void;
  resetFlow: () => void;
  hydrated: boolean;
  crisisLevel: CrisisLevel;
  crisisBannerVisible: boolean;
  dismissCrisisBanner: () => void;
  /** In-page results panel variant, or null when dismissed or no concern. */
  crisisSupportPanelVariant: CrisisSupportPanelVariant | null;
  dismissCrisisPanel: () => void;
  resetCrisisPanelDismiss: () => void;
};

const ClarityContext = createContext<ClarityContextValue | null>(null);

/** Pulls free-text intake fields into one blob for heuristic crisis scanning (not clinical triage). */
function collectIntakeText(intake: ClaritySession["intake"]): string {
  const parts: string[] = [];
  const push = (v: unknown) => {
    if (typeof v === "string" && v.trim()) parts.push(v);
  };
  push(intake.visit_reason);
  push(intake.therapy_goals);
  push(intake.therapist_preferences);
  return parts.join("\n");
}

/** Combined prose for `evaluateSessionCrisisLevel` — intake lines plus optional brain-dump text. */
function collectCrisisTextBlob(
  intake: ClaritySession["intake"],
  brainDumpText: string | undefined
): string {
  const a = collectIntakeText(intake);
  const b = typeof brainDumpText === "string" ? brainDumpText.trim() : "";
  if (a && b) return `${a}\n${b}`;
  return a || b;
}

/** Mounts once at app root (`AppProviders`) — every flow page reads/writes `session` through here. */
export function ClaritySessionProvider({ children }: { children: ReactNode }) {
  const [session, setSessionState] = useState<ClaritySession>(createDefaultSession);
  const [hydrated, setHydrated] = useState(false);
  const [crisisDismissed, setCrisisDismissed] = useState(false);
  const [crisisPanelDismissed, setCrisisPanelDismissed] = useState(false);

  useEffect(() => {
    /*
     * Persistence across refresh is intentionally disabled: refreshing the site
     * starts a fresh session. The one-shot demo handoff (a dedicated key,
     * written by `applyDemoSession`) is the single allowed exception and is
     * consumed + deleted here, so any subsequent refresh still starts fresh.
     */
    const demo = consumeDemoOneShot();
    startTransition(() => {
      if (demo) setSessionState(demo);
      setCrisisDismissed(false);
      setCrisisPanelDismissed(false);
      setHydrated(true);
    });
  }, []);

  const crisisLevel = useMemo((): CrisisLevel => {
    return evaluateSessionCrisisLevel(
      session.intake,
      collectCrisisTextBlob(session.intake, session.brainDump?.text)
    );
  }, [session.intake, session.brainDump?.text]);

  const crisisBannerVisible =
    crisisLevel !== "none" && !crisisDismissed;

  const crisisSupportPanelVariant = useMemo((): CrisisSupportPanelVariant | null => {
    if (crisisPanelDismissed) return null;
    return crisisSupportPanelState({
      crisisLevel,
      crisisFlag: session.readinessAnalysis?.crisisFlag,
    });
  }, [crisisLevel, crisisPanelDismissed, session.readinessAnalysis?.crisisFlag]);

  const dismissCrisisBanner = useCallback(() => {
    setCrisisDismissed(true);
    if (typeof window !== "undefined") {
      sessionStorage.setItem(`${CRISIS_DISMISS_PREFIX}${session.id}`, "1");
    }
  }, [session.id]);

  const dismissCrisisPanel = useCallback(() => {
    setCrisisPanelDismissed(true);
    if (typeof window !== "undefined") {
      sessionStorage.setItem(`${CRISIS_PANEL_DISMISS_PREFIX}${session.id}`, "1");
    }
  }, [session.id]);

  const resetCrisisPanelDismiss = useCallback(() => {
    setCrisisPanelDismissed(false);
    if (typeof window !== "undefined") {
      sessionStorage.removeItem(`${CRISIS_PANEL_DISMISS_PREFIX}${session.id}`);
    }
  }, [session.id]);

  /** Merge partial session updates or replace via updater fn; always stamps `updatedAt`. */
  const setSession = useCallback((u: Update) => {
    setSessionState((prev) => {
      const next = typeof u === "function" ? u(prev) : { ...prev, ...u };
      return { ...next, updatedAt: new Date().toISOString() };
    });
  }, []);

  /** New blank session + crisis dismiss flags — e.g. header "start over" paths. */
  const resetFlow = useCallback(() => {
    const fresh = createDefaultSession();
    setSessionState(fresh);
    setCrisisDismissed(false);
    setCrisisPanelDismissed(false);
  }, []);

  const value = useMemo(
    () => ({
      session,
      setSession,
      resetFlow,
      hydrated,
      crisisLevel,
      crisisBannerVisible,
      dismissCrisisBanner,
      crisisSupportPanelVariant,
      dismissCrisisPanel,
      resetCrisisPanelDismiss,
    }),
    [
      session,
      setSession,
      resetFlow,
      hydrated,
      crisisLevel,
      crisisBannerVisible,
      dismissCrisisBanner,
      crisisSupportPanelVariant,
      dismissCrisisPanel,
      resetCrisisPanelDismiss,
    ]
  );

  return <ClarityContext.Provider value={value}>{children}</ClarityContext.Provider>;
}

/** Hook consumed by every flow screen; throws if used outside `ClaritySessionProvider`. */
export function useClaritySession(): ClarityContextValue {
  const ctx = useContext(ClarityContext);
  if (!ctx) {
    throw new Error("useClaritySession must be used within ClaritySessionProvider");
  }
  return ctx;
}
