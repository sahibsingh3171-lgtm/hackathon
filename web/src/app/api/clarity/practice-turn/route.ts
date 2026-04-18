/**
 * POST `/api/clarity/practice-turn` — one turn of the bounded “practice rehearsal” chat; crisis text check
 * before model; JSON in/out; mock path when no API key.
 */
import { buildPracticeTurnMock } from "@/lib/ai/practice-session-mock";
import {
  buildPracticeTurnUserPayload,
  PRACTICE_SESSION_SYSTEM,
} from "@/lib/ai/practice-session-prompts";
import { evaluateCrisisText } from "@/lib/clarity/crisis-heuristics";
import { getOpenAiApiKey } from "@/lib/env";
import type {
  PracticeSessionSummary,
  PracticeTurnApiRequestBody,
  PracticeTurnApiResponseBody,
} from "@/types/clarity";

export const runtime = "nodejs";

const CRISIS_WRAP: PracticeSessionSummary = {
  communicatedClearly:
    "You shared something heavy. Pausing the rehearsal is the right move right now.",
  themes: [
    "What you named sounded serious and deserves a real human, not a practice screen.",
  ],
  bringToTherapist: [
    "If you are in the U.S., you can reach 988 by call or text for free, confidential support now.",
    "If you are outside the U.S., please contact your local emergency number or a local crisis line.",
    "When you are safer, a licensed clinician can help you map out a real plan.",
  ],
  closingLine:
    "Clarity cannot monitor safety or replace crisis care. You deserve a trained person beside you tonight.",
  generatedAt: new Date().toISOString(),
};

function crisisHaltResponse(reason: string): PracticeTurnApiResponseBody {
  return {
    question: "",
    summary: CRISIS_WRAP,
    usedMock: true,
    crisisHalt: true,
    crisisReason: reason,
  };
}

function validateBody(input: unknown): input is PracticeTurnApiRequestBody {
  if (!input || typeof input !== "object") return false;
  const b = input as Partial<PracticeTurnApiRequestBody>;
  if (!b.conversation || typeof b.conversation !== "object") return false;
  if (!Array.isArray(b.conversation.messages)) return false;
  if (typeof b.conversation.maxUserTurns !== "number") return false;
  if (typeof b.conversation.userTurnCount !== "number") return false;
  if (!b.context || typeof b.context !== "object") return false;
  if (b.mode !== "opening" && b.mode !== "follow_up" && b.mode !== "wrap") return false;
  return true;
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function parseSummaryObject(v: unknown): PracticeSessionSummary | null {
  if (!isRecord(v)) return null;
  const clearly = typeof v.communicatedClearly === "string" ? v.communicatedClearly.trim() : "";
  const closing = typeof v.closingLine === "string" ? v.closingLine.trim() : "";
  const themes = Array.isArray(v.themes)
    ? v.themes.filter((x): x is string => typeof x === "string" && x.trim().length > 0).slice(0, 6)
    : [];
  const bring = Array.isArray(v.bringToTherapist)
    ? v.bringToTherapist
        .filter((x): x is string => typeof x === "string" && x.trim().length > 0)
        .slice(0, 6)
    : [];
  if (!clearly || themes.length === 0 || bring.length === 0 || !closing) return null;
  return {
    communicatedClearly: clearly,
    themes,
    bringToTherapist: bring,
    closingLine: closing,
    generatedAt: new Date().toISOString(),
  };
}

function parseModelJson(raw: string, mode: PracticeTurnApiRequestBody["mode"]): Partial<PracticeTurnApiResponseBody> | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!isRecord(parsed)) return null;

  if (mode === "wrap") {
    const summary = parseSummaryObject(parsed.summary);
    if (!summary) return null;
    return { question: "", summary };
  }

  const q = typeof parsed.question === "string" ? parsed.question.trim() : "";
  if (!q) return null;
  const reflection = typeof parsed.reflection === "string" ? parsed.reflection.trim() : undefined;
  const followUpHint = typeof parsed.followUpHint === "string" ? parsed.followUpHint.trim() : undefined;
  return {
    question: q,
    reflection: reflection || undefined,
    followUpHint: followUpHint || undefined,
  };
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!validateBody(body)) {
    return Response.json({ error: "Invalid request shape" }, { status: 400 });
  }

  // Crisis heuristic on the latest user reply + recent user messages — before model call.
  const recentUserTexts = body.conversation.messages
    .filter((m) => m.role === "user")
    .slice(-3)
    .map((m) => m.text);
  const crisisLevel = evaluateCrisisText(body.latestUserReply ?? "", ...recentUserTexts);
  if (crisisLevel === "urgent") {
    return Response.json(
      crisisHaltResponse(
        "Your words suggested you may be unsafe with yourself. Clarity is stepping back — please reach out to 988 (U.S.) or your local emergency number."
      )
    );
  }

  const key = getOpenAiApiKey();
  const payload = buildPracticeTurnUserPayload(body);

  if (!key) {
    const mock = buildPracticeTurnMock(body);
    // If elevated (but not urgent), still honor a softer nudge via mock — no crisis halt.
    return Response.json(mock);
  }

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.55,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: PRACTICE_SESSION_SYSTEM },
          { role: "user", content: JSON.stringify(payload) },
        ],
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("[clarity/practice-turn] OpenAI error", res.status, errText);
      return Response.json(buildPracticeTurnMock(body));
    }
    const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const content = data.choices?.[0]?.message?.content ?? "";
    const parsed = parseModelJson(content, body.mode);
    if (!parsed) {
      console.error("[clarity/practice-turn] Malformed model JSON — falling back to mock");
      return Response.json(buildPracticeTurnMock(body));
    }

    if (body.mode === "wrap") {
      const out: PracticeTurnApiResponseBody = {
        question: "",
        summary: parsed.summary!,
        usedMock: false,
        crisisHalt: false,
        crisisReason: null,
      };
      return Response.json(out);
    }

    const out: PracticeTurnApiResponseBody = {
      question: parsed.question ?? "",
      reflection: parsed.reflection,
      followUpHint: parsed.followUpHint,
      usedMock: false,
      crisisHalt: false,
      crisisReason: null,
    };
    return Response.json(out);
  } catch (e) {
    console.error("[clarity/practice-turn]", e);
    return Response.json(buildPracticeTurnMock(body));
  }
}
