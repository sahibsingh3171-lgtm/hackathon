import { augmentReadinessAnalysisWithCrisisHeuristics } from "@/lib/ai/readiness-analysis-crisis";
import { buildReadinessAnalysisMock } from "@/lib/ai/readiness-analysis-mock";
import {
  buildReadinessAnalysisUserPayload,
  READINESS_ANALYSIS_SYSTEM,
} from "@/lib/ai/readiness-analysis-prompts";
import { parseReadinessAnalysisResponse } from "@/lib/ai/readiness-analysis.contract";
import { getOpenAiApiKey } from "@/lib/env";
import type { ReadinessAnalysisApiRequestBody, ReadinessAnalysisApiResponseBody } from "@/types/clarity";

export const runtime = "nodejs";

function sessionPayload(body: ReadinessAnalysisApiRequestBody) {
  return {
    intake: body.session.intake,
    lifestyle: body.session.lifestyle ?? null,
    brainDump: body.session.brainDump ?? null,
  };
}

export async function POST(req: Request) {
  let body: ReadinessAnalysisApiRequestBody;
  try {
    body = (await req.json()) as ReadinessAnalysisApiRequestBody;
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body?.session?.intake) {
    return Response.json({ error: "Missing session.intake" }, { status: 400 });
  }

  const payload = sessionPayload(body);
  const key = getOpenAiApiKey();

  const respond = (
    analysis: ReadinessAnalysisApiResponseBody["analysis"],
    usedMock: boolean,
    strictParseOk: boolean
  ) =>
    Response.json({
      analysis,
      usedMock,
      strictParseOk,
    } satisfies ReadinessAnalysisApiResponseBody);

  if (!key) {
    const analysis = augmentReadinessAnalysisWithCrisisHeuristics(
      payload.intake,
      payload.brainDump,
      buildReadinessAnalysisMock(payload)
    );
    return respond(analysis, true, true);
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
        temperature: 0.35,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: READINESS_ANALYSIS_SYSTEM },
          {
            role: "user",
            content: buildReadinessAnalysisUserPayload(payload),
          },
        ],
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("[clarity/readiness-analysis] OpenAI error", res.status, errText);
      const analysis = augmentReadinessAnalysisWithCrisisHeuristics(
        payload.intake,
        payload.brainDump,
        buildReadinessAnalysisMock(payload)
      );
      return respond(analysis, true, true);
    }

    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      const analysis = augmentReadinessAnalysisWithCrisisHeuristics(
        payload.intake,
        payload.brainDump,
        buildReadinessAnalysisMock(payload)
      );
      return respond(analysis, true, true);
    }

    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(content) as unknown;
    } catch {
      console.error("[clarity/readiness-analysis] Model returned non-JSON");
      const analysis = augmentReadinessAnalysisWithCrisisHeuristics(
        payload.intake,
        payload.brainDump,
        buildReadinessAnalysisMock(payload)
      );
      return respond(analysis, true, true);
    }

    const parsed = parseReadinessAnalysisResponse(parsedJson);
    if (!parsed.ok) {
      console.error("[clarity/readiness-analysis] Strict schema issues", parsed.issues);
    }

    const analysis = augmentReadinessAnalysisWithCrisisHeuristics(
      payload.intake,
      payload.brainDump,
      parsed.data
    );

    return respond(analysis, false, parsed.ok);
  } catch (e) {
    console.error("[clarity/readiness-analysis]", e);
    const analysis = augmentReadinessAnalysisWithCrisisHeuristics(
      payload.intake,
      payload.brainDump,
      buildReadinessAnalysisMock(payload)
    );
    return respond(analysis, true, true);
  }
}
