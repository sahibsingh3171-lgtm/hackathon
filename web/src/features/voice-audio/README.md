# Voice / audio — file map

| Role | Path |
|------|------|
| **Hook (Web Speech + Whisper fallback)** | `src/hooks/use-voice-dictation.ts` |
| **Server transcription (Whisper)** | `src/app/api/clarity/transcribe/route.ts` |
| **Brain dump UI** | `src/components/clarity/BrainDumpInput.tsx` |
| **Practice chat UI** | `src/components/clarity/PracticeChat.tsx` |
| **Brain dump route** | `src/app/(flow)/brain-dump/page.tsx` |

**Single import surface for the hook:** `./index.ts` → `import { useVoiceDictation } from "@/features/voice-audio"`.
