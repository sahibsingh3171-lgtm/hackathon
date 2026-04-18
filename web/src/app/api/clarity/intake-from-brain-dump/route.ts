/**
 * POST `/api/clarity/intake-from-brain-dump` — maps free-text brain dump onto existing intake fields and
 * returns which wizard step ids still need confirmation (`stillNeededStepIds` / `prefilledStepIds`).
 */
import { finalizeBrainDumpCanonical } from "@/lib/ai/intake-extraction-canonical";
import {
  type FullExtractionResult,
  INTAKE_EXTRACTION_SYSTEM,
  buildIntakeExtractionUserPayload,
  buildMockIntakeFromBrainDump,
  deriveInferredStepIdsFromPatch,
  derivePrefilledStepIdsFromPatch,
  fallbackStillNeededStepIds,
  mergeIntakeFromExtraction,
  normalizeFullExtraction,
  refineInferredStepIds,
} from "@/lib/ai/intake-extraction";
import { getOpenAiApiKey } from "@/lib/env";
import type { BrainDump, IntakeAnswers } from "@/types/clarity";

export const runtime = "nodejs";

type Body = {
  brainDump?: BrainDump | null;
  intake?: IntakeAnswers;
};

/** Canonical extraction response: `stillNeededStepIds` and `prefilledStepIds` are server-finalized. */
function buildExtractionResponse(
  existing: IntakeAnswers,
  brainDumpText: string,
  themeChipIds: readonly string[],
  rawModel: FullExtractionResult,
  usedMock: boolean
) {
  const canonical = finalizeBrainDumpCanonical({
    existing,
    model: rawModel,
    brainDumpText,
    themeChipIds,
  });

  const merged = mergeIntakeFromExtraction(existing, canonical.intakePatch);
  let stillNeeded = canonical.stillNeededStepIds;
  if (stillNeeded.length === 0) {
    stillNeeded = fallbackStillNeededStepIds(merged, canonical.fieldConfidence);
  }

  let claimed =
    canonical.inferredStepIds.length > 0
      ? canonical.inferredStepIds
      : deriveInferredStepIdsFromPatch(existing, canonical.intakePatch);
  claimed = refineInferredStepIds(existing, canonical.intakePatch, claimed);
  const reviewIds = claimed.length ? claimed : stillNeeded;

  const prefilledStepIds = derivePrefilledStepIdsFromPatch(canonical.intakePatch);

  return {
    intakePatch: canonical.intakePatch,
    stillNeededStepIds: stillNeeded,
    prefilledStepIds,
    /** @deprecated Prefer `prefilledStepIds` — kept for older clients. */
    inferredStepIds: reviewIds,
    fieldConfidence: canonical.fieldConfidence,
    emotionalSignals: canonical.emotionalSignals,
    reasoningSummary: canonical.reasoningSummary,
    trustLine: canonical.trustLine,
    answeredStepIds: canonical.answeredStepIds,
    usedMock,
  };
}

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
    return Response.json(buildExtractionResponse(existing, text, themes, mock, true));
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
        temperature: 0.38,
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
      return Response.json(buildExtractionResponse(existing, text, themes, mock, true));
    }

    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      const mock = buildMockIntakeFromBrainDump(text, themes);
      return Response.json(buildExtractionResponse(existing, text, themes, mock, true));
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(content) as unknown;
    } catch {
      const mock = buildMockIntakeFromBrainDump(text, themes);
      return Response.json(buildExtractionResponse(existing, text, themes, mock, true));
    }

    let full = normalizeFullExtraction(parsed);
    const mergedEarly = mergeIntakeFromExtraction(existing, full.intakePatch);
    if (full.stillNeededStepIds.length === 0) {
      full = {
        ...full,
        stillNeededStepIds: fallbackStillNeededStepIds(mergedEarly, full.fieldConfidence),
      };
    }

    return Response.json(buildExtractionResponse(existing, text, themes, full, false));
  } catch (e) {
    console.error("[clarity/intake-from-brain-dump]", e);
    const mock = buildMockIntakeFromBrainDump(text, themes);
    return Response.json(buildExtractionResponse(existing, text, themes, mock, true));
  }
}
