/**
 * POST `/api/clarity/transcribe` — Whisper fallback for brain-dump voice when Web Speech API is unavailable.
 * Multipart `audio` field; never persists audio on disk in this handler.
 */
import { getOpenAiApiKey } from "@/lib/env";

export const runtime = "nodejs";

const MAX_BYTES = 25 * 1024 * 1024;

/**
 * Brain-dump voice fallback: server-side speech-to-text via OpenAI Whisper.
 * Only used when the browser does not support Web Speech API natively.
 * Accepts `multipart/form-data` with an `audio` file (webm/mp4/wav/m4a/ogg).
 *
 * Returns `{ text }` on success, or a short error message.
 *
 * NOTE: audio is passed straight through to OpenAI and never persisted here.
 */
export async function POST(req: Request): Promise<Response> {
  const key = getOpenAiApiKey();
  if (!key) {
    return Response.json(
      {
        error:
          "Voice-to-text fallback is not configured on this server. You can keep typing — it works the same.",
      },
      { status: 503 }
    );
  }

  let incoming: FormData;
  try {
    incoming = await req.formData();
  } catch {
    return Response.json({ error: "Expected multipart/form-data." }, { status: 400 });
  }

  const file = incoming.get("audio");
  if (!(file instanceof File)) {
    return Response.json({ error: "Missing 'audio' file." }, { status: 400 });
  }
  if (file.size <= 0) {
    return Response.json({ error: "Recording was empty — nothing to transcribe." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return Response.json(
      { error: "Recording is too large. Please keep voice notes under ~25 MB." },
      { status: 413 }
    );
  }

  const forwarded = new FormData();
  // Whisper API needs a filename hint; mimeType often missing on webm from Chrome.
  const filename = file.name && file.name.trim().length > 0 ? file.name : "voice-note.webm";
  forwarded.append("file", file, filename);
  forwarded.append("model", "whisper-1");
  forwarded.append("response_format", "json");
  // English bias keeps hackathon demos predictable; Whisper still handles code-switching reasonably.
  forwarded.append("language", "en");

  try {
    const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}` },
      body: forwarded,
      signal: AbortSignal.timeout(60_000),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      console.error("[clarity/transcribe] Whisper error", res.status, errText.slice(0, 400));
      return Response.json(
        {
          error:
            "We could not transcribe that clip just now. You can type your thoughts — it feeds the same screen.",
        },
        { status: 502 }
      );
    }

    const data = (await res.json()) as { text?: string };
    const text = typeof data.text === "string" ? data.text.trim() : "";
    if (!text) {
      return Response.json(
        { error: "No speech was detected in that clip. Try again in a quiet moment — or type instead." },
        { status: 200 }
      );
    }
    return Response.json({ text });
  } catch (e) {
    console.error("[clarity/transcribe] fetch failed", e);
    return Response.json(
      {
        error:
          "Voice-to-text timed out. You can still type your reflection — it uses the same pipeline.",
      },
      { status: 504 }
    );
  }
}
