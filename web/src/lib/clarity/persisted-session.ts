import type { ClaritySession } from "@/types/clarity";

import { clearSession, loadSession, saveSession } from "./session";

/**
 * Narrow persistence port for `ClaritySession`.
 * Today: `sessionStorage` in the browser. Later: swap for Convex, REST, or offline sync
 * without changing the React context API.
 */
export type ClaritySessionPersistence = {
  load(): ClaritySession | null;
  save(session: ClaritySession): void;
  clear(): void;
};

/** Default hackathon implementation — JSON in `sessionStorage` under `CLARITY_STORAGE_KEY`. */
export const claritySessionPersistence: ClaritySessionPersistence = {
  load: loadSession,
  save: saveSession,
  clear: clearSession,
};
