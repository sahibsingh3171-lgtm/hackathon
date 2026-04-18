import type { ClaritySession } from "@/types/clarity";

const MIN_BRAIN_DUMP = 8;

export function isBrainDumpLongEnough(text: string): boolean {
  return text.trim().length >= MIN_BRAIN_DUMP;
}

export function hasLifestyleSnapshot(session: ClaritySession): boolean {
  return session.lifestyle != null;
}

export function hasSummary(session: ClaritySession): boolean {
  return session.summary != null;
}
