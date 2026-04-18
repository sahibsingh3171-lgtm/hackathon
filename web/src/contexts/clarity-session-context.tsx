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

import { evaluateSessionCrisisLevel } from "@/lib/clarity/crisis-heuristics";
import {
  clearSession,
  createDefaultSession,
  loadSession,
  saveSession,
} from "@/lib/clarity/session";
import type { ClaritySession, CrisisLevel } from "@/types/clarity";

const CRISIS_DISMISS_PREFIX = "clarity_crisis_dismissed_";

type Update = Partial<ClaritySession> | ((prev: ClaritySession) => ClaritySession);

type ClarityContextValue = {
  session: ClaritySession;
  setSession: (u: Update) => void;
  resetFlow: () => void;
  hydrated: boolean;
  crisisLevel: CrisisLevel;
  crisisBannerVisible: boolean;
  dismissCrisisBanner: () => void;
};

const ClarityContext = createContext<ClarityContextValue | null>(null);

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

export function ClaritySessionProvider({ children }: { children: ReactNode }) {
  const [session, setSessionState] = useState<ClaritySession>(createDefaultSession);
  const [hydrated, setHydrated] = useState(false);
  const [crisisDismissed, setCrisisDismissed] = useState(false);

  useEffect(() => {
    const saved = loadSession();
    const dismissed =
      typeof window !== "undefined" &&
      sessionStorage.getItem(`${CRISIS_DISMISS_PREFIX}${saved?.id ?? "none"}`) === "1";
    startTransition(() => {
      if (saved) setSessionState(saved);
      setCrisisDismissed(dismissed);
      setHydrated(true);
    });
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    saveSession(session);
  }, [session, hydrated]);

  const crisisLevel = useMemo((): CrisisLevel => {
    return evaluateSessionCrisisLevel(
      session.intake,
      collectIntakeText(session.intake),
      session.brainDump?.text
    );
  }, [session.intake, session.brainDump?.text]);

  const crisisBannerVisible =
    crisisLevel !== "none" && !crisisDismissed;

  const dismissCrisisBanner = useCallback(() => {
    setCrisisDismissed(true);
    if (typeof window !== "undefined") {
      sessionStorage.setItem(`${CRISIS_DISMISS_PREFIX}${session.id}`, "1");
    }
  }, [session.id]);

  const setSession = useCallback((u: Update) => {
    setSessionState((prev) => {
      const next = typeof u === "function" ? u(prev) : { ...prev, ...u };
      return { ...next, updatedAt: new Date().toISOString() };
    });
  }, []);

  const resetFlow = useCallback(() => {
    clearSession();
    const fresh = createDefaultSession();
    setSessionState(fresh);
    setCrisisDismissed(false);
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
    }),
    [
      session,
      setSession,
      resetFlow,
      hydrated,
      crisisLevel,
      crisisBannerVisible,
      dismissCrisisBanner,
    ]
  );

  return <ClarityContext.Provider value={value}>{children}</ClarityContext.Provider>;
}

export function useClaritySession(): ClarityContextValue {
  const ctx = useContext(ClarityContext);
  if (!ctx) {
    throw new Error("useClaritySession must be used within ClaritySessionProvider");
  }
  return ctx;
}
