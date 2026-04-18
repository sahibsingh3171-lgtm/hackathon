"use client";

import type { ReactNode } from "react";

import { ClaritySessionProvider } from "@/contexts/clarity-session-context";

/** Client providers (session / local persistence). No auth in MVP. */
export function AppProviders({ children }: { children: ReactNode }) {
  return <ClaritySessionProvider>{children}</ClaritySessionProvider>;
}
