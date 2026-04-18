"use client";

/*
 * Client-only provider stack at the root. Today this only wraps `ClaritySessionProvider` — no React Query,
 * no auth provider. Judges: anything under here may call `useClaritySession()`.
 */
import type { ReactNode } from "react";

import { ClaritySessionProvider } from "@/contexts/clarity-session-context";

/** Root client providers (session / local persistence). No auth in MVP. */
export function AppProviders({ children }: { children: ReactNode }) {
  return <ClaritySessionProvider>{children}</ClaritySessionProvider>;
}
