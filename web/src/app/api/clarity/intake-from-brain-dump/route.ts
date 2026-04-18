import {
  INTAKE_EXTRACTION_SYSTEM,
  buildIntakeExtractionUserPayload,
  buildMockIntakeFromBrainDump,
  deriveInferredStepIdsFromPatch,
  normalizeExtractionParsed,
  refineInferredStepIds,
} from "@/lib/ai/intake-extraction";
import { getOpenAiApiKey } from "@/lib/env";
import type { BrainDump, IntakeAnswers } from "@/types/clarity";

export const runtime = "nodejs";

type Body = {
  brainDump?: BrainDump | null;
  intake?: IntakeAnswers;
};

export async function POST(req: Request) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const text = typeof body.brainDump?.text === "string" ? body.brainDump.text.trim() : "";
  if (text.length < 8) {
    return Response.json({ error: "Brain dump text too short" }, { status: 400 });
  }

  const themes = Array.isArray(body.brainDump?.themes)
    ? body.brainDump!.themes!.filter((t): t is string => typeof t === "string")
    : [];

  const existing = body.intake && typeof body.intake === "object" ? body.intake : {};

  const key = getOpenAiApiKey();
  if (!key) {
    const mock = buildMockIntakeFromBrainDump(text, themes);
    const inferred = refineInferredStepIds(existing, mock.intakePatch, mock.inferredStepIds);
    return Response.json({
      intakePatch: mock.intakePatch,
      inferredStepIds: inferred,
      usedMock: true,
    });
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
        temperature: 0.25,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: INTAKE_EXTRACTION_SYSTEM },
          {
            role: "user",
            content: buildIntakeExtractionUserPayload(text, themes),
          },
        ],
      }),
    });

    if (!res.ok) {
      const mock = buildMockIntakeFromBrainDump(text, themes);
      const inferred = refineInferredStepIds(existing, mock.intakePatch, mock.inferredStepIds);
      return Response.json({
        intakePatch: mock.intakePatch,
        inferredStepIds: inferred,
        usedMock: true,
      });
    }

    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      const mock = buildMockIntakeFromBrainDump(text, themes);
      const inferred = refineInferredStepIds(existing, mock.intakePatch, mock.inferredStepIds);
      return Response.json({
        intakePatch: mock.intakePatch,
        inferredStepIds: inferred,
        usedMock: true,
      });
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(content) as unknown;
    } catch {
      const mock = buildMockIntakeFromBrainDump(text, themes);
      const inferred = refineInferredStepIds(existing, mock.intakePatch, mock.inferredStepIds);
      return Response.json({
        intakePatch: mock.intakePatch,
        inferredStepIds: inferred,
        usedMock: true,
      });
    }

    const normalized = normalizeExtractionParsed(parsed);
    let claimed =
      normalized.inferredStepIds.length > 0
        ? normalized.inferredStepIds
        : deriveInferredStepIdsFromPatch(existing, normalized.intakePatch);
    claimed = refineInferredStepIds(existing, normalized.intakePatch, claimed);

    return Response.json({
      intakePatch: normalized.intakePatch,
      inferredStepIds: claimed,
      usedMock: false,
    });
  } catch (e) {
    console.error("[clarity/intake-from-brain-dump]", e);
    const mock = buildMockIntakeFromBrainDump(text, themes);
    const inferred = refineInferredStepIds(existing, mock.intakePatch, mock.inferredStepIds);
    return Response.json({
      intakePatch: mock.intakePatch,
      inferredStepIds: inferred,
      usedMock: true,
    });
  }
}
