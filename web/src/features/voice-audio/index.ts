"use client";

/**
 * Voice / audio — **single entry** for the dictation hook and its types.
 * Server + UI file paths: see `README.md` in this folder.
 */
export type {
  UseVoiceDictationOptions,
  UseVoiceDictationResult,
  VoiceDictationEngine,
  VoiceDictationStatus,
} from "@/hooks/use-voice-dictation";
export { useVoiceDictation } from "@/hooks/use-voice-dictation";
